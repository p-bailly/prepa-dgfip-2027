// Fiches de cours du QCM, réécrites d'après « 05 Fiches et entrainement » (01_Fiches_QCM_commun.pdf
// et les mini-fiches de 07_Controleur.pdf). Pas de tiret cadratin : deux-points, virgules ou parenthèses.
// Blocs : {h} sous-titre, {p} paragraphe, {ul}/{ol} listes, {tb:{c:[colonnes], r:[lignes]}} tableau,
// {warn} piège à retenir, {note} conseil. **texte** passe en gras. th : thèmes de la banque liés à la fiche.
const FICHES = [
{id:"institutions", t:"Institutions françaises", th:["admin"], b:[
  {p:"La **Constitution du 4 octobre 1958** fonde la Ve République. Elle a été révisée **25 fois**, la dernière le **8 mars 2024** pour inscrire la liberté de recourir à l'IVG."},
  {p:"Une révision suit l'**article 89** : vote du texte en termes identiques par les deux assemblées, puis référendum, ou **Congrès à la majorité des 3/5** s'il s'agit d'un projet du Gouvernement."},
  {p:"**Article 1er** : la France est une République indivisible, laïque, démocratique et sociale, et son organisation est décentralisée (depuis 2003). Devise : Liberté, Égalité, Fraternité. **Article 2** : gouvernement du peuple, par le peuple et pour le peuple."},
  {h:"Hiérarchie des normes, de haut en bas"},
  {ol:[
    "**Bloc de constitutionnalité** : Constitution de 1958, Déclaration des droits de l'homme et du citoyen de 1789, Préambule de 1946, Charte de l'environnement de 2004, principes fondamentaux reconnus par les lois de la République.",
    "**Traités et droit de l'UE** : autorité supérieure aux lois (article 55).",
    "**Lois organiques**, puis lois ordinaires et ordonnances ratifiées.",
    "**Principes généraux du droit**, dégagés par le Conseil d'État.",
    "**Règlements** : décrets, puis arrêtés. Une circulaire n'a de valeur que si elle est impérative."
  ]},
  {p:"**Loi et règlement.** L'article 34 fixe le domaine de la loi, l'article 37 donne tout le reste au règlement. L'article 38 permet au Gouvernement de légiférer par **ordonnances** après une loi d'habilitation."},
  {h:"Les institutions"},
  {tb:{c:["Institution","Composition et mandat","À retenir"], r:[
    ["Président de la République","Élu au suffrage universel direct pour **5 ans** (depuis 2000), **deux mandats consécutifs** au plus (depuis 2008)","Nomme le Premier ministre (art. 8), peut dissoudre l'Assemblée (art. 12), recourir au référendum (art. 11) et aux pouvoirs exceptionnels (art. 16)"],
    ["Gouvernement","Premier ministre et ministres, responsables devant l'Assemblée","Détermine et conduit la politique de la Nation (art. 20) ; engage sa responsabilité sur un texte (**art. 49 al. 3**)"],
    ["Assemblée nationale","**577 députés**, 5 ans, scrutin uninominal majoritaire à deux tours","A le dernier mot ; peut renverser le Gouvernement par une motion de censure"],
    ["Sénat","**348 sénateurs**, 6 ans, renouvelés par moitié tous les 3 ans, suffrage universel indirect","Représente les collectivités territoriales (art. 24) ; ne peut pas être dissous"],
    ["Conseil constitutionnel","**9 membres pour 9 ans** non renouvelables, renouvelés par tiers ; nommés par le Président de la République et les présidents de l'Assemblée et du Sénat","Contrôle a priori (art. 61, saisine par **60 députés ou 60 sénateurs** depuis 1974) ; **QPC** a posteriori (art. 61-1, depuis le 1er mars 2010)"],
    ["Conseil économique, social et environnemental","Représentants de la société civile","Assemblée consultative"]
  ]}},
  {p:"**Autorité judiciaire et juridictions.** Deux ordres de juridictions : l'ordre judiciaire (**Cour de cassation** au sommet) et l'ordre administratif (**Conseil d'État** au sommet). Le **Tribunal des conflits** tranche entre les deux."},
  {p:"**Lois de finances (art. 47).** Le Parlement a **70 jours** pour voter le budget : 40 jours pour l'Assemblée en première lecture, 15 jours pour le Sénat. À défaut, le Gouvernement peut le mettre en œuvre par ordonnance. Les lois de financement de la Sécurité sociale ont **50 jours** (art. 47-1). La Cour des comptes assiste le Parlement et le Gouvernement (art. 47-2)."}
]},

{id:"administration", t:"Organisation administrative et fonction publique", th:["admin"], b:[
  {h:"Trois notions à ne pas confondre"},
  {ul:[
    "**Centralisation** : les décisions sont prises à Paris.",
    "**Déconcentration** : des agents de l'État décident sur le territoire (préfets, directions régionales). C'est toujours l'État qui décide.",
    "**Décentralisation** : des compétences passent à des collectivités élues, dotées de la personnalité morale."
  ]},
  {h:"L'administration de l'État"},
  {ul:[
    "**Administration centrale** : les ministères et leurs directions, par exemple la DGFiP au ministère de l'Économie. Les **services à compétence nationale** ont une mission nationale sans être des directions centrales.",
    "**Administration territoriale** : le préfet de région et le préfet de département représentent chaque ministre (art. 72). La **charte de la déconcentration** (décret du 7 mai 2015) fait de la déconcentration le principe de droit commun. Exemples : DRFiP et DDFiP, directions départementales interministérielles.",
    "**Autorités administratives indépendantes (AAI)** : elles régulent un secteur sans obéir au Gouvernement ; la loi du 20 janvier 2017 en fixe la liste. Exemples : CNIL, Autorité de la concurrence, HATVP, **Défenseur des droits** (seule autorité inscrite dans la Constitution, art. 71-1).",
    "**Autorités publiques indépendantes (API)** : les AAI dotées de la personnalité morale. Exemples : AMF, ARCOM (née en 2022 de la fusion du CSA et de l'Hadopi), Haute Autorité de santé.",
    "**Conseil et contrôle** : le Conseil d'État conseille le Gouvernement sur les projets de loi et de décret ; la Cour des comptes contrôle les comptes publics et certifie ceux de l'État ; les inspections générales (IGF, IGA) contrôlent les services.",
    "**Juridictions administratives** : une quarantaine de tribunaux administratifs, **9 cours administratives d'appel**, et le Conseil d'État comme juge de cassation."
  ]},
  {h:"Réforme de l'État depuis 20 ans, dans l'ordre"},
  {ol:[
    "**RGPP**, révision générale des politiques publiques (2007-2012) : non-remplacement d'un fonctionnaire sur deux partant à la retraite.",
    "**MAP**, modernisation de l'action publique (2012-2017).",
    "**Action publique 2022** (2017) et **loi ESSOC** du 10 août 2018, qui crée le droit à l'erreur pour l'usager de bonne foi.",
    "**Loi de transformation de la fonction publique** du 6 août 2019 : recours accru aux contractuels, rupture conventionnelle.",
    "**Réforme de la haute fonction publique** (2021) : l'INSP remplace l'ENA au 1er janvier 2022.",
    "**Loi 3DS** du 21 février 2022 : différenciation, décentralisation, déconcentration et simplification."
  ]},
  {h:"La fonction publique"},
  {p:"Environ **5,8 millions d'agents** répartis en trois versants : État, territoriale et hospitalière. Le **Code général de la fonction publique** rassemble le statut depuis le 1er mars 2022. Le fonctionnaire est dans une situation **statutaire et réglementaire**, pas contractuelle."},
  {p:"Trois catégories : **A** (conception et encadrement), **B** (application, comme le contrôleur), **C** (exécution)."},
  {tb:{c:["Droits","Obligations"], r:[
    ["Liberté d'opinion et non-discrimination","Neutralité et laïcité dans le service"],
    ["Droit syndical et droit de grève","Impartialité, probité, intégrité, dignité"],
    ["Rémunération après service fait","**Secret professionnel** (informations sur les usagers) et **discrétion professionnelle** (faits connus dans le service)"],
    ["Formation, carrière, mobilité","Obéissance hiérarchique, sauf ordre manifestement illégal et de nature à compromettre gravement un intérêt public"],
    ["**Protection fonctionnelle** contre les attaques liées à ses fonctions","Prévention des conflits d'intérêts, cumul d'activités encadré"]
  ]}},
  {warn:"Le secret professionnel protège les usagers (sanction pénale), la discrétion professionnelle protège l'administration. La DGFiP est particulièrement concernée par le secret fiscal."}
]},

{id:"collectivites", t:"Collectivités territoriales", th:["admin"], b:[
  {h:"Base constitutionnelle"},
  {p:"L'**article 72** énumère les collectivités : communes, départements, régions, collectivités à statut particulier et collectivités d'outre-mer. Elles **s'administrent librement** par des conseils élus : la libre administration est un principe constitutionnel. Le même article pose la subsidiarité, le droit à l'expérimentation et l'**interdiction de toute tutelle** d'une collectivité sur une autre."},
  {p:"L'**article 72-2** garantit l'autonomie financière : les ressources propres doivent être une « part déterminante », et tout transfert de compétence est compensé."},
  {h:"Les étapes de la décentralisation"},
  {ol:[
    "**Acte I, lois Defferre de 1982** : la tutelle a priori est remplacée par un contrôle de légalité a posteriori ; la région devient une collectivité ; l'exécutif départemental passe du préfet au président du conseil.",
    "**Acte II, révision constitutionnelle du 28 mars 2003** : « organisation décentralisée » inscrite à l'article 1er, référendum local, expérimentation.",
    "**Acte III** : loi MAPTAM de 2014 (métropoles) ; loi de 2015 qui fait passer les régions métropolitaines de **22 à 13** au 1er janvier 2016 ; **loi NOTRe** du 7 août 2015, qui supprime la clause générale de compétence des départements et des régions.",
    "**Loi Engagement et proximité** (2019), puis **loi 3DS** (2022)."
  ]},
  {h:"Les trois niveaux"},
  {tb:{c:["Niveau","Nombre","Compétences principales","Assemblée et scrutin"], r:[
    ["Commune","Environ **34 900**","Clause générale de compétence ; écoles maternelles et élémentaires, état civil, voirie communale, action sociale de proximité","Conseil municipal élu pour 6 ans (dernières élections en mars 2026, scrutin de liste paritaire dans toutes les communes) ; le maire est élu par le conseil pour 6 ans"],
    ["Département","**101**","**Action sociale** (RSA, aide à l'enfance, personnes âgées et handicapées), collèges, routes départementales","Conseil départemental, un binôme femme-homme par canton, 6 ans"],
    ["Région","**18**, dont 13 en métropole","Développement économique, transports régionaux, lycées, formation professionnelle, aménagement du territoire","Conseil régional, liste à la proportionnelle avec prime majoritaire, 6 ans"]
  ]}},
  {p:"**Statut particulier** : Ville de Paris (2019), Métropole de Lyon (2015), Collectivité de Corse (2018). La Guyane et la Martinique sont des collectivités uniques."},
  {p:"**Intercommunalité.** Toute commune appartient à un **EPCI à fiscalité propre** (établissement public de coopération intercommunale). Quatre types, du moins au plus intégré : communauté de communes, communauté d'agglomération, communauté urbaine, métropole."},
  {warn:"Un EPCI n'est pas une collectivité territoriale : c'est un établissement public, régi par le principe de spécialité."},
  {h:"Les contrôles"},
  {ul:[
    "**Contrôle de légalité** : le préfet peut déférer un acte au tribunal administratif dans les **2 mois** de sa transmission.",
    "**Contrôle budgétaire** (préfet et chambre régionale des comptes) dans quatre cas : budget non voté avant le **15 avril** (30 avril l'année d'un renouvellement), budget non voté en équilibre réel, déficit excessif du compte administratif, dépense obligatoire non inscrite.",
    "**Équilibre réel** : chaque section est votée en équilibre, les recettes et les dépenses sont évaluées de façon sincère, et le remboursement du capital de la dette est couvert par des ressources propres. **L'emprunt ne finance que l'investissement.**",
    "**Comptes et gestion** : contrôlés par les chambres régionales des comptes.",
    "**Régularité de la dépense** : contrôlée par le comptable public de la DGFiP (séparation de l'ordonnateur et du comptable)."
  ]},
  {p:"**FCTVA.** Le Fonds de compensation pour la TVA rembourse aux collectivités une partie de la TVA payée sur leurs dépenses d'investissement, au taux forfaitaire de **16,404 %**."}
]},

{id:"budget", t:"Budget de l'État, déficit et dette", th:["admin"], b:[
  {p:"La **LOLF** (loi organique relative aux lois de finances du **1er août 2001**, appliquée depuis 2006, réformée le 28 décembre 2021) est la « constitution financière » de l'État. Elle a remplacé l'ordonnance de 1959 et fait passer d'une **logique de moyens à une logique de résultats**."},
  {h:"Les lois de finances"},
  {ul:[
    "**Loi de finances de l'année** (LFI).",
    "**Loi de finances rectificative** (LFR), en cours d'année.",
    "**Loi relative aux résultats de la gestion et portant approbation des comptes** : elle a remplacé la loi de règlement en 2023.",
    "**Loi spéciale** : votée si la LFI n'est pas adoptée à temps, comme en décembre 2024."
  ]},
  {p:"La **loi de programmation des finances publiques** fixe une trajectoire pluriannuelle (article 34 de la Constitution depuis 2008), mais ce n'est pas une loi de finances."},
  {h:"Structure du budget, du plus large au plus fin"},
  {ol:[
    "**Mission** : ensemble de programmes concourant à une politique publique, éventuellement interministérielle. C'est l'**unité de vote**.",
    "**Programme** : crédits d'un même ministère pour une action ou un ensemble cohérent d'actions, avec un responsable, des objectifs et des indicateurs (projet annuel de performance, puis rapport annuel de performance). C'est l'**unité de spécialité** des crédits.",
    "**Action** : découpage indicatif du programme."
  ]},
  {p:"**Fongibilité asymétrique.** À l'intérieur d'un programme, les crédits de personnel (titre 2) peuvent financer d'autres dépenses, mais l'inverse est interdit."},
  {p:"Les dépenses sont réparties en **7 titres** : pouvoirs publics, personnel, fonctionnement, charge de la dette, investissement, intervention, opérations financières. Les **autorisations d'engagement** (AE) limitent les engagements ; les **crédits de paiement** (CP) limitent les paiements de l'année."},
  {h:"Les principes budgétaires"},
  {tb:{c:["Principe","Contenu","Exceptions"], r:[
    ["**Annualité**","L'autorisation vaut pour l'année civile","Autorisations d'engagement pluriannuelles, reports de crédits"],
    ["**Unité**","Toutes les recettes et dépenses dans un document unique","Budgets annexes, comptes spéciaux"],
    ["**Universalité**","Le budget décrit l'ensemble des recettes qui financent l'ensemble des dépenses : pas de compensation, pas d'affectation d'une recette à une dépense","Comptes d'affectation spéciale, fonds de concours, prélèvements sur recettes"],
    ["**Spécialité**","Les crédits sont votés par mission et spécialisés par programme","Virements et transferts encadrés"],
    ["**Sincérité**","Présentation sincère de l'ensemble des ressources et des charges (art. 32 de la LOLF)","Aucune"]
  ]}},
  {h:"Procédure et exécution"},
  {ul:[
    "Le projet de loi de finances est déposé au plus tard le **premier mardi d'octobre** et examiné d'abord par l'Assemblée (art. 39).",
    "La **première partie** (recettes et article d'équilibre) doit être votée avant la **seconde** (dépenses par mission).",
    "En gestion, le Gouvernement peut **annuler** par décret jusqu'à **1,5 %** des crédits, ouvrir des crédits par **décret d'avance** jusqu'à **1 %**, et met en réserve une partie des crédits en début d'année.",
    "L'**ordonnateur** engage et liquide la dépense ; le **comptable public** la paie après contrôle (décret GBCP du 7 novembre 2012)."
  ]},
  {p:"**Ressources de l'État.** La **TVA** est la première recette fiscale, devant l'impôt sur le revenu, l'impôt sur les sociétés et la taxe sur les produits énergétiques. S'y ajoutent des recettes non fiscales (dividendes, amendes) et l'emprunt. Des prélèvements sur recettes vont aux collectivités et à l'UE."},
  {h:"Déficit et dette"},
  {ul:[
    "**Critères de Maastricht**, repris par le Pacte de stabilité et de croissance (1997) : déficit public **≤ 3 % du PIB**, dette publique **≤ 60 % du PIB**. La France fait l'objet d'une **procédure pour déficit excessif** depuis juillet 2024.",
    "La dette au sens de Maastricht est celle de **toutes les administrations publiques** : État, organismes divers d'administration centrale (ODAC), collectivités locales et Sécurité sociale.",
    "Elle atteint **3 595,5 Md€ fin juin 2026, soit 119,0 % du PIB**, dont 2 942 Md€ pour l'État (Insee, 29 septembre 2026).",
    "Le **déficit est un flux** annuel ; la **dette est un stock** qui s'accroît des déficits successifs.",
    "L'**Agence France Trésor** gère la dette de l'État : OAT à moyen et long terme, BTF à moins d'un an.",
    "Le **Haut Conseil des finances publiques** (2012) évalue le réalisme des prévisions ; il est présidé par le Premier président de la Cour des comptes."
  ]},
  {p:"**Contrôle.** Le Parlement contrôle via les commissions des finances ; la Cour des comptes certifie les comptes de l'État. Depuis le **1er janvier 2023**, un **régime unique de responsabilité des gestionnaires publics** remplace l'ancienne responsabilité personnelle et pécuniaire des comptables : la chambre du contentieux de la Cour des comptes sanctionne les fautes graves ayant causé un préjudice financier significatif."}
]},

{id:"ue", t:"Union européenne", th:["ue"], b:[
  {note:"C'est le thème le moins réussi en 2026 (50 % de bonnes réponses) : c'est lui qui rapporte le plus à réviser."},
  {h:"Les grandes étapes"},
  {tb:{c:["Date","Traité ou étape","Apport"], r:[
    ["9 mai 1950","**Déclaration Schuman**","Projet de mise en commun du charbon et de l'acier"],
    ["1951","**Traité de Paris**","CECA à 6 : France, RFA, Italie, Belgique, Pays-Bas, Luxembourg"],
    ["25 mars 1957","**Traités de Rome**","CEE (marché commun) et Euratom"],
    ["1986","**Acte unique européen**","Marché intérieur au 1er janvier 1993"],
    ["7 février 1992","**Traité de Maastricht**","Création de l'UE, citoyenneté européenne, union économique et monétaire, critères de convergence"],
    ["1997 et 2001","**Traités d'Amsterdam et de Nice**","Préparation de l'élargissement à l'Est"],
    ["2005","**Échec de la Constitution européenne**","Non français (29 mai) et néerlandais"],
    ["13 décembre 2007","**Traité de Lisbonne**, en vigueur le 1er décembre 2009","Président stable du Conseil européen, Haut représentant, Charte des droits fondamentaux contraignante, clause de retrait (art. 50 TUE), initiative citoyenne"]
  ]}},
  {p:"**Élargissements** : 1973 (Royaume-Uni, Irlande, Danemark), 1981 (Grèce), 1986 (Espagne, Portugal), 1995 (Autriche, Finlande, Suède), 2004 (dix pays d'Europe centrale et méditerranéenne), 2007 (Bulgarie, Roumanie), 2013 (Croatie). Le Royaume-Uni est sorti le **31 janvier 2020** : l'UE compte **27 États**."},
  {p:"**Zone euro** : **21 membres** depuis l'entrée de la Bulgarie le 1er janvier 2026. L'euro existe depuis 1999, en pièces et billets depuis 2002."},
  {p:"**Adhésion et retrait.** L'adhésion suit l'**article 49 TUE** et les **critères de Copenhague** (1993) : institutions démocratiques, État de droit, droits de l'homme et protection des minorités, économie de marché viable, reprise de l'acquis. Le Conseil décide à l'unanimité après approbation du Parlement. L'adoption de l'euro n'est pas une condition d'adhésion. Le retrait suit l'**article 50 TUE**."},
  {h:"Les institutions (titulaires au 16 octobre 2026)"},
  {tb:{c:["Institution","Siège","Composition","Rôle","Titulaire"], r:[
    ["**Parlement européen**","Strasbourg","**720 députés** élus pour 5 ans (81 pour la France, dernière élection en juin 2024)","Co-législateur, vote le budget avec le Conseil, approuve le cadre financier pluriannuel, élit le président de la Commission","Roberta Metsola, élue en 2022, réélue en 2024"],
    ["**Conseil européen**","Bruxelles","Chefs d'État ou de gouvernement","Fixe les grandes orientations, **ne légifère pas**","António Costa, président depuis décembre 2024 (mandat de 2 ans et demi)"],
    ["**Conseil de l'UE**","Bruxelles","Un ministre par État selon le sujet ; présidence tournante de 6 mois","Co-législateur ; vote à la **majorité qualifiée** (55 % des États représentant 65 % de la population)","Irlande jusqu'au 31 décembre 2026, puis Lituanie et Grèce en 2027"],
    ["**Commission européenne**","Bruxelles","27 commissaires, un par État, 5 ans","**Monopole de l'initiative législative**, exécution du budget, gardienne des traités","Ursula von der Leyen, second mandat depuis décembre 2024"],
    ["**Cour de justice de l'UE**","Luxembourg","Cour de justice et Tribunal","Interprète le droit de l'UE (renvoi préjudiciel), juge les manquements des États",""],
    ["**Banque centrale européenne**","Francfort","Directoire et gouverneurs des banques centrales de la zone euro","Politique monétaire, stabilité des prix (objectif de 2 %)","Christine Lagarde, mandat jusqu'à octobre 2027"],
    ["**Cour des comptes européenne**","Luxembourg","Un membre par État","Contrôle les finances de l'UE",""]
  ]}},
  {warn:"Trois « Conseils » à ne pas confondre : le Conseil européen (chefs d'État), le Conseil de l'UE (ministres) et le Conseil de l'Europe, organisation distincte de 46 États à Strasbourg, gardienne de la Convention européenne des droits de l'homme (1950) appliquée par la Cour européenne des droits de l'homme."},
  {h:"Actes juridiques"},
  {ul:[
    "**Règlement** : obligatoire dans tous ses éléments et directement applicable dans tous les États.",
    "**Directive** : fixe un résultat que chaque État atteint par une transposition.",
    "**Décision** : vise des destinataires désignés.",
    "**Recommandations et avis** : ne lient pas."
  ]},
  {p:"En **procédure législative ordinaire**, la Commission propose, le Parlement et le Conseil adoptent. Les parlements nationaux contrôlent le respect de la subsidiarité."},
  {h:"Budget"},
  {p:"Le **cadre financier pluriannuel 2021-2027** prévoit environ **1 211 Md€**, plus le plan de relance **NextGenerationEU** (environ 807 Md€), en prix courants. Il est adopté par le Conseil **à l'unanimité** après approbation du Parlement. Le budget est **en équilibre**, sans déficit."},
  {p:"**Ressources propres** : droits de douane, ressource TVA, contribution sur les emballages plastiques non recyclés et, surtout, **ressource fondée sur le revenu national brut**. L'Allemagne est le premier contributeur, la France le deuxième. La négociation du cadre 2028-2034 est en cours."},
  {h:"Politiques"},
  {ul:[
    "Le **marché unique** repose sur **quatre libertés** : circulation des biens, des personnes, des services et des capitaux.",
    "La **PAC** (1962) reste le premier poste du budget avec la **cohésion** (FEDER, FSE+, Fonds de cohésion).",
    "La politique commerciale commune et la politique monétaire de la zone euro sont des **compétences exclusives**.",
    "La **PESC** se décide à l'unanimité.",
    "En fiscalité, la directive **« Pilier 2 »** applique depuis 2024 l'impôt minimum mondial de **15 %** sur les grands groupes, issu de l'OCDE."
  ]},
  {p:"**Droits fondamentaux.** L'**article 2 TUE** pose les valeurs de l'Union (dignité, liberté, démocratie, égalité, État de droit, droits de l'homme). L'**article 7** permet de suspendre les droits d'un État qui les viole gravement. La **Charte des droits fondamentaux**, proclamée à Nice en 2000, a la même valeur que les traités depuis 2009 ; la CJUE en assure le respect."}
]},

{id:"numerique", t:"Culture numérique", th:["num"], b:[
  {p:"Les questions portent surtout sur du vocabulaire et du bon sens. Retiens les définitions ci-dessous et les deux textes clés : le **RGPD** et la **loi Informatique et libertés**."},
  {h:"Vocabulaire"},
  {tb:{c:["Notion","Définition courte"], r:[
    ["**Pare-feu**","Filtre et sécurise les connexions réseau entrantes et sortantes (il ne supprime pas les virus)"],
    ["**Antivirus**","Détecte et supprime les logiciels malveillants"],
    ["**VPN**","Réseau privé virtuel : tunnel chiffré entre l'appareil et un serveur"],
    ["**HTTPS**","Version sécurisée (chiffrée) de HTTP, signalée par un cadenas"],
    ["**Hameçonnage** (phishing)","Message frauduleux imitant un organisme pour voler des identifiants"],
    ["**Rançongiciel**","Logiciel qui chiffre les données et exige une rançon"],
    ["**Authentification à deux facteurs**","Mot de passe plus un second élément (code, application, empreinte)"],
    ["**Mémoire vive** (RAM)","Mémoire temporaire, effacée à l'extinction ; le disque dur ou SSD stocke durablement"],
    ["**Cloud**","Ressources informatiques accessibles à distance par Internet (logiciel, plateforme ou infrastructure « en tant que service »)"],
    ["**Big data**","Volumes massifs de données, variées et produites vite"],
    ["**Exploration de données** (data mining)","Analyse de grands ensembles de données pour en tirer des tendances"],
    ["**Open data**","Données publiques ou privées librement accessibles et réutilisables ; pas les données personnelles ni celles protégées par le droit d'auteur"],
    ["**Blockchain**","Registre décentralisé et sécurisé qui enregistre des transactions sans tiers de confiance"],
    ["**Flux RSS**","Diffusion automatique des nouveaux contenus d'un site"],
    ["**Cookie**","Petit fichier déposé par un site ; les cookies non essentiels exigent le consentement"],
    ["**Intelligence artificielle**","Systèmes qui produisent des contenus, prédictions ou décisions à partir de données ; l'**AI Act** européen (2024) les encadre selon leur niveau de risque"],
    ["**Illectronisme**","Difficulté ou incapacité à utiliser les outils numériques par manque de connaissances (environ un Français sur six)"],
    ["**Droit à la déconnexion**","Droit du salarié de ne pas se connecter aux outils professionnels hors du temps de travail (loi de 2016)"]
  ]}},
  {h:"RGPD"},
  {p:"Règlement européen applicable depuis le **25 mai 2018**, directement, sans transposition."},
  {ul:[
    "**Principes** : licéité, finalité déterminée, minimisation des données, exactitude, durée de conservation limitée, sécurité, responsabilité du responsable de traitement.",
    "**Droits des personnes** : accès, rectification, effacement (droit à l'oubli), opposition, limitation, portabilité.",
    "Une violation de données se notifie à la CNIL sous **72 heures**.",
    "Sanctions jusqu'à **20 M€ ou 4 % du chiffre d'affaires mondial**.",
    "Les organismes publics doivent désigner un **délégué à la protection des données** (DPO)."
  ]},
  {p:"**Loi Informatique et libertés du 6 janvier 1978.** Elle encadre l'utilisation des données personnelles et a créé la **CNIL**, autorité administrative indépendante."},
  {h:"Administration numérique"},
  {ul:[
    "**Loi pour une République numérique** du 7 octobre 2016 : ouverture des données publiques par défaut (data.gouv.fr).",
    "**Dématérialisation** : FranceConnect (identification unique), principe « Dites-le-nous une fois », droit de saisir l'administration par voie électronique.",
    "**À la DGFiP** : prélèvement à la source (2019), déclaration automatique, facturation électronique entre entreprises.",
    "**Facturation électronique** : depuis le **1er septembre 2026**, toutes les entreprises doivent pouvoir recevoir des factures électroniques, et les grandes entreprises et ETI doivent en émettre ; les PME et microentreprises émettront à partir du **1er septembre 2027**.",
    "**Sécurité** : l'ANSSI protège les systèmes de l'État ; cybermalveillance.gouv.fr assiste les victimes."
  ]},
  {p:"**Numérique responsable** : l'essentiel de l'empreinte carbone du numérique en France vient de la **fabrication des équipements** (smartphones, ordinateurs, écrans), devant les centres de données et les réseaux."}
]},

{id:"logique-anglais", t:"Raisonnement logique et anglais", th:["log","ang"], b:[
  {h:"Logique : les sept types de questions de 2026"},
  {tb:{c:["Type","Méthode","Exemple 2026"], r:[
    ["**Suite de nombres ou de lettres**","Calcule les écarts entre termes, puis les écarts des écarts ; teste carrés, cubes, alternances ±","A1, C4, E9, G16 : une lettre sur deux et les carrés 1, 4, 9, 16, donc **I25**"],
    ["**Codage** (prix par lettre)","Soustrais deux mots qui ne diffèrent que d'une ou deux lettres","MARCO − MARC donne O = 9 ; MARCEL − MARC donne E + L = 22 ; SUPINS − PUSSI donne N = 10 ; donc **NOËL = 41 €**"],
    ["**Calendrier**","Travaille modulo 7","Lundi + 45 jours : 45 = 6 × 7 + 3, donc **jeudi**"],
    ["**Probabilité simple**","Cas favorables sur cas possibles","3 boules vertes sur 15 : **20 %**"],
    ["**Liens de parenté**","Dessine l'arbre","Marie est la sœur de Jean, donc de Paul, fils de Louise, mère de Marc : **Marie est la sœur de Marc**"],
    ["**Suite de mots**","Cherche la lettre doublée, l'ordre alphabétique, le nombre de lettres","CANARD (A deux fois), BIBELOT (B), CHACAL (C), DEMANDER (D)… puis **HACHOIR** (H deux fois)"],
    ["**Tableau ou figures**","Cherche une symétrie, une rotation, une opération constante","Colonnes à écart +2 et −2, symétriques autour du centre"]
  ]}},
  {p:"Compte environ **2 minutes par question**. Si une figure te bloque, passe et reviens-y à la fin."},
  {h:"Anglais (niveau B1) : les pièges fréquents"},
  {ul:[
    "**Prépositions de temps** : at 8 o'clock, on Monday, in July, for lunch (repas) ; **since 2020** (point de départ) mais **for three years** (durée).",
    "**Stop doing / stop to do** : he stopped smoking (il a arrêté de fumer) ; he stopped to smoke (il s'est arrêté pour fumer). Action en cours interrompue : Paul was driving when he stopped.",
    "**Prétérit et present perfect** : I lived in Lyon in 2020 (date passée) ; I have lived here for ten years (dure encore).",
    "**Faux amis** : customs = douane ; cellar = cave (sous-sol) mais cave = grotte ; storeroom = cellier ; actually = en fait ; eventually = finalement ; library = bibliothèque ; to attend = assister à.",
    "**Synonymes courants** : obvious = clear ; to improve = to enhance ; to increase = to rise ; to reduce = to cut ; quickly = rapidly."
  ]},
  {h:"Vocabulaire des finances publiques"},
  {tb:{c:["Anglais","Français"], r:[
    ["tax return","déclaration de revenus"],
    ["income tax","impôt sur le revenu"],
    ["VAT","TVA"],
    ["tax audit","contrôle fiscal"],
    ["public debt","dette publique"],
    ["budget deficit","déficit"],
    ["revenue","recettes ou chiffre d'affaires"],
    ["balance sheet","bilan"],
    ["income statement","compte de résultat"],
    ["assets / liabilities / equity","actif / dettes / capitaux propres"],
    ["depreciation","amortissement"],
    ["shareholder","actionnaire"]
  ]}}
]},

{id:"actualite", t:"Actualité à connaître", th:["admin","ue"], b:[
  {p:"Le QCM 2026 posait des questions datées (présidence du Conseil de l'UE au 1er juillet 2025, présidente du Parlement européen). Voici les faits vérifiés au **16 octobre 2026** ; mets-les à jour d'ici décembre."},
  {tb:{c:["Sujet","Fait clé","Source"], r:[
    ["**Budget 2027**","PLF et PLFSS présentés en Conseil des ministres le 1er octobre 2026 : déficit visé de **5,0 % du PIB en 2027**, contre 5,4 % prévu en 2026 ; effort de 54 Md€, dont 43 Md€ de mesures nouvelles ; croissance prévue de 1,0 %","Compte rendu du Conseil des ministres"],
    ["**Gouvernement**","Premier ministre : **Sébastien Lecornu**. Économie et Finances : **Roland Lescure**. Action et Comptes publics : **David Amiel**","Compte rendu du Conseil des ministres"],
    ["**Dette publique**","**3 595,5 Md€** fin juin 2026, soit **119,0 % du PIB**","Insee"],
    ["**Présidence du Conseil de l'UE**","**Irlande** jusqu'au 31 décembre 2026, **Lituanie** au 1er semestre 2027, **Grèce** au 2nd","Conseil de l'UE"],
    ["**Zone euro**","**21 membres** depuis l'entrée de la Bulgarie le 1er janvier 2026","Banque de France"],
    ["**Facturation électronique**","Réception obligatoire pour toutes les entreprises depuis le 1er septembre 2026",""],
    ["**Élections**","Municipales en mars 2026 ; présidentielle les **18 avril et 2 mai 2027**, à la fin du second mandat d'Emmanuel Macron","info.gouv.fr"]
  ]}},
  {h:"Nominations récentes"},
  {ul:[
    "**Amélie de Montchalin** est Première présidente de la Cour des comptes depuis le **23 février 2026**, à la suite de Pierre Moscovici ; elle préside donc aussi le Haut Conseil des finances publiques.",
    "**Gérard Larcher** a été réélu président du Sénat le **1er octobre 2026**, avec 203 voix (compte rendu du Sénat).",
    "**François-Noël Buffet** est Défenseur des droits depuis le **23 juillet 2026**, à la suite de Claire Hédon.",
    "**Richard Ferrand** préside le Conseil constitutionnel depuis le **8 mars 2025**, à la suite de Laurent Fabius."
  ]},
  {p:"D'ici le 7 décembre, suis l'avancement du vote du budget 2027."}
]},

{id:"controleur", t:"Français, maths et histoire-géo", th:["fr","math","hg"], ctrl:true, b:[
  {p:"Ces thèmes ne sont qu'au QCM du **contrôleur**. Pour le reste (institutions, UE, numérique), les fiches de l'inspecteur suffisent."},
  {h:"Français"},
  {ul:[
    "**Participe passé avec avoir** : il s'accorde avec le COD seulement si celui-ci est placé avant (« les lettres qu'il a écrites », mais « il a écrit des lettres »). **Avec être**, il s'accorde avec le sujet.",
    "**Nombres** : vingt et cent prennent un s s'ils sont multipliés et non suivis d'un autre nombre (deux cents, mais deux cent trois) ; mille est invariable.",
    "**Homophones** : a / à, ou / où, ce / se, ces / ses, quel / qu'elle, leur / leurs, censé / sensé.",
    "**Fonctions** : un complément circonstanciel (de temps, de lieu, de cause) peut être déplacé ou supprimé ; un COD répond à « quoi ? » après le verbe.",
    "**Vocabulaire administratif** : déontologie, éthique, probité, prolixe, prolifique, chimère, éphémère, pérenne."
  ]},
  {h:"Mathématiques"},
  {ul:[
    "**Pourcentages** : une hausse de t % multiplie par (1 + t), une baisse par (1 − t) ; deux variations successives se multiplient.",
    "**Vitesse** = distance / temps ; convertis les minutes en fractions d'heure (36 min = 0,6 h).",
    "**Échelle 1/n** : taille réelle divisée par n, puis conversion d'unités.",
    "**PGCD et PPCM** par décomposition en facteurs premiers ; divisibilité par 3 et par 9 : somme des chiffres.",
    "**Intérêts simples** = capital × taux × durée ; **médiane** = valeur centrale d'une série classée.",
    "**Équations** du premier degré et systèmes de deux équations à deux inconnues."
  ]},
  {h:"Histoire : repères"},
  {tb:{c:["Date","Événement"], r:[
    ["1515","Marignan, début du règne de François Ier"],
    ["1539","Ordonnance de Villers-Cotterêts : le français dans les actes officiels"],
    ["1598","Édit de Nantes"],
    ["1643-1715","Règne de Louis XIV"],
    ["1789","Révolution, Déclaration des droits de l'homme et du citoyen"],
    ["1804","Napoléon empereur, Code civil"],
    ["1848","IIe République, suffrage universel masculin, Louis-Napoléon président"],
    ["1870-1940","IIIe République"],
    ["1905","Loi de séparation des Églises et de l'État"],
    ["1944","Droit de vote des femmes"],
    ["1946 et 1958","IVe puis Ve République"]
  ]}},
  {h:"Géographie"},
  {p:"**13 régions métropolitaines** depuis 2016, **101 départements**, 5 grands fleuves (la Loire, la plus longue, la Seine, le Rhône, la Garonne, le Rhin), point culminant au **mont Blanc**."}
]}
];
