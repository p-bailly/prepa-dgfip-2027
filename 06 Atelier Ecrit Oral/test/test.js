// Vérifie les données, la logique (fusion, chrono, notes) et la page construite.  node test/test.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const D = require(path.join(ROOT, 'src', 'data.js'));
const C = require(path.join(ROOT, 'src', 'core.js'));
const X = require(path.join(ROOT, 'src', 'exos.js'));
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

/* ---------- Exercices de plan ---------- */
const sujets = D.SUJETS.map(s => s.id);
const xids = new Set();
const uniq = (pre, o) => { ok(!xids.has(pre + o.id), 'exercice en double : ' + pre + o.id); xids.add(pre + o.id); };
const checkRefs = r => [].concat(r || []).forEach(x => { const [k, p] = String(x).split(':'); ok(D.SRC[k] && /^\d+$/.test(p || ''), 'source d’exercice : ' + x); });
const passe = (t, mots) => C.titleCheck(t, mots).every(c => c.ok);
checkRefs(X.METHODE.regles.flatMap(r => r.src));
ok(X.TRI.length >= X.TRI_N * 2 && X.TRI.some(t => t.dyn) && X.TRI.some(t => !t.dyn), 'série de titres à trier');
X.TRI.forEach(t => { uniq('tri:', t); ok(t.t && t.why && typeof t.dyn === 'boolean', 'titre à trier incomplet : ' + t.id); if (t.dyn) ok(passe(t.t), 'titre dynamique qui échoue aux repères : ' + t.t); });
X.CHOIX.forEach(c => {
  uniq('ch:', c); checkRefs(c.src); ok(sujets.includes(c.sujet), 'sujet inconnu : ' + c.id);
  ok(c.o.length === 4 && new Set(c.o.map(o => o.t)).size === 4 && c.o.every(o => o.t && o.why), '4 intitulés distincts expliqués : ' + c.id);
  ok(passe(c.o[0].t), 'bon intitulé qui échoue aux repères : ' + c.o[0].t);
});
X.REECRIRE.forEach(r => {
  uniq('re:', r); checkRefs(r.src); ok(sujets.includes(r.sujet), 'sujet inconnu : ' + r.id);
  ok(!passe(r.statique, r.mots), 'le titre statique doit échouer aux repères : ' + r.statique);
  ok(r.modeles.length >= 1 && r.modeles.every(m => passe(m, r.mots)), 'proposition qui échoue aux repères : ' + r.id);
});
X.LIBELLES.forEach(l => {
  uniq('lib:', l); ok(sujets.includes(l.sujet), 'sujet inconnu : ' + l.id);
  // L’extrait cité vient mot pour mot de la consigne du dossier (ou, pour les annales, de celle de l’onglet Écrit)
  const dos = X.DOSSIERS.find(d => d.sujet === l.sujet), cons = dos ? dos.consigne : D.SUJETS.find(x => x.id === l.sujet).consigne.join(' ');
  ok(cons.includes(l.cle), 'extrait de consigne introuvable : ' + l.id);
  ok(l.o.length === 3 && l.o.every(o => o.I && o.II && o.why), '3 plans expliqués : ' + l.id);
  ok(passe(l.o[0].I) && passe(l.o[0].II), 'bon plan qui échoue aux repères : ' + l.id);
});
X.DOSSIERS.forEach(d => {
  uniq('dos:', d); checkRefs(d.src); ok(sujets.includes(d.sujet), 'sujet inconnu : ' + d.id);
  ok(d.parts.length === 4 && d.etiquettes.length === 4 && d.axes.length === 3, 'plan en 2 × 2 : ' + d.id);
  ok(passe(d.I) && passe(d.II) && d.axes[0].I === d.I && d.axes[0].II === d.II, 'titres de parties du corrigé : ' + d.id);
  d.parts.forEach((p, k) => ok(passe(p.titre, p.mots), 'titre ' + X.PARTS[k] + ' du corrigé qui échoue aux repères : ' + d.id));
  [0, 1, 2, 3].forEach(k => ok(d.idees.filter(x => x.p === k).length >= 2, 'au moins 2 idées en ' + X.PARTS[k] + ' : ' + d.id));
  ok(d.idees.every(x => x.t && [0, 1, 2, 3].includes(x.p)), 'idées placées : ' + d.id);
  if (d.docs) {
    const used = new Set(d.idees.flatMap(x => String(x.d || '').split(/,\s*/).filter(Boolean).map(Number)));
    d.docs.forEach((t, i) => ok(used.has(i + 1), 'document ' + (i + 1) + ' inutilisé : ' + d.id));
  }
  ok(d.consigne && d.transition && d.annonce && d.pourquoi, 'consigne, transition, annonce et explication : ' + d.id);
});
// Repères automatiques sur des cas connus
const fails = (t, id) => C.titleCheck(t).filter(c => !c.ok).map(c => c.id).includes(id);
ok(fails('Constat', 'cat') && fails('Les enjeux du tourisme', 'long') && fails('Les limites de la stratégie nationale', 'cat'), 'étiquettes de dissertation repérées');
ok(fails('Faut-il réguler le tourisme ?', 'forme') && fails('Faut-il réguler le tourisme ?', 'neutre'), 'question et injonction repérées');
ok(fails('On doit protéger les sites fragiles du littoral', 'neutre'), 'avis repéré');
ok(fails('La cosmétique et la crise sanitaire mondiale', 'lien'), 'thème sans lien repéré');
ok(!fails('L’État finance seul l’entretien de son patrimoine', 'lien') && passe('Des jauges qui protègent les sites naturels les plus fragiles'), 'titre dynamique accepté');
ok(C.titleCheck('Un titre sans aucun mot attendu ici', ['patrimoine']).find(c => c.id === 'mots').ok === false, 'mots du dossier absents repérés');

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
const XA = C.blank(), XB = C.blank();
XA.exos['tri:s01'] = { id: 'tri:s01', ok: 1, n: 1, updatedAt: 10 };
XB.exos['tri:s01'] = { id: 'tri:s01', ok: 0, n: 1, updatedAt: 20 };
XB.exos['dos:tour'] = { id: 'dos:tour', ok: 12, n: 18, updatedAt: 5 };
const XM = C.merge(XA, XB);
ok(XM.exos['tri:s01'].ok === 0 && XM.exos['dos:tour'] && C.same(XM, C.merge(XB, XA)) && C.same(C.merge(XM, XB), XM), 'résultats d’exercices fusionnés');
ok(C.normalize({}).exos && typeof C.normalize({}).exos === 'object', 'exos présent dans un état ancien');

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
