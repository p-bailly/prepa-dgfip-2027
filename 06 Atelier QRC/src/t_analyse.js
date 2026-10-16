/* ===== Analyse financière : SIG et CAF, bilan fonctionnel, ratios ===== */
function uK(p) { return p.k ? function (x) { return U.n(x) + ' K€'; } : U.e; }

/* ---------- 13. SIG et CAF ---------- */
T.sig_caf = {
  id: 'sig_caf', nom: 'SIG, EBE et CAF', famille: 'Analyse financière', ctrl: true, minutes: 20,
  fiche: {
    objectif: 'Calculer les soldes intermédiaires de gestion, puis la CAF par les deux méthodes et l’autofinancement.',
    etapes: [
      'Marge commerciale = ventes de marchandises − (achats de marchandises ± variation de stock).',
      'Production de l’exercice = production vendue + stockée + immobilisée.',
      'Valeur ajoutée = marge commerciale + production − consommations en provenance des tiers (matières ± variation, autres achats et charges externes).',
      'EBE = VA + subventions d’exploitation − impôts et taxes − charges de personnel.',
      'Résultat d’exploitation = EBE + reprises et autres produits − dotations et autres charges d’exploitation ; RCAI = RE + résultat financier ; résultat net = RCAI + résultat exceptionnel − participation − IS.',
      'CAF soustractive : EBE + autres produits − autres charges + produits financiers (hors reprises) − charges financières (hors dotations) + produits exceptionnels (hors prix de cession, quote-part de subvention, reprises) − charges exceptionnelles (hors valeur des éléments cédés, dotations) − participation − IS.',
      'CAF additive : résultat net + dotations − reprises + valeur comptable des éléments cédés − prix de cession − quote-part de subvention virée au résultat.',
      'Autofinancement = CAF − dividendes mis en paiement dans l’exercice.'
    ],
    pieges: [
      'Variation de stock : un stock qui augmente (variation négative) diminue le coût des achats consommés.',
      'Charges financières : seuls les intérêts sont décaissables, pas les dotations financières.',
      'Exclure de la CAF les cessions et la quote-part de subvention (757, 747 ou 775, 777).',
      'Ne pas déduire une charge « décaissable » telle qu’une amende exceptionnelle : elle reste dans la CAF.',
      'PCG 2025 : cessions et quote-part de subvention sont en exploitation ; elles sont toujours exclues de la CAF.',
      'Les dotations d’un énoncé « EBE → CAF » sont un piège : la méthode soustractive part de l’EBE, calculé avant dotations.'
    ],
    comptes: []
  },
  gen: function (r) {
    for (var t = 0; t < 200; t++) {
      var p = { nom: U.nom(r), k: true };
      var neg = r.chance(0.5);
      p.VM = neg ? r.int(10, 300) * 10 : 0; p.AM = p.VM ? U.r0(p.VM * r.int(55, 75) / 100) : 0; p.VSM = p.VM ? r.int(-6, 6) * 5 : 0;
      p.PV = r.int(50, 600) * 10; p.PS = r.int(-8, 10) * 5; p.PI = r.chance(0.4) ? r.int(1, 8) * 10 : 0;
      p.AMP = U.r0(p.PV * r.int(20, 35) / 100); p.VSMP = r.int(-6, 6) * 5;
      p.ACE = U.r0((p.PV + p.VM) * r.int(10, 20) / 100);
      var VA = p.VM - p.AM - p.VSM + p.PV + p.PS + p.PI - p.AMP - p.VSMP - p.ACE;
      if (VA <= 50) continue;
      p.SE = r.chance(0.4) ? r.int(1, 8) * 5 : 0;
      p.IT = U.r0(VA * r.int(3, 7) / 100);
      var pers = U.r0(VA * r.int(55, 80) / 100);
      p.SAL = U.r0(pers * 0.7); p.CS = pers - p.SAL;
      var EBE = VA + p.SE - p.IT - p.SAL - p.CS;
      if (EBE <= 10) continue;
      p.DA = U.r0(EBE * r.int(25, 55) / 100); p.DDAC = r.int(0, 6) * 5; p.DPR = r.chance(0.5) ? r.int(1, 6) * 5 : 0; p.AC = r.int(0, 4) * 5;
      p.RDP = r.int(0, 6) * 5; p.AP = r.int(0, 4) * 5;
      p.INT = r.int(1, 12) * 5; p.DF = r.chance(0.4) ? r.int(1, 3) * 5 : 0; p.CFt = p.INT + p.DF;
      p.RF = r.chance(0.4) ? r.int(1, 3) * 5 : 0; p.PFt = p.RF + r.int(0, 6) * 5;
      p.PCEA = r.chance(0.6) ? r.int(2, 20) * 5 : 0; p.QPS = r.chance(0.5) ? r.int(1, 6) * 5 : 0; p.REX = 0; p.PEt = p.PCEA + p.QPS + r.int(0, 4) * 5;
      p.VCEC = p.PCEA ? U.r0(p.PCEA * r.int(40, 130) / 100) : 0; p.DEX = r.chance(0.3) ? r.int(1, 4) * 5 : 0; p.CEt = p.VCEC + p.DEX + r.int(0, 3) * 5;
      p.PART = r.chance(0.3) ? r.int(1, 6) * 5 : 0;
      var RCAI = EBE + p.RDP + p.AP - p.DA - p.DDAC - p.DPR - p.AC + p.PFt - p.CFt;
      var avIS = RCAI + p.PEt - p.CEt - p.PART;
      p.IS = avIS > 0 ? U.r0(avIS * 0.25) : 0;
      p.DIV = r.chance(0.7) ? U.r0(Math.max(0, avIS) * r.int(10, 40) / 100 / 5) * 5 : 0;
      p.ebeOnly = r.chance(0.3);
      if (p.ebeOnly) p.DAPtot = p.DA + p.DDAC + p.DPR;
      return p;
    }
  },
  calc: function (p) {
    var x = {};
    x.MC = p.VM - p.AM - p.VSM;
    x.PROD = p.PV + p.PS + p.PI;
    x.CI = p.AMP + p.VSMP + p.ACE;
    x.VA = x.MC + x.PROD - x.CI;
    x.EBE = p.ebeOnly && p.EBE !== undefined ? p.EBE : x.VA + p.SE - p.IT - p.SAL - p.CS;
    x.RE = x.EBE + p.RDP + p.AP - p.DA - p.DDAC - p.DPR - p.AC;
    x.RF = p.PFt - p.CFt; x.RCAI = x.RE + x.RF; x.REX = p.PEt - p.CEt;
    x.RN = x.RCAI + x.REX - p.PART - p.IS;
    x.CAFs = x.EBE + p.AP - p.AC + (p.PFt - p.RF) - (p.CFt - p.DF) + (p.PEt - p.PCEA - p.QPS - p.REX) - (p.CEt - p.VCEC - p.DEX) - p.PART - p.IS;
    x.dot = p.DA + p.DDAC + p.DPR + p.DF + p.DEX; x.rep = p.RDP + p.RF + p.REX;
    x.CAFa = x.RN + x.dot - x.rep + p.VCEC - p.PCEA - p.QPS;
    x.AF = x.CAFs - p.DIV;
    x.pers = p.SAL + p.CS;
    for (var kk in x) x[kk] = U.r2(x[kk]);
    return x;
  },
  solve: function (p) {
    var x = this.calc(p), f = uK(p), n = U.n, en, qs, steps = [], com;
    var exPE = p.PEt - p.PCEA - p.QPS - p.REX, exCE = p.CEt - p.VCEC - p.DEX;
    var sous = U.tbl(['CAF (méthode soustractive)', 'Montant'], [['Excédent brut d’exploitation', n(x.EBE)], ['+ Autres produits d’exploitation', n(p.AP)], ['− Autres charges d’exploitation', n(p.AC)], ['+ Produits financiers (hors reprises : ' + n(p.PFt) + ' − ' + n(p.RF) + ')', n(p.PFt - p.RF)], ['− Charges financières (hors dotations : ' + n(p.CFt) + ' − ' + n(p.DF) + ')', n(p.CFt - p.DF)], ['+ Produits exceptionnels (hors cessions, quote-part de subvention et reprises : ' + n(p.PEt) + ' − ' + n(p.PCEA) + ' − ' + n(p.QPS) + ')', n(exPE)], ['− Charges exceptionnelles (hors valeur des éléments cédés et dotations : ' + n(p.CEt) + ' − ' + n(p.VCEC) + ' − ' + n(p.DEX) + ')', n(exCE)], ['− Participation des salariés', n(p.PART)], ['− Impôt sur les bénéfices', n(p.IS)], { cls: 'tot', cells: ['= CAF', n(x.CAFs)] }]);
    if (p.ebeOnly) {
      en = '<p>La société <b>' + p.nom + '</b> vous communique les éléments suivants relatifs à l’exercice N (en milliers d’euros, présentation de l’ancien PCG) :</p>';
      var li = ['Excédent brut d’exploitation : ' + n(x.EBE), 'Dotations aux amortissements, dépréciations et provisions d’exploitation : ' + n(p.DAPtot || 0)];
      if (p.AP) li.push('Autres produits d’exploitation : ' + n(p.AP)); if (p.AC) li.push('Autres charges d’exploitation : ' + n(p.AC));
      li.push('Produits financiers : ' + n(p.PFt) + (p.RF ? ' (dont reprises sur dépréciations : ' + n(p.RF) + ')' : ''));
      li.push('Charges financières : ' + n(p.CFt) + (p.DF ? ' (dont dotations : ' + n(p.DF) + ')' : ''));
      li.push('Charges exceptionnelles : ' + n(p.CEt) + (p.VCEC || p.DEX ? ' (dont ' + [p.VCEC ? 'valeur comptable des éléments d’actif cédés – compte 675 : ' + n(p.VCEC) : '', p.DEX ? 'dotations exceptionnelles : ' + n(p.DEX) : ''].filter(Boolean).join(' ; ') + ')' : ''));
      li.push('Produits exceptionnels : ' + n(p.PEt) + (p.PCEA || p.QPS ? ' (dont ' + [p.PCEA ? 'produits des cessions – compte 775 : ' + n(p.PCEA) : '', p.QPS ? 'quote-part des subventions virée au résultat – compte 777 : ' + n(p.QPS) : ''].filter(Boolean).join(' ; ') + ')' : ''));
      li.push('Impôt sur les bénéfices : ' + n(p.IS)); if (p.PART) li.push('Participation des salariés : ' + n(p.PART));
      li.push('Dividendes versés aux actionnaires en N : ' + n(p.DIV));
      en += U.ul(li) + '<p class="consigne">Après avoir défini l’EBE et la CAF, et précisé l’utilité de la CAF, déterminez la CAF de N et l’autofinancement.</p>';
      qs = [Q('caf', 'Capacité d’autofinancement (K€)', x.CAFs, '€', { tol: 0.5 }), Q('af', 'Autofinancement (K€)', x.AF, '€', { tol: 0.5 })];
      steps.push({ h: 'Définitions', html: U.p('L’EBE est la ressource dégagée par la seule exploitation, avant politique de financement, d’amortissement et d’impôt : il mesure la performance industrielle et commerciale. La CAF est la ressource interne potentielle dégagée par l’activité de l’exercice : produits encaissables moins charges décaissables. Elle finance le renouvellement des immobilisations, le remboursement des emprunts et la distribution de dividendes ; elle sert aussi à mesurer la capacité de remboursement (dettes financières ÷ CAF).') });
      steps.push({ h: 'CAF à partir de l’EBE', html: sous });
      steps.push({ h: 'Autofinancement', html: U.calc([['Autofinancement', 'CAF ' + n(x.CAFs) + ' − dividendes ' + n(p.DIV), '<b>' + f(x.AF) + '</b>']]) });
      com = 'La CAF de ' + f(x.CAFs) + ' représente la ressource que l’exercice a dégagée pour financer l’entreprise par elle-même. Les dotations (' + n(p.DAPtot || 0) + ') ne sont pas à retrancher : la méthode soustractive part de l’EBE, calculé avant dotations, et les charges calculées ne sont pas décaissées. De même, les produits de cession et la quote-part de subvention sont exclus, car ils relèvent de l’investissement et non de l’activité. Après versement de ' + f(p.DIV) + ' de dividendes, l’autofinancement atteint ' + f(x.AF) + ' : c’est la part réellement réinvestie dans l’entreprise. ' + (p.DIV > x.CAFs * 0.5 ? 'La distribution absorbe plus de la moitié de la CAF : la politique de dividendes limite la capacité d’investir sans emprunter.' : 'La distribution reste modérée, ce qui préserve la capacité d’investissement.') + ' Rapportée à l’EBE, la CAF en conserve ' + U.pc(x.CAFs / x.EBE, 1) + ' après frais financiers, participation et impôt. Il faudra comparer cette CAF aux investissements prévus et aux échéances d’emprunt pour juger de l’indépendance financière.';
      return { enonce: en, questions: qs, journal: [], steps: steps, comment: com };
    }
    en = '<p>Compte de résultat de la société <b>' + p.nom + '</b> pour l’exercice N, en milliers d’euros (présentation de l’ancien PCG : cessions et quote-part de subvention en exceptionnel).</p>';
    var ch = [], pr = [];
    if (p.VM) { ch.push(['Achats de marchandises', n(p.AM)], ['Variation de stock de marchandises', n(p.VSM)]); pr.push(['Ventes de marchandises', n(p.VM)]); }
    ch.push(['Achats de matières premières', n(p.AMP)], ['Variation de stock de matières', n(p.VSMP)], ['Autres achats et charges externes', n(p.ACE)], ['Impôts et taxes', n(p.IT)], ['Salaires et traitements', n(p.SAL)], ['Charges sociales', n(p.CS)], ['Dotations aux amortissements', n(p.DA)], ['Dotations aux dépréciations de l’actif circulant', n(p.DDAC)], ['Dotations aux provisions pour risques', n(p.DPR)], ['Autres charges', n(p.AC)], ['Charges financières' + (p.DF ? ' (dont ' + n(p.INT) + ' d’intérêts et ' + n(p.DF) + ' de dotations)' : ' (intérêts)'), n(p.CFt)], ['Charges exceptionnelles' + (p.VCEC || p.DEX ? ' (dont ' + [p.VCEC ? n(p.VCEC) + ' de valeur comptable des éléments cédés' : '', p.DEX ? n(p.DEX) + ' de dotations' : ''].filter(Boolean).join(' et ') + ')' : ''), n(p.CEt)], ['Participation des salariés', n(p.PART)], ['Impôt sur les bénéfices', n(p.IS)]);
    pr.push(['Production vendue', n(p.PV)], ['Production stockée', n(p.PS)], ['Production immobilisée', n(p.PI)], ['Subventions d’exploitation', n(p.SE)], ['Reprises sur dépréciations et provisions d’exploitation', n(p.RDP)], ['Autres produits', n(p.AP)], ['Produits financiers' + (p.RF ? ' (dont ' + n(p.RF) + ' de reprises)' : ''), n(p.PFt)], ['Produits exceptionnels' + (p.PCEA || p.QPS ? ' (dont ' + [p.PCEA ? n(p.PCEA) + ' de prix de cession' : '', p.QPS ? n(p.QPS) + ' de quote-part de subvention' : ''].filter(Boolean).join(' et ') + ')' : ''), n(p.PEt)]);
    en += '<div class="two">' + U.tbl(['Charges', 'K€'], ch) + U.tbl(['Produits', 'K€'], pr) + '</div>';
    en += '<p>Dividendes mis en paiement en N : ' + n(p.DIV) + ' K€.</p><p class="consigne">1. Calculez les soldes intermédiaires de gestion. 2. Calculez la CAF par les deux méthodes, puis l’autofinancement. 3. Commentez la part de la valeur ajoutée absorbée par les charges de personnel.</p>';
    qs = [];
    if (p.VM) qs.push(Q('mc', 'Marge commerciale (K€)', x.MC, '€', { tol: 0.5 }));
    qs.push(Q('prod', 'Production de l’exercice (K€)', x.PROD, '€', { tol: 0.5 }), Q('va', 'Valeur ajoutée (K€)', x.VA, '€', { tol: 0.5 }), Q('ebe', 'Excédent brut d’exploitation (K€)', x.EBE, '€', { tol: 0.5 }), Q('re', 'Résultat d’exploitation (K€)', x.RE, '€', { tol: 0.5 }), Q('rcai', 'Résultat courant avant impôt (K€)', x.RCAI, '€', { tol: 0.5 }), Q('rex', 'Résultat exceptionnel (K€)', x.REX, '€', { tol: 0.5 }), Q('rn', 'Résultat net (K€)', x.RN, '€', { tol: 0.5 }), Q('caf', 'CAF (K€)', x.CAFs, '€', { tol: 0.5 }), Q('af', 'Autofinancement (K€)', x.AF, '€', { tol: 0.5 }), Q('pva', 'Charges de personnel ÷ valeur ajoutée', U.rd(x.pers / x.VA * 100, 1), '%', { tol: 0.15 }));
    var sig = [];
    if (p.VM) sig.push(['Marge commerciale', n(p.VM) + ' − (' + n(p.AM) + ' ' + (p.VSM < 0 ? '− ' + n(-p.VSM) : '+ ' + n(p.VSM)) + ')', n(x.MC)]);
    sig.push(['Production de l’exercice', n(p.PV) + ' + ' + n(p.PS) + ' + ' + n(p.PI), n(x.PROD)], ['Consommations en provenance des tiers', n(p.AMP) + ' ' + (p.VSMP < 0 ? '− ' + n(-p.VSMP) : '+ ' + n(p.VSMP)) + ' + ' + n(p.ACE), n(x.CI)], ['Valeur ajoutée', (p.VM ? n(x.MC) + ' + ' : '') + n(x.PROD) + ' − ' + n(x.CI), '<b>' + n(x.VA) + '</b>'],
      ['EBE', n(x.VA) + ' + ' + n(p.SE) + ' − ' + n(p.IT) + ' − ' + n(p.SAL) + ' − ' + n(p.CS), '<b>' + n(x.EBE) + '</b>'], ['Résultat d’exploitation', n(x.EBE) + ' + ' + n(p.RDP) + ' + ' + n(p.AP) + ' − (' + n(p.DA) + ' + ' + n(p.DDAC) + ' + ' + n(p.DPR) + ') − ' + n(p.AC), n(x.RE)],
      ['Résultat financier', n(p.PFt) + ' − ' + n(p.CFt), n(x.RF)], ['RCAI', n(x.RE) + ' ' + (x.RF < 0 ? '− ' + n(-x.RF) : '+ ' + n(x.RF)), n(x.RCAI)], ['Résultat exceptionnel', n(p.PEt) + ' − ' + n(p.CEt), n(x.REX)], ['Résultat net', n(x.RCAI) + ' ' + (x.REX < 0 ? '− ' + n(-x.REX) : '+ ' + n(x.REX)) + ' − ' + n(p.PART) + ' − ' + n(p.IS), '<b>' + n(x.RN) + '</b>']);
    steps.push({ h: 'Soldes intermédiaires de gestion (K€)', html: U.calc(sig) });
    steps.push({ h: 'CAF – méthode soustractive', html: sous });
    steps.push({ h: 'CAF – méthode additive', html: U.tbl(['CAF (méthode additive)', 'Montant'], [['Résultat net', n(x.RN)], ['+ Dotations (' + [p.DA, p.DDAC, p.DPR, p.DF, p.DEX].filter(Boolean).map(n).join(' + ') + ')', n(x.dot)], ['− Reprises (' + ([p.RDP, p.RF, p.REX].filter(Boolean).map(n).join(' + ') || '0') + ')', n(x.rep)], ['+ Valeur comptable des éléments cédés', n(p.VCEC)], ['− Produits des cessions', n(p.PCEA)], ['− Quote-part des subventions virée au résultat', n(p.QPS)], { cls: 'tot', cells: ['= CAF', n(x.CAFa)] }]) });
    steps.push({ h: 'Autofinancement', html: U.calc([['Autofinancement', n(x.CAFs) + ' − ' + n(p.DIV), '<b>' + n(x.AF) + ' K€</b>']]) });
    var tp = x.pers / x.VA, tm = x.EBE / x.VA;
    com = 'Les charges de personnel (' + n(x.pers) + ' K€) absorbent ' + U.pc(tp, 1) + ' de la valeur ajoutée, ' + (tp > 0.7 ? 'une part élevée qui caractérise une activité de main-d’œuvre et laisse peu de marge pour rémunérer les capitaux' : 'une part modérée qui laisse une marge confortable pour rémunérer les capitaux') + '. Le taux de marge (EBE ÷ VA) n’est que de ' + U.pc(tm, 1) + (tm < 0.2 ? ', ce qui rend l’entreprise sensible à toute hausse des salaires.' : ', ce qui protège l’entreprise face à une hausse des coûts.') + ' Les dotations (' + n(p.DA + p.DDAC + p.DPR) + ' K€) ramènent le résultat d’exploitation à ' + n(x.RE) + ' K€ ; ' + (x.RF < 0 ? 'les charges financières pèsent ensuite sur le RCAI (' + n(x.RCAI) + ' K€). ' : 'le résultat financier est positif. ') + 'Le résultat net s’établit à ' + n(x.RN) + ' K€, soit ' + U.pc(x.RN / (p.VM + x.PROD), 1) + ' du chiffre d’affaires. La CAF (' + n(x.CAFs) + ' K€), identique par les deux méthodes, ' + (x.AF > 0 ? 'couvre les dividendes et laisse un autofinancement de ' + n(x.AF) + ' K€ pour investir et rembourser les emprunts.' : 'ne couvre pas les dividendes versés : l’entreprise s’appauvrit et devra trouver des financements externes.');
    return { enonce: en, questions: qs, journal: [], steps: steps, comment: com };
  }
};

