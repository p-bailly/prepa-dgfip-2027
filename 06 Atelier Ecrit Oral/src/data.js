/* ===== Données : formats officiels, sujets, grilles, banque de l’oral =====
   Chaque information officielle porte sa source : « clé:page » (voir SRC).
   Les pages sont celles du PDF publié dans site/docs (liens #page=N). */
var DATA = (function () {
  'use strict';

  // Documents cités. Les liens sont relatifs à /atelier/ sur le site publié.
  var SRC = {
    gnds: { t: 'Guide ENFiP · note de synthèse', o: true, pdf: '../docs/officiel/Guide_ENFiP_Inspecteur_Note_de_synthese.pdf' },
    gad: { t: 'Guide ENFiP · analyse de dossier', o: true, pdf: '../docs/officiel/Guide_ENFiP_Controleur_Analyse_de_dossier.pdf' },
    goral: { t: 'Guide ENFiP · oral inspecteur', o: true, pdf: '../docs/officiel/Guide_ENFiP_Inspecteur_Oral.pdf' },
    gprep: { t: 'Guide ENFiP · préparer les concours', o: true, pdf: '../docs/officiel/Guide_ENFiP_preparation_concours_externes.pdf' },
    rji: { t: 'Rapport du jury inspecteur 2026', o: true, pdf: '../docs/officiel/Rapport_jury_Inspecteur_2026.pdf' },
    rjc: { t: 'Rapport du jury contrôleur 2026', o: true, pdf: '../docs/officiel/Rapport_jury_Controleur_2026.pdf' },
    sti: { t: 'Sujet test inspecteur, corrigé officiel', o: true, pdf: '../docs/sujets/IFiP_Sujet_test_Epreuve1_Note_de_synthese_avec_corrige.pdf' },
    stc: { t: 'Sujet test contrôleur, corrigé officiel', o: true, pdf: '../docs/sujets/CFiP_Sujet_test_Epreuve1_Analyse_de_dossier.pdf' },
    f00: { t: 'Fiche · vue d’ensemble et annales', o: false, pdf: '../docs/fiches/00_Vue_d_ensemble_et_annales.pdf' },
    f05: { t: 'Fiche · note de synthèse, méthode', o: false, pdf: '../docs/fiches/05_Note_de_synthese_methode.pdf' },
    f06: { t: 'Fiche · sujets blancs corrigés', o: false, pdf: '../docs/fiches/06_Sujets_blancs_note_de_synthese_corriges.pdf' },
    f07: { t: 'Fiche · spécificités contrôleur', o: false, pdf: '../docs/fiches/07_Controleur.pdf' }
  };

  // Dates des écrits 2027 (fiche Vue d’ensemble, p. 1), comme dans l’Atelier QRC
  var EXAMS = {
    I: { label: 'inspecteur', date: [2026, 11, 7] },
    C: { label: 'contrôleur', date: [2027, 0, 11] }
  };

  /* ---------- Écrit n° 1 ---------- */
  var NIVEAUX = ['Absent', 'Insuffisant', 'Moyen', 'Bien', 'Très bien'];

  var EP = {
    nds: {
      id: 'nds', prof: 'I', concours: 'inspecteur', nom: 'Note de synthèse, avis et action concrète', court: 'Note de synthèse',
      min: 240, coef: 5, dossier: '25 pages au plus',
      faits: [
        { t: '4 h, coefficient 5. Toute note inférieure à 5/20 est éliminatoire.', src: ['gnds:4', 'rji:2'] },
        { t: 'Un dossier documentaire de 25 pages au plus, sur un sujet d’ordre général contemporain.', src: ['gnds:4', 'rji:2'] },
        { t: 'Exercice 1 : une note de synthèse des principaux éléments du dossier, qui répond à la question posée. Aucune longueur n’est imposée et la conclusion n’est pas nécessaire.', src: ['gnds:4', 'gnds:11', 'f05:1'] },
        { t: 'Exercice 2 : un avis argumenté, favorable ou défavorable, en deux pages au plus (introduction de 4 à 5 lignes), puis le cas échéant une action à mettre en œuvre en quelques lignes, une vingtaine au plus.', src: ['gnds:12', 'gnds:15', 'gnds:16'] },
        { t: 'L’action doit montrer ta capacité à présenter des propositions opérationnelles ou innovantes.', src: ['rji:2'] },
        { t: 'Copie au stylo bleu ou noir, sans couleur pour les titres ni les soulignements.', src: ['gnds:11'] }
      ],
      parts: ['Note de synthèse · 2 h 45', 'Avis et action · 1 h 15'],
      phases: [
        { p: 0, t: 'Lecture du libellé du sujet', min: 5 },
        { p: 0, t: 'Lecture du sommaire et du fonds documentaire', min: 50 },
        { p: 0, t: 'Construction du plan détaillé', min: 45 },
        { p: 0, t: 'Introduction, rédigée au brouillon', min: 15 },
        { p: 0, t: 'Rédaction de la synthèse', min: 45 },
        { p: 0, t: 'Relecture', min: 5 },
        { p: 1, t: 'Analyse du sujet', min: 5 },
        { p: 1, t: 'Recherche des idées', min: 20 },
        { p: 1, t: 'Construction de la réponse', min: 15 },
        { p: 1, t: 'Rédaction de l’avis et de l’action', min: 30 },
        { p: 1, t: 'Relecture', min: 5 }
      ],
      phasesSrc: ['gnds:16', 'gnds:17'],
      grille: [
        { id: 'consigne', part: 'Note de synthèse', w: 2, t: 'Sujet compris, plan de l’énoncé respecté', d: 'Mots-clés repérés, ni hors-sujet ni sujet traité à moitié ; les volets imposés par la consigne, dans l’ordre demandé.', src: ['gnds:6', 'rji:9'] },
        { id: 'docs', part: 'Note de synthèse', w: 3, t: 'Tous les documents exploités, idées essentielles chiffrées', d: 'Chaque document sert ; les idées principales ressortent et s’appuient sur des données chiffrées du dossier.', src: ['gnds:7', 'rji:9'] },
        { id: 'synthese', part: 'Note de synthèse', w: 2, t: 'Une vraie synthèse, neutre', d: 'Idées reformulées et regroupées : ni paraphrase, ni résumé document par document, ni dissertation ; aucun avis personnel.', src: ['gnds:8', 'gnds:11', 'rji:9'] },
        { id: 'intro', part: 'Note de synthèse', w: 1, t: 'Introduction complète', d: 'Accroche, problématique, annonce du plan, séparées par un retour à la ligne.', src: ['gnds:10'] },
        { id: 'plan', part: 'Note de synthèse', w: 3, t: 'Plan dynamique et équilibré', d: 'Titres apparents rédigés, parties équilibrées, annonces et transitions ; une démonstration, pas un catalogue ; des phrases rédigées, sans tirets.', src: ['gnds:9', 'gnds:11'] },
        { id: 'position', part: 'Avis argumenté', w: 2, t: 'Position claire', d: 'Un avis tranché, tenu jusqu’à la conclusion : pas de thèse puis antithèse sans prendre position.', src: ['gnds:15', 'rji:9'] },
        { id: 'argu', part: 'Avis argumenté', w: 3, t: 'Argumentation structurée et personnelle', d: 'Introduction courte, plan, conclusion ; arguments pertinents et convaincants, apports personnels au-delà du dossier ; deux pages au plus.', src: ['gnds:13', 'gnds:15', 'sti:28', 'rji:9'] },
        { id: 'action', part: 'Action concrète', w: 2, t: 'Une action opérationnelle', d: 'Une seule action, développée : modalités, moyens, coût, conditions de réussite.', src: ['gnds:16', 'rji:9'] },
        { id: 'langue', part: 'Expression', w: 2, t: 'Expression écrite soignée', d: 'Orthographe, grammaire et syntaxe maîtrisées ; style neutre et objectif, ni familier ni journalistique ; copie relue.', src: ['gnds:12', 'rji:8'] }
      ],
      defauts: [
        { id: 'resume', t: 'Note de synthèse confondue avec un résumé descriptif, une dissertation ou une note administrative', src: 'rji:9' },
        { id: 'paraphrase', t: 'Paraphrase des documents, idées essentielles mal dégagées', src: 'rji:9' },
        { id: 'exploit', t: 'Exploitation et analyse des documents insuffisantes', src: 'rji:9' },
        { id: 'avisnds', t: 'Avis personnel glissé dans la note de synthèse', src: 'gnds:11' },
        { id: 'tranche', t: 'Pas d’avis tranché : thèse puis antithèse sans prendre position', src: 'rji:9' },
        { id: 'argu', t: 'Argumentation faible, peu structurée, sans apport personnel', src: 'rji:9' },
        { id: 'actions', t: 'Plusieurs actions proposées sans en développer aucune', src: 'rji:9' },
        { id: 'sacrifie', t: 'Action concrète sacrifiée, faute d’idées plus que de temps', src: 'rji:8' },
        { id: 'langue', t: 'Orthographe, grammaire et syntaxe médiocres, phrases sans verbe', src: 'rji:8' },
        { id: 'style', t: 'Style inadapté ou familier', src: 'rji:8' },
        { id: 'temps', t: 'Rédaction non terminée dans les 4 heures', src: 'gnds:16' }
      ],
      meilleurs: { t: 'Les meilleures copies synthétisent sans paraphraser et illustrent par des chiffres, prennent clairement position dans un avis structuré, et détaillent une idée personnelle jusqu’à la rendre opérationnelle.', src: 'rji:9' },
      moyenne: { v: 9.64, src: 'rji:5' }
    },
    ad: {
      id: 'ad', prof: 'C', concours: 'contrôleur', nom: 'Analyse de dossier', court: 'Analyse de dossier',
      min: 180, coef: 4, dossier: '20 pages au plus',
      faits: [
        { t: '3 h, coefficient 4. Toute note inférieure à 5/20 est éliminatoire.', src: ['gad:4', 'rjc:2'] },
        { t: 'Des questions sur un dossier de 20 pages au plus, sur un sujet contemporain en matière sociale, économique ou financière ; l’une d’elles appelle un avis argumenté.', src: ['gad:4', 'rjc:2'] },
        { t: 'Le nombre de pages attendu est indiqué pour chaque question : il faut impérativement le respecter.', src: ['gad:8'] },
        { t: 'Chaque réponse est structurée : une introduction et un développement en une ou deux parties. Le plan apparent est libre, sauf consigne contraire.', src: ['gad:8'] },
        { t: 'L’avis fait appel à tes connaissances personnelles ; toute opinion argumentée, objective et exprimée avec pondération est recevable.', src: ['gad:8'] },
        { t: 'L’épreuve apprécie tes qualités d’expression, de synthèse, d’analyse et de réflexion.', src: ['gad:4'] }
      ],
      parts: null,
      phases: [
        { t: 'Découverte du sujet et du dossier', min: 15 },
        { t: 'Analyse approfondie de chaque question', min: 10 },
        { t: 'Exploitation du dossier documentaire', min: 50 },
        { t: 'Rédaction des réponses', min: 100 },
        { t: 'Relecture de la copie', min: 5 }
      ],
      phasesSrc: ['gad:6', 'gad:7'],
      grille: [
        { id: 'question', part: 'Questions d’analyse', w: 3, t: 'Réponse à la question posée, longueur respectée', d: 'Rien que la question, sans aller au-delà ; nombre de pages indiqué par l’énoncé respecté.', src: ['gad:8'] },
        { id: 'dossier', part: 'Questions d’analyse', w: 3, t: 'Dossier exploité et analysé', d: 'Informations utiles extraites et reformulées, chiffres du dossier, sans paraphrase.', src: ['gad:6', 'gad:8'] },
        { id: 'structure', part: 'Questions d’analyse', w: 2, t: 'Réponses structurées', d: 'Pour chaque question, une introduction et un développement en une ou deux parties ; des idées enchaînées dans un ordre logique.', src: ['gad:7', 'gad:8', 'rjc:6'] },
        { id: 'synthese', part: 'Questions d’analyse', w: 2, t: 'Esprit de synthèse', d: 'L’essentiel, hiérarchisé, sans délayer.', src: ['gad:4', 'rjc:6'] },
        { id: 'position', part: 'Avis argumenté', w: 2, t: 'Position personnelle claire', d: 'Ton opinion, annoncée dès l’introduction et exprimée avec pondération.', src: ['gad:8', 'stc:29', 'rjc:9'] },
        { id: 'argu', part: 'Avis argumenté', w: 4, t: 'Arguments étayés et concrets', d: 'Arguments justifiés et objectifs, connaissances personnelles en plus du dossier, réponse structurée dans la limite de pages.', src: ['gad:8', 'stc:29'] },
        { id: 'langue', part: 'Expression', w: 2, t: 'Orthographe et style', d: 'Orthographe et grammaire maîtrisées, style agréable et neutre.', src: ['gad:8', 'rjc:6'] },
        { id: 'copie', part: 'Expression', w: 2, t: 'Copie lisible, aérée et relue', d: 'Sauts de ligne et alinéas, écriture régulière, correcteur avec parcimonie, relecture finale.', src: ['gad:7'] }
      ],
      defauts: [
        { id: 'ortho', t: 'Fautes d’orthographe', src: 'rjc:6' },
        { id: 'synthese', t: 'Manque d’esprit de synthèse', src: 'rjc:6' },
        { id: 'avis', t: 'Avis faible, malgré une thématique accessible', src: 'rjc:6' },
        { id: 'structure', t: 'Devoir peu structuré', src: 'rjc:6' },
        { id: 'argumentaire', t: 'Analyse et argumentaire insuffisamment construits', src: 'rjc:9' },
        { id: 'paraphrase', t: 'Paraphrase des documents au lieu de les analyser', src: 'gad:8' },
        { id: 'horsq', t: 'Réponse qui va au-delà de la question posée', src: 'gad:8' },
        { id: 'pages', t: 'Nombre de pages indiqué non respecté', src: 'gad:8' },
        { id: 'lisible', t: 'Copie peu lisible ou peu aérée', src: 'gad:7' }
      ],
      meilleurs: { t: 'Les lauréats ont livré des points de vue personnels et argumentés ; le jury demande de renforcer la capacité à analyser et à construire des argumentaires.', src: 'rjc:9' },
      moyenne: { v: 10.44, src: 'rjc:5' }
    }
  };

  var SUJETS = [
    { id: 'i2026', ep: 'nds', kind: 'Session 2026', titre: 'Le patrimoine immobilier historique de l’État', info: '12 documents, 24 pages',
      pdf: '../docs/sujets/IFiP_2026_Epreuve1_Note_de_synthese.pdf',
      consigne: ['Note de synthèse, à l’aide des seuls documents : d’une part les difficultés d’entretien de ce patrimoine et ses sources de financement, d’autre part les avantages que la France en tire.', 'Avis en deux pages au plus sur la déclaration de Jack Lang, pour qui les travaux du Louvre seront « remboursés au centuple », alors que la dette publique dépasse 3 000 Md€.', 'Action concrète de l’État, en une quinzaine de lignes, pour inciter les Français à venir en aide au patrimoine historique.'],
      corrige: { t: 'Pas de corrigé officiel. Copie modèle dans la fiche Sujets blancs, p. 1 à 5.', pdf: '../docs/fiches/06_Sujets_blancs_note_de_synthese_corriges.pdf#page=1' } },
    { id: 'itest', ep: 'nds', kind: 'Sujet test', titre: 'Le marché du bien-être et de la cosmétique', info: '8 documents, 20 pages · le corrigé officiel commence p. 24 du PDF',
      pdf: '../docs/sujets/IFiP_Sujet_test_Epreuve1_Note_de_synthese_avec_corrige.pdf',
      consigne: ['Note de synthèse, à l’aide des seuls documents, sur le marché du bien-être en France : ses atouts, sa résistance à la crise et son adaptation.', 'Avis en deux pages au plus sur l’affirmation de la DGCCRF consacrée à l’étiquetage des produits cosmétiques.', 'Action concrète que la DGCCRF pourrait mener pour sensibiliser les consommateurs à la lecture des étiquettes.'],
      corrige: { t: 'Corrigé officiel, p. 24 à 29 du PDF.', pdf: '../docs/sujets/IFiP_Sujet_test_Epreuve1_Note_de_synthese_avec_corrige.pdf#page=24' } },
    { id: 'iblanc', ep: 'nds', kind: 'Sujet blanc', titre: 'La surfréquentation touristique en France', info: '12 documents résumés, environ 10 pages : la fiche conseille de viser 3 h 30',
      pdf: '../docs/fiches/06_Sujets_blancs_note_de_synthese_corriges.pdf#page=5',
      consigne: ['Note de synthèse : les atouts du tourisme et les déséquilibres créés par la concentration des flux, puis les réponses des pouvoirs publics pour répartir et réguler la fréquentation.', 'Avis en deux pages au plus : faut-il un droit d’accès payant aux sites naturels et patrimoniaux les plus fréquentés ?', 'Action concrète de l’État, en une quinzaine de lignes, pour orienter les touristes vers des destinations moins fréquentées.'],
      corrige: { t: 'Corrigé dans la même fiche, à partir de la p. 11.', pdf: '../docs/fiches/06_Sujets_blancs_note_de_synthese_corriges.pdf#page=11' } },
    { id: 'c2026', ep: 'ad', kind: 'Session 2026', titre: 'La sécurité routière', info: '7 documents, 20 pages',
      pdf: '../docs/sujets/CFiP_2026_Epreuve1_Analyse_de_dossier.pdf',
      consigne: ['Question 1 : les causes et les catégories de personnes concernées par l’accidentologie en France, en une page au plus.', 'Question 2 : les leviers mis en place contre la mortalité routière, en deux pages au plus.', 'Question 3, avis : quelles actions pourraient renforcer la sensibilisation des jeunes aux risques routiers ? Deux pages au plus.'],
      corrige: { t: 'Pas de corrigé officiel. Corrigé indicatif dans la fiche Contrôleur, p. 2 et 3.', pdf: '../docs/fiches/07_Controleur.pdf#page=2' } },
    { id: 'ctest', ep: 'ad', kind: 'Sujet test', titre: 'L’industrie du cinéma', info: '7 documents, 21 pages · le corrigé officiel commence p. 26 du PDF',
      pdf: '../docs/sujets/CFiP_Sujet_test_Epreuve1_Analyse_de_dossier.pdf',
      consigne: ['Question 1 : un état des lieux structuré de l’industrie du cinéma en France, en deux pages au plus.', 'Question 2 : les leviers et dispositifs de soutien au cinéma français, en une page au plus.', 'Question 3, avis : l’industrie du cinéma peut-elle résister à l’essor des plateformes de vidéo à la demande ? Deux pages au plus.'],
      corrige: { t: 'Corrigé officiel, p. 26 à 30 du PDF.', pdf: '../docs/sujets/CFiP_Sujet_test_Epreuve1_Analyse_de_dossier.pdf#page=26' } },
    // Annales des sessions précédentes (PDF officiels, economie.gouv.fr). Ancien format inspecteur externe :
    // synthèse puis note de propositions de deux pages, au lieu de l'avis et de l'action concrète.
    { id: 'i2025e', ep: 'nds', annale: true, kind: 'Externe 2025 · ancien format', titre: 'L’économie des Jeux olympiques et paralympiques de Paris 2024', info: '10 documents, 25 pages · synthèse puis note de propositions de deux pages',
      pdf: '../docs/sujets/IFiP_2025_externe_Note_de_synthese.pdf',
      consigne: ['À l’aide des seuls documents, une note de synthèse sur l’économie des Jeux olympiques et paralympiques « Paris 2024 », en soulignant l’apport de cet évènement sportif sur le plan économique pour la France, mais aussi les risques financiers qu’il peut représenter.', 'Une courte note de deux pages au maximum, appuyée sur tes connaissances personnelles : l’intérêt pour la France d’accueillir les Jeux olympiques d’hiver de 2030, en présentant les attraits touristiques français et la manière dont les Jeux pourraient les valoriser, et en insistant sur l’organisation à mettre en place pour garantir le succès financier de l’opération.'],
      rapport: { t: 'Rapport du jury 2025', url: 'https://www.economie.gouv.fr/files/files/directions_services/rejoignez-nous/DGFiP/recrutement-par-concours/categorie-A_licence/inspecteur-finances-publiques/2025_08_ifip_ext_Rapport_jury.pdf' } },
    { id: 'i2024e', ep: 'nds', annale: true, kind: 'Externe 2024 · ancien format', titre: 'Les dérives du marketing d’influence', info: '10 documents, 25 pages · synthèse puis note de propositions de deux pages',
      pdf: '../docs/sujets/IFiP_2024_externe_Note_de_synthese.pdf',
      consigne: ['À l’aide des seuls documents, une note de synthèse présentant les dérives qui justifient un meilleur encadrement du marketing d’influence, ainsi que les premières mesures engagées en la matière.', 'Une courte note de deux pages au maximum, appuyée sur tes connaissances personnelles : tes propositions pour éduquer les usagers du web afin de les rendre plus vigilants face aux contenus qu’ils visionnent sur les plateformes.'],
      rapport: { t: 'Rapport du jury 2024', url: 'https://www.economie.gouv.fr/files/files/directions_services/rejoignez-nous/DGFiP/recrutement-par-concours/categorie-A_licence/inspecteur-finances-publiques/2024_06_dgfip_insp_ext_rapport_jury.pdf' } },
    { id: 'i2023e', ep: 'nds', annale: true, kind: 'Externe 2023 · ancien format', titre: 'La place du jeu vidéo dans l’économie française', info: '10 documents, 25 pages · synthèse puis note de propositions de deux pages',
      pdf: '../docs/sujets/IFiP_2023_externe_Note_de_synthese.pdf',
      consigne: ['À l’aide des seuls documents, une note de synthèse sur la place du jeu vidéo dans l’économie française, en expliquant les raisons d’un tel succès et les moyens qui contribuent à le renforcer.', 'Une courte note de deux pages au maximum, appuyée sur tes connaissances personnelles : les mesures que pourrait prendre la France pour renforcer son positionnement en matière d’économie vidéoludique, afin qu’elles profitent à l’ensemble du territoire national.'] },
    { id: 'i2022e', ep: 'nds', annale: true, kind: 'Externe 2022 · ancien format', titre: 'Le programme « Logement d’abord »', info: '6 documents, 25 pages · synthèse puis note de propositions de deux pages',
      pdf: '../docs/sujets/IFiP_2022_externe_Note_de_synthese.pdf',
      consigne: ['À l’aide des seuls documents, une note de synthèse relative au programme « Logement d’abord » : en présentant d’une part les leviers utilisés et d’autre part les résultats obtenus, la note démontrera si le programme atteint son objectif, une meilleure performance de l’action publique en matière de lutte contre le sans-abrisme.', 'Une courte note de deux pages au maximum, appuyée sur tes connaissances personnelles : des actions capables de favoriser la mobilisation du parc de logements existant pour augmenter le nombre de logements susceptibles d’être attribués aux personnes sans abri ou mal logées.'] },
    { id: 'i2026i', ep: 'nds', annale: true, kind: 'Interne 2026', titre: 'Le pouvoir d’achat des ménages français', info: '8 documents, 23 pages · synthèse puis courte note',
      pdf: '../docs/sujets/IFiP_2026_interne_Note_de_synthese.pdf',
      consigne: ['Exercice 1 : à partir des seuls documents, une note de synthèse portant sur le pouvoir d’achat des ménages français.', 'Exercice 2 : une courte note, appuyée sur les documents et sur tes connaissances personnelles, qui présente d’abord les mécanismes jouant sur les prix et leurs conséquences sur le pouvoir d’achat, puis les impacts du protectionnisme sur le commerce et les répercussions sociales de cette politique.'],
      rapport: { t: 'Rapport du jury interne 2026', url: 'https://www.economie.gouv.fr/files/files/directions_services/rejoignez-nous/DGFiP/recrutement-par-concours/categorie-A_licence/inspecteur-finances-publiques/2026_04_dgfip_insp_int_rapport_jury2026.pdf' } },
    { id: 'i2025i', ep: 'nds', annale: true, kind: 'Interne 2025', titre: 'Les enjeux économiques de la transition vers la neutralité carbone', info: '8 documents, 24 pages (PDF scanné) · synthèse puis courte note',
      pdf: '../docs/sujets/IFiP_2025_interne_Note_de_synthese.pdf',
      consigne: ['Exercice 1 : à partir des seuls documents, une note de synthèse portant sur les enjeux économiques de la transition vers la neutralité carbone en France.', 'Exercice 2 : une courte note distincte, à l’aide de tes connaissances personnelles et des documents, sur les instruments de politiques publiques mobilisables pour réduire les émissions de gaz à effet de serre.'] },
    { id: 'i2024i', ep: 'nds', annale: true, kind: 'Interne 2024', titre: 'Les difficultés du marché de l’emploi en France', info: '8 documents, 23 pages (PDF scanné) · synthèse puis courte note',
      pdf: '../docs/sujets/IFiP_2024_interne_Note_de_synthese.pdf',
      consigne: ['Exercice 1 : à partir des seuls documents, une note de synthèse sur les difficultés du marché de l’emploi en France.', 'Exercice 2 : une courte note distincte, appuyée sur les documents et sur tes connaissances personnelles, sur l’attractivité de la fonction publique en France.'] },
    { id: 'c2024e', ep: 'ad', annale: true, kind: 'Externe 2024', titre: 'Le tourisme en France', info: '10 documents, 18 pages · pas de longueur imposée',
      pdf: '../docs/sujets/CFiP_2024_externe_Analyse_de_dossier.pdf',
      consigne: ['Question 1 : après avoir défini la notion de tourisme, en dresser le bilan ainsi que les perspectives.', 'Question 2 : présenter, de façon structurée, les mesures décidées en faveur du tourisme en France.'],
      rapport: { t: 'Rapport du jury 2024', url: 'https://www.economie.gouv.fr/files/files/directions_services/rejoignez-nous/DGFiP/recrutement-par-concours/categorie-B_bac/controleur-finances-publiques/2024_05_dgfip_contr_ext_rapport_jury.pdf' } },
    { id: 'c2023e', ep: 'ad', annale: true, kind: 'Externe 2023', titre: 'Le prêt garanti par l’État (PGE)', info: '8 documents, 19 pages (PDF scanné) · pas de longueur imposée',
      pdf: '../docs/sujets/CFiP_2023_externe_Analyse_de_dossier.pdf',
      consigne: ['Question 1 : après avoir distingué le PGE instauré dans le cadre de la crise du Covid-19 et le PGE résilience, en définir les contours.', 'Question 2 : après avoir identifié les bénéficiaires du PGE, décrire la procédure à suivre pour le solliciter.', 'Question 3 : après avoir indiqué le recours relatif au PGE, lister les risques de ce dispositif pour tous les acteurs de la chaîne.'] },
    { id: 'c2026i', ep: 'ad', annale: true, kind: 'Interne 2026', titre: 'La transformation des espaces de travail et le télétravail', info: '8 documents, 20 pages · longueurs imposées',
      pdf: '../docs/sujets/CFiP_2026_interne_Analyse_de_dossier.pdf',
      consigne: ['Question 1 : après un constat sur la transformation des espaces de travail dans les bâtiments publics, expliquer la démarche engagée depuis plusieurs années par l’État pour répondre à cette nécessité. Réponse structurée de deux à quatre pages.', 'Question 2 : présenter la mise en place du télétravail et ses conséquences pour les agents et pour les managers. Réponse structurée de deux pages au maximum.'],
      rapport: { t: 'Rapport du jury interne 2026', url: 'https://www.economie.gouv.fr/files/files/directions_services/rejoignez-nous/DGFiP/recrutement-par-concours/categorie-B_bac/controleur-finances-publiques/2026_03_dgfip_cin_rapport-jury.pdf' } },
    { id: 'c2025i', ep: 'ad', annale: true, kind: 'Interne 2025', titre: 'L’intelligence artificielle dans les administrations', info: '9 documents, 18 pages · longueurs imposées',
      pdf: '../docs/sujets/CFiP_2025_interne_Analyse_de_dossier.pdf',
      consigne: ['Question 1 : après avoir présenté la notion d’intelligence artificielle et les risques inhérents à sa montée en puissance en termes d’emploi et de fiabilité, développer les avantages qu’elle présente pour les administrations publiques. Au moins deux pages, plan apparent.', 'Question 2 : deux exemples de l’utilisation actuelle de l’IA par la DGFiP et, pour chacun, le bilan qui peut en être fait. Deux pages au maximum, sans plan apparent.'] },
    { id: 'c2024i', ep: 'ad', annale: true, kind: 'Interne 2024', titre: 'Le cadre d’objectifs et de moyens et la responsabilité des gestionnaires publics', info: '9 documents, 20 pages · longueurs imposées',
      pdf: '../docs/sujets/CFiP_2024_interne_Analyse_de_dossier.pdf',
      consigne: ['Question 1 : expliquer la démarche et les grandes lignes directrices du cadre d’objectifs et de moyens (COM). Réponse structurée de deux pages au maximum.', 'Question 2 : en s’appuyant sur le fonds documentaire, présenter les changements et les nouveautés liés à la réforme de la responsabilité des gestionnaires publics, et développer les enjeux de cette réforme pour la fonction publique. Réponse structurée avec un plan apparent, d’au moins deux pages.'] },
    { id: 'libre', ep: '*', kind: 'Autre sujet', titre: 'Un sujet de ton choix', libre: true,
      info: 'Un dossier d’une autre source : donne-lui un titre pour le retrouver dans ton historique.',
      infoNds: 'Un dossier d’une autre source, par exemple un sujet des douanes, de la DGCCRF ou des IRA.' }
  ];

  /* ---------- Oral d’admission ---------- */
  var ORAL = {
    I: {
      concours: 'inspecteur', min: 35, coef: 8, pres: 5, moyenne: { v: 11.77, src: 'rji:12' },
      faits: [
        { t: '35 minutes, coefficient 8. Toute note inférieure à 5/20 est éliminatoire.', src: ['goral:4', 'rji:3'] },
        { t: 'Le coefficient 8 pèse autant que les deux écrits réunis (5 et 3).', src: ['goral:4'] },
        { t: 'Un jury de deux membres, cadres expérimentés de la DGFiP formés à l’évaluation ; le président du jury peut assister à l’oral.', src: ['goral:5'] }
      ],
      attentes: [
        { t: 'Les meilleurs ont montré du bon sens dans les mises en situation, avec des réponses argumentées et adaptées aux enjeux, ainsi que des aptitudes managériales et d’organisation.', src: 'rji:12' },
        { t: 'Les moins bons ont eu du mal à se positionner dans la hiérarchie, à se projeter en encadrant ou à travailler en équipe.', src: 'rji:12' },
        { t: 'Les questions de déontologie ont été globalement maîtrisées.', src: 'rji:12' },
        { t: 'Le jury a noté l’intérêt des candidats pour la gestion publique et le métier de conseiller aux décideurs locaux, pas seulement pour la fiscalité.', src: 'rji:12' },
        { t: 'Prépare ta présentation, la justification de tes choix et tes motivations ; pour les mises en situation, vise l’aisance pour rebondir sur les relances, pas des réponses stéréotypées.', src: 'rji:13' }
      ]
    },
    C: {
      concours: 'contrôleur', min: 25, coef: 6, pres: 5, moyenne: { v: 11.86, src: 'rjc:8' },
      faits: [
        { t: '25 minutes, coefficient 6. Toute note inférieure à 5/20 est éliminatoire.', src: ['rjc:3'] },
        { t: 'Le jury auditionne en binôme ; ses membres sont formés par l’ENFiP.', src: ['rjc:7'] },
        { t: 'Tes documents ne contiennent pas de guide ENFiP de l’oral contrôleur : ce déroulé vient du rapport du jury.', src: ['rjc:3'] }
      ],
      attentes: [
        { t: 'Le temps de présentation a été respecté par la plupart des candidats, avec un contenu globalement conforme aux attentes.', src: 'rjc:8' },
        { t: 'Le jury a apprécié les réponses argumentées qui mêlent réflexion et bon sens dans les mises en situation.', src: 'rjc:8' },
        { t: 'Les lauréats ont démontré leur motivation à rejoindre la DGFiP et ont accepté de livrer des points de vue personnels.', src: 'rjc:9' }
      ]
    },
    etapes: [
      { t: 'Présentation de ton parcours · 5 minutes au plus', d: 'Les grandes lignes de ton parcours, les qualités et compétences acquises (études, expérience professionnelle ou extra-professionnelle), ton projet professionnel. Une très courte introduction, un développement structuré, une conclusion concise. Au-delà de 5 minutes, le jury peut t’interrompre et te pénaliser. Prépare-la sans l’apprendre par cœur.', src: ['goral:5', 'goral:6', 'rji:3', 'rjc:3'] },
      { t: 'Échanges sur tes aptitudes et tes motivations', d: 'Le jury revient sur ton parcours. Il évalue ton savoir-faire et surtout ton savoir-être : s’adapter, s’intégrer à une équipe, communiquer et, pour l’inspecteur, encadrer. Sur les motivations, il attend sincérité et engagement.', src: ['goral:7', 'rji:3', 'rjc:3'] },
      { t: 'Mises en situation', d: 'Des situations professionnelles où tu dois énoncer un choix, une solution, un comportement. Le jury mesure ton analyse, ta réflexion et ta capacité d’action ; il ne cherche pas de piège mais une position argumentée.', src: ['goral:8', 'rji:3', 'rjc:3'] }
    ],
    nonPrecise: 'La durée des échanges et des mises en situation n’est pas fixée : il reste environ 30 minutes après la présentation à l’inspecteur, 20 minutes au contrôleur.',
    criteres: [
      { id: 'clarte', t: 'Clarté de l’expression', src: ['goral:6'] },
      { id: 'structure', t: 'Structure de la réponse', src: ['goral:6', 'goral:8'] },
      { id: 'fond', t: 'Maîtrise du sujet', src: ['goral:8', 'rji:12'] },
      { id: 'posture', t: 'Posture et savoir-être', src: ['goral:7'] },
      { id: 'perso', t: 'Sincérité, point de vue personnel', src: ['goral:7', 'rjc:9'] },
      { id: 'temps', t: 'Respect du temps', src: ['goral:6', 'rji:12'] }
    ],
    niveaux: ['À retravailler', 'Passable', 'Bien', 'Très bien'],
    methodeSituation: 'Le jury mesure tes capacités d’analyse, de réflexion et d’action, avec bon sens et une solution adaptée au contexte (guide de l’oral, p. 8). Une trame possible : les faits et les enjeux, le cadre (règles, hiérarchie), ta décision et sa mise en œuvre, puis le compte rendu et ce que tu en retiens.'
  };

  var CATS = [
    { id: 'motiv', t: 'Motivation et parcours', court: 'Motivation' },
    { id: 'dgfip', t: 'La DGFiP et ses missions', court: 'DGFiP' },
    { id: 'valeurs', t: 'Valeurs et déontologie', court: 'Déontologie' },
    { id: 'situ', t: 'Mises en situation', court: 'Situations' },
    { id: 'actu', t: 'Actualité des finances publiques', court: 'Actualité' }
  ];
  var SUBS = { usager: 'usager', management: 'management', conflit: 'conflit', ethique: 'éthique', erreur: 'erreur' };

  // Banque de questions. Les pistes sont des repères de préparation, pas des corrigés officiels.
  var Q = [
    /* --- Motivation et parcours --- */
    { id: 'pres', c: 'motiv', pres: true, q: 'Présentez-vous et présentez votre parcours.', p: ['5 minutes au plus : une très courte introduction, un développement structuré, une conclusion concise (guide de l’oral, p. 6).', 'Les grandes lignes de ton parcours, les qualités et compétences acquises, ton projet professionnel (p. 5).', 'Des expériences concrètes qui montrent les qualités attendues, sans chercher à te « vendre ».', 'Connais-la très bien sans la réciter : le ton monocorde est le risque du par-cœur.', 'Termine sur ce qui te mène à la DGFiP : le jury enchaîne souvent là-dessus.'] },
    { id: 'm01', c: 'motiv', q: 'Pourquoi voulez-vous rejoindre la DGFiP ?', p: ['Des raisons personnelles et sincères : le jury attend de l’engagement, pas une formule (guide de l’oral, p. 7).', 'Un lien avec ton parcours : ce que tu as déjà fait qui t’y conduit.', 'Le sens des missions : égalité devant l’impôt, financement des services publics, conseil aux collectivités.', 'La diversité des métiers, plus d’une cinquantaine (guide Préparer les concours, p. 6).', 'Évite de ne citer que la sécurité de l’emploi.'] },
    { id: 'm02', c: 'motiv', q: 'Pourquoi ce concours, et pas celui de l’autre catégorie (contrôleur ou inspecteur) ?', p: ['Le niveau de responsabilité visé et ce qu’il implique au quotidien.', 'Inspecteur : un cadre A qui peut encadrer une équipe, le jury évalue cette aptitude (guide de l’oral, p. 7).', 'Contrôleur : un rôle d’expertise et de terrain, au contact des usagers et des dossiers.', 'Si tu présentes les deux concours, assume-le avec une logique de projet.'] },
    { id: 'm03', c: 'motiv', q: 'Quel métier de la DGFiP vous attire le plus, et pourquoi ?', p: ['Un métier précis, décrit concrètement : vérificateur, conseiller aux décideurs locaux, gestionnaire en service des impôts, comptable public, évaluateur du Domaine…', 'Le lien avec tes compétences et tes expériences.', 'Une ouverture aux premiers postes possibles : l’affectation ne se choisit pas entièrement.', 'Le jury 2026 a apprécié l’intérêt pour la gestion publique, pas seulement la fiscalité (rapport inspecteur, p. 12).'] },
    { id: 'm04', c: 'motiv', q: 'Quelles sont vos principales qualités pour ce métier ? Illustrez.', p: ['Deux ou trois qualités, pas une liste.', 'Pour chacune, une situation vécue : le contexte, ce que tu as fait, le résultat.', 'Des qualités utiles au poste : rigueur, écoute, discrétion, adaptation, sens de l’organisation.', 'Le savoir-être compte autant que le savoir-faire (guide de l’oral, p. 7).'] },
    { id: 'm05', c: 'motiv', q: 'Quel est votre principal défaut ?', p: ['Un vrai défaut, pas une qualité déguisée.', 'Montre que tu le connais et ce que tu fais pour le corriger, avec un exemple.', 'Choisis un défaut qui n’est pas rédhibitoire pour le poste.'] },
    { id: 'm06', c: 'motiv', q: 'Racontez une réussite dont vous êtes fier ou fière.', p: ['Une situation précise et ton rôle personnel dans le résultat.', 'Les compétences mobilisées, transposables à la DGFiP.', 'Un résultat concret, chiffré si possible.'] },
    { id: 'm07', c: 'motiv', q: 'Parlez-nous d’un échec et de ce que vous en avez retenu.', p: ['Un échec réel, raconté sans dramatiser.', 'Une analyse lucide des causes, sans rejeter la faute sur les autres.', 'Ce que tu as changé depuis : c’est cela que le jury écoute.'] },
    { id: 'm08', c: 'motiv', q: 'Avez-vous déjà encadré ou animé une équipe ? Comment vous y êtes-vous pris ?', p: ['Même hors du cadre professionnel : association, sport, projet d’études, job d’été.', 'Ton style : écoute, répartition des tâches, exemplarité, suivi.', 'Une difficulté rencontrée et ta réponse.', 'Le jury 2026 a pénalisé ceux qui ne se projetaient pas en encadrant (rapport inspecteur, p. 12).'] },
    { id: 'm09', c: 'motiv', q: 'Où vous voyez-vous dans cinq ou dix ans ?', p: ['Un projet réaliste : formation à l’ENFiP, premier poste, puis évolution.', 'Une ouverture à la mobilité fonctionnelle et géographique.', 'De l’ambition mesurée, sans laisser entendre que tu quitteras vite la DGFiP.'] },
    { id: 'm10', c: 'motiv', q: 'Êtes-vous prêt à une mobilité géographique ?', p: ['Une réponse honnête : les premières affectations peuvent être loin de chez toi.', 'Les contraintes personnelles évoquées simplement, et comment tu les gères.', 'Ce qui t’attire malgré l’éloignement : le métier, la région, l’expérience.'] },
    { id: 'm11', c: 'motiv', q: 'Que vous ont apporté vos études ou votre expérience actuelle pour ce poste ?', p: ['Des compétences transférables, précises et illustrées.', 'Le savoir-faire (techniques, méthodes) et le savoir-être (adaptation, équipe, communication), selon le guide de l’oral, p. 7.', 'Ce qui te manque encore et comment la formation y répondra.'] },
    { id: 'm12', c: 'motiv', q: 'Avez-vous présenté d’autres concours ? Pourquoi ?', p: ['La franchise d’abord : le jury apprécie la sincérité.', 'Une cohérence d’ensemble : service public, finances publiques, gestion.', 'Ce qui fait de la DGFiP un vrai choix et non un repli.'] },
    { id: 'm13', c: 'motiv', q: 'Comment vous êtes-vous préparé à ce concours ?', p: ['Une méthode et une organisation : planning, régularité, entraînements chronométrés.', 'Les ressources : guides de l’ENFiP, rapports du jury, actualité.', 'Ce que cela dit de ta capacité d’organisation, remarquée par le jury 2026 (rapport inspecteur, p. 12).'] },
    { id: 'm14', c: 'motiv', q: 'Qu’est-ce qui vous attire dans le service public plutôt que dans le privé ?', p: ['L’intérêt général, l’égalité de traitement, la continuité du service.', 'Sans dénigrer le privé : appuie-toi sur tes propres expériences.', 'Un exemple concret de mission de la DGFiP utile à tous.'] },

    /* --- La DGFiP et ses missions --- */
    { id: 'd01', c: 'dgfip', q: 'Présentez la DGFiP en quelques phrases.', p: ['Née en 2008 de la fusion de la direction générale des impôts et de la direction générale de la comptabilité publique.', 'Rattachée au ministère de l’Économie et des Finances ; près de 100 000 agents et plus de cinquante métiers (guide Préparer les concours, p. 6).', 'Deux grandes sphères : la fiscalité et la gestion publique, plus des missions foncières et patrimoniales.', 'Présente sur tout le territoire : directions régionales et départementales, services à compétence nationale, accueils et espaces France services.'] },
    { id: 'd02', c: 'dgfip', q: 'Quelles sont les grandes missions de la DGFiP ?', p: ['Fiscalité : établir l’assiette, calculer, recouvrer et contrôler les impôts des particuliers et des professionnels.', 'Gestion publique : tenir les comptes de l’État et des collectivités locales, payer les dépenses, recouvrer les recettes, conseiller les élus locaux.', 'Missions foncières et patrimoniales : cadastre, publicité foncière, évaluations domaniales, immobilier de l’État.', 'Autres missions : retraites des fonctionnaires de l’État, dépôts de fonds.'] },
    { id: 'd03', c: 'dgfip', q: 'À quoi sert le contrôle fiscal ?', p: ['Garantir l’égalité des citoyens devant l’impôt et une concurrence loyale entre entreprises (guide Préparer les concours, p. 4).', 'Trois finalités souvent citées : budgétaire (recouvrer), répressive (sanctionner la fraude), dissuasive.', 'Contrôle sur pièces depuis le bureau, contrôle sur place (vérification de comptabilité, examen de la situation fiscale personnelle).', 'Un ciblage de plus en plus appuyé sur l’analyse de données.', 'L’autre versant : la relation de confiance et le droit à l’erreur pour l’usager de bonne foi.'] },
    { id: 'd04', c: 'dgfip', q: 'Qu’a changé le prélèvement à la source ?', p: ['Depuis le 1er janvier 2019, l’impôt sur le revenu est prélevé par l’employeur, la caisse de retraite ou par acompte, au taux calculé par la DGFiP.', 'L’impôt suit les revenus de l’année : moins de décalage en cas de changement de situation.', 'La déclaration annuelle demeure ; le taux peut être modulé en ligne.', 'La DGFiP reste l’interlocuteur unique de l’usager pour son impôt.'] },
    { id: 'd05', c: 'dgfip', q: 'Qu’est-ce que la séparation de l’ordonnateur et du comptable ?', p: ['L’ordonnateur décide la dépense ou la recette ; le comptable public la contrôle, paie ou recouvre, et tient les comptes.', 'Un principe ancien de la comptabilité publique, repris par le décret du 7 novembre 2012 sur la gestion budgétaire et comptable publique.', 'Une garantie contre l’erreur et la fraude.', 'Depuis 2023, un régime unique de responsabilité des gestionnaires publics, jugé par la Cour des comptes, a remplacé la responsabilité personnelle et pécuniaire des comptables.'] },
    { id: 'd06', c: 'dgfip', q: 'Que fait la DGFiP pour les collectivités locales ?', p: ['Elle tient leurs comptes, paie leurs dépenses et recouvre leurs recettes.', 'Elle les conseille : analyses financières, conseillers aux décideurs locaux.', 'Elle gère la fiscalité locale : valeurs locatives, bases, recensement des biens.', 'Le jury 2026 a relevé l’intérêt des candidats pour le métier de conseiller aux décideurs locaux (rapport inspecteur, p. 12).'] },
    { id: 'd07', c: 'dgfip', q: 'Qu’est-ce que le nouveau réseau de proximité ?', p: ['Une réorganisation engagée à partir de 2019 : plus de points de contact (France services, permanences), moins de trésoreries de plein exercice.', 'Des services de gestion comptable et des conseillers aux décideurs locaux pour les collectivités.', 'La relocalisation de services hors des grandes métropoles.', 'Le débat : proximité et accessibilité d’un côté, mutualisation et efficacité de l’autre.'] },
    { id: 'd08', c: 'dgfip', q: 'Comment la DGFiP accompagne-t-elle les usagers face au numérique ?', p: ['Les services en ligne : espace particulier et professionnel, messagerie sécurisée, prise de rendez-vous.', 'L’accueil physique et téléphonique maintenu pour ceux qui ne sont pas à l’aise avec le numérique.', 'Les espaces France services, souvent cités par l’ENFiP (guide Préparer les concours, p. 4).', 'Plus de 80 % des usagers se disent satisfaits selon les enquêtes citées par l’ENFiP (p. 4).'] },
    { id: 'd09', c: 'dgfip', q: 'Qu’est-ce que la facturation électronique et pourquoi la DGFiP s’y intéresse-t-elle ?', p: ['L’obligation progressive d’émettre et de recevoir des factures électroniques entre entreprises assujetties à la TVA, avec transmission de données à l’administration.', 'Un calendrier fixé par la loi de finances pour 2024 : réception par toutes les entreprises et émission par les grandes entreprises et ETI au 1er septembre 2026, émission par les PME et micro-entreprises au 1er septembre 2027.', 'Les objectifs : lutter contre la fraude à la TVA, préremplir les déclarations, suivre l’activité en temps réel.', 'Vérifie le point d’étape le plus récent avant l’oral.'] },
    { id: 'd10', c: 'dgfip', q: 'Quels sont les principaux impôts gérés par la DGFiP ?', p: ['La TVA, premier impôt de l’État par son rendement.', 'L’impôt sur le revenu et l’impôt sur les sociétés.', 'Les impôts locaux : taxes foncières, taxe d’habitation sur les résidences secondaires, cotisation foncière des entreprises.', 'Les droits d’enregistrement et l’impôt sur la fortune immobilière.', 'Retiens les ordres de grandeur du dernier budget voté.'] },
    { id: 'd11', c: 'dgfip', q: 'Quelle différence entre la DGFiP, la douane, l’Urssaf et la Cour des comptes ?', p: ['DGFiP : administration fiscale et comptable de l’État.', 'Douane (DGDDI) : flux de marchandises, certaines taxes ; une partie de son recouvrement fiscal est transférée à la DGFiP.', 'Urssaf : cotisations et contributions sociales, au sein de la Sécurité sociale.', 'Cour des comptes : juridiction financière indépendante, qui contrôle, évalue et certifie les comptes de l’État.', 'Elles coopèrent, notamment contre la fraude.'] },
    { id: 'd12', c: 'dgfip', q: 'Quel rôle joue la DGFiP dans la gestion du patrimoine immobilier de l’État ?', p: ['Elle porte la politique immobilière de l’État : connaître, entretenir et valoriser le parc.', 'Elle évalue les biens (évaluations domaniales) et gère les cessions.', 'Un lien direct avec le sujet de note de synthèse 2026 sur le patrimoine historique.', 'Les enjeux : coût de l’entretien, rénovation énergétique, sobriété des surfaces.'] },
    { id: 'd13', c: 'dgfip', q: 'Qu’est-ce qu’un service des impôts des particuliers et un service des impôts des entreprises ?', p: ['SIP : l’interlocuteur des particuliers pour l’impôt sur le revenu, les impôts locaux et leur recouvrement.', 'SIE : l’interlocuteur fiscal des professionnels, pour la TVA, l’impôt sur les sociétés, la cotisation foncière des entreprises.', 'À côté, des pôles de contrôle et des services de recouvrement spécialisés.', 'Les métiers qu’on y exerce et ce qui t’y attire.'] },
    { id: 'd14', c: 'dgfip', q: 'Comment la DGFiP utilise-t-elle les données et l’intelligence artificielle ?', p: ['Le ciblage du contrôle fiscal par l’exploration de données.', 'La détection des constructions et piscines non déclarées à partir d’images aériennes.', 'Un cadre : protection des données, contrôle de la CNIL, secret professionnel, décision humaine.', 'Les limites : biais, transparence, acceptabilité par les usagers.'] },

    /* --- Valeurs et déontologie --- */
    { id: 'v01', c: 'valeurs', q: 'Quelles sont les obligations du fonctionnaire ?', p: ['Le code général de la fonction publique, en vigueur depuis le 1er mars 2022 : dignité, impartialité, intégrité et probité.', 'Neutralité et laïcité.', 'Secret et discrétion professionnels.', 'Obéissance hiérarchique, sauf ordre manifestement illégal et de nature à compromettre gravement un intérêt public.', 'Prévention des conflits d’intérêts ; obligation de réserve, d’origine jurisprudentielle.'] },
    { id: 'v02', c: 'valeurs', q: 'Qu’est-ce que le secret professionnel à la DGFiP ?', p: ['Le secret fiscal, prévu par l’article L103 du livre des procédures fiscales, s’impose à toute personne qui connaît des informations fiscales.', 'Sa violation est un délit (article 226-13 du code pénal).', 'Des dérogations prévues par la loi : autorité judiciaire, échanges avec certaines administrations.', 'Au quotidien : rien à un proche, aucune consultation de dossier sans nécessité de service.'] },
    { id: 'v03', c: 'valeurs', q: 'Que signifient la neutralité et la laïcité pour un agent à l’accueil ?', p: ['L’agent ne manifeste ni opinion politique ni conviction religieuse dans son service.', 'Il traite tous les usagers de la même façon.', 'L’usager, lui, reste libre de ses convictions dans le respect de l’ordre public.', 'La loi du 24 août 2021 a prévu un référent laïcité dans chaque administration.'] },
    { id: 'v04', c: 'valeurs', q: 'Qu’est-ce qu’un conflit d’intérêts ? Donnez un exemple à la DGFiP.', p: ['Une interférence entre l’intérêt public et un intérêt privé ou public qui peut influencer, ou sembler influencer, l’exercice impartial des fonctions.', 'Exemple : contrôler l’entreprise d’un proche, évaluer le bien d’un membre de sa famille.', 'Le réflexe : en informer son supérieur et se déporter.', 'Le référent déontologue peut être consulté.'] },
    { id: 'v05', c: 'valeurs', q: 'Pouvez-vous refuser d’exécuter un ordre de votre supérieur ?', p: ['Le principe : le devoir d’obéissance hiérarchique.', 'L’exception : l’ordre manifestement illégal et de nature à compromettre gravement un intérêt public.', 'D’abord le dialogue : exprimer ses réserves, demander une confirmation écrite.', 'Ne pas confondre avec le droit de retrait, qui concerne un danger grave et imminent.'] },
    { id: 'v06', c: 'valeurs', q: 'Que prévoient l’article 40 du code de procédure pénale et la protection des lanceurs d’alerte ?', p: ['Article 40 : tout fonctionnaire qui a connaissance d’un crime ou d’un délit dans l’exercice de ses fonctions doit en aviser sans délai le procureur de la République.', 'Lanceurs d’alerte : la loi Sapin II de 2016, renforcée en 2022, les protège contre les représailles.', 'En matière fiscale, la loi du 23 octobre 2018 a assoupli le « verrou de Bercy » : les fraudes les plus graves sont transmises au parquet.', 'En pratique : informer sa hiérarchie, s’appuyer sur des faits.'] },
    { id: 'v07', c: 'valeurs', q: 'Un fonctionnaire peut-il exercer une autre activité ?', p: ['Le principe : il consacre l’intégralité de son activité professionnelle à ses fonctions.', 'Des activités accessoires possibles, sur autorisation ou déclaration selon les cas.', 'Certaines activités restent libres, comme la production d’œuvres de l’esprit.', 'En cas de doute : la hiérarchie et le référent déontologue.'] },
    { id: 'v08', c: 'valeurs', q: 'Quelles sont les valeurs du service public ?', p: ['Les principes de continuité, d’égalité et d’adaptabilité, dits lois de Rolland.', 'S’y ajoutent la neutralité, l’accessibilité et la qualité du service.', 'Des exemples à la DGFiP : accueil sur tout le territoire, égalité devant l’impôt, continuité pendant la crise sanitaire.', 'Ce que ces valeurs changent dans ta façon de travailler.'] },
    { id: 'v09', c: 'valeurs', q: 'Un fonctionnaire peut-il s’exprimer librement sur les réseaux sociaux ?', p: ['La liberté d’opinion est garantie.', 'Mais l’obligation de réserve impose la modération, d’autant plus forte que le poste est élevé.', 'Discrétion et secret professionnels : rien sur les dossiers, les usagers ou le service.', 'Ne pas se prévaloir de sa fonction ni dénigrer son administration.'] },
    { id: 'v10', c: 'valeurs', q: 'Qu’attend-on de l’exemplarité d’un agent ou d’un cadre de la DGFiP ?', p: ['Le guide de l’oral rappelle que l’inspecteur doit faire preuve d’exemplarité (p. 8).', 'Appliquer à soi-même les règles qu’on fait respecter, y compris ses propres obligations fiscales.', 'La cohérence entre le discours et les actes, l’équité envers l’équipe.', 'Un exemple personnel concret.'] },
    { id: 'v11', c: 'valeurs', q: 'Que signifie l’égalité devant l’impôt ?', p: ['L’article 13 de la Déclaration de 1789 : une contribution commune, également répartie entre les citoyens en raison de leurs facultés.', 'Le consentement à l’impôt (article 14) et l’article 34 de la Constitution : la loi fixe l’assiette, le taux et le recouvrement.', 'Le contrôle fiscal comme garant de cette égalité (guide Préparer les concours, p. 4).', 'Traiter chaque contribuable de la même façon, quelle que soit sa notoriété.'] },
    { id: 'v12', c: 'valeurs', q: 'Qu’est-ce que le droit à l’erreur ?', p: ['La loi ESSOC du 10 août 2018, pour un État au service d’une société de confiance.', 'L’usager de bonne foi qui se trompe peut régulariser sans sanction.', 'Il ne couvre ni la fraude ni la mauvaise foi.', 'Pour l’agent : expliquer, accompagner, sans renoncer au contrôle.'] },

    /* --- Mises en situation --- */
    { id: 's01', c: 'situ', s: 'usager', q: 'Un usager s’emporte à l’accueil et devient agressif parce que son dossier n’avance pas. Que faites-vous ?', p: ['Garder son calme, écouter, reformuler pour faire baisser la tension.', 'L’isoler du public si possible, dans un bureau, sans rester seul en cas de risque.', 'Chercher la réponse concrète à son dossier : c’est souvent la vraie source de la colère.', 'Poser une limite claire si les propos deviennent injurieux ; en cas de menace, alerter la hiérarchie et signaler l’incident.', 'Faire un point avec l’équipe ensuite.'] },
    { id: 's02', c: 'situ', s: 'usager', q: 'Une personne âgée, perdue avec le numérique, vient déclarer ses revenus. La file d’attente s’allonge. Que faites-vous ?', p: ['L’accueillir avec patience : l’égal accès au service public est en jeu.', 'L’accompagner sans faire à sa place ni utiliser ses identifiants.', 'Proposer des solutions : rendez-vous dédié, déclaration papier, espace France services.', 'Gérer la file : prévenir, réorganiser l’accueil avec les collègues.'] },
    { id: 's03', c: 'situ', s: 'usager', q: 'Un contribuable en grande difficulté ne peut pas payer son impôt et vous demande de « faire quelque chose ».', p: ['Écouter, comprendre sa situation, vérifier son dossier.', 'Présenter les solutions prévues : délais de paiement, demande de remise gracieuse, orientation vers les services sociaux.', 'Ne rien promettre hors de ta compétence ; transmettre au bon service.', 'Concilier humanité et égalité de traitement.'] },
    { id: 's04', c: 'situ', s: 'usager', q: 'Un chef d’entreprise conteste vivement un rappel d’impôt et menace d’alerter la presse.', p: ['Rester factuel et courtois, sans céder à la pression.', 'Expliquer les motifs et les voies de recours : recours hiérarchique, interlocuteur, commissions, contentieux.', 'Vérifier soi-même le dossier : une erreur se corrige, une position fondée se maintient.', 'Informer sa hiérarchie ; ne jamais s’exprimer auprès de la presse sur un dossier.'] },
    { id: 's05', c: 'situ', s: 'management', q: 'Vous prenez la tête d’une équipe : un agent expérimenté, plus âgé que vous, conteste ouvertement vos décisions.', p: ['Un entretien individuel : écouter ses arguments, reconnaître son expertise.', 'Clarifier les rôles : la décision t’appartient, son avis compte.', 'L’associer : référent, tuteur des nouveaux, contributeur sur un projet.', 'Rester ferme si la contestation devient publique ; t’appuyer sur ta hiérarchie si besoin.', 'Le jury 2026 a pénalisé la difficulté à se positionner dans la hiérarchie (rapport inspecteur, p. 12).'] },
    { id: 's06', c: 'situ', s: 'management', q: 'Un agent de votre équipe est souvent en retard et la qualité de son travail baisse.', p: ['Ne pas juger trop vite : un entretien pour comprendre (santé, difficulté personnelle, surcharge).', 'Rappeler les règles et tes attentes, fixer des objectifs et un suivi.', 'Orienter si besoin : médecine de prévention, service social.', 'Si rien ne change, garder une trace et en référer à ta hiérarchie.'] },
    { id: 's07', c: 'situ', s: 'management', q: 'Une réorganisation est imposée à votre service et l’équipe s’inquiète. Comment l’accompagnez-vous ?', p: ['Relayer la décision avec loyauté et en expliquer le sens.', 'Écouter les inquiétudes et faire remonter ce qui doit l’être.', 'Associer l’équipe aux modalités pratiques : calendrier, formation, répartition.', 'Être présent et disponible pendant la transition.'] },
    { id: 's08', c: 'situ', s: 'management', q: 'En pleine campagne déclarative, deux agents sont absents et le service est débordé.', p: ['Prioriser : accueil, délais légaux, dossiers urgents.', 'Réorganiser l’équipe, demander un renfort, t’impliquer toi-même.', 'Informer ta hiérarchie et, si besoin, les usagers des délais.', 'Préserver la santé de l’équipe, puis tirer les leçons pour anticiper l’an prochain.'] },
    { id: 's09', c: 'situ', s: 'management', q: 'Un agent demande du télétravail ; ses collègues de l’accueil jugent que ce n’est pas compatible.', p: ['Partir du cadre : règles du service, activités qui peuvent ou non se faire à distance.', 'Garantir la continuité de l’accueil, par exemple par roulement.', 'Décider avec équité et transparence, et motiver la décision.', 'Revoir l’organisation après une période d’essai.'] },
    { id: 's10', c: 'situ', s: 'management', q: 'Vous arrivez sur votre premier poste d’encadrement. Que faites-vous les premières semaines ?', p: ['Observer et écouter : rencontrer chaque agent, comprendre les procédures et les indicateurs.', 'Ne pas tout changer d’emblée ; repérer les priorités.', 'Fixer un cap et des règles de fonctionnement claires.', 'Te faire connaître des partenaires et t’appuyer sur ton propre responsable.'] },
    { id: 's11', c: 'situ', s: 'conflit', q: 'Deux agents de votre équipe ne se parlent plus et l’ambiance se dégrade.', p: ['Ne pas laisser la situation s’installer.', 'Des entretiens séparés, puis une rencontre commune centrée sur le travail.', 'Rappeler les règles de respect ; proposer une médiation si nécessaire.', 'Rester attentif à tout signe de harcèlement, et suivre la situation dans la durée.'] },
    { id: 's12', c: 'situ', s: 'conflit', q: 'Vous êtes en désaccord avec une décision de votre supérieur.', p: ['Exprimer ton désaccord en privé, avec des arguments et une solution de rechange.', 'Une fois la décision prise, l’appliquer et la porter loyalement devant l’équipe.', 'La seule limite : l’ordre manifestement illégal et de nature à compromettre gravement un intérêt public.'] },
    { id: 's13', c: 'situ', s: 'conflit', q: 'Un collègue s’attribue votre travail devant la hiérarchie.', p: ['Garder son calme et vérifier les faits.', 'En parler directement avec lui, en privé.', 'Si cela se répète, en informer ton responsable avec des éléments précis.', 'Garder en tête l’intérêt du service et du travail d’équipe.'] },
    { id: 's14', c: 'situ', s: 'conflit', q: 'Une agente vous dit subir des propos déplacés de la part d’un collègue.', p: ['La prendre au sérieux, l’écouter, ne pas minimiser.', 'Informer ta hiérarchie et utiliser le dispositif de signalement des violences, discriminations et harcèlements.', 'Protéger la victime présumée, respecter la confidentialité et la présomption d’innocence.', 'Suivre la situation et rappeler les règles à l’équipe.'] },
    { id: 's15', c: 'situ', s: 'ethique', q: 'Un usager reconnaissant vous offre une boîte de chocolats, puis revient avec un bon d’achat de 100 euros.', p: ['Distinguer un petit geste symbolique, partagé avec l’équipe selon les règles du service, d’un cadeau de valeur.', 'Le bon d’achat se refuse, poliment et fermement : probité et impartialité.', 'En informer ton responsable.', 'Si une contrepartie est attendue, on entre dans la corruption.'] },
    { id: 's16', c: 'situ', s: 'ethique', q: 'Vous êtes tenté de consulter le dossier fiscal d’un voisin ou d’une personnalité, par simple curiosité.', p: ['Non : une consultation n’est permise que pour les besoins du service.', 'Les consultations sont tracées et contrôlées.', 'Le secret professionnel s’applique même entre collègues.', 'Si un dossier d’un proche t’est attribué : le signaler et te déporter.'] },
    { id: 's17', c: 'situ', s: 'ethique', q: 'Un élu local vous demande d’accélérer le dossier d’un administré qu’il connaît.', p: ['L’écouter avec courtoisie et rappeler le cadre : égalité de traitement.', 'Ne lui donner aucune information sur le dossier : secret professionnel.', 'Traiter le dossier normalement, dans les délais habituels.', 'En informer ta hiérarchie.'] },
    { id: 's18', c: 'situ', s: 'ethique', q: 'Un ami vous demande de lui dire combien gagne son associé.', p: ['Refuser, simplement et sans exception amicale.', 'Expliquer le secret professionnel et les sanctions pénales.', 'Ne pas consulter le dossier.', 'Préserver la relation en expliquant que la règle protège tout le monde, lui compris.'] },
    { id: 's19', c: 'situ', s: 'ethique', q: 'Un journaliste vous appelle pour obtenir des informations sur un contrôle en cours.', p: ['Ne rien confirmer ni démentir.', 'Le renvoyer vers le service de communication.', 'Prévenir ton responsable.', 'Secret et discrétion professionnels.'] },
    { id: 's20', c: 'situ', s: 'ethique', q: 'Vous soupçonnez un collègue d’accorder des faveurs à certains usagers.', p: ['Ne pas mener l’enquête seul ni en parler autour de soi.', 'Réunir des faits précis et les signaler à la hiérarchie ou par le canal d’alerte prévu.', 'Article 40 du code de procédure pénale si un délit est en cause.', 'Respecter la présomption d’innocence.'] },
    { id: 's21', c: 'situ', s: 'erreur', q: 'Vous vous rendez compte que vous avez commis une erreur qui pénalise un usager.', p: ['La reconnaître sans attendre et en informer ton responsable.', 'La corriger vite : rectification, dégrèvement, remboursement.', 'Prévenir l’usager et t’excuser.', 'Comprendre la cause pour qu’elle ne se reproduise pas.'] },
    { id: 's22', c: 'situ', s: 'erreur', q: 'Un agent de votre équipe a commis une erreur importante, relevée par un usager mécontent.', p: ['Vis-à-vis de l’extérieur, assumer en tant que responsable du service.', 'Corriger l’erreur rapidement.', 'Avec l’agent : un entretien sans le stigmatiser, pour comprendre.', 'Agir sur la cause : formation, procédure, contrôle interne.'] },
    { id: 's23', c: 'situ', s: 'erreur', q: 'Votre supérieur vous demande de valider rapidement un dossier dans lequel vous voyez une anomalie.', p: ['Signaler l’anomalie avant de valider, avec des éléments précis.', 'Proposer une solution : délai court de vérification, validation partielle.', 'Si la consigne est maintenue et que rien n’est illégal, l’appliquer en gardant une trace écrite.', 'Ne jamais valider ce qui serait manifestement illégal.'] },

    /* --- Actualité des finances publiques --- */
    { id: 'a01', c: 'actu', q: 'Quelle est la situation des finances publiques de la France ?', p: ['Une dette publique supérieure à 3 000 Md€, rappelée par le sujet de note de synthèse 2026.', 'Un déficit public de 5,8 % du PIB en 2024 selon l’Insee, loin de la règle européenne des 3 %.', 'Une charge d’intérêts de la dette en hausse depuis la remontée des taux.', 'Le cadre européen : procédure pour déficit excessif ouverte contre la France en 2024.', 'Actualise ces chiffres avec le projet de loi de finances pour 2027.'] },
    { id: 'a02', c: 'actu', q: 'Comment le budget de l’État est-il préparé et voté ?', p: ['La LOLF du 1er août 2001, réformée en 2021 : un budget par missions, programmes et actions, avec des objectifs et des indicateurs de performance.', 'Le projet de loi de finances est déposé au plus tard le premier mardi d’octobre ; le Parlement dispose de 70 jours.', 'L’article 47 de la Constitution ; l’article 49.3 est souvent utilisé.', 'Après l’exécution, la loi relative aux résultats de la gestion approuve les comptes.'] },
    { id: 'a03', c: 'actu', q: 'Quelles règles européennes encadrent les finances publiques ?', p: ['Le pacte de stabilité et de croissance : 3 % de déficit et 60 % de dette par rapport au PIB.', 'Des règles réformées en 2024 : des plans budgétaires et structurels à moyen terme et une trajectoire de dépenses nettes.', 'Le semestre européen et la procédure pour déficit excessif.', 'En France, le Haut Conseil des finances publiques rend un avis sur les prévisions.'] },
    { id: 'a04', c: 'actu', q: 'Comment réduire le déficit public ? Quelle est votre position ?', p: ['Les leviers : dépenses (revues de dépenses, efficacité), recettes (fiscalité, dépenses fiscales, lutte contre la fraude) et croissance.', 'Les arbitrages : effet sur l’activité, justice sociale, acceptabilité.', 'Une position argumentée mais mesurée : l’obligation de réserve vaut aussi à l’oral.', 'Le rôle de la DGFiP : lutte contre la fraude, qualité de la dépense, conseil aux collectivités.'] },
    { id: 'a05', c: 'actu', q: 'Quels outils récents pour lutter contre la fraude fiscale ?', p: ['Le plan de lutte contre toutes les fraudes aux finances publiques présenté en 2023.', 'L’exploration de données et l’intelligence artificielle pour cibler les contrôles.', 'L’échange automatique d’informations entre pays.', 'La facturation électronique contre la fraude à la TVA.', 'Le « verrou de Bercy » assoupli par la loi du 23 octobre 2018.'] },
    { id: 'a06', c: 'actu', q: 'Que pensez-vous de la suppression de la taxe d’habitation sur les résidences principales ?', p: ['Une suppression progressive de 2018 à 2023 ; la taxe demeure sur les résidences secondaires.', 'Une compensation pour les collectivités : part départementale de taxe foncière transférée aux communes, fraction de TVA pour les autres.', 'Le débat : pouvoir d’achat d’un côté, autonomie fiscale et lien entre habitants et commune de l’autre.', 'Pour la DGFiP : la déclaration d’occupation des biens dans le service « Gérer mes biens immobiliers ».'] },
    { id: 'a07', c: 'actu', q: 'Qu’est-ce qu’une dépense fiscale ? Faut-il les réduire ?', p: ['Une mesure dérogatoire qui réduit l’impôt : crédit, réduction, exonération.', 'Plusieurs centaines de dispositifs, recensés en annexe du projet de loi de finances (Évaluation des voies et moyens, tome II).', 'Pour : elles orientent des comportements. Contre : coût, complexité, effets d’aubaine.', 'Une position nuancée : évaluer chacune et supprimer celles qui n’atteignent pas leur but.'] },
    { id: 'a08', c: 'actu', q: 'Quels sont les enjeux des finances locales ?', p: ['L’autonomie financière garantie par l’article 72-2 de la Constitution, mais une autonomie fiscale réduite.', 'Les dotations de l’État, dont la dotation globale de fonctionnement.', 'La règle d’or : l’emprunt ne finance que l’investissement.', 'La participation des collectivités au redressement des comptes ; le rôle de comptable et de conseil de la DGFiP.'] },
    { id: 'a09', c: 'actu', q: 'L’intelligence artificielle dans l’administration : chance ou risque ?', p: ['Des usages à la DGFiP : ciblage des contrôles, détection du bâti non déclaré, aide aux réponses.', 'Les gains : du temps pour l’expertise et le contact humain.', 'Les risques : biais, opacité, protection des données, fracture numérique.', 'Le règlement européen sur l’intelligence artificielle de 2024 ; garder une décision humaine.'] },
    { id: 'a10', c: 'actu', q: 'Qu’est-ce que l’impôt minimum mondial sur les sociétés ?', p: ['Un taux effectif minimal de 15 % pour les groupes dont le chiffre d’affaires consolidé atteint 750 M€.', 'L’accord de l’OCDE et du G20 de 2021, repris par une directive européenne de 2022 et transposé en France par la loi de finances pour 2024.', 'L’objectif : limiter la concurrence fiscale et le transfert des bénéfices.', 'Les limites : exceptions, mise en œuvre inégale selon les pays.'] },
    { id: 'a11', c: 'actu', q: 'Que retenez-vous du projet de budget pour 2027 ?', p: ['Une question d’actualité à préparer juste avant l’oral : objectif de déficit, grandes mesures, débats.', 'Retiens deux ou trois mesures et un chiffre clé.', 'La procédure en cours : examen parlementaire, éventuel 49.3, saisine du Conseil constitutionnel.', 'Une position mesurée, sans parti pris politique.'] },
    { id: 'a12', c: 'actu', q: 'Pourquoi le coût de la dette publique augmente-t-il ?', p: ['La dette au sens de Maastricht : État, Sécurité sociale, collectivités locales.', 'L’Agence France Trésor émet les titres de l’État, dont les obligations assimilables du Trésor.', 'La remontée des taux depuis 2022 renchérit chaque nouvel emprunt.', 'Les notes des agences et l’écart de taux avec l’Allemagne pèsent sur ce coût.'] }
  ];

  var NON_PUBLIE = [
    { t: 'Le barème détaillé des écrits n’est pas publié : la pondération des grilles de cette appli est indicative.', src: null },
    { t: 'La note de synthèse n’a pas de longueur imposée ; la fiche de méthode situe le corrigé officiel autour de 1 300 mots.', src: 'f05:1' },
    { t: 'La durée des échanges et des mises en situation à l’oral n’est pas fixée.', src: 'goral:4' },
    { t: 'Aucun guide ENFiP de l’oral contrôleur dans tes documents : le déroulé vient du rapport du jury 2026.', src: 'rjc:3' },
    { t: 'Les dates des oraux 2027 ne figurent pas dans tes documents.', src: null },
    { t: 'Aucun corrigé officiel des sujets 2026 : seuls les sujets tests en ont un.', src: 'f00:3' }
  ];

  return { SRC: SRC, EXAMS: EXAMS, EP: EP, NIVEAUX: NIVEAUX, SUJETS: SUJETS, ORAL: ORAL, CATS: CATS, SUBS: SUBS, Q: Q, NON_PUBLIE: NON_PUBLIE };
})();
if (typeof module !== 'undefined') module.exports = DATA;
