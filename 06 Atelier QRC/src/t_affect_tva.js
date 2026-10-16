/* ===== Affectation du résultat, TVA ===== */
function Q(id, label, ans, unit, extra) {
  var q = { id: id, label: label, ans: unit === '€' ? U.r2(ans) : ans, unit: unit || '' };
  if (extra) for (var k in extra) q[k] = extra[k];
  return q;
}
function QC(id, label, options, ans) { return { id: id, label: label, kind: 'choice', options: options, ans: ans }; }

/* ---------- 1. Affectation du résultat ---------- */
T.affectation = {
  id: 'affectation', nom: 'Affectation du résultat', famille: 'Comptabilité des sociétés', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Répartir le bénéfice entre réserves, dividendes et report à nouveau, dans l’ordre imposé par la loi puis par les statuts.',
    etapes: [
      'Apurer le report à nouveau débiteur (pertes antérieures) avant toute autre affectation.',
      'Réserve légale : 5 % × (bénéfice − pertes antérieures), jusqu’à ce qu’elle atteigne 10 % du capital social. Calcule la marge restante (10 % × capital − réserve existante) et retiens le plus petit des deux montants.',
      'Réserves statutaires : selon les statuts (montant ou pourcentage indiqué).',
      'Bénéfice distribuable = bénéfice − pertes antérieures − réserve légale − réserves statutaires + report à nouveau créditeur.',
      'Intérêt statutaire (premier dividende) = taux × capital libéré (et non capital souscrit).',
      'Réserves facultatives décidées par l’assemblée.',
      'Superdividende par action = reste ÷ nombre d’actions, arrondi comme demandé (toujours à l’inférieur).',
      'Le reliquat va en report à nouveau. Présente le tableau d’affectation (origines = affectations) puis l’écriture.'
    ],
    pieges: [
      'Oublier de déduire le report à nouveau débiteur de la base de la réserve légale.',
      'Doter 5 % alors que la réserve légale est presque pleine : seul le complément jusqu’à 10 % du capital est doté.',
      'Calculer l’intérêt statutaire sur le capital souscrit alors que le capital n’est pas entièrement libéré.',
      'Ajouter le report à nouveau créditeur dans la base de la réserve légale (il n’y entre pas).',
      'Arrondir le dividende au plus proche : on arrondit toujours à l’inférieur, sinon on distribue plus que le distribuable.',
      'Écriture : le 110 ancien est débité (on le reprend), le 110 nouveau est crédité ; les dividendes vont au 457.'
    ],
    comptes: ['120 Résultat (bénéfice)', '110 / 119 Report à nouveau', '1061 Réserve légale', '1063 Réserves statutaires', '1068 Autres réserves', '457 Associés – dividendes à payer']
  },
  gen: function (r) {
    for (var essai = 0; essai < 200; essai++) {
      var v = r.pick([1, 5, 10, 10, 15, 16, 20, 50, 100]);
      var nb = r.int(2, 60) * (v >= 50 ? 200 : 1000);
      var C = v * nb;
      if (C < 30000 || C > 3000000) continue;
      var plaf = C * 0.1;
      var etatRL = r.pick(['loin', 'proche', 'plein', 'loin']);
      var RL0 = etatRL === 'plein' ? plaf : (etatRL === 'proche' ? U.r0(plaf - r.int(1, 20) * plaf / 200) : U.r0(plaf * r.int(2, 7) / 10));
      RL0 = Math.round(RL0 / 10) * 10;
      var R = Math.round(C * r.int(4, 22) / 100 / 50) * 50 + r.int(0, 9) * 5;
      var ranType = r.pick(['crediteur', 'debiteur', 'nul', 'crediteur']);
      var RAN0 = ranType === 'crediteur' ? r.int(1, 40) * Math.max(10, Math.round(C / 20000)) : (ranType === 'debiteur' ? -r.int(2, 30) * Math.round(R / 100) : 0);
      var mode = r.chance(0.7) ? 'super' : 'unique';
      var t = mode === 'super' ? r.pick([0.03, 0.04, 0.05, 0.06]) : 0;
      var lib = mode === 'super' && r.chance(0.2) ? r.pick([0.5, 0.75]) : 1;
      var RS = r.chance(0.3) ? Math.round(R * r.pick([0.05, 0.1]) / 10) * 10 : 0;
      var F = r.chance(0.5) ? Math.round(R * r.int(5, 20) / 100 / 100) * 100 : 0;
      var arr = mode === 'super' ? r.pick([0.5, 0.1, 1, 0.01]) : r.pick([1, 0.5, 0.1]);
      if (v <= 1 && arr >= 0.5) arr = 0.01;
      var p = { nom: U.nom(r), C: C, v: v, lib: lib, RL0: RL0, RAN0: RAN0, R: R, t: t, RS: RS, F: F, arr: arr, mode: mode };
      var s = this.calc(p);
      if (s.reste < 0 || s.SDu < arr - 1e-9 && mode === 'super' || s.divU <= 0) continue;
      if (s.divTot > R * 1.2) continue;
      return p;
    }
    return { nom: 'EXEMPLE', C: 1000000, v: 10, lib: 1, RL0: 60000, RAN0: 1500, R: 110000, t: 0.05, RS: 0, F: 0, arr: 0.5, mode: 'super' };
  },
  calc: function (p) {
    var nb = Math.round(p.C / p.v);
    var pertes = p.RAN0 < 0 ? -p.RAN0 : 0, RANc = p.RAN0 > 0 ? p.RAN0 : 0;
    var baseRL = p.R - pertes, cinq = U.r2(baseRL * 0.05), plaf = U.r2(p.C * 0.1), marge = Math.max(0, U.r2(plaf - p.RL0));
    var RL = Math.min(cinq, marge);
    var BD = U.r2(p.R - pertes - RL - p.RS + RANc);
    var IS = U.r2(p.t * p.C * p.lib), ISu = U.r2(p.t * p.v * p.lib);
    var reste = U.r2(BD - IS - p.F);
    var SDu = U.floorStep(reste / nb, p.arr);
    var SD = U.r2(SDu * nb);
    var divU = U.r2(ISu + SDu), divTot = U.r2(IS + SD);
    var RAN = U.r2(reste - SD);
    return { nb: nb, pertes: pertes, RANc: RANc, baseRL: baseRL, cinq: cinq, plaf: plaf, marge: marge, RL: RL, BD: BD, IS: IS, ISu: ISu, reste: reste, SDu: SDu, SD: SD, divU: divU, divTot: divTot, RAN: RAN, brut: reste / nb };
  },
  solve: function (p) {
    var s = this.calc(p), e = U.e, n = U.n;
    var arrTxt = { 1: 'à l’euro inférieur', 0.5: 'aux 50 centimes d’euro inférieurs', 0.1: 'aux 10 centimes d’euro inférieurs', 0.01: 'au centime inférieur' }[p.arr];
    var en = '<p>La société <b>' + p.nom + '</b> vous communique les informations suivantes pour répartir le bénéfice de l’exercice N.</p>';
    var rows = [['Capital social', e(p.C) + ' (' + n(s.nb) + ' actions de ' + e(p.v) + ')' + (p.lib < 1 ? ', libéré ' + (p.lib === 0.5 ? 'de moitié' : 'des trois quarts') : ', entièrement libéré')], ['Réserve légale avant répartition', e(p.RL0)]];
    if (p.RAN0 > 0) rows.push(['Report à nouveau créditeur', e(p.RAN0)]);
    if (p.RAN0 < 0) rows.push(['Report à nouveau débiteur (perte de N-1)', e(-p.RAN0)]);
    rows.push(['Résultat net de l’exercice N (bénéfice)', e(p.R)]);
    en += U.kv(rows);
    var cons = ['La réserve légale est dotée dans les conditions prévues par la loi.'];
    if (p.RS) cons.push('Les statuts prévoient une dotation à la réserve statutaire de ' + e(p.RS) + '.');
    if (p.mode === 'super') cons.push('Les statuts prévoient un intérêt statutaire (premier dividende) de ' + U.pcs(p.t) + ' du capital libéré.');
    if (p.F) cons.push('L’assemblée générale décide de doter une réserve facultative de ' + e(p.F) + '.');
    cons.push(p.mode === 'super' ? 'Elle attribue ensuite aux actions un superdividende arrondi ' + arrTxt + '. Le solde est porté en report à nouveau.' : 'Elle attribue aux actions un dividende unitaire maximum arrondi ' + arrTxt + '. Le solde est porté en report à nouveau.');
    en += U.ul(cons);
    en += '<p class="consigne">1. Présentez les calculs et le tableau d’affectation du résultat de N. 2. Passez l’écriture d’affectation (AGO du ' + (p.dateAG || '15/05/N+1') + ').</p>';

    var qs = [Q('rl', 'Dotation à la réserve légale', s.RL, '€'), Q('bd', 'Bénéfice distribuable', s.BD, '€')];
    if (p.mode === 'super') qs.push(Q('is', 'Intérêt statutaire total', s.IS, '€'));
    qs.push(Q('du', 'Dividende total par action', s.divU, '€', { tol: 0.005 }));
    qs.push(Q('dt', 'Montant total des dividendes', s.divTot, '€'));
    qs.push(Q('ran', 'Nouveau report à nouveau', s.RAN, '€'));

    var c = [];
    if (s.pertes) c.push(['Apurement des pertes', 'report à nouveau débiteur', e(s.pertes)]);
    c.push(['Réserve légale', '5 % × ' + (s.pertes ? '(' + n(p.R) + ' − ' + n(s.pertes) + ')' : n(p.R)) + ' = ' + n(s.cinq) + ' ; plafond 10 % × ' + n(p.C) + ' = ' + n(s.plaf) + ', déjà ' + n(p.RL0) + ', marge ' + n(s.marge), '<b>' + e(s.RL) + '</b>']);
    if (p.RS) c.push(['Réserve statutaire', 'statuts', e(p.RS)]);
    c.push(['Bénéfice distribuable', n(p.R) + (s.pertes ? ' − ' + n(s.pertes) : '') + ' − ' + n(s.RL) + (p.RS ? ' − ' + n(p.RS) : '') + (s.RANc ? ' + ' + n(s.RANc) : ''), '<b>' + e(s.BD) + '</b>']);
    if (p.mode === 'super') c.push(['Intérêt statutaire', U.pcs(p.t) + ' × ' + n(p.C) + (p.lib < 1 ? ' × ' + n(p.lib, 2) : '') + ' (soit ' + U.e2(s.ISu) + ' par action)', e(s.IS)]);
    if (p.F) c.push(['Réserve facultative', 'décision de l’AG', e(p.F)]);
    c.push([p.mode === 'super' ? 'Superdividende' : 'Dividende', n(s.reste) + ' ÷ ' + n(s.nb) + ' = ' + n(s.brut, 4) + ' → arrondi ' + U.e2(s.SDu) + ' × ' + n(s.nb), e(s.SD)]);
    c.push(['Report à nouveau', n(s.reste) + ' − ' + n(s.SD), '<b>' + e(s.RAN) + '</b>']);

    var orig = [], aff = [];
    if (p.RAN0 > 0) orig.push(['Report à nouveau antérieur', e(p.RAN0)]);
    if (p.RAN0 < 0) orig.push(['Report à nouveau débiteur', '− ' + e(-p.RAN0)]);
    orig.push(['Résultat de l’exercice N', e(p.R)]);
    if (s.RL) aff.push(['Réserve légale', e(s.RL)]);
    if (p.RS) aff.push(['Réserve statutaire', e(p.RS)]);
    if (p.F) aff.push(['Réserve facultative', e(p.F)]);
    if (p.mode === 'super') { aff.push(['Intérêt statutaire', e(s.IS)]); aff.push(['Superdividende', e(s.SD)]); }
    else aff.push(['Dividendes', e(s.SD)]);
    aff.push(['Report à nouveau', e(s.RAN)]);
    var tot = U.r2(p.R + p.RAN0);
    var nr = Math.max(orig.length, aff.length), trows = [];
    for (var i = 0; i < nr; i++) trows.push([(orig[i] || ['', ''])[0], (orig[i] || ['', ''])[1], (aff[i] || ['', ''])[0], (aff[i] || ['', ''])[1]]);
    trows.push({ cls: 'tot', cells: ['Total', e(tot), 'Total', e(U.r2(s.RL + p.RS + p.F + s.divTot + s.RAN))] });

    var L = U.L, lines = [L('120', p.R, 0)];
    if (p.RAN0 > 0) lines.push(L('110', p.RAN0, 0, { lib: 'Report à nouveau (ancien solde)' }));
    if (p.RAN0 < 0) lines.push(L('119', 0, -p.RAN0, { lib: 'Report à nouveau débiteur (apurement)' }));
    lines.push(L('1061', 0, s.RL), L('1063', 0, p.RS), L('1068', 0, p.F), L('457', 0, s.divTot), L('110', 0, s.RAN, { lib: 'Report à nouveau (nouveau solde)' }));
    var journal = [U.entry(p.dateAG || '15/05/N+1', 'Affectation du résultat de N', lines)];

    var taux = s.divTot / p.R, mis = U.r2(s.RL + p.RS + p.F + s.RAN - s.RANc);
    var com = [];
    com.push('Le bénéfice de ' + e(p.R) + ' est d’abord affecté aux obligations légales' + (s.pertes ? ' : les pertes antérieures (' + e(s.pertes) + ') sont apurées en priorité, car on ne peut distribuer tant qu’elles ne sont pas absorbées' : '') + '.');
    com.push(s.RL === 0 ? 'La réserve légale a déjà atteint son plafond de 10 % du capital : aucune dotation n’est obligatoire.' : (s.RL < s.cinq ? 'La réserve légale ne reçoit que ' + e(s.RL) + ', le complément qui lui permet d’atteindre son plafond de ' + e(s.plaf) + ' : elle n’aura plus à être dotée tant que le capital ne change pas.' : 'La réserve légale reçoit ' + e(s.RL) + ' et atteint ' + e(U.r2(p.RL0 + s.RL)) + ', encore sous son plafond de ' + e(s.plaf) + ' : la dotation de 5 % se poursuivra les années suivantes.'));
    com.push('Les actionnaires reçoivent ' + U.e2(s.divU) + ' par action, soit ' + e(s.divTot) + ' : le taux de distribution atteint ' + U.pc(taux, 1) + ' du bénéfice. ' + (taux > 0.8 ? 'C’est une politique très généreuse, qui laisse peu de ressources pour l’autofinancement.' : (taux < 0.4 ? 'La société privilégie l’autofinancement, ce qui renforce ses capitaux propres et son fonds de roulement.' : 'La société équilibre la rémunération des associés et le renforcement de ses capitaux propres.')));
    com.push('L’arrondi à l’inférieur laisse ' + e(s.RAN) + ' en report à nouveau ; cette somme restera disponible pour une distribution ou une mise en réserve lors de la prochaine assemblée.');
    com.push('Les dividendes, inscrits au crédit du compte 457, constituent une dette envers les associés ; ils doivent être mis en paiement dans les neuf mois qui suivent la clôture (D 457 / C 512 lors du versement).');
    com.push('Au total, ' + e(mis) + ' restent dans l’entreprise (réserves et report à nouveau) et améliorent sa solvabilité.');

    return {
      enonce: en, questions: qs, journal: journal,
      steps: [{ h: 'Calculs', html: U.calc(c) }, { h: 'Tableau d’affectation', html: U.tbl(['Origines', '', 'Affectations', ''], trows, 'aff') }],
      comment: com.join(' ')
    };
  }
};

