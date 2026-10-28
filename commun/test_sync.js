/* Test de la synchro entre appareils : le vrai commun/sync.js et le vrai code de fusion du QCM et de l'atelier QRC,
   branchés sur un faux Firestore (un serveur, deux appareils, un réseau qu'on peut couper, une horloge virtuelle).
   Lancer : node commun/test_sync.js (après « node build.js » dans 06 Atelier QRC, qui produit dist/engine.js). */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..') + path.sep;
const SYNC = fs.readFileSync(ROOT + 'commun/sync.js', 'utf8').replace(/import\(SDK \+ "([^"]+)"\)/g, '__imp("$1")');
let fails = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { fails++; console.log('ÉCHEC :', msg); } }

/* ---------- Faux Firestore, réseau et horloge ---------- */
const clock = { t: Date.UTC(2026, 9, 28, 8, 0, 0) }, timers = [], server = { docs: {}, clients: [], writes: [] };
let tid = 0;
const settle = async () => { for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r)); };
async function advance(ms) {
  const end = clock.t + ms;
  for (;;) {
    await settle();
    timers.sort((a, b) => a.at - b.at || a.id - b.id);
    const nx = timers.find(x => x.at <= end); if (!nx) break;
    timers.splice(timers.indexOf(nx), 1); clock.t = Math.max(clock.t, nx.at); nx.fn();
  }
  clock.t = end; await settle();
}
class FakeDate extends Date { constructor(...a) { if (a.length) super(...a); else super(clock.t); } static now() { return clock.t; } }

