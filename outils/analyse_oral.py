"""Analyse de la fluidité d'une réponse orale enregistrée (dépôt de l'atelier écrit et oral).

    python outils/analyse_oral.py <dossier du dépôt | fichier audio> [...]

Transcrit l'audio sur l'ordinateur (faster-whisper, modèle « small », rien n'est envoyé en ligne), avec
l'horodatage de chaque mot, puis mesure : débit, pauses, hésitations et tics de langage, répétitions,
longueur des phrases, dynamique du volume et variété de l'intonation. Écrit analyse-audio.md et
analyse-audio.json à côté de l'audio. Les repères sont indicatifs : ce sont des mesures, pas une écoute.

Environnement : C:\\Users\\PL\\.prepa-dgfip\\venv (faster-whisper, av 18.1, numpy).
"""
import json
import os
import re
import sys
import unicodedata

import numpy as np
from faster_whisper import WhisperModel, decode_audio

AUDIO = (".webm", ".m4a", ".mp4", ".ogg", ".opus", ".wav", ".mp3", ".aac", ".flac")
SR = 16000
# Tics et hésitations repérés dans la transcription (le prompt initial aide Whisper à les garder)
TICS = ["euh", "heu", "hum", "hmm", "ben", "bah", "du coup", "en fait", "voilà", "genre", "quoi", "enfin", "bref", "en gros", "on va dire", "tu vois", "vous voyez", "disons"]
PROMPT = "Euh, hum, alors, du coup, en fait, voilà, bon."


def norm(w):
    w = unicodedata.normalize("NFC", w.lower())
    return re.sub(r"[^\w'’-]", "", w)


def fmt(x, d=1):
    return f"{x:.{d}f}".replace(".", ",")


def transcribe(model, path):
    segs, info = model.transcribe(path, language="fr", word_timestamps=True, initial_prompt=PROMPT, vad_filter=False, beam_size=5)
    words, sents = [], []
    for s in segs:
        sents.append(s.text.strip())
        for w in s.words or []:
            if w.word.strip():
                words.append({"w": w.word.strip(), "raw": w.word, "s": float(w.start), "e": float(w.end), "p": float(w.probability)})
    return words, sents, float(info.duration)


