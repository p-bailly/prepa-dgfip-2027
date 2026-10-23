/* ===== Cadre comptable et opérations courantes : généralités, tenue des comptes, facturation, paie ===== */
(function () {
  var add = {
    '101': 'Capital', '164': 'Emprunts auprès des établissements de crédit', '2183': 'Matériel de bureau et informatique', '4091': 'Fournisseurs – avances et acomptes versés sur commandes', '4096': 'Fournisseurs – créances pour emballages et matériel à rendre',
    '4191': 'Clients – avances et acomptes reçus sur commandes', '4196': 'Clients – dettes sur emballages et matériel consignés',
    '421': 'Personnel – rémunérations dues', '425': 'Personnel – avances et acomptes', '427': 'Personnel – oppositions', '431': 'Sécurité sociale', '437': 'Autres organismes sociaux', '4421': 'Prélèvements à la source (impôt sur le revenu)',
    '531': 'Caisse', '609': 'Rabais, remises et ristournes obtenus sur achats', '641': 'Rémunérations du personnel', '645': 'Charges de sécurité sociale et de prévoyance', '665': 'Escomptes accordés',
    '7085': 'Ports et frais accessoires facturés', '709': 'Rabais, remises et ristournes accordés par l’entreprise', '765': 'Escomptes obtenus'
  };
  for (var k in add) if (!U.PCG[k]) U.PCG[k] = add[k];
  var alt = { '7085': ['708'], '6241': ['624'], '4421': ['442'], '641': ['6411'], '645': ['6451'], '709': ['7097'], '609': ['6097'], '4096': ['409'], '4196': ['419'], '4091': ['409'], '4191': ['419'] };
  for (var a in alt) if (!U.ALT[a]) U.ALT[a] = alt[a];
})();