/* ---------- 14. Bilan fonctionnel ---------- */
T.bilan_fonc = {
  id: 'bilan_fonc', nom: 'Bilan fonctionnel (FRNG, BFR, trésorerie)', famille: 'Analyse financière', ctrl: true, minutes: 20,
  fiche: {
    objectif: 'Reclasser le bilan comptable en valeurs brutes selon les cycles, puis calculer FRNG, BFRE, BFRHE et trésorerie nette.',
    etapes: [
      'Emplois stables = immobilisations brutes (incorporelles, corporelles, financières).',
      'Ressources stables = capitaux propres (capital non appelé déduit) + amortissements et dépréciations (de tout l’actif) + provisions pour risques + dettes financières hors concours bancaires courants et hors intérêts courus.',
      'Actif circulant d’exploitation = stocks bruts + créances clients brutes + avances versées + charges constatées d’avance d’exploitation.',
      'Dettes d’exploitation = fournisseurs + dettes fiscales et sociales hors IS + avances reçues + produits constatés d’avance d’exploitation.',
      'Hors exploitation : autres créances (actif) ; IS, dettes sur immobilisations, intérêts courus, dividendes à payer (passif).',
      'Trésorerie active = VMP brutes + disponibilités ; trésorerie passive = concours bancaires courants.',
      'FRNG = RS − ES ; BFRE = ACE − DE ; BFRHE = ACHE − DHE ; TN = FRNG − BFR, vérifiée par TA − TP.',
      'BFRE en jours de CA = BFRE ÷ CA HT × 360.'
    ],
    pieges: [
      'Reprendre les valeurs nettes : le bilan fonctionnel est en valeurs brutes, les amortissements et dépréciations passent en ressources stables.',
      'Laisser les concours bancaires dans les emprunts.',
      'Classer l’IS en dettes d’exploitation (il est hors exploitation).',
      'Les subventions d’investissement font partie des capitaux propres.',
      'Vérifier toujours FRNG − BFR = TA − TP.'
    ],
    comptes: []
  },
  gen: function (r) {
    for (var t = 0; t < 300; t++) {
      var p = { nom: U.nom(r), k: true };
      p.II = [r.int(2, 40) * 10, 0]; p.II[1] = U.r0(p.II[0] * r.int(20, 60) / 100);
      p.IC = [r.int(50, 600) * 10, 0]; p.IC[1] = U.r0(p.IC[0] * r.int(25, 60) / 100);
      p.IF = [r.int(0, 30) * 10, 0]; p.IF[1] = p.IF[0] ? r.int(0, 3) * 5 : 0;
      p.ST = [r.int(10, 150) * 10, 0]; p.ST[1] = r.int(0, 6) * 5;
      p.CL = [r.int(10, 200) * 10, 0]; p.CL[1] = r.int(0, 8) * 5;
      p.AUT = r.int(0, 20) * 10; p.VMP = r.int(0, 10) * 10; p.DISP = r.int(1, 30) * 10; p.CCA = r.int(0, 6) * 5;
      p.CSNA = r.chance(0.2) ? r.int(1, 10) * 10 : 0;
      p.CAP = r.int(20, 200) * 10 + p.CSNA * 2; p.RES_ = r.int(1, 25) * 10; p.SUB = r.chance(0.5) ? r.int(1, 15) * 10 : 0; p.PROV = r.int(0, 10) * 10;
      p.EMP = r.int(10, 300) * 10; p.CBC = r.chance(0.6) ? r.int(1, 25) * 10 : 0; p.ICNE = r.chance(0.3) ? r.int(1, 4) * 5 : 0; p.EMP += p.CBC + p.ICNE;
      p.FOU = U.r0((p.ST[0] + p.CL[0]) * r.int(30, 70) / 100 / 10) * 10; p.DFS = r.int(5, 60) * 10; p.ISD = r.chance(0.7) ? U.r0(p.DFS * r.int(10, 30) / 100 / 5) * 5 : 0;
      p.DIMMO = r.chance(0.5) ? r.int(1, 10) * 10 : 0; p.PCA = r.int(0, 6) * 5;
      var actif = (p.II[0] - p.II[1]) + (p.IC[0] - p.IC[1]) + (p.IF[0] - p.IF[1]) + (p.ST[0] - p.ST[1]) + (p.CL[0] - p.CL[1]) + p.AUT + p.VMP + p.DISP + p.CCA + p.CSNA;
      var passifSansRes = p.CAP + p.RES_ + p.SUB + p.PROV + p.EMP + p.FOU + p.DFS + p.DIMMO + p.PCA;
      p.RESV = actif - passifSansRes;
      if (p.RESV < 20 || p.RESV > p.CAP * 2) continue;
      p.CA = U.r0((p.ST[0] + p.CL[0]) * r.int(25, 60) / 10 / 100) * 100;
      return p;
    }
  },
  calc: function (p) {
    var x = {};
    x.ES = p.II[0] + p.IC[0] + p.IF[0];
    x.AMD = p.II[1] + p.IC[1] + p.IF[1] + p.ST[1] + p.CL[1] + (p.VMPd || 0);
    x.CP = p.CAP + p.RESV + p.RES_ + p.SUB - p.CSNA;
    x.EMPs = p.EMP - p.CBC - p.ICNE;
    x.RS = x.CP + x.AMD + p.PROV + x.EMPs;
    x.ACE = p.ST[0] + p.CL[0] + p.CCA; x.ACHE = p.AUT; x.TA = p.VMP + (p.VMPd || 0) + p.DISP;
    x.DE = p.FOU + (p.DFS - p.ISD) + p.PCA; x.DHE = p.ISD + p.DIMMO + p.ICNE + (p.DIVP || 0); x.TP = p.CBC;
    x.FRNG = x.RS - x.ES; x.BFRE = x.ACE - x.DE; x.BFRHE = x.ACHE - x.DHE; x.BFR = x.BFRE + x.BFRHE; x.TN = x.FRNG - x.BFR; x.TN2 = x.TA - x.TP;
    x.totE = x.ES + x.ACE + x.ACHE + x.TA; x.totR = x.RS + x.DE + x.DHE + x.TP;
    x.jours = x.BFRE / p.CA * 360;
    for (var kk in x) x[kk] = U.r2(x[kk]);
    return x;
  },
  solve: function (p) {
    var x = this.calc(p), n = U.n;
    var net = function (a) { return n(a[0] - a[1]); };
    var rows = [['Immobilisations incorporelles', n(p.II[0]), n(p.II[1]), net(p.II)], ['Immobilisations corporelles', n(p.IC[0]), n(p.IC[1]), net(p.IC)]];
    if (p.IF[0]) rows.push(['Immobilisations financières', n(p.IF[0]), n(p.IF[1]), net(p.IF)]);
    if (p.CSNA) rows.unshift(['Capital souscrit – non appelé', n(p.CSNA), '', n(p.CSNA)]);
    rows.push(['Stocks de marchandises', n(p.ST[0]), n(p.ST[1]), net(p.ST)], ['Clients et comptes rattachés', n(p.CL[0]), n(p.CL[1]), net(p.CL)]);
    if (p.AUT) rows.push(['Autres créances (hors exploitation)', n(p.AUT), '', n(p.AUT)]);
    if (p.VMP) rows.push(['Valeurs mobilières de placement', n(p.VMP + (p.VMPd || 0)), p.VMPd ? n(p.VMPd) : '', n(p.VMP)]);
    rows.push(['Disponibilités', n(p.DISP), '', n(p.DISP)]);
    if (p.CCA) rows.push(['Charges constatées d’avance (exploitation)', n(p.CCA), '', n(p.CCA)]);
    var tb = U.r2(rows.reduce(function (a, r) { return a + U.parseNum(r[1]); }, 0)), tam = x.AMD, tn = U.r2(tb - tam);
    rows.push({ cls: 'tot', cells: ['Total', n(tb), n(tam), n(tn)] });
    var pr = [['Capital', n(p.CAP)], ['Réserves', n(p.RESV)], ['Résultat de l’exercice', n(p.RES_)]];
    if (p.SUB) pr.push(['Subventions d’investissement', n(p.SUB)]);
    if (p.PROV) pr.push(['Provisions pour risques', n(p.PROV)]);
    pr.push(['Emprunts auprès des établissements de crédit' + (p.CBC || p.ICNE ? ' (dont ' + [p.CBC ? n(p.CBC) + ' de concours bancaires courants' : '', p.ICNE ? n(p.ICNE) + ' d’intérêts courus' : ''].filter(Boolean).join(' et ') + ')' : ''), n(p.EMP)], ['Fournisseurs', n(p.FOU)], ['Dettes fiscales et sociales' + (p.ISD ? ' (dont ' + n(p.ISD) + ' d’impôt sur les sociétés)' : ''), n(p.DFS)]);
    if (p.DIMMO) pr.push(['Dettes sur immobilisations', n(p.DIMMO)]);
    if (p.PCA) pr.push(['Produits constatés d’avance (exploitation)', n(p.PCA)]);
    pr.push({ cls: 'tot', cells: ['Total', n(tn)] });
    var en = '<p>Bilan de la société <b>' + p.nom + '</b> au 31/12/N, en milliers d’euros. Chiffre d’affaires HT de N : ' + n(p.CA) + ' K€.</p>';
    en += U.tbl(['Actif', 'Brut', 'Amort. et dépr.', 'Net'], rows) + U.tbl(['Passif', 'Montant'], pr);
    en += '<p class="consigne">1. Établissez le bilan fonctionnel condensé. 2. Calculez le FRNG, le BFRE, le BFRHE et la trésorerie nette, et vérifiez celle-ci. 3. Exprimez le BFRE en jours de CA et commentez l’équilibre financier.</p>';
    var t = { tol: 0.5 };
    var qs = [Q('es', 'Emplois stables (K€)', x.ES, '€', t), Q('rs', 'Ressources stables (K€)', x.RS, '€', t), Q('frng', 'FRNG (K€)', x.FRNG, '€', t), Q('bfre', 'BFRE (K€)', x.BFRE, '€', t), Q('bfrhe', 'BFRHE (K€)', x.BFRHE, '€', t), Q('tn', 'Trésorerie nette (K€)', x.TN, '€', t), Q('j', 'BFRE en jours de CA', U.rd(x.jours, 1), 'j', { tol: 1 })];
    var bf = U.tbl(['Emplois', 'K€', 'Ressources', 'K€'], [
      ['Emplois stables (' + [p.II[0], p.IC[0], p.IF[0]].filter(Boolean).map(n).join(' + ') + ')', n(x.ES), 'Ressources stables : capitaux propres ' + n(x.CP) + (p.CSNA ? ' (capital non appelé ' + n(p.CSNA) + ' déduit)' : '') + ' + amortissements et dépréciations ' + n(x.AMD) + ' + provisions ' + n(p.PROV) + ' + emprunts hors concours bancaires' + (p.ICNE ? ' et intérêts courus' : '') + ' ' + n(x.EMPs), n(x.RS)],
      ['Actif circulant d’exploitation (' + [p.ST[0], p.CL[0], p.CCA].filter(Boolean).map(n).join(' + ') + ')', n(x.ACE), 'Dettes d’exploitation (' + [p.FOU, p.DFS - p.ISD, p.PCA].filter(Boolean).map(n).join(' + ') + ')', n(x.DE)],
      ['Actif circulant hors exploitation', n(x.ACHE), 'Dettes hors exploitation (' + ([p.ISD, p.DIMMO, p.ICNE].filter(Boolean).map(n).join(' + ') || '0') + ')', n(x.DHE)],
      ['Trésorerie active (' + [p.VMP, p.DISP].filter(Boolean).map(n).join(' + ') + ')', n(x.TA), 'Trésorerie passive', n(x.TP)],
      { cls: 'tot', cells: ['Total', n(x.totE), 'Total', n(x.totR)] }]);
    var c = [['FRNG', n(x.RS) + ' − ' + n(x.ES), '<b>' + n(x.FRNG) + '</b>'], ['BFRE', n(x.ACE) + ' − ' + n(x.DE), n(x.BFRE)], ['BFRHE', n(x.ACHE) + ' − ' + n(x.DHE), n(x.BFRHE)], ['BFR', n(x.BFRE) + ' + ' + n(x.BFRHE), n(x.BFR)], ['Trésorerie nette', n(x.FRNG) + ' − ' + n(x.BFR), '<b>' + n(x.TN) + '</b>'], ['Vérification', n(x.TA) + ' − ' + n(x.TP), n(x.TN2)], ['BFRE en jours de CA', n(x.BFRE) + ' ÷ ' + n(p.CA) + ' × 360', n(x.jours, 1) + ' jours']];
    var com = [];
    com.push('Le FRNG ' + (x.FRNG >= 0 ? 'est positif (' + n(x.FRNG) + ' K€) : les ressources stables financent la totalité des immobilisations et dégagent un excédent pour le cycle d’exploitation.' : 'est négatif (' + n(x.FRNG) + ' K€) : une partie des immobilisations est financée par des ressources à court terme, situation risquée.'));
    com.push('Le BFRE atteint ' + n(x.BFRE) + ' K€, soit ' + n(x.jours, 0) + ' jours de chiffre d’affaires : ' + (x.BFRE < 0 ? 'le cycle d’exploitation dégage une ressource, ce qui est typique de la distribution.' : (x.jours > 60 ? 'c’est un besoin lourd, lié aux stocks et au crédit client.' : 'c’est un besoin raisonnable.')));
    com.push(x.TN >= 0 ? 'Le FRNG couvre le BFR et la trésorerie nette est positive (' + n(x.TN) + ' K€) : l’équilibre financier est respecté' + (x.TP ? ', même si l’entreprise recourt à ' + n(x.TP) + ' K€ de concours bancaires.' : '.') : 'Le FRNG ne couvre pas le BFR : la trésorerie nette est négative (' + n(x.TN) + ' K€) et l’entreprise dépend de ses concours bancaires (' + n(x.TP) + ' K€), une source de financement coûteuse et révocable.');
    com.push('Une croissance de l’activité augmenterait le BFR à proportion du chiffre d’affaires et pèserait sur la trésorerie.');
    com.push('Pour renforcer l’équilibre : allonger les ressources stables (mise en réserve des bénéfices, augmentation de capital, emprunt à long terme) et réduire le BFR (délais clients, gestion des stocks, négociation des délais fournisseurs dans la limite légale).');
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Bilan fonctionnel condensé (K€)', html: bf }, { h: 'Grands équilibres', html: U.calc(c) }], comment: com.join(' ') };
  }
};

