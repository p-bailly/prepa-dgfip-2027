/* ===== Immobilisations, amortissements, cessions, inventaire ===== */
function ACC(a) { return U.pcgOld ? ({ '657': '675', '757': '775', '747': '777' }[a] || a) : a; }
var BIENS = [
  { lib: 'une machine-outil', compte: '2154', amort: '28154', cat: 'matériel industriel' },
  { lib: 'une ligne d’embouteillage', compte: '2154', amort: '28154', cat: 'matériel industriel' },
  { lib: 'un bras robotisé', compte: '2154', amort: '28154', cat: 'matériel industriel' },
  { lib: 'un serveur informatique', compte: '2183', amort: '28183', cat: 'matériel informatique' },
  { lib: 'un camion frigorifique', compte: '2182', amort: '28182', cat: 'matériel de transport' }
];
function coutAcq(p) {
  var rem = U.r2(p.prix * (p.remise || 0));
  var base = U.r2(p.prix - rem);
  (p.frais || []).forEach(function (f) { if (f.incl) base = U.r2(base + f.mt); });
  return { rem: rem, base: base };
}
function coutTxt(p, ca) {
  var parts = [U.n(p.prix)];
  if (ca.rem) parts.push('− ' + U.n(ca.rem) + ' (remise)');
  (p.frais || []).forEach(function (f) { if (f.incl) parts.push('+ ' + U.n(f.mt) + ' (' + f.lib.toLowerCase() + ')'); });
  var exc = (p.frais || []).filter(function (f) { return !f.incl; }).map(function (f) { return f.lib.toLowerCase(); });
  return parts.join(' ') + (exc.length ? ' ; exclus : ' + exc.join(', ') + ' (charges)' : '');
}
function genFrais(r, prix) {
  var f = [];
  if (r.chance(0.7)) f.push({ lib: 'Frais de transport', mt: U.r0(prix * r.int(2, 5) / 100 / 10) * 10, incl: true });
  if (r.chance(0.7)) f.push({ lib: 'Frais d’installation et de montage', mt: U.r0(prix * r.int(3, 9) / 100 / 10) * 10, incl: true });
  if (r.chance(0.5)) f.push({ lib: 'Formation du personnel', mt: U.r0(prix * r.int(1, 3) / 100 / 10) * 10, incl: false });
  if (r.chance(0.3)) f.push({ lib: 'Frais de publicité pour le lancement du produit', mt: U.r0(prix * r.int(1, 3) / 100 / 10) * 10, incl: false });
  return f;
}
function planLinTable(pl) {
  return U.tbl(['Exercice', 'Base', 'Annuité', 'Cumul', 'VNC fin'], pl.rows.map(function (r) { return [U.yl(r.y) + (r.prorata < 360 ? ' (' + U.prorataTxt(r.prorata) + ')' : ''), U.n(r.base, 2), U.n(r.a, 2), U.n(r.cum, 2), U.n(r.vnc, 2)]; }));
}
function planDegTable(pd) {
  return U.tbl(['Exercice', 'VNC début', 'Taux', 'Annuité', 'VNC fin'], pd.rows.map(function (r) { return [U.yl(r.y) + (r.y === 0 ? ' (' + pd.mois1 + '/12)' : ''), U.n(r.v0, 2), r.mode === 'dég.' ? U.pcs(pd.taux) : (r.mode === 'lin.' ? 'lin. 1/' + r.rest : 'solde'), U.n(r.a, 2), U.n(r.vnc, 2)]; }));
}