/* ---------- 2. Déclaration de TVA (CA3) ---------- */
T.tva_ca3 = {
  id: 'tva_ca3', nom: 'TVA : déclaration mensuelle (CA3)', famille: 'TVA', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Calculer la TVA due au titre d’un mois (régime réel normal) et passer les écritures de liquidation et de paiement.',
    etapes: [
      'TVA brute = TVA collectée (ventes du mois ; prestations encaissées) + TVA due intracommunautaire (autoliquidation des acquisitions dans l’UE).',
      'TVA déductible = TVA sur immobilisations + TVA sur autres biens et services + TVA déductible intracommunautaire, sur factures conformes et dépenses non exclues.',
      'TVA nette = TVA brute − TVA déductible − crédit de TVA antérieur.',
      'Positive : TVA à décaisser (44551), payée le mois suivant. Négative : crédit de TVA à reporter (44567) ou à rembourser.',
      'Écriture : on débite les comptes de TVA collectée et due (pour les solder), on crédite les comptes de TVA déductible et l’ancien crédit, le solde va au 44551 (crédit) ou au 44567 (débit).'
    ],
    pieges: [
      'Prestations de services : la TVA est exigible à l’encaissement (sauf option pour les débits) ; on ne collecte que sur les sommes encaissées.',
      'Exclusions du droit à déduction : véhicules de tourisme, cadeaux de plus de 73 € TTC par bénéficiaire et par an, logement des dirigeants.',
      'Acquisition intracommunautaire : la même TVA est due (4452) et déductible (445662) ; l’effet est nul si elle est entièrement déductible, mais les deux lignes figurent dans l’écriture.',
      'Le crédit de TVA antérieur (solde débiteur du 44567) vient en déduction : il est crédité dans l’écriture.',
      'Le compte 44551 est soldé au paiement (D 44551 / C 512), jamais dans l’écriture de déclaration.'
    ],
    comptes: ['44571 TVA collectée', '4452 TVA due intracommunautaire', '44562 TVA sur immobilisations', '44566 TVA sur autres biens et services', '445662 TVA déductible intracommunautaire', '44567 Crédit de TVA à reporter', '44551 TVA à décaisser']
  },
  gen: function (r) {
    var mois = r.int(1, 11);
    if (r.chance(0.35)) {
      var s = { c4457: r.int(20, 200) * 431 + r.int(0, 99), c4452: r.chance(0.5) ? r.int(5, 60) * 47 : 0, d44562: r.chance(0.6) ? r.int(2, 40) * 123 : 0, d44566: 0, d44567: r.chance(0.5) ? r.int(5, 50) * 41 : 0 };
      s.d445662 = s.c4452 ? (r.chance(0.7) ? s.c4452 : U.r0(s.c4452 * r.int(80, 120) / 100)) : 0;
      s.d44566 = U.r0(s.c4457 * r.int(30, 75) / 100);
      if (r.chance(0.2)) s.d44562 += U.r0(s.c4457 * 0.6);
      return { nom: U.nom(r), mode: 'soldes', mois: mois, s: s };
    }
    var o = {
      v20: r.int(30, 400) * 1000 + r.int(0, 9) * 100, v10: r.chance(0.4) ? r.int(5, 80) * 1000 : 0, v55: r.chance(0.3) ? r.int(5, 60) * 1000 : 0,
      prestFact: 0, prestEnc: 0, achats: 0, frais: r.int(5, 40) * 500, cadeaux: r.chance(0.4) ? r.int(2, 12) * 150 : 0,
      immo: r.chance(0.5) ? r.int(5, 80) * 1000 : 0, vp: r.chance(0.3) ? r.int(18, 45) * 1000 : 0, aic: r.chance(0.5) ? r.int(5, 60) * 1000 : 0,
      credit: r.chance(0.4) ? r.int(5, 80) * 37 : 0
    };
    if (r.chance(0.5)) { o.prestFact = r.int(10, 60) * 1000; o.prestEnc = U.r0(o.prestFact * r.int(3, 9) / 10 / 100) * 100; }
    o.achats = U.r0((o.v20 + o.v10 + o.v55) * r.int(35, 85) / 100 / 100) * 100;
    return { nom: U.nom(r), mode: 'ops', mois: mois, o: o };
  },
  calc: function (p) {
    var x = {};
    if (p.mode === 'soldes') {
      var s = p.s; x.coll = s.c4457; x.due = s.c4452; x.immo = s.d44562; x.abs = s.d44566; x.intra = s.d445662; x.cred = s.d44567;
    } else {
      var o = p.o;
      x.coll = U.r2(o.v20 * 0.2 + o.v10 * 0.1 + o.v55 * 0.055 + o.prestEnc * 0.2);
      x.due = U.r2(o.aic * 0.2); x.intra = x.due;
      x.immo = U.r2(o.immo * 0.2);
      x.abs = U.r2((o.achats + o.frais) * 0.2);
      x.cred = o.credit;
    }
    x.brute = U.r2(x.coll + x.due);
    x.ded = U.r2(x.immo + x.abs + x.intra);
    x.net = U.r2(x.brute - x.ded - x.cred);
    return x;
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n, M = U.MOIS[p.mois - 1];
    var fin = U.lastDay(p.mois) + '/' + (p.mois < 10 ? '0' : '') + p.mois + '/N';
    var pay = '15/' + (p.mois + 1 < 10 ? '0' : '') + (p.mois + 1) + '/N';
    var en, c = [];
    if (p.mode === 'soldes') {
      var s = p.s;
      en = '<p>Les soldes au ' + fin + ' des comptes de TVA de la société <b>' + p.nom + '</b> sont les suivants :</p>';
      var rows = [['44571', 'TVA collectée', e(s.c4457)]];
      if (s.c4452) rows.push(['4452', 'TVA due intracommunautaire', e(s.c4452)]);
      if (s.d44562) rows.push(['44562', 'TVA sur immobilisations', e(s.d44562)]);
      rows.push(['44566', 'TVA sur autres biens et services', e(s.d44566)]);
      if (s.d445662) rows.push(['445662', 'TVA déductible intracommunautaire', e(s.d445662)]);
      if (s.d44567) rows.push(['44567', 'Crédit de TVA à reporter (mois précédent)', e(s.d44567)]);
      en += U.tbl(['Compte', 'Intitulé', 'Solde'], rows);
      c.push(['TVA brute', n(x.coll) + (x.due ? ' + ' + n(x.due) : ''), e(x.brute)]);
      c.push(['TVA déductible', [x.immo, x.abs, x.intra].filter(Boolean).map(n).join(' + '), e(x.ded)]);
    } else {
      var o = p.o;
      en = '<p>La société <b>' + p.nom + '</b>, soumise au régime réel normal, a réalisé en ' + M + ' N les opérations suivantes (montants hors taxes) :</p>';
      var li = ['Ventes de marchandises au taux de 20 % : ' + e(o.v20)];
      if (o.v10) li.push('Ventes au taux de 10 % : ' + e(o.v10));
      if (o.v55) li.push('Ventes au taux de 5,5 % : ' + e(o.v55));
      if (o.prestFact) li.push('Prestations de services facturées : ' + e(o.prestFact) + ', dont ' + e(o.prestEnc) + ' encaissées dans le mois (pas d’option pour les débits)');
      li.push('Achats de marchandises en France (TVA 20 %) : ' + e(o.achats));
      li.push('Frais généraux (TVA 20 %) : ' + e(o.frais));
      if (o.cadeaux) li.push('Cadeaux de fin d’année à des clients, ' + e(U.r2(o.cadeaux * 1.2)) + ' TTC par bénéficiaire (' + e(o.cadeaux) + ' HT)');
      if (o.immo) li.push('Achat d’une machine-outil : ' + e(o.immo));
      if (o.vp) li.push('Achat d’une voiture de tourisme pour le directeur commercial : ' + e(o.vp));
      if (o.aic) li.push('Acquisition intracommunautaire de marchandises auprès d’un fournisseur allemand : ' + e(o.aic));
      if (o.credit) li.push('Crédit de TVA du mois précédent : ' + e(o.credit));
      en += U.ul(li) + '<p>Toutes les factures sont conformes. Taux normal 20 %.</p>';
      var cl = [n(o.v20) + ' × 20 %'];
      if (o.v10) cl.push(n(o.v10) + ' × 10 %'); if (o.v55) cl.push(n(o.v55) + ' × 5,5 %'); if (o.prestEnc) cl.push(n(o.prestEnc) + ' × 20 % (encaissements seulement)');
      c.push(['TVA collectée', cl.join(' + '), e(x.coll)]);
      if (x.due) c.push(['TVA due intracommunautaire', n(o.aic) + ' × 20 %', e(x.due)]);
      c.push(['TVA brute', '', '<b>' + e(x.brute) + '</b>']);
      if (x.immo || o.vp) c.push(['TVA sur immobilisations', o.immo ? n(o.immo) + ' × 20 %' + (o.vp ? ' (voiture de tourisme exclue)' : '') : 'voiture de tourisme exclue', e(x.immo)]);
      c.push(['TVA sur autres biens et services', '(' + n(o.achats) + ' + ' + n(o.frais) + ') × 20 %' + (o.cadeaux ? ' (cadeaux > 73 € TTC exclus)' : ''), e(x.abs)]);
      if (x.intra) c.push(['TVA déductible intracommunautaire', n(o.aic) + ' × 20 %', e(x.intra)]);
      c.push(['TVA déductible', '', '<b>' + e(x.ded) + '</b>']);
    }
    if (x.cred) c.push(['Crédit antérieur', '', e(x.cred)]);
    c.push([x.net >= 0 ? 'TVA à décaisser' : 'Crédit de TVA à reporter', n(x.brute) + ' − ' + n(x.ded) + (x.cred ? ' − ' + n(x.cred) : ''), '<b>' + e(Math.abs(x.net)) + '</b>']);
    en += '<p class="consigne">1. Calculez la TVA due au titre de ' + M + ' N. 2. Passez l’écriture de déclaration au ' + fin + '. 3. Le cas échéant, passez l’écriture de paiement du ' + pay + '.</p>';

    var qs = [Q('coll', 'TVA collectée', x.coll, '€')];
    if (x.due) qs.push(Q('due', 'TVA due intracommunautaire', x.due, '€'));
    qs.push(Q('ded', 'Total de la TVA déductible', x.ded, '€'));
    qs.push(QC('sens', 'Résultat de la déclaration', ['TVA à décaisser', 'Crédit de TVA à reporter'], x.net >= 0 ? 0 : 1));
    qs.push(Q('net', 'Montant de la TVA à décaisser ou du crédit', Math.abs(x.net), '€'));

    var L = U.L;
    var lines = [L('44571', x.coll, 0), L('4452', x.due, 0)];
    if (x.net < 0) lines.push(L('44567', -x.net, 0, { lib: 'Crédit de TVA à reporter (nouveau)' }));
    lines.push(L('44562', 0, x.immo), L('44566', 0, x.abs), L('445662', 0, x.intra), L('44567', 0, x.cred, { lib: 'Crédit de TVA antérieur imputé' }));
    if (x.net > 0) lines.push(L('44551', 0, x.net));
    var journal = [U.entry(fin, 'Déclaration de TVA de ' + M, lines)];
    if (x.net > 0) journal.push(U.entry(pay, 'Paiement de la TVA de ' + M, [L('44551', x.net, 0), L('512', 0, x.net)]));

    var com = [];
    com.push('La TVA est un impôt sur la consommation que l’entreprise collecte pour le compte de l’État : elle ne constitue ni une charge ni un produit, d’où son passage par des comptes de tiers (classe 4).');
    com.push('Sur ' + M + ', la TVA brute s’élève à ' + e(x.brute) + ' et la TVA déductible à ' + e(x.ded) + '.');
    if (x.net >= 0) com.push('L’entreprise doit reverser ' + e(x.net) + ' : la déclaration CA3 est déposée et la taxe télépayée le mois suivant, à la date fixée par le calendrier fiscal ; le compte 44551 est alors soldé par la banque.');
    else com.push('La TVA déductible dépasse la TVA due : l’entreprise dégage un crédit de ' + e(-x.net) + ', qui s’imputera sur la déclaration suivante ou pourra faire l’objet d’une demande de remboursement.');
    if (x.due) com.push('L’acquisition intracommunautaire est autoliquidée : la TVA est à la fois due et déductible, ce qui est neutre pour la trésorerie mais doit figurer sur la déclaration.');
    if (p.mode === 'ops' && (p.o.vp || p.o.cadeaux)) com.push('Les dépenses exclues du droit à déduction (' + [p.o.vp ? 'voiture de tourisme' : '', p.o.cadeaux ? 'cadeaux de plus de 73 € TTC' : ''].filter(Boolean).join(', ') + ') sont comptabilisées TTC : la TVA non récupérable augmente leur coût.');
    if (p.mode === 'ops' && p.o.prestFact) com.push('Pour les prestations de services, la TVA n’est exigible qu’à l’encaissement : seule la part encaissée (' + e(p.o.prestEnc) + ') est imposée ce mois-ci.');
    com.push('Une erreur sur la CA3 expose à des intérêts de retard et à des majorations : chaque montant doit être justifié par une facture conforme.');
    return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Calcul de la TVA due', html: U.calc(c) }], comment: com.join(' ') };
  }
};

