/* ===== Augmentation de capital, comptabilité de gestion ===== */

/* ---------- 10. Augmentation de capital ---------- */
T.augcap = {
  id: 'augcap', nom: 'Augmentation de capital', famille: 'Comptabilité des sociétés', ctrl: false, minutes: 18,
  fiche: {
    objectif: 'Comptabiliser une augmentation de capital (numéraire ou incorporation de réserves) et calculer la valeur du droit préférentiel de souscription ou du droit d’attribution.',
    etapes: [
      'Modalités : apports en numéraire, apports en nature, incorporation de réserves, conversion de dettes (compensation de créances), paiement du dividende en actions.',
      'Prix d’émission = nominal + prime d’émission. Prime totale = (prix d’émission − nominal) × nombre d’actions nouvelles.',
      'Libération minimale à la souscription : 1/4 du nominal + la totalité de la prime ; le solde est appelé dans les 5 ans.',
      'Souscription : D 109 (non appelé) + D 4563 (sommes à verser) / C 1011 (non appelé) + C 1013 (appelé versé) + C 1041 (prime).',
      'Versement des fonds : D 512 / C 4563.',
      'DPS : valeur après = (N × V + n × E) ÷ (N + n) ; DPS = V − valeur après. Droit d’attribution (actions gratuites) : V − N × V ÷ (N + n).',
      'Frais : imputés sur la prime d’émission (D 1041), ou en charges ; certains sujets les inscrivent en frais d’établissement (2013) amortis sur 5 ans au plus : suis la consigne de l’énoncé.'
    ],
    pieges: [
      'Oublier que la prime est intégralement libérée dès la souscription.',
      'Mettre la prime d’émission dans le capital.',
      'TVA sur les frais : 20 % du HT (le corrigé officiel du sujet test indique 400 € pour 4 000 € HT, c’est une coquille : 800 €).',
      'Amortissement des frais d’établissement au prorata à partir de la date de l’opération.',
      'Incorporation de réserves : aucun mouvement de trésorerie, D 1068 / C 1013.'
    ],
    comptes: ['109 Actionnaires – capital souscrit non appelé', '1011 / 1012 / 1013 Capital souscrit', '1041 Primes d’émission', '4563 Associés – versements reçus sur augmentation de capital', '2013 Frais d’augmentation de capital', '1068 Autres réserves']
  },
  gen: function (r) {
    var v = r.pick([10, 15, 20, 50, 100]), N = r.int(2, 40) * 1000, par = r.pick([2, 4, 5, 8, 10]), n = N / par;
    var V = U.r0(v * r.int(13, 30) / 10);
    if (r.chance(0.25)) return { nom: U.nom(r), mode: 'res', v: v, N: N, n: n, V: V, date: { d: 1, m: r.int(3, 10) } };
    var E = U.r0(v + (V - v) * r.int(3, 8) / 10);
    if (E <= v) E = v + 1;
    var m = r.int(2, 10);
    var fm = r.pick(['prime', 'prime', 'charges', 'etab']);
    return { nom: U.nom(r), mode: 'num', v: v, N: N, n: n, V: V, E: E, lib: r.pick([0.25, 0.25, 0.5, 1]), frais: r.int(4, 40) * 500, fraisMode: fm, date: { d: 1, m: m }, vers: { d: r.int(10, 25), m: m } };
  },
  solve: function (p) {
    var e = U.e, n = U.n, L = U.L, qs = [], c = [], journal = [], en, com;
    var dA = U.dt(p.date.d, p.date.m);
    if (p.mode === 'res') {
      var inc = U.r2(p.n * p.v), apres = U.r2(p.N * p.V / (p.N + p.n)), da = U.r2(p.V - apres);
      en = '<p>Le capital de la société <b>' + p.nom + '</b> est composé de ' + n(p.N) + ' actions de nominal ' + e(p.v) + ', cotées ' + e(p.V) + '. Le ' + dA + ', elle augmente son capital par incorporation de réserves facultatives, en attribuant gratuitement ' + n(p.n) + ' actions nouvelles.</p>';
      en += '<p class="consigne">1. Calculez le montant incorporé, la valeur théorique de l’action après l’opération et la valeur du droit d’attribution. 2. Comptabilisez l’opération.</p>';
      qs = [Q('inc', 'Montant des réserves incorporées', inc, '€'), Q('par', 'Nombre d’actions anciennes pour 1 action nouvelle', p.N / p.n, 'u', { tol: 0 }), Q('ap', 'Valeur théorique après l’opération', apres, '€', { tol: 0.01 }), Q('da', 'Valeur du droit d’attribution', da, '€', { tol: 0.01 })];
      c = [['Réserves incorporées', n(p.n) + ' × ' + n(p.v), e(inc)], ['Parité', n(p.N) + ' ÷ ' + n(p.n), (p.N / p.n) + ' anciennes pour 1 nouvelle'], ['Valeur après', n(p.N) + ' × ' + n(p.V) + ' ÷ (' + n(p.N) + ' + ' + n(p.n) + ')', U.e2(apres)], ['Droit d’attribution', n(p.V) + ' − ' + n(apres, 2), '<b>' + U.e2(da) + '</b>']];
      journal = [U.entry(dA, 'Incorporation de réserves au capital', [L('1068', inc, 0), L('1013', 0, inc)])];
      com = 'L’incorporation de réserves transforme des réserves en capital : les capitaux propres totaux ne changent pas et aucune trésorerie n’entre dans l’entreprise. L’opération renforce cependant la garantie des créanciers, car le capital ne peut plus être distribué. Le nombre d’actions augmente de ' + n(p.n) + ' alors que la valeur de l’entreprise reste identique : le cours théorique baisse de ' + e(p.V) + ' à ' + U.e2(apres) + '. Le droit d’attribution (' + U.e2(da) + ') compense exactement cette baisse pour l’actionnaire ancien : avec ' + (p.N / p.n) + ' droits, il reçoit une action gratuite. Un actionnaire qui ne veut pas augmenter sa participation peut céder ses droits. L’opération améliore aussi la liquidité du titre en abaissant son cours unitaire.';
      return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Calculs', html: U.calc(c) }], comment: com };
    }
    var prU = U.r2(p.E - p.v), prT = U.r2(prU * p.n), capT = U.r2(p.n * p.v), appele = U.r2(capT * p.lib), nonApp = U.r2(capT - appele), verse = U.r2(appele + prT);
    var libTxt = { 0.25: 'du minimum légal (le quart du nominal)', 0.5: 'de la moitié du nominal', 1: 'intégralement' }[p.lib];
    en = '<p>La société <b>' + p.nom + '</b> procède le ' + dA + ' à une augmentation de capital en numéraire :</p>';
    var li = ['émission de ' + n(p.n) + ' actions nouvelles de nominal ' + e(p.v) + ' au prix de ' + e(p.E) + ' ;', 'les actions sont libérées ' + libTxt + ' et de la totalité de la prime ;'];
    if (p.N) li.push('avant l’opération, le capital comprend ' + n(p.N) + ' actions, dont la valeur réelle est de ' + e(p.V) + ' ;');
    if (p.frais) li.push('les frais d’augmentation de capital s’élèvent à ' + e(p.frais) + ' HT (TVA 20 %), réglés par virement le ' + dA + ' ; ' + { prime: 'ils sont imputés sur la prime d’émission.', charges: 'ils sont comptabilisés en charges (honoraires).', etab: 'ils sont inscrits en frais d’établissement, amortis sur 5 ans.' }[p.fraisMode]);
    li.push('les fonds sont reçus en banque le ' + U.dt(p.vers.d, p.vers.m) + '.');
    en += U.ul(li);
    en += '<p class="consigne">1. Rappelez les modalités d’une augmentation de capital. 2. ' + (p.N ? 'Calculez la valeur théorique du droit préférentiel de souscription. 3. ' : 'Définissez le droit préférentiel de souscription. 3. ') + 'Passez les écritures au journal' + (p.fraisMode === 'etab' ? ', y compris au 31/12/N' : '') + '.</p>';
    qs = [Q('pr', 'Prime d’émission totale', prT, '€'), Q('ve', 'Somme à verser à la souscription', verse, '€'), Q('na', 'Capital souscrit non appelé', nonApp, '€')];
    c = [['Prime unitaire', n(p.E) + ' − ' + n(p.v), e(prU)], ['Prime totale', n(prU) + ' × ' + n(p.n), e(prT)], ['Augmentation du capital', n(p.n) + ' × ' + n(p.v), e(capT)],
      ['Capital appelé et versé', n(capT) + ' × ' + n(p.lib, 2), e(appele)], ['Capital non appelé', n(capT) + ' − ' + n(appele), e(nonApp)], ['À verser à la souscription', n(appele) + ' + ' + n(prT), '<b>' + e(verse) + '</b>']];
    var apres, dps;
    if (p.N) {
      apres = U.r2((p.N * p.V + p.n * p.E) / (p.N + p.n)); dps = U.r2(p.V - (p.N * p.V + p.n * p.E) / (p.N + p.n));
      qs.push(Q('ap', 'Valeur théorique de l’action après l’augmentation', apres, '€', { tol: 0.01 }), Q('dps', 'Valeur théorique du DPS', dps, '€', { tol: 0.01 }));
      c.push(['Valeur après', '(' + n(p.N) + ' × ' + n(p.V) + ' + ' + n(p.n) + ' × ' + n(p.E) + ') ÷ ' + n(p.N + p.n), U.e2(apres)], ['DPS', n(p.V) + ' − ' + n(apres, 2), '<b>' + U.e2(dps) + '</b>'], ['Parité', n(p.N) + ' ÷ ' + n(p.n), (p.N / p.n) + ' DPS pour 1 action nouvelle']);
    }
    journal.push(U.entry(dA, 'Souscription de l’augmentation de capital', [L('109', nonApp, 0), L('4563', verse, 0, { alt: ['4562'] }), L('1011', 0, nonApp), L('1013', 0, appele, { alt: ['1012'] }), L('1041', 0, prT)]));
    var tvaF = U.r2(p.frais * 0.2), dotF = 0;
    if (p.frais) {
      if (p.fraisMode === 'prime') journal.push(U.entry(dA, 'Frais imputés sur la prime d’émission', [L('1041', p.frais, 0), L('44566', tvaF, 0), L('512', 0, U.r2(p.frais + tvaF))]));
      if (p.fraisMode === 'charges') journal.push(U.entry(dA, 'Frais d’augmentation de capital', [L('6226', p.frais, 0), L('44566', tvaF, 0), L('512', 0, U.r2(p.frais + tvaF))]));
      if (p.fraisMode === 'etab') journal.push(U.entry(dA, 'Frais d’augmentation de capital', [L('2013', p.frais, 0), L('44562', tvaF, 0), L('512', 0, U.r2(p.frais + tvaF))]));
      c.push(['TVA sur frais', n(p.frais) + ' × 20 %', e(tvaF)]);
    }
    journal.push(U.entry(U.dt(p.vers.d, p.vers.m), 'Versement des fonds', [L('512', verse, 0), L('4563', 0, verse, { alt: ['4562'] })]));
    if (p.frais && p.fraisMode === 'etab') {
      var mo = 13 - p.date.m; dotF = U.r2(p.frais / 5 * mo / 12);
      qs.push(Q('dotf', 'Dotation aux amortissements des frais au 31/12/N', dotF, '€'));
      c.push(['Dotation des frais', n(p.frais) + ' × 1/5 × ' + mo + '/12', e(dotF)]);
      journal.push(U.entry('31/12/N', 'Amortissement des frais d’augmentation de capital', [L('6811', dotF, 0), L('28013', 0, dotF)]));
    }
    var modal = U.ul(['apport en numéraire (cas présent) ;', 'apport en nature ;', 'incorporation de réserves (attribution d’actions gratuites) ;', 'compensation avec des créances liquides et exigibles sur la société (conversion de dettes) ;', 'paiement du dividende en actions.']);
    var defDps = U.p('Le droit préférentiel de souscription (DPS) permet aux actionnaires anciens de souscrire en priorité aux actions nouvelles, proportionnellement à leur participation. Il compense la dilution : les actions nouvelles sont émises sous la valeur réelle, ce qui fait baisser la valeur de l’action. Il est négociable : l’actionnaire qui ne souscrit pas peut le vendre.');
    com = 'L’augmentation de capital en numéraire apporte des ressources propres durables : ' + e(capT) + ' de capital et ' + e(prT) + ' de prime, soit ' + e(U.r2(capT + prT)) + ' de capitaux propres nouveaux, dont ' + e(verse) + ' encaissés immédiatement' + (nonApp ? ' et ' + e(nonApp) + ' à appeler dans les cinq ans' : '') + '. La prime d’émission rémunère l’écart entre la valeur réelle de l’action et son nominal : elle protège les anciens actionnaires, qui ont contribué aux réserves accumulées. ' + (p.N ? 'Le prix d’émission (' + e(p.E) + ') étant inférieur à la valeur réelle (' + e(p.V) + '), l’action perd ' + U.e2(dps) + ' de valeur théorique : c’est la valeur du DPS, qui indemnise exactement l’actionnaire ancien. ' : '') + 'Pour l’analyse financière, l’opération renforce le fonds de roulement et l’autonomie financière, et améliore la capacité d’emprunt. Le capital non appelé figure à l’actif (109) et doit être déduit des capitaux propres dans le bilan fonctionnel. ' + (p.fraisMode === 'prime' ? 'L’imputation des frais sur la prime évite de pénaliser le résultat de l’exercice.' : (p.fraisMode === 'etab' ? 'Les frais immobilisés sont étalés sur cinq ans ; le PCG modernisé privilégie leur imputation sur la prime ou leur passage en charges.' : 'Les frais passés en charges réduisent le résultat de l’exercice mais sont fiscalement déductibles.'));
    return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Modalités', html: modal }, { h: 'Droit préférentiel de souscription', html: defDps }, { h: 'Calculs', html: U.calc(c) }], comment: com };
  }
};

