// Vérifie les données, la logique (fusion, chrono, notes) et la page construite.  node test/test.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const D = require(path.join(ROOT, 'src', 'data.js'));
const C = require(path.join(ROOT, 'src', 'core.js'));
let n = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); n++; };

/* ---------- Données ---------- */
const ids = new Set();
D.Q.forEach(q => { ok(!ids.has(q.id), 'id en double : ' + q.id); ids.add(q.id); });
ok(D.Q.length >= 60, 'au moins 60 questions (' + D.Q.length + ')');
const cats = D.CATS.map(c => c.id);
D.Q.forEach(q => {
  ok(cats.includes(q.c), 'catégorie inconnue : ' + q.id);
  ok(Array.isArray(q.p) && q.p.length >= 2, 'pistes manquantes : ' + q.id);
  ok(typeof q.q === 'string' && q.q.length > 10, 'question vide : ' + q.id);
  if (q.c === 'situ') ok(Object.keys(D.SUBS).includes(q.s), 'type de situation : ' + q.id);
});
cats.forEach(c => ok(D.Q.filter(q => q.c === c).length >= 10, 'au moins 10 questions en ' + c));
Object.keys(D.SUBS).forEach(s => ok(D.Q.filter(q => q.s === s).length >= 2, 'au moins 2 situations ' + s));
ok(D.Q.filter(q => q.pres).length === 1, 'une seule question de présentation');

Object.values(D.EP).forEach(ep => {
  ok(ep.grille.reduce((a, c) => a + c.w, 0) === 20, 'grille ' + ep.id + ' sur 20');
  ok(ep.phases.reduce((a, p) => a + p.min, 0) === ep.min, 'étapes ' + ep.id + ' = ' + ep.min + ' min');
  ok(new Set(ep.grille.map(c => c.id)).size === ep.grille.length, 'critères uniques ' + ep.id);
  ok(new Set(ep.defauts.map(c => c.id)).size === ep.defauts.length, 'défauts uniques ' + ep.id);
});
ok(D.EP.nds.min === 240 && D.EP.ad.min === 180, 'durées officielles des écrits');
ok(D.ORAL.I.min === 35 && D.ORAL.C.min === 25 && D.ORAL.I.pres === 5, 'durées officielles de l’oral');