/* ---------- 1. Généralités : objet, principes, sources du droit comptable ---------- */
T.generalites = {
  id: 'generalites', nom: 'Généralités : objet, principes et sources du droit comptable', famille: 'Cadre comptable', ctrl: true, minutes: 10,
  fiche: {
    objectif: 'Savoir définir la comptabilité, reconnaître le principe comptable en jeu dans une situation et situer les sources du droit comptable français et les normes IFRS.',
    cours: [
      { t: 'Objet de la comptabilité', l: [
        'Définition (PCG, art. 121-1) : système d’organisation de l’information financière permettant de saisir, classer, enregistrer des données de base chiffrées et présenter des états reflétant une image fidèle du patrimoine, de la situation financière et du résultat de l’entité à la date de clôture.',
        'Rôles : instrument de preuve (la comptabilité régulièrement tenue peut être admise en justice, C. com., art. L123-23), information des tiers (associés, banques, fournisseurs, salariés, État), outil de gestion et de décision, base de calcul de l’impôt (connexion fiscalo-comptable).',
        'Obligations du commerçant (C. com., art. L123-12) : enregistrer chronologiquement les mouvements du patrimoine, contrôler par inventaire au moins une fois tous les douze mois l’existence et la valeur des actifs et des passifs, établir des comptes annuels (bilan, compte de résultat, annexe) à la clôture.',
        'Conservation : dix ans pour les documents comptables et les pièces justificatives (C. com., art. L123-22) ; six ans pour le droit de contrôle fiscal (LPF, art. L102 B).'
      ] },
      { t: 'Principes comptables', l: [
        'Régularité, sincérité, image fidèle : les comptes sont réguliers (conformes aux règles), sincères (appliquées de bonne foi) et donnent une image fidèle (C. com., art. L123-14) ; si l’application d’une règle ne suffit pas, l’annexe donne des informations complémentaires.',
        'Prudence : appréciation raisonnable des faits pour éviter de transférer sur l’avenir des incertitudes présentes ; les pertes probables sont constatées, les gains latents ne le sont pas.',
        'Continuité d’exploitation : l’entreprise est présumée poursuivre son activité ; les actifs ne sont pas évalués à leur valeur liquidative.',
        'Permanence des méthodes : mêmes méthodes d’évaluation et de présentation d’un exercice à l’autre, sauf changement justifié (meilleure information) expliqué dans l’annexe.',
        'Indépendance des exercices : on rattache à chaque exercice les charges et produits qui le concernent, et eux seuls (charges et produits constatés d’avance, à payer, à recevoir).',
        'Coût historique : un bien entre au patrimoine à son coût d’acquisition ou de production ; les plus-values ultérieures ne sont pas constatées (hors réévaluation légale ou libre).',
        'Non-compensation : aucune compensation entre actif et passif, ni entre charges et produits.',
        'Intangibilité du bilan d’ouverture : le bilan d’ouverture d’un exercice est celui de clôture de l’exercice précédent.',
        'Importance relative (significativité) : les éléments sans importance peuvent faire l’objet d’un traitement simplifié (petit matériel en charges, par exemple).'
      ] },
      { t: 'Sources du droit comptable', l: [
        'Droit européen : directive comptable 2013/34/UE (comptes annuels et consolidés), transposée en droit français.',
        'Loi et règlement : Code de commerce (art. L123-12 à L123-28 et R123-172 et suivants).',
        'Normes : règlement ANC n° 2014-03 relatif au plan comptable général, modifié notamment par le règlement ANC n° 2022-06 (modernisation des états financiers, exercices ouverts depuis le 1er janvier 2025) ; homologation par arrêté ministériel.',
        'Autorité des normes comptables (ANC) : depuis 2009, seule autorité qui établit les normes comptables françaises du secteur privé.',
        'Doctrine et jurisprudence : avis et recommandations de l’ANC, positions de la CNCC et de l’Ordre des experts-comptables, décisions du Conseil d’État (droit fiscal) et de la Cour de cassation.',
        'Droit fiscal : le CGI impose de respecter le PCG sauf incompatibilité avec les règles fiscales (CGI, ann. III, art. 38 quater) ; les écarts sont traités extra-comptablement ou par provisions réglementées.'
      ] },
      { t: 'Normes IFRS', l: [
        'Élaboration : IASB (International Accounting Standards Board), organe de la fondation IFRS ; normes IAS (anciennes) et IFRS, interprétations IFRIC et SIC.',
        'Adoption européenne : règlement CE n° 1606/2002 ; chaque norme est adoptée par la Commission après avis de l’EFRAG.',
        'Champ : obligatoires pour les comptes consolidés des sociétés dont les titres sont admis sur un marché réglementé de l’UE (exercices ouverts depuis le 1er janvier 2005) ; option pour les autres groupes ; les comptes individuels français restent établis selon le PCG.',
        'Esprit : cadre conceptuel orienté vers les investisseurs et les prêteurs, prééminence de la substance sur la forme, recours à la juste valeur (ex. IFRS 16 : les biens loués figurent à l’actif du locataire).'
      ] }
    ],
    titreEtapes: 'Méthode pour une question de cours',
    etapes: [
      'Identifier la notion en jeu : objet, principe, source ou référentiel.',
      'La définir en une phrase précise, avec le texte de référence si tu le connais (Code de commerce, PCG, règlement européen).',
      'Expliquer sa conséquence pratique : ce que l’entreprise doit comptabiliser, ou s’interdit de comptabiliser.',
      'Illustrer par un exemple chiffré ou une écriture quand c’est possible.'
    ],
    pieges: [
      'Confondre prudence et coût historique : la prudence vise les pertes probables et interdit les gains latents ; le coût historique fixe la valeur d’entrée.',
      'Croire que les IFRS s’appliquent aux comptes individuels des sociétés françaises : elles visent les comptes consolidés des sociétés cotées.',
      'Confondre l’ANC (normes françaises) et l’IASB (normes internationales), ou l’AMF (marchés financiers) avec un normalisateur comptable.',
      'Oublier que l’image fidèle est un objectif, pas une méthode : elle peut imposer une information complémentaire dans l’annexe.',
      'Durées de conservation : dix ans en droit commercial, six ans pour le contrôle fiscal.'
    ],
    comptes: []
  },
  BANQUE: [
    { s: 'Le prix de vente d’une partie du stock est tombé sous son coût : l’entreprise constate une dépréciation, mais n’anticipe pas la hausse des cours annoncée pour le trimestre suivant.', ok: 'Prudence', d: ['Continuité d’exploitation', 'Permanence des méthodes', 'Non-compensation'], j: 'La perte probable est constatée, le gain espéré ne l’est pas : c’est l’asymétrie propre à la prudence.' },
    { s: 'Un terrain acquis 200 000 € il y a quinze ans, qui en vaut aujourd’hui 600 000 €, reste inscrit au bilan pour 200 000 €.', ok: 'Coût historique', d: ['Indépendance des exercices', 'Importance relative', 'Intangibilité du bilan d’ouverture'], j: 'Le bien reste évalué à son coût d’entrée : la plus-value latente n’est pas constatée.' },
    { s: 'Une prime d’assurance annuelle payée le 1er octobre N est pour 9/12 reportée sur N+1 par une charge constatée d’avance.', ok: 'Indépendance des exercices', d: ['Prudence', 'Coût historique', 'Non-compensation'], j: 'Chaque exercice ne supporte que les charges qui le concernent : 3/12 en N, 9/12 en N+1.' },
    { s: 'Des marchandises livrées le 28 décembre N et facturées le 5 janvier N+1 sont enregistrées dans le chiffre d’affaires de N (facture à établir).', ok: 'Indépendance des exercices', d: ['Prudence', 'Continuité d’exploitation', 'Permanence des méthodes'], j: 'Le produit est rattaché à l’exercice de la livraison, quelle que soit la date de la facture.' },
    { s: 'L’entreprise amortit ses machines en linéaire depuis sa création ; elle ne peut changer de méthode que pour donner une meilleure information, en le justifiant dans l’annexe.', ok: 'Permanence des méthodes', d: ['Sincérité', 'Coût historique', 'Importance relative'], j: 'La comparabilité des comptes dans le temps impose de conserver les mêmes méthodes.' },
    { s: 'L’entreprise doit 10 000 € à un fournisseur qui lui doit par ailleurs 4 000 € : la dette et la créance figurent séparément au bilan.', ok: 'Non-compensation', d: ['Prudence', 'Image fidèle', 'Indépendance des exercices'], j: 'On ne présente pas un solde net de 6 000 € : actif et passif sont présentés sans compensation.' },
    { s: 'Les capitaux propres du bilan au 1er janvier N sont strictement identiques à ceux du bilan de clôture au 31 décembre N−1.', ok: 'Intangibilité du bilan d’ouverture', d: ['Permanence des méthodes', 'Coût historique', 'Régularité'], j: 'Le bilan d’ouverture d’un exercice correspond au bilan de clôture du précédent.' },
    { s: 'Les immobilisations sont amorties sur leur durée d’utilisation et non évaluées au prix qu’on en obtiendrait en les vendant en urgence.', ok: 'Continuité d’exploitation', d: ['Prudence', 'Indépendance des exercices', 'Sincérité'], j: 'L’entreprise est présumée poursuivre son activité : on n’applique pas de valeur liquidative.' },
    { s: 'Une agrafeuse de 15 € HT est enregistrée directement en charges plutôt qu’immobilisée.', ok: 'Importance relative', d: ['Prudence', 'Coût historique', 'Non-compensation'], j: 'Un élément non significatif peut recevoir un traitement simplifié (tolérance de 500 € HT pour le petit matériel).' },
    { s: 'Les comptes sont établis conformément aux règles et procédures en vigueur.', ok: 'Régularité', d: ['Sincérité', 'Image fidèle', 'Prudence'], j: 'C’est la définition de la régularité (conformité aux règles).' },
    { s: 'Les règles sont appliquées de bonne foi, en fonction de la connaissance que les dirigeants ont de la réalité et de l’importance des opérations.', ok: 'Sincérité', d: ['Régularité', 'Prudence', 'Permanence des méthodes'], j: 'La sincérité est l’application de bonne foi des règles.' },
    { s: 'En normes IFRS, un bien loué est inscrit à l’actif du locataire, qui en contrôle l’utilisation, même s’il n’en est pas propriétaire.', ok: 'Prééminence de la substance sur la forme', d: ['Coût historique', 'Prudence', 'Non-compensation'], j: 'La réalité économique (le contrôle du bien) l’emporte sur la forme juridique du contrat.' },
    { s: 'Quel texte contient le plan comptable général applicable en France ?', ok: 'Le règlement ANC n° 2014-03 modifié', d: ['Le règlement européen n° 1606/2002', 'Le Code général des impôts', 'La norme IAS 1'], j: 'Le PCG est le règlement ANC n° 2014-03, homologué par arrêté et modifié depuis (notamment par le règlement n° 2022-06).' },
    { s: 'Quel organisme établit les normes comptables françaises du secteur privé ?', ok: 'L’Autorité des normes comptables (ANC)', d: ['L’IASB', 'L’Autorité des marchés financiers (AMF)', 'La Compagnie nationale des commissaires aux comptes'], j: 'Depuis 2009, l’ANC est l’unique normalisateur comptable français du secteur privé.' },
    { s: 'Quel organisme élabore les normes IFRS ?', ok: 'L’IASB', d: ['L’ANC', 'La Commission européenne', 'L’EFRAG'], j: 'L’IASB élabore les normes ; la Commission européenne les adopte, après avis de l’EFRAG.' },
    { s: 'Depuis 2005, les normes IFRS sont obligatoires pour :', ok: 'Les comptes consolidés des sociétés cotées sur un marché réglementé de l’UE', d: ['Les comptes individuels de toutes les sociétés', 'Les comptes consolidés de tous les groupes', 'Les comptes individuels des sociétés cotées'], j: 'Règlement CE n° 1606/2002 : seuls les comptes consolidés des sociétés cotées sont visés ; les comptes individuels restent au PCG.' },
    { s: 'Combien de temps le Code de commerce impose-t-il de conserver les documents comptables et les pièces justificatives ?', ok: 'Dix ans', d: ['Trois ans', 'Six ans', 'Cinq ans'], j: 'C. com., art. L123-22 : dix ans (le délai fiscal de six ans est distinct).' },
    { s: 'Les comptes annuels doivent avant tout donner :', ok: 'Une image fidèle du patrimoine, de la situation financière et du résultat', d: ['La valeur de marché de l’entreprise', 'Le montant de l’impôt dû', 'Une prévision du résultat de l’exercice suivant'], j: 'C. com., art. L123-14 : l’image fidèle est l’objectif des comptes annuels.' },
    { s: 'Au moins une fois tous les douze mois, le commerçant doit :', ok: 'Contrôler par inventaire l’existence et la valeur des actifs et passifs', d: ['Faire certifier ses comptes par un commissaire aux comptes', 'Publier ses comptes au BODACC', 'Établir des comptes selon les normes IFRS'], j: 'C. com., art. L123-12 : obligation d’inventaire annuel, préalable aux comptes annuels.' },
    { s: 'Le cadre conceptuel des IFRS s’adresse d’abord :', ok: 'Aux investisseurs et aux prêteurs', d: ['À l’administration fiscale', 'Aux salariés', 'Aux tribunaux de commerce'], j: 'Les IFRS visent l’information des apporteurs de capitaux, quand le PCG reste marqué par la protection des créanciers et la fiscalité.' },
    { s: 'Une entreprise pratique l’amortissement dégressif fiscal alors que l’usage du bien justifie un amortissement linéaire. L’écart est enregistré en :', ok: 'Amortissements dérogatoires (provisions réglementées)', d: ['Dépréciations de l’actif', 'Charges constatées d’avance', 'Provisions pour risques'], j: 'La connexion fiscalo-comptable impose de comptabiliser l’avantage fiscal : il passe en provisions réglementées (145), sans fausser l’amortissement économique.' },
    { s: 'Le livre-journal enregistre les opérations :', ok: 'Dans l’ordre chronologique, opération par opération', d: ['Compte par compte', 'Classées par tiers', 'Uniquement à la clôture de l’exercice'], j: 'Le livre-journal est chronologique ; le grand livre classe ces mêmes écritures par compte.' }
  ],
  gen: function (r) {
    // six situations dont les réponses diffèrent
    var B = this.BANQUE, idx = [], vus = [];
    r.shuffle(B.map(function (x, i) { return i; })).forEach(function (i) { if (idx.length < 6 && vus.indexOf(B[i].ok) < 0) { idx.push(i); vus.push(B[i].ok); } });
    return { nom: U.nom(r), items: idx.map(function (i) { return { i: i, o: r.shuffle([0, 1, 2, 3]) }; }) };
  },
  solve: function (p) {
    var B = this.BANQUE, qs = [], rows = [];
    var en = '<p>Pour chacune des situations suivantes, indiquez le principe comptable, la règle ou la source du droit comptable en jeu.</p>';
    en += '<ol>' + p.items.map(function (it) { return '<li>' + B[it.i].s + '</li>'; }).join('') + '</ol>';
    en += '<p class="consigne">Choisissez la bonne réponse pour chaque situation, puis justifiez-la en une phrase sur la copie.</p>';
    p.items.forEach(function (it, k) {
      var b = B[it.i], all = [b.ok].concat(b.d), opts = it.o.map(function (j) { return all[j]; });
      qs.push(QC('g' + (k + 1), 'Situation ' + (k + 1), opts, it.o.indexOf(0)));
      rows.push([String(k + 1), '<b>' + b.ok + '</b>', b.j]);
    });
    var com = 'Une question de cours se traite en trois temps : définir la notion (avec son texte de référence quand on le connaît : Code de commerce, PCG, règlement européen), en tirer la conséquence pratique pour l’enregistrement comptable, puis l’illustrer. Les principes s’articulent autour de l’objectif d’image fidèle fixé par l’article L123-14 du Code de commerce : régularité et sincérité en sont les conditions, prudence, indépendance des exercices, permanence des méthodes, coût historique, non-compensation et intangibilité du bilan d’ouverture en sont les règles d’application. Les comptes individuels français relèvent du PCG établi par l’ANC ; les normes IFRS de l’IASB ne s’imposent qu’aux comptes consolidés des sociétés cotées.';
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Réponses justifiées', html: U.tbl(['n°', 'Réponse', 'Justification'], rows) }], comment: com };
  }
};

