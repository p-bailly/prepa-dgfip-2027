// Dépôts de l'atelier écrit et oral : récupérer les copies et réponses déposées, puis enregistrer leur correction.
//
//   node outils/depots.js liste                     tous les dépôts, avec leur statut
//   node outils/depots.js recuperer [id …]          télécharge les dépôts à corriger (ou ceux indiqués) dans « 08 Depots/ »
//   node outils/depots.js noter <id> <fichier.json> enregistre la correction : elle s'affiche dans l'atelier
//   (un oral déposé avec son enregistrement est analysé au passage : analyse-audio.md, débit, pauses, tics, intonation)
//
// Le fichier de correction : { "scores": { "critere": niveau, … }, "defauts": ["id", …], "commentaire": "…" }
// (niveaux 0 à 4 à l'écrit, 1 à 4 à l'oral ; la note sur 20 est calculée comme dans l'atelier).
//
// Accès : clé de compte de service Firebase (projet prepa-dgfip-2027), jamais versionnée :
//   %USERPROFILE%\.prepa-dgfip\cle-service.json, ou le chemin donné par la variable PREPA_CLE.
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), crypto = require("crypto"), { spawnSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
const D = require(path.join(ROOT, "06 Atelier Ecrit Oral", "src", "data.js"));
const C = require(path.join(ROOT, "06 Atelier Ecrit Oral", "src", "core.js"));
const OUT = path.join(ROOT, "08 Depots");
const KEY = process.env.PREPA_CLE || path.join(os.homedir(), ".prepa-dgfip", "cle-service.json");
const DOMAIN = "prepa.pbailly.fr";
// Analyse de fluidité des oraux (outils/analyse_oral.py, faster-whisper sur cet ordinateur)
const PY = process.env.PREPA_PY || path.join(os.homedir(), ".prepa-dgfip", "venv", "Scripts", "python.exe");

function die(m) { console.error(m); process.exit(1); }
function loadKey() {
  if (!fs.existsSync(KEY)) die("Clé introuvable : " + KEY + "\nCrée-la dans la console Firebase (Paramètres du projet › Comptes de service › Générer une nouvelle clé privée) et enregistre-la à cet endroit.");
  return JSON.parse(fs.readFileSync(KEY, "utf8"));
}
const sa = loadKey();
const PROJECT = sa.project_id;
const BASE = "https://firestore.googleapis.com/v1/projects/" + PROJECT + "/databases/(default)/documents";

// ---------- Jeton d'accès (JWT signé par la clé du compte de service) ----------
let token = null;
async function auth() {
  if (token && token.exp > Date.now() + 60000) return token.v;
  const b64u = o => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const head = b64u({ alg: "RS256", typ: "JWT" }), body = b64u({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/cloud-platform", aud: sa.token_uri, iat: now, exp: now + 3600 });
  const sig = crypto.createSign("RSA-SHA256").update(head + "." + body).sign(sa.private_key).toString("base64url");
  const r = await fetch(sa.token_uri, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + head + "." + body + "." + sig });
  const j = await r.json(); if (!j.access_token) die("Authentification refusée : " + JSON.stringify(j));
  token = { v: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return token.v;
}
async function api(url, opt = {}) {
  const r = await fetch(url, { ...opt, headers: { authorization: "Bearer " + await auth(), "content-type": "application/json", ...(opt.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) die("Erreur Firestore " + r.status + " : " + (j.error && j.error.message || r.statusText));
  return j;
}

// ---------- Valeurs Firestore ⇄ JSON ----------
function dec(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(dec);
  if ("mapValue" in v) return decFields(v.mapValue.fields || {});
  return null;
}
function decFields(f) { const o = {}; for (const k in f) o[k] = dec(f[k]); return o; }
function enc(x) {
  if (x === null || x === undefined) return { nullValue: null };
  if (typeof x === "string") return { stringValue: x };
  if (typeof x === "boolean") return { booleanValue: x };
  if (typeof x === "number") return Number.isInteger(x) ? { integerValue: String(x) } : { doubleValue: x };
  if (Array.isArray(x)) return { arrayValue: { values: x.map(enc) } };
  return { mapValue: { fields: encFields(x) } };
}
function encFields(o) { const f = {}; for (const k in o) if (o[k] !== undefined) f[k] = enc(o[k]); return f; }

// ---------- Lecture des dépôts ----------
async function listAll(url, key) {
  let out = [], page = "";
  do { const j = await api(url + (url.includes("?") ? "&" : "?") + "pageSize=300" + (page ? "&pageToken=" + page : "")); out = out.concat(j[key] || []); page = j.nextPageToken || ""; } while (page);
  return out;
}
async function accounts() {
  const users = await listAll(BASE + "/users?showMissing=true&mask.fieldPaths=__name__", "documents");
  const uids = users.map(d => d.name.split("/").pop());
  const names = {};
  if (uids.length) {
    const j = await api("https://identitytoolkit.googleapis.com/v1/projects/" + PROJECT + "/accounts:lookup", { method: "POST", body: JSON.stringify({ localId: uids }) });
    (j.users || []).forEach(u => { names[u.localId] = u.displayName || String(u.email || "").replace("@" + DOMAIN, ""); });
  }
  return uids.map(uid => ({ uid, nom: names[uid] || uid }));
}
async function depots() {
  const out = [];
  for (const a of await accounts()) {
    const docs = await listAll(BASE + "/users/" + a.uid + "/depots", "documents").catch(() => []);
    docs.forEach(d => out.push({ ...decFields(d.fields || {}), _uid: a.uid, _compte: a.nom, _name: d.name }));
  }
  return out.sort((x, y) => (x.createdAt || 0) - (y.createdAt || 0));
}
const fdate = t => new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const titre = d => d.kind === "ecrit" ? (d.titre || "Copie") : (d.question || "Réponse orale");
const court = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").slice(0, 6).join(" ");
const docPath = rel => rel ? path.join(ROOT, "site", rel.replace(/^\.\.\//, "").split("#")[0]) : null;

// ---------- Fiche de correction (pour Claude) ----------
function fiche(d) {
  const L = [];
  if (d.kind === "ecrit") {
    const ep = D.EP[d.ep], s = D.SUJETS.find(x => x.id === d.sujet);
    L.push("# Correction · " + ep.nom + " (" + ep.concours + ")", "");
    L.push("Dépôt " + d.id + " du " + fdate(d.createdAt) + " · compte " + d._compte + (d.used ? " · temps utilisé : " + C.dur(d.used) + " sur " + C.hm(ep.min) : ""), "");
    L.push("## Sujet", "", "**" + titre(d) + "**" + (s ? " (" + s.kind + ")" : ""));
    if (s && s.pdf) L.push("", "Sujet : `" + path.relative(ROOT, docPath(s.pdf)) + "`");
    if (s && s.corrige && s.corrige.pdf) L.push("Pour calibrer : " + s.corrige.t + " `" + path.relative(ROOT, docPath(s.corrige.pdf)) + "`");
    if (s && s.consigne) { L.push("", "Consignes :"); s.consigne.forEach((c, i) => L.push((i + 1) + ". " + c)); }
    L.push("", "## Format officiel", "");
    ep.faits.forEach(f => L.push("- " + f.t));
    L.push("", "## Grille (niveau 0 à 4 : " + D.NIVEAUX.map((n, i) => i + " " + n.toLowerCase()).join(", ") + ")", "");
    ep.grille.forEach(c => L.push("- `" + c.id + "` [" + c.part + ", " + c.w + " pt] **" + c.t + "** : " + c.d));
    L.push("", "Note sur 20 = somme des points × niveau / 4. Moyenne des candidats en 2026 : " + ep.moyenne.v + "/20 : sois aussi exigeant que le jury.");
    L.push("", "## Défauts relevés par le jury 2026", "");
    ep.defauts.forEach(x => L.push("- `" + x.id + "` " + x.t));
    L.push("", "## Copie", "", (d.files || []).map(f => "- `" + f.name + "`").join("\n") || "(aucun fichier)");
    L.push("", "## Correction à enregistrer", "", "Écris `correction.json` dans ce dossier puis : `node outils/depots.js noter " + d.id + " \"<dossier>/correction.json\"`", "");
    L.push("```json", JSON.stringify({ scores: Object.fromEntries(ep.grille.map(c => [c.id, 0])), defauts: [ep.defauts[0].id], commentaire: "Points forts : …\nAxes de progrès : …\nReformulation d'exemple : …" }, null, 2), "```");
  } else {
    const O = D.ORAL[d.prof === "C" ? "C" : "I"], q = D.Q.find(x => x.id === d.qid);
    L.push("# Correction · oral d'admission (" + O.concours + ")", "");
    L.push("Dépôt " + d.id + " du " + fdate(d.createdAt) + " · compte " + d._compte + (d.used != null ? " · temps de parole : " + C.clock(d.used) + " pour " + C.clock(d.limit || 180) : ""), "");
    L.push("## Question", "", "**" + (q ? q.q : d.question) + "**");
    if (q) { L.push("", "Points attendus (repères de préparation, non officiels) :"); q.p.forEach(x => L.push("- " + x)); }
    L.push("", "## Réponse (transcription automatique, avec de possibles erreurs de reconnaissance vocale)", "", d.trans ? d.trans : "(pas de transcription du navigateur : voir celle de analyse-audio.md si un enregistrement a été déposé)");
    if ((d.files || []).length) L.push("", "Fichiers : " + d.files.map(f => "`" + f.name + "`").join(", "));
    L.push("", "## Critères (niveau 1 à 4 : " + D.ORAL.niveaux.map((n, i) => (i + 1) + " " + n.toLowerCase()).join(", ") + ")", "");
    D.ORAL.criteres.forEach(c => L.push("- `" + c.id + "` " + c.t));
    L.push("", "## Correction à enregistrer", "", "Écris `correction.json` dans ce dossier puis : `node outils/depots.js noter " + d.id + " \"<dossier>/correction.json\"`", "");
    L.push("```json", JSON.stringify({ scores: Object.fromEntries(D.ORAL.criteres.map(c => [c.id, 1])), commentaire: "Fluidité : …\nCe qui manquait : …\nTrame de réponse : …\nRelances probables : …" }, null, 2), "```");
  }
  return L.join("\n") + "\n";
}

// ---------- Commandes ----------
async function cmdListe() {
  const l = await depots();
  if (!l.length) return console.log("Aucun dépôt.");
  for (const d of l) {
    const st = d.correction ? "corrigé " + C.dec(d.correction.note) + "/20" : "à corriger";
    console.log([d.id, fdate(d.createdAt), d._compte, d.kind === "ecrit" ? "écrit" : "oral ", st.padEnd(16), (d.files || []).length + " fichier(s)", titre(d).slice(0, 70)].join("  "));
  }
}
async function cmdRecuperer(ids) {
  const l = (await depots()).filter(d => ids.length ? ids.includes(d.id) : !d.correction);
  if (!l.length) return console.log(ids.length ? "Dépôt introuvable." : "Aucun dépôt à corriger.");
  for (const d of l) {
    const dir = path.join(OUT, new Date(d.createdAt).toISOString().slice(0, 10) + " " + (d.kind === "ecrit" ? "ecrit" : "oral") + " " + court(titre(d)) + " " + d.id);
    fs.mkdirSync(dir, { recursive: true });
    for (const f of d.files || []) {
      const bufs = [];
      for (let j = f.first; j < f.first + f.parts; j++) {
        const p = await api(BASE + "/users/" + d._uid + "/depots/" + d.id + "/parts/" + j);
        bufs.push(Buffer.from(dec(p.fields.d), "base64"));
      }
      fs.writeFileSync(path.join(dir, f.name.replace(/[\\/:*?"<>|]/g, "_")), Buffer.concat(bufs));
    }
    const meta = { ...d }; delete meta._name;
    fs.writeFileSync(path.join(dir, "depot.json"), JSON.stringify(meta, null, 2));
    const fpath = path.join(dir, "fiche-correction.md");
    fs.writeFileSync(fpath, fiche(d));
    console.log("→ " + path.relative(ROOT, dir));
    const audio = (d.files || []).filter(f => /^audio\//.test(f.type || "") || /\.(webm|m4a|mp4|ogg|opus|wav|mp3|aac)$/i.test(f.name));
    if (d.kind === "oral" && audio.length) {
      if (!fs.existsSync(PY)) { console.log("  analyse audio non installée (" + PY + ")"); continue; }
      console.log("  analyse audio de " + audio.length + " enregistrement(s), sur cet ordinateur…");
      const r = spawnSync(PY, ["-I", path.join(__dirname, "analyse_oral.py"), dir], { encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
      if (r.status === 0 && fs.existsSync(path.join(dir, "analyse-audio.md"))) {
        fs.appendFileSync(fpath, "\n## Analyse audio (fluidité)\n\nVoir `analyse-audio.md` : débit, pauses, tics de langage, répétitions, longueur des phrases, volume et intonation, avec la transcription annotée. Intègre-la aux critères « clarté », « structure » et « respect du temps », et à la ligne « Fluidité » du commentaire.\n");
        console.log("  → analyse-audio.md");
      } else console.log("  analyse audio impossible : " + String(r.stderr || r.error || "").trim().split("\n").slice(-2).join(" "));
    }
  }
}
async function cmdNoter(id, file) {
  if (!id || !file) die("Usage : node outils/depots.js noter <id> <correction.json>");
  const d = (await depots()).find(x => x.id === id); if (!d) die("Dépôt introuvable : " + id);
  const c = JSON.parse(fs.readFileSync(file, "utf8"));
  const crit = d.kind === "ecrit" ? D.EP[d.ep].grille : D.ORAL.criteres, min = d.kind === "ecrit" ? 0 : 1, max = 4;
  const scores = {};
  for (const k of crit) {
    const v = c.scores && c.scores[k.id];
    if (!Number.isInteger(v) || v < min || v > max) die("Niveau manquant ou invalide pour « " + k.id + " » (" + min + " à " + max + ").");
    scores[k.id] = v;
  }
  const defIds = d.kind === "ecrit" ? D.EP[d.ep].defauts.map(x => x.id) : [];
  const defauts = (c.defauts || []).filter(x => defIds.includes(x));
  const note = d.kind === "ecrit" ? C.gridNote(crit, scores).note : C.oralNote(crit, scores).note;
  const correction = { note: Math.round(note * 100) / 100, scores, defauts, commentaire: String(c.commentaire || ""), at: Date.now() };
  await api(BASE + "/users/" + d._uid + "/depots/" + d.id + "?updateMask.fieldPaths=correction&updateMask.fieldPaths=statut", { method: "PATCH", body: JSON.stringify({ fields: encFields({ correction, statut: "corrige" }) }) });
  console.log("Correction enregistrée : " + C.dec(correction.note) + "/20 · " + titre(d));
}

const [cmd, ...args] = process.argv.slice(2);
({ liste: cmdListe, recuperer: () => cmdRecuperer(args), noter: () => cmdNoter(args[0], args[1]) }[cmd] || (() => console.log(fs.readFileSync(__filename, "utf8").split("\n").slice(0, 11).join("\n"))))();
