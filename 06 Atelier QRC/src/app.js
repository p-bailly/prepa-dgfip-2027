/* ===== Interface ===== */
(function () {
  'use strict';
  var KEY = 'atelier-qrc-v1', DAY = 86400000, INTERVALS = [0, 1, 3, 7, 14, 30];
  var EXAMS = {
    I: { label: 'inspecteur', date: new Date(2026, 11, 7), n: 4, min: 70, txt: '4 exercices en 1 h 10' },
    C: { label: 'contrôleur', date: new Date(2027, 0, 11), n: 3, min: 60, txt: '3 exercices en 1 h' }
  };
  var S = { prog: blank(), view: 'dash', train: null, trainType: null, annale: null, exam: null, fiche: null, confirmReset: false };
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
  // Pictogrammes de la charte (trait 1,8 px, 24 × 24)
  var ICO = {
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    cross: '<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    scale: '<path d="M12 4v16M7 20h10M4.5 8h15M7 8l-3 6a3 3 0 0 0 6 0zM17 8l-3 6a3 3 0 0 0 6 0z"/>',
    flag: '<path d="M5.5 21V4.5M5.5 5h11l-2 4 2 4h-11"/>',
    book: '<path d="M4.5 5.5c2.5-1 5-1 7.5.5v13c-2.5-1.5-5-1.5-7.5-.5zM19.5 5.5c-2.5-1-5-1-7.5.5v13c2.5-1.5 5-1.5 7.5-.5z"/>'
  };
  function ico(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICO[n] + '</svg>'; }

  /* ---------- Stockage : navigateur + compte synchronisé (commun/sync.js) ---------- */
  var Store = {
    loadLocal: function () { try { var s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) { } return null; },
    saveLocal: function () { try { localStorage.setItem(KEY, JSON.stringify(S.prog)); } catch (e) { } },
    init: function () {
      var loc = this.loadLocal(); if (loc && loc.v === 1) S.prog = normalize(loc);
      render();
      if (!window.PrepaSync) return;
      // Progression entière : la version la plus récente l'emporte.
      PrepaSync.attach('qrc', {
        get: function () { return S.prog; },
        merge: function (o) {
          if (o && o.v === 1 && (o.updated || 0) > (S.prog.updated || 0)) {
            S.prog = normalize(JSON.parse(JSON.stringify(o))); Store.saveLocal();
            var a = document.activeElement; if (!(a && a.closest && a.closest('input,select,textarea'))) render();
          }
        }
      });
      PrepaSync.onStatus(status);
    },
    save: function () { S.prog.updated = Date.now(); this.saveLocal(); if (window.PrepaSync) PrepaSync.changed('qrc'); }
  };
  function status() {
    var el = $('#store'); if (!el) return;
    el.textContent = 'Progression ' + (window.PrepaSync ? PrepaSync.label() : 'sur cet appareil') + '.';
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
    var isCls = r ? (r.ok ? ' is-ok' : ' is-bad') : '';
    if (q.kind === 'choice') {
      inp = '<select class="input' + isCls + '" id="' + id + '" data-q="' + q.id + '"' + dis + '><option value="">Choisir…</option>' + q.options.map(function (o, i) { return '<option value="' + i + '"' + (String(i) === String(v) ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
    } else {
      inp = '<input class="input n' + isCls + '" id="' + id + '" inputmode="decimal" autocomplete="off" data-q="' + q.id + '" value="' + esc(v) + '"' + dis + '>';
    }
    var fb = r ? '<div class="fb">' + ico(r.ok ? 'check' : 'cross') + '<span>' + (r.ok ? 'Exact' + (q.kind !== 'choice' ? ' : <b>' + esc(fmtAns(q)) + '</b>' : '') : (r.empty ? 'Non répondu' : 'Inexact') + ' · attendu : <b>' + esc(fmtAns(q)) + '</b>') + '</span></div>' : '';
    return '<div class="ans' + cls + '"><label for="' + id + '">' + esc(q.label) + '</label><div class="in" data-u="' + unitTxt(q) + '">' + inp + '</div>' + fb + '</div>';
  }
  var ST = { manquant: 'compte absent ou erroné', sens: 'saisi du mauvais côté', montant: 'montant inexact' };
  // État d'une ligne saisie, une fois l'écriture corrigée : juste, compte juste mais sens ou montant faux, compte inattendu.
  function rowSt(en, l) {
    if (!String(l.a || '').trim() && !String(l.d || '').trim() && !String(l.c || '').trim()) return '';
    var r = U.checkEntry(en, [l]);
    if (r.detail.some(function (x) { return x.st === 'ok'; })) return 'ok';
    return r.extra.length ? 'bad' : 'warn';
  }
  // Pied d'équilibre : totaux de la saisie
  function footHtml(ex, i) {
    var tD = 0, tC = 0, any = false;
    ex.jl[i].forEach(function (l) { var d = U.parseNum(l.d), c = U.parseNum(l.c); if (!isNaN(d)) { tD += d; any = true; } if (!isNaN(c)) { tC += c; any = true; } });
    var eq = Math.abs(tD - tC) < 0.005;
    var lbl = !any ? '<span class="lbl muted">' + ico('scale') + 'Totaux</span>'
      : eq ? '<span class="lbl">' + ico('check') + 'Total débit = total crédit</span>'
      : '<span class="lbl warn">' + ico('scale') + 'Écart : ' + U.n(Math.abs(tD - tC), 2) + '</span>';
    return lbl + '<span class="r">' + U.n(tD, 2) + '</span><span class="r">' + U.n(tC, 2) + '</span><span></span>';
  }
  function jedHtml(ex, en, i) {
    var r = ex.res && ex.res.jr[i], dis = ex.checked ? ' disabled' : '';
    var h = '<div class="journal"><div class="j-head"><b>' + esc(en.date) + '</b><span>' + esc(en.lib) + '</span></div><div class="j-body"><div class="j-grid"><span class="hd">Compte</span><span class="hd r">Débit</span><span class="hd r">Crédit</span><span class="hd"></span>';
    ex.jl[i].forEach(function (l, k) {
      var b = ' data-j="' + i + '" data-r="' + k + '"', lab = ' ligne ' + (k + 1) + ' de l’écriture du ' + en.date;
      var rs = r ? rowSt(en, l) : '', cr = String(l.c || '').trim() && !String(l.d || '').trim();
      h += '<div class="j-row' + (cr ? ' cr' : '') + '"><span class="j-acc"><input class="input" id="j' + ex.uid + '-' + i + '-' + k + 'a" inputmode="numeric" autocomplete="off" aria-label="Compte,' + lab + '"' + b + ' data-f="a" value="' + esc(l.a) + '"' + dis + '><small>' + esc(U.lib(String(l.a || '').trim())) + '</small></span>';
      h += '<span><input class="input n" id="j' + ex.uid + '-' + i + '-' + k + 'd" inputmode="decimal" autocomplete="off" aria-label="Débit,' + lab + '"' + b + ' data-f="d" value="' + esc(l.d) + '"' + dis + '></span>';
      h += '<span><input class="input n" id="j' + ex.uid + '-' + i + '-' + k + 'c" inputmode="decimal" autocomplete="off" aria-label="Crédit,' + lab + '"' + b + ' data-f="c" value="' + esc(l.c) + '"' + dis + '></span>';
      h += '<span class="j-st' + (rs ? ' ' + rs : '') + '"' + (rs ? ' title="' + { ok: 'Ligne juste', warn: 'Compte attendu, sens ou montant à revoir', bad: 'Compte inattendu' }[rs] + '"' : '') + '>' + (rs ? ico(rs === 'ok' ? 'check' : rs === 'bad' ? 'cross' : 'info') : '') + '</span></div>';
    });
    h += '</div></div>';
    if (!ex.checked) h += '<button type="button" class="j-add" data-act="addline" data-j="' + i + '">' + ico('plus') + 'Ajouter une ligne</button>';
    h += '<div class="j-foot" id="jf' + ex.uid + '-' + i + '">' + footHtml(ex, i) + '</div>';
    if (r) {
      h += '<div class="jfb">' + r.detail.map(function (x) {
        var got = x.side === 'd' ? x.got.d : x.got.c;
        return '<div class="l ' + (x.st === 'ok' ? 'ok' : 'bad') + '">' + ico(x.st === 'ok' ? 'check' : 'cross') + '<span><span class="mono">' + x.a + '</span> ' + esc(U.lib(x.a)) + ' · ' + (x.side === 'd' ? 'débit ' : 'crédit ') + U.n(x.mt, 2) + (x.st === 'ok' ? '' : ' : ' + ST[x.st] + (x.st === 'montant' ? ' (saisi : ' + U.n(got, 2) + ')' : '')) + '</span></div>';
      }).join('') + r.extra.map(function (x) { return '<div class="l bad">' + ico('cross') + '<span><span class="mono">' + esc(x.a || '?') + '</span> ' + (x.d ? 'débit ' + U.n(x.d, 2) : 'crédit ' + U.n(x.c, 2)) + ' : ligne en trop</span></div>'; }).join('') + (!r.equilibre ? '<div class="l bad">' + ico('scale') + '<span>Ton écriture n’est pas équilibrée (débits ' + U.n(r.tD, 2) + ', crédits ' + U.n(r.tC, 2) + ').</span></div>' : '') + '</div>';
    }
    return h + '</div>';
  }
  function corrHtml(ex) {
    var d = ex.data, h = '<article class="sheet" id="corr' + ex.uid + '"><h2 class="h-sec">Corrigé pas à pas</h2>';
    d.steps.forEach(function (s) { h += '<section class="part"><h3>' + esc(s.h) + '</h3>' + s.html + '</section>'; });
    if (d.journal.length) h += '<section class="part"><h3>Écritures au journal</h3>' + U.journalHtml(d.journal) + '</section>';
    h += '<div class="callout"><span class="ic">' + ico('info') + '</span><div><h4>Interprétation (à rédiger sur la copie)</h4><p>' + d.comment + '</p></div></div></article>';
    return h;
  }
  function scoreHtml(ex) {
    var R = ex.res, t = T[ex.typeId], s = st(ex.typeId);
    return '<div class="score" role="status"><span class="big">' + Math.round(R.score * 100) + '<small> %</small></span><div class="stack" style="gap:4px"><b>' + R.ok + ' sur ' + R.nq + ' résultats exacts' + (R.js !== null ? ' · écritures : ' + pct(R.js) : '') + '</b><span class="small muted">Temps : ' + mmss(ex.secs) + ' (objectif ' + t.minutes + ' min)' + (ex.secs > t.minutes * 60 ? ' : trop lent' : '') + '</span><div><span class="badge ' + (R.score >= 0.8 ? 'ok' : (R.score >= 0.5 ? 'warn' : 'bad')) + '">Prochaine révision : ' + nextTxt(s) + '</span></div></div></div>';
  }
  function exHtml(ex, mode) {
    var t = T[ex.typeId], d = ex.data;
    var h = '<div class="ex enter" id="ex' + ex.uid + '"><section class="ex-head"><div class="hero"><span class="eyebrow">' + esc(t.famille) + ' · ' + (ex.src ? esc(ex.src) : 'variante n° ' + ex.seed) + '</span><h1 class="h-page">' + esc(t.nom) + '</h1></div>';
    if (mode !== 'exam' && mode !== 'review') h += '<span class="clock" title="Temps passé / objectif">' + ico('clock') + '<span id="clock" data-target="' + t.minutes * 60 + '">' + mmss(elapsed(ex)) + ' / ' + t.minutes + ':00</span></span>';
    h += '</section>';
    if (ex.note) h += '<div class="callout warn"><span class="ic">' + ico('flag') + '</span><p>' + esc(ex.note) + '</p></div>';
    h += '<article class="sheet"><div class="enonce">' + d.enonce + '</div></article>';
    if (ex.res) h += scoreHtml(ex);
    h += '<article class="sheet"><h2 class="h-sec">Résultats chiffrés</h2><div class="answers">' + d.questions.map(function (q) { return qHtml(ex, q); }).join('') + '</div></article>';
    h += '<article class="sheet">';
    if (d.journal.length) {
      var eq = ex.res ? ex.res.jr.every(function (r) { return r.equilibre; }) : null;
      h += '<div class="row between"><h2 class="h-sec">' + (d.journal.length > 1 ? 'Écritures au journal' : 'Écriture au journal') + '</h2>' + (eq === null ? '' : '<span class="badge ' + (eq ? 'ok' : 'bad') + '">' + ico('scale') + (eq ? 'Équilibrée' : 'Déséquilibrée') + '</span>') + '</div>' + d.journal.map(function (en, i) { return jedHtml(ex, en, i); }).join('');
    }
    if (mode !== 'exam') {
      h += '<div class="row">';
      if (!ex.checked) h += '<button type="button" class="btn pri" data-act="check">Vérifier mes réponses</button>';
      h += '<button type="button" class="btn" data-act="corr">' + (ex.corr ? 'Masquer le corrigé' : 'Voir le corrigé') + '</button>';
      if (mode === 'train') h += '<button type="button" class="btn ghost" data-act="next">Nouvelle variante</button>';
      if (mode === 'annale') h += '<button type="button" class="btn ghost" data-act="backannales">Retour aux sujets</button>';
      h += '<button type="button" class="btn ghost" data-fiche="' + ex.typeId + '">' + ico('book') + 'Fiche</button>';
      h += '</div>';
    }
    h += '</article>';
    if (ex.corr) h += corrHtml(ex);
    return h + '</div>';
  }
  function currentEx() {
    if (S.view === 'train') return S.train;
    if (S.view === 'annales') return S.annale;
    if (S.view === 'exam' && S.exam) return S.exam.items[S.exam.cur];
    return null;
  }

  /* ---------- Vues ---------- */
  function daysTo(d) { var t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((d - t) / DAY); }
  function pips(b) { var h = '<span class="pips" role="img" aria-label="Niveau ' + b + ' sur 5">'; for (var i = 0; i < 5; i++) h += '<i class="' + (i < b ? 'on' : '') + '"></i>'; return h + '</span>'; }
  function dateTxt(d) { return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }); }
  function viewDash() {
    var el = eligible(), nEx = 0, sum = 0, due = 0, solid = 0;
    el.forEach(function (t) { var s = st(t.id); nEx += s.n; sum += s.sum; if (s.n && isDue(s)) due++; if ((s.box || 0) >= 4) solid++; });
    var cfg = EXAMS[profil()], ep = S.prog.epreuves.filter(function (e) { return e.p === profil(); });
    var h = '<section class="hero"><h1 class="h-page">' + (due ? '<mark class="hl">' + due + ' type' + (due > 1 ? 's' : '') + '</mark> à revoir aujourd’hui' : !nEx ? '<mark class="hl">' + el.length + ' types</mark> à découvrir' : 'Rien à revoir aujourd’hui') + '</h1></section>';
    h += '<div class="stats"><div class="stat"><span>Exercices corrigés</span><b>' + nEx + '</b></div><div class="stat"><span>Score moyen</span><b>' + (nEx ? Math.round(sum / nEx * 100) + ' <small>%</small>' : '—') + '</b></div><div class="stat"><span>Types maîtrisés</span><b>' + solid + ' <small>/ ' + el.length + '</small></b></div><div class="stat"><span>Épreuves blanches</span><b>' + ep.length + '</b>' + (ep.length ? '<span>dernière : ' + pct(ep[0].s) + '</span>' : '') + '</div></div>';
    h += '<section class="stack"><div class="row between"><h2 class="h-sec">À travailler maintenant</h2><button type="button" class="btn ghost sm" data-act="auto">Point faible</button></div><div class="reco">' + recommend(3).map(function (t, i) { var dc = { weak: 'bad', due: 'warn', good: 'ok', '': '' }[dotCls(t)]; return '<button type="button" data-train="' + t.id + '"' + (i === 0 ? ' class="first"' : '') + '><span class="eyebrow">' + esc(t.famille) + '</span><b>' + esc(t.nom) + '</b><span class="why"><span class="dot ' + dc + '"></span>' + esc(why(t)) + '</span>' + ico('arrow') + '</button>'; }).join('') + '</div></section>';
    h += '<article class="sheet"><h2 class="h-sec">Progression par type</h2><div class="tw"><table class="t"><thead><tr><th>Type d’exercice</th><th>Niveau</th><th class="num hide-sm">Moyenne</th><th class="num hide-sm">Dernier</th><th>Révision</th></tr></thead><tbody>';
    el.forEach(function (t) {
      var s = st(t.id), l = (s.last || [])[0], a = avg(s), nt = nextTxt(s);
      h += '<tr class="click" data-train="' + t.id + '" tabindex="0"><td><b>' + esc(t.nom) + '</b><div class="small muted">' + esc(t.famille) + (t.ctrl ? '' : ' · inspecteur') + '</div></td><td>' + pips(s.box || 0) + '</td><td class="num hide-sm">' + (a === null ? '—' : pct(a)) + '</td><td class="num hide-sm">' + (l ? pct(l.s) + ' · ' + mmss(l.t) : '—') + '</td><td><span class="badge ' + (nt === 'à revoir' ? 'warn' : (nt === 'nouveau' ? 'out' : 'ok')) + '">' + nt + '</span></td></tr>';
    });
    h += '</tbody></table></div></article>';
    if (ep.length) h += '<article class="sheet"><h2 class="h-sec">Dernières épreuves blanches</h2><div class="tw"><table class="t"><thead><tr><th>Date</th><th class="num">Score</th><th class="num">Durée</th><th class="hide-sm">Exercices</th></tr></thead><tbody>' + ep.slice(0, 6).map(function (e) { return '<tr><td>' + new Date(e.d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + '</td><td class="num"><b>' + pct(e.s) + '</b></td><td class="num">' + mmss(e.t) + '</td><td class="hide-sm small">' + e.x.map(function (x) { return esc((T[x.id] || { nom: x.id }).nom) + ' (' + pct(x.s) + ')'; }).join(', ') + '</td></tr>'; }).join('') + '</tbody></table></div></article>';
    h += '<article class="sheet"><h2 class="h-sec">Compte et synchronisation</h2><p class="small muted" id="store"></p><div id="acct"></div></article>';
    h += '<article class="sheet"><h2 class="h-sec">Réglages</h2>';
    h += '<div class="seg-row"><span>Programme</span><div class="seg" role="group" aria-label="Programme"><button type="button" data-p="I" aria-pressed="' + (profil() === 'I') + '">Inspecteur</button><button type="button" data-p="C" aria-pressed="' + (profil() === 'C') + '">Contrôleur</button></div></div>';
    h += '<div class="seg-row"><span>Comptes affichés dans les corrigés</span><div class="seg" role="group" aria-label="Plan comptable"><button type="button" data-pcg="0" aria-pressed="' + !S.prog.settings.pcgOld + '">PCG 2025 (657, 757)</button><button type="button" data-pcg="1" aria-pressed="' + !!S.prog.settings.pcgOld + '">Ancien PCG (675, 775)</button></div></div>';
    h += S.confirmReset ? '<div class="confirm"><span>Effacer toute la progression ? Cette action est définitive.</span><button type="button" class="btn sm danger" data-act="resetyes">Effacer</button><button type="button" class="btn sm" data-act="resetno">Annuler</button></div>' : '<div class="row"><button type="button" class="btn sm danger" data-act="reset">Effacer ma progression</button></div>';
    return h + '</article>';
  }
  function dotCls(t) { var s = st(t.id), l = (s.last || [])[0]; if (!s.n) return ''; if (l && l.s < 0.6) return 'weak'; if (isDue(s)) return 'due'; return 'good'; }
  function viewTrain() {
    var el = eligible();
    if (S.trainType && !el.some(function (t) { return t.id === S.trainType; })) { S.trainType = null; S.train = null; }
    if (!S.train) { S.trainType = recommend(1)[0].id; S.train = makeEx(S.trainType); }
    var h = '';
    var fams = []; el.forEach(function (t) { if (fams.indexOf(t.famille) < 0) fams.push(t.famille); });
    var sel = '<select class="input pick" id="pick-type" aria-label="Type d’exercice">' + fams.map(function (f) {
      return '<optgroup label="' + esc(f) + '">' + el.filter(function (t) { return t.famille === f; }).map(function (t) { return '<option value="' + t.id + '"' + (S.trainType === t.id ? ' selected' : '') + '>' + esc(t.nom) + ' · ' + nextTxt(st(t.id)) + '</option>'; }).join('') + '</optgroup>';
    }).join('') + '</select>';
    h += '<div class="sheet tight"><div class="row pickrow">' + sel + '<button type="button" class="btn" data-act="picked">Nouvel exercice</button><button type="button" class="btn pri" data-act="auto">Point faible</button></div></div>';
    if (S.train) h += exHtml(S.train, 'train');
    return h;
  }
  function acctHtml(x) {
    var m = /^(\d[\d \/]*\d|\d)\s+(.+)$/.exec(x);
    return m ? '<span><b>' + esc(m[1]) + '</b>' + esc(m[2]) + '</span>' : '<span>' + esc(x) + '</span>';
  }
  function viewFiches() {
    var el = eligible(), fams = [];
    el.forEach(function (t) { if (fams.indexOf(t.famille) < 0) fams.push(t.famille); });
    if (!S.fiche || !el.some(function (t) { return t.id === S.fiche; })) S.fiche = el[0].id;
    var cur = T[S.fiche], fi = cur.fiche;
    var h = '<div class="fl"><nav class="sheet tight toc-wrap" aria-label="Fiches">';
    h += '<select class="input" id="pick-fiche" aria-label="Choisir une fiche">' + fams.map(function (f) {
      return '<optgroup label="' + esc(f) + '">' + el.filter(function (t) { return t.famille === f; }).map(function (t) { return '<option value="' + t.id + '"' + (t.id === S.fiche ? ' selected' : '') + '>' + esc(t.nom) + '</option>'; }).join('') + '</optgroup>';
    }).join('') + '</select>';
    h += '<div class="toc">' + fams.map(function (f) {
      return '<h4>' + esc(f) + '</h4>' + el.filter(function (t) { return t.famille === f; }).map(function (t) { return '<a href="#fiches" data-fiche="' + t.id + '"' + (t.id === S.fiche ? ' aria-current="true"' : '') + '>' + esc(t.nom) + ' <span class="badge mono">' + t.minutes + ' min</span></a>'; }).join('');
    }).join('') + '</div></nav>';
    h += '<article class="sheet"><div class="reading"><div class="hero"><span class="eyebrow">Fiche · ' + esc(cur.famille) + '</span><h1 class="h-page">' + esc(cur.nom) + '</h1><p class="lede">' + esc(fi.objectif) + '</p></div>';
    h += '<h4>Étapes</h4><ol class="steps">' + fi.etapes.map(function (x) { return '<li><span>' + esc(x) + '</span></li>'; }).join('') + '</ol>';
    h += '<h4>Pièges</h4><ul class="traps">' + fi.pieges.map(function (x) { return '<li>' + ico('cross') + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul>';
    if (fi.comptes.length) h += '<h4>Comptes</h4><div class="accts">' + fi.comptes.map(acctHtml).join('') + '</div>';
    h += '<div class="row" style="margin-top:8px"><button type="button" class="btn pri" data-train="' + cur.id + '">S’entraîner sur ce type · ' + cur.minutes + ' min</button><span class="small muted">Ton niveau : ' + pips(st(cur.id).box || 0) + '</span></div>';
    return h + '</div></article></div>';
  }
  function viewAnnales() {
    if (S.annale) return exHtml(S.annale, 'annale');
    var list = ANNALES.filter(function (a) { return profil() === 'I' || a.ctrl; });
    var h = '<section class="hero"><h1 class="h-page">Sujets réels</h1></section><article class="sheet"><div class="tw"><table class="t"><thead><tr><th>Sujet</th><th class="hide-sm">Type</th><th></th></tr></thead><tbody>';
    list.forEach(function (a) { h += '<tr><td><b>' + esc(a.p.nom) + '</b><div class="small muted">' + esc(a.src) + '</div></td><td class="hide-sm">' + esc(T[a.type].nom) + '</td><td class="r"><button type="button" class="btn sm" data-annale="' + a.id + '">Faire</button></td></tr>'; });
    return h + '</tbody></table></div></article>';
  }
  function viewExam() {
    var cfg = EXAMS[profil()], E = S.exam;
    if (!E) {
      return '<section class="hero"><span class="eyebrow">Épreuve blanche · ' + cfg.label + '</span><h1 class="h-page">' + cfg.txt + '</h1></section><div class="row"><button type="button" class="btn pri" data-act="startexam">Commencer l’épreuve ' + ico('arrow') + '</button></div>';
    }
    var h = '<div class="exambar"><div class="row">';
    var rem = E.done ? 0 : E.dur - (Date.now() - E.start) / 1000;
    h += E.done ? '<span class="big">' + pct(E.score) + '</span>' : '<span class="clock" title="Temps restant">' + ico('clock') + '<span id="cd">' + mmss(rem) + '</span></span>';
    h += '<div class="pills">' + E.items.map(function (x, i) { return '<button type="button" data-pill="' + i + '" aria-current="' + (i === E.cur) + '">' + (i + 1) + '. ' + esc(COURT[x.typeId] || x.typeId) + (E.done ? ' · ' + pct(x.res.score) : '') + '</button>'; }).join('') + '</div></div>';
    h += E.done ? '<button type="button" class="btn sm" data-act="newexam">Nouvelle épreuve</button>' : '<button type="button" class="btn sm" data-act="submit">Rendre la copie</button>';
    h += '</div>';
    if (E.done) {
      h += '<article class="sheet"><h2 class="h-sec">Résultat de l’épreuve</h2><div class="tw"><table class="t"><thead><tr><th>Exercice</th><th class="num">Score</th><th class="num">Temps passé</th></tr></thead><tbody>' + E.items.map(function (x, i) { return '<tr class="click" data-pill="' + i + '"><td>' + (i + 1) + '. ' + esc(T[x.typeId].nom) + '</td><td class="num">' + pct(x.res.score) + '</td><td class="num">' + mmss(E.spent[i]) + '</td></tr>'; }).join('') + '<tr class="tot"><td>Total</td><td class="num">' + pct(E.score) + '</td><td class="num">' + mmss(E.used) + ' / ' + cfg.min + ':00</td></tr></tbody></table></div></article>';
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
    document.querySelectorAll('#tabs [data-v], #bottomnav [data-v]').forEach(function (b) { if (b.dataset.v === S.view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    var cfg = EXAMS[profil()], j = daysTo(cfg.date);
    $('#stamp').innerHTML = '<b>' + (j > 0 ? 'J-' + j : 'Jour J') + '</b>'; $('#stamp').title = 'Écrit ' + cfg.label + ' · ' + dateTxt(cfg.date);
    var v = $('#view');
    v.innerHTML = S.view === 'dash' ? viewDash() : S.view === 'train' ? viewTrain() : S.view === 'fiches' ? viewFiches() : S.view === 'annales' ? viewAnnales() : viewExam();
    document.querySelectorAll('[data-p]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.p === profil())); });
    if (S.view === 'dash') { status(); if (window.PrepaSync) PrepaSync.mount($('#acct')); }
    measure();
  }
  function measure() { var t = $('.appbar'); if (t) document.documentElement.style.setProperty('--hh', t.offsetHeight + 'px'); }
  function startTrain(id) { S.view = 'train'; S.trainType = id; S.train = makeEx(id); render(); var a = $('#ex' + S.train.uid); if (a) a.scrollIntoView({ block: 'start' }); }
  function go(v) { S.view = v; S.confirmReset = false; render(); window.scrollTo(0, 0); }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('button, a[data-v], a[data-fiche], tr[data-train], tr[data-pill]'); if (!b) return;
    var ds = b.dataset, ex = currentEx();
    if (b.tagName === 'A') ev.preventDefault();
    if (ds.v) return go(ds.v);
    if (ds.fiche) { S.fiche = ds.fiche; return go('fiches'); }
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
    if (t.id === 'pick-fiche') { if (ev.type === 'change') { S.fiche = t.value; render(); } return; }
    var ex = currentEx(); if (!ex || ex.checked) return;
    if (t.dataset.q) ex.answers[t.dataset.q] = t.value;
    else if (t.dataset.j !== undefined && t.dataset.f) {
      ex.jl[Number(t.dataset.j)][Number(t.dataset.r)][t.dataset.f] = t.value;
      // Intitulé du compte et pied d'équilibre suivent la saisie
      if (t.dataset.f === 'a') { var sm = t.nextElementSibling; if (sm) sm.textContent = U.lib(t.value.trim()); }
      var jf = $('#jf' + ex.uid + '-' + t.dataset.j); if (jf) jf.innerHTML = footHtml(ex, Number(t.dataset.j));
    }
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