/* ---------- 11. Seuil de rentabilité ---------- */
var PRODUITS = [['vélos électriques', 'vélo'], ['tables de jardin', 'table'], ['poêles à granulés', 'poêle'], ['kayaks', 'kayak'], ['casques audio', 'casque'], ['ruches connectées', 'ruche'], ['fauteuils de bureau', 'fauteuil'], ['trottinettes', 'trottinette']];
function pointMortDate(jours) {
  var d = Math.ceil(jours - 1e-9); if (d < 1) d = 1; if (d > 360) return 'au-delà de l’exercice';
  var m = Math.ceil(d / 30), j = d - 30 * (m - 1);
  return 'le ' + (j === 1 ? '1er' : j) + ' ' + U.MOIS[m - 1];
}
T.seuil = {
  id: 'seuil', nom: 'Seuil de rentabilité et marge sur coût variable', famille: 'Comptabilité de gestion', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Présenter le compte de résultat différentiel et en déduire le seuil de rentabilité, le point mort, la marge et l’indice de sécurité, le levier opérationnel.',
    etapes: [
      'Compte de résultat différentiel : CA − charges variables = marge sur coût variable (MCV) ; MCV − charges fixes = résultat. Ajoute la colonne en % du CA.',
      'Taux de MCV = MCV ÷ CA.',
      'Seuil de rentabilité (SR) en valeur = charges fixes ÷ taux de MCV.',
      'SR en quantité = charges fixes ÷ MCV unitaire, arrondi à l’unité supérieure.',
      'Point mort = SR ÷ CA × 360 jours (ou × 12 mois) si l’activité est régulière ; traduis-le en date.',
      'Marge de sécurité = CA − SR ; indice de sécurité = marge de sécurité ÷ CA.',
      'Levier opérationnel = MCV ÷ résultat : variation du résultat (en %) pour 1 % de variation du CA.'
    ],
    pieges: [
      'Arrondir le taux de MCV trop tôt (le corrigé officiel du sujet test arrondit à 0,5625 : 1 337 493 € au lieu de 1 337 545 €).',
      'Arrondir le SR en quantité à l’inférieur : avec 385 unités le résultat reste négatif, il faut 386.',
      'Point mort : année commerciale de 360 jours, mois de 30 jours, à partir du début de l’exercice.',
      'Définir le compte de résultat différentiel : il classe les charges selon leur variabilité (et non selon leur nature).'
    ],
    comptes: []
  },
  gen: function (r) {
    for (var i = 0; i < 100; i++) {
      var pr = r.pick(PRODUITS), p = r.int(20, 3500), q = r.int(10, 400) * (p > 1000 ? 5 : 100);
      var tx = r.int(25, 65) / 100, cvu = U.r2(p * (1 - tx)), CA = p * q, MCV = CA - cvu * q;
      var CF = U.r0(MCV * r.int(55, 90) / 100 / 100) * 100;
      if (MCV - CF <= 0) continue;
      return { nom: U.nom(r), prod: pr, p: p, q: q, cvu: cvu, CF: CF, global: r.chance(0.4), dCA: r.pick([0.05, 0.1, 0.15, -0.1, 0.2]) };
    }
  },
  calc: function (p) {
    var CA = U.r2(p.p * p.q), CV = p.CV !== undefined ? p.CV : U.r2(p.cvu * p.q), MCV = U.r2(CA - CV), tx = MCV / CA, R = U.r2(MCV - p.CF);
    var SR = U.r2(p.CF / tx), mcvu = MCV / p.q, SRq = p.CF / mcvu, SRqc = Math.ceil(SRq - 1e-9), PMj = SR / CA * 360;
    var MS = U.r2(CA - SR), IS = MS / CA, LO = MCV / R, R2 = U.r2(MCV * (1 + p.dCA) - p.CF);
    return { CA: CA, CV: CV, MCV: MCV, tx: tx, R: R, SR: SR, mcvu: mcvu, SRq: SRq, SRqc: SRqc, PMj: PMj, MS: MS, IS: IS, LO: LO, R2: R2 };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n;
    var en = '<p>La société <b>' + p.nom + '</b> fabrique des ' + p.prod[0] + '. Données de l’exercice N :</p>';
    en += U.kv(p.global ? [['Prix de vente unitaire', e(p.p) + ' HT'], ['Chiffre d’affaires', e(x.CA) + ' HT'], ['Charges variables', e(x.CV)], ['Charges fixes', e(p.CF)]]
      : [['Quantités vendues', n(p.q) + ' ' + p.prod[0]], ['Prix de vente unitaire', e(p.p) + ' HT'], ['Coût variable unitaire', U.e2(p.cvu)], ['Charges fixes annuelles', e(p.CF)]]);
    en += '<p>L’activité est régulière sur l’année (exercice du 01/01 au 31/12).</p>';
    en += '<p class="consigne">1. Définissez et présentez le compte de résultat différentiel. 2. Calculez le seuil de rentabilité en valeur et en quantité, puis le point mort. 3. Calculez la marge et l’indice de sécurité et le levier opérationnel ; que devient le résultat si le chiffre d’affaires varie de ' + (p.dCA > 0 ? '+' : '') + U.pcs(p.dCA) + ' ?</p>';
    var qs = [Q('mcv', 'Marge sur coût variable', x.MCV, '€'), Q('tx', 'Taux de marge sur coût variable', U.rd(x.tx * 100, 2), '%', { tol: 0.06 }), Q('res', 'Résultat', x.R, '€'), Q('sr', 'Seuil de rentabilité en valeur', x.SR, '€', { tol: Math.max(2, x.SR * 0.001) }),
      Q('srq', 'Seuil de rentabilité en quantité (arrondi supérieur)', x.SRqc, 'u', { tol: 1 }), Q('pm', 'Point mort (jour de l’année de 360 jours)', Math.ceil(x.PMj - 1e-9), 'j', { tol: 1 }), Q('ms', 'Marge de sécurité', x.MS, '€', { tol: Math.max(2, x.MS * 0.002) }),
      Q('is', 'Indice de sécurité', U.rd(x.IS * 100, 2), '%', { tol: 0.1 }), Q('lo', 'Levier opérationnel', U.rd(x.LO, 2), '', { tol: 0.03 }), Q('r2', 'Résultat après variation du CA', x.R2, '€')];
    var crd = U.tbl(['Compte de résultat différentiel', 'Montant', '% du CA'], [['Chiffre d’affaires' + (p.global ? '' : ' (' + n(p.q) + ' × ' + n(p.p) + ')'), e(x.CA), '100 %'], ['− Charges variables', e(x.CV), U.pc(x.CV / x.CA)], { cls: 'tot', cells: ['= Marge sur coût variable', e(x.MCV), U.pc(x.tx)] }, ['− Charges fixes', e(p.CF), U.pc(p.CF / x.CA)], { cls: 'tot', cells: ['= Résultat', e(x.R), U.pc(x.R / x.CA)] }]);
    var c = [['Taux de MCV', n(x.MCV) + ' ÷ ' + n(x.CA), U.pc(x.tx, 4)], ['Seuil en valeur', n(p.CF) + ' ÷ ' + n(x.tx, 6), '<b>' + e(x.SR) + '</b>'],
      ['MCV unitaire', n(x.MCV) + ' ÷ ' + n(p.q), U.e2(x.mcvu)], ['Seuil en quantité', n(p.CF) + ' ÷ ' + n(x.mcvu, 2) + ' = ' + n(x.SRq, 2), '<b>' + n(x.SRqc) + ' unités</b>'],
      ['Point mort', n(x.SR) + ' ÷ ' + n(x.CA) + ' × 360 = ' + n(x.PMj, 1) + ' jours', pointMortDate(x.PMj)], ['Marge de sécurité', n(x.CA) + ' − ' + n(x.SR), e(x.MS)], ['Indice de sécurité', n(x.MS) + ' ÷ ' + n(x.CA), U.pc(x.IS)],
      ['Levier opérationnel', n(x.MCV) + ' ÷ ' + n(x.R), n(x.LO, 2)], ['Résultat après variation', n(x.MCV) + ' × ' + n(1 + p.dCA, 2) + ' − ' + n(p.CF) + ' (soit ' + (p.dCA * x.LO > 0 ? '+' : '') + U.pc(p.dCA * x.LO, 1) + ')', e(x.R2)]];
    var def = U.p('Le compte de résultat différentiel reclasse les charges selon leur comportement face à l’activité : les charges variables évoluent avec le volume vendu, les charges fixes en sont indépendantes à court terme. Il fait apparaître la marge sur coût variable, qui doit couvrir les charges fixes, et permet de calculer le seuil de rentabilité : le chiffre d’affaires pour lequel le résultat est nul.');
    var com = 'Avec un taux de marge sur coût variable de ' + U.pc(x.tx, 1) + ', chaque euro de chiffre d’affaires dégage ' + n(x.tx, 2) + ' € pour couvrir les ' + e(p.CF) + ' de charges fixes. Le seuil de rentabilité est atteint pour ' + e(x.SR) + ' de chiffre d’affaires, soit ' + n(x.SRqc) + ' ' + p.prod[0] + ' ; si l’activité est régulière, le point mort est atteint ' + pointMortDate(x.PMj) + '. L’indice de sécurité de ' + U.pc(x.IS, 1) + ' signifie que le chiffre d’affaires peut baisser de ' + U.pc(x.IS, 1) + ' avant que l’entreprise ne devienne déficitaire : ' + (x.IS < 0.15 ? 'la marge est faible, l’entreprise est vulnérable à un retournement de la demande.' : (x.IS > 0.35 ? 'la marge est confortable.' : 'la sécurité est correcte sans être confortable.')) + ' Le levier opérationnel de ' + n(x.LO, 2) + ' indique qu’une variation de 1 % du chiffre d’affaires fait varier le résultat de ' + n(x.LO, 2) + ' % : ' + (x.LO > 5 ? 'le risque d’exploitation est élevé, lié au poids des charges fixes.' : 'le risque d’exploitation reste mesuré.') + ' Une variation de ' + U.pcs(p.dCA) + ' du chiffre d’affaires porterait ainsi le résultat à ' + e(x.R2) + '. Pour abaisser le seuil, l’entreprise peut réduire ses charges fixes, améliorer son taux de marge (prix, achats) ou transformer des charges fixes en charges variables (sous-traitance).';
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Définition', html: def }, { h: 'Compte de résultat différentiel', html: crd }, { h: 'Calculs', html: U.calc(c) }], comment: com };
  }
};