/* ---------- 2. Tenue, structure et fonctionnement des comptes ---------- */
T.tenue = {
  id: 'tenue', nom: 'Tenue et fonctionnement des comptes', famille: 'Cadre comptable', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Enregistrer des opérations simples en partie double, les reporter au grand livre et vérifier l’égalité des totaux de la balance.',
    cours: [
      { t: 'Les comptes et le plan comptable', l: [
        'Compte : tableau à deux colonnes, débit à gauche et crédit à droite ; son solde est la différence entre le total le plus fort et le plus faible (solde débiteur ou créditeur).',
        'Plan comptable général : liste codifiée des comptes (codification décimale : le premier chiffre est la classe, chaque chiffre ajouté précise le compte).',
        'Comptes de bilan : classe 1 capitaux (capitaux propres, provisions, emprunts), classe 2 immobilisations, classe 3 stocks et en-cours, classe 4 tiers, classe 5 financiers (banque, caisse, VMP).',
        'Comptes de gestion : classe 6 charges, classe 7 produits ; ils sont soldés à la clôture par le résultat (12). La classe 8 regroupe les comptes spéciaux (engagements hors bilan).',
        'Comptes collectifs et individuels : 401 Fournisseurs et 411 Clients sont subdivisés en un compte par tiers (comptes auxiliaires).'
      ] },
      { t: 'La partie double', l: [
        'Principe : toute opération affecte au moins deux comptes ; le total des débits est égal au total des crédits.',
        'Emploi et ressource : le compte débité enregistre l’emploi (ce que l’entreprise reçoit), le compte crédité la ressource (ce qu’elle donne ou doit).',
        'Actif : augmente au débit, diminue au crédit (solde débiteur). Passif : augmente au crédit, diminue au débit (solde créditeur).',
        'Charges : au débit (solde débiteur). Produits : au crédit (solde créditeur).'
      ] },
      { t: 'Les livres comptables et leur tenue', l: [
        'Livre-journal : enregistrement chronologique de chaque opération (date, comptes, libellé, montants, référence de la pièce justificative).',
        'Grand livre : ensemble des comptes ; les écritures du journal y sont reportées compte par compte.',
        'Balance : liste de tous les comptes avec leurs totaux et leurs soldes ; total des débits = total des crédits, total des soldes débiteurs = total des soldes créditeurs.',
        'Livre d’inventaire : relevé annuel des actifs et passifs et reprise des comptes annuels (C. com., art. R123-177).',
        'Règles de tenue : en euros et en français, sans blanc ni altération, chronologique, chaque écriture appuyée par une pièce justificative ; procédure de clôture rendant les écritures intangibles (irréversibilité) ; fichier des écritures comptables (FEC) à remettre en cas de contrôle fiscal d’une comptabilité informatisée (LPF, art. L47 A).'
      ] },
      { t: 'Le système centralisateur', l: [
        'Journaux auxiliaires : achats, ventes, banque, caisse, opérations diverses ; chacun enregistre une catégorie d’opérations, souvent tenue par une personne différente.',
        'Centralisation : au moins une fois par mois, les totaux de chaque journal auxiliaire sont reportés au journal général et au grand livre général.',
        'Comptes de virements internes (58) : ils évitent d’enregistrer deux fois une opération qui figure dans deux journaux (retrait d’espèces : banque et caisse) ; ils sont soldés après la centralisation.',
        'Avantages : division du travail, contrôles croisés (balance auxiliaire clients = solde du 411), allégement du journal général.'
      ] }
    ],
    etapes: [
      'Pour chaque opération, repérer les deux flux : ce que l’entreprise reçoit (débit) et ce qu’elle donne ou doit (crédit).',
      'Choisir les comptes du PCG (classe puis compte précis) et calculer la TVA si l’opération y est soumise.',
      'Passer l’écriture au journal : date, comptes débités puis crédités, libellé, montants ; vérifier débit = crédit.',
      'Reporter chaque ligne au grand livre et calculer les soldes des comptes.',
      'Établir la balance : total des mouvements débit = total des mouvements crédit, total des soldes débiteurs = total des soldes créditeurs.'
    ],
    pieges: [
      'Inverser le sens d’un compte de trésorerie : un encaissement se débite au 512, un paiement se crédite.',
      'Oublier la TVA déductible sur un achat ou la TVA collectée sur une vente.',
      'Enregistrer une immobilisation achetée à crédit au 401 au lieu du 404 Fournisseurs d’immobilisations.',
      'Croire que l’égalité de la balance prouve l’absence d’erreur : une écriture oubliée, passée deux fois ou imputée au mauvais compte ne la déséquilibre pas.',
      'Confondre solde créditeur du 512 (découvert, au passif) et solde débiteur (disponibilités, à l’actif).'
    ],
    comptes: ['101 Capital', '164 Emprunts', '2183 Matériel de bureau et informatique', '401 Fournisseurs', '404 Fournisseurs d’immobilisations', '411 Clients', '44562 / 44566 TVA déductible', '44571 TVA collectée', '512 Banque', '531 Caisse', '607 Achats de marchandises', '613 Locations', '707 Ventes de marchandises']
  },
  NATURES: ['Actif du bilan', 'Passif du bilan', 'Charge (compte de résultat)', 'Produit (compte de résultat)'],
  COMPTES: [['211', 'Terrains', 0], ['2154', 'Matériel industriel', 0], ['37', 'Stocks de marchandises', 0], ['411', 'Clients', 0], ['512', 'Banque (solde débiteur)', 0], ['44566', 'TVA déductible sur autres biens et services', 0], ['486', 'Charges constatées d’avance', 0], ['101', 'Capital', 1], ['1061', 'Réserve légale', 1], ['164', 'Emprunts auprès des établissements de crédit', 1], ['401', 'Fournisseurs', 1], ['44571', 'TVA collectée', 1], ['421', 'Personnel – rémunérations dues', 1], ['487', 'Produits constatés d’avance', 1], ['607', 'Achats de marchandises', 2], ['613', 'Locations', 2], ['641', 'Rémunérations du personnel', 2], ['6611', 'Intérêts des emprunts', 2], ['6811', 'Dotations aux amortissements', 2], ['707', 'Ventes de marchandises', 3], ['706', 'Prestations de services', 3], ['765', 'Escomptes obtenus', 3], ['7815', 'Reprises sur provisions d’exploitation', 3]],
  gen: function (r) {
    var C = r.int(20, 120) * 1000;
    var ops = [{ k: 'apport', mt: C }];
    // une opération de financement ou d'investissement, puis au moins une opération d'exploitation
    var pool = [r.pick(['emprunt', 'materiel', 'loyer'])], av = r.pick([['achat'], ['vente'], ['achat', 'vente'], ['achat', 'vente']]);
    pool = pool.concat(av);
    var order = ['emprunt', 'materiel', 'achat', 'vente', 'loyer'];
    pool.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    pool.forEach(function (k) {
      if (k === 'emprunt') ops.push({ k: k, mt: r.int(10, 60) * 1000 });
      if (k === 'materiel') ops.push({ k: k, mt: r.int(15, 120) * 100 });
      if (k === 'achat') ops.push({ k: k, mt: r.int(40, 300) * 100 });
      if (k === 'vente') ops.push({ k: k, mt: r.int(50, 400) * 100 });
      if (k === 'loyer') ops.push({ k: k, mt: r.int(8, 40) * 100 });
    });
    // un règlement partiel pour faire vivre les comptes de tiers
    var achat = ops.filter(function (o) { return o.k === 'achat'; })[0], vente = ops.filter(function (o) { return o.k === 'vente'; })[0];
    if (vente) ops.push({ k: 'encaissement', mt: U.r0(vente.mt * 1.2 * r.int(3, 8) / 10 / 10) * 10 });
    else if (achat) ops.push({ k: 'reglement', mt: U.r0(achat.mt * 1.2 * r.int(3, 8) / 10 / 10) * 10 });
    var nat = r.pickN(this.COMPTES.map(function (x, i) { return i; }), 3);
    var j = 2, m = r.int(1, 10);
    ops.forEach(function (o) { o.d = j; j += r.int(1, 4); });
    return { nom: U.nom(r), m: m, ops: ops, nat: nat };
  },
  calc: function (p) {
    var L = U.L, J = [];
    p.ops.forEach(function (o) {
      var d = U.dt(o.d, p.m), mt = o.mt, tva = U.r2(mt * 0.2), ttc = U.r2(mt + tva);
      if (o.k === 'apport') J.push(U.entry(d, 'Apport en numéraire des associés', [L('512', mt, 0), L('101', 0, mt)]));
      if (o.k === 'emprunt') J.push(U.entry(d, 'Emprunt obtenu', [L('512', mt, 0), L('164', 0, mt)]));
      if (o.k === 'materiel') J.push(U.entry(d, 'Achat de matériel informatique à crédit', [L('2183', mt, 0), L('44562', tva, 0), L('404', 0, ttc)]));
      if (o.k === 'achat') J.push(U.entry(d, 'Achat de marchandises à crédit', [L('607', mt, 0), L('44566', tva, 0), L('401', 0, ttc)]));
      if (o.k === 'vente') J.push(U.entry(d, 'Vente de marchandises à crédit', [L('411', ttc, 0), L('707', 0, mt), L('44571', 0, tva)]));
      if (o.k === 'loyer') J.push(U.entry(d, 'Loyer du mois payé par virement', [L('613', mt, 0), L('44566', tva, 0), L('512', 0, ttc)]));
      if (o.k === 'encaissement') J.push(U.entry(d, 'Règlement partiel d’un client par virement', [L('512', mt, 0), L('411', 0, mt)]));
      if (o.k === 'reglement') J.push(U.entry(d, 'Règlement partiel d’un fournisseur par chèque', [L('401', mt, 0), L('512', 0, mt)]));
    });
    // grand livre et balance
    var gl = {}, ordre = [];
    J.forEach(function (en, i) {
      en.lines.forEach(function (l) {
        if (!gl[l.a]) { gl[l.a] = { d: 0, c: 0, mv: [] }; ordre.push(l.a); }
        gl[l.a].d = U.r2(gl[l.a].d + l.d); gl[l.a].c = U.r2(gl[l.a].c + l.c); gl[l.a].mv.push({ i: i, d: l.d, c: l.c, dt: en.date });
      });
    });
    ordre.sort();
    var tD = 0, tC = 0, sD = 0, sC = 0;
    ordre.forEach(function (a) { var g = gl[a]; tD += g.d; tC += g.c; g.s = U.r2(g.d - g.c); if (g.s > 0) sD += g.s; else sC -= g.s; });
    var tva = ordre.filter(function (a) { return /^445/.test(a); });
    return { J: J, gl: gl, ordre: ordre, tD: U.r2(tD), tC: U.r2(tC), sD: U.r2(sD), sC: U.r2(sC), s512: gl['512'].s, tvaComptes: tva };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n, self = this;
    var mois = U.MOIS[p.m - 1];
    var TX = {
      apport: function (m) { return 'les associés apportent ' + e(m) + ' en numéraire, déposés sur le compte bancaire de la société'; },
      emprunt: function (m) { return 'obtention d’un emprunt bancaire de ' + e(m) + ', versé sur le compte bancaire'; },
      materiel: function (m) { return 'achat à crédit d’un ordinateur et d’une imprimante pour ' + e(m) + ' HT (TVA 20 %)'; },
      achat: function (m) { return 'achat à crédit de marchandises pour ' + e(m) + ' HT (TVA 20 %)'; },
      vente: function (m) { return 'vente à crédit de marchandises pour ' + e(m) + ' HT (TVA 20 %)'; },
      loyer: function (m) { return 'paiement par virement du loyer du local commercial, ' + e(m) + ' HT (TVA 20 %)'; },
      encaissement: function (m) { return 'un client règle par virement ' + e(m) + ' sur sa facture'; },
      reglement: function (m) { return 'règlement par chèque de ' + e(m) + ' à un fournisseur de marchandises'; }
    };
    var en = '<p>La société <b>' + p.nom + '</b> a été créée le ' + U.dt(p.ops[0].d, p.m) + '. Ses opérations du mois de ' + mois + ' N sont les suivantes :</p>';
    en += U.tbl(['Date', 'Opération'], p.ops.map(function (o) { return [U.dt(o.d, p.m), TX[o.k](o.mt)]; }));
    en += '<p class="consigne">1. Indiquez la nature des comptes ' + p.nat.map(function (i) { return self.COMPTES[i][0]; }).join(', ') + '. 2. Passez les écritures au journal. 3. Reportez-les au grand livre et présentez la balance au ' + U.dt(U.lastDay(p.m), p.m) + '.</p>';
    var qs = p.nat.map(function (i, k) { var c = self.COMPTES[i]; return QC('nat' + (k + 1), 'Nature du compte ' + c[0] + ' ' + c[1], self.NATURES, c[2]); });
    var g = x.gl;
    qs.push(Q('s512', 'Solde du compte 512 Banque (débiteur)', x.s512, '€'));
    if (g['401']) qs.push(Q('s401', 'Solde du compte 401 Fournisseurs (créditeur)', -g['401'].s, '€'));
    if (g['411']) qs.push(Q('s411', 'Solde du compte 411 Clients (débiteur)', g['411'].s, '€'));
    qs.push(Q('tot', 'Total des mouvements débiteurs de la balance', x.tD, '€'));

    var natRows = p.nat.map(function (i) { var c = self.COMPTES[i]; return ['<span class="mono">' + c[0] + '</span> ' + c[1], 'classe ' + c[0][0], '<b>' + self.NATURES[c[2]] + '</b>', c[2] === 0 || c[2] === 2 ? 'débiteur' : 'créditeur']; });
    var gl = U.tbl(['Compte', 'Débits', 'Crédits', 'Solde'], ['512', '401', '411'].filter(function (a) { return g[a]; }).map(function (a) {
      var o = g[a];
      return ['<span class="mono">' + a + '</span> ' + U.lib(a) + '<div class="small muted">' + o.mv.map(function (m) { return m.dt + ' : ' + (m.d ? 'D ' + n(m.d, 2) : 'C ' + n(m.c, 2)); }).join(' · ') + '</div>', n(o.d, 2), n(o.c, 2), (o.s >= 0 ? 'débiteur ' : 'créditeur ') + n(Math.abs(o.s), 2)];
    }));
    var bal = x.ordre.map(function (a) { var o = g[a]; return ['<span class="mono">' + a + '</span> ' + U.lib(a), n(o.d, 2), n(o.c, 2), o.s > 0 ? n(o.s, 2) : '', o.s < 0 ? n(-o.s, 2) : '']; });
    bal.push({ cls: 'tot', cells: ['Totaux', n(x.tD, 2), n(x.tC, 2), n(x.sD, 2), n(x.sC, 2)] });
    var com = 'Chaque opération est enregistrée en partie double : le compte qui reçoit est débité, celui qui fournit est crédité, et le total des débits égale celui des crédits. Les comptes de bilan (classes 1 à 5) décrivent le patrimoine ; les comptes de gestion (classes 6 et 7) mesurent le résultat. La balance confirme l’égalité des totaux (' + e(x.tD) + ' au débit comme au crédit) et des soldes (' + e(x.sD) + ') ; elle ne garantit pourtant pas l’absence d’erreur, car une écriture omise, passée deux fois ou imputée au mauvais compte ne la déséquilibre pas. Le compte 512 présente un solde débiteur de ' + e(x.s512) + ' : ce sont les disponibilités de la société, qui doivent concorder avec le relevé bancaire (état de rapprochement). Dans une entreprise réelle, ces écritures seraient saisies dans des journaux auxiliaires (achats, ventes, banque) centralisés chaque mois au journal général et au grand livre.';
    return { enonce: en, questions: qs, journal: x.J, steps: [{ h: 'Nature des comptes', html: U.tbl(['Compte', 'Classe', 'Nature', 'Solde normal'], natRows) }, { h: 'Grand livre (extraits)', html: gl }, { h: 'Balance', html: U.tbl(['Compte', 'Total débit', 'Total crédit', 'Solde débiteur', 'Solde créditeur'], bal) }], comment: com };
  }
};