/* ---------- 15. Ratios ---------- */
T.ratios = {
  id: 'ratios', nom: 'Ratios d’endettement, de liquidité et de rentabilité', famille: 'Analyse financière', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Calculer les ratios demandés et les commenter : chiffre, repère, conséquence pour l’entreprise.',
    etapes: [
      'Endettement général = dettes totales ÷ total du passif (au-delà de 2/3, forte dépendance aux créanciers) ; autonomie financière = capitaux propres ÷ total du passif (au moins 20 à 25 %).',
      'Liquidité générale = actif circulant ÷ dettes à court terme (> 1) ; réduite = (actif circulant − stocks) ÷ dettes à court terme ; immédiate = disponibilités ÷ dettes à court terme.',
      'Solvabilité générale = total de l’actif ÷ total des dettes (> 1).',
      'Rentabilité financière = résultat net ÷ capitaux propres ; rentabilité économique = résultat d’exploitation après impôt ÷ actif économique ; marge nette = résultat net ÷ CA.',
      'Délais : clients = créances clients TTC ÷ CA TTC × 360 ; fournisseurs = dettes fournisseurs TTC ÷ achats TTC × 360.',
      'Effet de levier : Rf = Re + (Re − i) × D ÷ CP, avec Re et i après impôt.',
      'Commentaire : 5 à 10 lignes, chiffre + norme + cause + conséquence.'
    ],
    pieges: [
      'Endettement : prendre toutes les dettes (long terme et court terme), pas seulement les emprunts.',
      'Rendement des capitaux propres sur le résultat net, pas sur le CA.',
      'Délais clients et fournisseurs : TTC sur TTC.',
      'Ne pas oublier la conclusion : l’entreprise peut-elle encore s’endetter ? payer ses dettes ? rémunérer ses actionnaires ?'
    ],
    comptes: []
  },
  gen: function (r, opt) {
    for (var t = 0; t < 200; t++) {
      var TP = r.int(5, 100) * 100000, CP = U.r0(TP * r.int(18, 60) / 100 / 10000) * 10000, PC = U.r0(TP * r.int(15, 45) / 100 / 10000) * 10000, DLT = TP - CP - PC;
      if (DLT < 0) continue;
      var AC = U.r0(TP * r.int(25, 65) / 100 / 10000) * 10000, ST = U.r0(AC * r.int(15, 45) / 100 / 1000) * 1000, DISP = U.r0(AC * r.int(8, 35) / 100 / 1000) * 1000, CL = AC - ST - DISP;
      if (CL <= 0) continue;
      var CA = U.r0(TP * r.int(60, 200) / 100 / 10000) * 10000;
      var lev = (!opt || opt.profil !== 'C') && r.chance(0.35);
      var p = { nom: U.nom(r), TP: TP, CP: CP, PC: PC, DLT: DLT, AC: AC, ST: ST, DISP: DISP, CL: CL, CA: CA };
      if (lev) { p.lev = true; p.i = r.pick([0.03, 0.04, 0.05, 0.06]); p.RE = U.r0(TP * r.int(4, 16) / 100 / 1000) * 1000; p.RN = U.r0((p.RE - p.i * DLT) * 0.75); if (p.RN <= 0) continue; }
      else p.RN = U.r0(CP * r.int(-5, 25) / 100 / 1000) * 1000;
      p.FOU = U.r0(PC * r.int(40, 80) / 100 / 1000) * 1000; p.ACH = U.r0(CA * r.int(30, 60) / 100 / 1000) * 1000;
      var all = ['endet', 'auto', 'liqG', 'liqR', 'liqI', 'solv', 'roe', 'marge', 'delaiC', 'delaiF'];
      p.liste = ['endet', 'liqG', 'roe'].concat(r.pickN(all.filter(function (k) { return ['endet', 'liqG', 'roe'].indexOf(k) < 0; }), r.int(1, 3)));
      return p;
    }
  },
  solve: function (p) {
    var e = U.e, n = U.n, D = p.DLT + p.PC;
    var R = {
      endet: { l: 'Ratio d’endettement général', v: D / p.TP, u: '%', calc: '(' + n(p.DLT) + ' + ' + n(p.PC) + ') ÷ ' + n(p.TP) },
      auto: { l: 'Autonomie financière', v: p.CP / p.TP, u: '%', calc: n(p.CP) + ' ÷ ' + n(p.TP) },
      liqG: { l: 'Liquidité générale', v: p.AC / p.PC, u: '', calc: n(p.AC) + ' ÷ ' + n(p.PC) },
      liqR: { l: 'Liquidité réduite', v: (p.AC - p.ST) / p.PC, u: '', calc: '(' + n(p.AC) + ' − ' + n(p.ST) + ') ÷ ' + n(p.PC) },
      liqI: { l: 'Liquidité immédiate', v: p.DISP / p.PC, u: '', calc: n(p.DISP) + ' ÷ ' + n(p.PC) },
      solv: { l: 'Solvabilité générale', v: p.TP / D, u: '', calc: n(p.TP) + ' ÷ ' + n(D) },
      roe: { l: 'Rentabilité des capitaux propres', v: p.RN / p.CP, u: '%', calc: n(p.RN) + ' ÷ ' + n(p.CP) },
      marge: { l: 'Taux de marge nette', v: p.RN / p.CA, u: '%', calc: n(p.RN) + ' ÷ ' + n(p.CA) },
      delaiC: { l: 'Délai de règlement clients (jours)', v: p.CL / (p.CA * 1.2) * 360, u: 'j', calc: n(p.CL) + ' ÷ (' + n(p.CA) + ' × 1,2) × 360' },
      delaiF: { l: 'Délai de règlement fournisseurs (jours)', v: p.FOU / (p.ACH * 1.2) * 360, u: 'j', calc: n(p.FOU) + ' ÷ (' + n(p.ACH) + ' × 1,2) × 360' }
    };
    var en = '<p>La société <b>' + p.nom + '</b> présente les données suivantes pour l’exercice N-1 :</p>';
    var d = [['Total actif', e(p.TP)], ['Total passif', e(p.TP)], ['Capitaux propres', e(p.CP)], ['Résultat net', e(p.RN)], ['Chiffre d’affaires HT', e(p.CA)], ['Dettes à long terme', e(p.DLT)], ['Actif circulant', e(p.AC)]];
    if (!p.hideST) d.push(['dont stocks', e(p.ST)], ['dont créances clients (TTC)', e(p.CL)]);
    d.push([p.hideST ? 'Liquidités' : 'dont liquidités', e(p.DISP)], ['Passif circulant (dettes à court terme)', e(p.PC)]);
    if (p.liste.indexOf('delaiF') >= 0) d.push(['dont dettes fournisseurs (TTC)', e(p.FOU)], ['Achats de l’exercice (HT)', e(p.ACH)]);
    if (p.lev) d.push(['Résultat d’exploitation', e(p.RE)], ['Taux d’intérêt des dettes à long terme', U.pcs(p.i)], ['Taux de l’impôt sur les sociétés', '25 %']);
    en += U.kv(d) + '<p>TVA 20 %. Année de 360 jours.' + (p.lev ? ' Le résultat net se limite au résultat d’exploitation diminué des intérêts des dettes à long terme et de l’impôt.' : '') + '</p>';
    var qs = [], c = [];
    p.liste.forEach(function (k) {
      var r = R[k], v = r.u === '%' ? U.rd(r.v * 100, 2) : U.rd(r.v, 2);
      qs.push(Q(k, r.l, v, r.u === '%' ? '%' : (r.u === 'j' ? 'j' : ''), r.u === '%' ? { tol: 0.15 } : (r.u === 'j' ? { tol: 1 } : { tol: 0.015 })));
      c.push([r.l, r.calc, r.u === '%' ? U.pc(r.v, 1) : (r.u === 'j' ? n(r.v, 1) + ' jours' : n(r.v, 2))]);
    });
    var Re, iN, Rf;
    if (p.lev) {
      Re = p.RE * 0.75 / (p.CP + p.DLT); iN = p.i * 0.75; Rf = Re + (Re - iN) * p.DLT / p.CP;
      qs.push(Q('re', 'Rentabilité économique après impôt (RE × 0,75 ÷ (CP + DLT))', U.rd(Re * 100, 2), '%', { tol: 0.1 }), Q('rf', 'Rentabilité financière par la formule du levier', U.rd(Rf * 100, 2), '%', { tol: 0.15 }));
      c.push(['Rentabilité économique', n(p.RE) + ' × 0,75 ÷ (' + n(p.CP) + ' + ' + n(p.DLT) + ')', U.pc(Re)], ['Coût de la dette après impôt', U.pcs(p.i) + ' × 0,75', U.pc(iN)], ['Rf = Re + (Re − i) × D ÷ CP', U.pc(Re) + ' + (' + U.pc(Re) + ' − ' + U.pc(iN) + ') × ' + n(p.DLT) + ' ÷ ' + n(p.CP), '<b>' + U.pc(Rf) + '</b> (= RN ÷ CP)']);
    }
    en += '<p class="consigne">Calculez les ratios suivants et commentez chacun en 5 à 10 lignes : ' + p.liste.map(function (k) { return R[k].l.toLowerCase(); }).join(', ') + (p.lev ? ', puis la rentabilité économique et l’effet de levier' : '') + '.</p>';
    var com = [];
    var en_ = R.endet.v, lg = R.liqG.v, roe = R.roe.v;
    com.push('Endettement : ' + U.pc(en_, 1) + ' du financement provient de tiers ; l’autonomie financière n’est que de ' + U.pc(p.CP / p.TP, 1) + '. ' + (en_ > 2 / 3 ? 'Au-delà des deux tiers, l’entreprise dépend fortement de ses créanciers et sa capacité d’emprunt est réduite.' : 'Sous le seuil des deux tiers, l’entreprise conserve une capacité d’emprunt.') + (p.DLT > p.CP ? ' Les dettes à long terme dépassent les capitaux propres : les banques seront réticentes à prêter davantage.' : ' Les dettes à long terme restent inférieures aux capitaux propres.'));
    com.push('Liquidité : le ratio de ' + n(lg, 2) + (lg >= 1 ? ' indique que l’actif circulant couvre les dettes à court terme' + (lg < 1.2 ? ', avec une marge faible de ' + e(p.AC - p.PC) : '') + '.' : ' signale que l’actif circulant ne couvre pas les dettes à court terme : risque d’insolvabilité à court terme.') + ' La liquidité immédiate n’est que de ' + n(p.DISP / p.PC, 2) + ' : l’entreprise dépend de l’encaissement de ses créances et de l’écoulement de ses stocks. La solvabilité générale est ' + (p.TP / D > 1 ? 'assurée (l’actif couvre ' + n(p.TP / D, 2) + ' fois les dettes).' : 'compromise.'));
    com.push('Rentabilité : la rentabilité des capitaux propres atteint ' + U.pc(roe, 1) + (roe > 0.1 ? ', une bonne rémunération des actionnaires, supérieure aux placements sans risque' : (roe < 0 ? ' : l’exercice est déficitaire et détruit de la valeur pour les actionnaires' : ', une rémunération faible au regard du risque pris')) + ' ; elle s’explique par une marge nette de ' + U.pc(p.RN / p.CA, 1) + (p.lev ? ' et par l’effet de levier : la rentabilité économique (' + U.pc(Re, 1) + ') ' + (Re > iN ? 'dépasse le coût de la dette après impôt (' + U.pc(iN, 2) + '), donc l’endettement améliore la rentabilité financière (' + U.pc(Rf, 1) + ').' : 'est inférieure au coût de la dette après impôt (' + U.pc(iN, 2) + ') : l’endettement dégrade la rentabilité financière (effet de massue).') : ' et par l’effet de levier de l’endettement.'));
    if (p.liste.indexOf('delaiC') >= 0) com.push('Le délai clients de ' + n(R.delaiC.v, 0) + ' jours ' + (R.delaiC.v > 60 ? 'dépasse les usages et pèse sur le BFR.' : 'reste maîtrisé.'));
    if (p.liste.indexOf('delaiF') >= 0) com.push('Le délai fournisseurs de ' + n(R.delaiF.v, 0) + ' jours ' + (R.delaiF.v > 60 ? 'excède la limite légale de 60 jours.' : 'respecte la limite légale de 60 jours.'));
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Calculs', html: U.calc(c) }], comment: com.join(' ') };
  }
};