/* ---------- 12. Commande spéciale et coût marginal ---------- */
T.commande = {
  id: 'commande', nom: 'Commande spéciale et coût marginal', famille: 'Comptabilité de gestion', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Décider d’accepter une commande supplémentaire à prix réduit par le raisonnement global puis par le coût marginal.',
    etapes: [
      'Raisonnement global : résultat sans la commande et résultat avec la commande (CA, charges variables, charges fixes), puis l’écart.',
      'Coût marginal = coût de la série supplémentaire = charges variables de la commande + charges fixes supplémentaires éventuelles.',
      'Recette marginale = quantité × prix négocié.',
      'Résultat marginal = recette marginale − coût marginal (égal à l’écart du raisonnement global).',
      'Conclusion : accepter si le résultat marginal est positif, en vérifiant la capacité, l’absence d’effet sur les prix des clients habituels et le caractère ponctuel.'
    ],
    pieges: [
      'Comparer le prix proposé au coût complet unitaire : le coût complet intègre des charges fixes déjà couvertes.',
      'Oublier une charge fixe supplémentaire (location d’une machine, embauche) ou un surcoût variable (heures supplémentaires).',
      'Conclure sans réserve : risque commercial (clients habituels), saturation de la capacité.'
    ],
    comptes: []
  },
  gen: function (r) {
    var pr = r.pick(PRODUITS), p = r.int(80, 900), cvu = U.r0(p * r.int(40, 65) / 100), q = r.int(5, 120) * 10;
    var CF = U.r0(q * (p - cvu) * r.int(60, 90) / 100 / 100) * 100;
    var q2 = U.r0(q * r.int(15, 45) / 100 / 10) * 10 || 10;
    var v = r.pick(['simple', 'simple', 'surcout', 'refus']);
    var p2, cvu2 = cvu, dCF = 0;
    if (v === 'refus') { p2 = U.r0(cvu * r.int(85, 98) / 100); }
    else { p2 = U.r0(cvu + (p - cvu) * r.int(10, 60) / 100); }
    if (v === 'surcout') { cvu2 = U.r0(cvu * r.int(103, 110) / 100); dCF = Math.max(0, U.r0(q2 * (p2 - cvu2) * r.int(20, 130) / 100 / 100) * 100); }
    return { nom: U.nom(r), prod: pr, p: p, cvu: cvu, q: q, CF: CF, q2: q2, p2: p2, cvu2: cvu2, dCF: dCF, mois: r.pick(U.MOIS) };
  },
  calc: function (p) {
    var CA0 = p.q * p.p, CV0 = p.q * p.cvu, R0 = U.r2(CA0 - CV0 - p.CF);
    var CA1 = U.r2(CA0 + p.q2 * p.p2), CV1 = U.r2(CV0 + p.q2 * p.cvu2), CF1 = U.r2(p.CF + p.dCF), R1 = U.r2(CA1 - CV1 - CF1);
    var cm = U.r2(p.q2 * p.cvu2 + p.dCF), rm = U.r2(p.q2 * p.p2), res = U.r2(rm - cm);
    return { CA0: CA0, CV0: CV0, R0: R0, CA1: CA1, CV1: CV1, CF1: CF1, R1: R1, cm: cm, cmu: cm / p.q2, rm: rm, res: res, cc: (CV0 + p.CF) / p.q };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n;
    var en = '<p>Chaque mois, la société <b>' + p.nom + '</b> fabrique et vend ' + n(p.q) + ' ' + p.prod[0] + ' au prix unitaire de ' + e(p.p) + '. Coût mensuel de cette production :</p>';
    en += U.kv([['Charges variables', e(x.CV0) + ' (' + U.e2(p.cvu) + ' par unité)'], ['Charges fixes', e(p.CF)], ['Coût total', e(U.r2(x.CV0 + p.CF)) + ' (' + U.e2(x.cc) + ' par unité)']]);
    en += '<p>Elle reçoit pour le mois ' + (/^[aeiou]/.test(p.mois) ? 'd’' : 'de ') + p.mois + ' une commande complémentaire de ' + n(p.q2) + ' ' + p.prod[0] + ' au prix négocié de ' + e(p.p2) + ' l’unité. ';
    en += p.dCF || p.cvu2 !== p.cvu ? 'Pour l’exécuter, il faudrait recourir à des heures supplémentaires, qui portent le coût variable des unités de la commande à ' + U.e2(p.cvu2) + (p.dCF ? ', et louer un équipement pour ' + e(p.dCF) + ' sur le mois' : '') + '.</p>' : 'La capacité de production permet de l’exécuter sans modifier les charges fixes mensuelles.</p>';
    en += '<p class="consigne">1. Présentez le raisonnement global. 2. Présentez le raisonnement par le coût marginal. 3. Concluez sur l’opportunité d’accepter la commande.</p>';
    var qs = [Q('r0', 'Résultat mensuel sans la commande', x.R0, '€'), Q('r1', 'Résultat mensuel avec la commande', x.R1, '€'), Q('cm', 'Coût marginal de la commande', x.cm, '€'), Q('cmu', 'Coût marginal unitaire', U.r2(x.cmu), '€', { tol: 0.05 }),
      Q('rm', 'Recette marginale', x.rm, '€'), Q('res', 'Résultat marginal', x.res, '€'), QC('dec', 'Décision', ['Accepter la commande', 'Refuser la commande'], x.res > 0 ? 0 : 1)];
    var glob = U.tbl(['', 'Sans la commande', 'Avec la commande'], [['Chiffre d’affaires', n(p.q) + ' × ' + n(p.p) + ' = ' + e(x.CA0), n(x.CA0) + ' + ' + n(p.q2) + ' × ' + n(p.p2) + ' = ' + e(x.CA1)], ['Charges variables', n(p.q) + ' × ' + n(p.cvu, 2) + ' = ' + e(x.CV0), e(x.CV1)], ['Charges fixes', e(p.CF), e(x.CF1)], { cls: 'tot', cells: ['Résultat', e(x.R0), e(x.R1)] }]);
    var c = [['Coût marginal', n(p.q2) + ' × ' + n(p.cvu2, 2) + (p.dCF ? ' + ' + n(p.dCF) : ''), e(x.cm)], ['Coût marginal unitaire', n(x.cm) + ' ÷ ' + n(p.q2), U.e2(x.cmu)], ['Recette marginale', n(p.q2) + ' × ' + n(p.p2), e(x.rm)], ['Résultat marginal', n(x.rm) + ' − ' + n(x.cm), '<b>' + e(x.res) + '</b>'], ['Écart global', n(x.R1) + ' − ' + n(x.R0), e(U.r2(x.R1 - x.R0))]];
    var com = x.res > 0
      ? 'La commande doit être acceptée : elle augmente le résultat mensuel de ' + e(x.res) + '. Le prix proposé (' + e(p.p2) + ') est inférieur au coût complet unitaire (' + U.e2(x.cc) + '), mais ce coût contient des charges fixes déjà couvertes par la production habituelle ; seul compte le coût marginal, ici ' + U.e2(x.cmu) + ' par unité, que le prix dépasse de ' + U.e2(p.p2 - x.cmu) + '. ' + (p.dCF ? 'Les charges fixes supplémentaires de ' + e(p.dCF) + ' sont absorbées par la marge de la commande. ' : '') + 'Trois réserves s’imposent : la capacité doit réellement absorber ' + n(p.q2) + ' unités sans désorganiser la production, les clients habituels ne doivent pas apprendre ce prix et réclamer la même remise, et l’opération doit rester ponctuelle, faute de quoi le prix ne couvrirait plus durablement les charges fixes. Il faut aussi vérifier la solvabilité du client et l’absence de coûts cachés (transport, garantie).'
      : 'La commande doit être refusée : elle ' + (x.res < 0 ? 'réduirait' : 'ne modifierait pas') + ' le résultat mensuel (' + e(x.res) + '). ' + (p.p2 < p.cvu2 ? 'Le prix proposé (' + e(p.p2) + ') ne couvre même pas le coût variable unitaire (' + U.e2(p.cvu2) + ') : chaque unité vendue creuse la perte.' : 'Le prix couvre le coût variable, mais pas les charges supplémentaires qu’impose la commande : le coût marginal unitaire atteint ' + U.e2(x.cmu) + '.') + ' Le raisonnement par le coût marginal le montre directement : la recette marginale (' + e(x.rm) + ') est inférieure au coût marginal (' + e(x.cm) + '). L’entreprise pourrait renégocier le prix au-dessus de ' + U.e2(x.cmu) + ', ou accepter pour des raisons stratégiques (conquête d’un client, occupation de la capacité), mais en connaissant le coût de ce choix. Elle doit aussi éviter qu’un prix aussi bas ne serve de référence à ses clients habituels.';
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Raisonnement global', html: glob }, { h: 'Coût marginal', html: U.calc(c) }], comment: com };
  }
};

