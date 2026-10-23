/* ===== Trésorerie et financement : état de rapprochement, emprunt, subvention d'investissement ===== */
(function () {
  var P = U.PCG, A = U.ALT;
  P['164'] = 'Emprunts auprès des établissements de crédit'; P['627'] = 'Services bancaires et assimilés'; P['6616'] = 'Intérêts bancaires et sur opérations de financement (agios)';
  P['768'] = 'Autres produits financiers'; P['5113'] = 'Effets à l’encaissement'; P['413'] = 'Clients – effets à recevoir'; P['531'] = 'Caisse'; P['58'] = 'Virements internes';
  P['131'] = 'Subventions d’équipement'; P['139'] = 'Subventions d’investissement inscrites au compte de résultat';
  P['777'] = 'Quote-part des subventions d’investissement virée au résultat de l’exercice'; P['441'] = 'État et autres collectivités publiques – subventions à recevoir';
  A['164'] = ['1641', '16']; A['627'] = ['6278', '6275']; A['6616'] = ['661', '6615', '6611']; A['768'] = ['7688', '764', '76'];
  A['5113'] = ['511', '5114']; A['131'] = ['1311', '1312', '13']; A['139'] = ['1391', '13911']; A['441'] = ['4411', '4418'];
})();

/* ---------- 1. Opérations de trésorerie et état de rapprochement ---------- */
T.rapprochement = {
  id: 'rapprochement', nom: 'Opérations de trésorerie et état de rapprochement', famille: 'Opérations courantes', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Expliquer l’écart entre le compte 512 de l’entreprise et le relevé de la banque, établir l’état de rapprochement et passer les écritures de régularisation.',
    cours: [
      { t: 'Le compte 512 et le relevé bancaire', l: [
        'Réciprocité : le compte de l’entreprise chez la banque est la « copie inversée » du compte 512. Un encaissement est un débit du 512 chez l’entreprise et un crédit du compte chez la banque ; un décaissement, l’inverse.',
        'Solde normal : le 512 est débiteur (l’entreprise a de l’argent en banque) et le relevé est créditeur. Un 512 créditeur signale un découvert (concours bancaire courant au passif).',
        'Décalages : les deux comptes enregistrent les mêmes opérations, mais pas au même moment (délai d’encaissement d’un chèque, information reçue avec le relevé) ; d’où des écarts à expliquer en fin de mois.'
      ] },
      { t: 'Les opérations de trésorerie', l: [
        'Chèque émis : C 512 à l’émission chez l’entreprise ; la banque ne débite qu’à la présentation par le bénéficiaire.',
        'Remise de chèques : D 512 au dépôt ; la banque crédite après quelques jours.',
        'Virement et prélèvement : connus souvent par le relevé ; prélèvement en règlement d’une dette D 401 (ou 616, 6061…) / C 512 ; virement d’un client D 512 / C 411.',
        'Effets de commerce : la lettre de change relevé (LCR) acceptée passe au 413 ; remise à l’encaissement D 5113 / C 413 ; encaissement D 512 + 627 (commission) + 44566 / C 5113 ; escompte : D 5114 puis D 512 + 6615 + 627 / C 5114.',
        'Caisse (531) : espèces, solde toujours débiteur ou nul. Virements internes (58) : compte de passage entre deux comptes de trésorerie (caisse → banque, banque A → banque B), soldé dès que les deux mouvements sont passés.',
        'Frais et intérêts : services bancaires 627 (commissions soumises à la TVA si l’énoncé l’indique), agios 6616 (pas de TVA), intérêts créditeurs 768.'
      ] }
    ],
    etapes: [
      'Pointer : rapprocher une à une les opérations du compte 512 et du relevé ; seules les opérations non pointées expliquent l’écart.',
      'Repérer de quel côté manque chaque opération : ce qui figure au relevé et pas en comptabilité se corrige dans la colonne de l’entreprise ; ce qui figure en comptabilité et pas au relevé se corrige dans la colonne de la banque.',
      'Colonne entreprise (compte 512) : partir du solde débiteur, ajouter au débit les encaissements ignorés (virements reçus, intérêts, effets encaissés), porter au crédit les décaissements ignorés (prélèvements, frais, agios) et les erreurs.',
      'Colonne banque (compte de l’entreprise chez la banque) : partir du solde créditeur, porter au débit les chèques émis non encore présentés, au crédit les remises non encore créditées.',
      'Les deux soldes rectifiés doivent être égaux : c’est le solde réel de la trésorerie. S’ils diffèrent, une opération a été oubliée ou classée du mauvais côté.',
      'Passer en comptabilité uniquement les écritures de la colonne entreprise (jamais celles de la colonne banque, qui se dénouent seules le mois suivant).'
    ],
    pieges: [
      'Inverser les sens : chez la banque, un encaissement de l’entreprise est un crédit.',
      'Passer une écriture pour un chèque émis non encaissé : il est déjà comptabilisé, c’est la banque qui est en retard.',
      'Oublier la TVA déductible sur les commissions bancaires soumises à la TVA, ou en mettre sur des agios (intérêts exonérés).',
      'Erreur de saisie (chiffres inversés) : corriger seulement la différence, dans le bon sens, en contrepartie du compte de tiers concerné.',
      'Comptabiliser le montant net d’une LCR encaissée au 5113 : on solde le 5113 pour le nominal et on constate la commission à part.'
    ],
    comptes: ['512 Banque', '531 Caisse', '58 Virements internes', '411 / 401 Clients / Fournisseurs', '413 / 5113 Effets à recevoir / à l’encaissement', '627 Services bancaires', '6616 Agios', '768 Autres produits financiers', '44566 TVA déductible']
  },
  gen: function (r) {
    var CLI = ['Durand SA', 'Lemoine SARL', 'Garnier et fils', 'Société Perrin', 'Rousseau Distribution', 'Ets Faure', 'Morel Industrie'];
    var FOU = ['Fournitures Blanc', 'Transports Mercier', 'Atelier Fontaine', 'Papeterie Chevalier', 'Bois et Matériaux Roux', 'Imprimerie Girard'];
    var c = function (a, b) { return U.r2(r.int(a * 100, b * 100) / 100); };
    for (var essai = 0; essai < 300; essai++) {
      var M = r.int(1, 12), fin = U.lastDay(M);
      var p = { nom: U.nom(r), M: M, R: c(5000, 60000), chq: [], rem: [], banque: [] };
      var nch = r.int(1, 2), fous = r.shuffle(FOU), clis = r.shuffle(CLI);
      for (var i = 0; i < nch; i++) p.chq.push({ num: r.int(1000000, 9999999), tiers: fous[i], d: r.int(fin - 12, fin - 1), mt: c(300, 9000) });
      if (r.chance(0.6)) p.rem.push({ d: r.int(fin - 2, fin), mt: c(500, 12000), nb: r.int(2, 6) });
      var pool = r.shuffle(['frais', 'fin', 'virement', 'assurance', 'prelev', 'lcr', 'erreur']).slice(0, r.int(3, 5));
      pool.forEach(function (k) {
        var d = r.int(fin - 6, fin);
        if (k === 'frais') { var ht = c(15, 90); p.banque.push({ k: 'frais', d: d, ht: ht, tva: U.r2(ht * 0.2) }); }
        if (k === 'fin') p.banque.push(r.chance(0.5) ? { k: 'agios', d: fin, mt: c(20, 250) } : { k: 'interets', d: fin, mt: c(5, 80) });
        if (k === 'virement') p.banque.push({ k: 'virement', d: d, tiers: clis[0], mt: c(500, 15000) });
        if (k === 'assurance') p.banque.push({ k: 'assurance', d: d, mt: c(300, 2500) });
        if (k === 'prelev') p.banque.push({ k: 'prelev', d: d, tiers: fous[2], mt: c(200, 3000) });
        if (k === 'lcr') { var h2 = c(5, 25); p.banque.push({ k: 'lcr', d: d, tiers: clis[1], num: r.int(100, 999), mt: c(1000, 15000), ht: h2, tva: U.r2(h2 * 0.2) }); }
        if (k === 'erreur') {
          var a = r.int(1, 9), b = r.int(0, 9), cc = r.int(0, 9), dd = r.int(0, 9);
          if (cc === dd) dd = (dd + r.int(1, 9)) % 10;
          var B = a * 1000 + b * 100 + cc * 10 + dd, Ae = a * 1000 + b * 100 + dd * 10 + cc;
          p.banque.push({ k: 'erreur', d: r.int(2, fin - 13), num: r.int(1000000, 9999999), tiers: fous[3], B: B, A: Ae });
        }
      });
      var x = this.calc(p);
      if (x.Se < 200 || x.Sb < 200) continue;
      return p;
    }
    return { nom: 'EXEMPLE', M: 3, R: 12450.6, chq: [{ num: 4512318, tiers: 'Fournitures Blanc', d: 26, mt: 1840 }], rem: [{ d: 31, mt: 2300, nb: 3 }], banque: [{ k: 'frais', d: 28, ht: 42, tva: 8.4 }, { k: 'virement', d: 29, tiers: 'Durand SA', mt: 3600 }, { k: 'agios', d: 31, mt: 87.35 }] };
  },
  calc: function (p) {
    var e = U.e2, inc = [], dec = [], rel = [];
    p.banque.forEach(function (o) {
      if (o.k === 'frais') { var t = U.r2(o.ht + o.tva); dec.push(['Frais et commissions bancaires (HT ' + e(o.ht) + ', TVA ' + e(o.tva) + ')', t]); rel.push([o.d, 'Commissions et frais de tenue de compte (dont TVA ' + e(o.tva) + ')', t, 0]); }
      if (o.k === 'agios') { dec.push(['Agios', o.mt]); rel.push([o.d, 'Intérêts débiteurs (agios) du mois', o.mt, 0]); }
      if (o.k === 'interets') { inc.push(['Intérêts créditeurs', o.mt]); rel.push([o.d, 'Intérêts créditeurs du compte', 0, o.mt]); }
      if (o.k === 'virement') { inc.push(['Virement reçu de ' + o.tiers, o.mt]); rel.push([o.d, 'Virement reçu – ' + o.tiers, 0, o.mt]); }
      if (o.k === 'assurance') { dec.push(['Prélèvement de la prime d’assurance', o.mt]); rel.push([o.d, 'Prélèvement – prime d’assurance multirisque', o.mt, 0]); }
      if (o.k === 'prelev') { dec.push(['Prélèvement au profit de ' + o.tiers, o.mt]); rel.push([o.d, 'Prélèvement – ' + o.tiers + ' (facture déjà comptabilisée)', o.mt, 0]); }
      if (o.k === 'lcr') {
        var tc = U.r2(o.ht + o.tva);
        inc.push(['Encaissement de la LCR n° ' + o.num + ' (' + o.tiers + ')', o.mt]); dec.push(['Commission d’encaissement de la LCR (HT ' + e(o.ht) + ', TVA ' + e(o.tva) + ')', tc]);
        rel.push([o.d, 'Encaissement LCR n° ' + o.num + ' – ' + o.tiers, 0, o.mt], [o.d, 'Commission d’encaissement LCR n° ' + o.num + ' (dont TVA ' + e(o.tva) + ')', tc, 0]);
      }
      if (o.k === 'erreur') { var df = U.r2(o.B - o.A); if (df > 0) dec.push(['Erreur sur le chèque n° ' + o.num + ' (' + U.n(o.B, 2) + ' − ' + U.n(o.A, 2) + ')', df]); else inc.push(['Erreur sur le chèque n° ' + o.num + ' (' + U.n(o.A, 2) + ' − ' + U.n(o.B, 2) + ')', -df]); }
    });
    var sum = function (a) { return U.r2(a.reduce(function (s, x) { return s + x[1]; }, 0)); };
    var sumM = function (a) { return U.r2(a.reduce(function (s, x) { return s + x.mt; }, 0)); };
    var tInc = sum(inc), tDec = sum(dec), tChq = sumM(p.chq), tRem = sumM(p.rem);
    var Se = U.r2(p.R - tInc + tDec), Sb = U.r2(p.R + tChq - tRem);
    return { inc: inc, dec: dec, rel: rel, tInc: tInc, tDec: tDec, tChq: tChq, tRem: tRem, Se: Se, Sb: Sb, reg: U.r2(p.R - Se), ecart: U.r2(Sb - Se) };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e2, n = U.n, L = U.L, fin = U.lastDay(p.M), dF = U.dt(fin, p.M), m = U.MOIS[p.M - 1];
    var f2 = function (v) { return v ? n(v, 2) : ''; };
    var en = '<p>La société <b>' + p.nom + '</b> reçoit le relevé de son compte bancaire pour le mois ' + (/^[aeiou]/.test(m) ? 'd’' : 'de ') + m + ' N. Au ' + dF + ', le compte 512 de sa comptabilité présente un solde <b>débiteur de ' + e(x.Se) + '</b> et le relevé bancaire un solde <b>créditeur de ' + e(x.Sb) + '</b>.</p>';
    var cpt = [];
    p.chq.forEach(function (c) { cpt.push([U.dt(c.d, p.M), 'Chèque n° ' + c.num + ' à ' + c.tiers, '', n(c.mt, 2)]); });
    p.rem.forEach(function (c) { cpt.push([U.dt(c.d, p.M), 'Remise de ' + c.nb + ' chèques clients', n(c.mt, 2), '']); });
    cpt.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
    en += '<p>Opérations du compte 512 non pointées avec le relevé :</p>' + U.tbl(['Date', 'Libellé', 'Débit', 'Crédit'], cpt);
    var rel = x.rel.slice().sort(function (a, b) { return a[0] - b[0]; }).map(function (l) { return [U.dt(l[0], p.M), l[1], f2(l[2]), f2(l[3])]; });
    en += '<p>Opérations du relevé bancaire non pointées avec le compte 512 :</p>' + U.tbl(['Date', 'Libellé', 'Débit', 'Crédit'], rel);
    var er = p.banque.filter(function (o) { return o.k === 'erreur'; })[0];
    if (er) en += '<p>Par ailleurs, le chèque n° ' + er.num + ' émis le ' + U.dt(er.d, p.M) + ' à l’ordre du fournisseur ' + er.tiers + ' en règlement de sa facture figure au relevé pour ' + e(er.B) + ', montant exact de la dette ; il a été enregistré en comptabilité pour ' + e(er.A) + '.</p>';
    en += '<p class="consigne">1. Établissez l’état de rapprochement bancaire au ' + dF + '. 2. Passez dans la comptabilité de la société les écritures de régularisation nécessaires.</p>';

    var qs = [Q('se', 'Solde rectifié du compte 512 (comptabilité de l’entreprise)', p.R, '€'), Q('sb', 'Solde rectifié du compte de l’entreprise chez la banque', p.R, '€'),
      Q('reg', 'Incidence nette des régularisations sur le compte 512 (+ hausse, − baisse)', x.reg, '€')];

    // État de rapprochement : deux comptes réciproques, présentés côte à côte
    var Lr = [['Solde au ' + dF, n(x.Se, 2), '']].concat(x.inc.map(function (l) { return [l[0], n(l[1], 2), '']; }), x.dec.map(function (l) { return [l[0], '', n(l[1], 2)]; }));
    Lr.push(['<b>Solde rectifié (débiteur)</b>', '', '<b>' + n(p.R, 2) + '</b>']);
    var Rr = [['Solde au ' + dF, '', n(x.Sb, 2)]].concat(p.chq.map(function (c) { return ['Chèque n° ' + c.num + ' non encaissé', n(c.mt, 2), '']; }), p.rem.map(function (c) { return ['Remise de chèques du ' + U.dt(c.d, p.M) + ' non créditée', '', n(c.mt, 2)]; }));
    Rr.push(['<b>Solde rectifié (créditeur)</b>', '<b>' + n(p.R, 2) + '</b>', '']);
    var nr = Math.max(Lr.length, Rr.length), rows = [];
    for (var i = 0; i < nr; i++) rows.push((Lr[i] || ['', '', '']).concat(Rr[i] || ['', '', '']));
    var totL = n(U.r2(x.Se + x.tInc), 2), totR = n(U.r2(p.R + x.tChq), 2);
    rows.push({ cls: 'tot', cells: ['Totaux', totL, totL, 'Totaux', totR, totR] });

    var c = [['Écart initial', 'relevé ' + n(x.Sb, 2) + ' − compte 512 ' + n(x.Se, 2), e(x.ecart)],
      ['Côté entreprise', n(x.Se, 2) + (x.tInc ? ' + ' + n(x.tInc, 2) : '') + (x.tDec ? ' − ' + n(x.tDec, 2) : ''), '<b>' + e(p.R) + '</b>'],
      ['Côté banque', n(x.Sb, 2) + (x.tChq ? ' − ' + n(x.tChq, 2) : '') + (x.tRem ? ' + ' + n(x.tRem, 2) : ''), '<b>' + e(p.R) + '</b>']];

    var J = [];
    p.banque.forEach(function (o) {
      if (o.k === 'frais') J.push(U.entry(dF, 'Frais bancaires du mois', [L('627', o.ht, 0), L('44566', o.tva, 0), L('512', 0, U.r2(o.ht + o.tva))]));
      if (o.k === 'agios') J.push(U.entry(dF, 'Agios', [L('6616', o.mt, 0), L('512', 0, o.mt)]));
      if (o.k === 'interets') J.push(U.entry(dF, 'Intérêts créditeurs', [L('512', o.mt, 0), L('768', 0, o.mt)]));
      if (o.k === 'virement') J.push(U.entry(dF, 'Virement reçu de ' + o.tiers, [L('512', o.mt, 0), L('411', 0, o.mt)]));
      if (o.k === 'assurance') J.push(U.entry(dF, 'Prélèvement de la prime d’assurance', [L('616', o.mt, 0), L('512', 0, o.mt)]));
      if (o.k === 'prelev') J.push(U.entry(dF, 'Prélèvement ' + o.tiers, [L('401', o.mt, 0), L('512', 0, o.mt)]));
      if (o.k === 'lcr') J.push(U.entry(dF, 'Encaissement de la LCR n° ' + o.num, [L('512', U.r2(o.mt - o.ht - o.tva), 0), L('627', o.ht, 0), L('44566', o.tva, 0), L('5113', 0, o.mt)]));
      if (o.k === 'erreur') { var df = U.r2(o.B - o.A); J.push(U.entry(dF, 'Correction du chèque n° ' + o.num, df > 0 ? [L('401', df, 0), L('512', 0, df)] : [L('512', -df, 0), L('401', 0, -df)])); }
    });

    var com = 'Le compte 512 de l’entreprise et le compte ouvert à son nom chez la banque enregistrent les mêmes flux, en sens inverse ; leurs soldes diffèrent ici de ' + e(Math.abs(x.ecart)) + ' parce que chacun ignore encore certaines opérations. ';
    com += 'Côté banque, ' + (p.chq.length > 1 ? 'les chèques émis n’ont pas encore été présentés' : 'le chèque émis n’a pas encore été présenté') + ' par ' + (p.chq.length > 1 ? 'leurs bénéficiaires' : 'son bénéficiaire') + (p.rem.length ? ' et la remise de chèques déposée en fin de mois n’est pas encore créditée' : '') + ' : ces décalages se résorberont d’eux-mêmes et n’appellent aucune écriture. ';
    com += 'Côté entreprise, les opérations connues seulement par le relevé (' + p.banque.map(function (o) { return { frais: 'frais bancaires', agios: 'agios', interets: 'intérêts créditeurs', virement: 'virement d’un client', assurance: 'prime d’assurance', prelev: 'prélèvement d’un fournisseur', lcr: 'encaissement d’une LCR', erreur: 'erreur de saisie d’un chèque' }[o.k]; }).join(', ') + ') doivent être comptabilisées : elles modifient le 512 de ' + (x.reg >= 0 ? '+ ' : '− ') + e(Math.abs(x.reg)) + '. ';
    com += 'Les deux soldes rectifiés sont égaux à ' + e(p.R) + ', montant réel des disponibilités au ' + dF + ' qui figurera au bilan. L’état de rapprochement, établi chaque mois, est un outil de contrôle interne : il détecte les oublis, les erreurs et les éventuelles fraudes sur la trésorerie.';
    return { enonce: en, questions: qs, journal: J, steps: [{ h: 'Calculs', html: U.calc(c) }, { h: 'État de rapprochement au ' + dF, html: U.tbl(['Compte 512 chez l’entreprise', 'Débit', 'Crédit', 'Compte de l’entreprise chez la banque', 'Débit', 'Crédit'], rows, 'aff') }], comment: com };
  }
};

