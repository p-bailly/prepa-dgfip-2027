/* ===== Exercices de plan pour la note de synthèse =====
   Deux familles : trouver et rédiger des intitulés dynamiques, puis bâtir un plan dynamique à partir de plusieurs documents.
   Les règles portent leur source (« clé:page », voir DATA.SRC). Les dossiers reprennent les idées relevées dans les corrigés
   de tes documents (fiche Sujets blancs, corrigé officiel du sujet test) ; les titres « à reprendre » et les distracteurs sont
   rédigés pour l’atelier. Contrôlé par test/test.js : chaque titre modèle passe les repères automatiques de CORE.titleCheck. */
var EXOS = (function () {
  'use strict';

  /* ---------- Boîte à outils ---------- */
  var METHODE = {
    regles: [
      { t: 'Les parties ne sont pas des tiroirs thématiques mais les étapes d’une démonstration : c’est ce qu’on appelle un plan dynamique.', src: ['gnds:9', 'f05:3'] },
      { t: 'Des titres apparents rédigés sous forme de phrases, précis et explicites ; jamais « Constat » ni « Problème ».', src: ['gnds:9', 'gnds:11', 'f05:3'] },
      { t: 'Les mots du dossier, et des parties équilibrées en longueur comme en intérêt.', src: ['gnds:9', 'f05:3'] },
      { t: 'Quand l’énoncé impose les volets (« d’une part… d’autre part »), le plan les suit à la lettre et dans cet ordre.', src: ['gnds:9', 'f05:3'] },
      { t: 'Un plan détaillé indique les relations logiques entre les idées et formule clairement les messages essentiels.', src: ['gnds:9'] }
    ],
    gestes: [
      { t: 'Résume la sous-partie en une phrase', d: 'Qui ? Fait quoi ? Avec quel effet ? Pars des idées que tu as regroupées, pas du thème.' },
      { t: 'Garde le nom, le verbe et l’effet', d: 'Un nom (le secteur, l’État, les habitants), un verbe ou un participe (pèse, fragilisé, diversifiés), le complément qui dit l’effet.' },
      { t: 'Ajoute le lien logique', d: 'qui, dont, mais, malgré, face à, au prix de, au-delà de : c’est lui qui fait avancer la démonstration.' },
      { t: 'Reprends les mots du dossier et coupe', d: 'Une ligne, une ligne et demie au plus. Pas de chiffre isolé, pas d’énumération.' }
    ],
    formules: [
      { f: 'Un… qui…', ex: 'Un patrimoine qui rapporte à la France bien au-delà de son coût' },
      { f: 'Un…, dont…', ex: 'Un parc considérable et fragile, dont l’État supporte seul les risques' },
      { f: 'Un…, participe + par…', ex: 'Un atout économique majeur, fragilisé par la concentration des flux' },
      { f: 'Un… malgré…', ex: 'Une industrie de la cosmétique économiquement forte malgré la crise' },
      { f: 'Des… de plus en plus…', ex: 'Des financements de plus en plus diversifiés' },
      { f: 'Un levier, un moteur de…', ex: 'Un levier de rayonnement et de cohésion territoriale' },
      { f: 'Verbe à l’infinitif', ex: 'Mieux répartir les visiteurs dans le temps et dans l’espace' }
    ],
    pieges: [
      'Un thème sans message : « Le financement », « La crise ».',
      'Une étiquette de dissertation : « Constat », « Enjeux », « Limites ».',
      'Une question : elle relève de l’avis, pas de la synthèse.',
      'Un jugement : « il faut », « malheureusement », un adjectif excessif.',
      'Une liste d’exemples ou un chiffre isolé à la place de l’idée.',
      'Un paragraphe : au-delà d’une ligne et demie, ce n’est plus un titre.',
      'Un plan document par document ou exemple par exemple.'
    ],
    // Mouvements tirés des consignes réelles (voir les annales dans l’onglet Écrit)
    mouvements: [
      { t: 'Leviers, puis résultats', ex: 'Externe 2022 : le programme « Logement d’abord »' },
      { t: 'Apports, mais aussi risques', ex: 'Externe 2025 : l’économie des Jeux de Paris 2024' },
      { t: 'Dérives, puis premières mesures', ex: 'Externe 2024 : le marketing d’influence' },
      { t: 'Raisons du succès, puis moyens de le renforcer', ex: 'Externe 2023 : le jeu vidéo' },
      { t: 'Difficultés et financements, puis avantages', ex: 'Session 2026 : le patrimoine historique de l’État' }
    ],
    testDonc: 'Le test du « donc » : lis tes titres I et II à la suite. Si « donc », « mais » ou « c’est pourquoi » peut les relier, le plan avance. Si seul « et » convient, c’est un catalogue. Même test entre A et B.'
  };

  /* ---------- 1. Dynamique ou à reprendre ? ---------- */
  var TRI = [
    { id: 's01', dyn: true, t: 'Un patrimoine immense et vieillissant, dont l’entretien coûteux conduit l’État à diversifier ses financements', why: 'Un constat et sa conséquence, reliés par « dont… conduit » : le titre annonce une démonstration.' },
    { id: 's02', dyn: true, t: 'Un atout économique majeur, fragilisé par la concentration des flux', why: 'Le participe « fragilisé » fait passer de l’atout à sa limite : les deux sous-parties sont déjà là.' },
    { id: 's03', dyn: true, t: 'Des pouvoirs publics qui cherchent à réguler et à mieux répartir la fréquentation', why: 'Un acteur, une action, un objectif : on sait ce que démontre la partie.' },
    { id: 's04', dyn: true, t: 'Une industrie de la cosmétique économiquement forte malgré la crise', why: 'Titre du corrigé officiel : « malgré » articule la force du secteur et l’épreuve de la crise.' },
    { id: 's05', dyn: true, t: 'Un secteur qui s’adapte aux nouvelles exigences des consommateurs', why: 'Un mouvement (« s’adapte ») et sa cause (les nouvelles exigences).' },
    { id: 's06', dyn: true, t: 'Des jauges et des réservations qui protègent les sites naturels les plus fragiles', why: 'Les outils et leur effet : la sous-partie démontre, elle ne fait pas qu’énumérer.' },
    { id: 's07', dyn: true, t: 'Une taxe de séjour devenue une ressource majeure pour les collectivités', why: '« Devenue » dit une évolution, appuyée sur les chiffres du dossier (238 puis 845 M€).' },
    { id: 's08', dyn: true, t: 'Des consommateurs plus attentifs à la composition et à l’impact environnemental des produits', why: 'Un changement de comportement, formulé avec les mots du dossier.' },
    { id: 's09', dyn: true, t: 'Des flux qui se déplacent plus qu’ils ne disparaissent', why: 'Une idée nuancée, reprise du dossier : l’étalement a ses limites.' },
    { id: 's10', dyn: true, t: 'Un mécénat populaire qui prend une place croissante dans le financement des monuments', why: 'Une tendance (« place croissante ») et son objet : un vrai message.' },
    { id: 's11', dyn: true, t: 'Des chantiers de restauration qui soutiennent l’emploi et les savoir-faire', why: 'Le titre dit à quoi servent les chantiers, pas seulement qu’ils existent.' },
    { id: 's12', dyn: true, t: 'Une acceptabilité du tourisme fragilisée par la crise du logement', why: 'Une cause et un effet, sans jugement : neutre et dynamique.' },
    { id: 's13', dyn: false, t: 'Le financement du patrimoine', why: 'Un tiroir : on sait de quoi parle la partie, pas ce qu’elle affirme.' },
    { id: 's14', dyn: false, t: 'Constat', why: 'Le guide de l’ENFiP écarte expressément les titres du type « Constat » ou « Problème ».' },
    { id: 's15', dyn: false, t: 'Les enjeux du tourisme', why: 'Un mot-valise : « enjeux » ne dit rien du contenu.' },
    { id: 's16', dyn: false, t: 'Faut-il faire payer l’accès aux sites naturels ?', why: 'Une question : c’est le sujet de l’avis, pas un titre de synthèse.' },
    { id: 's17', dyn: false, t: 'Un patrimoine que l’État doit absolument sauver', why: 'Un avis et une injonction : la synthèse reste neutre.' },
    { id: 's18', dyn: false, t: 'Malheureusement, des habitants exaspérés par les touristes', why: '« Malheureusement » est un jugement, et le ton devient journalistique.' },
    { id: 's19', dyn: false, t: 'Documents 3 et 4 : les sites naturels', why: 'Un plan document par document, que le jury assimile à un résumé.' },
    { id: 's20', dyn: false, t: 'Les Calanques, Porquerolles, Bréhat et Étretat', why: 'Une liste d’exemples à la place de l’idée qu’ils illustrent.' },
    { id: 's21', dyn: false, t: '846 millions d’euros', why: 'Un chiffre isolé : il illustre une idée, il ne la remplace pas.' },
    { id: 's22', dyn: false, t: 'La cosmétique et la crise', why: '« Et » juxtapose deux thèmes sans dire le lien entre eux.' },
    { id: 's23', dyn: false, t: 'Une industrie qui, malgré la crise sanitaire, le recul du maquillage de 35 %, la chute du rouge à lèvres de 53 % et l’essor du bio, a su maintenir son activité grâce aux soins du visage et à la vente en ligne', why: 'Un paragraphe, pas un titre : garde l’idée, renvoie les chiffres au développement.' },
    { id: 's24', dyn: false, t: 'Les solutions', why: 'Une catégorie vide : quelles solutions, et pour quoi faire ?' },
    { id: 's25', dyn: false, t: 'Un tourisme qui détruit la planète', why: 'Excessif et hors des mots du dossier, qui parle de 11 % des émissions du pays.' },
    { id: 's26', dyn: false, t: 'Les avantages du patrimoine', why: 'Le volet de la consigne recopié, sans rien affirmer.' }
  ];

  /* ---------- 2. Le meilleur intitulé ---------- */
  // La première proposition est la bonne ; l’ordre est mélangé à l’affichage.
  var CHOIX = [
    { id: 'c01', sujet: 'i2026', part: 'Sous-partie I.A', src: 'f06:1',
      contenu: 'Environ 1 300 monuments protégés, dont 84 cathédrales ; un Louvre qui souffre de fuites d’eau ; Villers-Cotterêts passé de 110 à plus de 200 M€ ; un État « son propre assureur » depuis 1889.',
      o: [
        { t: 'Un parc considérable et fragile, dont l’État supporte seul les risques', why: 'L’ampleur, la fragilité et la conséquence, avec les mots du dossier.' },
        { t: 'L’état du patrimoine', why: 'Un tiroir : rien n’est affirmé.' },
        { t: 'Un patrimoine en ruine que l’État abandonne', why: 'Exagéré et non neutre : le dossier décrit des travaux, pas un abandon.' },
        { t: 'Le Louvre, Villers-Cotterêts et Notre-Dame', why: 'Une liste d’exemples à la place de l’idée.' }
      ] },
    { id: 'c02', sujet: 'i2026', part: 'Sous-partie I.B', src: 'f06:2',
      contenu: 'Crédits de l’État et compte d’affectation spéciale immobilier ; 244 M€ de ressources propres du Louvre en 2023 ; un tarif majoré pour les visiteurs hors Union européenne ; 846 M€ de dons pour Notre-Dame.',
      o: [
        { t: 'Des financements de plus en plus diversifiés', why: 'Un mouvement (« de plus en plus ») qui couvre toutes les idées de la sous-partie.' },
        { t: 'Les sources de financement', why: 'La consigne recopiée, sans message.' },
        { t: 'Il faut faire payer davantage les touristes étrangers', why: 'Un avis, qui ne couvre en plus qu’une seule idée.' },
        { t: 'Le budget de l’État, les ressources propres et le mécénat', why: 'Un catalogue juxtaposé : la relation entre les trois n’est pas dite.' }
      ] },
    { id: 'c03', sujet: 'i2026', part: 'Sous-partie II.A', src: 'f06:3',
      contenu: '14 millions de visites par an à Notre-Dame avant l’incendie ; 50 millions de touristes et 21,5 Md€ de chiffre d’affaires touristique en Île-de-France ; plus de 2 000 personnes sur le chantier de Notre-Dame.',
      o: [
        { t: 'Un moteur économique et touristique, qui fait aussi vivre l’emploi et les savoir-faire', why: 'La fonction (« moteur ») et ses deux effets, visites et emplois.' },
        { t: 'Le tourisme', why: 'Un thème, et trop étroit : il oublie les chantiers.' },
        { t: 'Un patrimoine qui rapporte 21,5 milliards d’euros', why: 'Déformation : ce chiffre est le chiffre d’affaires du tourisme francilien, pas le rendement du patrimoine.' },
        { t: 'Les retombées sont-elles à la hauteur ?', why: 'Une question, et une prise de distance qui n’a pas sa place dans la synthèse.' }
      ] },
    { id: 'c04', sujet: 'iblanc', part: 'Sous-partie I.B', src: 'f06:12',
      contenu: '80 % de l’activité touristique sur 20 % du territoire ; 36 000 personnes au Mont-Saint-Michel en une journée ; des loyers en hausse ; 11 % des émissions du pays ; 107 M€ de secours en montagne.',
      o: [
        { t: 'Une fréquentation concentrée qui pèse sur les sites, les habitants et les budgets publics', why: 'La cause (la concentration) et ses trois effets, dans l’ordre des idées.' },
        { t: 'Les inconvénients du tourisme', why: 'Une catégorie de dissertation, sans message.' },
        { t: 'Le surtourisme, un fléau qu’il faut combattre', why: 'Un jugement et une injonction.' },
        { t: 'La concentration des flux', why: 'La cause sans ses effets : l’idée est incomplète.' }
      ] },
    { id: 'c05', sujet: 'iblanc', part: 'Sous-partie II.A', src: 'f06:12',
      contenu: 'Réservation obligatoire à Sugiton, jauge à Porquerolles ; loi du 19 novembre 2024 sur les meublés ; surtaxe de séjour de 200 % en Île-de-France ; droit d’accès à Venise.',
      o: [
        { t: 'Une régulation qui s’étend de l’accès aux sites au logement et à la fiscalité', why: 'Une idée d’ensemble (la régulation) et son extension, qui couvre les quatre exemples.' },
        { t: 'Les mesures', why: 'Une étiquette : lesquelles, et pour quoi faire ?' },
        { t: 'Documents 3, 5, 7 et 8', why: 'Un renvoi aux documents à la place d’une idée.' },
        { t: 'La France doit imiter Venise', why: 'Un avis, et l’exemple étranger pris pour le cœur de la sous-partie.' }
      ] },
    { id: 'c06', sujet: 'iblanc', part: 'Sous-partie II.B', src: 'f06:12',
      contenu: 'Stratégie nationale de 2023 et 25 territoires lauréats ; parking moins cher avant 10 h au Mont-Saint-Michel ; promotion du hors-saison ; pendant les Jeux, des flux déplacés plutôt que réduits.',
      o: [
        { t: 'Un étalement des flux dans le temps et l’espace, dont les effets restent à confirmer', why: 'L’objectif commun et sa limite, que le dossier signale avec l’exemple des Jeux.' },
        { t: 'La répartition', why: 'Un mot seul : rien n’est démontré.' },
        { t: 'Une stratégie nationale en quatre axes et quinze mesures', why: 'Une seule idée, celle d’un document, pour toute la sous-partie.' },
        { t: 'Des campagnes de promotion inutiles', why: 'Un jugement que le dossier ne porte pas.' }
      ] },
    { id: 'c07', sujet: 'itest', part: 'Sous-partie I.A', src: 'sti:24',
      contenu: '315 entreprises et 26 000 salariés ; trois régions qui concentrent la moitié des emplois ; la Cosmetic Valley à Chartres ; des laboratoires de recherche à Orléans.',
      o: [
        { t: 'Une industrie de la cosmétique bien implantée sur le territoire', why: 'Le titre du corrigé officiel : une idée d’ensemble que chaque exemple vient prouver.' },
        { t: 'Implantation', why: 'Un mot seul, sans message.' },
        { t: 'La Cosmetic Valley', why: 'Un exemple pris pour toute la sous-partie.' },
        { t: 'Pourquoi la France domine-t-elle la cosmétique ?', why: 'Une question, et un verbe que le dossier ne justifie pas.' }
      ] },
    { id: 'c08', sujet: 'itest', part: 'Sous-partie II.A', src: 'sti:26',
      contenu: 'Le maquillage recule, les soins du visage progressent de 32 % ; la cosmétique verte passe de 157 à 353 M€ en dix ans ; un Français sur deux achète un soin bio ; un secteur parmi les plus polluants.',
      o: [
        { t: 'Des consommateurs dont la crise sanitaire a déplacé les attentes vers le soin, le bio et l’environnement', why: 'La cause (la crise) et la direction du changement, avec les trois tendances du dossier.' },
        { t: 'Les nouvelles tendances', why: 'Trop vague : quelles tendances ?' },
        { t: 'Le bio, avenir de la beauté', why: 'Un slogan, et une prédiction que le dossier ne fait pas.' },
        { t: 'Maquillage, soins du visage, bio et environnement', why: 'Une énumération sans lien.' }
      ] },
    { id: 'c09', sujet: 'iblanc', part: 'Titre de la partie I', src: 'f06:12',
      contenu: 'A : un secteur de premier rang pour l’économie et les finances publiques. B : une fréquentation concentrée qui pèse sur les sites, les habitants et les budgets publics.',
      o: [
        { t: 'Un atout économique majeur, fragilisé par la concentration des flux', why: 'Le titre de partie relie A et B : l’atout, puis ce qui le fragilise.' },
        { t: 'Les atouts et les déséquilibres du tourisme', why: 'La consigne recopiée : « et » juxtapose sans relier.' },
        { t: 'Un tourisme record', why: 'Ne couvre que la sous-partie A.' },
        { t: 'Constat', why: 'Un titre que le guide de l’ENFiP écarte expressément.' }
      ] },
    { id: 'c10', sujet: 'i2026', part: 'Titre de la partie II', src: 'f06:3',
      contenu: 'A : un moteur économique et touristique. B : un levier de rayonnement et de cohésion territoriale.',
      o: [
        { t: 'Un patrimoine qui rapporte à la France bien au-delà de son coût', why: 'Il répond à la partie I (le coût) : on peut dire « mais » entre les deux.' },
        { t: 'Les avantages', why: 'Le volet de la consigne, sans message.' },
        { t: 'Un patrimoine rentable qu’il faut développer', why: 'Un avis et une injonction.' },
        { t: 'Le rayonnement de la France', why: 'Ne couvre que la sous-partie B.' }
      ] }
  ];

  /* ---------- 3. Réécris le titre ---------- */
  // mots : débuts de mots du dossier (sans accent ni majuscule) dont un au moins devrait figurer dans le titre.
  var REECRIRE = [
    { id: 'r01', sujet: 'i2026', statique: 'Les risques', src: 'f06:2',
      contenu: 'Depuis une décision de 1889, l’État est « son propre assureur ». L’incendie de Notre-Dame l’a exposé seul à plus d’un milliard d’euros de travaux, l’assurance des entreprises du chantier étant plafonnée à quelques millions.',
      mots: ['assur', 'risque', 'sinistre', 'incendie', 'etat'],
      modeles: ['Un État qui, en restant son propre assureur, supporte seul le coût des sinistres', 'Un risque de sinistre que l’État assume seul depuis 1889'] },
    { id: 'r02', sujet: 'i2026', statique: 'Le Louvre', src: 'f06:2',
      contenu: 'Fuites d’eau et variations de température menacent les œuvres ; la pyramide, conçue pour 4 millions de visiteurs par an, en reçoit deux fois plus. La rénovation est estimée à 700 à 800 M€ ; la nouvelle entrée serait autofinancée.',
      mots: ['louvre', 'renov', 'vetust', 'ressource', 'fuite', 'pyramide', 'sature'],
      modeles: ['Un Louvre saturé et vétuste, dont la rénovation s’appuiera sur ses ressources propres', 'Une rénovation du Louvre rendue urgente par l’usure et la saturation du musée'] },
    { id: 'r03', sujet: 'i2026', statique: 'Les chantiers', src: 'f06:3',
      contenu: 'Près de 250 entreprises et ateliers d’art et plus de 2 000 personnes ont restauré Notre-Dame. À Villers-Cotterêts, 600 compagnons et plus de 200 entreprises sont intervenus ; les clauses d’insertion ont permis 140 recrutements.',
      mots: ['chantier', 'emploi', 'entreprise', 'savoir', 'insertion', 'compagnon', 'restaur'],
      modeles: ['Des chantiers de restauration qui soutiennent l’emploi et les savoir-faire', 'Des restaurations qui font travailler les entreprises et favorisent l’insertion'] },
    { id: 'r04', sujet: 'i2026', statique: 'La Cité de la langue française', src: 'f06:3',
      contenu: 'Plus de 260 000 visiteurs la première année, au-delà de l’objectif de 200 000 ; près de 40 % venus de l’Aisne et plus de 15 000 scolaires ; le Sommet de la Francophonie accueilli en octobre 2024.',
      mots: ['cite', 'langue', 'territ', 'rayonn', 'aisne', 'francophon', 'visiteur'],
      modeles: ['Une Cité de la langue française qui fait rayonner la France tout en attirant les habitants de l’Aisne', 'Un monument restauré qui sert à la fois le rayonnement du pays et son territoire'] },
    { id: 'r05', sujet: 'iblanc', statique: 'La taxe de séjour', src: 'f06:8',
      contenu: 'Facultative, de 0,20 € à 4,90 € par nuitée ; son produit passe de 238 M€ en 2012 à 845 M€ en 2022 ; une plateforme en reverse à elle seule 187 M€ en 2023 ; surtaxe régionale de 200 % en Île-de-France depuis 2024.',
      mots: ['taxe', 'sejour', 'collectiv', 'produit', 'ressource', 'recette'],
      modeles: ['Une taxe de séjour dont le produit a plus que triplé en dix ans', 'Une taxe de séjour devenue une ressource majeure pour les collectivités'] },
    { id: 'r06', sujet: 'iblanc', statique: 'Les meublés de tourisme', src: 'f06:9',
      contenu: 'De 300 000 à 1,2 million de meublés en huit ans, des loyers en hausse de 20 % dans les zones concernées. La loi du 19 novembre 2024 réduit l’abattement fiscal, impose l’enregistrement et permet aux communes de fixer des quotas.',
      mots: ['meuble', 'loi', 'loyer', 'enregistr', 'encadr', 'abattement', 'quota'],
      modeles: ['Des meublés de tourisme en plein essor, que la loi de 2024 encadre désormais', 'Une loi de 2024 qui rend les meublés de tourisme moins avantageux et mieux contrôlés'] },
    { id: 'r07', sujet: 'iblanc', statique: 'L’environnement', src: 'f06:10',
      contenu: '97 millions de tonnes équivalent CO2 en 2022, soit 11 % des émissions du pays, dont 69 % pour les transports. Dans les Calanques, le piétinement érode les sentiers ; en 2022, la baignade a été interdite dans les gorges du Verdon.',
      mots: ['emission', 'climat', 'milieu', 'erosion', 'transport', 'gaz', 'environnement'],
      modeles: ['Un tourisme qui pèse sur le climat et dégrade les milieux les plus fréquentés', 'Des émissions et une érosion des milieux qui rendent la fréquentation plus coûteuse pour l’environnement'] },
    { id: 'r08', sujet: 'iblanc', statique: 'Les habitants', src: 'f06:10',
      contenu: '74 % des Français jugent que les effets positifs du tourisme égalent ou dépassent ses effets négatifs ; 52 % sont favorables à des quotas ; au Pays basque, 3 500 personnes manifestent pour des logements accessibles.',
      mots: ['habitant', 'logement', 'francais', 'accept', 'quota', 'tourisme'],
      modeles: ['Des habitants attachés au tourisme, mais inquiets pour leur logement', 'Une acceptabilité du tourisme fragilisée par la crise du logement'] },
    { id: 'r09', sujet: 'itest', statique: 'La crise', src: 'sti:25',
      contenu: 'Pendant la pandémie, le maquillage perd 35 % de ses ventes et le rouge à lèvres 53 %. Le chiffre d’affaires recule de 6 % en 2020, puis atteint 45 Md€ en 2021, en hausse de 14 %.',
      mots: ['crise', 'sanitaire', 'vente', 'recul', 'activite', 'chiffre', 'maquillage', 'pandemie'],
      modeles: ['Un secteur durement touché par la crise sanitaire, mais qui a vite retrouvé son niveau d’activité', 'Une industrie qui a surmonté la crise sanitaire après un net recul de ses ventes'] },
    { id: 'r10', sujet: 'itest', statique: 'La vente en ligne', src: 'sti:27',
      contenu: 'Pendant le confinement, les ventes en boutique reculent de 26 % tandis que les ventes en ligne progressent de 52 % ; la part du commerce en ligne passe de 8 % en 2019 à 16 % en 2020.',
      mots: ['ligne', 'commerce', 'boutique', 'confinement', 'vente', 'distance'],
      modeles: ['Un confinement qui a accéléré le passage à la vente en ligne', 'Des achats qui se déplacent des boutiques vers la vente en ligne'] }
  ];

  /* ---------- 4. Du libellé au plan ---------- */
  // Consignes réelles (annales) ; la première proposition est la bonne. Les plans sont rédigés pour l’atelier, sans chiffre.
  var LIBELLES = [
    { id: 'l01', sujet: 'i2026', cle: 'd’une part, les difficultés de son entretien et les sources de financement qui permettent de le supporter, et d’autre part, les avantages que la France tire d’un tel patrimoine',
      o: [
        { I: 'Un patrimoine immense et vieillissant, dont l’entretien coûteux conduit l’État à diversifier ses financements', II: 'Un patrimoine qui rapporte à la France bien au-delà de son coût', why: 'Les deux volets dans l’ordre imposé, et un « mais » possible entre I et II.' },
        { I: 'Un patrimoine qui rapporte à la France bien au-delà de son coût', II: 'Un entretien coûteux qui oblige l’État à chercher de nouveaux financements', why: 'L’ordre imposé (« d’une part… d’autre part ») est inversé.' },
        { I: 'Le Louvre et Notre-Dame', II: 'Les monuments en région', why: 'Des tiroirs géographiques, étrangers aux volets de la consigne.' }
      ] },
    { id: 'l02', sujet: 'iblanc', cle: 'd’une part les atouts que le tourisme représente pour le pays et les déséquilibres que crée la concentration des flux, et d’autre part les réponses apportées par les pouvoirs publics pour mieux répartir et réguler cette fréquentation',
      o: [
        { I: 'Un atout économique majeur, fragilisé par la concentration des flux', II: 'Des pouvoirs publics qui cherchent à réguler et à mieux répartir la fréquentation', why: 'Le problème, puis les réponses : le I appelle le II.' },
        { I: 'Le tourisme en France', II: 'Le tourisme à l’étranger', why: 'Un découpage géographique : les exemples étrangers servent seulement d’illustration.' },
        { I: 'Des pouvoirs publics qui régulent la fréquentation', II: 'Un atout économique fragilisé par la concentration des flux', why: 'Les réponses avant le problème : la démonstration est à l’envers.' }
      ] },
    { id: 'l03', sujet: 'itest', cle: 'en expliquant comment ce secteur qui disposait de réels atouts est parvenu à résister à la crise, et a su s’adapter pour maintenir son niveau d’activité',
      o: [
        { I: 'La cosmétique : une industrie économiquement forte et bien implantée sur l’hexagone', II: 'Un secteur qui s’adapte aux nouvelles exigences des consommateurs', why: 'Le plan du corrigé officiel : des atouts qui expliquent la résistance, puis l’adaptation.' },
        { I: 'Le marché du bien-être', II: 'Le marché de la cosmétique', why: 'Deux thèmes juxtaposés, sans démonstration.' },
        { I: 'Une industrie frappée par la crise sanitaire', II: 'Une industrie qui doit se réinventer pour survivre', why: 'Contraire à la consigne, qui parle de résistance et de maintien de l’activité.' }
      ] },
    { id: 'l04', sujet: 'i2025e', cle: 'en soulignant l’apport de cet évènement sportif sur le plan économique pour la France, mais aussi les risques financiers qu’il peut représenter',
      o: [
        { I: 'Un évènement qui apporte à l’économie française des retombées multiples', II: 'Une organisation qui expose aussi les finances publiques à des risques', why: 'L’apport, puis les risques : le « mais aussi » de la consigne devient le pivot du plan.' },
        { I: 'Avantages', II: 'Inconvénients', why: 'Des étiquettes vides, sans les mots du dossier.' },
        { I: 'L’organisation des épreuves', II: 'Le bilan sportif des Jeux', why: 'Hors sujet : la consigne porte sur l’économie et les finances.' }
      ] },
    { id: 'l05', sujet: 'i2024e', cle: 'présentant les dérives qui justifient un meilleur encadrement du marketing d’influence, ainsi que les premières mesures engagées',
      o: [
        { I: 'Des dérives qui rendent nécessaire un meilleur encadrement du marketing d’influence', II: 'De premières mesures engagées pour encadrer les pratiques des influenceurs', why: 'Les dérives justifient l’encadrement, puis les mesures y répondent : la logique de la consigne.' },
        { I: 'Qu’est-ce que le marketing d’influence ?', II: 'Les influenceurs', why: 'Une question et un thème : ni dérives, ni mesures.' },
        { I: 'Les dérives', II: 'Des propositions pour éduquer les internautes', why: 'Le II mélange la synthèse et la note de propositions, qui est un autre exercice.' }
      ] },
    { id: 'l06', sujet: 'i2023e', cle: 'en expliquant les raisons d’un tel succès et les moyens qui contribuent à le renforcer',
      o: [
        { I: 'Un succès économique qui s’explique par des raisons multiples', II: 'Des moyens qui contribuent à consolider ce succès', why: 'Les raisons, puis les moyens : chaque partie répond à un verbe de la consigne.' },
        { I: 'L’histoire du jeu vidéo', II: 'Les jeux les plus vendus', why: 'Des tiroirs hors de la problématique.' },
        { I: 'Un succès fragile', II: 'Un secteur menacé', why: 'Contraire à la consigne, qui demande d’expliquer et de renforcer un succès.' }
      ] },
    { id: 'l07', sujet: 'i2022e', cle: 'en présentant d’une part les leviers utilisés et d’autre part les résultats obtenus, la note démontrera si le programme atteint son objectif',
      o: [
        { I: 'Un programme qui mobilise plusieurs leviers contre le sans-abrisme', II: 'Des résultats qui permettent de mesurer si l’objectif est atteint', why: 'Les leviers, puis les résultats ; la question posée devient la ligne d’arrivée du II.' },
        { I: 'Le sans-abrisme en France', II: 'Le programme « Logement d’abord »', why: 'Deux thèmes : les volets imposés ont disparu.' },
        { I: 'Des résultats encourageants', II: 'Des leviers à renforcer', why: 'L’ordre est inversé et « à renforcer » glisse un avis dans la synthèse.' }
      ] }
  ];

  /* ---------- 5. Du dossier au plan ---------- */
  // p : place de l’idée dans le plan du corrigé (0 = I.A, 1 = I.B, 2 = II.A, 3 = II.B) ; why : pour les idées ambiguës.
  var DOSSIERS = [
    { id: 'tour', sujet: 'iblanc', titre: 'La surfréquentation touristique en France', info: '12 documents résumés dans la fiche Sujets blancs', src: ['f06:6', 'f06:11', 'f06:12', 'f06:13'],
      consigne: 'À l’aide des seuls documents joints, vous réaliserez une note de synthèse relative à la surfréquentation touristique en France. Vous présenterez d’une part les atouts que le tourisme représente pour le pays et les déséquilibres que crée la concentration des flux, et d’autre part les réponses apportées par les pouvoirs publics pour mieux répartir et réguler cette fréquentation.',
      docs: ['Une année record pour le tourisme en France', 'Une stratégie nationale pour gérer les flux touristiques', 'Quand les sites naturels font le tri à l’entrée', 'Le Mont-Saint-Michel et Étretat face aux pics de fréquentation', 'Venise, Amsterdam, mont Fuji : faire payer pour réguler ?', 'Barcelone : quand les habitants disent « assez »', 'La taxe de séjour, une ressource en forte hausse pour les collectivités', 'Meublés de tourisme : la loi du 19 novembre 2024 resserre les règles', 'Ce que coûte la surfréquentation aux finances publiques', 'Le tourisme, 11 % des émissions de gaz à effet de serre du pays', 'Ce que les Français pensent du tourisme', 'Étaler les flux dans le temps et dans l’espace'],
      axes: LIBELLES[1].o,
      etiquettes: ['Poids économique et recettes', 'Effets de la concentration', 'Outils de régulation', 'Répartition des visiteurs'],
      I: 'Un atout économique majeur, fragilisé par la concentration des flux',
      II: 'Des pouvoirs publics qui cherchent à réguler et à mieux répartir la fréquentation',
      parts: [
        { titre: 'Un secteur de premier rang pour l’économie et les finances publiques', mots: ['econom', 'recette', 'secteur', 'finance', 'emploi', 'ressource', 'atout'] },
        { titre: 'Une fréquentation concentrée qui pèse sur les sites, les habitants et les budgets publics', mots: ['concentr', 'frequent', 'flux', 'site', 'habitant', 'pression', 'desequilib'] },
        { titre: 'Réguler l’accès, le logement et la fiscalité', mots: ['regul', 'acces', 'logement', 'fiscal', 'jauge', 'reserv', 'encadr', 'taxe'] },
        { titre: 'Mieux répartir les visiteurs dans le temps et dans l’espace', mots: ['repart', 'etal', 'visiteur', 'flux', 'saison', 'espace', 'temps'] }
      ],
      idees: [
        { t: '102 millions de touristes internationaux et 77,5 Md€ de recettes en 2025 ; un solde touristique de 20,1 Md€.', d: '1', p: 0 },
        { t: '1,3 million de salariés dans l’hôtellerie-restauration ; un objectif de 100 Md€ de recettes en 2030.', d: '1', p: 0 },
        { t: 'Une taxe de séjour passée de 238 M€ en 2012 à 845 M€ en 2022.', d: '7', p: 0, why: 'Le même document sert deux fois : ici le produit de la taxe (une recette), en II.A la surtaxe (un outil).' },
        { t: '80 % de l’activité touristique sur 20 % du territoire.', d: '2', p: 1 },
        { t: 'Plus de 36 000 personnes au Mont-Saint-Michel le 18 août 2022 ; jusqu’à 10 000 visiteurs par jour à Étretat.', d: '4', p: 1 },
        { t: 'Des meublés de tourisme passés de 300 000 à 1,2 million en huit ans ; des loyers en hausse de 68 % en dix ans à Barcelone.', d: '6, 8', p: 1 },
        { t: '41 % des Français disent avoir déjà subi le surtourisme ; 3 500 manifestants au Pays basque pour des logements accessibles.', d: '11', p: 1 },
        { t: 'Le tourisme pèse 11 % des émissions du pays ; dans les Calanques, l’érosion des sentiers et la destruction des herbiers de posidonie.', d: '10', p: 1 },
        { t: 'Un secours en montagne à 107 M€ en 2024 ; des déchets multipliés par 2,5 l’été dans le sud de la Corse.', d: '9', p: 1 },
        { t: 'Réservation à Sugiton (400 personnes par jour), jauge de 6 000 visiteurs à Porquerolles, plafond à Bréhat.', d: '3', p: 2 },
        { t: 'Loi du 19 novembre 2024 : abattement fiscal réduit, enregistrement obligatoire, quotas communaux.', d: '8', p: 2 },
        { t: 'Une surtaxe de séjour de 200 % en Île-de-France depuis 2024.', d: '7', p: 2 },
        { t: 'Droit d’accès à Venise, sentier du mont Fuji limité à 4 000 personnes par jour, gel hôtelier à Amsterdam.', d: '5', p: 2, why: 'Les exemples étrangers illustrent les outils de régulation : ils ne forment pas une partie à eux seuls.' },
        { t: 'Stratégie nationale de 2023 : observatoire, outils de comptage, 25 territoires lauréats.', d: '2', p: 3 },
        { t: 'Au Mont-Saint-Michel, le parking réservé coûte 17 € au lieu de 25 € pour venir avant 10 h ou après 16 h.', d: '4', p: 3, why: 'Ce n’est pas une interdiction mais une incitation à venir à d’autres heures : elle répartit les flux.' },
        { t: 'Promotion du hors-saison et des territoires moins visités ; plan Avenir Montagnes de 331 M€.', d: '12', p: 3 },
        { t: 'Pendant les Jeux de 2024, des musées parisiens en baisse d’environ 20 % : les flux se déplacent plus qu’ils ne disparaissent.', d: '12', p: 3, why: 'Une limite de l’étalement, placée à la fin de la sous-partie qu’elle nuance.' }
      ],
      transition: 'Si le tourisme reste un atout majeur, la concentration de ses flux en menace l’acceptabilité et l’équilibre : les pouvoirs publics ont donc développé des outils pour la réguler et la répartir.',
      annonce: 'Après avoir présenté les atouts du tourisme et les déséquilibres nés de la concentration des flux (I), on exposera les réponses apportées pour mieux répartir et réguler la fréquentation (II).',
      pourquoi: 'Le I passe de l’atout à ce qui le fragilise ; le II répond à ce déséquilibre, d’abord en contraignant (A), puis en incitant (B). Entre I et II, « donc » convient : le plan démontre. Les douze documents trouvent leur place.' },
    { id: 'patr', sujet: 'i2026', titre: 'Le patrimoine immobilier historique de l’État', info: 'Session 2026 · 12 documents, 24 pages', src: ['f06:1', 'f06:2', 'f06:3', 'f05:3'],
      consigne: 'À l’aide des seuls documents joints, vous réaliserez une note de synthèse relative au patrimoine immobilier historique de l’État. Vous présenterez d’une part, les difficultés de son entretien et les sources de financement qui permettent de le supporter, et d’autre part, les avantages que la France tire d’un tel patrimoine.',
      docs: null,
      axes: LIBELLES[0].o,
      etiquettes: ['Ampleur et fragilité du parc', 'Financements', 'Retombées économiques', 'Rayonnement et territoires'],
      I: 'Un patrimoine immense et vieillissant, dont l’entretien coûteux conduit l’État à diversifier ses financements',
      II: 'Un patrimoine qui rapporte à la France bien au-delà de son coût',
      parts: [
        { titre: 'Un parc considérable et fragile, dont l’État supporte seul les risques', mots: ['parc', 'patrimoine', 'monument', 'fragil', 'vieill', 'risque', 'entretien', 'assur'] },
        { titre: 'Des financements de plus en plus diversifiés', mots: ['financ', 'ressource', 'mecenat', 'don', 'credit', 'budget'] },
        { titre: 'Un moteur économique et touristique', mots: ['econom', 'touris', 'emploi', 'visite', 'chantier', 'moteur'] },
        { titre: 'Un levier de rayonnement et de cohésion territoriale', mots: ['rayonn', 'territ', 'image', 'cohesion', 'francophon', 'local'] }
      ],
      idees: [
        { t: 'Environ 1 300 monuments protégés appartiennent à l’État, dont 84 cathédrales, Versailles, Chambord ou le Mont-Saint-Michel.', p: 0 },
        { t: 'Le Louvre souffre de fuites d’eau ; sa pyramide, conçue pour 4 millions de visiteurs par an, en reçoit deux fois plus.', p: 0 },
        { t: 'La restauration de Villers-Cotterêts devait coûter 110 M€ et en a coûté plus de 200.', p: 0 },
        { t: 'Depuis 1889, l’État est « son propre assureur » : l’incendie de Notre-Dame l’a exposé seul à plus d’un milliard d’euros de travaux.', p: 0 },
        { t: 'Crédits des ministères, compte d’affectation spéciale immobilier, programme d’un milliard d’euros pour les cités administratives.', p: 1 },
        { t: '244 M€ de ressources propres du Louvre en 2023, dont 83,1 M€ de licence de marque versés par le Louvre Abou Dhabi.', p: 1, why: 'Ici l’angle est financier (une ressource du musée) ; le rayonnement du Louvre à l’étranger relève du II.B.' },
        { t: 'Un tarif majoré pour les visiteurs venus de pays hors de l’Union européenne, qui pourrait rapporter 20 M€ par an.', p: 1 },
        { t: '846 M€ de dons de 340 000 donateurs pour la restauration de Notre-Dame.', p: 1 },
        { t: '14 millions de visites par an à Notre-Dame avant l’incendie ; 10,12 millions de visiteurs dans le réseau des monuments nationaux en 2022.', p: 2 },
        { t: '50 millions de touristes et 21,5 Md€ de chiffre d’affaires touristique en Île-de-France en 2018.', p: 2 },
        { t: 'Près de 250 entreprises et plus de 2 000 personnes sur le chantier de Notre-Dame ; 140 recrutements en insertion à Villers-Cotterêts.', p: 2, why: 'Les chantiers coûtent (I), mais ils font aussi travailler : c’est cet angle, l’emploi, qui les place en II.A.' },
        { t: 'Le Louvre exporte sa marque à Abou Dhabi ; la Cité de la langue française accueille le Sommet de la Francophonie en 2024.', p: 3 },
        { t: 'Plus de 260 000 visiteurs la première année à la Cité de la langue française, dont près de 40 % venus de l’Aisne et 15 000 scolaires.', p: 3, why: 'Le chiffre de visiteurs sert ici la cohésion territoriale : la part venue de l’Aisne compte plus que le total.' },
        { t: 'Des tiers-lieux pour artisans et entrepreneurs dans des monuments peu visités, comme au château de Jossigny.', p: 3 }
      ],
      transition: 'Si l’entretien de ce patrimoine pèse lourdement sur les finances publiques et appelle de nouveaux financements, ce coût doit être mis en regard des avantages que la France en retire.',
      annonce: 'Les difficultés d’entretien de ce patrimoine et les financements mobilisés pour y faire face (I) doivent être mis en regard des avantages que la France en retire (II).',
      pourquoi: 'Le I va du problème (un parc immense et fragile, que l’État assure seul) à sa conséquence (chercher d’autres financements) ; le II retourne la perspective : ce coût rapporte. Entre I et II, « mais » convient, et le plan suit exactement l’ordre imposé par la consigne.' },
    { id: 'cosm', sujet: 'itest', titre: 'Le marché du bien-être et de la cosmétique', info: 'Sujet test · 8 documents, 20 pages · corrigé officiel', src: ['sti:24', 'sti:25', 'sti:26', 'sti:27'],
      consigne: 'À l’aide des seuls documents joints, vous réaliserez une note de synthèse sur le marché du bien-être en France, en expliquant comment ce secteur qui disposait de réels atouts est parvenu à résister à la crise, et a su s’adapter pour maintenir son niveau d’activité.',
      docs: null,
      axes: LIBELLES[2].o,
      etiquettes: ['Implantation', 'Poids économique et crise', 'Attentes des consommateurs', 'Façons d’acheter et perspectives'],
      I: 'La cosmétique : une industrie économiquement forte et bien implantée sur l’hexagone',
      II: 'Un secteur qui s’adapte aux nouvelles exigences des consommateurs',
      parts: [
        { titre: 'Une industrie de la cosmétique bien implantée sur le territoire', mots: ['implant', 'territ', 'region', 'site', 'pole', 'industrie'] },
        { titre: 'Une industrie de la cosmétique française économiquement forte malgré la crise', mots: ['econom', 'crise', 'production', 'export', 'industrie', 'resist'] },
        { titre: 'Des exigences et des préoccupations des consommateurs revues à l’aune de la crise sanitaire', mots: ['consommat', 'exigence', 'attente', 'bio', 'soin', 'environnement', 'preoccup'] },
        { titre: 'Des modes de consommation qui évoluent, au profit des emballages écoresponsables et de la vente en ligne', off: 'Une évolution des modalités de consommation et des perspectives économiques', mots: ['consommation', 'ligne', 'emballage', 'achat', 'vente', 'perspective', 'modalit'] }
      ],
      idees: [
        { t: '315 entreprises et 26 000 salariés dans la production de parfums et de produits de toilette en 2015.', p: 0 },
        { t: 'Île-de-France, Centre-Val de Loire et Hauts-de-France concentrent la moitié des emplois du secteur.', p: 0 },
        { t: 'La Cosmetic Valley, pôle de compétitivité installé à Chartres ; des laboratoires de grandes marques à Orléans.', p: 0 },
        { t: '9,1 Md€ de production en 2015, soit un tiers de la production européenne.', p: 1 },
        { t: 'Une balance commerciale du secteur excédentaire de plus de 9,2 Md€.', p: 1 },
        { t: 'Pendant la pandémie, le maquillage perd 35 % de ses ventes et le rouge à lèvres 53 %, le parfum 15 % seulement.', p: 1, why: 'Le corrigé officiel place la crise dans le I.B : elle montre que le secteur a résisté, comme le demande la consigne.' },
        { t: 'Les soins du visage progressent de 32 % et ceux des cheveux de 27 %.', p: 2 },
        { t: 'La cosmétique verte passe de 157 M€ en 2013 à 353 M€ en 2023 ; un Français sur deux a acheté un soin bio dans l’année.', p: 2 },
        { t: 'L’industrie cosmétique est la troisième plus polluante, derrière l’alimentaire et la mode.', p: 2 },
        { t: 'Le succès des shampooings solides pousse les grandes marques vers des emballages écoresponsables.', p: 3 },
        { t: 'Les ventes en boutique reculent de 26 % tandis que les ventes en ligne progressent de 52 %.', p: 3 },
        { t: 'Un chiffre d’affaires en recul de 6 % en 2020, puis estimé à 45 Md€ en 2021, en hausse de 14 %.', p: 3, why: 'Le corrigé le garde pour la fin : une perspective de reprise, qui clôt la démonstration sur le maintien de l’activité.' }
      ],
      transition: 'L’industrie de la cosmétique constitue depuis longtemps un secteur économique particulièrement florissant pour la France. Résiliente, elle est parvenue à surmonter la crise de la Covid, mais elle doit à présent s’adapter aux nouveaux comportements que celle-ci a fait naître chez les consommateurs.',
      annonce: 'L’implantation de l’industrie de la cosmétique en France, ainsi que son poids économique, seront présentés, avant d’examiner la manière dont cette industrie s’adapte aux nouvelles exigences des consommateurs pour conserver sa place.',
      pourquoi: 'Le I établit les atouts qui expliquent la résistance à la crise ; le II montre l’adaptation qui permet de maintenir l’activité : c’est le fil exact de la consigne. Le dernier titre du corrigé officiel reste descriptif ; la version proposée ici dit le sens de l’évolution.' }
  ];

  var PARTS = ['I.A', 'I.B', 'II.A', 'II.B'];
  var TRI_N = 8; // titres par série

  return { METHODE: METHODE, TRI: TRI, CHOIX: CHOIX, REECRIRE: REECRIRE, LIBELLES: LIBELLES, DOSSIERS: DOSSIERS, PARTS: PARTS, TRI_N: TRI_N };
})();
if (typeof module !== 'undefined') module.exports = EXOS;