/* ---------- 19. Coût complet ---------- */
// Matière : [avec article défini, après « kg »], puis les deux produits
var FABRICATIONS = [[['l’aluminium', 'd’aluminium'], ['vélos', 'vélo'], ['trottinettes', 'trottinette']], [['l’acier', 'd’acier'], ['radiateurs', 'radiateur'], ['sèche-serviettes', 'sèche-serviettes']], [['la laine', 'de laine'], ['pulls', 'pull'], ['plaids', 'plaid']], [['l’argile', 'd’argile'], ['vases', 'vase'], ['saladiers', 'saladier']], [['le chêne', 'de chêne'], ['tables', 'table'], ['bancs', 'banc']]];
T.cout_complet = {
  id: 'cout_complet', nom: 'Coût complet : achat, production, revient', famille: 'Comptabilité de gestion', ctrl: false, minutes: 20,
  fiche: {
    objectif: 'Calculer le coût de l’unité d’œuvre des centres d’analyse, puis la chaîne des coûts (achat, production, revient) et le résultat analytique de chaque produit.',
    etapes: [
      'Charges directes : affectées sans calcul à un produit (matière consommée, main-d’œuvre directe). Charges indirectes : réparties dans les centres d’analyse.',
      'Coût de l’unité d’œuvre (UO) d’un centre = total du centre après répartition secondaire ÷ nombre d’unités d’œuvre. Assiette de frais : l’UO est « 100 € de chiffre d’affaires ».',
      'Coût d’achat = prix d’achat + charges directes d’achat + centre Approvisionnement (UO × coût de l’UO).',
      'Coût de production = matière consommée (au coût d’achat) + main-d’œuvre directe + centres de production.',
      'Coût de revient = coût de production des produits vendus + centre Distribution.',
      'Résultat analytique = chiffre d’affaires − coût de revient ; la somme des résultats analytiques, corrigée des charges non incorporables et supplétives, redonne le résultat comptable.'
    ],
    pieges: [
      'Oublier le centre Approvisionnement dans le coût de la matière consommée.',
      'Multiplier le coût de l’UO Distribution par le chiffre d’affaires au lieu du nombre de « 100 € de CA ».',
      'Conclure à l’abandon d’un produit déficitaire en coût complet : ses charges fixes resteraient à la charge des autres produits. Raisonne en coût variable avant de décider.',
      'Arrondir le coût de l’UO trop tôt : garde au moins deux décimales.'
    ],
    comptes: []
  },
  gen: function (r) {
    var f = r.pick(FABRICATIONS), M = r.int(10, 80) * 100, pm = r.int(20, 120) / 10, mA = U.r0(M * r.int(35, 65) / 100 / 10) * 10;
    var qA = r.int(4, 40) * 50, qB = r.int(4, 40) * 50, hA = U.r0(qA * r.int(5, 30) / 10), hB = U.r0(qB * r.int(5, 30) / 10);
    var p = { nom: U.nom(r), mat: f[0], pA: f[1], pB: f[2], M: M, pm: pm, mA: mA, mB: M - mA, uoA: r.int(5, 60) / 100, qA: qA, qB: qB, hA: hA, hB: hB, th: r.int(14, 30), uoP: r.int(150, 600) / 10, uoD: r.int(30, 120) / 10 };
    var d = p.uoD / 100, base = this.calc(p);
    p.vA = U.r0(base.cpA / qA / (1 - d) * r.int(88, 125) / 100);
    p.vB = U.r0(base.cpB / qB / (1 - d) * r.int(85, 120) / 100);
    return p;
  },
  calc: function (p) {
    var x = {};
    x.TA = U.r2(p.M * p.uoA); x.cam = U.r2(p.M * p.pm + x.TA); x.cu = x.cam / p.M;
    x.matA = U.r2(p.mA * x.cu); x.matB = U.r2(p.mB * x.cu);
    x.modA = U.r2(p.hA * p.th); x.modB = U.r2(p.hB * p.th);
    x.TP = U.r2((p.hA + p.hB) * p.uoP); x.atA = U.r2(p.hA * p.uoP); x.atB = U.r2(p.hB * p.uoP);
    x.cpA = U.r2(x.matA + x.modA + x.atA); x.cpB = U.r2(x.matB + x.modB + x.atB);
    if (p.vA) {
      x.caA = U.r2(p.qA * p.vA); x.caB = U.r2(p.qB * p.vB); x.nbD = (x.caA + x.caB) / 100; x.TD = U.r2(x.nbD * p.uoD);
      x.diA = U.r2(x.caA / 100 * p.uoD); x.diB = U.r2(x.caB / 100 * p.uoD);
      x.crA = U.r2(x.cpA + x.diA); x.crB = U.r2(x.cpB + x.diB);
      x.raA = U.r2(x.caA - x.crA); x.raB = U.r2(x.caB - x.crB); x.ra = U.r2(x.raA + x.raB);
    }
    return x;
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, e2 = U.e2, n = U.n;
    var A = p.pA[0], B = p.pB[0], dcu = Math.abs(x.cu - U.r2(x.cu)) < 1e-9 ? 2 : 4;
    var en = '<p>La société <b>' + p.nom + '</b> fabrique des ' + A + ' et des ' + B + ' à partir d’une seule matière, ' + p.mat[0] + '. Données du mois (aucun stock en début ni en fin de mois : tout ce qui est acheté est consommé, tout ce qui est produit est vendu) :</p>';
    en += U.ul(['achats : ' + n(p.M) + ' kg ' + p.mat[1] + ' à ' + e2(p.pm) + ' le kg ; consommation : ' + n(p.mA) + ' kg pour les ' + A + ', ' + n(p.mB) + ' kg pour les ' + B + ' ;',
      'main-d’œuvre directe à ' + e(p.th) + ' de l’heure, charges comprises : ' + n(p.hA) + ' heures pour les ' + A + ', ' + n(p.hB) + ' heures pour les ' + B + ' ;',
      'production et ventes : ' + n(p.qA) + ' ' + A + ' vendus ' + e(p.vA) + ' HT l’unité, ' + n(p.qB) + ' ' + B + ' vendus ' + e(p.vB) + ' HT l’unité.']);
    en += '<p>Tableau de répartition des charges indirectes, après répartition secondaire :</p>';
    en += U.tbl(['Centre', 'Total', 'Unité d’œuvre'], [['Approvisionnement', e(x.TA), 'kg de matière achetée'], ['Atelier', e(x.TP), 'heure de main-d’œuvre directe'], ['Distribution', e(x.TD), '100 € de chiffre d’affaires']]);
    en += '<p class="consigne">1. Calculez le coût de l’unité d’œuvre de chaque centre. 2. Calculez le coût d’achat de la matière, le coût de production et le coût de revient de chaque produit. 3. Calculez les résultats analytiques et commentez.</p>';
    var t1 = { tol: 0.01 };
    var qs = [Q('uoa', 'Coût de l’unité d’œuvre Approvisionnement (par kg)', p.uoA, '€', t1), Q('uop', 'Coût de l’unité d’œuvre Atelier (par heure)', p.uoP, '€', t1), Q('uod', 'Coût de l’unité d’œuvre Distribution (pour 100 € de CA)', p.uoD, '€', t1),
      Q('cam', 'Coût d’achat de la matière', x.cam, '€'), Q('cpa', 'Coût de production des ' + A, x.cpA, '€'), Q('cpb', 'Coût de production des ' + B, x.cpB, '€'),
      Q('cra', 'Coût de revient des ' + A, x.crA, '€'), Q('crb', 'Coût de revient des ' + B, x.crB, '€'), Q('raa', 'Résultat analytique des ' + A, x.raA, '€'), Q('rab', 'Résultat analytique des ' + B, x.raB, '€')];
    var uo = U.tbl(['Centre', 'Total', 'Nombre d’UO', 'Coût de l’UO'], [['Approvisionnement', e(x.TA), n(p.M) + ' kg', e2(p.uoA)], ['Atelier', e(x.TP), n(p.hA + p.hB) + ' h (' + n(p.hA) + ' + ' + n(p.hB) + ')', e2(p.uoP)], ['Distribution', e(x.TD), n(x.nbD, 2) + ' (' + n(U.r2(x.caA + x.caB)) + ' ÷ 100)', e2(p.uoD)]]);
    var ach = U.tbl(['Coût d’achat de la matière', 'Quantité', 'Coût unitaire', 'Montant'], [['Prix d’achat', n(p.M), n(p.pm, 2), n(U.r2(p.M * p.pm), 2)], ['Centre Approvisionnement', n(p.M), n(p.uoA, 2), n(x.TA, 2)], { cls: 'tot', cells: ['Coût d’achat', n(p.M), n(x.cu, dcu), n(x.cam, 2)] }]);
    var prod = U.tbl(['Coût de production', A, B], [['Matière consommée', n(p.mA) + ' × ' + n(x.cu, dcu) + ' = ' + n(x.matA, 2), n(p.mB) + ' × ' + n(x.cu, dcu) + ' = ' + n(x.matB, 2)], ['Main-d’œuvre directe', n(p.hA) + ' × ' + n(p.th) + ' = ' + n(x.modA, 2), n(p.hB) + ' × ' + n(p.th) + ' = ' + n(x.modB, 2)], ['Centre Atelier', n(p.hA) + ' × ' + n(p.uoP, 2) + ' = ' + n(x.atA, 2), n(p.hB) + ' × ' + n(p.uoP, 2) + ' = ' + n(x.atB, 2)], { cls: 'tot', cells: ['Coût de production', n(x.cpA, 2) + ' (' + n(x.cpA / p.qA, 2) + ' par unité)', n(x.cpB, 2) + ' (' + n(x.cpB / p.qB, 2) + ' par unité)'] }]);
    var rev = U.tbl(['Coût de revient et résultat', A, B], [['Coût de production', n(x.cpA, 2), n(x.cpB, 2)], ['Centre Distribution', n(x.caA / 100, 2) + ' × ' + n(p.uoD, 2) + ' = ' + n(x.diA, 2), n(x.caB / 100, 2) + ' × ' + n(p.uoD, 2) + ' = ' + n(x.diB, 2)], { cls: 'tot', cells: ['Coût de revient', n(x.crA, 2), n(x.crB, 2)] }, ['Chiffre d’affaires', n(p.qA) + ' × ' + n(p.vA) + ' = ' + n(x.caA, 2), n(p.qB) + ' × ' + n(p.vB) + ' = ' + n(x.caB, 2)], { cls: 'tot', cells: ['Résultat analytique', n(x.raA, 2), n(x.raB, 2)] }]);
    var tA = x.raA / x.caA, tB = x.raB / x.caB, com = [];
    com.push('Le résultat analytique global atteint ' + e(x.ra) + '. Les ' + A + ' ' + (x.raA >= 0 ? 'dégagent ' + e(x.raA) + ', soit ' + U.pc(tA, 1) + ' de leur chiffre d’affaires' : 'perdent ' + e(-x.raA)) + ', les ' + B + ' ' + (x.raB >= 0 ? 'dégagent ' + e(x.raB) + ', soit ' + U.pc(tB, 1) + ' de leur chiffre d’affaires.' : 'perdent ' + e(-x.raB) + '.'));
    if (x.raA < 0 || x.raB < 0) com.push('Un résultat négatif en coût complet ne suffit pas à justifier l’abandon du produit : le coût complet contient des charges indirectes, en partie fixes, qui resteraient à couvrir par l’autre produit. Il faut d’abord vérifier si le produit dégage une marge sur coût variable positive ; si oui, il contribue à couvrir les charges fixes et son abandon dégraderait le résultat global. Les pistes sont plutôt un relèvement du prix, la baisse de la consommation de matière ou d’heures, ou la renégociation des achats.');
    else com.push('Les deux produits sont rentables ; ' + (tA > tB ? 'les ' + A : 'les ' + B) + ' le sont davantage, ce qui peut orienter l’effort commercial, sous réserve de la capacité de production.');
    com.push('Ces coûts dépendent du choix des unités d’œuvre : l’heure de main-d’œuvre répartit les charges de l’atelier au prorata du temps passé, ce qui pénalise le produit le plus long à fabriquer. La méthode ABC, qui répartit les charges par activités et inducteurs de coût, donne une image plus fidèle quand les charges indirectes pèsent lourd.');
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Coût des unités d’œuvre', html: uo }, { h: 'Coût d’achat', html: ach }, { h: 'Coût de production', html: prod }, { h: 'Coût de revient et résultat analytique', html: rev }], comment: com.join(' ') };
  }
};