/* ---------- 5. Plan d'amortissement ---------- */
T.amort = {
  id: 'amort', nom: 'Plan d’amortissement (linéaire, dégressif)', famille: 'Immobilisations', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Déterminer le coût d’acquisition puis établir les plans linéaire et dégressif avec le bon prorata temporis.',
    etapes: [
      'Coût d’acquisition = prix net de remises + frais directement attribuables (transport, installation, montage, honoraires) ; on exclut la TVA récupérable, la formation du personnel, la publicité et les frais généraux.',
      'Linéaire : annuité = base ÷ durée ; prorata au jour près (année de 360 jours) à partir de la mise en service ; la dernière annuité complète le plan (durée + 1 exercice si départ en cours d’année).',
      'Dégressif : taux = (1 ÷ durée) × coefficient (1,25 pour 3-4 ans ; 1,75 pour 5-6 ans ; 2,25 au-delà), appliqué à la VNC ; prorata en mois à partir du 1er jour du mois d’acquisition.',
      'Passage au linéaire : dès que VNC ÷ nombre d’années restantes ≥ annuité dégressive (l’année entamée compte pour une année entière).',
      'Le plan dégressif comporte exactement autant d’exercices que la durée : pas d’annuité supplémentaire.',
      'Approche par composants : chaque composant significatif est amorti sur sa propre durée ; le terrain ne s’amortit pas.',
      'Écriture d’inventaire : D 6811 / C 28xx.'
    ],
    pieges: [
      'Prendre la date d’acquisition pour le linéaire (c’est la mise en service) ou la mise en service pour le dégressif (c’est le mois d’acquisition).',
      'Intégrer la formation du personnel dans le coût.',
      'Appliquer le taux dégressif à la valeur d’origine au lieu de la VNC.',
      'Oublier la bascule en linéaire, ou la calculer sur la durée totale au lieu de la durée restante.',
      'Amortir le terrain d’un immeuble.'
    ],
    comptes: ['2154 Matériel industriel / 2183 Matériel informatique / 213 Constructions', '6811 Dotations aux amortissements', '28154 / 28183 / 2813 Amortissements']
  },
  gen: function (r) {
    if (r.chance(0.25)) {
      var P = r.int(60, 400) * 10000;
      var ter = U.r0(P * r.int(10, 25) / 100 / 1000) * 1000;
      var rest = P - ter;
      var shares = [[r.int(50, 60), 'Gros œuvre', r.pick([40, 50])], [r.int(10, 18), 'Toiture et façades', r.pick([20, 25])], [r.int(12, 20), 'Installations techniques', r.pick([10, 15])]];
      var sumS = shares.reduce(function (a, b) { return a + b[0]; }, 0);
      var comps = [], acc = 0;
      shares.forEach(function (s, i) { var mt = i < shares.length - 1 ? U.r0(rest * s[0] / sumS / 1000) * 1000 : rest - acc; acc += mt; comps.push({ lib: s[1], mt: mt, n: s[2] }); });
      return { nom: U.nom(r), comp: true, P: P, terrain: ter, composants: comps, mes: { d: 1, m: r.int(2, 12) } };
    }
    var b = r.pick(BIENS.slice(0, 4));
    var prix = r.int(10, 120) * 1000;
    var n = r.pick([4, 5, 5, 8, 10]);
    var mAcq = r.int(1, 11), dAcq = r.pick([1, 1, 5, 10, 12, 18, 20]);
    var dec = r.chance(0.4);
    var mes = dec ? { d: 1, m: Math.min(12, mAcq + 1) } : { d: dAcq, m: mAcq };
    return { nom: U.nom(r), bien: b, prix: prix, remise: r.chance(0.4) ? r.pick([0.02, 0.05, 0.1]) : 0, frais: genFrais(r, prix), acq: { d: dAcq, m: mAcq }, mes: mes, n: n };
  },
  solve: function (p) {
    var e = U.e, n = U.n, L = U.L;
    if (p.comp) {
      var mois = 13 - p.mes.m, totD = 0, c = [], qs = [];
      var en = '<p>La société <b>' + p.nom + '</b> acquiert un bâtiment industriel pour ' + e(p.P) + ' HT (frais inclus), mis en service le ' + U.dt(1, p.mes.m) + '. L’approche par composants est retenue :</p>';
      en += U.tbl(['Élément', 'Montant', 'Durée'], [['Terrain', e(p.terrain), '—']].concat(p.composants.map(function (k) { return [k.lib, e(k.mt), k.n + ' ans']; })));
      en += '<p class="consigne">Calculez la base amortissable, la dotation de N de chaque composant et la dotation totale ; passez l’écriture au 31/12/N.</p>';
      var base = U.r2(p.P - p.terrain);
      qs.push(Q('base', 'Base amortissable totale', base, '€'));
      c.push(['Base amortissable', n(p.P) + ' − ' + n(p.terrain) + ' (le terrain ne s’amortit pas)', e(base)]);
      p.composants.forEach(function (k, i) {
        var d = U.r2(k.mt / k.n * mois / 12); totD = U.r2(totD + d);
        qs.push(Q('c' + i, 'Dotation N – ' + k.lib.toLowerCase(), d, '€'));
        c.push([k.lib, n(k.mt) + ' ÷ ' + k.n + ' × ' + mois + '/12', e(d)]);
      });
      qs.push(Q('tot', 'Dotation totale de N', totD, '€'));
      c.push(['Dotation totale', '', '<b>' + e(totD) + '</b>']);
      var com = 'L’approche par composants découpe l’immeuble en éléments dont les durées d’utilisation diffèrent nettement : la toiture ou les installations seront remplacées bien avant le gros œuvre. Amortir chaque composant sur sa propre durée donne une charge plus fidèle à la consommation réelle des avantages économiques. Le terrain, dont la durée d’utilisation est illimitée, n’est jamais amorti ; seule une dépréciation peut constater une perte de valeur. La dotation de N (' + e(totD) + ') ne porte que sur ' + mois + ' mois, du ' + U.dt(1, p.mes.m) + ' au 31/12/N. Lors du remplacement d’un composant, sa valeur nette sortira de l’actif et le nouveau composant sera immobilisé. Cette méthode, obligatoire en PCG pour les composants significatifs, augmente les dotations des premières années par rapport à un amortissement global sur la durée du gros œuvre.';
      return { enonce: en, questions: qs, journal: [U.entry('31/12/N', 'Dotation aux amortissements du bâtiment', [L('6811', totD, 0), L('2813', 0, totD)])], steps: [{ h: 'Dotations par composant', html: U.calc(c) }], comment: com };
    }
    var ca = coutAcq(p), base = ca.base;
    var pl = AM.lineaire(base, p.n, p.mes.d, p.mes.m), pd = AM.degressif(base, p.n, p.acq.m);
    var b = p.bien;
    var en2 = '<p>La société <b>' + p.nom + '</b> a acquis le ' + U.dt(p.acq.d, p.acq.m) + ' ' + b.lib + ', mis' + (/^une/.test(b.lib) ? 'e' : '') + ' en service le ' + U.dt(p.mes.d, p.mes.m) + '. Extrait de la facture (montants HT, TVA 20 % récupérable) :</p>';
    var fr = [['Prix catalogue', e(p.prix)]];
    if (p.remise) fr.push(['Remise', U.pcs(p.remise)]);
    (p.frais || []).forEach(function (f) { fr.push([f.lib, e(f.mt)]); });
    en2 += U.kv(fr);
    en2 += '<p>Durée d’utilisation : ' + p.n + ' ans. Le bien est éligible à l’amortissement dégressif. Exercice clos le 31/12.</p>';
    en2 += '<p class="consigne">1. Calculez le coût d’acquisition. 2. Établissez le plan d’amortissement linéaire. 3. Établissez le plan dégressif que l’entreprise pourrait pratiquer. 4. Passez la dotation linéaire du 31/12/N.</p>';
    var r1 = pl.rows[1] || { a: 0, vnc: 0 };
    var opts = []; for (var y = 1; y < p.n; y++) opts.push('N+' + y);
    var qs2 = [Q('cout', 'Coût d’acquisition', base, '€'), Q('l0', 'Annuité linéaire de N', pl.rows[0].a, '€'), Q('l1', 'Annuité linéaire de N+1', r1.a, '€'), Q('v1', 'VNC linéaire au 31/12/N+1', r1.vnc, '€'),
      Q('td', 'Taux dégressif', U.rd(pd.taux * 100, 3), '%', { tol: 0.02 }), Q('d0', 'Annuité dégressive de N', pd.rows[0].a, '€'), Q('d1', 'Annuité dégressive de N+1', pd.rows[1].a, '€'),
      QC('bas', 'Premier exercice amorti en linéaire dans le plan dégressif', opts, pd.bascule - 1)];
    var c2 = [['Coût d’acquisition', coutTxt(p, ca), '<b>' + e(base) + '</b>'],
      ['Annuité linéaire pleine', n(base) + ' ÷ ' + p.n, e(U.r2(pl.annu))],
      ['Annuité linéaire N', n(base) + ' × ' + U.pcs(1 / p.n) + ' × ' + U.prorataTxt(pl.j1) + ' (du ' + U.dt(p.mes.d, p.mes.m) + ' au 31/12 : ' + U.dureeTxt(pl.j1) + ')', e(pl.rows[0].a)],
      ['Taux dégressif', U.pcs(1 / p.n) + ' × ' + n(pd.coef, 2), U.pcs(pd.taux)],
      ['Annuité dégressive N', n(base) + ' × ' + U.pcs(pd.taux) + ' × ' + pd.mois1 + '/12 (à partir du 1er ' + U.MOIS[p.acq.m - 1] + ')', e(pd.rows[0].a)],
      ['Annuité dégressive N+1', n(pd.rows[1].v0, 2) + ' × ' + U.pcs(pd.taux), e(pd.rows[1].a)],
      ['Bascule en linéaire', 'en ' + U.yl(pd.bascule) + ' : ' + n(pd.rows[pd.bascule].v0, 2) + ' ÷ ' + pd.rows[pd.bascule].rest + ' = ' + n(pd.rows[pd.bascule].v0 / pd.rows[pd.bascule].rest, 2) + ' ≥ ' + n(pd.rows[pd.bascule].v0 * pd.taux, 2), U.yl(pd.bascule)]];
    var com2 = 'L’amortissement constate la consommation des avantages économiques du bien : la base de ' + e(base) + ' ne retient que les coûts nécessaires pour mettre le bien en état de fonctionner' + ((p.frais || []).some(function (f) { return !f.incl; }) ? ', les autres frais restant en charges de l’exercice' : '') + '. En linéaire, la charge est constante (' + e(U.r2(pl.annu)) + ' par an), proratisée la première année à partir de la mise en service, ce qui reporte un reliquat sur un ' + (pl.rows.length > p.n ? (pl.rows.length) + 'e exercice' : 'exercice final') + '. Le dégressif concentre la charge sur les premières années (' + e(pd.rows[0].a) + ' dès N malgré le prorata) : il traduit mieux l’obsolescence rapide de certains équipements et procure un avantage fiscal de trésorerie, l’impôt étant différé. Il ne s’applique qu’aux biens neufs d’au moins 3 ans figurant sur la liste légale. Si l’entreprise conserve le linéaire en comptabilité et déduit le dégressif fiscalement, l’écart sera constaté en amortissement dérogatoire (compte 145). La VNC au 31/12/N+1 (' + e(r1.vnc) + ') sera la référence pour calculer une éventuelle plus ou moins-value de cession.';
    return { enonce: en2, questions: qs2, journal: [U.entry('31/12/N', 'Dotation aux amortissements (linéaire)', [L('6811', pl.rows[0].a, 0), L(b.amort, 0, pl.rows[0].a)])], steps: [{ h: 'Calculs', html: U.calc(c2) }, { h: 'Plan linéaire', html: planLinTable(pl) }, { h: 'Plan dégressif', html: planDegTable(pd) }], comment: com2 };
  }
};