// Toutes les références de source existent ; tous les PDF liés existent dans site/docs
const refs = [];
const walk = o => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') Object.keys(o).forEach(k => { if (k === 'src') [].concat(o[k]).filter(Boolean).forEach(r => refs.push(r)); else walk(o[k]); }); };
walk(D.EP); walk(D.ORAL); walk(D.NON_PUBLIE);
refs.forEach(r => { const [k, p] = String(r).split(':'); ok(D.SRC[k], 'source inconnue : ' + r); ok(!p || /^\d+$/.test(p), 'page : ' + r); });
const docs = path.join(ROOT, '..', 'site', 'docs');
const pdfs = Object.values(D.SRC).map(s => s.pdf);
D.SUJETS.forEach(s => { if (s.pdf) pdfs.push(s.pdf); if (s.corrige) pdfs.push(s.corrige.pdf); });
// Rapports de jury : liens officiels externes
D.SUJETS.forEach(s => { if (s.rapport) ok(/^https:\/\/www\.economie\.gouv\.fr\/files\/.+\.pdf$/.test(s.rapport.url) && s.rapport.t, 'rapport de jury : ' + s.id); });
pdfs.forEach(u => {
  ok(/^\.\.\/docs\//.test(u), 'lien relatif ../docs/ : ' + u);
  const f = path.join(docs, u.replace(/^\.\.\/docs\//, '').replace(/#.*$/, ''));
  ok(fs.existsSync(f), 'PDF introuvable : ' + f);
});

/* ---------- Fusion pour la synchronisation ---------- */
const A = C.blank(), B = C.blank();
A.ecrits.e1 = { id: 'e1', note: 10, date: 1, updatedAt: 100 };
A.ecrits.e2 = { id: 'e2', note: 12, date: 2, updatedAt: 300 };
B.ecrits.e2 = { id: 'e2', note: 14, date: 2, updatedAt: 200 };
B.ecrits.e3 = { id: 'e3', note: 8, date: 3, updatedAt: 150 };
B.oraux.o1 = { id: 'o1', note: 15, date: 4, updatedAt: 50 };
B.settings = { profil: 'C', updatedAt: 999 };
const AB = C.merge(A, B), BA = C.merge(B, A);
ok(C.same(AB, BA), 'fusion commutative');
ok(C.same(C.merge(AB, B), AB) && C.same(C.merge(AB, A), AB), 'fusion idempotente');
ok(AB.ecrits.e2.note === 12, 'la version la plus récente gagne');
ok(AB.ecrits.e3 && AB.oraux.o1 && AB.settings.profil === 'C', 'entrées distantes ajoutées');
const Del = C.clone(AB); Del.ecrits.e1 = { id: 'e1', deleted: true, date: 1, updatedAt: 400 };
ok(C.merge(AB, Del).ecrits.e1.deleted && C.live(C.merge(AB, Del).ecrits).length === 2, 'suppression propagée');
const tie1 = C.blank(), tie2 = C.blank();
tie1.ecrits.x = { id: 'x', note: 1, updatedAt: 5 }; tie2.ecrits.x = { id: 'x', note: 2, updatedAt: 5 };
ok(C.same(C.merge(tie1, tie2), C.merge(tie2, tie1)), 'égalité de date départagée de la même façon partout');
ok(C.same(C.merge(A, null), A) && C.same(C.merge(A, 'n’importe quoi'), A), 'objet distant invalide ignoré');
ok(C.normalize({ ecrits: [{ id: 'a', updatedAt: 1 }] }).ecrits.a, 'tableau accepté');

/* ---------- Chrono par horodatages ---------- */
const run = { start: 0, pausedMs: 0, pausedAt: null, endedAt: null };
ok(C.elapsed(run, 60000) === 60, 'temps écoulé');
C.pause(run, 60000); ok(C.elapsed(run, 120000) === 60, 'pause figée');
C.resume(run, 120000); ok(C.elapsed(run, 180000) === 120, 'reprise sans compter la pause');
C.finish(run, 200000); ok(C.elapsed(run, 999999) === 140, 'copie rendue figée');
C.reopen(run, 260000); ok(C.elapsed(run, 270000) === 150, 'reprise après « rendre »');
const restored = JSON.parse(JSON.stringify(run)); ok(C.elapsed(restored, 270000) === 150, 'survit à la sérialisation');
const ph = D.EP.nds.phases;
ok(C.phaseAt(ph, 0) === 0 && C.phaseAt(ph, 5 * 60) === 1 && C.phaseAt(ph, 165 * 60) === 6 && C.phaseAt(ph, 240 * 60) === ph.length, 'étape conseillée');

/* ---------- Notes ---------- */
const all4 = {}; D.EP.nds.grille.forEach(c => { all4[c.id] = 4; });
ok(C.gridNote(D.EP.nds.grille, all4).note === 20, '20/20 si tout est très bien');
const half = {}; D.EP.ad.grille.forEach(c => { half[c.id] = 2; });
ok(C.gridNote(D.EP.ad.grille, half).note === 10, '10/20 si tout est moyen');
ok(C.gridNote(D.EP.ad.grille, {}).rated === 0, 'aucun critère noté');
const o = {}; D.ORAL.criteres.forEach(c => { o[c.id] = 3; });
ok(C.oralNote(D.ORAL.criteres, o).note === 15, 'oral : 3 sur 4 partout = 15/20');
ok(C.draw([{ id: 'a' }, { id: 'b' }], { a: 99 }, ['b'], () => 0).id === 'a', 'tirage : question évitée écartée');

/* ---------- Page construite ---------- */
const html = fs.readFileSync(path.join(ROOT, 'Atelier Ecrit Oral.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
ok(scripts.length >= 2, 'scripts présents');
scripts.forEach((code, i) => { try { new Function(code); ok(true); } catch (e) { assert.fail('script ' + (i + 1) + ' : ' + e.message); } });
ok(!/<script[^>]+src=/i.test(html), 'aucun script externe');
const ext = [...html.matchAll(/<link[^>]+href="(https?:[^"]+)"/g)].map(m => m[1]);
ok(ext.every(u => /^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(u)), 'seules les polices sont externes');
ok(/data-app="atelier"/.test(html) && /prepa-theme/.test(html), 'charte et bascule de thème');
// Pas d’emoji dans la page
ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(html), 'pas d’emoji');

console.log(n + ' vérifications réussies');