/* ---------- Coûts partiels : coût variable par produit et imputation rationnelle ---------- */
var GAMMES = [
  { act: 'du mobilier de jardin', p: [['tables', 'table'], ['chaises', 'chaise'], ['parasols', 'parasol']] },
  { act: 'des vélos', p: [['vélos de ville', 'vélo de ville'], ['vélos tout-terrain', 'VTT'], ['vélos électriques', 'vélo électrique']] },
  { act: 'des articles de cuisine', p: [['poêles', 'poêle'], ['casseroles', 'casserole'], ['autocuiseurs', 'autocuiseur']] },
  { act: 'des luminaires', p: [['lampes de bureau', 'lampe'], ['suspensions', 'suspension'], ['lampadaires', 'lampadaire']] },
  { act: 'des fenêtres', p: [['fenêtres PVC', 'fenêtre PVC'], ['fenêtres aluminium', 'fenêtre aluminium'], ['baies coulissantes', 'baie']] }
];
function genGamme(r, opt) {
  var g = r.pick(GAMMES), pr = [];
  for (var i = 0; i < 3; i++) {
    var p = r.int(3, 90) * 10, q = r.int(4, 60) * 100;
    var tx = r.int(opt && opt[i] !== undefined ? opt[i][0] : 25, opt && opt[i] !== undefined ? opt[i][1] : 55) / 100;
    var dist = r.pick([0.04, 0.05, 0.06, 0.08]);
    var cvp = U.r2(p * (1 - tx - dist));
    pr.push({ nom: g.p[i], p: p, q: q, cvp: cvp, dist: dist });
  }
  return { act: g.act, pr: pr };
}
function mcvProduits(pr) {
  return pr.map(function (o) {
    var CA = U.r2(o.p * o.q), CVP = U.r2(o.cvp * o.q), CVD = U.r2(CA * o.dist), CV = U.r2(CVP + CVD), MCV = U.r2(CA - CV);
    return { CA: CA, CVP: CVP, CVD: CVD, CV: CV, MCV: MCV, tx: MCV / CA, mcvu: MCV / o.q };
  });
}