/* ---------- 6. Amortissement dérogatoire ---------- */
function planDerog(p, base) {
  var pl = AM.lineaire(base, p.n, p.mes.d, p.mes.m);
  var pf = p.fiscal === 'lin' ? AM.lineaire(base, p.nF, p.mes.d, p.mes.m) : AM.degressif(base, p.n, p.mes.m);
  var ny = Math.max(pl.rows.length, pf.rows.length), rows = [], solde = 0;
  for (var y = 0; y < ny; y++) {
    var a = pl.rows[y] ? pl.rows[y].a : 0, f = pf.rows[y] ? pf.rows[y].a : 0, d = U.r2(f - a);
    solde = U.r2(solde + d);
    rows.push({ y: y, c: a, f: f, d: d, solde: solde });
  }
  return { pl: pl, pf: pf, rows: rows };
}
T.derog = {
  id: 'derog', nom: 'Amortissement dérogatoire', famille: 'Immobilisations', ctrl: true, minutes: 18,
  fiche: {
    objectif: 'Construire en parallèle le plan comptable et le plan fiscal, puis le tableau des dotations et reprises d’amortissement dérogatoire.',
    etapes: [
      'Base commune : coût d’acquisition HT (prix + frais accessoires, hors formation).',
      'Plan comptable : linéaire sur la durée d’utilisation, depuis la mise en service.',
      'Plan fiscal : dégressif (1er jour du mois d’acquisition, n exercices) ou linéaire sur la durée d’usage fiscale plus courte.',
      'Dérogatoire de l’exercice = fiscal − comptable : positif → dotation (D 6872 / C 145) ; négatif → reprise (D 145 / C 7872).',
      'Le solde du 145 revient à zéro en fin de plan : total des dotations = total des reprises.',
      'Au 31/12 : deux écritures, la dotation comptable (6811 / 28) et le dérogatoire (6872 / 145).'
    ],
    pieges: [
      'Constater le dérogatoire dans le compte 28 : il va au 145 (provision réglementée, capitaux propres).',
      'Oublier les reprises des dernières années, quand le fiscal devient inférieur au comptable.',
      'Décaler le prorata : 6/12 pour un départ au 1er juillet dans les deux plans, mais le dégressif part du 1er jour du mois d’acquisition.',
      'Le plan fiscal dégressif finit un exercice avant le plan linéaire quand celui-ci démarre en cours d’année.'
    ],
    comptes: ['6811 / 28154 Amortissements comptables', '6872 Dotations aux provisions réglementées', '145 Amortissements dérogatoires', '7872 Reprises sur provisions réglementées']
  },
  gen: function (r) {
    var b = r.pick(BIENS.slice(0, 4));
    var prix = r.int(8, 90) * 1000 + r.pick([0, 500]);
    var lin = r.chance(0.25);
    var n = lin ? r.pick([6, 8, 10]) : r.pick([4, 5, 8, 10]);
    var m = r.int(1, 12);
    var p = { nom: U.nom(r), bien: b, prix: prix, remise: 0, frais: genFrais(r, prix), mes: { d: 1, m: m }, n: n, fiscal: lin ? 'lin' : 'deg' };
    if (lin) p.nF = r.pick([3, 4, 5].filter(function (x) { return x < n; }));
    return p;
  },
  solve: function (p) {
    var e = U.e, n = U.n, L = U.L, ca = coutAcq(p), base = ca.base, P = planDerog(p, base), b = p.bien;
    var en = '<p>La société <b>' + p.nom + '</b> a acquis et mis en service le ' + U.dt(p.mes.d, p.mes.m) + ' ' + b.lib + '. Facture (montants HT, TVA 20 % récupérable) :</p>';
    var fr = [['Prix d’achat', e(p.prix)]]; (p.frais || []).forEach(function (f) { fr.push([f.lib, e(f.mt)]); });
    en += U.kv(fr);
    en += p.fiscal === 'deg' ? '<p>Le bien est amorti en linéaire sur ' + p.n + ' ans en comptabilité ; fiscalement, l’entreprise pratique l’amortissement dégressif. Exercice clos le 31/12.</p>'
      : '<p>Le bien est amorti en linéaire sur sa durée d’utilisation de ' + p.n + ' ans ; fiscalement, l’entreprise l’amortit en linéaire sur la durée d’usage admise de ' + p.nF + ' ans. Exercice clos le 31/12.</p>';
    en += '<p class="consigne">1. Établissez le plan d’amortissement comptable, le plan fiscal et le tableau de l’amortissement dérogatoire. 2. Comptabilisez les dotations au 31/12/N.</p>';
    var r0 = P.rows[0], r1 = P.rows[1], r2r = P.rows[2];
    var firstRep = -1; P.rows.forEach(function (x) { if (firstRep < 0 && x.d < 0) firstRep = x.y; });
    var opts = []; for (var y = 1; y < P.rows.length; y++) opts.push(U.yl(y));
    var qs = [Q('cout', 'Base amortissable', base, '€'), Q('c0', 'Amortissement comptable de N', r0.c, '€'), Q('f0', 'Amortissement fiscal de N', r0.f, '€'), Q('d0', 'Dotation au dérogatoire de N', r0.d, '€'),
      Q('f1', 'Amortissement fiscal de N+1', r1.f, '€'), Q('s2', 'Solde du compte 145 au 31/12/N+2', r2r.solde, '€'), QC('rep', 'Premier exercice de reprise du dérogatoire', opts, firstRep - 1)];
    var c = [['Base', coutTxt(p, ca), '<b>' + e(base) + '</b>'], ['Comptable N', n(base) + ' × ' + U.pcs(1 / p.n) + ' × ' + U.prorataTxt(P.pl.j1), e(r0.c)]];
    if (p.fiscal === 'deg') {
      c.push(['Taux dégressif', U.pcs(1 / p.n) + ' × ' + n(P.pf.coef, 2), U.pcs(P.pf.taux)]);
      c.push(['Fiscal N', n(base) + ' × ' + U.pcs(P.pf.taux) + ' × ' + P.pf.mois1 + '/12', e(r0.f)]);
      c.push(['Fiscal N+1', n(P.pf.rows[1].v0, 2) + ' × ' + U.pcs(P.pf.taux), e(r1.f)]);
      c.push(['Bascule', 'linéaire à partir de ' + U.yl(P.pf.bascule) + ' (' + P.pf.rows[P.pf.bascule].rest + ' années restantes)', '']);
    } else {
      c.push(['Fiscal N', n(base) + ' × ' + U.pcs(1 / p.nF) + ' × ' + U.prorataTxt(P.pl.j1), e(r0.f)]);
    }
    c.push(['Dérogatoire N', n(r0.f) + ' − ' + n(r0.c), '<b>' + e(r0.d) + '</b>']);
    var tab = U.tbl(['Exercice', 'Comptable', 'Fiscal', 'Dotation (+) / reprise (−)', 'Solde 145'], P.rows.map(function (x) { return [U.yl(x.y), n(x.c, 2), n(x.f, 2), (x.d > 0 ? '+' : '') + n(x.d, 2), n(x.solde, 2)]; }).concat([{ cls: 'tot', cells: ['Total', n(base, 2), n(base, 2), '0,00', ''] }]));
    var journal = [U.entry('31/12/N', 'Dotation aux amortissements', [L('6811', r0.c, 0), L(b.amort, 0, r0.c)]), U.entry('31/12/N', 'Amortissement dérogatoire', [L('6872', r0.d, 0), L('145', 0, r0.d)])];
    var maxS = Math.max.apply(null, P.rows.map(function (x) { return x.solde; }));
    var com = 'Le plan comptable traduit la consommation réelle du bien (linéaire sur ' + p.n + ' ans), tandis que le plan fiscal ' + (p.fiscal === 'deg' ? 'accélère la déduction grâce au dégressif' : 'utilise la durée d’usage plus courte admise par l’administration') + '. Pour bénéficier fiscalement de cet excédent, l’entreprise doit le comptabiliser : c’est l’amortissement dérogatoire, une provision réglementée inscrite dans les capitaux propres (compte 145), sans lien avec une dépréciation réelle. En N, le fiscal dépasse le comptable de ' + e(r0.d) + ', ce qui réduit le résultat imposable et diffère l’impôt. Le compte 145 culmine à ' + e(maxS) + ', puis les reprises' + (firstRep > 0 ? ' à partir de ' + U.yl(firstRep) : '') + ' le ramènent à zéro : sur la durée totale, l’avantage est un simple décalage de trésorerie, pas une économie définitive. En analyse financière, le 145 est classé en capitaux propres (ressource stable) et ses dotations sont ajoutées pour calculer la CAF. En cas de cession avant la fin du plan, le solde restant serait repris en totalité.';
    return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Calculs', html: U.calc(c) }, { h: 'Tableau du dérogatoire', html: tab }, { h: 'Plan comptable', html: planLinTable(P.pl) }, { h: 'Plan fiscal', html: p.fiscal === 'deg' ? planDegTable(P.pf) : planLinTable(P.pf) }], comment: com };
  }
};