def volume_and_pitch(path, words):
    """Volume (dB RMS) et hauteur (autocorrélation, approximative) sur les passages parlés."""
    y = decode_audio(path, sampling_rate=SR).astype(np.float32)
    hop, win = int(0.02 * SR), int(0.04 * SR)
    speech = np.zeros(len(y), bool)
    for w in words:
        speech[int(w["s"] * SR):int(w["e"] * SR)] = True
    db, f0 = [], []
    lo, hi = SR // 400, SR // 75  # 75 à 400 Hz
    for i in range(0, len(y) - win, hop):
        if not speech[i + win // 2]:
            continue
        fr = y[i:i + win]
        rms = float(np.sqrt(np.mean(fr * fr)) + 1e-9)
        db.append(20 * np.log10(rms))
        fr = fr - fr.mean()
        ac = np.correlate(fr, fr, "full")[win - 1:]
        if ac[0] <= 0:
            continue
        seg = ac[lo:hi]
        k = int(np.argmax(seg)) + lo
        if ac[k] / ac[0] > 0.45:  # trame voisée
            f0.append(SR / k)
    db = np.array(db)
    loud = db[db > (db.max() - 35)] if len(db) else db
    f0 = np.array(f0)
    semi = 12 * np.log2(f0 / np.median(f0)) if len(f0) > 20 else np.array([])
    return {
        "volume_ecart_db": float(np.std(loud)) if len(loud) else None,
        "intonation_ecart_demi_tons": float(np.std(semi)) if len(semi) else None,
        "hauteur_mediane_hz": float(np.median(f0)) if len(f0) > 20 else None,
    }


def fin_de_phrase(path, words, sents_bounds):
    """Écart moyen (dB) entre la dernière demi-seconde de chaque phrase et le reste de la phrase."""
    y = decode_audio(path, sampling_rate=SR).astype(np.float32)

    def rms_db(a, b):
        fr = y[int(a * SR):int(b * SR)]
        return 20 * np.log10(np.sqrt(np.mean(fr * fr)) + 1e-9) if len(fr) > SR // 20 else None

    drops = []
    for a, b in sents_bounds:
        if b - a < 2:
            continue
        body, end = rms_db(a, b - 0.5), rms_db(b - 0.5, b)
        if body is not None and end is not None:
            drops.append(body - end)
    return float(np.mean(drops)) if drops else None


def analyse(model, path):
    words, sents, dur = transcribe(model, path)
    if not words:
        return {"fichier": os.path.basename(path), "duree_s": dur, "erreur": "aucune parole détectée"}
    t0, t1 = words[0]["s"], words[-1]["e"]
    gaps = [(words[i]["e"], words[i + 1]["s"] - words[i]["e"]) for i in range(len(words) - 1)]
    pauses = [(t, g) for t, g in gaps if g >= 0.6]
    longues = [(t, g) for t, g in pauses if g >= 1.5]
    parole = (t1 - t0) - sum(g for _, g in pauses)
    n = len(words)
    minutes = max((t1 - t0) / 60, 1e-6)
    # Tics : mots seuls ou expressions de plusieurs mots
    toks = [norm(w["w"]) for w in words]
    texte = " " + " ".join(toks) + " "
    tics = {}
    for t in TICS:
        c = len(re.findall(r"(?<= )" + re.escape(t) + r"(?= )", texte))
        if t == "quoi":  # « quoi » compte surtout en fin d'énoncé
            c = sum(1 for i, w in enumerate(words) if toks[i] == "quoi" and (w["w"].endswith((",", ".", "?")) or i == n - 1))
        if c:
            tics[t] = c
    reps = [toks[i] for i in range(1, n) if toks[i] and toks[i] == toks[i - 1] and len(toks[i]) > 1]
    # Phrases : coupure sur la ponctuation finale de Whisper
    bounds, cur = [], None
    for w in words:
        cur = cur or w["s"]
        if re.search(r"[.?!]$", w["w"]):
            bounds.append((cur, w["e"])); cur = None
    if cur is not None:
        bounds.append((cur, words[-1]["e"]))
    longueurs = []
    k = 0
    for a, b in bounds:
        c = sum(1 for w in words if a <= w["s"] < b + 1e-6)
        longueurs.append(c)
    voix = volume_and_pitch(path, words)
    res = {
        "fichier": os.path.basename(path),
        "duree_s": round(dur, 1),
        "parole_debut_s": round(t0, 1),
        "parole_fin_s": round(t1, 1),
        "mots": n,
        "debit_mots_min": round(n / minutes, 0),
        "debit_articulatoire_mots_min": round(n / max(parole / 60, 1e-6), 0),
        "pauses": len(pauses),
        "pauses_longues": len(longues),
        "pause_max_s": round(max([g for _, g in pauses], default=0), 1),
        "silence_pct": round(100 * sum(g for _, g in pauses) / max(t1 - t0, 1e-6), 0),
        "tics": tics,
        "tics_par_min": round(sum(tics.values()) / minutes, 1),
        "repetitions": reps,
        "phrases": len(bounds),
        "mots_par_phrase": round(float(np.mean(longueurs)), 1) if longueurs else None,
        "phrase_max_mots": max(longueurs) if longueurs else None,
        "fin_de_phrase_baisse_db": None,
        **voix,
        "confiance_moyenne": round(float(np.mean([w["p"] for w in words])), 2),
    }
    res["fin_de_phrase_baisse_db"] = fin_de_phrase(path, words, bounds)
    # Transcription annotée : tics en gras (expressions de deux mots comprises), pauses entre crochets
    single = set(t for t in TICS if " " not in t)
    multi = set(t for t in TICS if t.count(" ") == 1)
    bold = [toks[i] in single for i in range(n)]
    for i in range(n - 1):
        if toks[i] + " " + toks[i + 1] in multi:
            bold[i] = bold[i + 1] = True
    out = ""
    for i, w in enumerate(words):
        raw = w["raw"]
        lead = raw[:len(raw) - len(raw.lstrip())]
        body = raw.strip()
        if body[:1] in "'’-":
            lead = ""
        if bold[i] and not (i > 0 and bold[i - 1]):
            body = "**" + body
        if bold[i] and not (i < n - 1 and bold[i + 1]):
            body = body + "**"
        out += (lead or (" " if out and body[:1] not in "'’-" else "")) + body
        if i < n - 1:
            g = words[i + 1]["s"] - w["e"]
            if g >= 0.6:
                out += f" [pause {fmt(g)} s]"
    res["transcription_annotee"] = out.strip()
    res["transcription"] = " ".join(sents)
    return res


def verdict(v, bons, moyens, sens=1):
    """sens=1 : plus c'est bas mieux c'est ; sens=0 : intervalle [bons[0], bons[1]]."""
    if v is None:
        return "—"
    if sens == 0:
        return "bien" if bons[0] <= v <= bons[1] else ("à surveiller" if moyens[0] <= v <= moyens[1] else "à travailler")
    return "bien" if v <= bons else ("à surveiller" if v <= moyens else "à travailler")


def markdown(r):
    if r.get("erreur"):
        return f"## {r['fichier']}\n\n{r['erreur']}\n"
    L = [f"## {r['fichier']}", "", f"Durée {fmt(r['duree_s'])} s · parole de {fmt(r['parole_debut_s'])} à {fmt(r['parole_fin_s'])} s · {r['mots']} mots · confiance moyenne de la reconnaissance {fmt(r['confiance_moyenne'], 2)}", "",
         "| Mesure | Valeur | Repère indicatif | Lecture |", "| --- | --- | --- | --- |"]
    L.append(f"| Débit (pauses comprises) | {r['debit_mots_min']:.0f} mots/min | 120 à 170 | {verdict(r['debit_mots_min'], (120, 170), (100, 190), 0)} |")
    L.append(f"| Débit articulatoire | {r['debit_articulatoire_mots_min']:.0f} mots/min | 150 à 210 | {verdict(r['debit_articulatoire_mots_min'], (150, 210), (130, 230), 0)} |")
    pm = r["pauses_longues"] / max((r["parole_fin_s"] - r["parole_debut_s"]) / 60, 1e-6)
    L.append(f"| Pauses ≥ 0,6 s · dont ≥ 1,5 s | {r['pauses']} · {r['pauses_longues']} (max {fmt(r['pause_max_s'])} s) | ≤ 2 longues/min | {verdict(pm, 2, 4)} |")
    L.append(f"| Part de silence | {r['silence_pct']:.0f} % | 10 à 25 % | {verdict(r['silence_pct'], (10, 25), (5, 35), 0)} |")
    tics = ", ".join(f"« {k} » × {v}" for k, v in sorted(r["tics"].items(), key=lambda x: -x[1])) or "aucun"
    L.append(f"| Tics et hésitations | {fmt(r['tics_par_min'])}/min ({tics}) | ≤ 3/min | {verdict(r['tics_par_min'], 3, 6)} |")
    L.append(f"| Répétitions immédiates | {len(r['repetitions'])}{' (' + ', '.join(r['repetitions'][:6]) + ')' if r['repetitions'] else ''} | 0 à 2 | {verdict(len(r['repetitions']), 2, 4)} |")
    L.append(f"| Longueur des phrases | {fmt(r['mots_par_phrase'] or 0)} mots en moyenne, {r['phrase_max_mots']} au plus | 12 à 25 | {verdict(r['mots_par_phrase'], (12, 25), (8, 32), 0)} |")
    if r["volume_ecart_db"] is not None:
        L.append(f"| Dynamique du volume (écart-type) | {fmt(r['volume_ecart_db'])} dB | ≥ 4 dB | {'bien' if r['volume_ecart_db'] >= 4 else ('à surveiller' if r['volume_ecart_db'] >= 3 else 'à travailler (monocorde)')} |")
    if r["fin_de_phrase_baisse_db"] is not None:
        L.append(f"| Baisse en fin de phrase | {fmt(r['fin_de_phrase_baisse_db'])} dB | ≤ 8 dB | {'bien' if r['fin_de_phrase_baisse_db'] <= 8 else ('à surveiller' if r['fin_de_phrase_baisse_db'] <= 12 else 'à travailler (voix qui tombe)')} |")
    if r["intonation_ecart_demi_tons"] is not None:
        L.append(f"| Variété de l'intonation (approx.) | {fmt(r['intonation_ecart_demi_tons'])} demi-tons | ≥ 2,5 | {'bien' if r['intonation_ecart_demi_tons'] >= 2.5 else ('à surveiller' if r['intonation_ecart_demi_tons'] >= 1.8 else 'à travailler (monotone)')} |")
    L += ["", "Transcription annotée (tics en gras, pauses entre crochets) :", "", "> " + r["transcription_annotee"], ""]
    return "\n".join(L)


def main(args):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    files = []
    for a in args:
        if os.path.isdir(a):
            files += [os.path.join(a, f) for f in sorted(os.listdir(a)) if f.lower().endswith(AUDIO)]
        elif a.lower().endswith(AUDIO):
            files.append(a)
    if not files:
        print("Aucun fichier audio."); return 1
    model = WhisperModel("small", device="cpu", compute_type="int8")
    by_dir = {}
    for f in files:
        print("Analyse de", os.path.basename(f), "…", flush=True)
        by_dir.setdefault(os.path.dirname(os.path.abspath(f)), []).append(analyse(model, f))
    for d, res in by_dir.items():
        md = "# Analyse audio : fluidité\n\nMesures calculées sur l'enregistrement (reconnaissance vocale locale). Repères indicatifs pour un oral de concours : à croiser avec l'écoute et le fond de la réponse.\n\n" + "\n".join(markdown(r) for r in res)
        with open(os.path.join(d, "analyse-audio.md"), "w", encoding="utf-8") as fh:
            fh.write(md)
        with open(os.path.join(d, "analyse-audio.json"), "w", encoding="utf-8") as fh:
            json.dump(res, fh, ensure_ascii=False, indent=2)
        print("→", os.path.join(d, "analyse-audio.md"))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
