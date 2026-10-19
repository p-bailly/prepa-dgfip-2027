/* ===== Flux et prévisions de trésorerie ===== */
// « a », « a et b », « a, b et c »
function listeEt(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' et ' + a[a.length - 1]; }

/* ---------- 20. Tableau des flux de trésorerie ---------- */
T.flux_treso = {
  id: 'flux_treso', nom: 'Tableau des flux de trésorerie', famille: 'Analyse financière', ctrl: false, minutes: 18,
  fiche: {
    objectif: 'Expliquer la variation de la trésorerie de l’exercice par trois flux : activité, investissement, financement.',
    etapes: [
      'CAF = résultat net + dotations aux amortissements, dépréciations et provisions − reprises − produits de cession + valeur nette comptable des éléments cédés.',
      'Variation du BFR d’exploitation = Δ stocks + Δ créances clients − Δ dettes fournisseurs (une hausse du BFR consomme de la trésorerie).',
      'Flux de trésorerie lié à l’activité = CAF − variation du BFR d’exploitation.',
      'Flux lié à l’investissement = − acquisitions d’immobilisations + prix de cession.',
      'Flux lié au financement = augmentation de capital en numéraire + nouveaux emprunts − remboursements d’emprunts − dividendes versés.',
      'Variation de trésorerie = somme des trois flux = trésorerie de clôture − trésorerie d’ouverture (disponibilités − concours bancaires courants).'
    ],
    pieges: [
      'Compter deux fois la plus-value de cession : le prix de cession va dans le flux d’investissement, il faut donc le retirer de la CAF.',
      'Se tromper de signe sur la variation du BFR : un BFR qui augmente se retranche.',
      'Oublier que les dividendes versés sont un flux de financement, pas une charge.',
      'Le tableau de financement du PCG explique la variation du FRNG ; le tableau des flux explique directement celle de la trésorerie.'
    ],
    comptes: []
  },
  gen: function (r) {
    for (var t = 0; t < 200; t++) {
      var p = { nom: U.nom(r), R: r.int(2, 60) * 5, D: r.int(4, 50) * 5, Rp: r.chance(0.5) ? r.int(1, 8) * 5 : 0 };
      if (r.chance(0.6)) { p.VNC = r.int(2, 20) * 5; p.PC = p.VNC + r.int(-3, 10) * 5; if (p.PC <= 0) continue; } else { p.VNC = 0; p.PC = 0; }
      p.ST = [r.int(10, 100) * 5, 0]; p.ST[1] = p.ST[0] + r.int(-10, 15) * 5;
      p.CL = [r.int(10, 120) * 5, 0]; p.CL[1] = p.CL[0] + r.int(-10, 20) * 5;
      p.FO = [r.int(10, 90) * 5, 0]; p.FO[1] = p.FO[0] + r.int(-8, 12) * 5;
      if (p.ST[1] <= 0 || p.CL[1] <= 0 || p.FO[1] <= 0) continue;
      p.I = r.int(5, 80) * 5; p.AK = r.chance(0.3) ? r.int(2, 20) * 10 : 0; p.EMP = r.chance(0.6) ? r.int(2, 30) * 10 : 0;
      p.RB = r.int(2, 20) * 5; p.DIV = r.chance(0.6) ? r.int(1, 10) * 5 : 0; p.T0 = r.int(-10, 40) * 5;
      if (this.calc(p).CAF <= 0) continue;
      return p;
    }
  },
  calc: function (p) {
    var x = {};
    x.PV = p.PC - p.VNC; x.CAF = p.R + p.D - p.Rp - p.PC + p.VNC;
    x.dST = p.ST[1] - p.ST[0]; x.dCL = p.CL[1] - p.CL[0]; x.dFO = p.FO[1] - p.FO[0]; x.dBFR = x.dST + x.dCL - x.dFO;
    x.FA = x.CAF - x.dBFR; x.FI = p.PC - p.I; x.FF = p.AK + p.EMP - p.RB - p.DIV;
    x.dT = x.FA + x.FI + x.FF; x.T1 = p.T0 + x.dT; x.FCF = x.FA + x.FI;
    for (var k in x) x[k] = U.r2(x[k]);
    return x;
  },
  solve: function (p) {
    var x = this.calc(p), n = U.n, t = { tol: 0.5 };
    var en = '<p>Données de la société <b>' + p.nom + '</b> pour l’exercice N, en milliers d’euros :</p>';
    var cr = [['Résultat net de l’exercice', n(p.R)], ['Dotations aux amortissements, dépréciations et provisions', n(p.D)]];
    if (p.Rp) cr.push(['Reprises sur dépréciations et provisions', n(p.Rp)]);
    if (p.PC) cr.push(['Produits des cessions d’immobilisations', n(p.PC)], ['Valeur nette comptable des immobilisations cédées', n(p.VNC)]);
    en += U.tbl(['Compte de résultat (extraits)', 'K€'], cr);
    en += U.tbl(['Bilan (extraits)', '31/12/N−1', '31/12/N'], [['Stocks', n(p.ST[0]), n(p.ST[1])], ['Créances clients', n(p.CL[0]), n(p.CL[1])], ['Dettes fournisseurs', n(p.FO[0]), n(p.FO[1])]]);
    var op = ['acquisitions d’immobilisations payées : ' + n(p.I) + ' K€ ;'];
    if (p.AK) op.push('augmentation de capital en numéraire, entièrement libérée : ' + n(p.AK) + ' K€ ;');
    if (p.EMP) op.push('nouvel emprunt encaissé : ' + n(p.EMP) + ' K€ ;');
    op.push('remboursements d’emprunts : ' + n(p.RB) + ' K€ ;');
    if (p.DIV) op.push('dividendes versés : ' + n(p.DIV) + ' K€ ;');
    op.push('trésorerie nette au 01/01/N (disponibilités − concours bancaires courants) : ' + n(p.T0) + ' K€.');
    en += '<p>Autres informations de l’exercice :</p>' + U.ul(op);
    en += '<p class="consigne">1. Calculez la CAF, puis le flux de trésorerie lié à l’activité. 2. Calculez les flux liés à l’investissement et au financement. 3. Présentez le tableau des flux, vérifiez la trésorerie de clôture et commentez.</p>';
    var qs = [Q('caf', 'Capacité d’autofinancement (K€)', x.CAF, '€', t), Q('dbfr', 'Variation du BFR d’exploitation (K€, hausse positive)', x.dBFR, '€', t), Q('fa', 'Flux lié à l’activité (K€)', x.FA, '€', t),
      Q('fi', 'Flux lié à l’investissement (K€)', x.FI, '€', t), Q('ff', 'Flux lié au financement (K€)', x.FF, '€', t), Q('dt', 'Variation de la trésorerie (K€)', x.dT, '€', t), Q('t1', 'Trésorerie nette au 31/12/N (K€)', x.T1, '€', t)];
    var s = function (v) { return v >= 0 ? '+ ' + n(v) : '− ' + n(-v); }, par = function (v) { return v < 0 ? '(' + n(v) + ')' : n(v); };
    var c = [['CAF', n(p.R) + ' ' + s(p.D) + (p.Rp ? ' − ' + n(p.Rp) : '') + (p.PC ? ' − ' + n(p.PC) + ' + ' + n(p.VNC) : ''), '<b>' + n(x.CAF) + '</b>'],
      ['Variation du BFR d’exploitation', 'Δ stocks + Δ clients − Δ fournisseurs = ' + par(x.dST) + ' + ' + par(x.dCL) + ' − ' + par(x.dFO), n(x.dBFR)]];
    if (p.PC) c.splice(1, 0, ['Plus ou moins-value de cession', n(p.PC) + ' − ' + n(p.VNC), n(x.PV)]);
    var rows = [['Capacité d’autofinancement', n(x.CAF)], ['Variation du BFR d’exploitation (une hausse se retranche)', n(-x.dBFR)], { cls: 'tot', cells: ['Flux net lié à l’activité', n(x.FA)] },
      ['Acquisitions d’immobilisations', n(-p.I)]];
    if (p.PC) rows.push(['Cessions d’immobilisations', n(p.PC)]);
    rows.push({ cls: 'tot', cells: ['Flux net lié à l’investissement', n(x.FI)] });
    if (p.AK) rows.push(['Augmentation de capital', n(p.AK)]);
    if (p.EMP) rows.push(['Emprunts nouveaux', n(p.EMP)]);
    rows.push(['Remboursements d’emprunts', n(-p.RB)]);
    if (p.DIV) rows.push(['Dividendes versés', n(-p.DIV)]);
    rows.push({ cls: 'tot', cells: ['Flux net lié au financement', n(x.FF)] }, { cls: 'tot', cells: ['Variation de la trésorerie', n(x.dT)] }, ['Trésorerie d’ouverture', n(p.T0)], { cls: 'tot', cells: ['Trésorerie de clôture', n(x.T1)] });
    var tf = U.tbl(['Tableau des flux de trésorerie', 'K€'], rows);
    var com = [];
    com.push(x.FA > 0 ? 'L’activité dégage ' + n(x.FA) + ' K€ de trésorerie' + (x.dBFR > 0 ? ', après une hausse du BFR de ' + n(x.dBFR) + ' K€ qui absorbe ' + U.pc(x.dBFR / x.CAF, 0) + ' de la CAF.' : (x.dBFR < 0 ? ', aidée par une baisse du BFR de ' + n(-x.dBFR) + ' K€.' : '.')) : 'L’activité consomme de la trésorerie (' + n(x.FA) + ' K€) : la hausse du BFR (' + n(x.dBFR) + ' K€) dépasse la CAF. C’est un signal d’alerte s’il se répète, car l’exploitation ne se finance plus elle-même.');
    com.push('Les investissements nets (' + n(-x.FI) + ' K€) sont ' + (x.FCF >= 0 ? 'entièrement financés par le flux d’activité, qui laisse un flux disponible de ' + n(x.FCF) + ' K€.' : 'supérieurs au flux d’activité : il manque ' + n(-x.FCF) + ' K€, couverts par le financement externe ou par la trésorerie.'));
    com.push('Le flux de financement (' + n(x.FF) + ' K€) ' + (x.FF >= 0 ? 'apporte des ressources nouvelles' + (p.EMP ? ', dont un emprunt qui alourdira les remboursements futurs.' : '.') : 'est négatif : l’entreprise rembourse ses prêteurs' + (p.DIV ? ' et rémunère ses actionnaires' : '') + ' plus qu’elle ne lève de fonds.'));
    com.push('Au total, la trésorerie ' + (x.dT >= 0 ? 'augmente de ' + n(x.dT) : 'diminue de ' + n(-x.dT)) + ' K€ et s’établit à ' + n(x.T1) + ' K€ au 31/12/N' + (x.T1 < 0 ? ' : l’entreprise finit l’exercice à découvert et doit restaurer sa trésorerie (réduction du BFR, financement à long terme, report d’investissements).' : '.'));
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'CAF et variation du BFR', html: U.calc(c) }, { h: 'Tableau des flux', html: tf }], comment: com.join(' ') };
  }
};

