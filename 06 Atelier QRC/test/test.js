// Tests : corrigés sur les sujets réels + cohérence de milliers de variantes aléatoires.
const { T, ANNALES, U, AM } = require('../dist/engine.js');
let fails = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { fails++; if (fails < 60) console.log('ÉCHEC :', msg); } }
const near = (a, b, t) => Math.abs(a - b) <= (t === undefined ? 0.011 : t);

function verifEx(ex, ctx) {
  ok(ex && ex.enonce && ex.questions && ex.questions.length, ctx + ' : structure');
  const html = ex.enonce + ex.steps.map(s => s.html).join('') + ex.comment + U.journalHtml(ex.journal);
  ok(!/NaN|undefined|Infinity|\[object/.test(html), ctx + ' : NaN/undefined dans le texte ' + (html.match(/.{40}(NaN|undefined|Infinity|\[object).{20}/) || [''])[0]);
  ex.questions.forEach(q => {
    if (q.kind === 'choice') ok(Number.isInteger(q.ans) && q.ans >= 0 && q.ans < q.options.length, ctx + ' : choix ' + q.id);
    else ok(typeof q.ans === 'number' && isFinite(q.ans), ctx + ' : réponse ' + q.id + ' = ' + q.ans);
  });
  const ids = ex.questions.map(q => q.id); ok(new Set(ids).size === ids.length, ctx + ' : ids uniques');
  ex.journal.forEach((en, i) => {
    ok(U.entryBalanced(en), ctx + ' : écriture ' + i + ' déséquilibrée ' + JSON.stringify(en.lines));
    ok(en.lines.length >= 2, ctx + ' : écriture ' + i + ' trop courte');
    en.lines.forEach(l => ok((l.d > 0) !== (l.c > 0) && /^\d{2,7}$/.test(l.a), ctx + ' : ligne ' + JSON.stringify(l)));
    // l'auto-correction accepte le corrigé lui-même
    const user = en.lines.map(l => ({ a: l.show || l.a, d: l.d ? String(l.d).replace('.', ',') : '', c: l.c ? String(l.c).replace('.', ',') : '' }));
    ok(U.checkEntry(en, user).score === 1, ctx + ' : auto-correction de l’écriture ' + i);
    // et refuse une inversion débit/crédit
    if (en.lines.length >= 2) { const inv = en.lines.map(l => ({ a: l.a, d: l.c, c: l.d })); ok(U.checkEntry(en, inv).score <= 0.5, ctx + ' : inversion détectée ' + i); }
  });
  ex.questions.forEach(q => ok(U.checkNum(q, q.kind === 'choice' ? String(q.ans) : U.n(q.ans, 2)).ok, ctx + ' : saisie de la bonne réponse refusée ' + q.id));
}

// ---- 1. Sujets réels ----
console.log('— Sujets réels —');
ANNALES.forEach(a => {
  const t = T[a.type]; const ex = t.solve(a.p, { profil: 'I' });
  verifEx(ex, a.id);
  Object.keys(a.attendu).forEach(k => {
    const q = ex.questions.find(q => q.id === k);
    ok(q, a.id + ' : question ' + k + ' absente');
    if (!q) return;
    const r = U.checkNum(q, q.kind === 'choice' ? String(a.attendu[k]) : String(a.attendu[k]).replace('.', ','));
    ok(r.ok, a.id + ' : ' + k + ' attendu ' + a.attendu[k] + ', calculé ' + q.ans);
  });
  console.log('  ' + a.id.padEnd(10) + a.src);
});

// Détails supplémentaires
(function () {
  const m = ANNALES.find(a => a.id === 'cfip26_2');
  const P = T.derog.solve(m.p).steps[1].html;
  ['2 017,05', '1 736,90', '−1 063,10', '−1 400,00', '6 632,71', '4 541,25'].forEach(v => ok(P.replace(/ /g, ' ').indexOf(v) >= 0, 'MADRIGAL plan : ' + v));
  const b = T.bilan_fonc.calc(ANNALES.find(a => a.id === 'blanc_2').p);
  ok(b.totE === 4940 && b.totR === 4940 && b.TN2 === 80, 'BELCAMP totaux 4 940 et TN 80');
  const nv = T.sig_caf.calc(ANNALES.find(a => a.id === 'blanc_1').p);
  ok(nv.CAFa === 315 && nv.CAFs === 315, 'NOVALIS CAF additive = soustractive = 315');
  const s = T.sizzla = T.tva_coef.solve(ANNALES.find(a => a.id === 'ifip26_4').p);
  ok(near(s.journal[0].lines.find(l => l.a === '512').c, 990840), 'SIZZLA banque 990 840');
  const alb = T.affectation.solve(ANNALES.find(a => a.id === 'ifip26_3').p).journal[0].lines;
  ok(alb.find(l => l.a === '457').c === 100000 && alb.find(l => l.a === '110' && l.d).d === 1500 && alb.find(l => l.a === '110' && l.c).c === 6000, 'ALBOROSIE écriture');
  const cor = T.affectation.solve(ANNALES.find(a => a.id === 'cfip26_1').p).journal[0].lines;
  ok(cor.find(l => l.a === '119').c === 870 && cor.find(l => l.a === '1068').c === 800, 'CORFU écriture');
  const bij = T.tva_ca3.solve(ANNALES.find(a => a.id === 'cfip26_3').p).journal;
  ok(bij.length === 2 && bij[0].lines.find(l => l.a === '44551').c === 43192 && bij[1].lines[0].d === 43192, 'BIJADOM écritures');
  const cap = T.augcap.solve(ANNALES.find(a => a.id === 'test_1').p).journal;
  ok(cap[0].lines.find(l => l.a === '109').d === 150000 && cap[0].lines.find(l => l.a === '1013').c === 50000 && cap[1].lines.find(l => l.a === '512').c === 4800, 'CAPITALISONS écritures');
  // plan dégressif TERRANOVA N+1
  const pd = AM.degressif(52000, 5, 4); ok(pd.rows[0].a === 13650 && pd.rows[1].a === 13422.5, 'TERRANOVA dégressif');
  // tolérance de saisie
  ok(U.parseNum('12 202,01') === 12202.01 && U.parseNum('1.234,5') === 1234.5 && U.parseNum('−870') === -870 && U.parseNum('68,2 %') === 68.2, 'parseNum');
  const q = { unit: '%', ans: 68.18 }; ok(U.checkNum(q, '68,2').ok && U.checkNum(q, '0,6818').ok && !U.checkNum(q, '70').ok, 'checkNum %');
  // comptes équivalents ancien/nouveau PCG
  const en = { lines: [{ a: '657', d: 100, c: 0 }, { a: '2154', d: 0, c: 100 }] };
  ok(U.checkEntry(en, [{ a: '675', d: '100' }, { a: '2154', c: '100' }]).score === 1, 'équivalence 657/675');
  ok(U.checkEntry(en, [{ a: '657', d: '100' }, { a: '2154', c: '100' }, { a: '512', c: '50' }]).score < 1, 'ligne en trop pénalisée');
})();

// ---- 2. Variantes aléatoires ----
const cnt = {};
console.log('— Variantes aléatoires —');
const N = 1500;
// ONLY=id1,id2 node test/test.js : limite les variantes aléatoires à certains types
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
Object.keys(T).forEach(id => {
  const t = T[id]; if (!t.gen || (ONLY && ONLY.indexOf(id) < 0)) return;
  let nb = 0;
  for (let s = 1; s <= N; s++) {
    const r = U.rng(s * 7919 + id.length);
    const prof = s % 2 ? 'I' : 'C';
    const p = t.gen(r, { profil: prof });
    ok(p, id + ' gen ' + s);
    if (!p) continue;
    const ex = t.solve(JSON.parse(JSON.stringify(p)), { profil: prof });
    verifEx(ex, id + '#' + s);
    // invariants spécifiques
    if (id === 'affectation') { const c = t.calc(p); ok(c.RL >= 0 && c.RAN >= 0 && c.RAN < c.nb * p.arr + 0.01 && c.divTot <= c.BD + 0.01 && near(c.RL + p.RS + p.F + c.divTot + c.RAN, p.R + p.RAN0), id + ' totaux ' + s); }
    if (id === 'tva_ca3') { const c = t.calc(p); ok(c.coll > 0 && c.ded >= 0, id + ' montants ' + s); }
    if (id === 'tva_coef') { const c = t.calc(p); ok(c.ded > 0 && c.ded <= 1 && near(c.tvaD + c.tvaND, c.tva), id + ' coef ' + s); }
    if (id === 'amort' && !p.comp) { const b = (function () { let x = p.prix * (1 - (p.remise || 0)); p.frais.forEach(f => { if (f.incl) x += f.mt; }); return U.r2(x); })(); const pl = AM.lineaire(b, p.n, p.mes.d, p.mes.m), pd = AM.degressif(b, p.n, p.acq.m); ok(near(pl.rows.reduce((a, r) => a + r.a, 0), b, 0.02) && near(pd.rows.reduce((a, r) => a + r.a, 0), b, 0.02) && pd.rows.every(r => r.a >= 0) && pd.rows.length === p.n && pl.rows.length === (p.mes.d === 1 && p.mes.m === 1 ? p.n : p.n + 1), id + ' plans ' + s + ' ' + JSON.stringify([b, p.n, p.mes, pl.rows.length])); }
    if (id === 'derog') { const st = ex.steps[1].html; ok(/Total/.test(st), id + ' tableau'); }
    if (id === 'cession') { const c = t.calc(p); ok(c.vnc > 0 && c.dot > 0 && c.cum > 0, id + ' cession ' + s + ' ' + JSON.stringify(c)); }
    if (id === 'sig_caf') { const c = t.calc(p); if (!p.ebeOnly) ok(near(c.CAFa, c.CAFs), id + ' CAF additive ≠ soustractive ' + s); ok(c.EBE > 0, id + ' EBE ' + s); }
    if (id === 'bilan_fonc') { const c = t.calc(p); ok(near(c.totE, c.totR) && near(c.TN, c.TN2), id + ' équilibre ' + s); ok(p.RESV > 0 && p.CA > 0, id + ' réalisme ' + s); }
    if (id === 'ratios') { ok(p.DLT >= 0 && p.CL > 0 && near(p.CP + p.DLT + p.PC, p.TP, 0.5), id + ' bilan ' + s); }
    if (id === 'seuil') { const c = t.calc(p); ok(c.R > 0 && c.SR < c.CA && c.SRqc * c.mcvu >= p.CF - 0.01, id + ' seuil ' + s); }
    if (id === 'commande') { const c = t.calc(p); ok(near(c.R1 - c.R0, c.res), id + ' marginal ' + s); }
    if (id === 'devises') { const c = t.calc(p); ok(c.V0 > 0 && c.ecart > 0, id + ' devises ' + s); }
    if (id === 'is') { const c = t.calc(p); ok(c.RF > 0 && c.IS > 0, id + ' IS ' + s); }
    if (id === 'stocks') { const c = t.calc(p); ok(c.qf > 0 && near(c.V0 + c.vin, c.cs + c.sf, 0.01 * (p.q0 + c.qin)) && c.cmups.length === 2 && c.cmup > 0, id + ' stocks ' + s); if (p.va) ok(c.dep > 0, id + ' dépréciation ' + s); }
    if (id === 'cout_complet') { const c = t.calc(p); ok(near(c.crA + c.crB, p.M * p.pm + c.TA + c.modA + c.modB + c.TP + c.TD, 0.05) && near(c.ra, c.caA + c.caB - c.crA - c.crB, 0.02), id + ' charges ' + s); }
    if (id === 'flux_treso') { const c = t.calc(p); ok(c.CAF > 0 && near(c.CAF, p.R + p.D - p.Rp - c.PV) && near(c.T1 - p.T0, c.FA + c.FI + c.FF), id + ' flux ' + s); }
    if (id === 'plan_fin') { const c = t.calc(p); ok(near(c.cumul[2], c.solde.reduce((a, b) => a + b, 0)) && c.dBFR.every(v => v > 0) && near(c.RB[1] * p.nE, p.E, 0.05), id + ' plan ' + s); (cnt.plan_fin = cnt.plan_fin || [0, 0])[c.ok ? 0 : 1]++; }
    if (id === 'plan_treso') { const c = t.calc(p); ok(near(c.fin[2], p.T0 + c.enc.reduce((a, b) => a + b, 0) - c.dec.reduce((a, b) => a + b, 0), 0.05) && c.tvaPaid.every(v => v >= 0), id + ' trésorerie ' + s); const sumEnc = p.Cd + p.V[0] * 1.2 + p.V[1] * 1.2 + p.V[2] * 1.2 * p.a + (p.E || 0) - p.V[2] * 0; ok(near(c.enc.reduce((a, b) => a + b, 0), sumEnc, 0.05), id + ' encaissements ' + s); }
    if (id === 'generalites') { const r0 = ex.questions.map(q => q.options[q.ans]); ok(new Set(r0).size === r0.length && r0.length === 6, id + ' réponses distinctes ' + s); }
    if (id === 'tenue') { const c = t.calc(p); ok(near(c.tD, c.tC) && near(c.sD, c.sC) && c.s512 > 0, id + ' balance ' + s); }
    if (id === 'facturation') { const c = t.calc(p); ok(c.nc < c.brut && c.nap > 0 && near(c.nap, c.ttc + p.cons - c.acpt) && near(c.ttc, (c.nc - c.esc + p.port) * 1.2, 0.02), id + ' facture ' + s); }
    if (id === 'paie') { const c = t.calc(p); ok(c.nap > 0 && near(c.nap, c.brut - c.sal - p.pas - p.acpt - p.opp) && near(c.cout, c.brut + c.pat), id + ' paie ' + s); }
    if (id === 'rapprochement') { const c = t.calc(p); ok(c.Se > 0 && c.Sb > 0 && near(c.Se + c.tInc - c.tDec, p.R) && near(c.Sb - c.tChq + c.tRem, p.R) && near(ex.journal.reduce((a, en) => a + en.lines.filter(l => l.a === '512').reduce((b, l) => b + l.d - l.c, 0), 0), c.reg), id + ' rapprochement ' + s); }
    if (id === 'emprunt') { const c = t.calc(p); ok(near(c.rows.reduce((a, r) => a + r.A, 0), p.K) && c.rows[p.n - 1].cf === 0 && c.rows.every(r => r.A > 0 && r.I >= 0) && c.icne > 0 && c.icne < c.rows[0].I + 0.01, id + ' emprunt ' + s); if (p.mode === 'annuite') ok(c.rows.slice(0, -1).every(r => near(r.ann, c.a)), id + ' annuités ' + s); }
    if (id === 'subvention') { const c = t.calc(p); ok(c.qp > 0 && c.qp < c.dot && near(c.qp / c.dot, p.S / p.P, 0.01) && near(c.net + c.qp, p.S) && c.res < 0, id + ' subvention ' + s); }
    if (id === 'immo_acq') { const c = t.calc(p); ok(c.cout > 0 && near(c.lignes.reduce((a, l) => a + l[1], 0), c.cout) && near(c.ttc, c.cout + c.chTot + c.tva), id + ' coût ' + s); }
    if (id === 'titres') { const c = t.calc(p); ok(c.depTot > 0 && c.coutC > 0 && near(c.rc, c.prixC - c.coutC), id + ' titres ' + s); }
    if (id === 'inventaire') { const c = t.calc(p); ok(near(c.R, p.R0 + c.inc.reduce((a, o) => a + o.v, 0), 0.05), id + ' résultat ' + s); if (prof === 'C') ok(!p.ops.some(o => o.k === 'litige' || o.k === 'change'), id + ' programme contrôleur'); }
    if (id === 'etats') { const c = t.calc(p); ok(near(c.AN, c.TP) && c.RN > 0 && p.b['512'] > 0, id + ' bilan équilibré ' + s); }
    if (id === 'depreciations' && prof === 'C') ok(!p.items.some(i => i.k === 'litige'), id + ' programme contrôleur');
    nb++;
  }
  console.log('  ' + id.padEnd(14) + nb + ' variantes');
});
if (!ONLY || ONLY.indexOf('plan_fin') >= 0) ok(cnt.plan_fin && cnt.plan_fin[0] > 300 && cnt.plan_fin[1] > 300, 'plan_fin : plans équilibrés et déséquilibrés ' + JSON.stringify(cnt.plan_fin));
console.log('\n' + checks + ' vérifications, ' + fails + ' échec(s)');
process.exit(fails ? 1 : 0);