T.couts_partiels = {
  id: 'couts_partiels', nom: 'Coûts partiels : coût variable et imputation rationnelle', famille: 'Comptabilité de gestion', ctrl: false, minutes: 20,
  fiche: {
    objectif: 'Calculer la marge sur coût variable de chaque produit pour juger de sa contribution, puis neutraliser l’effet du niveau d’activité sur les coûts par l’imputation rationnelle des charges fixes.',
    cours: [
      { t: 'Coût complet et coûts partiels', l: [
        'Coût complet : il incorpore toutes les charges, y compris les charges indirectes réparties entre les produits par des clés plus ou moins arbitraires ; son coût unitaire varie avec le volume produit, car les charges fixes sont réparties sur plus ou moins d’unités.',
        'Coût partiel : il ne retient qu’une partie des charges, choisie selon un critère pertinent pour la décision (variabilité, rattachement direct, niveau d’activité).',
        'Coût variable (direct costing simple) : charges qui varient avec l’activité (matières, main-d’œuvre payée à la pièce, commissions, transport sur ventes) ; les charges fixes sont traitées globalement.',
        'Coût spécifique (direct costing évolué) : coût variable + charges fixes directement rattachables au produit (voir la fiche « Méthode des coûts spécifiques »).',
        'Coût marginal : coût de la dernière unité ou de la dernière série produite (voir la fiche « Commande spéciale et coût marginal »).',
        'Imputation rationnelle : les charges fixes sont incorporées aux coûts en proportion du niveau d’activité réel par rapport à l’activité normale.'
      ] },
      { t: 'Imputation rationnelle des charges fixes', l: [
        'Coefficient d’imputation rationnelle = activité réelle ÷ activité normale.',
        'Charges fixes imputées = charges fixes réelles × coefficient.',
        'Coefficient < 1 : une partie des charges fixes n’est pas imputée, c’est le coût de la sous-activité (coût du chômage), qui est une charge de la période et non du produit.',
        'Coefficient > 1 : on impute plus que les charges réelles, c’est un boni de suractivité.',
        'Intérêt : le coût unitaire ne dépend plus du niveau d’activité ; il sert de base stable pour fixer les prix et pour évaluer les stocks (le PCG impose d’exclure la sous-activité du coût de production des stocks).'
      ] }
    ],
    etapes: [
      'Pour chaque produit : CA = quantité × prix ; coût variable = coût variable de production + coût variable de distribution.',
      'Marge sur coût variable (MCV) = CA − coût variable ; taux de MCV = MCV ÷ CA ; MCV unitaire = MCV ÷ quantité.',
      'Résultat global = somme des MCV − charges fixes (non réparties).',
      'Imputation rationnelle : coefficient = activité réelle ÷ activité normale ; charges fixes imputées = charges fixes × coefficient.',
      'Écart d’imputation = charges fixes imputées − charges fixes réelles : négatif, coût de sous-activité ; positif, boni de suractivité.',
      'Coût unitaire rationnel = coût variable unitaire + charges fixes imputées ÷ quantité produite (= coût variable unitaire + charges fixes ÷ activité normale).'
    ],
    pieges: [
      'Répartir les charges fixes entre produits en direct costing simple : elles sont couvertes globalement par la somme des MCV.',
      'Oublier les charges variables de distribution (commissions, emballages, transport sur ventes) dans le coût variable.',
      'Abandonner un produit à MCV positive : il contribue à la couverture des charges fixes, qui resteraient à la charge des autres produits.',
      'Inverser le coefficient (activité normale ÷ activité réelle).',
      'Incorporer le coût de sous-activité au coût des produits ou à la valeur des stocks.'
    ],
    comptes: []
  },
  gen: function (r) {
    for (var t = 0; t < 100; t++) {
      var g = genGamme(r), m = mcvProduits(g.pr), MCV = m.reduce(function (a, o) { return a + o.MCV; }, 0);
      var CF = U.r0(MCV * r.int(60, 105) / 100 / 1000) * 1000;
      var AN = r.int(10, 60) * 100, coef = r.pick([0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.05, 1.1, 1.15]);
      var AR = U.r0(AN * coef / 10) * 10;
      if (AR === AN || CF <= 0) continue;
      return { nom: U.nom(r), act: g.act, pr: g.pr, CF: CF, at: { cvu: r.int(15, 120), F: r.int(20, 200) * 1000, AN: AN, AR: AR, prod: g.pr[0].nom } };
    }
  },
  calc: function (p) {
    var m = mcvProduits(p.pr), tot = { CA: 0, CV: 0, MCV: 0 };
    m.forEach(function (o) { tot.CA = U.r2(tot.CA + o.CA); tot.CV = U.r2(tot.CV + o.CV); tot.MCV = U.r2(tot.MCV + o.MCV); });
    var R = U.r2(tot.MCV - p.CF), a = p.at;
    var coef = a.AR / a.AN, FI = U.r2(a.F * coef), ecart = U.r2(FI - a.F);
    var cuComplet = U.r2(a.cvu + a.F / a.AR), cuRat = U.r2(a.cvu + FI / a.AR);
    return { m: m, tot: tot, R: R, tx: tot.MCV / tot.CA, coef: coef, FI: FI, ecart: ecart, cuComplet: cuComplet, cuRat: cuRat };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n, a = p.at;
    var en = '<p>La société <b>' + p.nom + '</b> fabrique et vend ' + p.act + '. Données de l’exercice N :</p>';
    en += U.tbl(['', p.pr[0].nom[0], p.pr[1].nom[0], p.pr[2].nom[0]], [['Quantités vendues'].concat(p.pr.map(function (o) { return n(o.q); })), ['Prix de vente unitaire HT'].concat(p.pr.map(function (o) { return U.e2(o.p); })), ['Coût variable unitaire de production'].concat(p.pr.map(function (o) { return U.e2(o.cvp); })), ['Charges variables de distribution (% du CA)'].concat(p.pr.map(function (o) { return U.pcs(o.dist); }))]);
    en += '<p>Les charges fixes de l’entreprise s’élèvent à ' + e(p.CF) + ' ; elles ne sont pas réparties entre les produits.</p>';
    en += '<p>Par ailleurs, l’atelier de montage des ' + a.prod[0] + ' supporte ' + e(a.F) + ' de charges fixes par an. Son activité normale est de ' + n(a.AN) + ' ' + a.prod[0] + ' ; il en a produit ' + n(a.AR) + ' en N. Le coût variable unitaire de production y est de ' + e(a.cvu) + '.</p>';
    en += '<p class="consigne">1. Présentez le compte de résultat par variabilité de chaque produit et le résultat global ; commentez la contribution de chaque produit. 2. Calculez le coefficient d’imputation rationnelle, les charges fixes imputées et l’écart d’imputation de l’atelier. 3. Comparez le coût unitaire de production complet et le coût unitaire rationnel.</p>';
    var qs = p.pr.map(function (o, i) { return Q('m' + i, 'Marge sur coût variable – ' + o.nom[0], x.m[i].MCV, '€'); });
    qs.push(Q('tx', 'Taux de marge sur coût variable global', U.rd(x.tx * 100, 2), '%', { tol: 0.06 }), Q('res', 'Résultat global', x.R, '€'),
      Q('coef', 'Coefficient d’imputation rationnelle', U.rd(x.coef, 4), 'coef', { tol: 0.006 }), Q('fi', 'Charges fixes imputées', x.FI, '€'),
      Q('ec', 'Écart d’imputation (− coût de sous-activité, + boni de suractivité)', x.ecart, '€'), Q('cuc', 'Coût unitaire de production complet', x.cuComplet, '€', { tol: 0.01 }), Q('cur', 'Coût unitaire de production rationnel', x.cuRat, '€', { tol: 0.01 }));
    var rows = [['Chiffre d’affaires'].concat(x.m.map(function (o) { return n(o.CA, 2); }), [n(x.tot.CA, 2)]),
      ['− Coût variable de production'].concat(x.m.map(function (o) { return n(o.CVP, 2); }), [n(U.r2(x.m.reduce(function (s, o) { return s + o.CVP; }, 0)), 2)]),
      ['− Coût variable de distribution'].concat(x.m.map(function (o) { return n(o.CVD, 2); }), [n(U.r2(x.m.reduce(function (s, o) { return s + o.CVD; }, 0)), 2)]),
      { cls: 'tot', cells: ['= Marge sur coût variable'].concat(x.m.map(function (o) { return n(o.MCV, 2); }), [n(x.tot.MCV, 2)]) },
      ['Taux de MCV'].concat(x.m.map(function (o) { return U.pc(o.tx, 1); }), [U.pc(x.tx, 1)]),
      ['− Charges fixes', '', '', '', n(p.CF, 2)], { cls: 'tot', cells: ['= Résultat', '', '', '', n(x.R, 2)] }];
    var crd = U.tbl(['', p.pr[0].nom[0], p.pr[1].nom[0], p.pr[2].nom[0], 'Total'], rows);
    var sous = x.ecart < 0;
    var c = [['Coefficient d’imputation rationnelle', n(a.AR) + ' ÷ ' + n(a.AN), n(x.coef, 4)], ['Charges fixes imputées', n(a.F) + ' × ' + n(x.coef, 4), e(x.FI)],
      ['Écart d’imputation', n(x.FI) + ' − ' + n(a.F), '<b>' + (sous ? 'coût de sous-activité ' : 'boni de suractivité ') + e(Math.abs(x.ecart)) + '</b>'],
      ['Coût unitaire complet', n(a.cvu) + ' + ' + n(a.F) + ' ÷ ' + n(a.AR), e(x.cuComplet)], ['Coût unitaire rationnel', n(a.cvu) + ' + ' + n(x.FI) + ' ÷ ' + n(a.AR) + ' (= ' + n(a.cvu) + ' + ' + n(a.F) + ' ÷ ' + n(a.AN) + ')', e(x.cuRat)]];
    var best = 0, worst = 0;
    x.m.forEach(function (o, i) { if (o.tx > x.m[best].tx) best = i; if (o.tx < x.m[worst].tx) worst = i; });
    var com = 'Le direct costing simple ne retient que les charges variables : chaque produit dégage une marge sur coût variable qui contribue à couvrir les ' + e(p.CF) + ' de charges fixes, traitées globalement. Les ' + p.pr[best].nom[0] + ' sont les plus contributifs (taux de MCV de ' + U.pc(x.m[best].tx, 1) + '), les ' + p.pr[worst].nom[0] + ' les moins (' + U.pc(x.m[worst].tx, 1) + ') ; tous ayant une marge positive, aucun ne doit être abandonné à court terme, car sa marge disparaîtrait alors que les charges fixes resteraient. ' + (x.R >= 0 ? 'Le résultat global est un bénéfice de ' + e(x.R) + '.' : 'La somme des marges ne couvre pas les charges fixes : la perte de ' + e(-x.R) + ' appelle une action sur les prix, les volumes ou les charges fixes.') + ' ';
    com += 'Dans l’atelier, l’activité réelle représente ' + U.pc(x.coef, 1) + ' de l’activité normale. ' + (sous ? 'En coût complet, les charges fixes sont réparties sur moins d’unités et le coût unitaire gonfle (' + U.e2(x.cuComplet) + ') : le produit supporterait le coût d’une capacité inemployée. L’imputation rationnelle ramène le coût à ' + U.e2(x.cuRat) + ' et isole un coût de sous-activité de ' + e(-x.ecart) + ', charge de la période imputable à la gestion de la capacité, qui ne doit pas être incorporée à la valeur des stocks.' : 'En coût complet, les charges fixes sont réparties sur plus d’unités et le coût unitaire baisse (' + U.e2(x.cuComplet) + '). L’imputation rationnelle retient un coût stable de ' + U.e2(x.cuRat) + ' et fait apparaître un boni de suractivité de ' + e(x.ecart) + ', gain lié à une meilleure utilisation des capacités.') + ' Le coût rationnel, indépendant des fluctuations d’activité, est une base plus fiable pour fixer les prix.';
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Compte de résultat par variabilité', html: crd }, { h: 'Imputation rationnelle', html: U.calc(c) }], comment: com };
  }
};

