/* ===== Interface ===== */
(function () {
  'use strict';
  var C = CORE, D = DATA;
  var KEY = 'atelier-ecrit-oral-v1', UIKEY = 'atelier-ecrit-oral-ui', TITLE = document.title || 'Atelier écrit et oral';
  var VIEWS = ['ecrit', 'oral', 'progres', 'reperes'];
  var S = C.blank();                                    // état synchronisable
  var UI = { view: 'ecrit', cat: 'all', dur: 180, hist: '', sujet: {}, libre: '', oq: '', recent: [], trans: true }; // préférences de cet appareil
  var T = { open: {}, confirm: null, saved: null, lastPhase: null, over: false, oral: null, att: null, rec: null, micErr: null,
    oscores: {}, ocomment: '', oeval: false, osaved: null, olimitHit: false, pending: false, more: 0, trans: '', interim: '', tr: null, trErr: null };
  var QBY = {}; D.Q.forEach(function (q) { QBY[q.id] = q; });
  var CATBY = {}; D.CATS.forEach(function (c) { CATBY[c.id] = c; });

  /* ---------- Outils ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // Typographie française : espaces insécables avant les signes doubles et les unités, espace fine entre milliers
  function ty(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/(\d) (?=\d{3}(?!\d))/g, '$1 ')
      .replace(/ ([%€:;?!»])/g, ' $1').replace(/« /g, '« ')
      .replace(/(\d) (h|min|Md€|M€|pages?|documents?|lignes|minutes|heures)(?![\w])/g, '$1 $2')
      .replace(/(\d h) (\d)/g, '$1 $2').replace(/\bp\. (\d)/g, 'p. $1').replace(/\bn° (\d)/g, 'n° $1');
  }
  function tx(s) { return esc(ty(s)); }
  function num(x) { return C.dec(x); }
  function note20(x) { return x === null || x === undefined ? '—' : C.dec(x); }
  function fdate(ts, long) {
    var d = new Date(ts), o = { day: 'numeric', month: long ? 'long' : 'short' };
    if (d.getFullYear() !== new Date().getFullYear()) o.year = 'numeric';
    return d.toLocaleDateString('fr-FR', o);
  }
  function fhour(ts) { var d = new Date(ts); return d.getHours() + ' h ' + C.pad(d.getMinutes()); }
  function daysTo(d) { var t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((d - t) / 86400000); }
  function profil() { return S.settings.profil === 'C' ? 'C' : 'I'; }
  function epOf(p) { return D.EP[p === 'C' ? 'ad' : 'nds']; }
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }
  function toast(m) { var t = $('#toast'); if (!t) return; t.textContent = m; t.hidden = false; clearTimeout(T.toastT); T.toastT = setTimeout(function () { t.hidden = true; }, 4500); }

  // Pictogrammes de la charte (trait 1,8 px, 24 × 24)
  var ICO = {
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    cross: '<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
    alert: '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4.5M12 17v.2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    play: '<path d="M8 5.5v13l10-6.5z"/>',
    pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
    stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/>',
    mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5M9 20.5h6"/>',
    shuffle: '<path d="M4 7h3.5c4 0 5 10 9 10H20M4 17h3.5c1.6 0 2.7-1.6 3.6-3.5M14 10.5c.9-1.9 2-3.5 3.5-3.5H20M17.5 4.5 20 7l-2.5 2.5M17.5 14.5 20 17l-2.5 2.5"/>',
    file: '<path d="M6.5 3.5h7l4 4v13h-11z"/><path d="M13.5 3.5v4h4M9 12.5h6M9 15.5h6"/>',
    trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13"/>',
    flag: '<path d="M5.5 21V4.5M5.5 5h11l-2 4 2 4h-11"/>',
    book: '<path d="M4.5 5.5c2.5-1 5-1 7.5.5v13c-2.5-1.5-5-1.5-7.5-.5zM19.5 5.5c-2.5-1-5-1-7.5.5v13c2.5-1.5 5-1.5 7.5-.5z"/>',
    redo: '<path d="M5 12a7 7 0 1 0 2.1-5M5 4.5V8h3.5"/>',
    minus: '<path d="M6 12h12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  function ico(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICO[n] + '</svg>'; }

  // Lien vers la page citée du PDF
  function srcLink(ref) {
    var a = String(ref).split(':'), s = D.SRC[a[0]]; if (!s) return '';
    return '<a href="' + esc(s.pdf + (a[1] ? '#page=' + a[1] : '')) + '" target="_blank" rel="noopener">' + esc(s.t) + (a[1] ? ', p. ' + esc(a[1]) : '') + '</a>';
  }
  // Sources repliées : un petit « Sources » à déplier, pour ne pas surcharger la lecture
  function srcs(list) {
    list = [].concat(list || []).filter(Boolean);
    return list.length ? '<details class="src"><summary>' + ico('book') + '<span>Source' + (list.length > 1 ? 's' : '') + '</span></summary><span class="srcl">' + list.map(srcLink).join('<span aria-hidden="true">·</span>') + '</span></details>' : '';
  }
  function pdfBtn(href, label, cls) { return '<a class="btn sm' + (cls ? ' ' + cls : '') + '" href="' + esc(href) + '" target="_blank" rel="noopener">' + ico('file') + tx(label) + '</a>'; }
  function confirmBox(msg, yes, yesLabel) { return '<div class="confirm" role="alert"><span>' + tx(msg) + '</span><button type="button" class="btn sm danger" data-act="' + yes + '">' + tx(yesLabel) + '</button><button type="button" class="btn sm" data-act="cancel">Annuler</button></div>'; }
  function profSeg(label) {
    var p = profil();
    return '<div class="seg-row"><span class="small muted">' + tx(label || 'Concours') + '</span><div class="seg wide" role="group" aria-label="Concours"><button type="button" data-p="I" aria-pressed="' + (p === 'I') + '">Inspecteur</button><button type="button" data-p="C" aria-pressed="' + (p === 'C') + '">Contrôleur</button></div></div>';
  }

  /* ---------- Stockage local (protégé) et synchronisation facultative ---------- */
  var Store = {
    load: function () {
      try { var s = localStorage.getItem(KEY); if (s) S = C.normalize(JSON.parse(s)); } catch (e) { S = C.blank(); }
      try {
        var u = JSON.parse(localStorage.getItem(UIKEY) || 'null');
        if (u && typeof u === 'object') Object.keys(UI).forEach(function (k) { if (u[k] !== undefined && typeof u[k] === typeof UI[k]) UI[k] = u[k]; });
      } catch (e) { }
      if (VIEWS.indexOf(UI.view) < 0) UI.view = 'ecrit';
      if (!(UI.dur >= 30 && UI.dur <= 900)) UI.dur = 180;
      if (!Array.isArray(UI.recent)) UI.recent = [];
      if (!UI.sujet || typeof UI.sujet !== 'object') UI.sujet = {};
    },
    saveLocal: function () { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } },
    save: function () { this.saveLocal(); Sync.changed(); },
    saveUI: function () { try { localStorage.setItem(UIKEY, JSON.stringify(UI)); } catch (e) { } }
  };
  // Branchement facultatif : window.PrepaSync (fourni à part). Les enregistrements audio n’en font jamais partie.
  var Sync = {
    on: false,
    attach: function () {
      if (Sync.on || !window.PrepaSync || typeof window.PrepaSync.attach !== 'function') return;
      Sync.on = true;
      try {
        window.PrepaSync.attach('atelier', {
          get: function () { return C.clone(S); },
          merge: function (remote) {
            // Fusionne, sauvegarde et réaffiche, sans rappeler changed() (contrat de commun/sync.js)
            var m = C.merge(S, remote);
            if (!C.same(m, S)) { S = m; Store.saveLocal(); softRender(); }
          }
        });
      } catch (e) { Sync.on = false; }
    },
    changed: function () { if (!Sync.on) return; try { window.PrepaSync.changed('atelier'); } catch (e) { } }
  };

  /* ---------- Enregistrements audio : IndexedDB, sur cet appareil seulement ---------- */
  var AudioDB = {
    p: null, db: null, mem: { meta: [], data: {} },
    open: function () {
      if (AudioDB.p) return AudioDB.p;
      AudioDB.p = new Promise(function (res) {
        var done = function (db) { AudioDB.db = db; res(db); };
        try {
          if (!window.indexedDB) return done(null);
          var rq = indexedDB.open('atelier-ecrit-oral-audio', 1);
          rq.onupgradeneeded = function () {
            var db = rq.result;
            if (!db.objectStoreNames.contains('meta')) { var m = db.createObjectStore('meta', { keyPath: 'id' }); m.createIndex('qid', 'qid'); m.createIndex('aid', 'aid'); }
            if (!db.objectStoreNames.contains('data')) db.createObjectStore('data', { keyPath: 'id' });
          };
          rq.onsuccess = function () { done(rq.result); };
          rq.onerror = function () { done(null); };
          rq.onblocked = function () { done(null); };
        } catch (e) { done(null); }
      });
      return AudioDB.p;
    },
    persistent: function () { return !!AudioDB.db; },
    add: function (meta, blob) {
      return toBuf(blob).then(function (buf) {
        meta.size = buf.byteLength;
        return AudioDB.open().then(function (db) {
          var mem = function () { AudioDB.mem.meta.push(meta); AudioDB.mem.data[meta.id] = buf; return meta; };
          if (!db) return mem();
          return new Promise(function (res) {
            try {
              var t = db.transaction(['meta', 'data'], 'readwrite');
              t.objectStore('meta').put(meta); t.objectStore('data').put({ id: meta.id, data: buf });
              t.oncomplete = function () { res(meta); };
              t.onerror = t.onabort = function () { res(mem()); };
            } catch (e) { res(mem()); }
          });
        });
      });
    },
    list: function (field, value) {
      var fromMem = AudioDB.mem.meta.filter(function (m) { return !field || m[field] === value; });
      return AudioDB.open().then(function (db) {
        if (!db) return fromMem;
        return new Promise(function (res) {
          var out = [];
          try {
            var t = db.transaction('meta', 'readonly'), st = t.objectStore('meta');
            var rq = field ? st.index(field).openCursor(IDBKeyRange.only(value)) : st.openCursor();
            rq.onsuccess = function () { var c = rq.result; if (c) { out.push(c.value); c.continue(); } };
            t.oncomplete = function () { res(out.concat(fromMem)); };
            t.onerror = t.onabort = function () { res(fromMem); };
          } catch (e) { res(fromMem); }
        });
      }).then(function (l) { return l.sort(function (a, b) { return b.created - a.created; }); });
    },
    get: function (id) {
      if (AudioDB.mem.data[id]) return Promise.resolve(AudioDB.mem.data[id]);
      return AudioDB.open().then(function (db) {
        if (!db) return null;
        return new Promise(function (res) {
          try { var rq = db.transaction('data', 'readonly').objectStore('data').get(id); rq.onsuccess = function () { res(rq.result ? rq.result.data : null); }; rq.onerror = function () { res(null); }; } catch (e) { res(null); }
        });
      });
    },
    del: function (ids) {
      ids = [].concat(ids);
      AudioDB.mem.meta = AudioDB.mem.meta.filter(function (m) { return ids.indexOf(m.id) < 0; });
      ids.forEach(function (id) { delete AudioDB.mem.data[id]; });
      return AudioDB.open().then(function (db) {
        if (!db || !ids.length) return;
        return new Promise(function (res) {
          try { var t = db.transaction(['meta', 'data'], 'readwrite'); ids.forEach(function (id) { t.objectStore('meta').delete(id); t.objectStore('data').delete(id); }); t.oncomplete = t.onerror = t.onabort = function () { res(); }; } catch (e) { res(); }
        });
      });
    },
    clear: function () {
      AudioDB.mem = { meta: [], data: {} };
      return AudioDB.open().then(function (db) {
        if (!db) return;
        return new Promise(function (res) {
          try { var t = db.transaction(['meta', 'data'], 'readwrite'); t.objectStore('meta').clear(); t.objectStore('data').clear(); t.oncomplete = t.onerror = t.onabort = function () { res(); }; } catch (e) { res(); }
        });
      });
    }
  };
  function toBuf(blob) {
    if (blob.arrayBuffer) return blob.arrayBuffer();
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; r.readAsArrayBuffer(blob); });
  }

  /* ---------- Micro : MediaRecorder ---------- */
  var MIC = {
    insecure: 'Le micro n’est accessible que sur une page sécurisée (https) ou servie en local (localhost). Le chrono et l’auto-évaluation restent disponibles.',
    unsupported: 'Ce navigateur ne permet pas d’enregistrer le son. Essaie une version récente de Chrome, Edge, Firefox ou Safari (iOS 14.3 ou plus). Le chrono et l’auto-évaluation restent disponibles.',
    denied: 'Accès au micro refusé. Pour enregistrer, autorise le micro pour ce site dans les réglages du navigateur, puis réessaie.',
    nomic: 'Aucun micro détecté sur cet appareil.',
    busy: 'Le micro est déjà utilisé par une autre application.',
    error: 'L’enregistrement n’a pas pu démarrer. Réessaie, ou réponds sans enregistrer.'
  };
  var Rec = {
    support: function () {
      if (window.isSecureContext === false) return 'insecure';
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof window.MediaRecorder === 'undefined') return 'unsupported';
      return 'ok';
    },
    mime: function () {
      var c = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg;codecs=opus'];
      try { if (!MediaRecorder.isTypeSupported) return ''; for (var i = 0; i < c.length; i++) if (MediaRecorder.isTypeSupported(c[i])) return c[i]; } catch (e) { }
      return '';
    },
    start: function () {
      var q = curQ(); if (T.rec || !q || !T.att) return;
      var sup = Rec.support(); if (sup !== 'ok') { T.micErr = sup; return render(); }
      T.micErr = null;
      var me = T.rec = { state: 'asking', qid: q.id, aid: T.att.aid };
      updRec();
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        var stopTracks = function () { stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) { } }); };
        if (T.rec !== me) return stopTracks();            // annulé entre-temps
        var mt = Rec.mime(), mr;
        try { mr = mt ? new MediaRecorder(stream, { mimeType: mt }) : new MediaRecorder(stream); }
        catch (e) { try { mr = new MediaRecorder(stream); } catch (e2) { stopTracks(); T.rec = null; T.micErr = 'unsupported'; return render(); } }
        var chunks = [];
        mr.ondataavailable = function (ev) { if (ev.data && ev.data.size) chunks.push(ev.data); };
        mr.onstop = function () {
          stopTracks();
          if (T.rec === me) T.rec = null;
          var type = (mr.mimeType || mt || (chunks[0] && chunks[0].type) || 'audio/webm').split(';')[0];
          var blob = new Blob(chunks, { type: type });
          updRec();
          if (!blob.size) return;
          var meta = { id: C.uid('r'), qid: me.qid, aid: me.aid, created: me.t0, dur: Math.round((Date.now() - me.t0) / 1000), mime: type };
          AudioDB.add(meta, blob).then(function () { refreshRecs(); if (!AudioDB.persistent()) toast('Enregistrement gardé jusqu’à la fermeture de la page : ce navigateur ne permet pas de le conserver.'); }, function () { toast('L’enregistrement n’a pas pu être conservé.'); });
        };
        mr.onerror = function () { try { mr.stop(); } catch (e) { stopTracks(); T.rec = null; updRec(); } };
        me.state = 'rec'; me.mr = mr; me.t0 = Date.now();
        try { mr.start(1000); } catch (e) { stopTracks(); T.rec = null; T.micErr = 'error'; return render(); }
        updRec();
      }).catch(function (err) {
        if (T.rec === me) T.rec = null;
        var n = err && err.name;
        T.micErr = (n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError') ? 'denied' : (n === 'NotFoundError' || n === 'DevicesNotFoundError') ? 'nomic' : (n === 'NotReadableError') ? 'busy' : 'error';
        render();
      });
    },
    stop: function () {
      var r = T.rec; if (!r) return;
      if (r.mr && r.mr.state !== 'inactive') { try { r.mr.stop(); } catch (e) { T.rec = null; } }
      else T.rec = null;
      updRec();
    }
  };

  /* ---------- Rendu ---------- */
  function editing() { var a = document.activeElement; return !!a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && a.type === 'text')) && !!a.closest('#view'); }
  function softRender() { if (editing()) { T.pending = true; return; } render(); }
  function render() {
    T.pending = false;
    document.querySelectorAll('#tabs [data-v], #bottomnav [data-v]').forEach(function (b) { if (b.dataset.v === UI.view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    var ex = D.EXAMS[profil()], d = new Date(ex.date[0], ex.date[1], ex.date[2]), j = daysTo(d), st = $('#stamp');
    st.hidden = j < 0;
    st.innerHTML = '<span>Écrit</span><b>' + (j > 0 ? 'J-' + j : 'Jour J') + '</b>';
    st.title = 'Écrit ' + ex.label + ' · ' + d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    document.querySelectorAll('#profil [data-p]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.p === profil())); });
    var v = $('#view');
    v.innerHTML = UI.view === 'oral' ? viewOral() : UI.view === 'progres' ? viewProgres() : UI.view === 'reperes' ? viewReperes() : viewEcrit();
    measure();
    if (UI.view === 'oral') { refreshRecs(); updRec(); }
    if (UI.view === 'progres') { drawChart(); fillAnswerRecs(); fillAudioInfo(); }
    tick(true);
  }
  function measure() { var t = $('.appbar'); if (t) document.documentElement.style.setProperty('--hh', t.offsetHeight + 'px'); }
  function go(v) {
    if (VIEWS.indexOf(v) < 0) v = 'ecrit';
    if (v !== 'oral' && T.rec) Rec.stop();
    if (v !== 'oral') Trans.stop();
    UI.view = v; T.confirm = null; Store.saveUI();
    try { history.replaceState(null, '', '#' + v); } catch (e) { }
    render(); window.scrollTo(0, 0);
  }

  /* ===== Écrit ===== */
  function sujetsOf(ep) { return D.SUJETS.filter(function (s) { return s.ep === ep.id || s.ep === '*'; }); }
  function sujetBy(id) { return D.SUJETS.filter(function (s) { return s.id === id; })[0] || null; }
  function selSujet(ep) { var l = sujetsOf(ep), id = UI.sujet[ep.id]; return l.filter(function (s) { return s.id === id; })[0] || l[0]; }
  function titreOf(e) { var s = sujetBy(e.sujet); return s && s.libre ? (e.titre || 'Sujet libre') : (s ? s.titre : 'Sujet'); }
  function entries(ep) { return C.live(S.ecrits).filter(function (e) { return !ep || e.ep === ep; }); }

  function viewEcrit() {
    var run = S.cur.run;
    if (run && D.EP[run.ep]) return run.endedAt ? viewGrade(run) : viewRun(run);
    if (T.saved && S.ecrits[T.saved] && !S.ecrits[T.saved].deleted) return viewSaved(S.ecrits[T.saved]);
    return viewEcritHome();
  }
  // Répartition du temps : une frise proportionnelle, puis les étapes en grille compacte
  function phasesList(ep) {
    var tot = ep.phases.reduce(function (a, ph) { return a + ph.min; }, 0), last = -1;
    var bar = '<div class="tline" role="img" aria-label="' + esc('Répartition conseillée de ' + C.hm(tot)) + '">' + ep.phases.map(function (ph) { return '<i class="' + (ph.p ? 'p2' : '') + '" style="flex:' + ph.min + '" title="' + esc(ty(ph.t) + ' · ' + C.hm(ph.min)) + '"></i>'; }).join('') + '</div>';
    var li = '';
    ep.phases.forEach(function (ph) {
      if (ep.parts && ph.p !== last) { last = ph.p; li += '<li class="tp">' + tx(ep.parts[ph.p]) + '</li>'; }
      li += '<li><span>' + tx(ph.t) + '</span><span class="mono">' + tx(C.hm(ph.min)) + '</span></li>';
    });
    return bar + '<ol class="tsteps">' + li + '</ol>';
  }
  function viewEcritHome() {
    var p = profil(), ep = epOf(p), list = sujetsOf(ep), sel = selSujet(ep), last = entries(ep.id).slice(-1)[0];
    var h = '<section class="hero"><span class="eyebrow">Écrit n° 1 · concours ' + tx(ep.concours) + '</span><h1 class="h-page">' + tx(ep.nom) + '</h1></section>';
    h += profSeg();
    h += '<div class="stats"><div class="stat"><span>Durée</span><b>' + tx(C.hm(ep.min)) + '</b></div><div class="stat"><span>Coefficient</span><b>' + ep.coef + '</b></div><div class="stat"><span>Note éliminatoire</span><b>&lt; 5 <small>/ 20</small></b></div>';
    h += '<div class="stat"><span>Ta dernière note</span><b>' + (last ? note20(last.note) + ' <small>/ 20</small>' : '—') + '</b>' + (last ? '<span>' + tx(fdate(last.date)) + '</span>' : '') + '</div></div>';
    h += '<article class="sheet"><h2 class="h-sec">Choisis ton sujet</h2><div class="choices">';
    list.forEach(function (s) {
      var on = s.id === sel.id;
      h += '<div class="choice' + (on ? ' on' : '') + '"><button type="button" class="pick" data-sujet="' + s.id + '" aria-pressed="' + on + '"><span class="radio" aria-hidden="true"></span><span class="ct"><span><span class="badge out">' + tx(s.kind) + '</span></span><b>' + tx(s.titre) + '</b>' + (on ? '<span class="small muted">' + tx(ep.id === 'nds' && s.infoNds ? s.infoNds : s.info) + '</span>' : '') + '</span></button>';
      h += '<div class="links">' + (s.pdf ? pdfBtn(s.pdf, 'Sujet') : '') + '</div>';
      if (on && s.libre) h += '<label class="field extra"><span>Titre du sujet</span><input class="input" id="libre-t" type="text" maxlength="120" autocomplete="off" value="' + esc(UI.libre) + '" placeholder="Par exemple : sujet 2025, économie des JO"></label>';
      h += '</div>';
    });
    h += '</div>';
    if (sel.consigne) h += '<div class="consigne"><span class="eyebrow">Ce qu’on te demande</span><ol>' + sel.consigne.map(function (c) { return '<li>' + tx(c) + '</li>'; }).join('') + '</ol></div>';
    h += '<div class="startrow"><button type="button" class="btn pri" data-act="start">' + ico('clock') + 'Commencer l’épreuve · ' + tx(C.hm(ep.min)) + '</button>' + (sel.corrige ? '<span class="badge out">Corrigé disponible après l’épreuve</span>' : '') + '</div></article>';
    h += '<article class="sheet"><div class="row between"><h2 class="h-sec">Répartition conseillée du temps</h2>' + srcs(ep.phasesSrc) + '</div>' + phasesList(ep) + '</article>';
    h += '<details class="sheet fold"><summary><h2 class="h-sec">Copie faite sur papier ? Dépose-la</h2></summary>' + depotCard({ kind: 'ecrit', ep: ep.id, sujet: sel.id, titre: sel.libre ? (UI.libre || 'Sujet libre') : sel.titre }) + '</details>';
    h += '<p class="small"><button type="button" class="btn sm ghost" data-v="reperes">' + ico('book') + 'Format officiel, critères et défauts relevés par le jury</button></p>';
    return h;
  }

  function runClock(run, now) {
    var ep = D.EP[run.ep], el = C.elapsed(run, now), tot = ep.min * 60;
    return { ep: ep, el: el, tot: tot, rem: tot - el, ph: C.phaseAt(ep.phases, el) };
  }
  function plannedAt(run, i, now) {   // heure de fin prévue de l’étape i, pauses comprises
    var ends = C.ends(D.EP[run.ep].phases), pz = C.num(run.pausedMs) + (run.pausedAt ? now - run.pausedAt : 0);
    return run.start + pz + ends[i] * 1000;
  }
  function viewRun(run) {
    var now = Date.now(), k = runClock(run, now), ep = k.ep, s = sujetBy(run.sujet), marks = run.marks || [], ends = C.ends(ep.phases);
    var h = '<div class="exambar" id="exambar"><div class="stack"><span class="small" id="rlab">' + (run.pausedAt ? 'En pause' : k.rem < 0 ? 'Temps écoulé' : 'Temps restant') + '</span><span class="big" id="rc">' + clockTxt(k.rem) + '</span></div>';
    h += '<div class="stack xb-m"><span class="small">Étape conseillée</span><b id="rphase">' + tx(phaseName(ep, k.ph)) + '</b><span class="small" id="rnext">' + tx(nextTxt(run, k, now)) + '</span></div>';
    h += '<div class="row"><button type="button" class="btn sm" data-act="pause">' + ico(run.pausedAt ? 'play' : 'pause') + (run.pausedAt ? 'Reprendre' : 'Pause') + '</button>';
    h += '<button type="button" class="btn sm" data-act="mark"' + (marks.length >= ep.phases.length ? ' disabled' : '') + ' aria-label="Étape terminée">' + ico('check') + '<span>Étape<span class="hide-sm"> terminée</span></span></button>';
    h += '<button type="button" class="btn sm pri" data-act="endask">Rendre<span class="hide-sm"> la copie</span></button></div>';
    h += '<div class="meter" aria-hidden="true"><i id="rmeter" style="width:' + Math.min(100, k.el / k.tot * 100).toFixed(2) + '%"></i></div>';
    if (T.confirm === 'end') h += confirmBox('Rendre la copie maintenant ? Le chrono s’arrête et la grille s’ouvre.', 'end', 'Oui, rendre');
    h += '</div>';
    h += '<article class="sheet"><div class="row between"><div class="stack" style="gap:4px"><span class="eyebrow">' + tx(ep.court + ' · ' + (s ? s.kind : '')) + '</span><h2 class="h-sec">' + tx(titreOf(run)) + '</h2></div>' + (s && s.pdf ? pdfBtn(s.pdf, 'Ouvrir le sujet') : '') + '</div>';
    if (s && s.consigne) h += '<div class="consigne"><ol>' + s.consigne.map(function (c) { return '<li>' + tx(c) + '</li>'; }).join('') + '</ol></div>';
    h += '<p class="small muted">Commencé à ' + tx(fhour(run.start)) + (run.pausedMs ? ' · ' + tx(C.dur(run.pausedMs / 1000)) + ' de pause' : '') + '. Note les heures de passage sur ton brouillon.</p></article>';
    h += '<article class="sheet"><div class="row between"><h2 class="h-sec">Étapes</h2><span class="small muted">« Étape terminée » mesure ton propre rythme.</span></div>';
    h += '<div class="tw"><table class="t ph"><thead><tr><th>Étape</th><th class="num hide-sm">Durée</th><th class="num">Fin prévue</th><th class="num">Ton écart</th></tr></thead><tbody>';
    var last = -1;
    ep.phases.forEach(function (ph, i) {
      if (ep.parts && ph.p !== last) { last = ph.p; h += '<tr class="part"><td colspan="4">' + tx(ep.parts[ph.p]) + '</td></tr>'; }
      var cls = (i === k.ph ? 'now' : '') + (i < marks.length ? ' done' : ''), gap = '';
      if (i < marks.length) { var dm = Math.round((marks[i] - ends[i]) / 60); gap = '<span class="badge ' + (dm > 2 ? 'warn' : 'ok') + '">' + (dm > 0 ? '+' + dm : dm < 0 ? '−' + (-dm) : '0') + ' min</span>'; }
      else if (i === marks.length) gap = '<span class="badge acc">en cours</span>';
      h += '<tr class="' + cls + '"' + (i === k.ph ? ' aria-current="step"' : '') + '><td>' + (i < marks.length ? '<span class="ic-ok">' + ico('check') + '</span>' : '') + tx(ph.t) + '</td><td class="num hide-sm">' + tx(C.hm(ph.min)) + '</td><td class="num" data-pend="' + i + '">' + tx(fhour(plannedAt(run, i, now))) + '</td><td class="num">' + gap + '</td></tr>';
    });
    h += '</tbody></table></div><div class="row">' + (marks.length ? '<button type="button" class="btn sm ghost" data-act="unmark">Annuler la dernière étape</button>' : '') + '<button type="button" class="btn sm danger" data-act="abandonask">Abandonner</button></div>';
    if (T.confirm === 'abandon') h += confirmBox('Abandonner cet entraînement ? Il ne sera pas noté.', 'abandon', 'Abandonner');
    h += srcs(ep.phasesSrc) + '</article>';
    return h;
  }
  function clockTxt(rem) { return rem >= 0 ? C.clock(rem) : '+' + C.clock(-rem); }
  function phaseName(ep, i) { return i < ep.phases.length ? ep.phases[i].t : 'Temps écoulé : rends ta copie'; }
  function nextTxt(run, k, now) { return k.ph < k.ep.phases.length ? 'jusqu’à ' + fhour(plannedAt(run, k.ph, now)) : 'Fin prévue à ' + fhour(plannedAt(run, k.ep.phases.length - 1, now)); }

  function viewGrade(run) {
    var ep = D.EP[run.ep], s = sujetBy(run.sujet), g = C.gridNote(ep.grille, run.scores), used = run.used || C.elapsed(run, Date.now());
    var h = '<section class="hero"><span class="eyebrow">' + tx('Copie rendue · ' + C.dur(used) + ' sur ' + C.hm(ep.min)) + '</span><h1 class="h-page">Note ta copie avec la grille du jury</h1>';
    h += '</section>';
    h += '<div class="score" aria-live="polite"><span class="big" id="gnote">' + gradeVal(g) + '<small>/20</small></span><div class="stack" style="gap:4px"><b id="grated">' + gradedTxt(g) + '</b><span class="small muted">' + tx('Moyenne des candidats en 2026 : ' + num(ep.moyenne.v) + '/20.') + '</span>' + srcs(ep.moyenne.src) + '</div></div>';
    h += '<article class="sheet tight"><div class="row between"><b>' + tx(titreOf(run)) + '</b><div class="row">' + (s && s.pdf ? pdfBtn(s.pdf, 'Sujet') : '') + (s && s.corrige ? pdfBtn(s.corrige.pdf, 'Corrigé', 'ghost') : '') + '</div></div>' + (s && s.corrige ? '<p class="small muted">' + tx(s.corrige.t) + '</p>' : '') + '</article>';
    h += '<article class="sheet">' + depotCard({ kind: 'ecrit', ep: run.ep, sujet: run.sujet, runId: run.id, titre: titreOf(run), used: run.used }) + '</article>';
    h += '<article class="sheet"><div class="row between"><h2 class="h-sec">Grille</h2><span class="scale">0 absent · 1 insuffisant · 2 moyen · 3 bien · 4 très bien</span></div><p class="small muted">Pondération indicative : le barème officiel n’est pas publié.</p>';
    var parts = [];
    ep.grille.forEach(function (c) { if (parts.indexOf(c.part) < 0) parts.push(c.part); });
    parts.forEach(function (pt) {
      var cs = ep.grille.filter(function (c) { return c.part === pt; }), w = cs.reduce(function (a, c) { return a + c.w; }, 0);
      h += '<h3 class="gpart"><span>' + tx(pt) + '</span><span>' + w + ' points</span></h3>';
      cs.forEach(function (c, i) {
        var v = run.scores ? run.scores[c.id] : undefined;
        h += '<div class="crit' + (i === cs.length - 1 ? ' last' : '') + '"><div class="ct"><b>' + tx(c.t) + '</b><span class="small muted">' + tx(c.d) + '</span>' + srcs(c.src) + '</div><div class="side"><div class="lv" role="group" aria-label="' + esc(c.t) + '">';
        for (var n = 0; n <= 4; n++) h += '<button type="button" data-crit="' + c.id + '" data-lv="' + n + '" aria-pressed="' + (v === n) + '" title="' + esc(D.NIVEAUX[n]) + '">' + n + '</button>';
        h += '</div><span class="pts" id="pts-' + c.id + '">' + ptsTxt(c, v) + '</span></div></div>';
      });
    });
    h += '</article>';
    h += '<article class="sheet"><h2 class="h-sec">Défauts relevés par le jury</h2><p class="small muted">Coche ceux que tu retrouves dans ta copie : l’onglet Progrès compte les plus fréquents.</p><ul class="checks">';
    ep.defauts.forEach(function (d) { var on = (run.defauts || []).indexOf(d.id) >= 0; h += '<li><label><input type="checkbox" data-defaut="' + d.id + '"' + (on ? ' checked' : '') + '><span>' + tx(d.t) + '</span>' + srcs(d.src) + '</label></li>'; });
    h += '</ul><div class="callout ok"><span class="ic">' + ico('check') + '</span><div><h4>Ce que font les meilleures copies</h4><p class="small">' + tx(ep.meilleurs.t) + '</p>' + srcs(ep.meilleurs.src) + '</div></div></article>';
    h += '<article class="sheet"><label class="field"><span>Commentaire</span><textarea class="input" id="g-comment" maxlength="4000" placeholder="Ce qui a marché, ce que tu changes la prochaine fois">' + esc(run.comment || '') + '</textarea></label>';
    h += '<div class="row"><button type="button" class="btn pri" data-act="gsave" id="gsave"' + (g.rated < g.total ? ' disabled' : '') + '>' + ico('check') + 'Enregistrer la note</button><button type="button" class="btn" data-act="reopen">' + ico('redo') + 'Je n’avais pas fini : reprendre</button><button type="button" class="btn sm danger" data-act="abandonask">Ne pas noter</button></div>';
    if (T.confirm === 'abandon') h += confirmBox('Supprimer cet entraînement sans le noter ?', 'abandon', 'Supprimer');
    h += '</article>';
    return h;
  }
  function gradedTxt(g) { return !g.rated ? 'Aucun critère noté sur ' + g.total : g.rated < g.total ? g.rated + ' critère' + (g.rated > 1 ? 's' : '') + ' noté' + (g.rated > 1 ? 's' : '') + ' sur ' + g.total : 'Tous les critères sont notés'; }
  function gradeVal(g) { return g.rated ? note20(g.note) : '—'; }
  function ptsTxt(c, v) { return (typeof v === 'number' ? C.dec(c.w * v / 4) : '—') + ' / ' + c.w + ' pt' + (c.w > 1 ? 's' : ''); }
  function updGrade() {
    var run = S.cur.run; if (!run || !run.endedAt) return;
    var ep = D.EP[run.ep], g = C.gridNote(ep.grille, run.scores);
    var n = $('#gnote'); if (n) n.innerHTML = gradeVal(g) + '<small>/20</small>';
    var r = $('#grated'); if (r) r.textContent = gradedTxt(g);
    var b = $('#gsave'); if (b) b.disabled = g.rated < g.total;
    ep.grille.forEach(function (c) {
      var v = run.scores[c.id], p = $('#pts-' + c.id); if (p) p.textContent = ptsTxt(c, v);
      document.querySelectorAll('[data-crit="' + c.id + '"]').forEach(function (x) { x.setAttribute('aria-pressed', String(Number(x.dataset.lv) === v)); });
    });
  }
  function viewSaved(e) {
    var ep = D.EP[e.ep], diff = e.note - ep.moyenne.v, prev = entries(e.ep).filter(function (x) { return x.date < e.date; }).slice(-1)[0];
    var weak = ep.grille.map(function (c) { return { c: c, r: (e.scores[c.id] || 0) / 4 }; }).sort(function (a, b) { return a.r - b.r; })[0];
    var h = '<section class="hero"><span class="eyebrow">Entraînement enregistré · ' + tx(titreOf(e)) + '</span><h1 class="h-page">Ta note : <mark class="hl">' + note20(e.note) + '/20</mark></h1>';
    h += '<p class="lede">' + tx((diff >= 0 ? 'Au-dessus' : 'En dessous') + ' de la moyenne des candidats en 2026 (' + num(ep.moyenne.v) + '/20)' + (prev ? ', ' + (e.note >= prev.note ? '+' : '−') + C.dec(Math.abs(e.note - prev.note)) + ' point par rapport à ton entraînement précédent.' : '.')) + '</p></section>';
    h += '<div class="stats"><div class="stat"><span>Temps utilisé</span><b>' + tx(C.dur(e.used)) + '</b><span>' + tx('sur ' + C.hm(ep.min)) + '</span></div>';
    h += '<div class="stat"><span>Critère le plus faible</span><b style="font-size:1rem;font-family:var(--f-ui)">' + tx(weak.c.t) + '</b></div>';
    h += '<div class="stat"><span>Défauts cochés</span><b>' + (e.defauts || []).length + '</b></div></div>';
    h += '<div class="row"><button type="button" class="btn pri" data-act="newrun">Nouvel entraînement</button><button type="button" class="btn" data-v="progres">' + ico('arrow') + 'Voir ma progression</button></div>';
    return h;
  }

  /* ===== Dépôts pour correction =====
     Tu déposes ta copie (photos ou PDF) ou ta réponse orale (transcription, enregistrement) sur ton compte.
     La correction se fait ensuite depuis le terminal (outils/depots.js), qui écrit la note, la grille et le
     commentaire sur le dépôt : ils s'affichent ici, et un bouton les reporte dans ta grille ou ton historique. */
  var DEP = { list: [], sel: [], busy: false, prog: 0, msg: '', ctx: null, unsub: null, open: {} };
  // Abonnement unique ; le réaffichage est différé (le premier appel peut arriver pendant un affichage)
  function depInit() {
    if (DEP.started || !window.PrepaSync || !PrepaSync.depots) return;
    DEP.started = true;
    DEP.unsub = PrepaSync.depots.watch(function (l) {
      if (!l) return;
      var sig = JSON.stringify(l.map(function (d) { return [d.id, d.statut, d.correction ? d.correction.at : 0]; }));
      if (sig === DEP.sig) return; DEP.sig = sig; DEP.list = l;
      setTimeout(function () { if (editing()) T.pending = true; else render(); }, 0);
    });
  }
  function fsize(n) { return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' Ko' : C.dec(n / 1048576, 1) + ' Mo'; }
  // Photos réduites à 2 200 px de côté en JPEG : lisibles, et légères à envoyer
  function prepFile(f) {
    var raw = function () { return f.arrayBuffer().then(function (d) { return { name: f.name, type: f.type || 'application/octet-stream', data: d }; }); };
    if (!/^image\/(jpeg|png|webp)$/i.test(f.type) || !window.createImageBitmap) return raw();
    return createImageBitmap(f).then(function (bm) {
      var k = Math.min(1, 2200 / Math.max(bm.width, bm.height)), c = document.createElement('canvas');
      c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
      c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
      return new Promise(function (res, rej) { c.toBlob(function (b) { if (b) res(b); else rej(); }, 'image/jpeg', 0.82); });
    }).then(function (b) {
      return b.arrayBuffer().then(function (d) { return d.byteLength < f.size ? { name: f.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg', data: d } : raw(); });
    }, raw);
  }
  function depMatch(ctx) {
    return DEP.list.filter(function (d) {
      return ctx.kind === 'ecrit' ? d.kind === 'ecrit' && (ctx.runId ? d.runId === ctx.runId : (!d.runId && d.sujet === ctx.sujet)) : d.kind === 'oral' && d.aid === ctx.aid;
    });
  }
  function depTitle(d) { return d.kind === 'ecrit' ? (d.titre || 'Copie') : (QBY[d.qid] ? QBY[d.qid].q : (d.question || 'Réponse orale')); }
  function depRow(d, withTitle) {
    var c = d.correction, op = !!DEP.open[d.id], nf = (d.files || []).length;
    var h = '<div class="deprow"><button type="button" class="hrow" data-dopen="' + esc(d.id) + '" aria-expanded="' + op + '"><span class="t1">' + tx(withTitle ? depTitle(d) : (d.kind === 'ecrit' ? 'Copie' : 'Réponse') + ' déposée le ' + fdate(d.createdAt)) + '</span>';
    h += c ? '<span class="nt">' + C.dec(c.note) + '<small>/20</small></span>' : '<span class="badge warn">en attente</span>';
    h += '<span class="t2">' + tx((withTitle ? fdate(d.createdAt) + ' · ' : '') + nf + ' fichier' + (nf > 1 ? 's' : '') + (d.trans ? ' · transcription' : '') + (c ? ' · corrigé le ' + fdate(c.at) : ' · correction à demander dans le terminal')) + '</span></button>';
    if (op) {
      h += '<div class="hdet">';
      if (c) {
        var crit = d.kind === 'ecrit' ? D.EP[d.ep].grille : D.ORAL.criteres, niv = d.kind === 'ecrit' ? D.NIVEAUX : D.ORAL.niveaux;
        h += '<div class="kvl">' + crit.map(function (k) {
          var v = c.scores ? c.scores[k.id] : undefined;
          return '<span class="k">' + tx(k.t) + '</span><span class="v">' + (typeof v === 'number' ? v + ' · ' + tx(niv[d.kind === 'ecrit' ? v : v - 1] || '') : '—') + '</span>';
        }).join('') + '</div>';
        if (c.commentaire) h += '<p class="small" style="white-space:pre-wrap">' + esc(c.commentaire) + '</p>';
        h += '<div class="row"><button type="button" class="btn sm pri" data-act="duse" data-id="' + esc(d.id) + '">' + ico('check') + 'Reporter cette note</button></div>';
      }
      if (d.trans) h += '<details class="pistes"><summary>Transcription déposée</summary><div class="body"><p class="small" style="white-space:pre-wrap">' + esc(d.trans) + '</p></div></details>';
      if (nf) h += '<ul class="plain small">' + d.files.map(function (f) { return '<li>' + esc(f.name) + ' · <span class="mono">' + fsize(f.size) + '</span></li>'; }).join('') + '</ul>';
      h += '<div class="row">' + (T.confirm === 'ddel:' + d.id ? confirmBox('Supprimer ce dépôt et ses fichiers ?', 'ddel', 'Supprimer') : '<button type="button" class="btn sm danger" data-act="ddelask" data-id="' + esc(d.id) + '">' + ico('trash') + 'Supprimer le dépôt</button>') + '</div></div>';
    }
    return h + '</div>';
  }
  function depotCard(ctx) {
    var key = ctx.kind + ':' + (ctx.runId || ctx.aid || ctx.sujet || '');
    if (DEP.key !== key && !DEP.busy) { DEP.key = key; DEP.sel = []; DEP.msg = ''; }
    DEP.ctx = ctx; depInit();
    var on = !!(window.PrepaSync && PrepaSync.depots && PrepaSync.depots.ready()), mine = depMatch(ctx), ecrit = ctx.kind === 'ecrit';
    var h = '<div class="depot" id="depot"><div class="row between"><h3 class="h-card">' + (ecrit ? 'Déposer ma copie' : 'Déposer ma réponse') + '</h3><span class="badge out">correction par Claude</span></div>';
    h += '<p class="small muted">' + (ecrit ? 'Une photo par page, ou un PDF.' : 'La transcription et les enregistrements de cette réponse partent avec ; tu peux ajouter un fichier.') + ' Demande ensuite à Claude, dans le terminal, de corriger tes dépôts : la note s’affichera ici.</p>';
    if (!on) h += '<div class="callout warn"><span class="ic">' + ico('alert') + '</span><div><p class="small">Connecte-toi à ton compte (en haut de la page d’accueil) pour déposer : c’est ce qui rend tes fichiers accessibles depuis le terminal.</p></div></div>';
    else {
      h += '<label class="drop" id="dropzone"><input type="file" id="dep-in" multiple accept="' + (ecrit ? 'image/*,application/pdf' : 'audio/*,image/*,application/pdf,text/plain') + '"><span class="dz-t">' + ico('file') + '<b>' + (ecrit ? 'Choisir des photos ou un PDF' : 'Ajouter un fichier') + '</b></span><span class="small muted">ou glisse-les ici</span></label>';
      if (DEP.sel.length) h += '<ul class="deplist">' + DEP.sel.map(function (f, i) { return '<li><span>' + esc(f.name) + '</span><span class="mono small">' + fsize(f.size) + '</span><button type="button" class="btn sm ghost" data-act="dunsel" data-i="' + i + '" aria-label="Retirer ' + esc(f.name) + '">' + ico('cross') + '</button></li>'; }).join('') + '</ul>';
      h += '<div class="row"><button type="button" class="btn pri" data-act="dsend"' + (DEP.busy || (ecrit && !DEP.sel.length) ? ' disabled' : '') + '>' + ico('arrow') + '<span>' + (DEP.busy ? 'Envoi… ' + Math.round(DEP.prog * 100) + ' %' : 'Envoyer pour correction') + '</span></button><span class="small" id="dep-msg" role="status">' + esc(DEP.msg) + '</span></div>';
    }
    if (mine.length) h += '<div class="hlist">' + mine.map(function (d) { return depRow(d, false); }).join('') + '</div>';
    return h + '</div>';
  }
  function depAdd(files) {
    var tot = DEP.sel.reduce(function (a, f) { return a + f.size; }, 0);
    DEP.msg = '';
    Array.prototype.forEach.call(files || [], function (f) {
      if (tot + f.size <= 40 * 1048576) { DEP.sel.push(f); tot += f.size; } else DEP.msg = 'Fichiers trop lourds : 40 Mo au plus par dépôt.';
    });
    render();
  }
  function depSend() {
    var ctx = DEP.ctx; if (!ctx || DEP.busy || !PrepaSync.depots.ready()) return;
    var meta = { id: C.uid('d'), kind: ctx.kind, prof: profil() }, extra = Promise.resolve([]);
    if (ctx.kind === 'ecrit') {
      var ep = D.EP[ctx.ep], s = sujetBy(ctx.sujet);
      Object.assign(meta, { ep: ctx.ep, concours: ep.concours, sujet: ctx.sujet, titre: ctx.titre || (s ? s.titre : 'Copie'), runId: ctx.runId || null, used: ctx.used || null });
    } else {
      var q = QBY[ctx.qid], o = T.oral;
      Object.assign(meta, { qid: ctx.qid, question: q ? q.q : '', cat: q ? q.c : '', aid: ctx.aid, used: o && o.start ? Math.round(C.elapsed(o, Date.now())) : null, limit: o ? o.limit : UI.dur, trans: String(T.trans || '').slice(0, 10000) });
      extra = AudioDB.list('aid', ctx.aid).then(function (l) {
        return Promise.all(l.map(function (m, i) {
          return AudioDB.get(m.id).then(function (buf) { return buf ? { name: 'enregistrement-' + (i + 1) + ((m.mime || '').indexOf('mp4') >= 0 ? '.m4a' : '.webm'), type: m.mime || 'audio/webm', data: buf } : null; });
        }));
      }, function () { return []; });
    }
    DEP.busy = true; DEP.prog = 0; DEP.msg = 'Préparation des fichiers…'; render();
    Promise.all([Promise.all(DEP.sel.map(prepFile)), extra]).then(function (r) {
      var files = r[0].concat((r[1] || []).filter(Boolean));
      if (!files.length && !meta.trans) throw 'Rien à envoyer : ajoute un fichier ou une transcription.';
      DEP.msg = 'Envoi en cours…'; render();
      return PrepaSync.depots.add(meta, files, function (x) {
        DEP.prog = x; var b = $('[data-act="dsend"] span'); if (b) b.textContent = 'Envoi… ' + Math.round(x * 100) + ' %';
      });
    }).then(function () {
      DEP.busy = false; DEP.sel = []; DEP.msg = 'Déposé. Demande à Claude, dans le terminal, de corriger tes dépôts.'; render();
      toast('Dépôt envoyé pour correction.');
    }, function (e) { DEP.busy = false; DEP.msg = typeof e === 'string' ? e : 'Échec de l’envoi : vérifie ta connexion et réessaie.'; render(); });
  }
  // Reporte la note de la correction dans la grille en cours, ou dans l'entraînement déjà enregistré
  function depUse(d) {
    var c = d.correction, now = Date.now(); if (!c || !c.scores) return;
    if (d.kind === 'ecrit') {
      var run = S.cur.run, E = D.EP[d.ep];
      if (run && run.endedAt && run.id === d.runId) {
        run.scores = Object.assign({}, c.scores); if (c.defauts) run.defauts = c.defauts.slice();
        touchRun(); Store.save(); render(); return toast('Grille remplie avec la correction.');
      }
      var e = d.runId && S.ecrits[d.runId];
      if (e && !e.deleted) {
        e.scores = Object.assign({}, c.scores); if (c.defauts) e.defauts = c.defauts.slice(); e.note = C.gridNote(E.grille, e.scores).note; e.updatedAt = now;
        Store.save(); render(); return toast('Note de l’entraînement mise à jour : ' + C.dec(e.note) + '/20.');
      }
      S.ecrits[d.id] = { id: d.id, ep: d.ep, sujet: d.sujet, titre: d.titre || null, date: d.createdAt, used: d.used || 0, pausedMs: 0, marks: [], scores: Object.assign({}, c.scores), note: C.gridNote(E.grille, c.scores).note, comment: '', defauts: (c.defauts || []).slice(), createdAt: now, updatedAt: now };
      Store.save(); render(); return toast('Copie ajoutée à ton historique : ' + C.dec(S.ecrits[d.id].note) + '/20.');
    }
    if (T.att && T.att.aid === d.aid && (T.oeval || oralState() === 'done')) {
      Object.keys(c.scores).forEach(function (k) { T.oscores[k] = c.scores[k]; }); updOEval(); return toast('Évaluation remplie : vérifie, puis enregistre.');
    }
    var o = S.oraux[d.aid];
    if (!o && !QBY[d.qid]) return;
    var base = o || { id: d.aid, qid: d.qid, cat: d.cat, prof: d.prof, date: d.createdAt, used: d.used || 0, limit: d.limit || UI.dur, comment: '', createdAt: now };
    base.scores = Object.assign({}, c.scores); base.note = C.oralNote(D.ORAL.criteres, base.scores).note; base.trans = d.trans || base.trans || ''; base.updatedAt = now;
    S.oraux[d.aid] = base; Store.save(); render(); toast('Réponse notée dans ton historique : ' + C.dec(base.note) + '/20.');
  }
  // Transcription de l'oral par la reconnaissance vocale du navigateur (Chrome, Edge, Safari)
  var Trans = {
    ok: function () { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },
    start: function () {
      if (T.tr || !Trans.ok() || !UI.trans) return;
      var R = window.SpeechRecognition || window.webkitSpeechRecognition, r;
      try { r = new R(); } catch (e) { return; }
      r.lang = 'fr-FR'; r.continuous = true; r.interimResults = true;
      var me = T.tr = { r: r, on: true }; T.trErr = null;
      r.onresult = function (e) {
        var fin = '', inter = '';
        for (var i = e.resultIndex; i < e.results.length; i++) { var t = e.results[i][0].transcript; if (e.results[i].isFinal) fin += t; else inter += t; }
        if (fin.trim()) T.trans = (T.trans ? T.trans.replace(/\s*$/, ' ') : '') + fin.trim();
        T.interim = inter; updTrans();
      };
      r.onerror = function (e) {
        var c = e && e.error;
        if (c === 'not-allowed' || c === 'service-not-allowed') { me.on = false; T.trErr = 'denied'; }
        else if (c === 'audio-capture') { me.on = false; T.trErr = 'busy'; }
        updTrans();
      };
      r.onend = function () { if (T.tr === me && me.on) { try { r.start(); } catch (x) { T.tr = null; } } else if (T.tr === me) T.tr = null; };
      try { r.start(); } catch (e) { T.tr = null; }
      updTrans();
    },
    stop: function () { var t = T.tr; if (!t) return; t.on = false; try { t.r.stop(); } catch (e) { } T.tr = null; T.interim = ''; updTrans(); }
  };
  var TR_ERR = { denied: 'Transcription refusée par le navigateur : tu peux taper ou coller ta réponse.', busy: 'Transcription impossible pendant l’enregistrement sur cet appareil : arrête l’enregistrement ou tape ta réponse.' };
  function transBox(st) {
    if (st === 'idle') return Trans.ok() ? '<label class="row small" style="gap:8px"><input type="checkbox" id="o-trans-on"' + (UI.trans ? ' checked' : '') + '> Transcrire ma réponse pendant que je parle</label>' : '';
    var h = '<div class="trans" id="transbox">';
    if (st === 'done') h += '<label class="field"><span>Transcription de ta réponse <span class="muted">(modifiable)</span></span><textarea class="input" id="o-trans" maxlength="10000" placeholder="' + (Trans.ok() ? 'Rien n’a été transcrit : tape ou colle ta réponse.' : 'Ce navigateur ne transcrit pas : tape ou colle ta réponse.') + '">' + esc(T.trans || '') + '</textarea></label>';
    else h += '<span class="eyebrow">Transcription' + (T.tr ? ' en cours' : '') + '</span><p class="small" id="o-live">' + esc(T.trans || '') + ' <span class="live">' + esc(T.interim || '') + '</span></p>';
    if (T.trErr) h += '<p class="small muted">' + tx(TR_ERR[T.trErr]) + '</p>';
    return h + '</div>';
  }
  function updTrans() { var l = $('#o-live'); if (l) l.innerHTML = esc(T.trans || '') + ' <span class="live">' + esc(T.interim || '') + '</span>'; }

  /* ===== Oral ===== */
  function curQ() { return UI.oq && QBY[UI.oq] ? QBY[UI.oq] : null; }
  function counts() { var c = {}; C.live(S.oraux).forEach(function (e) { c[e.qid] = (c[e.qid] || 0) + 1; }); return c; }
  function poolOf(cat) { return D.Q.filter(function (q) { return !q.pres && (cat === 'all' || q.c === cat); }); }
  function newAttempt(q, limit) {
    if (T.rec) Rec.stop();
    UI.oq = q.id; UI.recent = [q.id].concat(UI.recent.filter(function (x) { return x !== q.id; })).slice(0, 12);
    T.oral = { limit: limit, start: null, pausedAt: null, pausedMs: 0, endedAt: null };
    Trans.stop();
    T.att = { aid: C.uid('o') }; T.oscores = {}; T.ocomment = ''; T.oeval = false; T.osaved = null; T.olimitHit = false; T.micErr = null; T.trans = ''; T.interim = ''; T.trErr = null;
    Store.saveUI();
  }
  function drawQ() {
    var q = C.draw(poolOf(UI.cat), counts(), UI.recent.slice(0, 8));
    if (!q) return;
    newAttempt(q, UI.dur); render();
    var b = $('#qbox'); if (b) b.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function oralState() {
    var o = T.oral; if (!o || !o.start) return 'idle';
    if (o.endedAt) return 'done'; if (o.pausedAt) return 'paused'; return 'run';
  }
  function viewOral() {
    var p = profil(), O = D.ORAL[p], q = curQ(), cnt = counts();
    if (q && !T.oral) { T.oral = { limit: q.pres ? 300 : UI.dur, start: null, pausedAt: null, pausedMs: 0, endedAt: null }; T.att = { aid: C.uid('o') }; }
    var h = '<section class="hero"><span class="eyebrow">Oral d’admission · concours ' + tx(O.concours) + '</span><h1 class="h-page"><mark class="hl">' + O.min + ' minutes</mark> face au jury</h1></section>';
    h += profSeg();
    h += '<div class="stats"><div class="stat"><span>Durée</span><b>' + O.min + ' <small>min</small></b></div><div class="stat"><span>Coefficient</span><b>' + O.coef + '</b></div><div class="stat"><span>Présentation</span><b>5 <small>min max</small></b></div><div class="stat"><span>Note éliminatoire</span><b>&lt; 5 <small>/ 20</small></b></div></div>';
    // Tirage
    h += '<article class="sheet" id="trainer"><div class="row between"><h2 class="h-sec">Tirage au sort</h2><span class="small muted">' + tx(D.Q.length + ' questions, présentation comprise') + '</span></div>';
    h += '<div class="chips" role="group" aria-label="Catégorie"><button type="button" data-cat="all" aria-pressed="' + (UI.cat === 'all') + '">Toutes <span class="mono small">' + poolOf('all').length + '</span></button>';
    D.CATS.forEach(function (c) { h += '<button type="button" data-cat="' + c.id + '" aria-pressed="' + (UI.cat === c.id) + '">' + tx(c.t) + ' <span class="mono small">' + poolOf(c.id).length + '</span></button>'; });
    h += '</div><div class="row"><button type="button" class="btn pri" data-act="draw">' + ico('shuffle') + 'Tirer une question</button><button type="button" class="btn" data-act="pres">' + ico('mic') + 'Présentation · 5 min</button></div>';
    h += '<div class="durrow"><span class="small">Temps de réponse</span><div class="row" style="gap:6px"><button type="button" class="btn sm" data-act="dminus" aria-label="30 secondes de moins">' + ico('minus') + '</button><span class="val" id="odur">' + C.clock(UI.dur) + '</span><button type="button" class="btn sm" data-act="dplus" aria-label="30 secondes de plus">' + ico('plus') + '</button><button type="button" class="btn sm ghost" data-act="d3">3 min</button><button type="button" class="btn sm ghost" data-act="d5">5 min</button></div></div>';
    if (q) h += qBox(q, cnt);
    else h += '<p class="empty">Tire une question, ou commence par ta présentation.</p>';
    h += '</article>';
    // Déroulé : trois étapes, le détail se déplie
    h += '<article class="sheet"><h2 class="h-sec">Déroulé de l’épreuve</h2><div class="stack" style="gap:6px">' + D.ORAL.etapes.map(function (e, i) { return '<details class="pistes"><summary><span class="badge acc mono">' + (i + 1) + '</span>' + tx(e.t) + '</summary><div class="body"><p class="small">' + tx(e.d) + '</p>' + srcs(e.src) + '</div></details>'; }).join('') + '</div>';
    h += '<details class="pistes"><summary>Ce que le jury 2026 a relevé</summary><div class="body"><ul class="plain small">' + O.attentes.map(function (f) { return '<li>' + tx(f.t) + '</li>'; }).join('') + '</ul>' + srcs([].concat.apply([], O.attentes.map(function (f) { return [].concat(f.src); })).filter(function (v, i, a) { return a.indexOf(v) === i; })) + '</div></details></article>';
    return h;
  }
  function qBox(q, cnt) {
    var o = T.oral, st = oralState(), cat = CATBY[q.c], sup = Rec.support(), n = cnt[q.id] || 0;
    var h = '<div class="qbox" id="qbox"><div class="row"><span class="badge acc">' + tx(cat.t) + '</span>' + (q.s ? '<span class="badge out">' + tx(D.SUBS[q.s]) + '</span>' : '') + (n ? '<span class="badge">' + n + ' réponse' + (n > 1 ? 's' : '') + ' évaluée' + (n > 1 ? 's' : '') + '</span>' : '') + '</div>';
    h += '<p class="question">' + tx(q.q) + '</p>';
    h += '<div class="oclock"><span class="big" id="oc">' + C.clock(o.limit) + '</span><span class="small muted" id="olab">' + (st === 'idle' ? tx('à toi quand tu es prêt · ' + C.clock(o.limit)) : '') + '</span></div>';
    h += '<div class="meter" aria-hidden="true"><i id="ometer" style="width:0%"></i></div><div class="row">';
    if (st === 'idle') {
      h += '<button type="button" class="btn pri" data-act="ostart">' + ico('play') + 'Démarrer</button>';
      if (sup === 'ok') h += '<button type="button" class="btn" data-act="ostartrec"><span class="ic-rec" aria-hidden="true"></span>Démarrer et enregistrer</button>';
    } else if (st === 'run' || st === 'paused') {
      h += '<button type="button" class="btn" data-act="opause">' + ico(st === 'run' ? 'pause' : 'play') + (st === 'run' ? 'Pause' : 'Reprendre') + '</button>';
      if (sup === 'ok') h += '<button type="button" class="btn" data-act="orec" id="orecbtn">' + (T.rec ? ico('stop') + 'Arrêter l’enregistrement' : '<span class="ic-rec" aria-hidden="true"></span>Enregistrer') + '</button>';
      h += '<button type="button" class="btn pri" data-act="ofinish">' + ico('check') + 'J’ai terminé</button>';
    } else {
      h += '<button type="button" class="btn" data-act="oreset">' + ico('redo') + 'Recommencer</button><button type="button" class="btn pri" data-act="draw">' + ico('shuffle') + 'Question suivante</button>';
    }
    h += '</div><div class="recst" id="recst" aria-live="polite"></div>' + transBox(st);
    var err = T.micErr || (sup !== 'ok' ? sup : null);
    if (err) h += '<div class="callout warn"><span class="ic">' + ico('alert') + '</span><div><p class="small">' + tx(MIC[err] || MIC.error) + '</p></div></div>';
    h += '<details class="pistes"' + (st === 'done' ? ' open' : '') + '><summary>Pistes et points attendus</summary><div class="body"><ul class="plain">' + q.p.map(function (x) { return '<li>' + tx(x) + '</li>'; }).join('') + '</ul>';
    if (q.c === 'situ') h += '<p class="small muted">' + tx(D.ORAL.methodeSituation) + '</p>';
    h += '<p class="small muted">Repères de préparation rédigés pour cette appli, pas un corrigé officiel. Vérifie les chiffres d’actualité avant l’oral.</p></div></details>';
    h += '<div id="reclist" class="recs"></div>';
    if (st === 'done' || T.oeval) h += evalBox();
    else h += '<div class="row"><button type="button" class="btn sm ghost" data-act="oeval">Évaluer sans chrono</button></div>';
    return h + '</div>';
  }
  function evalBox() {
    var on = C.oralNote(D.ORAL.criteres, T.oscores), saved = T.osaved && S.oraux[T.osaved];
    var h = '<div class="eval" id="evalbox"><div class="row between"><h3 class="h-card">Ton auto-évaluation</h3><span class="scale">1 à retravailler · 2 passable · 3 bien · 4 très bien</span></div>';
    D.ORAL.criteres.forEach(function (c) {
      var v = T.oscores[c.id];
      h += '<div class="ocrit"><div class="ct"><span>' + tx(c.t) + '</span>' + srcs(c.src) + '</div><div class="lv" role="group" aria-label="' + esc(c.t) + '">';
      for (var n = 1; n <= 4; n++) h += '<button type="button" data-ocrit="' + c.id + '" data-lv="' + n + '" aria-pressed="' + (v === n) + '" title="' + esc(D.ORAL.niveaux[n - 1]) + '">' + n + '</button>';
      h += '</div></div>';
    });
    h += '<label class="field"><span>Commentaire</span><textarea class="input" id="o-comment" maxlength="2000" placeholder="Ce que tu as oublié, ce que tu dirais autrement">' + esc(T.ocomment) + '</textarea></label>';
    h += '<div class="row between"><span class="small">Note indicative : <b class="mono" id="onote">' + (on.note === null ? '—' : C.dec(on.note)) + '/20</b></span><button type="button" class="btn pri" data-act="osave" id="osave"' + (on.rated < on.total ? ' disabled' : '') + '>' + ico('check') + (saved ? 'Mettre à jour' : 'Enregistrer l’évaluation') + '</button></div>';
    h += depotCard({ kind: 'oral', aid: T.att ? T.att.aid : '', qid: curQ() ? curQ().id : '' });
    if (saved) h += '<div class="callout ok"><span class="ic">' + ico('check') + '</span><div><h4>Évaluation enregistrée : ' + C.dec(saved.note) + '/20</h4><p class="small">Elle rejoint ton historique dans l’onglet Progrès.</p><div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-act="draw">Question suivante</button></div></div></div>';
    return h + '</div>';
  }
  function updOEval() {
    var on = C.oralNote(D.ORAL.criteres, T.oscores), n = $('#onote'), b = $('#osave');
    if (n) n.textContent = (on.note === null ? '—' : C.dec(on.note)) + '/20';
    if (b) b.disabled = on.rated < on.total;
    D.ORAL.criteres.forEach(function (c) { document.querySelectorAll('[data-ocrit="' + c.id + '"]').forEach(function (x) { x.setAttribute('aria-pressed', String(Number(x.dataset.lv) === T.oscores[c.id])); }); });
  }
  function updRec() {
    var el = $('#recst'), b = $('#orecbtn');
    if (b) b.innerHTML = T.rec ? ico('stop') + 'Arrêter l’enregistrement' : '<span class="ic-rec" aria-hidden="true"></span>Enregistrer';
    if (!el) return;
    if (!T.rec) { el.innerHTML = ''; return; }
    el.innerHTML = T.rec.state === 'asking' ? '<span class="recdot" aria-hidden="true"></span>Autorise le micro pour enregistrer…' : '<span class="recdot" aria-hidden="true"></span>Enregistrement <span class="mono" id="rectime">' + C.clock((Date.now() - T.rec.t0) / 1000) + '</span>';
  }
  var urls = [];
  function freeUrls() { urls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) { } }); urls = []; }
  function recItem(m) {
    return '<div class="r" data-rid="' + esc(m.id) + '"><span class="meta"><b>' + tx(fdate(m.created) + ' · ' + fhour(m.created)) + '</b> · <span class="mono">' + C.clock(m.dur || 0) + '</span></span><button type="button" class="btn sm" data-play="' + esc(m.id) + '">' + ico('play') + 'Écouter</button><span class="rdel"><button type="button" class="btn sm danger" data-rdel="' + esc(m.id) + '" aria-label="Supprimer l’enregistrement">' + ico('trash') + 'Supprimer</button></span></div>';
  }
  function refreshRecs() {
    var box = $('#reclist'), q = curQ(); if (!box || !q) return;
    AudioDB.list('qid', q.id).then(function (l) {
      if (!$('#reclist') || !curQ() || curQ().id !== q.id) return;
      freeUrls();
      $('#reclist').innerHTML = l.length ? '<span class="eyebrow">Tes enregistrements sur cette question · ' + l.length + '</span>' + l.map(recItem).join('') + '<span class="small muted">' + (AudioDB.persistent() ? 'Conservés sur cet appareil seulement, jamais synchronisés.' : 'Gardés jusqu’à la fermeture de la page : ce navigateur ne permet pas de les conserver.') + '</span>' : '';
    });
  }
  function fillAnswerRecs() {
    document.querySelectorAll('[data-recs-aid]').forEach(function (box) {
      AudioDB.list('aid', box.dataset.recsAid).then(function (l) { box.innerHTML = l.length ? l.map(recItem).join('') : '<span class="small muted">Pas d’enregistrement sur cet appareil.</span>'; });
    });
  }
  function play(id, btn) {
    AudioDB.get(id).then(function (buf) {
      var row = btn.closest('.r'); if (!row) return;
      if (!buf) { btn.outerHTML = '<span class="small muted">Introuvable sur cet appareil.</span>'; return; }
      var metaType = 'audio/webm';
      AudioDB.list().then(function (l) {
        var m = l.filter(function (x) { return x.id === id; })[0]; if (m && m.mime) metaType = m.mime;
        var u = URL.createObjectURL(new Blob([buf], { type: metaType })); urls.push(u);
        var a = document.createElement('audio'); a.controls = true; a.src = u; a.preload = 'auto';
        btn.replaceWith(a);
        var pr = a.play(); if (pr && pr.catch) pr.catch(function () { });
      });
    });
  }

  /* ===== Progrès ===== */
  function viewProgres() {
    var hp = UI.hist === 'ad' || UI.hist === 'nds' ? UI.hist : epOf(profil()).id, ep = D.EP[hp], list = entries(hp), O = D.ORAL[profil()];
    var last = list[list.length - 1], best = list.reduce(function (m, e) { return Math.max(m, e.note); }, 0), avg = list.length ? list.reduce(function (a, e) { return a + e.note; }, 0) / list.length : null;
    var h = '<section class="hero"><span class="eyebrow">Progrès · ' + tx(ep.court) + '</span><h1 class="h-page">' + (last ? 'Dernière note : <mark class="hl">' + note20(last.note) + '/20</mark>' : 'Aucun entraînement noté pour l’instant') + '</h1>';
    h += (last ? '' : '<p class="lede">' + tx('Fais un entraînement dans l’onglet Écrit et note ta copie : la courbe apparaîtra ici.') + '</p>') + '</section>';
    h += '<div class="seg-row"><span class="small muted">Épreuve</span><div class="seg wide" role="group" aria-label="Épreuve"><button type="button" data-hist="nds" aria-pressed="' + (hp === 'nds') + '">Note de synthèse</button><button type="button" data-hist="ad" aria-pressed="' + (hp === 'ad') + '">Analyse de dossier</button></div></div>';
    if (list.length) {
      h += '<div class="stats"><div class="stat"><span>Entraînements notés</span><b>' + list.length + '</b></div><div class="stat"><span>Moyenne</span><b>' + C.dec(avg, 1) + ' <small>/ 20</small></b></div><div class="stat"><span>Meilleure note</span><b>' + note20(best) + ' <small>/ 20</small></b></div>';
      var dl = list.length > 1 ? last.note - list[list.length - 2].note : null;
      h += '<div class="stat"><span>Écart à la moyenne 2026</span><b>' + (last.note >= ep.moyenne.v ? '+' : '−') + C.dec(Math.abs(last.note - ep.moyenne.v), 1) + '</b>' + (dl !== null ? '<span class="delta ' + (dl >= 0 ? 'up' : 'down') + '">' + (dl >= 0 ? '+' : '−') + C.dec(Math.abs(dl)) + ' pt sur la précédente</span>' : '') + '</div></div>';
      h += '<article class="sheet"><div class="row between"><h2 class="h-sec">Évolution</h2><div class="legend"><span><i class="l-me"></i>ta note</span><span><i class="l-ref"></i>' + tx('moyenne 2026 (' + num(ep.moyenne.v) + ')') + '</span><span><i class="l-elim"></i>seuil éliminatoire (5)</span></div></div><div class="chartbox" id="chartbox"></div>' + srcs(ep.moyenne.src) + '</article>';
      h += '<article class="sheet"><h2 class="h-sec">Historique</h2><div class="hlist">';
      list.slice().reverse().forEach(function (e) { h += ecritRow(e, ep); });
      h += '</div></article>';
      h += defautsCard(list, ep);
    }
    // Oral
    var or = C.live(S.oraux).reverse(), om = or.length ? or.reduce(function (a, e) { return a + C.num(e.note); }, 0) / or.length : null;
    h += '<article class="sheet"><div class="row between"><h2 class="h-sec">Oral</h2><span class="small muted">' + tx('Moyenne des candidats ' + O.concours + ' en 2026 : ' + num(O.moyenne.v) + '/20') + '</span></div>';
    if (!or.length) h += '<p class="empty">Aucune réponse évaluée. Dans l’onglet Oral, tire une question, réponds à voix haute, puis évalue-toi.</p>';
    else {
      h += '<div class="stats"><div class="stat"><span>Réponses évaluées</span><b>' + or.length + '</b></div><div class="stat"><span>Moyenne indicative</span><b>' + C.dec(om, 1) + ' <small>/ 20</small></b></div></div>';
      h += '<ul class="mini">' + D.CATS.map(function (c) {
        var l = or.filter(function (e) { return e.cat === c.id; }); if (!l.length) return '';
        var m = l.reduce(function (a, e) { return a + C.num(e.note); }, 0) / l.length;
        return '<li><span>' + tx(c.t) + '</span><span class="mono">' + C.dec(m, 1) + '/20 · ' + l.length + '</span><div class="meter"><i style="width:' + (m / 20 * 100).toFixed(1) + '%"></i></div></li>';
      }).join('') + '</ul>';
      var lim = 15 + T.more;
      h += '<div class="hlist">' + or.slice(0, lim).map(oralRow).join('') + '</div>';
      if (or.length > lim) h += '<div class="row"><button type="button" class="btn sm" data-act="more">Afficher plus</button></div>';
    }
    h += srcs(O.moyenne.src) + '</article>';
    // Dépôts pour correction
    depInit();
    if (DEP.list.length) h += '<article class="sheet"><div class="row between"><h2 class="h-sec">Copies et réponses déposées</h2><span class="small muted">' + DEP.list.filter(function (d) { return !d.correction; }).length + ' en attente de correction</span></div><div class="hlist">' + DEP.list.map(function (d) { return depRow(d, true); }).join('') + '</div></article>';
    // Données
    var lab = ''; try { if (Sync.on && typeof window.PrepaSync.label === 'function') lab = window.PrepaSync.label(); } catch (e) { }
    h += '<article class="sheet flat"><h2 class="h-sec">Tes données</h2><p class="small">' + tx(lab ? 'Progression ' + lab + '.' : 'Historique enregistré dans ce navigateur.') + ' <span id="audioinfo"></span></p>';
    h += '<div class="row"><button type="button" class="btn sm danger" data-act="wipeask" data-what="ecrits">Effacer l’historique écrit</button><button type="button" class="btn sm danger" data-act="wipeask" data-what="oraux">Effacer l’historique oral</button><button type="button" class="btn sm danger" data-act="wipeask" data-what="audio">Supprimer les enregistrements</button></div>';
    if (T.confirm && T.confirm.indexOf('wipe:') === 0) {
      var w = T.confirm.slice(5);
      h += confirmBox(w === 'audio' ? 'Supprimer tous les enregistrements audio de cet appareil ?' : w === 'ecrits' ? 'Effacer tout l’historique écrit, sur tous tes appareils synchronisés ?' : 'Effacer tout l’historique oral, sur tous tes appareils synchronisés ? Les enregistrements liés seront aussi supprimés de cet appareil.', 'wipe', 'Effacer');
    }
    return h + '</article>';
  }
  function ecritRow(e, ep) {
    var op = !!T.open[e.id], h = '<button type="button" class="hrow" data-open="' + esc(e.id) + '" aria-expanded="' + op + '"><span class="t1">' + tx(titreOf(e)) + '</span><span class="nt">' + note20(e.note) + '<small>/20</small></span><span class="t2">' + tx(fdate(e.date) + ' · ' + C.dur(e.used) + ' sur ' + C.hm(ep.min)) + '</span></button>';
    if (!op) return h;
    h += '<div class="hdet"><div class="kvl">';
    ep.grille.forEach(function (c) { var v = e.scores ? e.scores[c.id] : undefined; h += '<span class="k">' + tx(c.t) + '</span><span class="v">' + (typeof v === 'number' ? C.dec(c.w * v / 4) : '—') + ' / ' + c.w + '</span>'; });
    h += '</div>';
    var df = ep.defauts.filter(function (d) { return (e.defauts || []).indexOf(d.id) >= 0; });
    if (df.length) h += '<div><span class="eyebrow">Défauts cochés</span><ul class="plain small">' + df.map(function (d) { return '<li>' + tx(d.t) + '</li>'; }).join('') + '</ul></div>';
    if (e.marks && e.marks.length) {
      var ends = C.ends(ep.phases);
      h += '<div><span class="eyebrow">Ton rythme</span><div class="kvl">' + e.marks.map(function (m, i) { var dm = Math.round((m - ends[i]) / 60); return '<span class="k">' + tx(ep.phases[i].t) + '</span><span class="v">' + (dm > 0 ? '+' + dm : dm < 0 ? '−' + (-dm) : '0') + ' min</span>'; }).join('') + '</div></div>';
    }
    if (e.comment) h += '<p class="small" style="white-space:pre-wrap">' + esc(e.comment) + '</p>';
    h += '<div class="row">' + (T.confirm === 'del:' + e.id ? confirmBox('Supprimer cet entraînement ?', 'del', 'Supprimer') : '<button type="button" class="btn sm danger" data-act="delask" data-id="' + esc(e.id) + '">' + ico('trash') + 'Supprimer</button>') + '</div></div>';
    return h;
  }
  function oralRow(e) {
    var q = QBY[e.qid], op = !!T.open[e.id], c = CATBY[e.cat] || { t: '' };
    var h = '<button type="button" class="hrow" data-open="' + esc(e.id) + '" aria-expanded="' + op + '"><span class="t1">' + tx(q ? q.q : 'Question retirée de la banque') + '</span><span class="nt">' + C.dec(e.note) + '<small>/20</small></span><span class="t2">' + tx(fdate(e.date) + ' · ' + c.t + (e.used ? ' · ' + C.clock(e.used) : '')) + '</span></button>';
    if (!op) return h;
    h += '<div class="hdet"><div class="kvl">' + D.ORAL.criteres.map(function (k) { var v = e.scores ? e.scores[k.id] : null; return '<span class="k">' + tx(k.t) + '</span><span class="v">' + (v ? v + ' · ' + tx(D.ORAL.niveaux[v - 1]) : '—') + '</span>'; }).join('') + '</div>';
    if (e.comment) h += '<p class="small" style="white-space:pre-wrap">' + esc(e.comment) + '</p>';
    if (e.trans) h += '<details class="pistes"><summary>Ta réponse transcrite</summary><div class="body"><p class="small" style="white-space:pre-wrap">' + esc(e.trans) + '</p></div></details>';
    h += '<div class="recs" data-recs-aid="' + esc(e.id) + '"></div>';
    h += '<div class="row">' + (q ? '<button type="button" class="btn sm" data-act="retry" data-q="' + esc(q.id) + '">' + ico('redo') + 'Retravailler cette question</button>' : '') + (T.confirm === 'odel:' + e.id ? confirmBox('Supprimer cette réponse et ses enregistrements ?', 'odel', 'Supprimer') : '<button type="button" class="btn sm danger" data-act="odelask" data-id="' + esc(e.id) + '">' + ico('trash') + 'Supprimer</button>') + '</div></div>';
    return h;
  }
  function defautsCard(list, ep) {
    var c = {}; list.forEach(function (e) { (e.defauts || []).forEach(function (d) { c[d] = (c[d] || 0) + 1; }); });
    var top = ep.defauts.filter(function (d) { return c[d.id]; }).sort(function (a, b) { return c[b.id] - c[a.id]; });
    if (!top.length) return '';
    return '<article class="sheet"><h2 class="h-sec">Tes défauts les plus fréquents</h2><ul class="mini">' + top.map(function (d) { return '<li><span>' + tx(d.t) + '</span><span class="mono">' + c[d.id] + ' / ' + list.length + '</span><div class="meter"><i style="width:' + (c[d.id] / list.length * 100).toFixed(1) + '%"></i></div></li>'; }).join('') + '</ul></article>';
  }
  function drawChart() {
    var box = $('#chartbox'); if (!box) return;
    var hp = UI.hist === 'ad' || UI.hist === 'nds' ? UI.hist : epOf(profil()).id, ep = D.EP[hp], list = entries(hp);
    var W = Math.max(260, Math.round(box.clientWidth || 600)), H = W < 420 ? 190 : 230, L = 30, R = 16, Tp = 16, B = 26, n = list.length;
    var x = function (i) { return n === 1 ? L + (W - L - R) / 2 : L + i * (W - L - R) / (n - 1); };
    var y = function (v) { return Tp + (20 - v) / 20 * (H - Tp - B); };
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc('Évolution de tes notes de ' + ep.court.toLowerCase() + ' : ' + list.map(function (e) { return C.dec(e.note); }).join(', ')) + '"><g class="grid">';
    [0, 5, 10, 15, 20].forEach(function (v) { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '</text>'; });
    s += '</g><line class="elim" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(5) + '" y2="' + y(5) + '"/><line class="ref" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(ep.moyenne.v) + '" y2="' + y(ep.moyenne.v) + '"/>';
    if (n > 1) s += '<polyline class="line" points="' + list.map(function (e, i) { return x(i).toFixed(1) + ',' + y(e.note).toFixed(1); }).join(' ') + '"/>';
    list.forEach(function (e, i) { s += '<circle class="pt" cx="' + x(i).toFixed(1) + '" cy="' + y(e.note).toFixed(1) + '" r="4"><title>' + esc(fdate(e.date) + ' · ' + titreOf(e) + ' · ' + C.dec(e.note) + '/20') + '</title></circle>'; });
    var li = n - 1, lx = x(li), anchor = n === 1 ? 'middle' : 'end';
    s += '<text class="val" x="' + (n === 1 ? lx : lx + 4).toFixed(1) + '" y="' + (y(list[li].note) - 10).toFixed(1) + '" text-anchor="' + anchor + '">' + C.dec(list[li].note) + '</text>';
    s += '<text x="' + x(0).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + (n === 1 ? 'middle' : 'start') + '">' + esc(fdate(list[0].date)) + '</text>';
    if (n > 1) s += '<text x="' + x(li).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="end">' + esc(fdate(list[li].date)) + '</text>';
    box.innerHTML = s + '</svg>';
  }
  function fillAudioInfo() {
    AudioDB.list().then(function (l) {
      var el = $('#audioinfo'); if (!el) return;
      var mo = l.reduce(function (a, m) { return a + (m.size || 0); }, 0) / 1048576;
      el.textContent = l.length ? ty(l.length + ' enregistrement' + (l.length > 1 ? 's' : '') + ' audio (' + C.dec(mo, 1) + ' Mo) sur cet appareil seulement : ils ne sont jamais synchronisés.') : 'Aucun enregistrement audio sur cet appareil.';
    });
  }

  /* ===== Repères ===== */
  function viewReperes() {
    var h = '<section class="hero"><span class="eyebrow">Repères officiels</span><h1 class="h-page">Ce que disent les guides et les jurys</h1></section>';
    ['nds', 'ad'].forEach(function (k) {
      var ep = D.EP[k];
      h += '<details class="sheet fold"' + (k === epOf(profil()).id ? ' open' : '') + '><summary><span class="eyebrow">Écrit n° 1 · concours ' + tx(ep.concours) + '</span><h2 class="h-sec">' + tx(ep.nom) + '</h2></summary><ul class="facts">' + ep.faits.map(function (f) { return '<li class="acc"><span>' + tx(f.t) + '</span>' + srcs(f.src) + '</li>'; }).join('') + '</ul>';
      h += '<h3 class="h-card">Répartition conseillée du temps</h3>' + phasesList(ep) + srcs(ep.phasesSrc);
      h += '<h3 class="h-card">Défauts relevés</h3><ul class="facts">' + ep.defauts.map(function (d) { return '<li><span>' + tx(d.t) + '</span>' + srcs(d.src) + '</li>'; }).join('') + '</ul>';
      h += '<div class="callout ok"><span class="ic">' + ico('check') + '</span><div><h4>Les meilleures copies</h4><p class="small">' + tx(ep.meilleurs.t) + '</p>' + srcs(ep.meilleurs.src) + '</div></div></details>';
    });
    h += '<details class="sheet fold"><summary><span class="eyebrow">Oral d’admission</span><h2 class="h-sec">Inspecteur et contrôleur</h2></summary><ol class="steps">' + D.ORAL.etapes.map(function (e) { return '<li><div class="stack" style="gap:4px"><b>' + tx(e.t) + '</b><span class="small">' + tx(e.d) + '</span>' + srcs(e.src) + '</div></li>'; }).join('') + '</ol>';
    ['I', 'C'].forEach(function (p) {
      var O = D.ORAL[p];
      h += '<h3 class="h-card">Concours ' + tx(O.concours) + '</h3><ul class="facts">' + O.faits.concat(O.attentes).map(function (f) { return '<li><span>' + tx(f.t) + '</span>' + srcs(f.src) + '</li>'; }).join('') + '</ul>';
    });
    h += '</details>';
    h += '<details class="sheet flat fold"><summary><h2 class="h-sec">Ce qui n’est pas publié</h2></summary><ul class="facts">' + D.NON_PUBLIE.map(function (f) { return '<li><span>' + tx(f.t) + '</span>' + srcs(f.src) + '</li>'; }).join('') + '</ul></details>';
    h += '<article class="sheet"><h2 class="h-sec">Documents</h2><ul class="doclist">' + Object.keys(D.SRC).map(function (k) { var s = D.SRC[k]; return '<li><a href="' + esc(s.pdf) + '" target="_blank" rel="noopener">' + ico('file') + '<span>' + tx(s.t) + (s.o ? '' : ' (fiche)') + '</span></a></li>'; }).join('') + '</ul></article>';
    h += '<p class="foot"><span>Outil personnel de préparation, ni produit ni validé par la DGFiP.</span></p>';
    return h;
  }

  /* ---------- Chrono : rafraîchissement ---------- */
  function tick(first) {
    var now = Date.now(), run = S.cur.run, title = TITLE;
    if (run && !run.endedAt && D.EP[run.ep]) {
      var k = runClock(run, now);
      title = (run.pausedAt ? 'Pause · ' : '') + clockTxt(k.rem) + ' · ' + TITLE;
      if (!first && T.lastPhase !== null && k.ph !== T.lastPhase) {
        toast(k.ph < k.ep.phases.length ? 'Étape conseillée : ' + k.ep.phases[k.ph].t : 'Temps écoulé : rends ta copie.');
        vibrate([120, 80, 120]);
        if (UI.view === 'ecrit' && !T.confirm) { T.lastPhase = k.ph; return render(); }
      }
      T.lastPhase = k.ph;
      if (UI.view === 'ecrit') {
        var c = $('#rc'); if (c) c.textContent = clockTxt(k.rem);
        var lb = $('#rlab'); if (lb) lb.textContent = run.pausedAt ? 'En pause' : k.rem < 0 ? 'Temps écoulé' : 'Temps restant';
        var m = $('#rmeter'); if (m) m.style.width = Math.min(100, k.el / k.tot * 100).toFixed(2) + '%';
        var nx = $('#rnext'); if (nx) nx.textContent = ty(nextTxt(run, k, now));
        if (run.pausedAt) document.querySelectorAll('[data-pend]').forEach(function (td) { td.textContent = fhour(plannedAt(run, Number(td.dataset.pend), now)); });
      }
    } else T.lastPhase = null;
    var o = T.oral;
    if (o && o.start && UI.view === 'oral') {
      var el = C.elapsed(o, now), rem = o.limit - el, oc = $('#oc');
      if (oc) { oc.textContent = rem >= 0 ? C.clock(rem) : '−' + C.clock(-rem); oc.classList.toggle('over', rem < 0); }
      var ol = $('#olab'); if (ol) ol.textContent = o.endedAt ? 'terminé · ' + C.clock(el) + ' de parole' : o.pausedAt ? 'en pause' : rem < 0 ? 'temps dépassé' : 'en cours';
      var om = $('#ometer'); if (om) om.style.width = Math.min(100, el / o.limit * 100).toFixed(2) + '%';
      if (!o.endedAt && rem < 0 && !T.olimitHit) { T.olimitHit = true; vibrate(200); toast('Temps écoulé : conclus ta réponse.'); }
      if (!o.endedAt && !o.pausedAt) title = C.clock(Math.abs(rem)) + ' · ' + TITLE;
    }
    if (T.rec && T.rec.t0) { var rt = $('#rectime'); if (rt) rt.textContent = C.clock((now - T.rec.t0) / 1000); }
    if (document.title !== title) document.title = title;
  }

  /* ---------- Actions ---------- */
  function touchRun() { var t = Date.now(); if (S.cur.run) S.cur.run.updatedAt = t; S.cur.updatedAt = t; }
  function act(a, b) {
    var now = Date.now(), run = S.cur.run, q = curQ();
    switch (a) {
      case 'cancel': T.confirm = null; return render();
      // Écrit
      case 'start': {
        var ep = epOf(profil()), s = selSujet(ep);
        S.cur = { run: { id: C.uid('e'), ep: ep.id, sujet: s.id, titre: s.libre ? (UI.libre.trim() || 'Sujet libre') : null, start: now, pausedMs: 0, pausedAt: null, endedAt: null, marks: [], scores: {}, defauts: [], comment: '', updatedAt: now }, updatedAt: now };
        T.saved = null; T.confirm = null; T.lastPhase = null; Store.save(); render(); return window.scrollTo(0, 0);
      }
      case 'pause': if (!run) return; if (run.pausedAt) C.resume(run, now); else C.pause(run, now); touchRun(); Store.save(); return render();
      case 'mark': {
        if (!run) return; var ph = D.EP[run.ep].phases; run.marks = run.marks || [];
        if (run.marks.length < ph.length) { run.marks.push(Math.round(C.elapsed(run, now))); touchRun(); Store.save(); }
        return render();
      }
      case 'unmark': if (run && run.marks && run.marks.length) { run.marks.pop(); touchRun(); Store.save(); } return render();
      case 'endask': T.confirm = 'end'; return render();
      case 'end': if (!run) return; C.finish(run, now); run.used = Math.round(C.elapsed(run, now)); T.confirm = null; touchRun(); Store.save(); render(); return window.scrollTo(0, 0);
      case 'reopen': if (!run) return; C.reopen(run, now); delete run.used; T.confirm = null; touchRun(); Store.save(); render(); return window.scrollTo(0, 0);
      case 'abandonask': T.confirm = 'abandon'; return render();
      case 'abandon': S.cur = { run: null, updatedAt: now }; T.confirm = null; Store.save(); render(); return window.scrollTo(0, 0);
      case 'gsave': {
        if (!run || !run.endedAt) return;
        var e = D.EP[run.ep], g = C.gridNote(e.grille, run.scores); if (g.rated < g.total) return;
        S.ecrits[run.id] = { id: run.id, ep: run.ep, sujet: run.sujet, titre: run.titre || null, date: run.start, used: run.used || Math.round(C.elapsed(run, now)), pausedMs: C.num(run.pausedMs), marks: (run.marks || []).slice(), scores: C.clone(run.scores), note: g.note, comment: run.comment || '', defauts: (run.defauts || []).slice(), createdAt: now, updatedAt: now };
        T.saved = run.id; S.cur = { run: null, updatedAt: now }; Store.save(); render(); return window.scrollTo(0, 0);
      }
      case 'dsend': return depSend();
      case 'dunsel': DEP.sel.splice(Number(b.dataset.i), 1); DEP.msg = ''; return render();
      case 'duse': { var dd = DEP.list.filter(function (x) { return x.id === b.dataset.id; })[0]; if (dd) depUse(dd); return; }
      case 'ddelask': T.confirm = 'ddel:' + b.dataset.id; return render();
      case 'ddel': {
        var did = T.confirm && T.confirm.slice(5), dx = DEP.list.filter(function (x) { return x.id === did; })[0]; T.confirm = null;
        if (dx) PrepaSync.depots.remove(dx).then(function () { toast('Dépôt supprimé.'); }, function () { toast('Suppression impossible : vérifie ta connexion.'); });
        return render();
      }
      case 'newrun': T.saved = null; render(); return window.scrollTo(0, 0);
      // Oral
      case 'draw': return drawQ();
      case 'pres': newAttempt(QBY.pres, 300); render(); var qb = $('#qbox'); if (qb) qb.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return;
      case 'dminus': case 'dplus': case 'd3': case 'd5':
        UI.dur = a === 'd3' ? 180 : a === 'd5' ? 300 : Math.min(900, Math.max(30, UI.dur + (a === 'dplus' ? 30 : -30)));
        Store.saveUI();
        if (T.oral && !T.oral.start) T.oral.limit = UI.dur;
        return render();
      case 'ostart': case 'ostartrec':
        if (!T.oral) return; if (!T.oral.start) { T.oral.start = now; T.oral.pausedMs = 0; } else C.resume(T.oral, now);
        if (a === 'ostartrec') Rec.start();
        Trans.start();
        return render();
      case 'opause': if (!T.oral || !T.oral.start) return; if (T.oral.pausedAt) { C.resume(T.oral, now); Trans.start(); } else { C.pause(T.oral, now); Trans.stop(); } return render();
      case 'orec': if (T.rec) Rec.stop(); else Rec.start(); return;
      case 'ofinish': if (!T.oral) return; C.finish(T.oral, now); Rec.stop(); Trans.stop(); T.oeval = true; render(); var ev = $('#evalbox'); if (ev) ev.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return;
      case 'oreset': if (q) { newAttempt(q, q.pres ? 300 : UI.dur); render(); } return;
      case 'oeval': T.oeval = true; return render();
      case 'osave': {
        if (!q || !T.att) return;
        var on = C.oralNote(D.ORAL.criteres, T.oscores); if (on.rated < on.total) return;
        var o = T.oral, used = o && o.start ? Math.round(C.elapsed(o, now)) : 0, prev = S.oraux[T.att.aid];
        S.oraux[T.att.aid] = { id: T.att.aid, qid: q.id, cat: q.c, prof: profil(), date: prev ? prev.date : now, used: used, limit: o ? o.limit : UI.dur, scores: C.clone(T.oscores), note: on.note, comment: T.ocomment, trans: String(T.trans || '').slice(0, 10000), createdAt: prev ? prev.createdAt : now, updatedAt: now };
        T.osaved = T.att.aid; Store.save(); return render();
      }
      case 'retry': if (QBY[b.dataset.q]) { newAttempt(QBY[b.dataset.q], QBY[b.dataset.q].pres ? 300 : UI.dur); go('oral'); } return;
      // Progrès
      case 'more': T.more += 30; return render();
      case 'delask': T.confirm = 'del:' + b.dataset.id; return render();
      case 'del': {
        var id = (T.confirm || '').slice(4), x = S.ecrits[id];
        if (x) S.ecrits[id] = { id: id, deleted: true, date: x.date, updatedAt: now };
        T.confirm = null; Store.save(); return render();
      }
      case 'odelask': T.confirm = 'odel:' + b.dataset.id; return render();
      case 'odel': {
        var oid = (T.confirm || '').slice(5), y = S.oraux[oid];
        if (y) S.oraux[oid] = { id: oid, deleted: true, date: y.date, updatedAt: now };
        T.confirm = null; Store.save();
        AudioDB.list('aid', oid).then(function (l) { return AudioDB.del(l.map(function (m) { return m.id; })); }).then(render, render);
        return render();
      }
      case 'wipeask': T.confirm = 'wipe:' + b.dataset.what; return render();
      case 'wipe': {
        var what = (T.confirm || '').slice(5); T.confirm = null;
        if (what === 'audio') { AudioDB.clear().then(render, render); return render(); }
        var map = what === 'ecrits' ? S.ecrits : S.oraux, aids = Object.keys(map);
        aids.forEach(function (k) { if (!map[k].deleted) map[k] = { id: k, deleted: true, date: map[k].date, updatedAt: now }; });
        if (what === 'oraux') AudioDB.list().then(function (l) { return AudioDB.del(l.filter(function (m) { return aids.indexOf(m.aid) >= 0; }).map(function (m) { return m.id; })); }).then(render, render);
        T.saved = null; Store.save(); return render();
      }
    }
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-v], [data-act], [data-p], [data-sujet], [data-crit], [data-ocrit], [data-cat], [data-open], [data-play], [data-rdel], [data-rdelyes], [data-rdelno], [data-hist], [data-dopen]');
    if (!b) return;
    var ds = b.dataset;
    if (ds.v) { ev.preventDefault(); return go(ds.v); }
    if (ds.p) { if (ds.p !== profil()) { S.settings = { profil: ds.p === 'C' ? 'C' : 'I', updatedAt: Date.now() }; Store.save(); T.saved = null; } T.confirm = null; return render(); }
    if (ds.sujet) { var ep = epOf(profil()); UI.sujet[ep.id] = ds.sujet; Store.saveUI(); return render(); }
    if (ds.crit) {
      var run = S.cur.run; if (!run || !run.endedAt) return;
      run.scores = run.scores || {}; var lv = Number(ds.lv);
      if (run.scores[ds.crit] === lv) delete run.scores[ds.crit]; else run.scores[ds.crit] = lv;
      touchRun(); Store.save(); return updGrade();
    }
    if (ds.ocrit) { var l = Number(ds.lv); if (T.oscores[ds.ocrit] === l) delete T.oscores[ds.ocrit]; else T.oscores[ds.ocrit] = l; return updOEval(); }
    if (ds.cat) { UI.cat = ds.cat; Store.saveUI(); document.querySelectorAll('[data-cat]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.cat === UI.cat)); }); return; }
    if (ds.hist) { UI.hist = ds.hist; Store.saveUI(); return render(); }
    if (ds.open) { T.open[ds.open] = !T.open[ds.open]; T.confirm = null; return render(); }
    if (ds.dopen) { DEP.open[ds.dopen] = !DEP.open[ds.dopen]; T.confirm = null; return render(); }
    if (ds.play) return play(ds.play, b);
    if (ds.rdel) { var sp = b.parentNode; sp.innerHTML = '<span class="small">Supprimer ?</span><button type="button" class="btn sm danger" data-rdelyes="' + esc(ds.rdel) + '">Oui</button><button type="button" class="btn sm" data-rdelno="' + esc(ds.rdel) + '">Non</button>'; return; }
    if (ds.rdelno) { b.parentNode.innerHTML = '<button type="button" class="btn sm danger" data-rdel="' + esc(ds.rdelno) + '" aria-label="Supprimer l’enregistrement">' + ico('trash') + 'Supprimer</button>'; return; }
    if (ds.rdelyes) { var row = b.closest('.r'); AudioDB.del(ds.rdelyes).then(function () { if (row) row.remove(); if (UI.view === 'oral') refreshRecs(); else fillAudioInfo(); }); return; }
    if (ds.act) return act(ds.act, b);
  });
  var tSave = null;
  function onInput(ev) {
    var t = ev.target, run = S.cur.run;
    if (t.id === 'libre-t') { UI.libre = t.value; Store.saveUI(); return; }
    if (t.id === 'o-comment') { T.ocomment = t.value; return; }
    if (t.id === 'o-trans') { T.trans = t.value; return; }
    if (t.id === 'dep-in' && ev.type === 'change') { depAdd(t.files); t.value = ''; return; }
    if (t.id === 'o-trans-on') { UI.trans = t.checked; Store.saveUI(); return; }
    if (!run || !run.endedAt) return;
    if (t.id === 'g-comment') { run.comment = t.value; touchRun(); clearTimeout(tSave); tSave = setTimeout(function () { Store.save(); }, 600); return; }
    if (t.dataset && t.dataset.defaut && ev.type === 'change') {
      var d = run.defauts = run.defauts || [], i = d.indexOf(t.dataset.defaut);
      if (t.checked && i < 0) d.push(t.dataset.defaut); else if (!t.checked && i >= 0) d.splice(i, 1);
      touchRun(); Store.save();
    }
  }
  // Glisser-déposer des fichiers sur la zone de dépôt
  document.addEventListener('dragover', function (ev) { var z = ev.target.closest && ev.target.closest('#dropzone'); if (z) { ev.preventDefault(); z.classList.add('over'); } });
  document.addEventListener('dragleave', function (ev) { var z = ev.target.closest && ev.target.closest('#dropzone'); if (z) z.classList.remove('over'); });
  document.addEventListener('drop', function (ev) { var z = ev.target.closest && ev.target.closest('#dropzone'); if (z) { ev.preventDefault(); z.classList.remove('over'); depAdd(ev.dataTransfer && ev.dataTransfer.files); } });
  document.addEventListener('input', onInput);
  document.addEventListener('change', onInput);
  document.addEventListener('focusout', function () { if (T.pending) setTimeout(function () { if (T.pending && !editing()) render(); }, 0); });
  window.addEventListener('hashchange', function () { var v = location.hash.slice(1); if (VIEWS.indexOf(v) >= 0 && v !== UI.view) go(v); });
  var rz = null;
  window.addEventListener('resize', function () { measure(); clearTimeout(rz); rz = setTimeout(function () { if (UI.view === 'progres') drawChart(); }, 150); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
  window.addEventListener('pagehide', function () { if (T.rec) Rec.stop(); clearTimeout(tSave); Store.saveLocal(); });
  // Autre onglet : l’état local a changé (même navigateur)
  window.addEventListener('storage', function (ev) {
    if (ev.key !== KEY || !ev.newValue) return;
    try { var o = JSON.parse(ev.newValue), m = C.merge(S, o); if (C.same(m, S)) return; S = m; if (!C.same(S, o)) Store.saveLocal(); softRender(); } catch (e) { }
  });

  /* ---------- Démarrage ---------- */
  Store.load();
  var hv = location.hash.slice(1); if (VIEWS.indexOf(hv) >= 0) UI.view = hv;
  render();
  setInterval(tick, 500);
  Sync.attach();
  if (!Sync.on) window.addEventListener('load', Sync.attach);
})();