/* ---------- 21. Plan de financement ---------- */
T.plan_fin = {
  id: 'plan_fin', nom: 'Plan de financement', famille: 'Analyse financière', ctrl: false, minutes: 20,
  fiche: {
    objectif: 'Prévoir sur plusieurs années les ressources et les emplois d’un projet d’investissement et vérifier qu’il est finançable.',
    etapes: [
      'Ressources : CAF prévisionnelle de chaque année, augmentation de capital, emprunts nouveaux, prix de cession des immobilisations cédées.',
      'Emplois : investissements, augmentation du BFR, remboursements d’emprunts, dividendes.',
      'CAF prévisionnelle = résultat net prévisionnel + dotations aux amortissements (sans cession).',
      'BFR normatif = chiffre d’affaires HT × nombre de jours ÷ 360 ; seule sa variation d’une année sur l’autre est un emploi.',
      'Solde annuel = ressources − emplois ; le solde cumulé (trésorerie dégagée depuis le début) doit rester positif ou nul chaque année.'
    ],
    pieges: [
      'Inscrire le BFR total chaque année au lieu de sa seule augmentation.',
      'Commencer les remboursements d’emprunt dès l’année de souscription si l’énoncé prévoit un premier remboursement l’année suivante.',
      'Juger le plan sur le solde total : une seule année négative suffit à le rendre irréalisable sans financement complémentaire.',
      'Corriger un déséquilibre : emprunt supplémentaire, apport en capital, réduction des dividendes, étalement de l’investissement, crédit-bail.'
    ],
    comptes: []
  },
  ANS: ['N', 'N+1', 'N+2'],
  gen: function (r) {
    var want = r.chance(0.5);
    for (var t = 0; t < 300; t++) {
      var I = r.int(10, 80) * 10, j = r.pick([36, 45, 72, 90]), CA0 = r.int(10, 60) * 40;
      var p = { nom: U.nom(r), I: I, AK: r.chance(0.5) ? r.int(1, 10) * 10 : 0, E: U.r0(I * r.int(30, 70) / 100 / 10) * 10, nE: r.pick([4, 5]), PCes: r.chance(0.4) ? r.int(1, 6) * 5 : 0, j: j, CA0: CA0, CA: [], R: [], DAP: [], DIV: [] };
      var ca = CA0;
      for (var y = 0; y < 3; y++) {
        ca = Math.max(ca + 40, U.r0(ca * r.int(103, 125) / 100 / 40) * 40); p.CA.push(ca);
        p.R.push(U.r0(I * r.int(4, 18) / 100 / 5) * 5); p.DAP.push(U.r0(I * r.int(10, 20) / 100 / 5) * 5); p.DIV.push(r.int(0, 4) * 5);
      }
      if (p.E % p.nE) continue;
      var x = this.calc(p);
      if (x.ok === want) return p;
    }
    return p;
  },
  calc: function (p) {
    var x = { BFR: [], dBFR: [], CAF: [], RB: [], res: [], emp: [], solde: [], cumul: [] }, prev = U.r2(p.CA0 * p.j / 360), cum = 0;
    x.BFR0 = prev;
    for (var y = 0; y < 3; y++) {
      var b = U.r2(p.CA[y] * p.j / 360); x.BFR.push(b); x.dBFR.push(U.r2(b - prev)); prev = b;
      x.CAF.push(U.r2(p.R[y] + p.DAP[y])); x.RB.push(y === 0 ? 0 : U.r2(p.E / p.nE));
      var res = x.CAF[y] + (y === 0 ? p.AK + p.E + p.PCes : 0), emp = (y === 0 ? p.I : 0) + x.dBFR[y] + x.RB[y] + p.DIV[y];
      x.res.push(U.r2(res)); x.emp.push(U.r2(emp)); x.solde.push(U.r2(res - emp)); cum = U.r2(cum + res - emp); x.cumul.push(cum);
    }
    x.min = Math.min.apply(null, x.cumul); x.ok = x.min >= 0; x.besoin = x.ok ? 0 : U.r2(-x.min);
    return x;
  },
  solve: function (p) {
    var x = this.calc(p), n = U.n, A = this.ANS, t = { tol: 0.5 };
    var en = '<p>La société <b>' + p.nom + '</b> étudie le financement d’un programme d’investissement. Prévisions en milliers d’euros :</p>';
    var li = ['investissement de ' + n(p.I) + ' K€ au début de l’année N ;',
      'financement : ' + (p.AK ? 'augmentation de capital en numéraire de ' + n(p.AK) + ' K€ et ' : '') + 'emprunt de ' + n(p.E) + ' K€ souscrit en N, remboursable par fractions égales sur ' + p.nE + ' ans à partir de N+1 ;'];
    if (p.PCes) li.push('cession d’une machine ancienne en N pour ' + n(p.PCes) + ' K€, nette d’impôt ;');
    li.push('le BFR représente ' + p.j + ' jours de chiffre d’affaires HT ; chiffre d’affaires de N−1 : ' + n(p.CA0) + ' K€.');
    en += U.ul(li);
    var nn = function (v) { return n(v); };
    en += U.tbl(['K€'].concat(A), [['Chiffre d’affaires HT'].concat(p.CA.map(nn)), ['Résultat net prévisionnel'].concat(p.R.map(nn)), ['Dotations aux amortissements'].concat(p.DAP.map(nn)), ['Dividendes versés'].concat(p.DIV.map(nn))]);
    en += '<p class="consigne">1. Calculez la CAF prévisionnelle et la variation du BFR de chaque année. 2. Établissez le plan de financement de N à N+2. 3. Le plan est-il équilibré ? Proposez des solutions si nécessaire.</p>';
    var qs = [Q('caf0', 'CAF prévisionnelle de N (K€)', x.CAF[0], '€', t), Q('dbfr0', 'Augmentation du BFR en N (K€)', x.dBFR[0], '€', t), Q('res0', 'Total des ressources de N (K€)', x.res[0], '€', t), Q('emp0', 'Total des emplois de N (K€)', x.emp[0], '€', t),
      Q('s0', 'Solde de N (K€)', x.solde[0], '€', t), Q('s1', 'Solde de N+1 (K€)', x.solde[1], '€', t), Q('cum2', 'Solde cumulé à la fin de N+2 (K€)', x.cumul[2], '€', t),
      QC('eq', 'Le plan de financement est-il équilibré ?', ['Oui : le solde cumulé reste positif ou nul chaque année', 'Non : le solde cumulé devient négatif au moins une année'], x.ok ? 0 : 1)];
    var c = [['BFR de N−1', n(p.CA0) + ' × ' + p.j + ' ÷ 360', n(x.BFR0)]];
    for (var y = 0; y < 3; y++) c.push(['BFR de ' + A[y], n(p.CA[y]) + ' × ' + p.j + ' ÷ 360 = ' + n(x.BFR[y]) + ' ; variation ' + n(x.BFR[y]) + ' − ' + n(y ? x.BFR[y - 1] : x.BFR0), n(x.dBFR[y])]);
    c.push(['Remboursement annuel', n(p.E) + ' ÷ ' + p.nE, n(U.r2(p.E / p.nE))]);
    var row = function (lib, arr, cls) { var r = [lib].concat(arr.map(function (v) { return v ? n(v) : '—'; })); return cls ? { cls: cls, cells: r } : r; };
    var rows = [row('CAF prévisionnelle', x.CAF)];
    if (p.AK) rows.push(row('Augmentation de capital', [p.AK, 0, 0]));
    rows.push(row('Emprunt', [p.E, 0, 0]));
    if (p.PCes) rows.push(row('Cession d’immobilisation', [p.PCes, 0, 0]));
    rows.push(row('Total des ressources', x.res, 'tot'), row('Investissement', [p.I, 0, 0]), row('Augmentation du BFR', x.dBFR), row('Remboursement d’emprunt', x.RB), row('Dividendes', p.DIV), row('Total des emplois', x.emp, 'tot'));
    rows.push({ cls: 'tot', cells: ['Solde annuel'].concat(x.solde.map(function (v) { return n(v); })) }, { cls: 'tot', cells: ['Solde cumulé'].concat(x.cumul.map(function (v) { return n(v); })) });
    var pf = U.tbl(['Plan de financement (K€)'].concat(A), rows);
    var neg = A.filter(function (a, i) { return x.cumul[i] < 0; });
    var com = x.ok
      ? 'Le plan est équilibré : le solde cumulé reste positif chaque année et atteint ' + n(x.cumul[2]) + ' K€ fin N+2. L’année N, la plus lourde avec l’investissement et la hausse du BFR, ' + (x.solde[0] >= 0 ? 'dégage déjà un excédent de ' + n(x.solde[0]) + ' K€.' : 'reste couverte grâce aux ressources de départ.') + ' L’excédent cumulé pourrait servir à rembourser l’emprunt par anticipation, à réduire son montant ou à financer d’autres projets ; s’il est durable, il signale peut-être un financement surdimensionné.'
      : 'Le plan n’est pas équilibré : le solde cumulé est négatif en ' + listeEt(neg) + ', avec une insuffisance maximale de ' + n(x.besoin) + ' K€. Le projet ne peut être mené tel quel. Solutions : emprunter davantage (en tenant compte des remboursements supplémentaires), augmenter l’apport en capital, réduire ou différer les dividendes, étaler l’investissement, recourir au crédit-bail, ou réduire le BFR (délais clients, stocks).';
    com += ' La hausse du BFR (' + n(x.dBFR.reduce(function (a, b) { return a + b; }, 0)) + ' K€ sur trois ans) est souvent oubliée : la croissance du chiffre d’affaires consomme de la trésorerie avant d’en rapporter.';
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Calculs préparatoires', html: U.calc(c) }, { h: 'Plan de financement', html: pf }], comment: com };
  }
};