/* ---------- Méthode des coûts spécifiques (direct costing évolué) ---------- */
T.couts_specifiques = {
  id: 'couts_specifiques', nom: 'Méthode des coûts spécifiques', famille: 'Comptabilité de gestion', ctrl: false, minutes: 20,
  fiche: {
    objectif: 'Calculer la marge sur coût spécifique de chaque produit, la comparer au résultat en coût complet et décider du maintien ou de l’abandon d’un produit.',
    cours: [
      { t: 'Principe', l: [
        'Coût spécifique (ou coût direct) : coût variable du produit + charges fixes qui lui sont propres et disparaîtraient avec lui (amortissement d’une machine dédiée, salaire du chef de produit, publicité spécifique, loyer d’un atelier réservé).',
        'Charges fixes communes : charges qui subsistent quel que soit le portefeuille de produits (direction, siège, comptabilité) ; elles ne sont pas réparties.',
        'Marge sur coût spécifique (MCS) = marge sur coût variable − charges fixes spécifiques : c’est la contribution du produit à la couverture des charges communes.',
        'Résultat global = somme des MCS − charges fixes communes.'
      ] },
      { t: 'Décision de maintien ou d’abandon', l: [
        'MCS positive : le produit couvre ses charges propres et contribue aux charges communes ; l’abandonner ferait baisser le résultat du montant de sa MCS, même s’il paraît déficitaire en coût complet.',
        'MCS négative : le produit ne couvre même pas ses charges propres ; son abandon améliore le résultat du montant de sa MCS (sous réserve des effets commerciaux : produit d’appel, gamme complète, clientèle commune).',
        'Piège du coût complet : la répartition des charges communes (au prorata du CA par exemple) peut faire apparaître une perte sur un produit qui est pourtant rentable au sens de la MCS.',
        'Limites : distinction parfois délicate entre charges spécifiques et communes, raisonnement de court terme.'
      ] }
    ],
    etapes: [
      'Pour chaque produit : CA, coût variable, marge sur coût variable (MCV).',
      'Retrancher les charges fixes spécifiques : marge sur coût spécifique (MCS).',
      'Résultat global = Σ MCS − charges fixes communes.',
      'Si demandé, résultat en coût complet par produit : MCS − quote-part des charges communes (clé de répartition indiquée).',
      'Abandon d’un produit : nouveau résultat = résultat global − MCS du produit (sa MCV et ses charges spécifiques disparaissent, les charges communes demeurent).',
      'Conclure : maintien si MCS > 0, abandon envisageable si MCS < 0, en nuançant par les effets commerciaux.'
    ],
    pieges: [
      'Répartir les charges communes avant de décider : la décision se fonde sur la MCS, pas sur le résultat en coût complet.',
      'Supprimer les charges communes en même temps que le produit abandonné : elles subsistent.',
      'Classer en charges spécifiques des charges qui ne disparaîtraient pas avec le produit.',
      'Confondre MCV (direct costing simple) et MCS (direct costing évolué).'
    ],
    comptes: []
  },
  gen: function (r) {
    for (var t = 0; t < 300; t++) {
      var g = genGamme(r), m = mcvProduits(g.pr), X = r.int(0, 2), garder = r.chance(0.6);
      var CFS = m.map(function (o, i) { return U.r0(o.MCV * (i === X ? (garder ? r.int(55, 85) : r.int(110, 140)) : r.int(25, 55)) / 100 / 100) * 100; });
      var MCS = m.map(function (o, i) { return o.MCV - CFS[i]; }), sMCS = MCS.reduce(function (a, b) { return a + b; }, 0);
      var CFC = U.r0(sMCS * r.int(50, 85) / 100 / 1000) * 1000;
      var p = { nom: U.nom(r), act: g.act, pr: g.pr, CFS: CFS, CFC: CFC, X: X };
      var c = this.calc(p);
      if (CFC <= 0 || c.R <= 0) continue;
      if (garder ? !(c.MCS[X] > 0 && c.RC[X] < 0) : !(c.MCS[X] < 0)) continue;
      return p;
    }
  },
  calc: function (p) {
    var m = mcvProduits(p.pr), MCS = m.map(function (o, i) { return U.r2(o.MCV - p.CFS[i]); });
    var CA = U.r2(m.reduce(function (a, o) { return a + o.CA; }, 0)), sMCS = U.r2(MCS.reduce(function (a, b) { return a + b; }, 0));
    var R = U.r2(sMCS - p.CFC);
    var QP = m.map(function (o) { return U.r2(p.CFC * o.CA / CA); });
    QP[2] = U.r2(p.CFC - QP[0] - QP[1]);
    var RC = MCS.map(function (v, i) { return U.r2(v - QP[i]); });
    return { m: m, MCS: MCS, CA: CA, sMCS: sMCS, R: R, QP: QP, RC: RC, Rab: U.r2(R - MCS[p.X]) };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n, X = p.pr[p.X].nom[0];
    var en = '<p>La société <b>' + p.nom + '</b> fabrique et vend ' + p.act + '. Données de l’exercice N :</p>';
    en += U.tbl(['', p.pr[0].nom[0], p.pr[1].nom[0], p.pr[2].nom[0]], [['Quantités vendues'].concat(p.pr.map(function (o) { return n(o.q); })), ['Prix de vente unitaire HT'].concat(p.pr.map(function (o) { return U.e2(o.p); })), ['Coût variable unitaire de production'].concat(p.pr.map(function (o) { return U.e2(o.cvp); })), ['Charges variables de distribution (% du CA)'].concat(p.pr.map(function (o) { return U.pcs(o.dist); })), ['Charges fixes spécifiques'].concat(p.CFS.map(function (v) { return e(v); }))]);
    en += '<p>Les charges fixes communes (direction, administration) s’élèvent à ' + e(p.CFC) + '. Le contrôleur de gestion les répartit habituellement au prorata du chiffre d’affaires ; en coût complet, les ' + X + ' apparaissent ' + (x.RC[p.X] < 0 ? 'déficitaires' : 'peu rentables') + ' et la direction envisage d’en arrêter la production. Les charges spécifiques disparaîtraient avec le produit.</p>';
    en += '<p class="consigne">1. Présentez le tableau de résultat selon la méthode des coûts spécifiques. 2. Calculez le résultat de chaque produit en coût complet. 3. Faut-il abandonner les ' + X + ' ? Chiffrez le résultat global après abandon.</p>';
    var qs = p.pr.map(function (o, i) { return Q('s' + i, 'Marge sur coût spécifique – ' + o.nom[0], x.MCS[i], '€'); });
    qs.push(Q('res', 'Résultat global', x.R, '€'), Q('rc', 'Résultat des ' + X + ' en coût complet', x.RC[p.X], '€'), Q('rab', 'Résultat global après abandon des ' + X, x.Rab, '€'),
      QC('dec', 'Décision', ['Maintenir les ' + X, 'Abandonner les ' + X], x.MCS[p.X] > 0 ? 0 : 1));
    var col = function (f) { return x.m.map(f); };
    var rows = [['Chiffre d’affaires'].concat(col(function (o) { return n(o.CA, 2); }), [n(x.CA, 2)]), ['− Coût variable'].concat(col(function (o) { return n(o.CV, 2); }), [n(U.r2(x.m.reduce(function (s, o) { return s + o.CV; }, 0)), 2)]),
      { cls: 'tot', cells: ['= Marge sur coût variable'].concat(col(function (o) { return n(o.MCV, 2); }), [n(U.r2(x.m.reduce(function (s, o) { return s + o.MCV; }, 0)), 2)]) },
      ['− Charges fixes spécifiques'].concat(p.CFS.map(function (v) { return n(v, 2); }), [n(p.CFS.reduce(function (a, b) { return a + b; }, 0), 2)]),
      { cls: 'tot', cells: ['= Marge sur coût spécifique'].concat(x.MCS.map(function (v) { return n(v, 2); }), [n(x.sMCS, 2)]) },
      ['− Charges fixes communes', '', '', '', n(p.CFC, 2)], { cls: 'tot', cells: ['= Résultat', '', '', '', n(x.R, 2)] }];
    var tab = U.tbl(['', p.pr[0].nom[0], p.pr[1].nom[0], p.pr[2].nom[0], 'Total'], rows);
    var cc = U.tbl(['', p.pr[0].nom[0], p.pr[1].nom[0], p.pr[2].nom[0], 'Total'], [['Marge sur coût spécifique'].concat(x.MCS.map(function (v) { return n(v, 2); }), [n(x.sMCS, 2)]), ['− Charges communes (prorata du CA)'].concat(x.QP.map(function (v) { return n(v, 2); }), [n(p.CFC, 2)]), { cls: 'tot', cells: ['= Résultat en coût complet'].concat(x.RC.map(function (v) { return n(v, 2); }), [n(x.R, 2)]) }]);
    var c = [['Résultat actuel', 'Σ MCS − charges communes', e(x.R)], ['Abandon des ' + X, n(x.R) + ' − (' + n(x.MCS[p.X]) + ')', '<b>' + e(x.Rab) + '</b>'], ['Variation du résultat', 'perte de la MCS des ' + X, e(U.r2(x.Rab - x.R))]];
    var garder = x.MCS[p.X] > 0;
    var com = 'La méthode des coûts spécifiques ne retient, pour chaque produit, que les charges qu’il génère : son coût variable et ses charges fixes propres. Les charges communes, qui subsisteraient quel que soit le portefeuille de produits, ne sont pas réparties. ' + (garder
      ? 'En coût complet, les ' + X + ' affichent une perte de ' + e(-x.RC[p.X]) + ', mais elle résulte de la quote-part de charges communes qui leur est attribuée. Leur marge sur coût spécifique est positive (' + e(x.MCS[p.X]) + ') : ils couvrent leurs charges propres et contribuent à la couverture des charges communes. Les abandonner ferait tomber le résultat global de ' + e(x.R) + ' à ' + e(x.Rab) + ', car les charges communes resteraient à la charge des autres produits. Il faut donc les maintenir, et chercher plutôt à améliorer leur marge (prix, coûts variables, charges spécifiques).'
      : 'La marge sur coût spécifique des ' + X + ' est négative (' + e(x.MCS[p.X]) + ') : ils ne couvrent même pas leurs charges propres et détruisent du résultat. Leur abandon porterait le résultat global de ' + e(x.R) + ' à ' + e(x.Rab) + '. Avant de décider, l’entreprise doit vérifier que l’arrêt n’entraîne pas la perte de clients communs aux autres produits (produit d’appel, gamme complète) et qu’une relance (hausse de prix, baisse des charges spécifiques) est impossible.') + ' La décision se fonde sur la marge sur coût spécifique, et non sur le résultat en coût complet, qui dépend d’une clé de répartition arbitraire.';
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Tableau des marges sur coût spécifique', html: tab }, { h: 'Résultat en coût complet (pour comparaison)', html: cc }, { h: 'Incidence de l’abandon', html: U.calc(c) }], comment: com };
  }
};