/* ---------- 2. Emprunt indivis ---------- */
T.emprunt = {
  id: 'emprunt', nom: 'Emprunt : tableau de remboursement et écritures', famille: 'Opérations financières', ctrl: true, minutes: 18,
  fiche: {
    objectif: 'Construire le tableau de remboursement d’un emprunt (annuités constantes ou amortissements constants), constater les intérêts courus à la clôture et comptabiliser l’obtention et les échéances.',
    cours: [
      { t: 'Le financement des investissements', l: [
        'Autofinancement : la capacité d’autofinancement (CAF) non distribuée finance l’investissement sans coût apparent ni dépendance envers les prêteurs.',
        'Augmentation de capital : apports nouveaux des associés (101, 1041) ; renforce les capitaux propres mais dilue le pouvoir et appelle une rémunération (dividendes).',
        'Emprunt : dette financière (164) remboursée selon un tableau d’amortissement ; les intérêts sont des charges financières (6611) déductibles ; effet de levier si la rentabilité économique dépasse le taux d’intérêt.',
        'Crédit-bail : location avec option d’achat ; en comptes individuels (PCG), le bien n’est pas inscrit à l’actif, les redevances sont des charges (612) ; il figure en engagement hors bilan dans l’annexe. En normes IFRS (IFRS 16), le preneur inscrit un droit d’utilisation et une dette.',
        'Subventions d’investissement : ressource propre (131) reprise au résultat au rythme de l’amortissement du bien financé (139 / 777).'
      ] },
      { t: 'Opérations financières', l: [
        'Charges financières (classe 66) : intérêts des emprunts 6611, agios 6616, escomptes accordés 665, pertes de change financières 666.',
        'Produits financiers (classe 76) : produits de participations 761, intérêts 762 et 768, escomptes obtenus 765, gains de change financiers 766, produits nets sur cessions de VMP 767.',
        'Les frais de dossier d’un emprunt sont des services bancaires (627), en principe exonérés de TVA comme les opérations de crédit.'
      ] },
      { t: 'Formules', l: [
        'Annuités constantes : a = K × i ÷ (1 − (1 + i)^−n) ; chaque annuité = intérêts (capital restant dû × i) + amortissement (a − intérêts) ; les amortissements croissent en progression géométrique de raison (1 + i).',
        'Amortissements constants : amortissement = K ÷ n ; annuité = K ÷ n + intérêts, donc décroissante.',
        'ICNE : intérêts de l’échéance à venir × durée écoulée depuis la dernière échéance ÷ 12.'
      ] }
    ],
    etapes: [
      'Calculer l’annuité constante (ou l’amortissement constant) à partir du capital, du taux et de la durée.',
      'Ligne par ligne : intérêts = capital restant dû en début de période × taux ; amortissement = annuité − intérêts (ou K ÷ n) ; capital fin = capital début − amortissement. Ajuster la dernière ligne pour solder exactement l’emprunt.',
      'Obtention : D 512 (montant net des frais) + D 627 (frais de dossier) / C 164 (capital emprunté).',
      'Clôture : si l’échéance tombe en N+1, rattacher à N les intérêts courus depuis l’obtention (ou la dernière échéance) : D 6611 / C 1688.',
      'Ouverture de N+1 : contrepasser les ICNE (D 1688 / C 6611).',
      'Échéance : D 164 (amortissement) + D 6611 (intérêts de la période) / C 512 (annuité).'
    ],
    pieges: [
      'Comptabiliser toute l’annuité en charge : seuls les intérêts sont une charge, l’amortissement rembourse la dette.',
      'Calculer les intérêts sur le capital initial au lieu du capital restant dû.',
      'Oublier les intérêts courus non échus à la clôture (principe d’indépendance des exercices) ou oublier de les contrepasser.',
      'Prorata des ICNE : compter les mois depuis la date d’obtention (ou la dernière échéance) jusqu’au 31/12, pas depuis le 1er janvier.',
      'Confondre le taux annuel et la durée exprimée en mois ou en trimestres.'
    ],
    comptes: ['164 Emprunts auprès des établissements de crédit', '1688 Intérêts courus sur emprunts', '6611 Intérêts des emprunts', '627 Services bancaires (frais de dossier)', '512 Banque', '612 Redevances de crédit-bail']
  },
  gen: function (r) {
    var BQ = ['Crédit Agricole', 'Banque Populaire', 'Caisse d’Épargne', 'Crédit Mutuel', 'BNP Paribas', 'Société Générale', 'LCL'];
    var OBJ = ['l’acquisition d’une machine', 'l’agrandissement de son entrepôt', 'le renouvellement de sa flotte de véhicules', 'l’achat d’un logiciel de gestion', 'la construction d’un atelier'];
    return { nom: U.nom(r), bq: r.pick(BQ), obj: r.pick(OBJ), K: r.int(4, 80) * 5000, i: r.pick([0.025, 0.03, 0.035, 0.04, 0.045, 0.05, 0.055, 0.06]), n: r.int(3, 8), mode: r.chance(0.6) ? 'annuite' : 'amort', m: r.int(2, 11), F: r.chance(0.5) ? r.int(2, 16) * 50 : 0 };
  },
  calc: function (p) {
    var a = p.mode === 'annuite' ? U.r2(p.K * p.i / (1 - Math.pow(1 + p.i, -p.n))) : null, am = U.r2(p.K / p.n);
    var rows = [], cd = p.K, totI = 0;
    for (var k = 0; k < p.n; k++) {
      var I = U.r2(cd * p.i), A = k === p.n - 1 ? cd : (a !== null ? U.r2(a - I) : am);
      var ann = U.r2(I + A), cf = U.r2(cd - A);
      rows.push({ k: k, cd: cd, I: I, A: A, ann: ann, cf: cf });
      totI = U.r2(totI + I); cd = cf;
    }
    var mois = 13 - p.m;
    return { a: a, am: am, rows: rows, totI: totI, mois: mois, icne: U.r2(rows[0].I * mois / 12), cout: U.r2(totI + p.F) };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e2, n = U.n, L = U.L, ann = p.mode === 'annuite', d0 = U.dt(1, p.m), d1 = U.dt(1, p.m, 1), r0 = x.rows[0];
    var en = '<p>Pour financer ' + p.obj + ', la société <b>' + p.nom + '</b> obtient le ' + d0 + ' un emprunt auprès de sa banque (' + p.bq + ') aux conditions suivantes.</p>';
    var kv = [['Capital emprunté', e(p.K)], ['Taux d’intérêt annuel', U.pcs(p.i)], ['Durée', p.n + ' ans'], ['Remboursement', ann ? 'par annuités constantes' : 'par amortissements constants du capital'], ['Échéances', 'annuelles, le ' + U.dt(1, p.m).slice(0, 5) + ' de chaque année, première le ' + d1]];
    if (p.F) kv.push(['Frais de dossier', e(p.F) + ' (exonérés de TVA), retenus sur le montant versé']);
    en += U.kv(kv);
    en += '<p class="consigne">1. Établissez le tableau de remboursement de l’emprunt. 2. Passez les écritures du ' + d0 + ', du 31/12/N, du 01/01/N+1 et du ' + d1 + '. L’exercice coïncide avec l’année civile.</p>';

    var qs = ann ? [Q('an', 'Annuité constante', x.a, '€')] : [Q('am', 'Amortissement constant du capital', x.am, '€'), Q('a1', 'Première annuité', r0.ann, '€')];
    qs.push(Q('i1', 'Intérêts de la première échéance', r0.I, '€'), Q('crd', 'Capital restant dû après la première échéance', r0.cf, '€'), Q('icne', 'Intérêts courus non échus au 31/12/N', x.icne, '€'), Q('cout', 'Coût total du crédit (intérêts' + (p.F ? ' et frais de dossier' : '') + ')', x.cout, '€'));

    var c = [];
    if (ann) c.push(['Annuité constante', n(p.K) + ' × ' + n(p.i, 3) + ' ÷ (1 − ' + n(1 + p.i, 3) + '<sup>−' + p.n + '</sup>)', '<b>' + e(x.a) + '</b>']);
    else c.push(['Amortissement constant', n(p.K) + ' ÷ ' + p.n, '<b>' + e(x.am) + '</b>']);
    c.push(['Intérêts de la 1re échéance', n(p.K) + ' × ' + U.pcs(p.i), e(r0.I)]);
    c.push(['ICNE au 31/12/N', n(r0.I, 2) + ' × ' + x.mois + '/12 (du ' + d0 + ' au 31/12/N)', '<b>' + e(x.icne) + '</b>']);
    c.push(['Coût du crédit', 'total des intérêts ' + n(x.totI, 2) + (p.F ? ' + frais ' + n(p.F, 2) : ''), e(x.cout)]);
    var tr = x.rows.map(function (rw) { return [U.dt(1, p.m, rw.k + 1), n(rw.cd, 2), n(rw.I, 2), n(rw.A, 2), n(rw.ann, 2), n(rw.cf, 2)]; });
    tr.push({ cls: 'tot', cells: ['Total', '', n(x.totI, 2), n(p.K, 2), n(U.r2(x.totI + p.K), 2), ''] });

    var J = [U.entry(d0, 'Obtention de l’emprunt (' + p.bq + ')', [L('512', U.r2(p.K - p.F), 0), L('627', p.F, 0), L('164', 0, p.K)]),
      U.entry('31/12/N', 'Intérêts courus non échus', [L('6611', x.icne, 0), L('1688', 0, x.icne)]),
      U.entry('01/01/N+1', 'Contrepassation des ICNE', [L('1688', x.icne, 0), L('6611', 0, x.icne)]),
      U.entry(d1, 'Première échéance de l’emprunt', [L('164', r0.A, 0), L('6611', r0.I, 0), L('512', 0, r0.ann)])];

    var com = 'L’emprunt de ' + e(p.K) + ' est une dette financière inscrite au compte 164 ; ' + (ann ? 'remboursé par annuités constantes de ' + e(x.a) + ', il pèse de façon régulière sur la trésorerie, la part des intérêts diminuant au profit de l’amortissement du capital' : 'remboursé par amortissements constants de ' + e(x.am) + ', il entraîne des annuités décroissantes, plus lourdes en début de période') + '. ';
    com += 'Seuls les intérêts sont des charges financières ; le remboursement du capital diminue la dette sans affecter le résultat. ';
    com += 'La première échéance tombe le ' + d1 + ' : en application du principe d’indépendance des exercices, les intérêts courus du ' + d0 + ' au 31/12/N (' + x.mois + ' mois, soit ' + e(x.icne) + ') sont rattachés à N par le compte 1688, puis contrepassés au 01/01/N+1 ; ainsi N+1 ne supporte que ' + e(U.r2(r0.I - x.icne)) + ' d’intérêts au titre de cette échéance. ';
    com += 'Au total, le crédit coûte ' + e(x.cout) + (p.F ? ', frais de dossier compris' : '') + '. L’emprunt n’est intéressant que si la rentabilité de l’investissement financé dépasse son coût (effet de levier) et si la capacité d’autofinancement couvre les annuités.';
    return { enonce: en, questions: qs, journal: J, steps: [{ h: 'Calculs', html: U.calc(c) }, { h: 'Tableau de remboursement', html: U.tbl(['Échéance', 'Capital début', 'Intérêts', 'Amortissement', 'Annuité', 'Capital fin'], tr) }], comment: com };
  }
};