/* ---------- 3. Facturation : réductions, frais accessoires, avances et acomptes ---------- */
T.facturation = {
  id: 'facturation', nom: 'Facturation : réductions, frais accessoires, avances et acomptes', famille: 'Opérations courantes', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Calculer une facture en cascade (réductions commerciales, escompte, port, TVA, consignations, acompte) et l’enregistrer chez le vendeur ou chez l’acheteur.',
    cours: [
      { t: 'Les réductions', l: [
        'Rabais : réduction pour défaut de qualité ou de conformité. Remise : réduction liée à l’importance de la commande ou à la qualité du client. Ristourne : réduction calculée sur le chiffre d’affaires d’une période.',
        'Réductions commerciales sur la facture : elles ne sont pas comptabilisées ; achats et ventes sont enregistrés pour le net commercial.',
        'Réductions commerciales hors facture (facture d’avoir) : comptes 609 chez l’acheteur et 709 chez le vendeur, avec régularisation de la TVA.',
        'Escompte : réduction financière pour paiement anticipé ou comptant ; il est toujours comptabilisé : 665 Escomptes accordés (vendeur), 765 Escomptes obtenus (acheteur). La TVA est calculée sur le net financier.'
      ] },
      { t: 'Les frais accessoires', l: [
        'Port et transport facturés : soumis à la TVA, ils s’ajoutent au net financier ; produit 7085 chez le vendeur, charge 6241 Transports sur achats chez l’acheteur (ou incorporés au coût d’achat).',
        'Emballages perdus : vendus avec la marchandise, facturés et soumis à la TVA comme elle.',
        'Emballages consignés : facturés à part, sans TVA, et remboursés au retour ; dette 4196 chez le vendeur, créance 4096 chez l’acheteur.'
      ] },
      { t: 'Les avances et acomptes', l: [
        'Acompte versé à la commande : créance 4091 chez l’acheteur (238 pour une immobilisation), dette 4191 chez le vendeur.',
        'Imputation : à la facture, l’acompte est soldé et vient en déduction du net à payer.',
        'TVA : pour une livraison de biens, elle est exigible à la livraison, l’acompte n’est donc pas taxé ; pour une prestation de services, elle est exigible à l’encaissement, l’acompte est taxé.'
      ] }
    ],
    etapes: [
      'Prix brut = quantité × prix unitaire ; appliquer les réductions commerciales en cascade (chacune sur le net précédent) : net commercial.',
      'Appliquer l’escompte sur le net commercial : net financier.',
      'Ajouter le port (frais accessoires soumis à la TVA) : base d’imposition ; TVA = base × taux.',
      'Total TTC + emballages consignés (sans TVA) − acompte déjà versé = net à payer.',
      'Écriture du vendeur : D 411 (net à payer), 665 (escompte), 4191 (acompte) / C 707 (net commercial), 7085 (port), 44571, 4196.',
      'Écriture de l’acheteur : D 607 (net commercial), 6241 (port), 44566, 4096 / C 765 (escompte), 4091 (acompte), 401 (net à payer).'
    ],
    pieges: [
      'Additionner les taux de remise (10 % + 5 % ≠ 15 %) : les réductions s’appliquent en cascade.',
      'Comptabiliser une remise portée sur la facture en 609 ou 709 : seules les réductions hors facture (avoirs) y vont.',
      'Calculer la TVA avant l’escompte : elle se calcule sur le net financier.',
      'Soumettre les emballages consignés à la TVA.',
      'Taxer un acompte sur une livraison de biens, ou oublier de le solder (4091 / 4191) à la facture.'
    ],
    comptes: ['607 / 707 Achats / Ventes de marchandises', '609 / 709 RRR obtenus / accordés', '665 / 765 Escomptes accordés / obtenus', '6241 Transports sur achats', '7085 Ports et frais accessoires facturés', '4091 / 4191 Avances et acomptes', '4096 / 4196 Emballages consignés', '44566 / 44571 TVA']
  },
  gen: function (r) {
    var art = r.pick([['chaises de bureau', 'chaise', 40, 180], ['écrans 27 pouces', 'écran', 150, 420], ['palettes de carrelage', 'palette', 250, 900], ['tonnes de farine', 'tonne', 380, 650], ['luminaires', 'luminaire', 30, 160], ['vélos électriques', 'vélo', 900, 2400]]);
    var qte = r.int(10, art[2] >= 500 ? 40 : 150), pu = r.int(art[2], art[3]);
    var red = [];
    if (r.chance(0.5)) red.push({ k: 'rabais', t: r.pick([0.02, 0.03, 0.05]) });
    red.push({ k: 'remise', t: r.pick([0.05, 0.08, 0.1, 0.12]) });
    if (r.chance(0.35)) red.push({ k: 'remise2', t: r.pick([0.02, 0.03, 0.05]) });
    return {
      nom: U.nom(r), tiers: U.nom(r), vue: r.pick(['vendeur', 'acheteur']), art: art, qte: qte, pu: pu, red: red,
      esc: r.chance(0.55) ? r.pick([0.01, 0.015, 0.02]) : 0, port: r.chance(0.75) ? r.int(4, 40) * 10 : 0,
      cons: r.chance(0.5) ? r.int(2, 30) * 15 : 0, acpt: r.chance(0.6) ? r.int(1, 3) * 10 : 0,
      ristT: r.chance(0.5) ? r.pick([0.01, 0.02, 0.03]) : 0, CAan: r.int(8, 40) * 5000,
      m: r.int(2, 11), d: r.int(3, 26)
    };
  },
  calc: function (p) {
    var brut = U.r2(p.qte * p.pu), nets = [], nc = brut;
    p.red.forEach(function (x) { var m = U.r2(nc * x.t); nc = U.r2(nc - m); nets.push({ k: x.k, t: x.t, m: m, net: nc }); });
    var esc = U.r2(nc * p.esc), nf = U.r2(nc - esc), base = U.r2(nf + p.port), tva = U.r2(base * 0.2), ttc = U.r2(base + tva);
    // acompte : pourcentage du TTC de la commande, arrondi à la dizaine d'euros
    var acpt = p.acpt ? U.r0(ttc * p.acpt / 100 / 10) * 10 : 0;
    var nap = U.r2(ttc + p.cons - acpt);
    var ristHT = p.ristT ? U.r2(p.CAan * p.ristT) : 0, ristTVA = U.r2(ristHT * 0.2);
    return { brut: brut, nets: nets, nc: nc, esc: esc, nf: nf, base: base, tva: tva, ttc: ttc, acpt: acpt, nap: nap, ristHT: ristHT, ristTVA: ristTVA, ristTTC: U.r2(ristHT + ristTVA) };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n, L = U.L, V = p.vue === 'vendeur';
    var LIB = { rabais: 'Rabais (défaut d’aspect sur une partie du lot)', remise: 'Remise (quantité)', remise2: 'Remise supplémentaire (client fidèle)' };
    var dF = U.dt(p.d, p.m), dA = U.dt(Math.max(1, p.d - 2), p.m > 1 ? p.m - 1 : p.m);
    var en = '<p>La société <b>' + p.nom + '</b> vend des ' + p.art[0] + ' à la société <b>' + p.tiers + '</b>. Vous tenez la comptabilité de <b>' + (V ? p.nom + '</b> (le vendeur)' : p.tiers + '</b> (l’acheteur)') + '.</p>';
    var info = [];
    if (x.acpt) info.push('Le ' + dA + ', ' + p.tiers + ' a versé par virement un acompte de ' + e(x.acpt) + ' à la commande.');
    info.push('Le ' + dF + ', ' + p.nom + ' livre la marchandise et établit la facture n° ' + (100 + p.d * 7 + p.m) + ' :');
    en += U.ul(info);
    var fr = [['Prix brut : ' + n(p.qte) + ' ' + p.art[0] + ' × ' + e(p.pu), e(x.brut)]];
    p.red.forEach(function (r0) { fr.push([LIB[r0.k], U.pcs(r0.t)]); });
    if (p.esc) fr.push(['Escompte pour paiement comptant', U.pcs(p.esc)]);
    if (p.port) fr.push(['Port facturé (HT)', e(p.port)]);
    fr.push(['Taux de TVA', '20 %']);
    if (p.cons) fr.push(['Emballages consignés (non soumis à TVA)', e(p.cons)]);
    if (x.acpt) fr.push(['Acompte reçu à la commande', e(x.acpt)]);
    en += U.kv(fr);
    var after = [];
    if (p.esc) after.push('La facture est réglée comptant par virement, déduction faite de l’escompte' + (x.acpt ? ' et de l’acompte' : '') + '.');
    if (p.ristT) after.push('Le 31/12/N, ' + p.nom + ' accorde à ' + p.tiers + ' une ristourne de ' + U.pcs(p.ristT) + ' sur le chiffre d’affaires hors taxes de l’année, soit ' + e(p.CAan) + ', par facture d’avoir.');
    if (after.length) en += U.ul(after);
    en += '<p class="consigne">1. Reconstituez la facture (net commercial, net financier, TVA, net à payer). 2. Passez au journal de ' + (V ? p.nom : p.tiers) + ' les écritures ' + [x.acpt ? 'de l’acompte' : '', 'de la facture', p.esc ? 'du règlement' : '', p.ristT ? 'de l’avoir' : ''].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' et $1') + '.</p>';

    var qs = [Q('nc', 'Net commercial', x.nc, '€')];
    if (p.esc) qs.push(Q('nf', 'Net financier', x.nf, '€'));
    qs.push(Q('tva', 'TVA facturée', x.tva, '€'), Q('ttc', 'Total TTC (hors consignations)', x.ttc, '€'), Q('nap', 'Net à payer', x.nap, '€'));
    if (p.ristT) qs.push(Q('rist', 'Montant TTC de l’avoir', x.ristTTC, '€'));

    var c = [['Prix brut', n(p.qte) + ' × ' + n(p.pu, 2), e(x.brut)]], prev = x.brut;
    x.nets.forEach(function (s) { c.push([LIB[s.k], U.pcs(s.t) + ' × ' + n(prev, 2) + ' = ' + n(s.m, 2), 'net : ' + e(s.net)]); prev = s.net; });
    c.push(['<b>Net commercial</b>', '', '<b>' + e(x.nc) + '</b>']);
    if (p.esc) { c.push(['Escompte', U.pcs(p.esc) + ' × ' + n(x.nc, 2), '− ' + e(x.esc)]); c.push(['<b>Net financier</b>', '', '<b>' + e(x.nf) + '</b>']); }
    if (p.port) c.push(['Port', 'frais accessoire soumis à TVA', '+ ' + e(p.port)]);
    c.push(['Base de TVA', (p.esc ? 'net financier' : 'net commercial') + (p.port ? ' + port' : ''), e(x.base)]);
    c.push(['TVA 20 %', '20 % × ' + n(x.base, 2), e(x.tva)]);
    c.push(['<b>Total TTC</b>', '', '<b>' + e(x.ttc) + '</b>']);
    if (p.cons) c.push(['Emballages consignés', 'sans TVA', '+ ' + e(p.cons)]);
    if (x.acpt) c.push(['Acompte déjà versé', p.acpt + ' % du TTC, arrondi', '− ' + e(x.acpt)]);
    c.push(['<b>Net à payer</b>', '', '<b>' + e(x.nap) + '</b>']);
    if (p.ristT) c.push(['Avoir (ristourne)', U.pcs(p.ristT) + ' × ' + n(p.CAan) + ' = ' + n(x.ristHT, 2) + ' HT + TVA ' + n(x.ristTVA, 2), e(x.ristTTC)]);

    var J = [];
    if (V) {
      if (x.acpt) J.push(U.entry(dA, 'Acompte reçu de ' + p.tiers, [L('512', x.acpt, 0), L('4191', 0, x.acpt)]));
      J.push(U.entry(dF, 'Facture n° ' + (100 + p.d * 7 + p.m) + ' – ' + p.tiers, [L('411', x.nap, 0), L('665', x.esc, 0), L('4191', x.acpt, 0), L('707', 0, x.nc), L('7085', 0, p.port), L('44571', 0, x.tva), L('4196', 0, p.cons)]));
      if (p.esc) J.push(U.entry(dF, 'Règlement comptant de ' + p.tiers, [L('512', x.nap, 0), L('411', 0, x.nap)]));
      if (p.ristT) J.push(U.entry('31/12/N', 'Avoir : ristourne de fin d’année', [L('709', x.ristHT, 0), L('44571', x.ristTVA, 0), L('411', 0, x.ristTTC)]));
    } else {
      if (x.acpt) J.push(U.entry(dA, 'Acompte versé à ' + p.nom, [L('4091', x.acpt, 0), L('512', 0, x.acpt)]));
      J.push(U.entry(dF, 'Facture n° ' + (100 + p.d * 7 + p.m) + ' – ' + p.nom, [L('607', x.nc, 0), L('6241', p.port, 0), L('44566', x.tva, 0), L('4096', p.cons, 0), L('765', 0, x.esc), L('4091', 0, x.acpt), L('401', 0, x.nap)]));
      if (p.esc) J.push(U.entry(dF, 'Règlement comptant à ' + p.nom, [L('401', x.nap, 0), L('512', 0, x.nap)]));
      if (p.ristT) J.push(U.entry('31/12/N', 'Avoir reçu : ristourne de fin d’année', [L('401', x.ristTTC, 0), L('609', 0, x.ristHT), L('44566', 0, x.ristTVA)]));
    }
    var com = 'Les réductions commerciales portées sur la facture (' + p.red.map(function (r0) { return r0.k === 'rabais' ? 'rabais' : 'remise'; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' et ') + ') s’appliquent en cascade et ne sont pas comptabilisées : ' + (V ? 'la vente' : 'l’achat') + ' est enregistré' + (V ? 'e' : '') + ' pour le net commercial de ' + e(x.nc) + '. ';
    com += p.esc ? 'L’escompte de ' + e(x.esc) + ' est une réduction financière, la contrepartie d’un paiement comptant : il est comptabilisé en ' + (V ? 'charge financière (665)' : 'produit financier (765)') + ' et la TVA est calculée sur le net financier. ' : 'Aucun escompte n’étant accordé, la TVA est calculée sur le net commercial. ';
    if (p.port) com += 'Le port, frais accessoire, est soumis à la TVA comme la marchandise (' + (V ? '7085' : '6241') + '). ';
    if (p.cons) com += 'Les emballages consignés (' + e(p.cons) + ') ne sont pas soumis à la TVA : ils créent ' + (V ? 'une dette envers le client (4196), remboursée au retour des emballages' : 'une créance sur le fournisseur (4096), récupérée au retour des emballages') + '. ';
    if (x.acpt) com += 'L’acompte de ' + e(x.acpt) + ', versé pour une livraison de biens, n’a pas supporté de TVA (exigible à la livraison) ; il est soldé à la facture et vient en déduction du net à payer. ';
    if (p.ristT) com += 'La ristourne de fin d’année, accordée après facturation, donne lieu à une facture d’avoir : elle est enregistrée en ' + (V ? '709' : '609') + ' et la TVA est régularisée. ';
    com += 'Le net à payer s’élève à ' + e(x.nap) + '.';
    return { enonce: en, questions: qs, journal: J, steps: [{ h: 'Facture reconstituée', html: U.calc(c) }], comment: com };
  }
};

