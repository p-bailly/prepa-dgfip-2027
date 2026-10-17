// Service worker du site : les applis et les documents restent utilisables hors connexion.
//  - pages HTML : réseau d'abord (les mises à jour arrivent dès qu'on est en ligne), copie en cache sinon ;
//  - polices et SDK Firebase (adresses versionnées) : cache d'abord ;
//  - autres fichiers du site (PDF, icônes) : copie en cache servie tout de suite, rafraîchie en arrière-plan.
// La synchro Firestore et la connexion passent toujours par le réseau (non interceptées).
const CACHE = "prepa-v2";
// Chemins relatifs à l'emplacement du service worker : le site marche à la racine d'un domaine comme dans un sous-dossier.
const BASE = self.registration.scope;
const CORE = ["", "qcm/", "qrc/", "atelier/", "docs/", "manifest.webmanifest", "sync.js", "qcm.svg", "qrc.svg", "icones/icone-192.png"].map(p => new URL(p, BASE).href);

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function put(req, res) {
  if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
  return res;
}
function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error("délai")), ms)); }

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  const versioned = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com" || (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/"));
  if (versioned) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => put(req, res))));
    return;
  }
  if (!same) return;
  const html = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (html) {
    e.respondWith(Promise.race([fetch(req).then(res => put(req, res)), timeout(6000)])
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match(BASE))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => put(req, res)).catch(() => hit);
    return hit || net;
  }));
});
