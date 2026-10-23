/* ===== Impôt sur les sociétés, opérations en devises (option inspecteur) ===== */

/* ---------- 16. Impôt sur les sociétés ---------- */
T.is = {
  id: 'is', nom: 'Impôt sur les sociétés', famille: 'Fiscalité', ctrl: false, minutes: 15,
  fiche: {
    objectif: 'Passer du résultat comptable au résultat fiscal, calculer l’IS (taux réduit PME), les acomptes et le solde, puis comptabiliser.',
    etapes: [
      'Résultat fiscal = résultat comptable avant IS + réintégrations − déductions (tableau 2058-A, hors comptabilité).',
      'Réintégrations usuelles : amendes et pénalités, taxes sur les véhicules de tourisme, amortissement excédentaire des véhicules de tourisme (au-delà du plafond fixé selon les émissions de CO2), dépenses somptuaires, quote-part de frais et charges de 5 % sur les dividendes mère-fille, l’IS lui-même s’il est déjà comptabilisé.',
      'Déductions usuelles : dividendes relevant du régime mère-fille (participation d’au moins 5 %).',
      'Taux : 25 % ; PME (CA HT < 10 M€, capital entièrement libéré et détenu à 75 % au moins par des personnes physiques) : 15 % jusqu’à 42 500 € de bénéfice.',
      'Quatre acomptes (15 mars, 15 juin, 15 septembre, 15 décembre), puis solde le 15 mai N+1 pour un exercice clos le 31/12.',
      'Écritures : acomptes D 444 / C 512 ; IS de l’exercice D 695 / C 444 ; solde D 444 / C 512.'
    ],
    pieges: [
      'Réintégrer l’IS alors que le résultat est donné « avant impôt ».',
      'Déduire 100 % des dividendes mère-fille sans réintégrer la quote-part de 5 %.',
      'Appliquer le taux de 15 % à une société détenue par une holding.',
      'Calculer l’amortissement excédentaire sur la valeur HT d’un véhicule de tourisme (TVA non récupérable : coût TTC).'
    ],
    comptes: ['444 État – impôts sur les bénéfices', '695 Impôts sur les bénéfices', '512 Banque']
  },
  gen: function (r) {
    var pme = r.chance(0.55);
    var RC = r.int(20, 600) * 1000 + r.int(0, 9) * 100;
    var p = { nom: U.nom(r), RC: RC, CA: pme ? r.int(10, 95) * 100000 : r.int(30, 300) * 100000, pme: pme, detention: pme ? 'des personnes physiques' : r.pick(['une société holding à hauteur de 60 %', 'un groupe industriel à hauteur de 80 %']) };
    if (!pme && p.CA < 10000000 && r.chance(0.5)) p.detention = 'une société holding à hauteur de 60 %';
    p.amendes = r.chance(0.6) ? r.int(2, 30) * 100 : 0;
    p.tvs = r.chance(0.5) ? r.int(5, 40) * 100 : 0;
    p.vp = r.chance(0.6) ? { P: r.int(35, 70) * 1000, plaf: 18300 } : null;
    p.somp = r.chance(0.3) ? r.int(10, 60) * 100 : 0;
    p.div = r.chance(0.5) ? Math.min(r.int(5, 80) * 1000, U.r0(RC * 0.5 / 1000) * 1000) : 0;
    p.isN1 = U.r0(RC * r.int(15, 28) / 100 / 4) * 4;
    return p;
  },
  calc: function (p) {
    var vpR = p.vp ? U.r2((p.vp.P - p.vp.plaf) / 5) : 0, qp = U.r2(p.div * 0.05);
    var reint = U.r2(p.amendes + p.tvs + vpR + p.somp + qp), ded = p.div;
    var RF = U.r2(p.RC + reint - ded);
    var IS = RF <= 0 ? 0 : (p.pme ? U.r0(Math.min(RF, 42500) * 0.15 + Math.max(0, RF - 42500) * 0.25) : U.r0(RF * 0.25));
    var ac = U.r2(p.isN1 / 4), acT = U.r2(ac * 4), solde = U.r2(IS - acT), RN = U.r2(p.RC - IS);
    return { vpR: vpR, qp: qp, reint: reint, ded: ded, RF: RF, IS: IS, ac: ac, acT: acT, solde: solde, RN: RN };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n, L = U.L;
    var en = '<p>La société anonyme <b>' + p.nom + '</b> (exercice du 01/01 au 31/12/N) réalise un chiffre d’affaires HT de ' + e(p.CA) + '. Son capital, entièrement libéré, est détenu par ' + p.detention + '. Le résultat comptable avant impôt de N s’élève à ' + e(p.RC) + '. Il comprend notamment :</p>';
    var li = [];
    if (p.amendes) li.push('des amendes et pénalités pour ' + e(p.amendes) + ' ;');
    if (p.tvs) li.push('des taxes annuelles sur les véhicules de tourisme pour ' + e(p.tvs) + ' ;');
    if (p.vp) li.push('l’amortissement linéaire sur 5 ans d’une voiture de tourisme acquise ' + e(p.vp.P) + ' TTC le 01/01/N-1 (plafond de déductibilité : ' + e(p.vp.plaf) + ') ;');
    if (p.somp) li.push('des frais de chasse offerts à des clients pour ' + e(p.somp) + ' ;');
    if (p.div) li.push('des dividendes de ' + e(p.div) + ' reçus d’une filiale détenue à 30 % depuis six ans (régime mère-fille) ;');
    if (!li.length) li.push('aucune charge non déductible particulière ;');
    en += U.ul(li) + '<p>L’IS de N-1 s’élevait à ' + e(p.isN1) + ' ; quatre acomptes égaux de ' + e(x.ac) + ' ont été versés en N.</p>';
    en += '<p class="consigne">1. Déterminez le résultat fiscal et l’impôt sur les sociétés de N. 2. Calculez le solde à verser le 15/05/N+1. 3. Passez les écritures du premier acompte, de l’IS au 31/12/N et du solde.</p>';
    var qs = [Q('re', 'Total des réintégrations', x.reint, '€'), Q('de', 'Total des déductions', x.ded, '€'), Q('rf', 'Résultat fiscal', x.RF, '€'), Q('is', 'Impôt sur les sociétés de N', x.IS, '€', { tol: 2 }), Q('so', 'Solde à verser (négatif si excédent)', x.solde, '€', { tol: 2 }), Q('rn', 'Résultat net comptable', x.RN, '€', { tol: 2 })];
    var c = [];
    if (p.amendes) c.push(['Amendes et pénalités', 'non déductibles', '+ ' + e(p.amendes)]);
    if (p.tvs) c.push(['Taxes sur véhicules de tourisme', 'non déductibles', '+ ' + e(p.tvs)]);
    if (p.vp) c.push(['Amortissement excédentaire', '(' + n(p.vp.P) + ' − ' + n(p.vp.plaf) + ') ÷ 5', '+ ' + e(x.vpR)]);
    if (p.somp) c.push(['Dépenses somptuaires (chasse)', 'non déductibles', '+ ' + e(p.somp)]);
    if (p.div) { c.push(['Quote-part de frais et charges', n(p.div) + ' × 5 %', '+ ' + e(x.qp)]); c.push(['Dividendes mère-fille', 'déduction', '− ' + e(p.div)]); }
    c.push(['Résultat fiscal', n(p.RC) + ' + ' + n(x.reint) + ' − ' + n(x.ded), '<b>' + e(x.RF) + '</b>']);
    c.push(['IS', p.pme ? (x.RF > 42500 ? '42 500 × 15 % + ' + n(x.RF - 42500) + ' × 25 %' : n(x.RF) + ' × 15 %') + ' (PME : CA < 10 M€, capital libéré, détenu par des personnes physiques)' : n(x.RF) + ' × 25 % (pas de taux réduit : ' + (p.CA >= 10000000 ? 'CA ≥ 10 M€' : 'capital détenu par une société') + ')', '<b>' + e(x.IS) + '</b>']);
    c.push(['Solde', n(x.IS) + ' − 4 × ' + n(x.ac), e(x.solde)]);
    c.push(['Résultat net', n(p.RC) + ' − ' + n(x.IS), e(x.RN)]);
    var journal = [U.entry('15/03/N', 'Premier acompte d’IS', [L('444', x.ac, 0), L('512', 0, x.ac)]), U.entry('31/12/N', 'Impôt sur les sociétés de N', [L('695', x.IS, 0), L('444', 0, x.IS)])];
    if (x.solde > 0) journal.push(U.entry('15/05/N+1', 'Paiement du solde d’IS', [L('444', x.solde, 0), L('512', 0, x.solde)]));
    if (x.solde < 0) journal.push(U.entry('15/05/N+1', 'Remboursement de l’excédent d’acomptes', [L('512', -x.solde, 0), L('444', 0, -x.solde)]));
    var com = 'Le résultat fiscal (' + e(x.RF) + ') diffère du résultat comptable (' + e(p.RC) + ') car la loi fiscale refuse la déduction de certaines charges et exonère certains produits ; ces retraitements sont opérés de façon extra-comptable sur le tableau 2058-A, sans modifier la comptabilité. ' + (p.div ? 'Le régime mère-fille évite une double imposition des bénéfices de la filiale : seule une quote-part de 5 % reste taxée. ' : '') + (p.pme ? 'La société remplit les conditions du taux réduit de 15 % jusqu’à 42 500 € de bénéfice, ce qui allège son impôt de ' + e(U.r0(Math.min(x.RF, 42500) * 0.10)) + ' par rapport au taux normal. ' : 'Elle ne remplit pas les conditions du taux réduit et supporte le taux normal de 25 %. ') + 'Le taux effectif d’imposition rapporté au résultat comptable atteint ' + U.pc(x.IS / p.RC, 1) + '. Les acomptes, calculés sur l’impôt de N-1, ' + (x.solde >= 0 ? 'sont inférieurs à l’impôt de N : un solde de ' + e(x.solde) + ' sera versé le 15 mai N+1.' : 'dépassent l’impôt de N : l’excédent de ' + e(-x.solde) + ' sera remboursé ou imputé.') + ' L’IS est une dette hors exploitation dans le bilan fonctionnel et vient en déduction de la CAF.';
    return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Passage au résultat fiscal et calcul de l’IS', html: U.calc(c) }], comment: com };
  }
};