/* ---------- 4. Personnel et organismes sociaux : la paie ---------- */
T.paie = {
  id: 'paie', nom: 'Paie : personnel et organismes sociaux', famille: 'Opérations courantes', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Passer du salaire brut au net à payer et au coût employeur, puis enregistrer la paie, les charges patronales et les règlements aux salariés, aux organismes sociaux et à l’administration fiscale.',
    cours: [
      { t: 'Du brut au net', l: [
        'Salaire brut : salaire de base + heures supplémentaires (majorées de 25 % pour les 8 premières heures au-delà de 35 h par semaine, 50 % au-delà) + primes, indemnités et avantages en nature ; compte 641.',
        'Cotisations salariales : retenues sur le brut (sécurité sociale, CSG et CRDS, retraite complémentaire, prévoyance) ; elles sont dues aux organismes sociaux.',
        'Prélèvement à la source (PAS) : impôt sur le revenu retenu par l’employeur depuis 2019 (taux transmis par l’administration, appliqué au net imposable) et reversé à la DGFiP ; compte 4421.',
        'Net à payer = brut − cotisations salariales − PAS − acomptes déjà versés − oppositions (saisies sur salaire).'
      ] },
      { t: 'Le coût employeur', l: [
        'Cotisations patronales : à la charge de l’employeur, en plus du brut (assurance maladie, vieillesse, allocations familiales, chômage, accidents du travail, retraite complémentaire…) ; compte 645.',
        'Coût total = brut (641) + cotisations patronales (645) ; il est atténué par les allègements de cotisations sur les bas salaires.',
        'Déclaration sociale nominative (DSN) : déclaration mensuelle unique, qui alimente les organismes sociaux et le PAS.'
      ] },
      { t: 'Les comptes', l: [
        '421 Personnel – rémunérations dues : net à payer, soldé au paiement.',
        '425 Personnel – avances et acomptes : acompte versé en cours de mois, imputé sur la paie.',
        '427 Personnel – oppositions : sommes retenues sur saisie et reversées au créancier.',
        '431 Sécurité sociale (URSSAF) et 437 Autres organismes sociaux (retraite complémentaire, prévoyance) : parts salariale et patronale, réglées le mois suivant.',
        'Inventaire : dettes provisionnées pour congés payés (4282) et charges sociales correspondantes (4382).'
      ] }
    ],
    etapes: [
      'Calculer le brut : base + heures supplémentaires (heures × taux horaire × 1,25) + primes.',
      'Calculer les cotisations salariales par organisme (taux × brut) et leur total.',
      'Net à payer = brut − cotisations salariales − PAS − acompte.',
      'Calculer les cotisations patronales par organisme et le coût employeur (brut + patronales).',
      'Écritures : acompte (D 425 / C 512) ; paie (D 641 / C 431, 437, 4421, 425, 421) ; charges patronales (D 645 / C 431, 437) ; paiement des salaires (D 421 / C 512) ; règlement des organismes et du PAS le mois suivant.'
    ],
    pieges: [
      'Débiter le 641 du net : la charge de personnel est le brut.',
      'Oublier que les cotisations salariales sont une dette envers les organismes, pas une charge de l’entreprise.',
      'Oublier l’acompte de mi-mois (425) dans le calcul du net à payer.',
      'Confondre le PAS (dette envers l’État, 4421) et les cotisations sociales.',
      'Calculer les heures supplémentaires sans la majoration de 25 %.'
    ],
    comptes: ['641 Rémunérations du personnel', '645 Charges de sécurité sociale et de prévoyance', '421 Personnel – rémunérations dues', '425 Personnel – avances et acomptes', '427 Personnel – oppositions', '431 Sécurité sociale', '437 Autres organismes sociaux', '4421 Prélèvements à la source']
  },
  gen: function (r) {
    var nb = r.int(3, 25);
    var base = U.r0(nb * r.int(1900, 3200) / 10) * 10;
    return {
      nom: U.nom(r), nb: nb, m: r.int(1, 11), base: base,
      hs: r.chance(0.7) ? r.int(4, 60) : 0, th: U.rd(r.int(1300, 2400) / 100, 2), prime: r.chance(0.5) ? r.int(2, 30) * 50 : 0,
      uS: r.pick([0.168, 0.17, 0.172, 0.165]), rS: r.pick([0.0401, 0.045, 0.052]), uP: r.pick([0.27, 0.285, 0.30, 0.31]), rP: r.pick([0.0601, 0.065, 0.072]),
      pas: r.int(0, 1) ? U.r0(base * r.int(25, 60) / 1000) : U.r0(base * r.int(15, 45) / 1000),
      acpt: r.chance(0.5) ? r.int(2, 15) * 100 : 0, opp: r.chance(0.25) ? r.int(5, 40) * 10 : 0
    };
  },
  calc: function (p) {
    var hsM = U.r2(p.hs * p.th * 1.25), brut = U.r2(p.base + hsM + p.prime);
    var uS = U.r2(brut * p.uS), rS = U.r2(brut * p.rS), sal = U.r2(uS + rS);
    var nap = U.r2(brut - sal - p.pas - p.acpt - p.opp);
    var uP = U.r2(brut * p.uP), rP = U.r2(brut * p.rP), pat = U.r2(uP + rP);
    return { hsM: hsM, brut: brut, uS: uS, rS: rS, sal: sal, nap: nap, uP: uP, rP: rP, pat: pat, cout: U.r2(brut + pat), urssaf: U.r2(uS + uP), retr: U.r2(rS + rP) };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n, L = U.L, mois = U.MOIS[p.m - 1], fin = U.dt(U.lastDay(p.m), p.m), pc = function (t) { return n(t * 100, 2) + ' %'; };
    var en = '<p>La société <b>' + p.nom + '</b> emploie ' + p.nb + ' salariés. Pour le mois de ' + mois + ' N, le service paie vous communique :</p>';
    var rows = [['Salaires de base', e(p.base)]];
    if (p.hs) rows.push(['Heures supplémentaires', p.hs + ' heures majorées de 25 %, taux horaire moyen ' + U.e2(p.th)]);
    if (p.prime) rows.push(['Primes de rendement', e(p.prime)]);
    rows.push(['Prélèvement à la source retenu', e(p.pas)]);
    if (p.acpt) rows.push(['Acomptes versés le 15/' + (p.m < 10 ? '0' : '') + p.m + '/N par virement', e(p.acpt)]);
    if (p.opp) rows.push(['Saisie sur salaire notifiée par huissier', e(p.opp)]);
    en += U.kv(rows);
    en += U.tbl(['Cotisations (base : salaire brut)', 'Part salariale', 'Part patronale'], [['URSSAF (sécurité sociale, CSG-CRDS, chômage…)', pc(p.uS), pc(p.uP)], ['Caisse de retraite complémentaire et prévoyance', pc(p.rS), pc(p.rP)]]);
    en += '<p>Les salaires sont virés le ' + fin + ' ; les cotisations et le prélèvement à la source sont réglés le 15 du mois suivant.</p>';
    en += '<p class="consigne">1. Calculez le salaire brut, les cotisations, le net à payer et le coût total pour l’employeur. 2. Passez les écritures ' + (p.acpt ? 'de l’acompte, ' : '') + 'de la paie, des charges patronales, du paiement des salaires et du règlement des organismes.</p>';
    var qs = [Q('brut', 'Salaire brut', x.brut, '€'), Q('sal', 'Total des cotisations salariales', x.sal, '€'), Q('nap', 'Net à payer', x.nap, '€'), Q('pat', 'Total des cotisations patronales', x.pat, '€'), Q('cout', 'Coût total pour l’employeur', x.cout, '€'), Q('urs', 'Somme versée à l’URSSAF', x.urssaf, '€')];
    var c = [['Salaires de base', '', e(p.base)]];
    if (p.hs) c.push(['Heures supplémentaires', p.hs + ' × ' + n(p.th, 2) + ' × 1,25', e(x.hsM)]);
    if (p.prime) c.push(['Primes', '', e(p.prime)]);
    c.push(['<b>Salaire brut</b>', '', '<b>' + e(x.brut) + '</b>']);
    c.push(['Cotisations salariales URSSAF', pc(p.uS) + ' × ' + n(x.brut, 2), e(x.uS)], ['Cotisations salariales retraite', pc(p.rS) + ' × ' + n(x.brut, 2), e(x.rS)]);
    c.push(['<b>Net à payer</b>', n(x.brut, 2) + ' − ' + n(x.sal, 2) + ' − ' + n(p.pas) + ' (PAS)' + (p.acpt ? ' − ' + n(p.acpt) + ' (acompte)' : '') + (p.opp ? ' − ' + n(p.opp) + ' (saisie)' : ''), '<b>' + e(x.nap) + '</b>']);
    c.push(['Cotisations patronales URSSAF', pc(p.uP) + ' × ' + n(x.brut, 2), e(x.uP)], ['Cotisations patronales retraite', pc(p.rP) + ' × ' + n(x.brut, 2), e(x.rP)]);
    c.push(['<b>Coût employeur</b>', n(x.brut, 2) + ' + ' + n(x.pat, 2), '<b>' + e(x.cout) + '</b>']);
    c.push(['Dû à l’URSSAF', n(x.uS, 2) + ' + ' + n(x.uP, 2), e(x.urssaf)], ['Dû à la caisse de retraite', n(x.rS, 2) + ' + ' + n(x.rP, 2), e(x.retr)]);
    var J = [], m2 = p.m + 1;
    if (p.acpt) J.push(U.entry('15/' + (p.m < 10 ? '0' : '') + p.m + '/N', 'Acomptes sur salaires', [L('425', p.acpt, 0), L('512', 0, p.acpt)]));
    J.push(U.entry(fin, 'Salaires de ' + mois, [L('641', x.brut, 0), L('431', 0, x.uS), L('437', 0, x.rS), L('4421', 0, p.pas), L('425', 0, p.acpt), L('427', 0, p.opp), L('421', 0, x.nap)]));
    J.push(U.entry(fin, 'Cotisations patronales de ' + mois, [L('645', x.pat, 0), L('431', 0, x.uP), L('437', 0, x.rP)]));
    J.push(U.entry(fin, 'Virement des salaires', [L('421', x.nap, 0), L('512', 0, x.nap)]));
    J.push(U.entry('15/' + (m2 < 10 ? '0' : '') + m2 + '/N', 'Règlement des organismes sociaux, du PAS' + (p.opp ? ' et de la saisie' : ''), [L('431', x.urssaf, 0), L('437', x.retr, 0), L('4421', p.pas, 0), L('427', p.opp, 0), L('512', 0, U.r2(x.urssaf + x.retr + p.pas + p.opp))]));
    var com = 'Les salariés perçoivent ' + e(x.nap) + ' alors que l’entreprise supporte ' + e(x.cout) + ' : le net à payer ne représente que ' + U.pc(x.nap / x.cout, 1) + ' du coût employeur. La charge de personnel comprend le brut (641, ' + e(x.brut) + ') et les cotisations patronales (645, ' + e(x.pat) + ') ; les cotisations salariales et le prélèvement à la source ne sont pas des charges de l’entreprise mais des sommes retenues pour le compte des organismes sociaux et de l’État, qu’elle doit reverser (431, 437, 4421). ' + (p.acpt ? 'L’acompte versé en cours de mois (425) est imputé sur la paie. ' : '') + (p.opp ? 'La saisie sur salaire est retenue (427) puis reversée au créancier. ' : '') + 'Ces dettes sociales et fiscales, réglées le mois suivant après la déclaration sociale nominative, figurent au passif du bilan si la clôture intervient avant leur paiement. À l’inventaire, l’entreprise provisionne en outre les congés payés acquis et non pris (4282) et les charges sociales correspondantes (4382).';
    return { enonce: en, questions: qs, journal: J, steps: [{ h: 'Bulletin de paie récapitulatif', html: U.calc(c) }], comment: com };
  }
};