/* ---------- 3. Subvention d'investissement ---------- */
T.subvention = {
  id: 'subvention', nom: 'Subvention d’investissement', famille: 'Opérations financières', ctrl: false, minutes: 15,
  fiche: {
    objectif: 'Comptabiliser une subvention d’investissement et la reprendre au résultat au rythme de l’amortissement du bien qu’elle finance.',
    cours: [
      { t: 'Principe', l: [
        'Subvention d’investissement : aide (État, région, Union européenne…) destinée à acquérir ou créer une immobilisation ; elle est inscrite en capitaux propres (131), et non en produit de l’exercice d’octroi.',
        'Étalement : chaque année, une quote-part est virée au résultat (D 139 / C 777) au même rythme que l’amortissement du bien ; elle compense la dotation et neutralise l’effet de l’amortissement de la part financée par la subvention.',
        'Bien non amortissable (terrain) : la reprise se fait sur la durée d’inaliénabilité prévue par le contrat (à défaut, sur 10 ans).',
        'Fiscalité : la subvention est imposable, mais l’entreprise peut opter pour l’étalement de son imposition selon les mêmes règles (article 42 septies du CGI) ; à défaut, elle est imposée en totalité l’année de son octroi.',
        'Bilan : le 139 vient en déduction du 131 ; seul le montant net (131 − 139), c’est-à-dire la part non encore reprise, figure dans les capitaux propres.'
      ] }
    ],
    etapes: [
      'Octroi : D 441 / C 131 à la notification (ou directement D 512 / C 131 si la subvention est versée sans notification préalable) ; encaissement : D 512 / C 441.',
      'Acquisition du bien : D 2xxx (HT) + D 44562 / C 404.',
      'Clôture : dotation aux amortissements du bien (prorata temporis depuis la mise en service) : D 6811 / C 28xx.',
      'Quote-part virée au résultat = subvention × dotation de l’exercice ÷ base amortissable (ou subvention ÷ durée × prorata) : D 139 / C 777.',
      'Subvention au bilan = 131 − 139 cumulé ; impact sur le résultat = − dotation + quote-part.'
    ],
    pieges: [
      'Comptabiliser la subvention en produit (74) : la subvention d’exploitation va au 74, la subvention d’investissement au 131.',
      'Reprendre la subvention de façon linéaire sur l’année entière alors que le bien est mis en service en cours d’année : même prorata que l’amortissement.',
      'Créditer directement le 131 pour la quote-part : on débite le 139, le 131 garde le montant d’origine.',
      'Classement du 777 : dans l’ancien plan comptable, il figurait parmi les produits exceptionnels ; retenez le compte 777 et suivez la présentation demandée par le sujet.'
    ],
    comptes: ['131 Subventions d’équipement', '139 Subventions inscrites au compte de résultat', '777 Quote-part virée au résultat', '441 État – subventions à recevoir', '6811 / 28xx Amortissements', '404 Fournisseurs d’immobilisations']
  },
  gen: function (r) {
    var BIENS = [{ lib: 'une machine-outil', compte: '2154', amort: '28154', n: [5, 10], k: [4, 60], s: 5000 }, { lib: 'un véhicule utilitaire électrique', compte: '2182', amort: '28182', n: [4, 6], k: [5, 15], s: 5000 },
      { lib: 'du matériel informatique', compte: '2183', amort: '28183', n: [3, 5], k: [2, 20], s: 2500 }, { lib: 'un bâtiment de stockage', compte: '213', amort: '2813', n: [20, 25], k: [10, 60], s: 10000 }];
    var ORG = ['la région', 'l’État', 'le département', 'la communauté de communes', 'l’ADEME'];
    var b = r.pick(BIENS), P = r.int(b.k[0], b.k[1]) * b.s, t = r.pick([0.2, 0.25, 0.3, 0.4, 0.5]);
    var m = r.int(1, 11), d = r.chance(0.4) ? 1 : r.int(2, 28);
    var notif = r.chance(0.5), mn = r.int(1, m), dn = r.int(2, 14), mv = Math.min(12, m + r.int(0, 3)), dv = r.int(15, 28);
    return { nom: U.nom(r), bien: { lib: b.lib, compte: b.compte, amort: b.amort }, org: r.pick(ORG), P: P, S: Math.round(P * t / 100) * 100, n: r.int(b.n[0], b.n[1]), d: d, m: m, notif: notif, dn: dn, mn: mn, dv: dv, mv: mv };
  },
  calc: function (p) {
    var pl = AM.lineaire(p.P, p.n, p.d, p.m), ps = AM.lineaire(p.S, p.n, p.d, p.m);
    var dot = pl.rows[0].a, qp = ps.rows[0].a;
    return { j1: pl.j1, dot: dot, dot1: pl.rows[1].a, qp: qp, qp1: ps.rows[1].a, net: U.r2(p.S - qp), res: U.r2(qp - dot), tva: U.r2(p.P * 0.2) };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e2, n = U.n, L = U.L, dA = U.dt(p.d, p.m), b = p.bien;
    var dN = U.dt(p.dn, p.mn), dV = U.dt(p.dv, p.mv);
    var en = '<p>La société <b>' + p.nom + '</b> acquiert et met en service le ' + dA + ' ' + b.lib + ' pour ' + e(p.P) + ' HT (TVA 20 %), payable à 60 jours. Le bien est amorti en linéaire sur ' + p.n + ' ans.</p>';
    en += '<p>Pour financer cet investissement, ' + p.org + ' lui accorde une subvention d’équipement de ' + e(p.S) + (p.notif ? ', notifiée le ' + dN + ' et versée le ' + dV : ', versée le ' + dV) + '. La société reprend la subvention au résultat au rythme de l’amortissement du bien.</p>';
    en += '<p class="consigne">1. Calculez la dotation aux amortissements et la quote-part de subvention virée au résultat de N et de N+1. 2. Passez les écritures de l’exercice N. 3. Indiquez le montant de la subvention au bilan du 31/12/N.</p>';
    var qs = [Q('dot', 'Dotation aux amortissements de N', x.dot, '€'), Q('qp', 'Quote-part de subvention virée au résultat de N', x.qp, '€'), Q('net', 'Subvention au bilan au 31/12/N (131 − 139)', x.net, '€'),
      Q('res', 'Incidence nette sur le résultat de N (− dotation + quote-part)', x.res, '€'), Q('qp1', 'Quote-part de subvention virée au résultat de N+1', x.qp1, '€')];
    var pr = U.prorataTxt(x.j1), full = x.j1 >= 360;
    var c = [['Dotation N', n(p.P) + ' ÷ ' + p.n + (full ? '' : ' × ' + pr + ' (' + U.dureeTxt(x.j1) + ')'), '<b>' + e(x.dot) + '</b>'],
      ['Quote-part N', n(p.S) + ' ÷ ' + p.n + (full ? '' : ' × ' + pr) + ' (même rythme que l’amortissement)', '<b>' + e(x.qp) + '</b>'],
      ['Subvention au bilan', n(p.S) + ' − ' + n(x.qp, 2), e(x.net)],
      ['Incidence sur le résultat N', '− ' + n(x.dot, 2) + ' + ' + n(x.qp, 2), e(x.res)],
      ['Dotation N+1', n(p.P) + ' ÷ ' + p.n, e(x.dot1)], ['Quote-part N+1', n(p.S) + ' ÷ ' + p.n, e(x.qp1)]];
    var ev = [];
    if (p.notif) { ev.push({ k: p.mn * 100 + p.dn, en: U.entry(dN, 'Notification de la subvention', [L('441', p.S, 0), L('131', 0, p.S)]) }); ev.push({ k: p.mv * 100 + p.dv + 0.5, en: U.entry(dV, 'Encaissement de la subvention', [L('512', p.S, 0), L('441', 0, p.S)]) }); }
    else ev.push({ k: p.mv * 100 + p.dv + 0.5, en: U.entry(dV, 'Subvention d’équipement reçue', [L('512', p.S, 0), L('131', 0, p.S)]) });
    ev.push({ k: p.m * 100 + p.d + 0.2, en: U.entry(dA, 'Acquisition : ' + b.lib, [L(b.compte, p.P, 0), L('44562', x.tva, 0), L('404', 0, U.r2(p.P + x.tva))]) });
    ev.sort(function (a, c2) { return a.k - c2.k; });
    var J = ev.map(function (v) { return v.en; });
    J.push(U.entry('31/12/N', 'Dotation aux amortissements', [L('6811', x.dot, 0), L(b.amort, 0, x.dot)]));
    J.push(U.entry('31/12/N', 'Quote-part de subvention virée au résultat', [L('139', x.qp, 0), L('777', 0, x.qp)]));
    var com = 'La subvention d’équipement de ' + e(p.S) + ' finance ' + U.pc(p.S / p.P, 0) + ' du coût du bien. Elle n’est pas un produit de l’exercice d’octroi : inscrite en capitaux propres (131), elle est reprise au résultat au même rythme que l’amortissement, soit ' + e(x.qp) + ' en N' + (full ? '' : ', prorata temporis depuis la mise en service du ' + dA) + '. ';
    com += 'Cette quote-part (777) compense en partie la dotation de ' + e(x.dot) + ' : la charge nette supportée par le résultat de N n’est que de ' + e(-x.res) + ', ce qui correspond à l’amortissement de la part du bien financée par l’entreprise elle-même. ';
    com += 'Au bilan du 31/12/N, la subvention figure dans les capitaux propres pour ' + e(x.net) + ' (131 diminué du 139) ; elle sera entièrement reprise à la fin du plan d’amortissement. ';
    com += 'Fiscalement, l’entreprise peut opter pour l’étalement de l’imposition de la subvention selon le même rythme, ce qui évite une imposition immédiate de ' + e(p.S) + '.';
    return { enonce: en, questions: qs, journal: J, steps: [{ h: 'Calculs', html: U.calc(c) }], comment: com };
  }
};
