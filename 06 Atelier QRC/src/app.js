/* ===== Interface ===== */
(function () {
  'use strict';
  var KEY = 'atelier-qrc-v1', DAY = 86400000, INTERVALS = [0, 1, 3, 7, 14, 30];
  var EXAMS = {
    I: { label: 'inspecteur', date: new Date(2026, 11, 7), n: 4, min: 70, txt: '4 exercices en 1 h 10' },
    C: { label: 'contrôleur', date: new Date(2027, 0, 11), n: 3, min: 60, txt: '3 exercices en 1 h' }
  };
  var S = { prog: blank(), view: 'dash', train: null, trainType: null, annale: null, exam: null, confirmReset: false };
  var uid = 0;
  var COURT = { affectation: 'Affectation', tva_ca3: 'TVA CA3', tva_coef: 'Coef. TVA', tva_regul: 'Régul. TVA', amort: 'Amortissement', derog: 'Dérogatoire', cession: 'Cession', depreciations: 'Dépréciations', regul: 'Régularisations', augcap: 'Capital', seuil: 'Seuil', commande: 'Coût marginal', sig_caf: 'SIG et CAF', bilan_fonc: 'Bilan fonct.', ratios: 'Ratios', is: 'IS', devises: 'Devises' };
  function blank() { return { v: 1, updated: 0, types: {}, epreuves: [], settings: { profil: 'I', pcgOld: false } }; }
  function normalize(p) {
    var b = blank();
    if (!p || typeof p !== 'object') return b;
    b.updated = p.updated || 0; b.types = p.types || {}; b.epreuves = Array.isArray(p.epreuves) ? p.epreuves : [];
    b.settings = Object.assign(b.settings, p.settings || {});
    return b;
  }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mmss(s) { s = Math.max(0, Math.round(s)); var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r; }
  function pct(x) { return Math.round(x * 100) + ' %'; }
  function profil() { return S.prog.settings.profil === 'C' ? 'C' : 'I'; }

  /* ---------- Stockage : base de l'Artifact (espace privé) + navigateur ---------- */
  var Store = {
    ref: null, writing: false, pending: false, remote: false,
    loadLocal: function () { try { var s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) { } return null; },
    saveLocal: function () { try { localStorage.setItem(KEY, JSON.stringify(S.prog)); } catch (e) { } },
    init: async function () {
      var loc = this.loadLocal(); if (loc && loc.v === 1) S.prog = normalize(loc);
      render();
      try {
        if (!window.claude || !window.claude.use) { status(); return; }
        var db = await window.claude.use('db'), user = await window.claude.use('user');
        if (!db || !user) { status(); return; }
        var id = await user.id(); if (!id) { status(); return; }
        this.ref = db.doc('data/users/' + id + '/progress');
        var snap = await this.ref.get();
        var d = snap.exists ? snap.data() : null;
        if (d && d.prog && (d.prog.updated || 0) >= (S.prog.updated || 0)) {
          S.prog = normalize(JSON.parse(JSON.stringify(d.prog))); this.saveLocal(); this.remote = true; render();
        } else if (S.prog.updated) { this.push(); } else { this.remote = true; }
      } catch (e) { this.ref = null; }
      status();
    },
    save: function () { S.prog.updated = Date.now(); this.saveLocal(); if (this.ref) this.push(); },
    push: async function () {
      if (!this.ref) return;
      if (this.writing) { this.pending = true; return; }
      this.writing = true;
      try { await this.ref.set({ prog: JSON.parse(JSON.stringify(S.prog)) }); this.remote = true; }
      catch (e) {
        var c = e && e.code;
        if (c === 'unavailable') { var self = this; setTimeout(function () { self.push(); }, 1500 + Math.random() * 1500); }
        else { this.ref = null; this.remote = false; }
      }
      this.writing = false; status();
      if (this.pending) { this.pending = false; this.push(); }
    }
  };
  function status() {
    var el = $('#store'); if (!el) return;
    el.textContent = Store.remote && Store.ref ? 'Progression enregistrée dans votre espace privé claude.ai (retrouvée sur tous vos appareils).' : 'Progression enregistrée dans ce navigateur.';
  }

  /* ---------- Répétition espacée par type ---------- */
  function st(id) { return S.prog.types[id] || { n: 0, sum: 0, box: 0, due: 0, last: [] }; }
  function avg(s) { return s.n ? s.sum / s.n : null; }
  function eligible() { var pr = profil(); return Object.keys(T).map(function (k) { return T[k]; }).filter(function (t) { return pr === 'I' || t.ctrl; }); }
  function isDue(s) { return !s.n || s.due <= Date.now(); }
  function prio(t) {
    var s = st(t.id), a = avg(s), p = 0, l = (s.last || [])[0];
    if (!s.n) p += 60; else if (s.due <= Date.now()) p += 80 + Math.min(30, (Date.now() - s.due) / DAY * 3);
    p += (5 - s.box) * 8;
    if (a !== null) p += (1 - a) * 30;
    if (l && l.s < 0.6) p += 25;
    if (l && l.t > t.minutes * 60 * 1.3) p += 10;
    return p;
  }
  function why(t) {
    var s = st(t.id), l = (s.last || [])[0];
    if (!s.n) return 'Jamais travaillé';
    if (l && l.s < 0.6) return 'Raté la dernière fois (' + pct(l.s) + ')';
    if (s.due <= Date.now()) return 'Révision prévue aujourd’hui';
    if (l && l.t > t.minutes * 60 * 1.3) return 'Trop lent la dernière fois (' + mmss(l.t) + ')';
    return 'Moyenne ' + pct(avg(s));
  }
  function nextTxt(s) {
    if (!s.n) return 'nouveau';
    var d = Math.ceil((s.due - Date.now()) / DAY);
    return d <= 0 ? 'à revoir' : 'dans ' + d + ' j';
  }
  function record(id, score, secs, mode) {
    var s = Object.assign({ n: 0, sum: 0, box: 0, due: 0, last: [] }, S.prog.types[id] || {});
    s.n++; s.sum = U.r2(s.sum + score);
    if (score >= 0.8) s.box = Math.min(5, s.box + 1); else if (score >= 0.5) s.box = Math.max(0, s.box - 1); else s.box = 0;
    s.due = Date.now() + INTERVALS[s.box] * DAY - (s.box ? 3 * 3600000 : 0);
    s.last = [{ s: U.rd(score, 3), t: Math.round(secs), d: Date.now(), m: mode }].concat(s.last || []).slice(0, 12);
    S.prog.types[id] = s;
  }
  function recommend(n) { return eligible().slice().sort(function (a, b) { return prio(b) - prio(a); }).slice(0, n || 1); }

  /* ---------- Exercices ---------- */
  function makeEx(typeId, o) {
    o = o || {};
    U.pcgOld = !!S.prog.settings.pcgOld;
    var t = T[typeId], seed = o.seed || (Math.floor(Math.random() * 899999) + 100000), opt = { profil: profil() };
    var p = o.params ? JSON.parse(JSON.stringify(o.params)) : t.gen(U.rng(seed), opt);
    var data = t.solve(p, opt);
    return { uid: ++uid, typeId: typeId, seed: seed, params: p, data: data, src: o.src || null, note: o.note || null, answers: {},
      jl: data.journal.map(function (en) { return en.lines.map(function () { return { a: '', d: '', c: '' }; }); }),
      checked: false, corr: false, start: Date.now(), secs: 0, res: null };
  }
  function elapsed(ex) { return ex.checked ? ex.secs : (Date.now() - ex.start) / 1000; }
  function grade(ex) {
    var qr = {}, ok = 0;
    ex.data.questions.forEach(function (q) { var r = U.checkNum(q, ex.answers[q.id] === undefined ? '' : ex.answers[q.id]); qr[q.id] = r; if (r.ok) ok++; });
    var w = 0, js = 0;
    var jr = ex.data.journal.map(function (en, i) { var r = U.checkEntry(en, ex.jl[i]); var wi = Math.max(1, en.lines.length / 2); w += wi; js += r.score * wi; return r; });
    var nq = ex.data.questions.length;
    return { qr: qr, jr: jr, ok: ok, nq: nq, js: w ? js / w : null, score: (ok + js) / (nq + w) };
  }
  function unitTxt(q) {
    if (q.kind === 'choice') return '';
    if (q.unit === '€') return /K€/.test(q.label) ? 'K€' : '€';
    return { '%': '%', j: 'j', u: '', coef: '' }[q.unit] || '';
  }
  function fmtAns(q) {
    if (q.kind === 'choice') return q.options[q.ans];
    var u = unitTxt(q);
    var dec = q.unit === '€' ? undefined : (q.unit === '%' ? 2 : (q.unit === 'coef' ? (Number.isInteger(U.rd(q.ans * 100, 6)) ? 2 : 4) : (q.unit === 'u' ? 0 : 2)));
    if (q.unit === 'j') dec = Number.isInteger(q.ans) ? 0 : 1;
    if (q.unit === 'u' && !Number.isInteger(q.ans)) dec = 2;
    return U.n(q.ans, dec) + (u ? ' ' + u : '');
  }
  function qHtml(ex, q) {
    var r = ex.res && ex.res.qr[q.id], cls = r ? (r.ok ? ' ok' : ' bad') : '';
    var v = ex.answers[q.id] === undefined ? '' : ex.answers[q.id], dis = ex.checked ? ' disabled' : '', id = 'q' + ex.uid + '-' + q.id, inp;
    if (q.kind === 'choice') {
      inp = '<select class="n" id="' + id + '" data-q="' + q.id + '"' + dis + '><option value="">Choisir…</option>' + q.options.map(function (o, i) { return '<option value="' + i + '"' + (String(i) === String(v) ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
    } else {
      inp = '<input class="n" id="' + id + '" inputmode="decimal" autocomplete="off" data-q="' + q.id + '" value="' + esc(v) + '"' + dis + '><span class="unit">' + unitTxt(q) + '</span>';
    }
    var fb = r ? '<div class="fb">' + (r.ok ? '✓ Exact' + (q.kind !== 'choice' ? ' : ' + fmtAns(q) : '') : (r.empty ? 'Non répondu' : '✗ Inexact') + ' — attendu : ' + esc(fmtAns(q))) + '</div>' : '';
    return '<div class="q' + cls + '"><label for="' + id + '">' + esc(q.label) + '</label><div class="in">' + inp + '</div>' + fb + '</div>';
  }
  var ST = { manquant: 'compte absent ou erroné', sens: 'saisi du mauvais côté', montant: 'montant inexact' };
  function jedHtml(ex, en, i) {
    var r = ex.res && ex.res.jr[i], dis = ex.checked ? ' disabled' : '';
    var h = '<div class="jed"><div class="jed-h"><b>' + esc(en.date) + '</b><span>' + esc(en.lib) + '</span></div><div class="jgrid"><span class="hd">Compte</span><span class="hd r">Débit</span><span class="hd r">Crédit</span>';
    ex.jl[i].forEach(function (l, k) {
      var b = ' data-j="' + i + '" data-r="' + k + '"', lab = ' ligne ' + (k + 1) + ' de l’écriture du ' + en.date;
      h += '<input class="ac" id="j' + ex.uid + '-' + i + '-' + k + 'a" inputmode="numeric" autocomplete="off" aria-label="Compte,' + lab + '"' + b + ' data-f="a" value="' + esc(l.a) + '"' + dis + '>';
      h += '<input class="n" id="j' + ex.uid + '-' + i + '-' + k + 'd" inputmode="decimal" autocomplete="off" aria-label="Débit,' + lab + '"' + b + ' data-f="d" value="' + esc(l.d) + '"' + dis + '>';
      h += '<input class="n" id="j' + ex.uid + '-' + i + '-' + k + 'c" inputmode="decimal" autocomplete="off" aria-label="Crédit,' + lab + '"' + b + ' data-f="c" value="' + esc(l.c) + '"' + dis + '>';
    });
    h += '</div>';
    if (!ex.checked) h += '<button type="button" class="jadd" data-act="addline" data-j="' + i + '">+ Ajouter une ligne</button>';
    if (r) {
      h += '<div class="jfb">' + r.detail.map(function (x) {
        var got = x.side === 'd' ? x.got.d : x.got.c;
        return '<div class="l ' + (x.st === 'ok' ? 'ok' : 'bad') + '">' + (x.st === 'ok' ? '✓' : '✗') + ' <span class="mono">' + x.a + '</span> ' + esc(U.lib(x.a)) + ' · ' + (x.side === 'd' ? 'débit ' : 'crédit ') + U.n(x.mt, 2) + (x.st === 'ok' ? '' : ' — ' + ST[x.st] + (x.st === 'montant' ? ' (saisi : ' + U.n(got, 2) + ')' : '')) + '</div>';
      }).join('') + r.extra.map(function (x) { return '<div class="l bad">✗ <span class="mono">' + esc(x.a || '?') + '</span> ' + (x.d ? 'débit ' + U.n(x.d, 2) : 'crédit ' + U.n(x.c, 2)) + ' — ligne en trop</div>'; }).join('') + (!r.equilibre ? '<div class="l bad">Votre écriture n’est pas équilibrée (débits ' + U.n(r.tD, 2) + ', crédits ' + U.n(r.tC, 2) + ').</div>' : '') + '</div>';
    }
    return h + '</div>';
  }
  function corrHtml(ex) {
    var d = ex.data, h = '<section class="steps" id="corr' + ex.uid + '"><h3>Corrigé pas à pas</h3>';
    d.steps.forEach(function (s) { h += '<section><h4>' + esc(s.h) + '</h4>' + s.html + '</section>'; });
    if (d.journal.length) h += '<section><h4>Écritures au journal</h4>' + U.journalHtml(d.journal) + '</section>';
    h += '<section><h4>Interprétation (à rédiger sur la copie)</h4><p class="interp">' + d.comment + '</p></section></section>';
    return h;
  }
  function scoreHtml(ex) {
    var R = ex.res, t = T[ex.typeId], s = st(ex.typeId);
    return '<div class="score" role="status"><b>' + pct(R.score) + '</b><div>' + R.ok + ' sur ' + R.nq + ' résultats exacts' + (R.js !== null ? ' · écritures : ' + pct(R.js) : '') + '<br><span class="meta">Temps : ' + mmss(ex.secs) + ' (objectif ' + t.minutes + ' min)' + (ex.secs > t.minutes * 60 ? ' — trop lent, recommence pour gagner en vitesse' : '') + '</span></div><span class="chip ' + (R.score >= 0.8 ? 'ok' : (R.score >= 0.5 ? 'warn' : 'bad')) + '">Prochaine révision : ' + nextTxt(s) + '</span></div>';
  }
  function exHtml(ex, mode) {
    var t = T[ex.typeId], d = ex.data;
    var h = '<article class="panel enter" id="ex' + ex.uid + '"><div class="exhead"><div><div class="eyebrow">' + esc(t.famille) + ' · ' + (ex.src ? esc(ex.src) : 'variante n° ' + ex.seed) + '</div><h2>' + esc(t.nom) + '</h2></div>';
    if (mode !== 'exam' && mode !== 'review') h += '<span class="clock" id="clock" data-target="' + t.minutes * 60 + '">' + mmss(elapsed(ex)) + ' / ' + t.minutes + ':00</span>';
    h += '</div>';
    if (ex.note) h += '<p class="note">' + esc(ex.note) + '</p>';
    h += '<div class="enonce">' + d.enonce + '</div>';
    h += '<section class="steps"><h3>Résultats chiffrés</h3><p class="meta">Saisis les montants sans séparateur ou avec des espaces ; virgule décimale. Pourcentages en %.</p><div class="qs">' + d.questions.map(function (q) { return qHtml(ex, q); }).join('') + '</div></section>';
    if (d.journal.length) h += '<section class="steps"><h3>Écritures au journal</h3><p class="meta">Une ligne par compte ; numéros du PCG, anciens ou nouveaux.</p>' + d.journal.map(function (en, i) { return jedHtml(ex, en, i); }).join('') + '</section>';
    else h += '<p class="meta">Pas d’écriture comptable dans cet exercice : la conclusion rédigée compte autant que les calculs.</p>';
    if (ex.res) h += scoreHtml(ex);
    if (mode !== 'exam') {
      h += '<div class="row">';
      if (!ex.checked) h += '<button type="button" class="btn pri" data-act="check">Vérifier mes réponses</button>';
      h += '<button type="button" class="btn" data-act="corr">' + (ex.corr ? 'Masquer le corrigé' : 'Voir le corrigé') + '</button>';
      if (mode === 'train') h += '<button type="button" class="btn ghost" data-act="next">Nouvelle variante</button>';
      if (mode === 'annale') h += '<button type="button" class="btn ghost" data-act="backannales">Retour aux sujets</button>';
      h += '</div>';
    }
    if (ex.corr) h += corrHtml(ex);
    return h + '</article>';
  }
  function currentEx() {
    if (S.view === 'train') return S.train;
    if (S.view === 'annales') return S.annale;
    if (S.view === 'exam' && S.exam) return S.exam.items[S.exam.cur];
    return null;
  }

  /* ---------- Vues ---------- */
  function daysTo(d) { var t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((d - t) / DAY); }
  function boxes(b) { var h = '<span class="boxes" aria-label="Niveau ' + b + ' sur 5">'; for (var i = 0; i < 5; i++) h += '<i class="' + (i < b ? 'on' : '') + '"></i>'; return h + '</span>'; }
  function viewDash() {
    var el = eligible(), nEx = 0, sum = 0, due = 0;
    el.forEach(function (t) { var s = st(t.id); nEx += s.n; sum += s.sum; if (isDue(s)) due++; });
    var cfg = EXAMS[profil()], j = daysTo(cfg.date);
    var h = '<section class="panel"><div class="eyebrow">Concours ' + cfg.label + ' · ' + (j > 0 ? 'J-' + j : 'jour J') + '</div><h2>Où en es-tu ?</h2><p class="lede">L’outil suit tes résultats par type d’exercice et te ressort en priorité ceux que tu rates, ceux que tu fais trop lentement et ceux dont la révision est due (répétition espacée : 1, 3, 7, 14 puis 30 jours après chaque réussite).</p>';
    h += '<div class="stats"><div class="stat"><b>' + nEx + '</b><span>exercices corrigés</span></div><div class="stat"><b>' + (nEx ? pct(sum / nEx) : '—') + '</b><span>score moyen</span></div><div class="stat"><b>' + due + '</b><span>types à revoir</span></div><div class="stat"><b>' + S.prog.epreuves.filter(function (e) { return e.p === profil(); }).length + '</b><span>épreuves blanches</span></div></div></section>';
    h += '<section class="panel"><h3>À travailler maintenant</h3><div class="reco">' + recommend(3).map(function (t) { return '<button type="button" data-train="' + t.id + '"><span class="fam">' + esc(t.famille) + '</span><b>' + esc(t.nom) + '</b><span class="why">' + esc(why(t)) + '</span></button>'; }).join('') + '</div></section>';
    h += '<section class="panel"><h3>Progression par type</h3><div class="tw"><table class="types"><thead><tr><th>Type d’exercice</th><th>Niveau</th><th class="hide-sm">Moyenne</th><th class="hide-sm">Dernier</th><th>Révision</th></tr></thead><tbody>';
    el.forEach(function (t) {
      var s = st(t.id), l = (s.last || [])[0], a = avg(s), nt = nextTxt(s);
      h += '<tr class="click" data-train="' + t.id + '" tabindex="0"><td><b>' + esc(t.nom) + '</b><br><span class="fam">' + esc(t.famille) + (t.ctrl ? '' : ' · inspecteur') + '</span></td><td>' + boxes(s.box || 0) + '</td><td class="hide-sm mono">' + (a === null ? '—' : pct(a)) + '</td><td class="hide-sm mono">' + (l ? pct(l.s) + ' · ' + mmss(l.t) : '—') + '</td><td><span class="chip ' + (nt === 'à revoir' ? 'warn' : (nt === 'nouveau' ? 'acc' : 'ok')) + '">' + nt + '</span></td></tr>';
    });
    h += '</tbody></table></div></section>';
    var ep = S.prog.epreuves.filter(function (e) { return e.p === profil(); }).slice(0, 6);
    if (ep.length) h += '<section class="panel"><h3>Dernières épreuves blanches</h3><div class="tw"><table class="types"><thead><tr><th>Date</th><th>Score</th><th>Durée</th><th class="hide-sm">Exercices</th></tr></thead><tbody>' + ep.map(function (e) { return '<tr><td class="mono">' + new Date(e.d).toLocaleDateString('fr-FR') + '</td><td class="mono">' + pct(e.s) + '</td><td class="mono">' + mmss(e.t) + '</td><td class="hide-sm">' + e.x.map(function (x) { return esc((T[x.id] || { nom: x.id }).nom) + ' (' + pct(x.s) + ')'; }).join(', ') + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
    h += '<section class="panel"><h3>Réglages</h3><div class="row"><span>Comptes affichés dans les corrigés :</span><div class="seg" role="group" aria-label="Plan comptable"><button type="button" data-pcg="0" aria-pressed="' + !S.prog.settings.pcgOld + '">PCG 2025 (657, 757)</button><button type="button" data-pcg="1" aria-pressed="' + !!S.prog.settings.pcgOld + '">Ancien PCG (675, 775)</button></div></div>';
    h += S.confirmReset ? '<div class="confirm"><span>Effacer toute la progression ? Cette action est définitive.</span><button type="button" class="btn danger" data-act="resetyes">Effacer</button><button type="button" class="btn" data-act="resetno">Annuler</button></div>' : '<div class="row"><button type="button" class="btn ghost danger" data-act="reset">Effacer ma progression</button></div>';
    return h + '</section>';
  }
  function dotCls(t) { var s = st(t.id), l = (s.last || [])[0]; if (!s.n) return ''; if (l && l.s < 0.6) return 'weak'; if (isDue(s)) return 'due'; return 'good'; }
  function viewTrain() {
    var el = eligible();
    if (S.trainType && !el.some(function (t) { return t.id === S.trainType; })) { S.trainType = null; S.train = null; }
    if (!S.train) { S.trainType = recommend(1)[0].id; S.train = makeEx(S.trainType); }
    var h = '<section class="panel"><div class="eyebrow">Mode entraînement</div><h2>Un type, une variante, un chrono</h2><p class="lede">Choisis un type ou laisse l’outil choisir ton point faible. Saisis tes résultats et tes écritures, puis vérifie : le corrigé détaille chaque calcul, les écritures et l’interprétation attendue.</p>';
    var fams = []; el.forEach(function (t) { if (fams.indexOf(t.famille) < 0) fams.push(t.famille); });
    var sel = '<select class="n pick" id="pick-type" aria-label="Type d’exercice">' + fams.map(function (f) {
      return '<optgroup label="' + esc(f) + '">' + el.filter(function (t) { return t.famille === f; }).map(function (t) { return '<option value="' + t.id + '"' + (S.trainType === t.id ? ' selected' : '') + '>' + esc(t.nom) + ' — ' + nextTxt(st(t.id)) + '</option>'; }).join('') + '</optgroup>';
    }).join('') + '</select>';
    h += '<div class="row pickrow">' + sel + '<button type="button" class="btn" data-act="picked">Nouvel exercice</button><button type="button" class="btn pri" data-act="auto">Point faible</button></div></section>';
    if (S.train) h += exHtml(S.train, 'train');
    return h;
  }
  function viewFiches() {
    var el = eligible(), fams = [];
    el.forEach(function (t) { if (fams.indexOf(t.famille) < 0) fams.push(t.famille); });
    var h = '<section class="panel"><div class="eyebrow">Fiches-procédure</div><h2>La méthode de chaque type</h2><p class="lede">Étapes dans l’ordre de la copie, pièges relevés dans les corrigés et le rapport du jury, comptes utiles. ' + (profil() === 'C' ? 'Filtre contrôleur actif : IS, devises, augmentation de capital et provisions pour risques sont masqués.' : '') + '</p></section>';
    fams.forEach(function (f) {
      h += '<h3 class="famh">' + esc(f) + '</h3>';
      el.filter(function (t) { return t.famille === f; }).forEach(function (t) {
        var fi = t.fiche;
        h += '<details class="fiche"><summary><h3>' + esc(t.nom) + '</h3><span class="chip">' + t.minutes + ' min</span></summary><div class="fbody"><p>' + esc(fi.objectif) + '</p><h4>Étapes</h4><ol>' + fi.etapes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><h4>Pièges</h4><ul class="pieges">' + fi.pieges.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' + (fi.comptes.length ? '<h4>Comptes</h4><ul>' + fi.comptes.map(function (x) { return '<li class="mono">' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + '<div class="row"><button type="button" class="btn pri" data-train="' + t.id + '">S’entraîner sur ce type</button></div></div></details>';
      });
    });
    return h;
  }
  function viewAnnales() {
    if (S.annale) return exHtml(S.annale, 'annale');
    var list = ANNALES.filter(function (a) { return profil() === 'I' || a.ctrl; });
    var h = '<section class="panel"><div class="eyebrow">Sujets réels</div><h2>Les exercices des annales, corrigés automatiquement</h2><p class="lede">Mêmes données que les sujets 2026 (inspecteur et contrôleur), le sujet test inspecteur et le sujet blanc du dossier. Les corrigés ont été recalculés ; les écarts avec les corrigés publiés sont signalés.</p></section><section class="panel"><div class="tw"><table class="types"><thead><tr><th>Sujet</th><th>Type</th><th></th></tr></thead><tbody>';
    list.forEach(function (a) { h += '<tr><td><b>' + esc(a.p.nom) + '</b><br><span class="fam">' + esc(a.src) + '</span></td><td>' + esc(T[a.type].nom) + '</td><td><button type="button" class="btn" data-annale="' + a.id + '">Faire</button></td></tr>'; });
    return h + '</tbody></table></div></section>';
  }
  function viewExam() {
    var cfg = EXAMS[profil()], E = S.exam;
    if (!E) {
      return '<section class="panel"><div class="eyebrow">Épreuve blanche · ' + cfg.label + '</div><h2>' + cfg.txt + '</h2><p class="lede">Tirage au hasard parmi les types du programme ' + cfg.label + ', avec priorité aux types que tu rates ou que tu n’as pas revus. Pas de correction avant la remise de la copie. À la fin du temps, la copie est rendue automatiquement : entraîne-toi à tout traiter, même partiellement, comme le demande le jury.</p><div class="row"><button type="button" class="btn pri" data-act="startexam">Commencer l’épreuve</button></div></section>';
    }
    var h = '<div class="exambar">';
    var rem = E.done ? 0 : E.dur - (Date.now() - E.start) / 1000;
    h += E.done ? '<span class="big">' + pct(E.score) + '</span>' : '<span class="big" id="cd">' + mmss(rem) + '</span>';
    h += '<div class="pills">' + E.items.map(function (x, i) { return '<button type="button" data-pill="' + i + '" aria-current="' + (i === E.cur) + '">' + (i + 1) + '. ' + esc(COURT[x.typeId] || x.typeId) + (E.done ? ' · ' + pct(x.res.score) : '') + '</button>'; }).join('') + '</div>';
    h += E.done ? '<button type="button" class="btn" data-act="newexam">Nouvelle épreuve</button>' : '<button type="button" class="btn pri" data-act="submit">Rendre la copie</button>';
    h += '</div>';
    if (E.done) {
      h += '<section class="panel"><h3>Résultat de l’épreuve</h3><div class="tw"><table class="types"><thead><tr><th>Exercice</th><th>Score</th><th>Temps passé</th></tr></thead><tbody>' + E.items.map(function (x, i) { return '<tr class="click" data-pill="' + i + '"><td>' + (i + 1) + '. ' + esc(T[x.typeId].nom) + '</td><td class="mono">' + pct(x.res.score) + '</td><td class="mono">' + mmss(E.spent[i]) + '</td></tr>'; }).join('') + '<tr class="tot"><td>Total</td><td class="mono">' + pct(E.score) + '</td><td class="mono">' + mmss(E.used) + ' / ' + cfg.min + ':00</td></tr></tbody></table></div><p class="meta">Les résultats sont intégrés à ta progression ; ouvre chaque exercice pour voir le corrigé.</p></section>';
      h += exHtml(E.items[E.cur], 'review');
    } else h += exHtml(E.items[E.cur], 'exam');
    return h;
  }
  function drawExam() {
    var cfg = EXAMS[profil()], pool = eligible().slice(), chosen = [], fam = {};
    while (chosen.length < cfg.n && pool.length) {
      var ws = pool.map(function (t) { var s = st(t.id), a = avg(s); return 1 + (5 - (s.box || 0)) * 0.6 + (isDue(s) ? 2 : 0) + (a === null ? 1.5 : (1 - a) * 3); });
      var tot = ws.reduce(function (a, b) { return a + b; }, 0), x = Math.random() * tot, k = 0;
      while (k < ws.length - 1 && x > ws[k]) { x -= ws[k]; k++; }
      var t = pool.splice(k, 1)[0];
      if ((fam[t.famille] || 0) >= 2) continue;
      fam[t.famille] = (fam[t.famille] || 0) + 1; chosen.push(t);
    }
    return chosen;
  }
  function examSwitch(i) {
    var E = S.exam; if (!E.done) { var now = Date.now(); E.spent[E.cur] += (now - E.last) / 1000; E.last = now; }
    E.cur = i;
  }
  function submitExam() {
    var E = S.exam; if (!E || E.done) return;
    examSwitch(E.cur);
    E.used = Math.min(E.dur, (Date.now() - E.start) / 1000);
    var tot = 0;
    E.items.forEach(function (ex, i) { ex.res = grade(ex); ex.checked = true; ex.secs = E.spent[i]; tot += ex.res.score; record(ex.typeId, ex.res.score, E.spent[i], 'epreuve'); });
    E.score = tot / E.items.length; E.done = true; E.cur = 0;
    S.prog.epreuves = [{ d: Date.now(), p: profil(), s: U.rd(E.score, 3), t: Math.round(E.used), x: E.items.map(function (ex, i) { return { id: ex.typeId, s: U.rd(ex.res.score, 3), t: Math.round(E.spent[i]) }; }) }].concat(S.prog.epreuves).slice(0, 30);
    Store.save();
  }

  /* ---------- Rendu et événements ---------- */
  function render() {
    document.querySelectorAll('#tabs button').forEach(function (b) { if (b.dataset.v === S.view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    document.querySelectorAll('#profil button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.p === profil())); });
    var cfg = EXAMS[profil()], j = daysTo(cfg.date);
    $('#countdown').textContent = 'Écrit ' + cfg.label + ' le ' + cfg.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + (j > 0 ? ' · J-' + j : '');
    var v = $('#view');
    v.innerHTML = S.view === 'dash' ? viewDash() : S.view === 'train' ? viewTrain() : S.view === 'fiches' ? viewFiches() : S.view === 'annales' ? viewAnnales() : viewExam();
    measure();
  }
  function measure() { var t = $('.top'); if (t) document.documentElement.style.setProperty('--hh', t.offsetHeight + 'px'); }
  function startTrain(id) { S.view = 'train'; S.trainType = id; S.train = makeEx(id); render(); var a = $('#ex' + S.train.uid); if (a) a.scrollIntoView({ block: 'start' }); }
  function go(v) { S.view = v; S.confirmReset = false; render(); window.scrollTo(0, 0); }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('button, tr[data-train], tr[data-pill]'); if (!b) return;
    var ds = b.dataset, ex = currentEx();
    if (ds.v) return go(ds.v);
    if (ds.p) { S.prog.settings.profil = ds.p; Store.save(); if (S.exam && !S.exam.done) { } else S.exam = null; return render(); }
    if (ds.train) return startTrain(ds.train);
    if (ds.annale) { var a = ANNALES.filter(function (x) { return x.id === ds.annale; })[0]; S.annale = makeEx(a.type, { params: a.p, src: a.src, note: a.note }); render(); window.scrollTo(0, 0); return; }
    if (ds.pcg !== undefined) { S.prog.settings.pcgOld = ds.pcg === '1'; Store.save(); return render(); }
    if (ds.pill !== undefined) { examSwitch(Number(ds.pill)); render(); var e2 = $('.exambar'); if (e2) e2.scrollIntoView({ block: 'start' }); return; }
    switch (ds.act) {
      case 'auto': return startTrain(recommend(1)[0].id);
      case 'picked': var pk = $('#pick-type'); return startTrain(pk ? pk.value : S.trainType);
      case 'check':
        if (!ex) return;
        ex.secs = elapsed(ex); ex.res = grade(ex); ex.checked = true;
        record(ex.typeId, ex.res.score, ex.secs, S.view === 'annales' ? 'sujet' : 'entrainement'); Store.save();
        render(); var sc = $('#ex' + ex.uid + ' .score'); if (sc) sc.scrollIntoView({ block: 'center' }); return;
      case 'corr':
        if (!ex) return; ex.corr = !ex.corr; render(); if (ex.corr) { var c = $('#corr' + ex.uid); if (c) c.scrollIntoView({ block: 'start' }); } return;
      case 'next': return startTrain(S.trainType || ex.typeId);
      case 'addline': if (!ex) return; ex.jl[Number(ds.j)].push({ a: '', d: '', c: '' }); return render();
      case 'backannales': S.annale = null; return render();
      case 'startexam':
        var cfg = EXAMS[profil()];
        S.exam = { items: drawExam().map(function (t) { return makeEx(t.id); }), cur: 0, start: Date.now(), last: Date.now(), dur: cfg.min * 60, spent: [], done: false };
        S.exam.spent = S.exam.items.map(function () { return 0; });
        render(); window.scrollTo(0, 0); return;
      case 'submit': submitExam(); render(); window.scrollTo(0, 0); return;
      case 'newexam': S.exam = null; return render();
      case 'reset': S.confirmReset = true; return render();
      case 'resetno': S.confirmReset = false; return render();
      case 'resetyes':
        var keep = S.prog.settings; S.prog = blank(); S.prog.settings = keep; S.confirmReset = false; Store.save(); return render();
    }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && ev.target.matches && ev.target.matches('tr[data-train]')) startTrain(ev.target.dataset.train);
  });
  function onInput(ev) {
    var t = ev.target;
    if (t.id === 'pick-type') { if (ev.type === 'change') startTrain(t.value); return; }
    var ex = currentEx(); if (!ex || ex.checked) return;
    if (t.dataset.q) ex.answers[t.dataset.q] = t.value;
    else if (t.dataset.j !== undefined && t.dataset.f) ex.jl[Number(t.dataset.j)][Number(t.dataset.r)][t.dataset.f] = t.value;
  }
  document.addEventListener('input', onInput);
  document.addEventListener('change', onInput);
  window.addEventListener('resize', measure);
  setInterval(function () {
    var c = $('#clock'), ex = currentEx();
    if (c && ex && !ex.checked) { var e = elapsed(ex), tg = Number(c.dataset.target); c.textContent = mmss(e) + ' / ' + mmss(tg); c.classList.toggle('over', e > tg); }
    if (S.exam && !S.exam.done && S.view === 'exam') {
      var rem = S.exam.dur - (Date.now() - S.exam.start) / 1000, cd = $('#cd');
      if (rem <= 0) { submitExam(); render(); return; }
      if (cd) cd.textContent = mmss(rem);
    } else if (S.exam && !S.exam.done && S.exam.dur - (Date.now() - S.exam.start) / 1000 <= 0) { submitExam(); }
  }, 1000);

  Store.init();
})();