/* ---------- 22. Budget et plan de trésorerie ---------- */
T.plan_treso = {
  id: 'plan_treso', nom: 'Budget et plan de trésorerie', famille: 'Analyse financière', ctrl: false, minutes: 25,
  fiche: {
    objectif: 'Prévoir mois par mois les encaissements et les décaissements, TTC et à leur date réelle, pour anticiper les besoins et les excédents de trésorerie.',
    etapes: [
      'Budget des encaissements : ventes TTC selon les délais clients (comptant, à 30 jours…), créances du bilan d’ouverture, emprunts reçus, cessions.',
      'Budget de TVA : TVA collectée du mois − TVA déductible du mois (achats, charges, immobilisations) − crédit antérieur ; la TVA due est payée le mois suivant.',
      'Budget des décaissements : achats TTC selon les délais fournisseurs, dettes du bilan d’ouverture, salaires nets, charges sociales (payées le mois suivant), charges TTC, investissements TTC, TVA à décaisser, échéances d’emprunt.',
      'Plan de trésorerie : trésorerie de fin de mois = trésorerie de début + encaissements − décaissements.'
    ],
    pieges: [
      'Raisonner en HT : le budget de trésorerie est en TTC (sauf salaires, charges sociales et TVA à décaisser elle-même).',
      'Payer la TVA du mois dans le même mois : elle est versée le mois suivant.',
      'Oublier les créances et dettes du bilan d’ouverture, encaissées ou payées en début de période.',
      'Laisser un mois négatif sans solution : découvert autorisé, escompte ou affacturage, report d’une dépense ; un excédent durable se place.'
    ],
    comptes: []
  },
  MOIS: ['janvier', 'février', 'mars'],
  gen: function (r) {
    var base = r.int(20, 120) * 1000, V = [], A = [];
    for (var m = 0; m < 3; m++) { var v = U.r0(base * r.int(85, 120) / 100 / 100) * 100; V.push(v); A.push(U.r0(v * r.int(40, 65) / 100 / 100) * 100); }
    var p = { nom: U.nom(r), V: V, A: A, a: r.pick([0.3, 0.4, 0.5, 0.6]), Cd: U.r0(base * r.int(30, 70) / 100 / 100) * 120, Fd: U.r0(base * r.int(25, 50) / 100 / 100) * 120, Td: U.r0(base * r.int(5, 12) / 100 / 10) * 10,
      S: U.r0(base * r.int(10, 20) / 100 / 100) * 100, L: r.int(5, 40) * 100, T0: r.int(-5, 30) * 1000 };
    p.CS = U.r0(p.S * r.int(40, 60) / 100 / 10) * 10; p.CSd = p.CS;
    if (r.chance(0.6)) { p.I = r.int(5, 60) * 1000; p.mI = r.int(0, 2); }
    if (r.chance(0.5)) { p.R = r.int(10, 60) * 100; p.mR = r.int(1, 2); }
    if (r.chance(0.3)) { p.E = r.int(10, 50) * 1000; p.mE = r.int(0, 2); }
    return p;
  },
  calc: function (p) {
    var x = { enc: [], dec: [], tva: [], tvaPaid: [], fin: [], encD: [], decD: [] }, credit = 0, tr = p.T0;
    for (var m = 0; m < 3; m++) {
      var comptant = U.r2(p.V[m] * 1.2 * p.a), terme = m === 0 ? p.Cd : U.r2(p.V[m - 1] * 1.2 * (1 - p.a)), emp = p.E && p.mE === m ? p.E : 0;
      x.encD.push({ terme: terme, comptant: comptant, emp: emp }); x.enc.push(U.r2(terme + comptant + emp));
      var coll = U.r2(p.V[m] * 0.2), dedAbs = U.r2((p.A[m] + p.L) * 0.2), dedImmo = p.I && p.mI === m ? U.r2(p.I * 0.2) : 0;
      var due = U.r2(coll - dedAbs - dedImmo - credit), pay = due > 0 ? due : 0;
      x.tva.push({ coll: coll, dedAbs: dedAbs, dedImmo: dedImmo, credit: credit, due: due, pay: pay });
      credit = due < 0 ? -due : 0;
      x.tvaPaid.push(m === 0 ? p.Td : x.tva[m - 1].pay);
      var d = { fou: m === 0 ? p.Fd : U.r2(p.A[m - 1] * 1.2), sal: p.S, cs: m === 0 ? p.CSd : p.CS, loyer: U.r2(p.L * 1.2), immo: p.I && p.mI === m ? U.r2(p.I * 1.2) : 0, tva: x.tvaPaid[m], ech: p.R && p.mR === m ? p.R : 0 };
      x.decD.push(d); x.dec.push(U.r2(d.fou + d.sal + d.cs + d.loyer + d.immo + d.tva + d.ech));
      tr = U.r2(tr + x.enc[m] - x.dec[m]); x.fin.push(tr);
    }
    x.min = Math.min.apply(null, x.fin);
    return x;
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n, M = this.MOIS, pc = Math.round(p.a * 100);
    var en = '<p>La société <b>' + p.nom + '</b> prépare son budget de trésorerie du premier trimestre N+1 (TVA au taux de 20 % sur toutes les opérations).</p>';
    en += U.tbl(['Prévisions HT', 'Janvier', 'Février', 'Mars'], [['Ventes'].concat(p.V.map(function (v) { return n(v); })), ['Achats de marchandises'].concat(p.A.map(function (v) { return n(v); }))]);
    var li = ['clients : ' + pc + ' % au comptant, le reste à 30 jours (encaissé le mois suivant) ; fournisseurs : paiement à 30 jours ;',
      'salaires nets : ' + e(p.S) + ' par mois, payés le mois même ; charges sociales : ' + e(p.CS) + ' par mois, payées le mois suivant ;',
      'loyer : ' + e(p.L) + ' HT par mois, payé le mois même ;'];
    if (p.I) li.push('achat d’une machine de ' + e(p.I) + ' HT, payée comptant en ' + M[p.mI] + ' ;');
    if (p.E) li.push('emprunt de ' + e(p.E) + ' encaissé en ' + M[p.mE] + ' ;');
    if (p.R) li.push('échéance d’emprunt de ' + e(p.R) + ' en ' + M[p.mR] + ' ;');
    li.push('la TVA due au titre d’un mois est payée le mois suivant ; un crédit de TVA est imputé sur le mois suivant.');
    en += U.ul(li);
    en += '<p>Au 31/12/N : créances clients ' + e(p.Cd) + ' et dettes fournisseurs ' + e(p.Fd) + ' (TTC, réglées en janvier), TVA à décaisser de décembre ' + e(p.Td) + ', charges sociales de décembre ' + e(p.CSd) + ' ; trésorerie ' + (p.T0 < 0 ? 'débitrice' : 'disponible') + ' au 1er janvier : ' + e(p.T0) + '.</p>';
    en += '<p class="consigne">1. Établissez le budget des encaissements. 2. Établissez le budget de TVA. 3. Établissez le budget des décaissements, puis le plan de trésorerie, et commentez.</p>';
    var qs = [];
    M.forEach(function (mo, i) { qs.push(Q('enc' + i, 'Encaissements de ' + mo, x.enc[i], '€')); });
    qs.push(Q('tva1', 'TVA payée en février (TVA due de janvier)', x.tvaPaid[1], '€'));
    M.forEach(function (mo, i) { qs.push(Q('dec' + i, 'Décaissements de ' + mo, x.dec[i], '€')); });
    M.forEach(function (mo, i) { qs.push(Q('fin' + i, 'Trésorerie fin ' + mo, x.fin[i], '€')); });
    var col = function (f) { return x.encD.map(function (d) { return f(d) ? n(f(d)) : '—'; }); };
    var encRows = [['Créances clients au 31/12', n(p.Cd), '—', '—']];
    for (var m = 0; m < 3; m++) {
      var r1 = ['Ventes de ' + M[m] + ' (' + n(p.V[m]) + ' HT, ' + n(U.r2(p.V[m] * 1.2)) + ' TTC)', '—', '—', '—'];
      r1[m + 1] = n(x.encD[m].comptant); if (m < 2) r1[m + 2] = n(U.r2(p.V[m] * 1.2 * (1 - p.a)));
      encRows.push(r1);
    }
    if (p.E) encRows.push(['Emprunt'].concat(col(function (d) { return d.emp; })));
    encRows.push({ cls: 'tot', cells: ['Total des encaissements'].concat(x.enc.map(function (v) { return n(v); })) });
    var be = U.tbl(['Encaissements', 'Janvier', 'Février', 'Mars'], encRows);
    var tv = function (k) { return x.tva.map(function (t) { return t[k] ? n(t[k]) : '—'; }); };
    var tvRows = [['TVA collectée'].concat(tv('coll')), ['− TVA déductible sur achats et loyer'].concat(tv('dedAbs'))];
    if (p.I) tvRows.push(['− TVA déductible sur immobilisation'].concat(tv('dedImmo')));
    if (x.tva.some(function (t) { return t.credit; })) tvRows.push(['− Crédit du mois précédent'].concat(tv('credit')));
    tvRows.push({ cls: 'tot', cells: ['TVA due (crédit si négatif)'].concat(x.tva.map(function (t) { return n(t.due); })) }, ['Paiement'].concat(x.tva.map(function (t, i) { return t.due > 0 ? 'en ' + ['février', 'mars', 'avril'][i] : 'crédit reporté'; })));
    var bt = U.tbl(['Budget de TVA', 'Janvier', 'Février', 'Mars'], tvRows);
    var dc = function (k) { return x.decD.map(function (d) { return d[k] ? n(d[k]) : '—'; }); };
    var decRows = [['Fournisseurs (achats du mois précédent TTC)'].concat(dc('fou')), ['Salaires nets'].concat(dc('sal')), ['Charges sociales du mois précédent'].concat(dc('cs')), ['Loyer TTC'].concat(dc('loyer'))];
    if (p.I) decRows.push(['Machine TTC'].concat(dc('immo')));
    decRows.push(['TVA à décaisser'].concat(dc('tva')));
    if (p.R) decRows.push(['Échéance d’emprunt'].concat(dc('ech')));
    decRows.push({ cls: 'tot', cells: ['Total des décaissements'].concat(x.dec.map(function (v) { return n(v); })) });
    var bd = U.tbl(['Décaissements', 'Janvier', 'Février', 'Mars'], decRows);
    var deb = [p.T0].concat(x.fin.slice(0, 2));
    var pt = U.tbl(['Plan de trésorerie', 'Janvier', 'Février', 'Mars'], [['Trésorerie de début de mois'].concat(deb.map(function (v) { return n(v); })), ['+ Encaissements'].concat(x.enc.map(function (v) { return n(v); })), ['− Décaissements'].concat(x.dec.map(function (v) { return n(v); })), { cls: 'tot', cells: ['Trésorerie de fin de mois'].concat(x.fin.map(function (v) { return n(v); })) }]);
    var neg = M.filter(function (mo, i) { return x.fin[i] < 0; });
    var com = neg.length
      ? 'La trésorerie devient négative en ' + listeEt(neg) + ', avec un découvert maximal de ' + e(-x.min) + '. L’entreprise doit l’anticiper dès maintenant : négocier un découvert autorisé ou une facilité de caisse, mobiliser ses créances (escompte, affacturage, Dailly), décaler une dépense non urgente' + (p.I ? ' comme la machine, ou la financer par emprunt ou crédit-bail plutôt que comptant' : '') + ', ou obtenir de meilleurs délais fournisseurs. Un découvert subi coûte plus cher qu’un financement négocié à l’avance.'
      : 'La trésorerie reste positive tout le trimestre et atteint ' + e(x.fin[2]) + ' fin mars. ' + (x.min > p.V[0] ? 'L’excédent est confortable : une partie peut être placée à court terme (compte à terme) plutôt que de dormir sur le compte courant.' : 'La marge reste cependant étroite : un retard de paiement d’un gros client suffirait à faire passer le compte à découvert.');
    com += ' Le budget fait apparaître des décalages que le compte de résultat ignore : les ventes ne sont encaissées qu’en partie le mois même, la TVA est reversée le mois suivant' + (p.I ? ' et l’investissement pèse en totalité sur le mois de paiement, TVA comprise, alors qu’il ne sera amorti que progressivement' : '') + '.';
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Budget des encaissements', html: be }, { h: 'Budget de TVA', html: bt }, { h: 'Budget des décaissements', html: bd }, { h: 'Plan de trésorerie', html: pt }], comment: com };
  }
};