function device(name, local) {
  const c = { name, online: true, listeners: [], pending: new Map(), cache: new Map(), resolvers: [] }, store = {};
  const view = p => c.pending.has(p) ? c.pending.get(p) : (c.online ? server.docs[p] : c.cache.get(p));
  c.emit = (l, force) => {
    const data = view(l.path), hasP = c.pending.has(l.path), sig = JSON.stringify([data, hasP]);
    if (!force && l.sig === sig) return; l.sig = sig;
    if (data === undefined && !c.online) return;
    if (!hasP && c.online && data !== undefined) c.cache.set(l.path, data);
    l.next({ exists: () => data !== undefined, data: () => data, metadata: { hasPendingWrites: hasP, fromCache: !c.online } });
  };
  c.flush = () => {
    for (const [p, d] of [...c.pending]) {
      server.docs[p] = d; c.pending.delete(p); c.cache.set(p, d); server.writes.push({ from: name, path: p });
      server.clients.forEach(o => { if (o !== c && o.online) o.listeners.filter(l => l.path === p).forEach(l => o.emit(l)); });
    }
    c.listeners.forEach(l => c.emit(l)); c.resolvers.splice(0).forEach(r => r());
  };
  c.setOnline = v => { c.online = v; if (v) { c.flush(); c.listeners.forEach(l => c.emit(l)); } };
  server.clients.push(c);
  const user = { uid: 'u1', email: 'fleurine@prepa.pbailly.fr', displayName: 'fleurine' };
  const Fs = {
    initializeFirestore: () => ({}), persistentLocalCache: () => ({}), persistentMultipleTabManager: () => ({}), getFirestore: () => ({}),
    doc: (db, ...s) => ({ path: s.join('/') }), collection: (db, ...s) => ({ path: s.join('/') }),
    onSnapshot: (ref, next) => { const l = { path: ref.path, next, sig: null }; c.listeners.push(l); Promise.resolve().then(() => c.emit(l, true)); return () => { c.listeners = c.listeners.filter(x => x !== l); }; },
    setDoc: (ref, data) => {
      c.pending.set(ref.path, JSON.parse(JSON.stringify(data)));
      c.listeners.filter(l => l.path === ref.path).forEach(l => c.emit(l));
      if (c.online) { c.flush(); return Promise.resolve(); }
      return new Promise(r => c.resolvers.push(r));
    },
    deleteDoc: () => Promise.resolve()
  };
  const mods = {
    'firebase-app.js': { initializeApp: () => ({}) },
    'firebase-auth.js': { indexedDBLocalPersistence: 1, browserLocalPersistence: 2, initializeAuth: () => ({}), onAuthStateChanged: (a, cb) => { Promise.resolve().then(() => cb(user)); return () => { }; }, signOut: () => Promise.resolve() },
    'firebase-firestore.js': Fs
  };
  const ctx = {
    console, setImmediate, Promise, JSON, Object, Array, Math, Number, String, Set, Map, Error, RegExp, isFinite, parseInt, parseFloat, Uint8Array, TextEncoder,
    Date: FakeDate, crypto: require('crypto').webcrypto, navigator: { get onLine() { return c.online; } },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    setTimeout: (fn, ms) => { const id = ++tid; timers.push({ id, at: clock.t + (ms || 0), fn }); return id; },
    clearTimeout: id => { const i = timers.findIndex(x => x.id === id); if (i >= 0) timers.splice(i, 1); },
    setInterval: () => 0, clearInterval: () => { }, __imp: n => Promise.resolve(mods[n]), btoa: s => Buffer.from(s, 'binary').toString('base64'),
    document: { activeElement: null, querySelector: () => null, getElementById: () => null, addEventListener() { } }
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  Object.assign(store, { 'prepa-sync-compte': '1', 'prepa-appareil': name }, local || {});
  c.store = store; c.ctx = vm.createContext(ctx); c.eval = src => vm.runInContext(src, c.ctx);
  c.eval(SYNC);
  return c;
}
const doc = key => { const d = server.docs['users/u1/apps/' + key]; return d ? JSON.parse(d.json) : null; };
function reset() { server.docs = {}; server.clients.length = 0; server.writes.length = 0; timers.length = 0; }

/* ---------- QCM : code d'état et de fusion pris tel quel dans app.html ---------- */
const html = fs.readFileSync(ROOT + '06 Appli QCM/app.html', 'utf8');
const QCM = html.slice(html.indexOf('// ---------- État ----------'), html.indexOf('// ---------- Sessions ----------'));
if (!QCM.includes('function merge(')) throw new Error('code de fusion du QCM introuvable');
const QCM_PRE = 'const KEY="qcm-dgfip-2027"; function dayNum(d=new Date()){ return Math.floor((d.getTime() - d.getTimezoneOffset()*60000)/86400000); } let BANK=[]; function render(){} function renderPills(){} const MODULES={insp:{t:[]}};\n';
function qcm(name, local) { const c = device(name, local); c.eval(QCM_PRE + QCM + '\ninitSync();'); return c; }
const qcmAnswer = (c, a, b) => c.eval(`for(let i=${a};i<=${b};i++) review("q"+i, true); save();`);
const qcmN = c => c.eval('Object.keys(S.cards).length');
const qcmLocal = (a, b, u) => { const cards = {}; for (let i = a; i <= b; i++) cards['q' + i] = [20000, 3, 250, 1, 0, u / 1000, 1, 1]; return { 'qcm-dgfip-2027': JSON.stringify({ v: 2, u, cards }) }; };

/* ---------- Atelier QRC : fusion et stockage pris dans src/app.js ---------- */
const qsrc = fs.readFileSync(ROOT + '06 Atelier QRC/src/app.js', 'utf8');
const cut = (from, to) => { const a = qsrc.indexOf(from), b = qsrc.indexOf(to, a); if (a < 0 || b < 0) throw new Error('code du QRC introuvable : ' + from); return qsrc.slice(a, b); };
const QRC_REC = cut('  var COPIES = 6;', '  // Revoir un exercice de l'), QRC_UN = cut('  // Supprimer un entraînement de l', '  /* ---------- Exercices');
const ENGINE = fs.readFileSync(ROOT + '06 Atelier QRC/dist/engine.js', 'utf8');
const QRC_PRE = "var KEY='atelier-qrc-v1', DAY=86400000, INTERVALS=[0,1,3,7,14,30]; var S={prog:null}; var uid=0; function render(){} function status(){} var $=function(){return null;};\n";
const QRC_STORE = cut('  /* ---------- Stockage', '  function status()');
function qrc(name, local) {
  const c = device(name, local); c.eval(ENGINE);
  c.eval(QRC_PRE + 'S.prog = blank();\n' + cut('  function blank()', '  var $ =') + 'S.prog = blank();\n' + cut('  /* ---------- Fusion appareil', '  /* ---------- Stockage') + QRC_REC + QRC_UN + QRC_STORE + '\nStore.init();');
  return c;
}
const qrcDo = (c, type, n, score) => c.eval(`for(var i=0;i<${n};i++) record(${JSON.stringify(type)}, ${score}, 200, "train", null); Store.save();`);
const qrcN = c => c.eval('Object.values(S.prog.types).reduce(function(a,s){return a+s.n;},0)');
const qrcTypes = c => c.eval('Object.keys(S.prog.types).filter(function(k){return S.prog.types[k].n;}).sort().join(",")');

(async () => {
  /* 1. QCM : un appareil écrit depuis un état périmé (hors connexion) puis revient en ligne */
  reset();
  let pc = qcm('pc'), tel = qcm('tel'); await advance(3000);
  qcmAnswer(pc, 1, 10); await advance(3000);
  ok(qcmN(tel) === 10, 'QCM : le tel reçoit en direct les 10 réponses du PC');
  tel.setOnline(false);
  qcmAnswer(pc, 11, 20); await advance(3000);
  qcmAnswer(tel, 21, 30); await advance(3000);
  tel.setOnline(true); await advance(5000);
  ok(qcmN(pc) === 30 && qcmN(tel) === 30, `QCM : les deux appareils ont les 30 cartes après le retour du réseau (pc ${qcmN(pc)}, tel ${qcmN(tel)})`);
  ok(Object.keys(doc('qcm').cards).length === 30, 'QCM : le compte a retrouvé les 30 cartes sans nouvelle réponse sur le PC');
  const w = server.writes.length; await advance(3600000);
  ok(server.writes.length === w, `QCM : plus aucune écriture au repos (${server.writes.length - w} de trop)`);
  ok(server.writes.length <= 8, `QCM : pas de renvoi en boucle (${server.writes.length} écritures)`);

  /* 2. QCM : première connexion, chaque appareil a sa propre progression */
  reset();
  pc = qcm('pc', qcmLocal(1, 10, clock.t - 5000)); tel = qcm('tel', qcmLocal(11, 20, clock.t - 1000)); await advance(5000);
  ok(qcmN(pc) === 20 && qcmN(tel) === 20 && Object.keys(doc('qcm').cards).length === 20, 'QCM : première connexion, les deux progressions s\'additionnent');

  /* 3. QRC : types travaillés hors connexion sur chaque appareil */
  reset();
  pc = qrc('pc'); tel = qrc('tel'); await advance(3000);
  qrcDo(pc, 'amort', 5, 0.9); await advance(3000);
  tel.setOnline(false);
  qrcDo(pc, 'stocks', 4, 0.7); await advance(3000);
  qrcDo(tel, 'paie', 6, 0.5); await advance(3000);
  tel.setOnline(true); await advance(5000);
  ok(qrcN(pc) === 15 && qrcN(tel) === 15, `QRC : 5 + 4 + 6 exercices sur les deux appareils (pc ${qrcN(pc)}, tel ${qrcN(tel)})`);
  ok(qrcTypes(pc) === 'amort,paie,stocks' && qrcTypes(tel) === 'amort,paie,stocks', 'QRC : les trois types sont présents des deux côtés');
  const w2 = server.writes.length; await advance(3600000);
  ok(server.writes.length === w2 && w2 <= 8, `QRC : pas de renvoi en boucle (${server.writes.length} écritures)`);

  /* 4. QRC : une suppression se propage, un type travaillé ensuite sur l'autre appareil revient */
  qrcDo(pc, 'amort', 1, 0.9); await advance(3000);
  tel.eval('unrecord("paie", 0); unrecord("paie", 0); Store.save();'); await advance(3000);
  ok(qrcN(pc) === 14 && qrcN(tel) === 14, `QRC : deux exercices supprimés sur le tel disparaissent aussi du PC (pc ${qrcN(pc)}, tel ${qrcN(tel)})`);
  tel.eval('S.prog.epreuves = [{ d: 1, p: "I", s: 0.5, t: 60, x: [] }, { d: 2, p: "I", s: 0.6, t: 60, x: [] }]; Store.save();'); await advance(3000);
  ok(pc.eval('S.prog.epreuves.length') === 2, 'QRC : deux épreuves arrivent sur le PC');
  pc.eval('S.prog.epreuves = S.prog.epreuves.filter(function(e){return e.d!==1;}); S.prog.xdel = S.prog.xdel.concat(1); Store.save();'); await advance(3000);
  ok(tel.eval('S.prog.epreuves.length') === 1 && pc.eval('S.prog.epreuves.length') === 1, 'QRC : l\'épreuve supprimée sur le PC disparaît du tel');
  tel.setOnline(false); pc.eval('S.prog = cleared(S.prog); Store.save();');
  await advance(3000); tel.setOnline(true); await advance(5000);
  ok(qrcN(pc) === 0 && qrcN(tel) === 0 && tel.eval('S.prog.epreuves.length') === 0, 'QRC : « Effacer ma progression » sur le PC vide aussi le tel');

  /* 5. QRC : première connexion avec deux progressions locales différentes */
  reset();
  const prog = (types, updated) => ({ 'atelier-qrc-v1': JSON.stringify({ v: 1, updated, types, epreuves: [], settings: { profil: 'I', pcgOld: false } }) });
  const ty = (n, d) => ({ n, sum: n * 0.8, box: 1, due: 0, last: [{ s: 0.8, t: 100, d, m: 'train' }] });
  pc = qrc('pc', prog({ amort: ty(7, 1000), tva_ca3: ty(2, 1100) }, 1100)); tel = qrc('tel', prog({ paie: ty(4, 2000) }, 2000)); await advance(5000);
  ok(qrcN(pc) === 13 && qrcN(tel) === 13 && qrcTypes(pc) === 'amort,paie,tva_ca3', `QRC : première connexion, les progressions s'additionnent (pc ${qrcN(pc)}, tel ${qrcN(tel)})`);

  /* 6. Lecture seule du compte pour l'accueil */
  reset();
  pc = qcm('pc'); const home = device('accueil'); await advance(3000);
  let got = null; home.eval('PrepaSync.peek("qcm", function (o) { globalThis.__got = o; })'); await advance(1000);
  qcmAnswer(pc, 1, 12); await advance(3000);
  got = home.eval('globalThis.__got');
  ok(got && Object.keys(got.cards).length === 12, 'Accueil : l\'état du compte arrive en lecture seule');
  ok(server.writes.every(x => x.from === 'pc'), 'Accueil : aucune écriture depuis l\'accueil');

  console.log(`\n${checks} vérifications, ${fails} échec(s)`);
  process.exit(fails ? 1 : 0);
})();
