/* Synchro commune aux applis Prépa DGFiP 2027 : compte (identifiant + mot de passe) et Firestore.
   Une appli s'enregistre avec PrepaSync.attach(clé, { get, merge }) :
     get()    renvoie l'état local à synchroniser (objet JSON) ;
     merge(o) fusionne l'état distant o dans l'état local, le sauvegarde et réaffiche, sans rappeler changed() :
              si le résultat diffère de o, la synchro le renvoie au compte (la fusion doit donc être idempotente).
   Après chaque sauvegarde locale, l'appli appelle PrepaSync.changed(clé).
   Données : users/{uid}/apps/{clé} = { json, u, dev }. Firestore garde les écritures hors connexion
   et les envoie au retour du réseau ; chaque appareil reçoit les changements des autres en direct.
   Le SDK Firebase n'est chargé qu'une fois un compte connecté sur l'appareil (ou à l'ouverture du formulaire). */
(function () {
  "use strict";
  var CONFIG = {
    apiKey: "AIzaSyBEGSyRvn1lGRwpZunKyl3DY6HsHe7ZY1Y",
    authDomain: "prepa-dgfip-2027.firebaseapp.com",
    projectId: "prepa-dgfip-2027",
    storageBucket: "prepa-dgfip-2027.firebasestorage.app",
    messagingSenderId: "483566332972",
    appId: "1:483566332972:web:3f3a41ad9ab6f0f4da3589"
  };
  var SDK = "https://www.gstatic.com/firebasejs/12.19.0/";
  // L'identifiant devient une adresse interne : aucun courrier n'y est envoyé, il n'y a donc pas de « mot de passe oublié ».
  var DOMAIN = "prepa.pbailly.fr";
  var FLAG = "prepa-sync-compte", MAX = 900000, STUCK = 30000;

  var apps = {}, listeners = [], fb = null, F = null, user = null, state = "local", err = "", started = false;
  var DEV = (function () {
    try { var d = localStorage.getItem("prepa-appareil"); if (!d) { d = Math.random().toString(36).slice(2, 10); localStorage.setItem("prepa-appareil", d); } return d; }
    catch (e) { return "inconnu"; }
  })();
  function flag(v) { try { if (v) localStorage.setItem(FLAG, "1"); else localStorage.removeItem(FLAG); } catch (e) { } }
  function hasFlag() { try { return localStorage.getItem(FLAG) === "1"; } catch (e) { return false; } }

  // JSON à clés triées : deux états identiques donnent la même chaîne, quel que soit l'ordre d'insertion.
  function canon(o) {
    if (o === null || typeof o !== "object") return JSON.stringify(o);
    if (Array.isArray(o)) return "[" + o.map(canon).join(",") + "]";
    return "{" + Object.keys(o).sort().filter(function (k) { return o[k] !== undefined; }).map(function (k) { return JSON.stringify(k) + ":" + canon(o[k]); }).join(",") + "}";
  }
  function hm(t) { return new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
  // Envoi le plus ancien qui attend la confirmation du serveur depuis plus de 30 s, réseau présent (0 sinon).
  function blocked() {
    if (navigator.onLine === false) return 0;
    var t = 0; Object.keys(apps).forEach(function (k) { var p = apps[k].pend; if (p && Date.now() - p > STUCK && (!t || p < t)) t = p; });
    return t;
  }
  // File d'attente de Firestore bloquée sur l'appareil : on efface son cache local (la progression, elle, est dans le
  // navigateur et la connexion au compte est gardée), puis on recharge ; la page renvoie alors son état au compte.
  function repair() {
    var go = function () { location.reload(); };
    if (!F) return go();
    F.Fs.terminate(F.db).then(function () { return F.Fs.clearIndexedDbPersistence(F.db); }).then(go, go);
  }
  function emit() { var s = api.status(); listeners.forEach(function (f) { try { f(s); } catch (e) { } }); }
  function setState(s, e) { state = s; err = e || ""; emit(); }

  function load() {
    if (fb) return fb;
    fb = Promise.all([import(SDK + "firebase-app.js"), import(SDK + "firebase-auth.js"), import(SDK + "firebase-firestore.js")]).then(function (m) {
      var A = m[0], Au = m[1], Fs = m[2];
      var app = A.initializeApp(CONFIG);
      var auth = Au.initializeAuth(app, { persistence: [Au.indexedDBLocalPersistence, Au.browserLocalPersistence] });
      var db;
      try { db = Fs.initializeFirestore(app, { localCache: Fs.persistentLocalCache({ tabManager: Fs.persistentMultipleTabManager() }) }); }
      catch (e) { db = Fs.getFirestore(app); }
      F = { Au: Au, Fs: Fs, auth: auth, db: db };
      return F;
    });
    fb.catch(function () { fb = null; setState("local", "Service de synchronisation injoignable."); });
    return fb;
  }
  function start() {
    if (started) return load();
    started = true;
    setState("connexion");
    return load().then(function (f) {
      f.Au.onAuthStateChanged(f.auth, function (u) {
        Object.keys(apps).forEach(stop);
        depWatchers.forEach(depStop);
        peeks.forEach(peekStop);
        user = u;
        if (u) { flag(true); setState("attente"); Object.keys(apps).forEach(watch); }
        else { flag(false); setState("local"); }
        depWatchers.forEach(depSub);
        peeks.forEach(peekSub);
      });
      return f;
    }, function (e) { started = false; throw e; });
  }

  function stop(key) { var a = apps[key]; if (a) { clearTimeout(a.retry); if (a.unsub) { a.unsub(); a.unsub = null; a.ref = null; } } }
  function watch(key) {
    var a = apps[key]; if (!a || !user || !F || a.unsub) return;
    a.ref = F.Fs.doc(F.db, "users", user.uid, "apps", key);
    a.first = true;
    // Métadonnées comprises : le passage du cache au serveur arrive aussi quand les données n'ont pas changé.
    a.unsub = F.Fs.onSnapshot(a.ref, { includeMetadataChanges: true }, function (snap) {
      if (!snap.metadata.fromCache) a.srv = Date.now(); // serveur joint (même avec un envoi en attente)
      // Écho de nos propres écritures. Une écriture en attente sans envoi de cette page vient d'une ouverture précédente
      // (Firestore garde sa file d'une session à l'autre) : elle compte comme envoi en attente.
      if (snap.metadata.hasPendingWrites) { if (!a.fly && !a.pend) { a.pend = Date.now(); setTimeout(emit, STUCK + 1000); } return; }
      if (!a.fly) a.pend = 0;
      var d = snap.exists() ? snap.data() : null;
      if (d && !snap.metadata.fromCache) a.rx = { at: Date.now(), u: d.u || 0, mine: d.dev === DEV };
      if (d && d.json && d.json !== a.last) {
        a.last = d.json;
        try { var o = JSON.parse(d.json); a.canon = canon(o); a.merge(o); if (!a.first) echo(key); } catch (e) { }
      }
      // Premier envoi seulement sur une version venue du serveur : celle du cache peut être périmée, et l'état fusionné
      // avec elle écraserait dans le compte ce que l'autre appareil y a mis entre-temps.
      if (!snap.metadata.fromCache) { a.fails = 0; if (a.first) { a.first = false; push(key, !d); } }
      setState(snap.metadata.fromCache ? "attente" : "ok");
    }, function (e) {
      // Une écoute en erreur est arrêtée par Firestore : on la relance, sinon l'appareil ne reçoit plus rien.
      a.unsub = null; a.ref = null; setState("erreur", (e && e.code) || "erreur");
      a.fails = (a.fails || 0) + 1; clearTimeout(a.retry);
      a.retry = setTimeout(function () { watch(key); }, Math.min(60000, 5000 * a.fails));
    });
  }
  // Relance les écoutes (retour au premier plan après une veille, retour du réseau) : une connexion restée muette
  // pendant la veille d'un ordinateur ou d'un téléphone laisserait l'appareil sur une version périmée.
  function refresh() {
    if (!user || !F) return;
    Object.keys(apps).forEach(function (k) { stop(k); watch(k); });
    peeks.forEach(peekSub);
  }
  var hiddenAt = 0;
  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt > 30000) refresh();
    });
  }
  if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("online", refresh);
  // Après une fusion, renvoie l'état fusionné s'il diffère de celui du compte : sans cela, un appareil qui a écrit
  // depuis un état périmé (hors connexion) écrase le compte, et l'autre appareil garde ses données pour lui jusqu'à
  // sa prochaine sauvegarde. Quatre renvois par minute au plus, au cas où une fusion ne convergerait pas.
  function echo(key) {
    var a = apps[key], n = Date.now();
    if (n - (a.eAt || 0) > 60000) { a.eAt = n; a.e = 0; }
    if (a.e++ < 4) push(key);
  }
  function push(key, now) {
    var a = apps[key]; if (!a) return;
    clearTimeout(a.t);
    a.t = setTimeout(function () {
      if (!a.ref) return;
      var o; try { o = a.get(); } catch (e) { return; }
      var c = canon(o); if (c === a.canon) return;
      var json = JSON.stringify(o);
      if (json.length > MAX) { setState("plein"); return; }
      a.canon = c; a.last = json;
      // Envoi non confirmé par le serveur : compté, pour signaler une file d'attente bloquée au lieu d'afficher « synchronisée ».
      a.fly = (a.fly || 0) + 1; if (!a.pend) a.pend = Date.now();
      setTimeout(emit, STUCK + 1000);
      var done = function () { if (--a.fly <= 0) { a.fly = 0; a.pend = 0; } };
      F.Fs.setDoc(a.ref, { json: json, u: Date.now(), dev: DEV }).then(function () { done(); a.tx = Date.now(); if (state !== "erreur") setState(navigator.onLine === false ? "attente" : "ok"); }, function (e) { done(); setState("erreur", (e && e.code) || "erreur"); });
    }, now ? 0 : 1200);
  }

  var peeks = [];
  function peekStop(w) { if (w.unsub) { w.unsub(); w.unsub = null; } }
  function peekSub(w) {
    peekStop(w);
    if (!user || !F) return;
    w.unsub = F.Fs.onSnapshot(F.Fs.doc(F.db, "users", user.uid, "apps", w.key), function (snap) {
      var d = snap.exists() ? snap.data() : null;
      if (d && d.json) { try { w.cb(JSON.parse(d.json)); } catch (e) { } }
    }, function () { });
  }

  var MSG = {
    "auth/invalid-credential": "Identifiant ou mot de passe incorrect.",
    "auth/wrong-password": "Identifiant ou mot de passe incorrect.",
    "auth/user-not-found": "Identifiant ou mot de passe incorrect.",
    "auth/invalid-email": "Identifiant invalide.",
    "auth/email-already-in-use": "Cet identifiant est déjà pris.",
    "auth/weak-password": "Mot de passe trop court : 6 caractères minimum.",
    "auth/network-request-failed": "Pas de connexion réseau.",
    "auth/too-many-requests": "Trop d'essais : réessaie dans quelques minutes.",
    "auth/admin-restricted-operation": "La création de compte est fermée.",
    "auth/operation-not-allowed": "La création de compte est fermée."
  };
  function msg(e) { return MSG[e && e.code] || "Échec : " + ((e && (e.code || e.message)) || "erreur inconnue") + "."; }
  function norm(name) { return String(name || "").trim().toLowerCase(); }
  function check(name, pw) {
    if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(norm(name))) return "Identifiant : 3 à 30 caractères, lettres, chiffres, point, tiret ou tiret bas.";
    if (!pw) return "Saisis un mot de passe.";
    return "";
  }
  // Firebase exige 6 caractères au moins : on lui envoie l'empreinte SHA-256 du mot de passe,
  // ce qui accepte n'importe quel mot de passe, même très court.
  function derive(pw) {
    var data = new TextEncoder().encode("prepa-dgfip-2027|" + pw);
    return crypto.subtle.digest("SHA-256", data).then(function (h) {
      return "p1:" + Array.prototype.map.call(new Uint8Array(h), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
    });
  }
  function bad(e) { var c = e && e.code; return c === "auth/invalid-credential" || c === "auth/wrong-password" || c === "auth/user-not-found"; }

  var api = {
    attach: function (key, o) {
      apps[key] = { get: o.get, merge: o.merge, canon: null, last: null, ref: null, unsub: null, t: null };
      if (user) watch(key); else if (hasFlag()) start();
    },
    changed: function (key) { if (apps[key] && apps[key].ref) push(key); },
    // Identifiant de cet appareil (navigateur) : les compteurs de réponses du QCM sont tenus par appareil.
    device: DEV,
    // Relance à la demande (bouton « Resynchroniser » du bloc Compte).
    refresh: refresh,
    repair: repair,
    // Reprend la session enregistrée sur l'appareil sans appli attachée (page d'accueil).
    resume: function () { if (hasFlag()) start().catch(function () { }); },
    connected: hasFlag,
    // Lecture seule de l'état d'une appli dans le compte (page d'accueil) : cb(état) à chaque version reçue, rien n'est écrit.
    peek: function (key, cb) {
      var w = { key: key, cb: cb, unsub: null }; peeks.push(w);
      if (user) peekSub(w); else if (hasFlag()) start().catch(function () { });
      return function () { peekStop(w); peeks = peeks.filter(function (x) { return x !== w; }); };
    },
    onStatus: function (f) { listeners.push(f); f(api.status()); },
    status: function () { return { state: state, error: err, user: user ? (user.displayName || (user.email || "").split("@")[0]) : "" }; },
    label: function () {
      var s = api.status();
      if (s.user && blocked()) return "sur cet appareil : l'envoi au compte " + s.user + " attend depuis " + hm(blocked()) + " (bouton « Réparer la synchro » ci-dessous)";
      if (s.user) return state === "ok" ? "synchronisée avec le compte " + s.user : state === "plein" ? "trop volumineuse pour le compte, sur cet appareil seulement" : state === "erreur" ? "sur cet appareil (synchro en erreur)" : "sur cet appareil, envoi au compte " + s.user + " dès que le réseau revient";
      return state === "connexion" ? "sur cet appareil (connexion…)" : "sur cet appareil";
    },
    signIn: function (name, pw) {
      var why = check(name, pw); if (why) return Promise.reject(why);
      var mail = norm(name) + "@" + DOMAIN;
      return Promise.all([start(), derive(pw)]).then(function (r) {
        var f = r[0], key = r[1];
        return f.Au.signInWithEmailAndPassword(f.auth, mail, key).catch(function (e) {
          // Compte créé avant l'empreinte (mot de passe envoyé tel quel) : connexion puis conversion.
          if (!bad(e) || pw.length < 6) throw e;
          return f.Au.signInWithEmailAndPassword(f.auth, mail, pw).then(function (cr) { return f.Au.updatePassword(cr.user, key).catch(function () { }); }, function () { throw e; });
        });
      }).then(function () { }, function (e) { throw typeof e === "string" ? e : msg(e); });
    },
    signUp: function (name, pw) {
      var why = check(name, pw); if (why) return Promise.reject(why);
      return Promise.all([start(), derive(pw)]).then(function (r) {
        var f = r[0];
        return f.Au.createUserWithEmailAndPassword(f.auth, norm(name) + "@" + DOMAIN, r[1]).then(function (cr) {
          return f.Au.updateProfile(cr.user, { displayName: norm(name) }).then(function () { emit(); });
        });
      }).then(function () { }, function (e) { throw typeof e === "string" ? e : msg(e); });
    },
    signOut: function () { return F ? F.Au.signOut(F.auth) : Promise.resolve(); },
    // Bloc « Compte » prêt à l'emploi, construit avec les classes de la charte (sheet, field, input, btn).
    mount: function (el) {
      if (!el) return;
      function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
      // Où en est l'échange avec le compte, pour comparer deux appareils d'un coup d'œil.
      function trace() {
        var p = ["Appareil " + DEV];
        Object.keys(apps).forEach(function (k) {
          var a = apps[k];
          p.push(a.srv ? "compte joint à " + hm(a.srv) : "compte pas encore joint");
          if (a.rx) p.push("version du compte du " + new Date(a.rx.u || a.rx.at).toLocaleDateString("fr-FR") + " à " + hm(a.rx.u || a.rx.at) + (a.rx.mine ? ", écrite ici" : ", écrite par un autre appareil"));
          if (a.tx) p.push("dernier envoi confirmé à " + hm(a.tx));
          if (a.pend) p.push("envoi en attente depuis " + hm(a.pend));
        });
        return p.join(" · ") + ".";
      }
      function draw(msgText) {
        var s = api.status();
        if (!s.user && state === "connexion" && hasFlag()) { el.innerHTML = '<p class="small muted">Connexion à ton compte…</p>'; return; }
        if (s.user) {
          el.innerHTML = '<div class="sync-box"><p>Connecté en tant que <b>' + esc(s.user) + '</b>. Ta progression est ' + esc(api.label()) + '.</p>' +
            '<p class="small muted">Connecte-toi avec le même identifiant sur tes autres appareils : tout se synchronise en direct, et hors connexion les changements partent dès le retour du réseau.</p>' +
            '<p class="small muted">' + esc(trace()) + '</p>' +
            '<div class="row"><button type="button" class="btn" data-sync="now">Resynchroniser</button><button type="button" class="btn" data-sync="fix">Réparer la synchro</button><button type="button" class="btn" data-sync="out">Se déconnecter</button></div></div>';
        } else {
          el.innerHTML = '<form class="sync-box" novalidate><p class="small muted">Sans compte, la progression reste sur cet appareil. Avec un compte, elle se synchronise entre tous tes appareils.</p>' +
            '<label class="field"><span>Identifiant</span><input class="input" name="u" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>' +
            '<label class="field"><span>Mot de passe</span><input class="input" name="p" type="password" autocomplete="current-password" required></label>' +
            (msgText ? '<p class="small sync-err" role="alert">' + esc(msgText) + '</p>' : '') +
            '<div class="row"><button type="submit" class="btn pri" data-sync="in">Se connecter</button><button type="button" class="btn" data-sync="up">Créer le compte</button></div>' +
            '<p class="small muted">Pas de récupération par e-mail : note bien ton mot de passe.</p></form>';
        }
      }
      function go(kind) {
        var f = el.querySelector("form"); if (!f) return;
        var u = f.elements.u.value, p = f.elements.p.value;
        el.querySelectorAll("button").forEach(function (b) { b.disabled = true; });
        (kind === "up" ? api.signUp(u, p) : api.signIn(u, p)).then(function () { draw(); }, function (m) { draw(m); var f2 = el.querySelector("form"); if (f2) { f2.elements.u.value = u; } });
      }
      el.onsubmit = function (e) { e.preventDefault(); go("in"); };
      el.onclick = function (e) {
        var b = e.target.closest("[data-sync]"); if (!b) return;
        if (b.dataset.sync === "up") { e.preventDefault(); go("up"); }
        if (b.dataset.sync === "now") { refresh(); draw(); setTimeout(draw, 4000); }
        if (b.dataset.sync === "fix") { b.disabled = true; repair(); }
        if (b.dataset.sync === "out") { b.disabled = true; api.signOut().then(function () { draw(); }); }
      };
      if (!el._syncListen) { el._syncListen = true; listeners.push(function () { if (el.isConnected && !el.contains(document.activeElement)) draw(); }); }
      draw();
    }
  };
  /* ---------- Dépôts de fichiers (copies, réponses orales) pour une correction faite depuis le terminal ----------
     users/{uid}/depots/{id} : description (sujet, fichiers, statut, correction) ;
     users/{uid}/depots/{id}/parts/{n} : morceaux des fichiers en base64 (moins de 1 Mo par document Firestore).
     Les morceaux sont écrits avant la description : une description présente signifie un dépôt complet. */
  var PART = 700000, depWatchers = [];
  function b64(buf) {
    var a = new Uint8Array(buf), s = "", CH = 0x8000;
    for (var i = 0; i < a.length; i += CH) s += String.fromCharCode.apply(null, a.subarray(i, i + CH));
    return btoa(s);
  }
  function depPath(id) { return "users/" + user.uid + "/depots/" + id; }
  function depStop(w) { if (w.unsub) { w.unsub(); w.unsub = null; } }
  function depSub(w) {
    depStop(w);
    if (!user || !F) { w.cb([]); return; }
    w.unsub = F.Fs.onSnapshot(F.Fs.collection(F.db, "users", user.uid, "depots"), function (s) {
      w.cb(s.docs.map(function (d) { return d.data(); }).sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); }));
    }, function () { w.cb(null); });
  }
  api.depots = {
    ready: function () { return !!(user && F); },
    // files : [{ name, type, data: ArrayBuffer }] ; progress(0..1) appelé après chaque morceau envoyé
    add: function (meta, files, progress) {
      if (!user || !F) return Promise.reject("Connecte-toi (en haut de l'accueil) pour déposer.");
      var Fs = F.Fs, parts = [], list = [];
      files.forEach(function (f) {
        var n = Math.max(1, Math.ceil(f.data.byteLength / PART));
        list.push({ name: f.name, type: f.type || "application/octet-stream", size: f.data.byteLength, first: parts.length, parts: n });
        for (var k = 0; k < n; k++) parts.push(f.data.slice(k * PART, (k + 1) * PART));
      });
      var base = depPath(meta.id), done = 0;
      return parts.reduce(function (p, buf, j) {
        return p.then(function () { return Fs.setDoc(Fs.doc(F.db, base + "/parts/" + j), { d: b64(buf) }); }).then(function () { done++; if (progress) progress(done / parts.length); });
      }, Promise.resolve()).then(function () {
        return Fs.setDoc(Fs.doc(F.db, base), Object.assign({}, meta, { files: list, nparts: parts.length, statut: "depose", createdAt: Date.now() }));
      });
    },
    // cb(liste) à chaque changement, cb([]) sans compte, cb(null) en cas d'erreur ; renvoie la fonction d'arrêt
    watch: function (cb) {
      var w = { cb: cb, unsub: null }; depWatchers.push(w);
      if (user) depSub(w); else { cb([]); if (hasFlag()) start().catch(function () { }); }
      return function () { depStop(w); depWatchers = depWatchers.filter(function (x) { return x !== w; }); };
    },
    remove: function (d) {
      if (!user || !F) return Promise.reject("Connecte-toi pour supprimer.");
      var Fs = F.Fs, base = depPath(d.id), ops = [];
      for (var j = 0; j < (d.nparts || 0); j++) ops.push(Fs.deleteDoc(Fs.doc(F.db, base + "/parts/" + j)));
      return Promise.all(ops).then(function () { return Fs.deleteDoc(Fs.doc(F.db, base)); });
    }
  };
  window.PrepaSync = api;
})();