/* ---------- 3. Coefficient de déduction (bien à usage mixte) ---------- */
T.tva_coef = {
  id: 'tva_coef', nom: 'TVA : coefficient de déduction', famille: 'TVA', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Déterminer la TVA déductible sur un bien utilisé à la fois pour des opérations taxées et pour des opérations exonérées ou hors champ, puis comptabiliser son acquisition.',
    etapes: [
      'Coefficient d’assujettissement : part d’utilisation du bien pour des opérations dans le champ de la TVA (imposables ou exonérées). 1 si le bien ne sert à aucune activité hors champ.',
      'Coefficient de taxation : CA ouvrant droit à déduction ÷ CA total des opérations dans le champ (taxées + exonérées). Données de N-1 pour le coefficient provisoire.',
      'Coefficient d’admission : 0 pour les biens exclus (véhicule de tourisme), 1 sinon.',
      'Coefficient de déduction = assujettissement × taxation × admission.',
      'TVA déductible = TVA d’origine × coefficient ; la TVA non déductible s’ajoute au coût de l’immobilisation.',
      'Amortissement calculé sur ce coût majoré, au prorata de la date de mise en service.'
    ],
    pieges: [
      'Confondre exonéré (dans le champ : joue sur la taxation) et hors champ (joue sur l’assujettissement).',
      'Oublier d’ajouter la TVA non déductible au coût d’acquisition, donc à la base amortissable.',
      'Le coefficient est provisoire (données de N-1) : il sera régularisé avec le coefficient définitif de N avant le 25 avril N+1.',
      'Pour un immeuble, la période de régularisation est de 20 ans (5 ans pour un bien meuble) ; régularisation si l’écart dépasse 10 points.',
      'Écris l’hypothèse retenue quand l’énoncé est ambigu (sujet 2026 : formation « non soumise à la TVA »).'
    ],
    comptes: ['213 Constructions', '44562 TVA sur immobilisations', '512 Banque / 404 Fournisseurs d’immobilisations', '6811 / 2813 Amortissements']
  },
  gen: function (r) {
    var acts = [['la construction de machines agricoles', 'la formation professionnelle', 'exonérée de TVA (article 261-4-4° du CGI)'], ['la vente de matériel médical', 'des soins médicaux', 'exonérés de TVA'], ['la promotion immobilière', 'la location de logements nus', 'exonérée de TVA'], ['le conseil aux entreprises', 'des opérations bancaires et financières', 'exonérées de TVA (sans option)']];
    var a = r.pick(acts);
    var tax = r.int(45, 92) / 100, tot = r.int(40, 250) * 100000;
    var T1 = U.r0(tot * tax), E = tot - T1;
    var niveaux = r.pick([4, 5, 6]);
    var hc = r.chance(0.35) ? r.int(1, niveaux - 2) : 0;
    return { nom: U.nom(r), actT: a[0], actE: a[1], exoTxt: a[2], T: T1, E: E, P: r.int(400, 3000) * 1000 + r.pick([0, 500, 700]), m: r.int(2, 11), duree: r.pick([20, 25, 30, 40]), niveaux: niveaux, hc: hc };
  },
  calc: function (p) {
    var assu = p.hc ? (p.niveaux - p.hc) / p.niveaux : 1;
    var tax = U.rd(p.T / (p.T + p.E), 4);
    var adm = 1, ded = U.rd(assu * tax * adm, 4);
    var tva = U.r2(p.P * 0.2), tvaD = U.r2(tva * ded), tvaND = U.r2(tva - tvaD), cout = U.r2(p.P + tvaND);
    var mois = 13 - p.m, dot = U.r2(cout / p.duree * mois / 12);
    return { assu: assu, tax: tax, adm: adm, ded: ded, tva: tva, tvaD: tvaD, tvaND: tvaND, cout: cout, mois: mois, dot: dot };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n;
    var date = '01/' + (p.m < 10 ? '0' : '') + p.m + '/N';
    var en = '<p>La société <b>' + p.nom + '</b> exerce deux activités : ' + p.actT + ' (soumise à la TVA) et ' + p.actE + ', ' + p.exoTxt + '.</p>';
    en += U.kv([['Chiffre d’affaires N-1 – ' + p.actT, e(p.T)], ['Chiffre d’affaires N-1 – ' + p.actE, e(p.E)]]);
    en += '<p>Pour son siège, elle acquiert au comptant un immeuble de ' + p.niveaux + ' niveaux pour ' + e(p.P) + ' HT (TVA 20 %), mis en service le ' + date + ' et amorti en linéaire sur ' + p.duree + ' ans. ';
    en += p.hc ? (p.hc === 1 ? 'Un niveau est mis gratuitement à la disposition d’une association culturelle (activité hors du champ d’application de la TVA) ; les autres niveaux servent indistinctement aux deux activités. ' : p.hc + ' niveaux sont mis gratuitement à la disposition d’une association culturelle (activité hors du champ d’application de la TVA) ; les autres servent indistinctement aux deux activités. ') : 'L’immeuble sert aux deux activités. ';
    en += 'Aucune mesure d’exclusion ne s’applique à ce bien.</p>';
    en += '<p class="consigne">1. Calculez les coefficients d’assujettissement, de taxation, d’admission et de déduction. 2. Enregistrez l’acquisition du ' + date + ' et la dotation du 31/12/N.</p>';
    var qs = [Q('as', 'Coefficient d’assujettissement', x.assu, 'coef', { tol: 0.005 }), Q('ta', 'Coefficient de taxation', x.tax, 'coef', { tol: 0.005 }), Q('ad', 'Coefficient d’admission', 1, 'coef', { tol: 0.001 }), Q('de', 'Coefficient de déduction', x.ded, 'coef', { tol: 0.006 }),
      Q('tvad', 'TVA déductible', x.tvaD, '€'), Q('cout', 'Coût d’acquisition de l’immeuble', x.cout, '€'), Q('dot', 'Dotation aux amortissements de N', x.dot, '€')];
    var c = [
      ['Assujettissement', p.hc ? (p.niveaux - p.hc) + ' niveaux sur ' + p.niveaux + ' utilisés pour des opérations dans le champ' : 'toutes les opérations sont dans le champ de la TVA (l’activité exonérée y est incluse)', n(x.assu, 2)],
      ['Taxation', n(p.T) + ' ÷ (' + n(p.T) + ' + ' + n(p.E) + ')', n(x.tax, 2)],
      ['Admission', 'aucune exclusion', '1'],
      ['Déduction', n(x.assu, 2) + ' × ' + n(x.tax, 2) + ' × 1', '<b>' + n(x.ded, 4).replace(/0+$/, '').replace(/,$/, '') + '</b>'],
      ['TVA d’origine', n(p.P) + ' × 20 %', e(x.tva)],
      ['TVA déductible', n(x.tva) + ' × ' + n(x.ded, 4).replace(/0+$/, '').replace(/,$/, ''), e(x.tvaD)],
      ['TVA non déductible', n(x.tva) + ' − ' + n(x.tvaD), e(x.tvaND)],
      ['Coût d’acquisition', n(p.P) + ' + ' + n(x.tvaND), '<b>' + e(x.cout) + '</b>'],
      ['Dotation N', n(x.cout) + ' ÷ ' + p.duree + ' × ' + x.mois + '/12', '<b>' + e(x.dot) + '</b>']
    ];
    var L = U.L;
    var journal = [U.entry(date, 'Acquisition de l’immeuble', [L('213', x.cout, 0), L('44562', x.tvaD, 0), L('512', 0, U.r2(p.P + x.tva), { alt: ['404'] })]),
      U.entry('31/12/N', 'Dotation aux amortissements', [L('6811', x.dot, 0), L('2813', 0, x.dot)])];
    var com = [];
    com.push('Le droit à déduction n’est que partiel : l’immeuble sert ' + (p.hc ? 'pour partie à une activité hors champ, ce qui réduit l’assujettissement, et ' : '') + 'à une activité exonérée qui n’ouvre pas droit à déduction, ce qui réduit la taxation.');
    com.push('Sur ' + e(x.tva) + ' de TVA facturée, seuls ' + e(x.tvaD) + ' sont récupérables (coefficient ' + n(x.ded, 4).replace(/0+$/, '').replace(/,$/, '') + ').');
    com.push('Les ' + e(x.tvaND) + ' non récupérables constituent une charge pour l’entreprise : ils s’ajoutent au coût de l’immeuble et seront étalés par l’amortissement sur ' + p.duree + ' ans.');
    com.push('Le coefficient de taxation retenu est provisoire, calculé sur le chiffre d’affaires de N-1 ; il sera remplacé par le coefficient définitif de N, connu au plus tard le 25 avril N+1, et la déduction sera ajustée.');
    com.push('Ensuite, pendant 20 ans pour un immeuble, une régularisation annuelle d’un vingtième sera opérée si le coefficient d’une année s’écarte de plus de 10 points de celui de N, ou en cas de cession non soumise à TVA.');
    com.push('Le développement de l’activité taxée améliorera donc le droit à déduction, alors qu’une croissance de l’activité exonérée l’amputerait.');
    return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Coefficients et coût', html: U.calc(c) }], comment: com.join(' ') };
  }
};

