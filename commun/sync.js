/* Synchro commune aux applis Prépa DGFiP 2027 : compte (identifiant + mot de passe) et Firestore.
   Une appli s'enregistre avec PrepaSync.attach(clé, { get, merge }) :
     get()    renvoie l'état local à synchroniser (objet JSON) ;
     merge(o) fusionne l'état distant o dans l'état local, le sauvegarde et réaffiche, sans rappeler changed().
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
  var FLAG = "prepa-sync-compte", MAX = 900000;

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
        user = u;
        if (u) { flag(true); setState("attente"); Object.keys(apps).forEach(watch); }
        else { flag(false); setState("local"); }
      });
      return f;
    }, function (e) { started = false; throw e; });
  }

  function stop(key) { var a = apps[key]; if (a && a.unsub) { a.unsub(); a.unsub = null; a.ref = null; } }
  function watch(key) {
    var a = apps[key]; if (!a || !user || !F || a.unsub) return;
    a.ref = F.Fs.doc(F.db, "users", user.uid, "apps", key);
    a.first = true;
    a.unsub = F.Fs.onSnapshot(a.ref, function (snap) {
      if (snap.metadata.hasPendingWrites) return; // écho de nos propres écritures
      var d = snap.exists() ? snap.data() : null;
      if (d && d.json && d.json !== a.last) {
        a.last = d.json;
        try { var o = JSON.parse(d.json); a.canon = canon(o); a.merge(o); } catch (e) { }
      }
      if (a.first) { a.first = false; push(key, !d); }
      setState(snap.metadata.fromCache ? "attente" : "ok");
    }, function (e) { setState("erreur", (e && e.code) || "erreur"); });
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
      F.Fs.setDoc(a.ref, { json: json, u: Date.now(), dev: DEV }).then(function () { if (state !== "erreur") setState(navigator.onLine === false ? "attente" : "ok"); }, function (e) { setState("erreur", (e && e.code) || "erreur"); });
    }, now ? 0 : 1200);
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
    if (!pw || pw.length < 6) return "Mot de passe : 6 caractères minimum.";
    return "";
  }

  var api = {
    attach: function (key, o) {
      apps[key] = { get: o.get, merge: o.merge, canon: null, last: null, ref: null, unsub: null, t: null };
      if (user) watch(key); else if (hasFlag()) start();
    },
    changed: function (key) { if (apps[key] && apps[key].ref) push(key); },
    onStatus: function (f) { listeners.push(f); f(api.status()); },
    status: function () { return { state: state, error: err, user: user ? (user.displayName || (user.email || "").split("@")[0]) : "" }; },
    label: function () {
      var s = api.status();
      if (s.user) return state === "ok" ? "synchronisée avec le compte " + s.user : state === "plein" ? "trop volumineuse pour le compte, sur cet appareil seulement" : state === "erreur" ? "sur cet appareil (synchro en erreur)" : "sur cet appareil, envoi au compte " + s.user + " dès que le réseau revient";
      return state === "connexion" ? "sur cet appareil (connexion…)" : "sur cet appareil";
    },
    signIn: function (name, pw) {
      var bad = check(name, pw); if (bad) return Promise.reject(bad);
      return start().then(function (f) { return f.Au.signInWithEmailAndPassword(f.auth, norm(name) + "@" + DOMAIN, pw); }).then(function () { }, function (e) { throw typeof e === "string" ? e : msg(e); });
    },
    signUp: function (name, pw) {
      var bad = check(name, pw); if (bad) return Promise.reject(bad);
      return start().then(function (f) {
        return f.Au.createUserWithEmailAndPassword(f.auth, norm(name) + "@" + DOMAIN, pw).then(function (cr) {
          return f.Au.updateProfile(cr.user, { displayName: norm(name) }).then(function () { emit(); });
        });
      }).then(function () { }, function (e) { throw typeof e === "string" ? e : msg(e); });
    },
    signOut: function () { return F ? F.Au.signOut(F.auth) : Promise.resolve(); },
    // Bloc « Compte » prêt à l'emploi, construit avec les classes de la charte (sheet, field, input, btn).
    mount: function (el) {
      if (!el) return;
      function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
      function draw(msgText) {
        var s = api.status();
        if (s.user) {
          el.innerHTML = '<div class="sync-box"><p>Connecté en tant que <b>' + esc(s.user) + '</b>. Ta progression est ' + esc(api.label()) + '.</p>' +
            '<p class="small muted">Connecte-toi avec le même identifiant sur tes autres appareils : tout se synchronise en direct, et hors connexion les changements partent dès le retour du réseau.</p>' +
            '<div class="row"><button type="button" class="btn" data-sync="out">Se déconnecter</button></div></div>';
        } else {
          el.innerHTML = '<form class="sync-box" novalidate><p class="small muted">Sans compte, la progression reste sur cet appareil. Avec un compte, elle se synchronise entre tous tes appareils.</p>' +
            '<label class="field"><span>Identifiant</span><input class="input" name="u" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>' +
            '<label class="field"><span>Mot de passe</span><input class="input" name="p" type="password" autocomplete="current-password" required minlength="6"></label>' +
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
        if (b.dataset.sync === "out") { b.disabled = true; api.signOut().then(function () { draw(); }); }
      };
      if (!el._syncListen) { el._syncListen = true; listeners.push(function () { if (el.isConnected && !el.contains(document.activeElement)) draw(); }); }
      draw();
    }
  };
  window.PrepaSync = api;
})();
