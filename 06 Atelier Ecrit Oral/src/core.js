/* ===== Logique sans interface : état, fusion, chrono, notes (testée par test/test.js) ===== */
var CORE = (function () {
  'use strict';
  function num(x) { x = Number(x); return isFinite(x) ? x : 0; }
  function isObj(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function uid(p) { return (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function clone(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }

  /* ---------- État synchronisable ----------
     settings : profil choisi ; cur : entraînement écrit en cours (ou null) ;
     ecrits / oraux : entrées indexées par id. Chaque objet porte updatedAt :
     la fusion garde la version la plus récente. Une suppression est une
     entrée marquée deleted (pierre tombale), pour qu’elle se propage. */
  function blank() {
    return { v: 1, app: 'atelier', settings: { profil: 'I', updatedAt: 0 }, cur: { run: null, updatedAt: 0 }, ecrits: {}, oraux: {} };
  }
  function normalize(p) {
    var b = blank();
    if (!isObj(p)) return b;
    if (isObj(p.settings)) b.settings = { profil: p.settings.profil === 'C' ? 'C' : 'I', updatedAt: num(p.settings.updatedAt) };
    if (isObj(p.cur)) b.cur = { run: isObj(p.cur.run) ? p.cur.run : null, updatedAt: num(p.cur.updatedAt) };
    ['ecrits', 'oraux'].forEach(function (k) {
      var src = p[k], add = function (e) { if (isObj(e) && typeof e.id === 'string' && e.id) b[k][e.id] = e; };
      if (Array.isArray(src)) src.forEach(add);
      else if (isObj(src)) Object.keys(src).forEach(function (id) { add(src[id]); });
    });
    return b;
  }
  // Texte JSON à clés triées : sert à comparer deux états et à départager deux versions de même date.
  function stable(o) {
    if (Array.isArray(o)) return '[' + o.map(stable).join(',') + ']';
    if (isObj(o)) return '{' + Object.keys(o).sort().map(function (k) { return JSON.stringify(k) + ':' + stable(o[k]); }).join(',') + '}';
    return JSON.stringify(o === undefined ? null : o);
  }
  // Version gagnante entre locale (a) et distante (b) : la plus récente ; à égalité, une règle fixe pour que tous les appareils convergent.
  function pick(a, b) {
    if (!a) return b; if (!b) return a;
    var ta = num(a.updatedAt), tb = num(b.updatedAt);
    if (ta !== tb) return tb > ta ? b : a;
    return stable(b) > stable(a) ? b : a;
  }
  // Fusion idempotente et commutative : merge(merge(L, R), R) = merge(L, R).
  function merge(local, remote) {
    var L = normalize(clone(local)), R = normalize(clone(remote));
    ['ecrits', 'oraux'].forEach(function (k) {
      Object.keys(R[k]).forEach(function (id) { L[k][id] = pick(L[k][id], R[k][id]); });
    });
    L.settings = pick(L.settings, R.settings);
    L.cur = pick(L.cur, R.cur);
    return L;
  }
  function same(a, b) { return stable(normalize(a)) === stable(normalize(b)); }
  function live(map) {
    return Object.keys(map || {}).map(function (k) { return map[k]; }).filter(function (e) { return e && !e.deleted; })
      .sort(function (x, y) { return num(x.date) - num(y.date); });
  }

  /* ---------- Chrono par horodatages (survit au rechargement) ---------- */
  function elapsed(run, now) {
    if (!run) return 0;
    var end = run.endedAt || run.pausedAt || now;
    return Math.max(0, (end - run.start - num(run.pausedMs)) / 1000);
  }
  function pause(run, now) { if (run && !run.pausedAt && !run.endedAt) run.pausedAt = now; return run; }
  function resume(run, now) { if (run && run.pausedAt) { run.pausedMs = num(run.pausedMs) + (now - run.pausedAt); run.pausedAt = null; } return run; }
  function finish(run, now) { if (run && !run.endedAt) { resume(run, now); run.endedAt = now; } return run; }
  // Reprendre après avoir rendu la copie par erreur : le temps passé hors chrono compte comme une pause.
  function reopen(run, now) { if (run && run.endedAt) { run.pausedMs = num(run.pausedMs) + (now - run.endedAt); run.endedAt = null; } return run; }
  // Fin cumulée de chaque étape, en secondes
  function ends(phases) { var c = 0; return phases.map(function (p) { c += p.min * 60; return c; }); }
  // Étape conseillée à l’instant t (en secondes) ; vaut phases.length une fois le temps écoulé
  function phaseAt(phases, t) {
    var e = ends(phases);
    for (var i = 0; i < e.length; i++) if (t < e[i]) return i;
    return phases.length;
  }

  /* ---------- Notes ---------- */
  // Grille écrite : niveau 0 à 4 par critère, pondéré par w ; total sur 20 si les poids font 20.
  function gridNote(grid, scores) {
    var s = 0, n = 0, max = 0;
    grid.forEach(function (c) {
      max += c.w;
      var v = scores ? scores[c.id] : undefined;
      if (typeof v === 'number' && v >= 0) { s += c.w * Math.min(4, v) / 4; n++; }
    });
    return { note: Math.round(s * 100) / 100, rated: n, total: grid.length, max: max };
  }
  // Auto-évaluation de l’oral : niveaux 1 à 4 ; moyenne ramenée sur 20.
  function oralNote(crit, scores) {
    var s = 0, n = 0;
    crit.forEach(function (c) { var v = scores ? scores[c.id] : undefined; if (typeof v === 'number' && v >= 1) { s += Math.min(4, v); n++; } });
    return { note: n ? Math.round(s / n * 5 * 10) / 10 : null, rated: n, total: crit.length };
  }

  /* ---------- Tirage pondéré : favorise les questions peu travaillées ---------- */
  function draw(list, counts, avoid, rnd) {
    rnd = rnd || Math.random;
    var pool = list.filter(function (q) { return (avoid || []).indexOf(q.id) < 0; });
    if (!pool.length) pool = list.slice();
    if (!pool.length) return null;
    var ws = pool.map(function (q) { return 1 / (1 + num(counts && counts[q.id])); });
    var tot = ws.reduce(function (a, b) { return a + b; }, 0), x = rnd() * tot;
    for (var i = 0; i < pool.length; i++) { x -= ws[i]; if (x <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }

  /* ---------- Formats français ---------- */
  function dec(x, d) {
    if (x === null || x === undefined || !isFinite(x)) return '—';
    var s = Number(x).toFixed(d === undefined ? 2 : d);
    if (d === undefined) s = s.replace(/\.?0+$/, '');
    return s.replace('.', ',');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function clock(sec) { sec = Math.max(0, Math.floor(sec)); var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(s); }
  function hm(min) { min = Math.round(min); var h = Math.floor(min / 60), m = min % 60; return h ? h + ' h' + (m ? ' ' + pad(m) : '') : m + ' min'; }
  function dur(sec) { return sec < 3600 ? Math.max(0, Math.round(sec / 60)) + ' min' : hm(sec / 60); }

  return { num: num, uid: uid, clone: clone, blank: blank, normalize: normalize, stable: stable, pick: pick, merge: merge, same: same, live: live,
    elapsed: elapsed, pause: pause, resume: resume, finish: finish, reopen: reopen, ends: ends, phaseAt: phaseAt,
    gridNote: gridNote, oralNote: oralNote, draw: draw, dec: dec, clock: clock, hm: hm, dur: dur, pad: pad };
})();
if (typeof module !== 'undefined') module.exports = CORE;