/* ---------- 4. Régularisations de TVA ---------- */
T.tva_regul = {
  id: 'tva_regul', nom: 'TVA : régularisations', famille: 'TVA', ctrl: true, minutes: 12,
  fiche: {
    objectif: 'Ajuster la TVA déduite sur une immobilisation lorsque le coefficient de déduction varie ou que le bien est cédé pendant la période de régularisation.',
    etapes: [
      'Coefficient définitif de l’année d’acquisition (avant le 25 avril N+1) : régularisation = TVA d’origine × (coefficient définitif − coefficient provisoire).',
      'Années suivantes : on compare le coefficient de l’année à celui de l’année d’acquisition. Si l’écart dépasse 10 points (0,10), régularisation = TVA d’origine × écart ÷ 5 (bien meuble) ou ÷ 20 (immeuble).',
      'Écart positif : complément de déduction ; écart négatif : reversement.',
      'Cession d’un immeuble sans TVA pendant la période : reversement = TVA initialement déduite × (20 − nombre d’années civiles écoulées, année de cession comprise) ÷ 20.',
      'La régularisation ne modifie pas le coût de l’immobilisation : elle est constatée en charge (reversement) ou en produit (complément).'
    ],
    pieges: [
      'Comparer au coefficient de l’année précédente au lieu de celui de l’année d’acquisition.',
      'Régulariser un écart de 10 points exactement : il faut un écart strictement supérieur.',
      'Diviser par 20 pour un bien meuble (c’est 5).',
      'Oublier que l’année d’acquisition compte comme une année écoulée.'
    ],
    comptes: ['44562 TVA sur immobilisations', '44571 TVA collectée (reversement)', '6358 Autres droits (charge de reversement)', '758 Produits divers de gestion courante (complément)']
  },
  gen: function (r) {
    var sub = r.pick(['annuelle', 'annuelle', 'cession', 'definitif']);
    var meuble = sub === 'annuelle' ? r.chance(0.5) : false;
    var Pht = meuble ? r.int(20, 200) * 1000 : r.int(300, 2000) * 1000;
    var c0 = r.int(40, 90) / 100;
    var p = { nom: U.nom(r), sub: sub, meuble: meuble, P: Pht, c0: c0 };
    if (sub === 'annuelle') {
      var ys = [], max = meuble ? 4 : 6;
      var k0 = r.int(1, max - 2);
      for (var i = 0; i < 3; i++) {
        var dlt = r.pick([-0.18, -0.12, -0.08, -0.05, 0.03, 0.07, 0.10, 0.13, 0.16, 0.21, -0.10, -0.22]);
        var c = Math.min(1, Math.max(0, U.rd(c0 + dlt, 2)));
        ys.push({ y: k0 + i, c: c });
      }
      p.annees = ys;
    } else if (sub === 'cession') {
      p.kc = r.int(2, 15); p.prix = U.r0(p.P * r.int(90, 140) / 100 / 1000) * 1000;
    } else {
      p.cprov = c0; p.cdef = Math.min(1, U.rd(c0 + r.pick([-0.09, -0.06, -0.04, 0.03, 0.05, 0.08, 0.12]), 2));
    }
    return p;
  },
  solve: function (p) {
    var e = U.e, n = U.n, tva = U.r2(p.P * 0.2), L = U.L, qs = [], c = [], journal = [], com = [];
    var bien = p.meuble ? 'une machine (bien meuble)' : 'un immeuble';
    var en = '<p>La société <b>' + p.nom + '</b>, partiellement redevable de la TVA, a acquis en N ' + bien + ' pour ' + e(p.P) + ' HT, soit ' + e(tva) + ' de TVA (taux 20 %).</p>';
    var tvaD = U.r2(tva * p.c0);
    if (p.sub === 'annuelle') {
      var div = p.meuble ? 5 : 20;
      en += '<p>Le coefficient de déduction définitif de N était de ' + n(p.c0, 2) + ' ; la TVA déduite s’est donc élevée à ' + e(tvaD) + '. Les coefficients définitifs des années suivantes sont :</p>';
      en += U.tbl(['Année', 'Coefficient de déduction'], p.annees.map(function (a) { return [U.yl(a.y), n(a.c, 2)]; }));
      en += '<p class="consigne">1. Calculez, pour chaque année, la régularisation éventuelle (montant positif pour un complément de déduction, négatif pour un reversement). 2. Comptabilisez la régularisation de ' + U.yl(p.annees[p.annees.length - 1].y) + ' si elle est due.</p>';
      var last = null;
      p.annees.forEach(function (a, i) {
        var ec = U.rd(a.c - p.c0, 2), reg = Math.abs(ec) > 0.1 + 1e-9 ? U.r2(tva * ec / div) : 0;
        qs.push(Q('r' + i, 'Régularisation en ' + U.yl(a.y), reg, '€'));
        c.push([U.yl(a.y), 'écart ' + n(a.c, 2) + ' − ' + n(p.c0, 2) + ' = ' + (ec > 0 ? '+' : '') + n(ec, 2) + (reg ? ' > 10 points → ' + n(tva) + ' × ' + (ec > 0 ? '' : '(') + n(ec, 2) + (ec > 0 ? '' : ')') + ' ÷ ' + div : ' : pas plus de 10 points, aucune régularisation'), '<b>' + (reg > 0 ? '+' : '') + e(reg) + '</b>']);
        if (i === p.annees.length - 1) last = { reg: reg, y: a.y };
      });
      if (last.reg < 0) journal.push(U.entry('31/12/' + U.yl(last.y), 'Reversement de TVA (régularisation annuelle)', [L('6358', -last.reg, 0), L('44571', 0, -last.reg, { lib: 'TVA à reverser' })]));
      if (last.reg > 0) journal.push(U.entry('31/12/' + U.yl(last.y), 'Complément de déduction (régularisation annuelle)', [L('44562', last.reg, 0), L('758', 0, last.reg)]));
      com.push('La déduction opérée lors de l’acquisition n’est pas définitive : pendant ' + div + ' ans (' + (p.meuble ? 'bien meuble' : 'immeuble') + '), elle suit l’usage réel du bien.');
      com.push('Chaque année, le coefficient définitif est comparé à celui de l’année d’acquisition (' + n(p.c0, 2) + ') ; seul un écart de plus de 10 points entraîne une régularisation, égale à un ' + (p.meuble ? 'cinquième' : 'vingtième') + ' de la TVA d’origine multiplié par l’écart.');
      com.push('Les petits écarts sont donc ignorés, ce qui évite des corrections permanentes.');
      com.push('Un reversement augmente les charges de l’exercice et pèse sur la trésorerie ; un complément de déduction constitue au contraire un produit et une créance sur l’État.');
      com.push('La régularisation ne modifie pas le coût d’entrée du bien, qui reste figé, ni le plan d’amortissement.');
      com.push('L’entreprise a intérêt à anticiper l’évolution de la part de ses activités taxées, car elle commande le montant de TVA réellement récupéré sur ses investissements.');
    } else if (p.sub === 'cession') {
      var ec2 = p.kc + 1, rev = U.r2(tvaD * (20 - ec2) / 20);
      en += '<p>Le coefficient de déduction de N était de ' + n(p.c0, 2) + ' (TVA déduite : ' + e(tvaD) + '). L’immeuble, achevé depuis plus de cinq ans, est cédé en ' + U.yl(p.kc) + ' pour ' + e(p.prix) + ', sans option pour la TVA (vente exonérée).</p>';
      en += '<p class="consigne">Calculez la régularisation de TVA due lors de la cession et comptabilisez-la au 31/12/' + U.yl(p.kc) + '.</p>';
      qs.push(Q('ann', 'Nombre d’années civiles écoulées (année de cession comprise)', ec2, 'u', { tol: 0 }));
      qs.push(Q('rev', 'Montant de TVA à reverser', rev, '€'));
      c.push(['TVA déduite à l’origine', n(tva) + ' × ' + n(p.c0, 2), e(tvaD)]);
      c.push(['Années écoulées', 'de N à ' + U.yl(p.kc) + ' inclus', String(ec2)]);
      c.push(['Reversement', n(tvaD) + ' × (20 − ' + ec2 + ') ÷ 20', '<b>' + e(rev) + '</b>']);
      journal.push(U.entry('31/12/' + U.yl(p.kc), 'Reversement de TVA sur cession d’immeuble', [L('6358', rev, 0), L('44571', 0, rev, { lib: 'TVA à reverser' })]));
      com.push('La TVA déduite sur un immeuble n’est définitivement acquise qu’au terme d’une période de 20 ans.');
      com.push('En cédant le bien sans TVA au bout de ' + ec2 + ' années civiles, l’entreprise sort l’immeuble du circuit taxable : elle doit reverser la fraction de TVA correspondant aux ' + (20 - ec2) + ' années restantes, soit ' + e(rev) + '.');
      com.push('Ce reversement est une charge de l’exercice de cession ; il réduit d’autant le résultat de l’opération, qu’il faut intégrer dans la décision de vendre.');
      com.push('L’option pour la TVA sur la vente, quand elle est possible, éviterait ce reversement et permettrait même à l’acquéreur de déduire la taxe.');
      com.push('Le coût d’entrée et le plan d’amortissement ne sont pas modifiés ; la plus ou moins-value de cession se calcule séparément.');
    } else {
      var reg2 = U.r2(tva * (p.cdef - p.cprov));
      en += '<p>La déduction de N a été opérée avec un coefficient provisoire de ' + n(p.cprov, 2) + ' (calculé sur les données de N-1). Le coefficient définitif de N, arrêté en mars N+1, est de ' + n(p.cdef, 2) + '.</p>';
      en += '<p class="consigne">Calculez la régularisation à opérer avant le 25 avril N+1 (positive pour un complément de déduction, négative pour un reversement) et comptabilisez-la au 31/03/N+1.</p>';
      qs.push(Q('reg', 'Régularisation', reg2, '€'));
      c.push(['TVA déduite (provisoire)', n(tva) + ' × ' + n(p.cprov, 2), e(U.r2(tva * p.cprov))]);
      c.push(['TVA déductible (définitive)', n(tva) + ' × ' + n(p.cdef, 2), e(U.r2(tva * p.cdef))]);
      c.push(['Régularisation', n(tva) + ' × (' + n(p.cdef, 2) + ' − ' + n(p.cprov, 2) + ')', '<b>' + (reg2 > 0 ? '+' : '') + e(reg2) + '</b>']);
      if (reg2 < 0) journal.push(U.entry('31/03/N+1', 'Ajustement au coefficient définitif (reversement)', [L('6358', -reg2, 0), L('44571', 0, -reg2, { lib: 'TVA à reverser' })]));
      if (reg2 > 0) journal.push(U.entry('31/03/N+1', 'Ajustement au coefficient définitif (complément)', [L('44562', reg2, 0), L('758', 0, reg2)]));
      com.push('Le coefficient utilisé lors de l’acquisition est nécessairement provisoire : il repose sur le chiffre d’affaires de N-1.');
      com.push('Une fois le coefficient définitif de N connu (' + n(p.cdef, 2) + '), la déduction est ajustée sans seuil de tolérance, ici de ' + e(reg2) + '.');
      com.push('Cet ajustement, réalisé au plus tard le 25 avril N+1, est porté sur la déclaration du mois.');
      com.push('Le coefficient définitif de N devient la référence pour les régularisations annuelles des années suivantes : seuls les écarts de plus de 10 points par rapport à lui seront régularisés.');
      com.push('La différence est constatée en charge ou en produit, sans modifier le coût d’acquisition déjà retenu.');
    }
    return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Calculs', html: U.calc(c) }], comment: com.join(' ') };
  }
};