/* ---------- 17. Opérations en devises ---------- */
T.devises = {
  id: 'devises', nom: 'Opérations en devises', famille: 'Opérations courantes', ctrl: false, minutes: 15,
  fiche: {
    objectif: 'Enregistrer une créance ou une dette en devises, l’évaluer à la clôture et constater le résultat de change au règlement.',
    etapes: [
      'À l’opération : conversion au cours du jour (si 1 € = c devises, montant en euros = montant en devises ÷ c).',
      'À la clôture : réévaluation au cours du 31/12 ; l’écart est inscrit en différence de conversion : 476 (actif) si perte latente, 477 (passif) si gain latent.',
      'Perte latente : provision pour perte de change, D 6865 / C 1515. Gain latent : jamais en produit (prudence).',
      'À l’ouverture de N+1 : contrepassation des écarts de conversion.',
      'Au règlement : écart entre la valeur d’origine et la somme réellement encaissée ou payée → 656 perte de change ou 756 gain de change (opérations commerciales) ; reprise de la provision D 1515 / C 7865.'
    ],
    pieges: [
      'Sens du cours : avec « 1 € = 1,10 USD », on divise par le cours ; une hausse du cours (euro plus fort) diminue la valeur en euros.',
      'Créance : la baisse de sa valeur en euros est une perte ; dette : la hausse est une perte.',
      'Comptabiliser le gain latent en produit.',
      'Opération commerciale : 656 / 756 (opération financière : 666 / 766).'
    ],
    comptes: ['411 / 401 Clients / Fournisseurs', '476 / 477 Différences de conversion', '6865 / 1515 Provision pour perte de change', '7865 Reprise', '656 / 756 Pertes et gains de change']
  },
  gen: function (r) {
    var dev = r.pick([['USD', 1.05, 1.22], ['GBP', 0.82, 0.90], ['CHF', 0.91, 1.00]]);
    var c0 = U.rd(dev[1] + (dev[2] - dev[1]) * r.f(), 4), c1, c2;
    do { c1 = U.rd(c0 * (1 + (r.f() - 0.5) * 0.12), 4); } while (Math.abs(c1 - c0) / c0 < 0.01);
    do { c2 = U.rd(c1 * (1 + (r.f() - 0.5) * 0.08), 4); } while (Math.abs(c2 - c0) / c0 < 0.005);
    return { nom: U.nom(r), sens: r.pick(['vente', 'achat']), dev: dev[0], X: r.int(10, 400) * 1000, c0: c0, c1: c1, c2: c2, d0: { d: r.int(2, 28), m: r.int(10, 12) }, dR: { d: r.int(5, 28), m: r.int(1, 3) } };
  },
  calc: function (p) {
    var V0 = U.r2(p.X / p.c0), V1 = U.r2(p.X / p.c1), V2 = U.r2(p.X / p.c2);
    var ecart = U.r2(V1 - V0);
    var perteLat = p.sens === 'vente' ? ecart < 0 : ecart > 0;
    var res = p.sens === 'vente' ? U.r2(V2 - V0) : U.r2(V0 - V2);
    return { V0: V0, V1: V1, V2: V2, ecart: Math.abs(ecart), perteLat: perteLat, prov: perteLat ? Math.abs(ecart) : 0, res: res };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n, L = U.L, D = p.dev, vente = p.sens === 'vente';
    var d0 = U.dt(p.d0.d, p.d0.m), dR = U.dt(p.dR.d, p.dR.m, 1);
    var en = '<p>La société <b>' + p.nom + '</b> ' + (vente ? 'vend des marchandises à un client établi hors de l’Union européenne' : 'achète des marchandises à un fournisseur établi hors de l’Union européenne') + ' le ' + d0 + ' pour ' + n(p.X) + ' ' + D + ', payables le ' + dR + '. On ne tient pas compte de la TVA.</p>';
    en += U.tbl(['Date', 'Cours'], [[d0, '1 € = ' + n(p.c0, 4) + ' ' + D], ['31/12/N', '1 € = ' + n(p.c1, 4) + ' ' + D], [dR, '1 € = ' + n(p.c2, 4) + ' ' + D]]);
    en += '<p class="consigne">1. Comptabilisez l’opération du ' + d0 + '. 2. Évaluez ' + (vente ? 'la créance' : 'la dette') + ' au 31/12/N et passez les écritures d’inventaire. 3. Comptabilisez le règlement du ' + dR + ' (après contrepassation des écarts de conversion).</p>';
    var qs = [Q('v0', 'Valeur en euros à l’origine', x.V0, '€'), Q('v1', 'Valeur en euros au 31/12/N', x.V1, '€'), Q('ec', 'Écart de conversion (montant)', x.ecart, '€'), QC('nat', 'Nature de l’écart', ['Perte latente (476)', 'Gain latent (477)'], x.perteLat ? 0 : 1), Q('pr', 'Provision pour perte de change', x.prov, '€'), Q('rs', 'Résultat de change au règlement (+ gain, − perte)', x.res, '€')];
    var c = [['Valeur d’origine', n(p.X) + ' ÷ ' + n(p.c0, 4), e(x.V0)], ['Valeur au 31/12', n(p.X) + ' ÷ ' + n(p.c1, 4), e(x.V1)], ['Écart', (vente ? 'créance ' : 'dette ') + (x.V1 > x.V0 ? 'en hausse' : 'en baisse') + ' de ' + n(x.ecart), x.perteLat ? 'perte latente' : 'gain latent'], ['Provision', x.perteLat ? 'égale à la perte latente' : 'aucune (gain latent non comptabilisé)', e(x.prov)], ['Montant réglé', n(p.X) + ' ÷ ' + n(p.c2, 4), e(x.V2)], ['Résultat de change', vente ? n(x.V2) + ' − ' + n(x.V0) : n(x.V0) + ' − ' + n(x.V2), '<b>' + (x.res >= 0 ? 'gain ' : 'perte ') + e(Math.abs(x.res)) + '</b>']];
    var J = [];
    J.push(vente ? U.entry(d0, 'Vente à l’exportation', [L('411', x.V0, 0), L('707', 0, x.V0)]) : U.entry(d0, 'Achat à l’importation', [L('607', x.V0, 0), L('401', 0, x.V0)]));
    var tiers = vente ? '411' : '401';
    if (x.perteLat) {
      J.push(U.entry('31/12/N', 'Écart de conversion (perte latente)', vente ? [L('476', x.ecart, 0), L('411', 0, x.ecart)] : [L('476', x.ecart, 0), L('401', 0, x.ecart)]));
      J.push(U.entry('31/12/N', 'Provision pour perte de change', [L('6865', x.prov, 0), L('1515', 0, x.prov)]));
    } else {
      J.push(U.entry('31/12/N', 'Écart de conversion (gain latent)', vente ? [L('411', x.ecart, 0), L('477', 0, x.ecart)] : [L('401', x.ecart, 0), L('477', 0, x.ecart)]));
    }
    var reg = vente ? [L('512', x.V2, 0), L('656', x.res < 0 ? -x.res : 0, 0), L('411', 0, x.V0), L('756', 0, x.res > 0 ? x.res : 0)]
      : [L('401', x.V0, 0), L('656', x.res < 0 ? -x.res : 0, 0), L('512', 0, x.V2), L('756', 0, x.res > 0 ? x.res : 0)];
    J.push(U.entry(dR, 'Règlement', reg));
    if (x.prov) J.push(U.entry(dR, 'Reprise de la provision pour perte de change', [L('1515', x.prov, 0), L('7865', 0, x.prov)]));
    var com = 'Une opération en devises expose l’entreprise au risque de change entre la date de l’opération et celle du règlement. À la clôture, ' + (vente ? 'la créance' : 'la dette') + ' est réévaluée au cours du 31/12 pour donner une image fidèle du bilan, mais l’écart n’est pas encore réalisé : il est inscrit en compte d’attente (' + (x.perteLat ? '476' : '477') + ') et n’affecte pas directement le résultat. ' + (x.perteLat ? 'S’agissant d’une perte latente, la prudence impose de constituer une provision de ' + e(x.prov) + ', qui réduit le résultat de N.' : 'S’agissant d’un gain latent, il n’est pas comptabilisé en produit : la prudence interdit de constater un gain non réalisé.') + ' Les écarts de conversion sont contrepassés à l’ouverture de N+1 et le résultat de change réel n’apparaît qu’au règlement : ' + (x.res >= 0 ? 'un gain' : 'une perte') + ' de ' + e(Math.abs(x.res)) + ', en compte ' + (x.res >= 0 ? '756' : '656') + ' pour une opération commerciale. ' + (x.prov ? 'La provision devenue sans objet est reprise. ' : '') + 'Pour se protéger, l’entreprise peut facturer en euros, couvrir l’opération par une vente ou un achat à terme de devises, ou recourir à des options de change.';
    return { enonce: en, questions: qs, journal: J, steps: [{ h: 'Calculs', html: U.calc(c) }], comment: com };
  }
};