/* ---------- 7. Cession d'immobilisation ---------- */
T.cession = {
  id: 'cession', nom: 'Cession d’immobilisation', famille: 'Immobilisations', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Comptabiliser la sortie d’un bien cédé et calculer le résultat de cession.',
    etapes: [
      'Cumul des amortissements au 31/12/N-1 (prorata la première année).',
      'Dotation complémentaire de N : du 1er janvier à la date de cession (année de 360 jours).',
      'VNC = valeur d’origine − cumul total des amortissements.',
      'Résultat de cession = prix de cession HT − VNC (plus-value si positif).',
      'Écritures : (1) dotation complémentaire D 6811 / C 28 ; (2) sortie D 28 (cumul) + D 657 (VNC) / C 21 (valeur d’origine) ; (3) prix D 462 ou 512 / C 757 + C 44571 si cession soumise à TVA ; (4) reprise du dérogatoire restant D 145 / C 7872.'
    ],
    pieges: [
      'Oublier la dotation complémentaire jusqu’à la date de cession.',
      'Calculer le résultat avec le prix TTC.',
      'Comptabiliser la plus-value directement : on enregistre séparément la VNC (charge) et le prix (produit).',
      'Comptes : PCG 2025 → 657 / 757 ; ancien PCG → 675 / 775 (les deux sont acceptés).',
      'La cession d’un matériel ayant ouvert droit à déduction est soumise à TVA.'
    ],
    comptes: ['6811 / 28 Amortissements', '657 (ancien 675) Valeur comptable des immobilisations cédées', '757 (ancien 775) Produits des cessions', '462 Créances sur cessions d’immobilisations', '145 / 7872 Dérogatoire']
  },
  gen: function (r) {
    var b = r.pick(BIENS);
    var V = r.int(15, 150) * 1000, n = r.pick([4, 5, 6, 8, 10]);
    var k = r.int(1, n - 1);
    var p = { nom: U.nom(r), bien: b, V: V, n: n, acq: { m: r.int(1, 12), y: -k }, ces: { d: r.pick([15, 30, 31]), m: r.int(2, 11) }, s145: 0 };
    if (p.ces.d >= 30) p.ces.d = U.lastDay(p.ces.m);
    var s = this.calc(Object.assign({ prix: 0 }, p));
    p.prix = U.r0(s.vnc * r.int(50, 160) / 100 / 100) * 100;
    if (r.chance(0.25)) p.s145 = U.r0(V * r.int(3, 10) / 100);
    return p;
  },
  calc: function (p) {
    var annu = p.V / p.n, cum = 0, y;
    for (y = p.acq.y; y < 0; y++) { var a = y === p.acq.y ? annu * (13 - p.acq.m) / 12 : annu; cum = U.r2(cum + Math.min(U.r2(a), p.V - cum)); }
    var j = U.joursDepuis1Jan(p.ces.d, p.ces.m);
    var dot = Math.min(U.r2(annu * j / 360), U.r2(p.V - cum));
    var cumT = U.r2(cum + dot), vnc = U.r2(p.V - cumT), res = U.r2(p.prix - vnc);
    return { annu: annu, cum: cum, j: j, dot: dot, cumT: cumT, vnc: vnc, res: res, tva: U.r2(p.prix * 0.2) };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n, L = U.L, b = p.bien;
    var dc = U.dt(p.ces.d, p.ces.m);
    var en = '<p>La société <b>' + p.nom + '</b> a acquis le ' + U.dt(1, p.acq.m, p.acq.y) + ' ' + b.lib + ' pour ' + e(p.V) + ' HT, amorti' + (/^une/.test(b.lib) ? 'e' : '') + ' en linéaire sur ' + p.n + ' ans. Le bien est cédé le ' + dc + ' pour ' + e(p.prix) + ' HT (TVA 20 %), payable à 30 jours.' + (p.s145 ? ' Le compte 145 relatif à ce bien présente un solde de ' + e(p.s145) + '.' : '') + '</p>';
    en += '<p class="consigne">1. Calculez le cumul des amortissements, la valeur nette comptable et le résultat de cession. 2. Passez les écritures du ' + dc + '.</p>';
    var qs = [Q('cum', 'Cumul des amortissements au 31/12/N-1', x.cum, '€'), Q('dot', 'Dotation complémentaire de N', x.dot, '€'), Q('vnc', 'Valeur nette comptable à la date de cession', x.vnc, '€'), Q('res', 'Résultat de cession (négatif si moins-value)', x.res, '€')];
    var det = [];
    for (var y = p.acq.y; y < 0; y++) det.push(U.yl(y) + ' : ' + (y === p.acq.y ? n(p.V) + ' ÷ ' + p.n + ' × ' + (13 - p.acq.m) + '/12' : n(U.r2(x.annu))));
    var c = [['Annuité pleine', n(p.V) + ' ÷ ' + p.n, e(U.r2(x.annu))], ['Cumul au 31/12/N-1', det.join(' ; '), e(x.cum)],
      ['Dotation N', n(U.r2(x.annu)) + ' × ' + U.prorataTxt(x.j) + ' (du 01/01 au ' + dc + ')', e(x.dot)], ['Cumul total', n(x.cum) + ' + ' + n(x.dot), e(x.cumT)],
      ['VNC', n(p.V) + ' − ' + n(x.cumT), '<b>' + e(x.vnc) + '</b>'], ['Résultat de cession', n(p.prix) + ' − ' + n(x.vnc), '<b>' + (x.res >= 0 ? 'plus-value ' : 'moins-value ') + e(Math.abs(x.res)) + '</b>']];
    var journal = [U.entry(dc, 'Dotation complémentaire', [L('6811', x.dot, 0), L(b.amort, 0, x.dot)]),
      U.entry(dc, 'Sortie du bien cédé', [L(b.amort, x.cumT, 0), L(ACC('657'), x.vnc, 0), L(b.compte, 0, p.V)]),
      U.entry(dc, 'Prix de cession', [L('462', U.r2(p.prix + x.tva), 0), L(ACC('757'), 0, p.prix), L('44571', 0, x.tva)])];
    if (p.s145) journal.push(U.entry(dc, 'Reprise du dérogatoire', [L('145', p.s145, 0), L('7872', 0, p.s145)]));
    if (p.s145) qs.push(Q('rep', 'Reprise du dérogatoire', p.s145, '€'));
    var com = 'Avant de sortir le bien, on constate l’amortissement de N jusqu’au jour de la cession (' + e(x.dot) + '), pour que la VNC reflète la consommation réelle. La cession dégage une ' + (x.res >= 0 ? 'plus-value' : 'moins-value') + ' de ' + e(Math.abs(x.res)) + ' : le prix ' + (x.res >= 0 ? 'dépasse' : 'est inférieur à') + ' la valeur nette comptable de ' + e(x.vnc) + '. Comptablement, elle n’apparaît pas sur une ligne unique : la VNC est une charge (' + ACC('657') + ') et le prix un produit (' + ACC('757') + '), classés en exploitation dans le PCG 2025 (en exceptionnel dans l’ancien plan). ' + (x.res >= 0 ? 'Une plus-value régulière peut traduire un plan d’amortissement trop rapide.' : 'Une moins-value importante peut révéler une durée d’amortissement trop longue ou une obsolescence non anticipée.') + ' Pour la CAF, la VNC et le prix de cession sont neutralisés : la cession relève de l’investissement, pas de l’exploitation, et le prix figurera dans les ressources du tableau de financement. La cession étant soumise à TVA, l’entreprise collecte ' + e(x.tva) + '.' + (p.s145 ? ' Le dérogatoire restant (' + e(p.s145) + ') est repris en totalité, ce qui augmente le résultat imposable de l’exercice.' : '');
    return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Calculs', html: U.calc(c) }], comment: com };
  }
};

/* ---------- 8. Dépréciations et provisions ---------- */
var CLIENTS = ['Dupuis', 'Martin', 'Lefèvre', 'Garnier', 'Roussel', 'Chevalier', 'Perrin', 'Morel', 'Fontaine', 'Blanchard'];
T.depreciations = {
  id: 'depreciations', nom: 'Dépréciations et provisions', famille: 'Travaux d’inventaire', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Constater à l’inventaire les pertes de valeur des actifs (dépréciations) et les passifs probables (provisions), et ajuster celles qui existent.',
    etapes: [
      'Créance douteuse : virer la créance TTC du 411 au 416 ; déprécier la base HT × pourcentage de perte (la TVA sera récupérée en cas de perte) : D 6817 / C 491.',
      'Dépréciation existante : dépréciation nécessaire − dépréciation existante ; positif → dotation complémentaire, négatif → reprise (D 491 / C 7817).',
      'Créance irrécouvrable : D 654 (HT) + D 44571 (TVA) / C 416 (TTC) ; puis reprise totale de la dépréciation.',
      'Stocks : comparer coût et valeur actuelle ; reprendre la dépréciation de N-1 (D 397 / C 7817) et constater la nouvelle (D 6817 / C 397).',
      'Immobilisation non amortissable (terrain) : D 6816 / C 2911.',
      'Provision pour risques (litige, garantie) : obligation envers un tiers + sortie de ressources probable sans contrepartie + estimation fiable → D 6815 / C 1511.'
    ],
    pieges: [
      'Déprécier le montant TTC d’une créance.',
      'Oublier le transfert 411 → 416 l’année où la créance devient douteuse (une seule fois).',
      'Créance irrécouvrable : oublier la reprise de la dépréciation, ou la récupération de TVA.',
      'Confondre dépréciation (perte de valeur d’un actif, comptes 29 à 59) et provision (passif probable, compte 15).',
      'Programme contrôleur : pas de provisions pour risques.'
    ],
    comptes: ['416 Clients douteux', '491 Dépréciations des comptes clients', '397 Dépréciations des stocks', '2911 Dépréciations des terrains', '1511 Provisions pour litiges', '654 Pertes sur créances irrécouvrables', '6815 / 6816 / 6817 Dotations', '7815 / 7817 Reprises']
  },
  gen: function (r, opt) {
    var pool = ['douteux', 'ajust', 'irrec', 'stock', 'terrain'];
    if (!opt || opt.profil !== 'C') pool.push('litige', 'litige');
    var items = r.pickN(pool, r.int(3, 4)).map(function (k) {
      var cl = r.pick(CLIENTS);
      switch (k) {
        case 'douteux': return { k: k, cl: cl, ttc: r.int(5, 80) * 120, p: r.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7]) };
        case 'ajust': return { k: k, cl: cl, ttc: r.int(5, 80) * 120, p0: r.pick([0.2, 0.3, 0.4, 0.5]), p1: r.pick([0.1, 0.25, 0.6, 0.7, 0.8]) };
        case 'irrec': return { k: k, cl: cl, ttc: r.int(5, 60) * 120, p0: r.pick([0.3, 0.4, 0.5, 0.6]) };
        case 'stock': var S = r.int(20, 200) * 1000; return { k: k, S: S, V: U.r0(S * r.int(70, 97) / 100 / 10) * 10, D0: r.chance(0.7) ? r.int(1, 20) * 250 : 0 };
        case 'terrain': var Ct = r.int(50, 300) * 1000; return { k: k, C: Ct, V: U.r0(Ct * r.int(70, 95) / 100 / 1000) * 1000 };
        default: return { k: 'litige', obj: r.pick(['Un salarié licencié réclame des dommages et intérêts aux prud’hommes', 'Un client réclame une indemnité pour un retard de livraison', 'Un concurrent engage une action pour contrefaçon']), est: r.int(3, 60) * 1000, prev: r.chance(0.4) ? r.int(2, 40) * 1000 : 0 };
      }
    });
    return { nom: U.nom(r), items: items };
  },
  solve: function (p) {
    var e = U.e, n = U.n, L = U.L, li = [], qs = [], c = [], journal = [], com = [];
    p.items.forEach(function (it, i) {
      var id = 'i' + i;
      if (it.k === 'douteux') {
        var ht = U.r2(it.ttc / 1.2), dep = U.r2(ht * it.p);
        li.push('La créance du client ' + it.cl + ' (' + e(it.ttc) + ' TTC) devient douteuse : il est en redressement judiciaire et la perte est estimée à ' + U.pcs(it.p) + '.');
        qs.push(Q(id, 'Dépréciation de la créance ' + it.cl, dep, '€'));
        c.push(['Client ' + it.cl, n(it.ttc) + ' ÷ 1,2 = ' + n(ht) + ' HT × ' + U.pcs(it.p), e(dep)]);
        journal.push(U.entry('31/12/N', 'Client ' + it.cl + ' douteux', [L('416', it.ttc, 0), L('411', 0, it.ttc)]));
        journal.push(U.entry('31/12/N', 'Dépréciation de la créance ' + it.cl, [L('6817', dep, 0), L('491', 0, dep)]));
        com.push('La créance ' + it.cl + ' est dépréciée sur sa base hors taxes, car la TVA sera récupérée si la perte se confirme.');
      } else if (it.k === 'ajust') {
        var ht2 = U.r2(it.ttc / 1.2), d0 = U.r2(ht2 * it.p0), d1 = U.r2(ht2 * it.p1), dd = U.r2(d1 - d0);
        li.push('Le client douteux ' + it.cl + ' doit toujours ' + e(it.ttc) + ' TTC ; la créance était dépréciée de ' + e(d0) + ' (' + U.pcs(it.p0) + ' du HT). La perte est désormais estimée à ' + U.pcs(it.p1) + '.');
        qs.push(Q(id, 'Ajustement de la dépréciation ' + it.cl + ' (+ dotation, − reprise)', dd, '€'));
        c.push(['Client ' + it.cl, n(ht2) + ' × ' + U.pcs(it.p1) + ' = ' + n(d1) + ' nécessaire − ' + n(d0) + ' existante', '<b>' + (dd > 0 ? 'dotation ' : 'reprise ') + e(Math.abs(dd)) + '</b>']);
        if (dd > 0) journal.push(U.entry('31/12/N', 'Dotation complémentaire ' + it.cl, [L('6817', dd, 0), L('491', 0, dd)]));
        if (dd < 0) journal.push(U.entry('31/12/N', 'Reprise de dépréciation ' + it.cl, [L('491', -dd, 0), L('7817', 0, -dd)]));
        com.push('Pour ' + it.cl + ', seule la différence entre la dépréciation nécessaire et l’existante est comptabilisée (' + (dd > 0 ? 'dotation complémentaire' : 'reprise') + ').');
      } else if (it.k === 'irrec') {
        var ht3 = U.r2(it.ttc / 1.2), tv = U.r2(it.ttc - ht3), d03 = U.r2(ht3 * it.p0);
        li.push('La créance douteuse du client ' + it.cl + ' (' + e(it.ttc) + ' TTC, dépréciée de ' + e(d03) + ' en N-1) est définitivement irrécouvrable (clôture pour insuffisance d’actif).');
        qs.push(Q(id, 'Perte sur créance irrécouvrable ' + it.cl + ' (HT)', ht3, '€'));
        qs.push(Q(id + 'b', 'Reprise de la dépréciation ' + it.cl, d03, '€'));
        c.push(['Client ' + it.cl, 'perte HT ' + n(it.ttc) + ' ÷ 1,2 ; TVA récupérée ' + n(tv) + ' ; reprise de ' + n(d03), e(ht3)]);
        journal.push(U.entry('31/12/N', 'Créance ' + it.cl + ' irrécouvrable', [L('654', ht3, 0), L('44571', tv, 0, { lib: 'TVA collectée (récupérée)' }), L('416', 0, it.ttc)]));
        journal.push(U.entry('31/12/N', 'Reprise de la dépréciation ' + it.cl, [L('491', d03, 0), L('7817', 0, d03)]));
        com.push('La créance ' + it.cl + ' étant perdue, la perte HT passe en charge, la TVA est récupérée et la dépréciation devenue sans objet est reprise : l’impact net sur le résultat de N n’est que de ' + e(U.r2(ht3 - d03)) + '.');
      } else if (it.k === 'stock') {
        var dn = U.r2(it.S - it.V);
        li.push('Le stock final de marchandises est évalué au coût d’achat à ' + e(it.S) + ' ; sa valeur actuelle est de ' + e(it.V) + '. ' + (it.D0 ? 'Le compte 397 présente un solde de ' + e(it.D0) + ' (dépréciation du stock de N-1).' : 'Aucune dépréciation n’existait.') + ' L’entreprise reprend la dépréciation antérieure et constitue la nouvelle.');
        qs.push(Q(id, 'Dépréciation du stock final', dn, '€'));
        c.push(['Stock', (it.D0 ? 'reprise de ' + n(it.D0) + ' ; ' : '') + 'dotation ' + n(it.S) + ' − ' + n(it.V), e(dn)]);
        if (it.D0) journal.push(U.entry('31/12/N', 'Reprise de la dépréciation du stock initial', [L('397', it.D0, 0), L('7817', 0, it.D0)]));
        journal.push(U.entry('31/12/N', 'Dépréciation du stock final', [L('6817', dn, 0), L('397', 0, dn)]));
        com.push('Le stock est inscrit au plus faible du coût et de la valeur actuelle : la dépréciation de ' + e(dn) + ' applique le principe de prudence sans modifier la valeur d’origine.');
      } else if (it.k === 'terrain') {
        var dt2 = U.r2(it.C - it.V);
        li.push('Un terrain acquis ' + e(it.C) + ' a une valeur vénale estimée à ' + e(it.V) + ' en raison d’un projet de déviation routière.');
        qs.push(Q(id, 'Dépréciation du terrain', dt2, '€'));
        c.push(['Terrain', n(it.C) + ' − ' + n(it.V), e(dt2)]);
        journal.push(U.entry('31/12/N', 'Dépréciation du terrain', [L('6816', dt2, 0), L('2911', 0, dt2)]));
        com.push('Le terrain, non amortissable, ne peut perdre de la valeur comptable que par une dépréciation.');
      } else {
        var dl = U.r2(it.est - it.prev);
        li.push(it.obj + '. L’avocat estime la condamnation probable, pour ' + e(it.est) + '.' + (it.prev ? ' Une provision de ' + e(it.prev) + ' avait été constituée en N-1 pour ce litige.' : ''));
        qs.push(Q(id, 'Provision pour litige : ' + (it.prev ? 'ajustement (+ dotation, − reprise)' : 'dotation'), dl, '€'));
        c.push(['Litige', it.prev ? n(it.est) + ' − ' + n(it.prev) + ' existante' : 'estimation de l’avocat', e(dl)]);
        if (dl > 0) journal.push(U.entry('31/12/N', 'Provision pour litige', [L('6815', dl, 0), L('1511', 0, dl)]));
        if (dl < 0) journal.push(U.entry('31/12/N', 'Reprise partielle de la provision pour litige', [L('1511', -dl, 0), L('7815', 0, -dl)]));
        com.push('La provision pour litige est justifiée : il existe une obligation envers un tiers, la sortie de ressources est probable sans contrepartie et son montant est estimé de façon fiable ; c’est un passif, pas la dépréciation d’un actif.');
      }
    });
    var en = '<p>Travaux d’inventaire de la société <b>' + p.nom + '</b> au 31/12/N (TVA 20 %) :</p>' + '<ol>' + li.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol><p class="consigne">Calculez les montants et passez les écritures au 31/12/N.</p>';
    com.unshift('Ces écritures appliquent le principe de prudence : les pertes probables sont constatées dès la clôture, les gains latents ne le sont jamais.');
    com.push('Dotations et reprises sont des charges et produits calculés, sans effet sur la trésorerie : ils sont neutralisés dans le calcul de la CAF.');
    com.push('Chaque dépréciation sera réexaminée à la clôture suivante et ajustée ou reprise.');
    return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Calculs', html: U.calc(c) }], comment: com.join(' ') };
  }
};

/* ---------- 9. Régularisations de charges et produits ---------- */
T.regul = {
  id: 'regul', nom: 'Régularisations de charges et produits', famille: 'Travaux d’inventaire', ctrl: true, minutes: 12,
  fiche: {
    objectif: 'Rattacher à chaque exercice les charges et produits qui le concernent (indépendance des exercices).',
    etapes: [
      'Charge payée en N pour N+1 : charge constatée d’avance, D 486 / C 6xx pour la part de N+1 (au prorata des mois).',
      'Produit perçu en N pour N+1 : produit constaté d’avance, D 7xx / C 487.',
      'Charge de N non encore facturée : D 6xx (HT) + D 44586 (TVA) / C 408 (TTC).',
      'Produit de N non encore facturé : D 418 (TTC) / C 7xx (HT) + C 44587 (TVA).',
      'Intérêts courus sur emprunt : capital restant dû × taux × mois écoulés depuis la dernière échéance ÷ 12 : D 6611 / C 1688.',
      'Avoir à recevoir : D 4098 (TTC) / C 609 (HT) + C 44586 (TVA).',
      'Toutes ces écritures sont contrepassées à l’ouverture de N+1.'
    ],
    pieges: [
      'Charges et produits constatés d’avance : montants HT, sans TVA.',
      'Compter les mois : une prime payée le 1er octobre pour 12 mois couvre 3 mois de N et 9 mois de N+1.',
      'Factures non parvenues : la TVA passe au 44586 (pas au 44566, elle n’est pas encore déductible).',
      'Intérêts courus : partir de la dernière échéance, pas de la date de l’emprunt si une échéance a déjà été payée.'
    ],
    comptes: ['486 Charges constatées d’avance', '487 Produits constatés d’avance', '408 Fournisseurs – factures non parvenues', '418 Clients – produits non encore facturés', '44586 / 44587 TVA sur factures', '1688 Intérêts courus', '4098 RRR à obtenir']
  },
  gen: function (r) {
    var pool = ['cca_assur', 'cca_loyer', 'pca', 'fnp', 'fae', 'icne', 'aar'];
    var items = r.pickN(pool, 4).map(function (k) {
      switch (k) {
        case 'cca_assur': return { k: k, mt: r.int(12, 120) * 120, m: r.int(2, 12) };
        case 'cca_loyer': var per = r.pick([3, 6]); return { k: k, per: per, mt: r.int(5, 60) * 300, m: r.int(14 - per, 12) };
        case 'pca': var per2 = r.pick([3, 6]); return { k: k, per: per2, mt: r.int(4, 40) * 600, m: r.int(14 - per2, 12) };
        case 'fnp': return { k: k, nat: r.pick([['électricité de décembre', '6061'], ['honoraires de l’expert-comptable', '6226'], ['transport sur achats de décembre', '6241']]), ht: r.int(5, 120) * 50 };
        case 'fae': return { k: k, ht: r.int(10, 200) * 100 };
        case 'icne': return { k: k, K: r.int(5, 50) * 10000, t: r.pick([0.025, 0.03, 0.035, 0.04, 0.045, 0.05]), m: r.int(2, 11) };
        default: return { k: 'aar', ht: r.int(5, 80) * 100 };
      }
    });
    return { nom: U.nom(r), items: items };
  },
  solve: function (p) {
    var e = U.e, n = U.n, L = U.L, li = [], qs = [], c = [], journal = [];
    p.items.forEach(function (it, i) {
      var id = 'i' + i, m = it.m, d1 = it.m ? U.dt(1, it.m) : '';
      if (it.k === 'cca_assur') {
        var nN1 = m - 1, cca = U.r2(it.mt * nN1 / 12);
        li.push('La prime annuelle d’assurance de ' + e(it.mt) + ', payée le ' + d1 + ', couvre la période du ' + d1 + ' au ' + U.dt(U.lastDay(m - 1), m - 1, 1) + '.');
        qs.push(Q(id, 'Charge constatée d’avance (assurance)', cca, '€'));
        c.push(['Assurance', n(it.mt) + ' × ' + nN1 + '/12 (mois de N+1)', e(cca)]);
        journal.push(U.entry('31/12/N', 'Assurance constatée d’avance', [L('486', cca, 0), L('616', 0, cca)]));
      } else if (it.k === 'cca_loyer') {
        var inN = 13 - m, nN1b = it.per - inN, ccb = U.r2(it.mt * nN1b / it.per);
        li.push('Le loyer ' + (it.per === 3 ? 'trimestriel' : 'semestriel') + ' de ' + e(it.mt) + ' HT, payé d’avance le ' + d1 + ', couvre ' + it.per + ' mois à compter de cette date.');
        qs.push(Q(id, 'Charge constatée d’avance (loyer)', ccb, '€'));
        c.push(['Loyer payé', n(it.mt) + ' × ' + nN1b + '/' + it.per + ' (' + nN1b + ' mois sur N+1)', e(ccb)]);
        journal.push(U.entry('31/12/N', 'Loyer constaté d’avance', [L('486', ccb, 0), L('613', 0, ccb)]));
      } else if (it.k === 'pca') {
        var inN2 = 13 - m, nN1c = it.per - inN2, pca = U.r2(it.mt * nN1c / it.per);
        li.push('La société loue un entrepôt inutilisé ; elle a encaissé le ' + d1 + ' le loyer ' + (it.per === 3 ? 'trimestriel' : 'semestriel') + ' d’avance de ' + e(it.mt) + ' HT, comptabilisé en produits.');
        qs.push(Q(id, 'Produit constaté d’avance', pca, '€'));
        c.push(['Loyer perçu', n(it.mt) + ' × ' + nN1c + '/' + it.per, e(pca)]);
        journal.push(U.entry('31/12/N', 'Loyer perçu d’avance', [L('706', pca, 0, { alt: ['7083', '708', '752'], show: '7083', lib: 'Locations diverses' }), L('487', 0, pca)]));
      } else if (it.k === 'fnp') {
        var tv = U.r2(it.ht * 0.2);
        li.push('La facture ' + (/^[aeiouéh]/i.test(it.nat[0]) ? 'd’' : 'de ') + it.nat[0] + ' (' + e(it.ht) + ' HT, TVA 20 %) ne sera reçue qu’en janvier N+1.');
        qs.push(Q(id, 'Montant TTC des factures non parvenues', U.r2(it.ht + tv), '€'));
        c.push(['Facture non parvenue', n(it.ht) + ' + 20 %', e(U.r2(it.ht + tv))]);
        journal.push(U.entry('31/12/N', 'Facture non parvenue', [L(it.nat[1], it.ht, 0), L('44586', tv, 0), L('408', 0, U.r2(it.ht + tv))]));
      } else if (it.k === 'fae') {
        var tv2 = U.r2(it.ht * 0.2);
        li.push('Des marchandises livrées le 28/12/N à un client pour ' + e(it.ht) + ' HT seront facturées en janvier N+1.');
        qs.push(Q(id, 'Montant TTC des produits à facturer', U.r2(it.ht + tv2), '€'));
        c.push(['Facture à établir', n(it.ht) + ' + 20 %', e(U.r2(it.ht + tv2))]);
        journal.push(U.entry('31/12/N', 'Facture à établir', [L('418', U.r2(it.ht + tv2), 0), L('707', 0, it.ht), L('44587', 0, tv2)]));
      } else if (it.k === 'icne') {
        var mo = 13 - m, ic = U.r2(it.K * it.t * mo / 12);
        li.push('Un emprunt dont le capital restant dû est de ' + e(it.K) + ' (taux ' + U.pcs(it.t) + ') a son échéance annuelle le ' + U.dt(1, m).slice(0, 5) + ' de chaque année ; la dernière échéance a été payée le ' + d1 + '.');
        qs.push(Q(id, 'Intérêts courus non échus', ic, '€'));
        c.push(['Intérêts courus', n(it.K) + ' × ' + U.pcs(it.t) + ' × ' + mo + '/12', e(ic)]);
        journal.push(U.entry('31/12/N', 'Intérêts courus', [L('6611', ic, 0), L('1688', 0, ic)]));
      } else {
        var tv3 = U.r2(it.ht * 0.2);
        li.push('Le principal fournisseur accordera une ristourne de ' + e(it.ht) + ' HT sur les achats de N ; l’avoir sera reçu en février N+1.');
        qs.push(Q(id, 'Avoir à recevoir TTC', U.r2(it.ht + tv3), '€'));
        c.push(['Avoir à recevoir', n(it.ht) + ' + 20 %', e(U.r2(it.ht + tv3))]);
        journal.push(U.entry('31/12/N', 'Avoir à recevoir', [L('4098', U.r2(it.ht + tv3), 0), L('609', 0, it.ht), L('44586', 0, tv3)]));
      }
    });
    var en = '<p>Informations d’inventaire de la société <b>' + p.nom + '</b> au 31/12/N (TVA 20 %) :</p><ol>' + li.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol><p class="consigne">Calculez les montants et passez les écritures de régularisation au 31/12/N.</p>';
    var com = 'Ces écritures appliquent le principe d’indépendance des exercices : chaque exercice doit supporter les charges et les produits qui le concernent, quelle que soit la date du paiement ou de la facture. Les charges et produits constatés d’avance retirent du résultat de N la part qui concerne N+1, toujours hors taxes. Les factures non parvenues, les factures à établir et les intérêts courus ajoutent au contraire des éléments déjà nés en N mais pas encore facturés ou échus ; la TVA correspondante transite par des comptes d’attente (44586, 44587) car elle n’est ni déductible ni exigible avant la facture. Au bilan, ces montants apparaissent en comptes de régularisation et en dettes ou créances. Toutes ces écritures seront contrepassées à l’ouverture de N+1, pour que la facture ou le paiement réel s’enregistre normalement. En analyse fonctionnelle, les charges et produits constatés d’avance d’exploitation entrent dans le BFRE, et les intérêts courus dans les dettes hors exploitation.';
    return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Calculs', html: U.calc(c) }], comment: com };
  }
};
