/* ===== Investissements (coût d'entrée, titres), synthèse de l'inventaire, documents de synthèse ===== */
(function () {
  var PC = {
    '205': 'Concessions, brevets, licences, logiciels', '2135': 'Installations générales, agencements, aménagements des constructions',
    '21541': 'Matériel industriel – structure', '21542': 'Matériel industriel – composant',
    '261': 'Titres de participation', '271': 'Titres immobilisés (droit de propriété)', '273': 'Titres immobilisés de l’activité de portefeuille', '503': 'Actions (valeurs mobilières de placement)',
    '2961': 'Dépréciations des titres de participation', '2971': 'Dépréciations des titres immobilisés', '2973': 'Dépréciations des TIAP', '590': 'Dépréciations des valeurs mobilières de placement',
    '6866': 'Dotations aux dépréciations des éléments financiers', '7866': 'Reprises sur dépréciations des éléments financiers',
    '767': 'Produits nets sur cessions de valeurs mobilières de placement', '667': 'Charges nettes sur cessions de valeurs mobilières de placement',
    '6271': 'Frais sur titres (achat, vente, garde)', '6156': 'Maintenance', '6222': 'Commissions et courtages', '6228': 'Rémunérations d’intermédiaires – divers',
    '6354': 'Droits d’enregistrement et de timbre', '6351': 'Impôts directs (CET, taxe foncière)', '641': 'Rémunérations du personnel', '645': 'Charges de sécurité sociale et de prévoyance',
    '164': 'Emprunts auprès des établissements de crédit', '2154': 'Matériel industriel', '28183': 'Amortissements du matériel de bureau et informatique',
    '764': 'Revenus des valeurs mobilières de placement', '678': 'Autres charges exceptionnelles', '778': 'Autres produits exceptionnels',
    '431': 'Sécurité sociale', '421': 'Personnel – rémunérations dues', '6037': 'Variation des stocks de marchandises'
  };
  Object.keys(PC).forEach(function (k) { if (!U.PCG[k]) U.PCG[k] = PC[k]; });
  var AL = {
    '205': ['2051', '20'], '2135': ['213', '2131'], '21541': ['2154'], '21542': ['2154'],
    '261': ['2611', '26'], '271': ['2711', '27'], '273': ['2731', '27'], '503': ['50', '508'],
    '2961': ['296', '29'], '2971': ['297', '29'], '2973': ['297', '29'], '590': ['59', '5903'],
    '6866': ['686'], '7866': ['786'], '767': ['7671', '764'], '667': ['6671'], '6271': ['627'],
    '6156': ['615', '6152'], '6222': ['622', '6226', '6228'], '6228': ['622', '618', '6181', '6185', '6333', '6226'],
    '6354': ['635', '6358', '63541'], '678': ['671', '6788', '6712'], '778': ['771', '7788', '7718']
  };
  Object.keys(AL).forEach(function (k) { if (!U.ALT[k]) U.ALT[k] = AL[k]; });

  function liste(a) { return '<ol>' + a.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>'; }
  function sgn(x) { return (x > 0 ? '+ ' : x < 0 ? '− ' : '') + U.e(Math.abs(x)); }

  /* ---------- Acquisition d'immobilisation : coût d'entrée ---------- */
  var COMPTES_BIEN = ['205 Concessions, brevets, licences, logiciels', '211 Terrains', '213 Constructions', '2154 Matériel industriel', '2182 Matériel de transport', '6063 Fournitures d’entretien et petit équipement (charge)'];
  T.immo_acq = {
    id: 'immo_acq', nom: 'Acquisition d’immobilisation : coût d’entrée', famille: 'Immobilisations', ctrl: true, minutes: 15,
    fiche: {
      objectif: 'Distinguer immobilisation et charge, classer le bien dans le plan de comptes et calculer son coût d’entrée (base amortissable), éventuellement par composants.',
      cours: [
        { t: 'Définition d’un actif et d’une immobilisation', l: [
          'Actif : élément identifiable du patrimoine, ayant une valeur économique positive pour l’entité, qui en attend des avantages économiques futurs et qu’elle contrôle ; son coût ou sa valeur doit pouvoir être évalué avec une fiabilité suffisante.',
          'Immobilisation : actif destiné à servir de façon durable (plus d’un exercice) à l’activité de l’entreprise ; sinon c’est un actif circulant (stocks, créances, trésorerie).',
          'Biens de faible valeur : tolérance administrative, le petit matériel et l’outillage dont la valeur unitaire n’excède pas 500 € HT peuvent être passés en charges (6063).',
          'Propriété juridique : un bien pris en crédit-bail ou en location n’est pas immobilisé chez le preneur dans les comptes individuels (loyers en charges).'
        ] },
        { t: 'Typologie (classe 2)', l: [
          'Incorporelles (20) : fonds commercial, brevets, licences, logiciels (205), frais de développement.',
          'Corporelles (21) : terrains (211, non amortissables), constructions (213), installations techniques, matériel et outillage (215), autres (218 : transport, bureau, informatique, mobilier).',
          'En cours (23) : immobilisations non terminées à la clôture ; avances et acomptes versés sur commandes d’immobilisations (238).',
          'Financières (26, 27) : titres de participation, autres titres immobilisés, TIAP, prêts, dépôts et cautionnements.'
        ] },
        { t: 'Coût d’entrée', l: [
          'Coût d’acquisition : prix d’achat net des remises, rabais commerciaux et escomptes de règlement + droits de douane et taxes non récupérables + coûts directement attribuables à la mise en état d’utilisation (transport, installation, montage, essais de bon fonctionnement, honoraires d’architecte).',
          'Coûts exclus : formation du personnel, frais administratifs généraux, coûts de démarrage et pertes opérationnelles initiales, publicité, maintenance : ce sont des charges.',
          'Frais d’acquisition (droits de mutation, honoraires, commissions, frais d’actes) : option entre incorporation au coût et comptabilisation en charges ; l’option est globale (toutes les immobilisations).',
          'Prix global (immeuble) : ventiler entre le terrain (non amortissable) et la construction.',
          'Production immobilisée : coût de production, D 2x / C 72 (production immobilisée).',
          'TVA : déductible sur les immobilisations (44562) et sur les charges (44566) ; non récupérable (véhicule de tourisme), elle s’ajoute au coût.'
        ] },
        { t: 'Approche par composants et dépenses ultérieures', l: [
          'Composant : élément principal d’une immobilisation corporelle dont la durée d’utilisation diffère de celle de la structure ; il est comptabilisé et amorti séparément.',
          'Dépenses de gros entretien ou de grandes révisions : composant ou provision pour gros entretien.',
          'Dépenses ultérieures : entretien et réparations courantes en charges ; remplacement d’un composant ou dépense qui augmente la performance = immobilisation (sortie de l’ancien composant).'
        ] }
      ],
      etapes: [
        'Pour chaque dépense de la facture, demander : est-elle nécessaire pour mettre le bien en état de fonctionner ? Oui → coût d’entrée ; non → charge.',
        'Partir du prix catalogue, déduire remise puis escompte de règlement : on obtient le prix d’achat net.',
        'Ajouter les frais accessoires directement attribuables (transport, installation, essais) et, si l’entreprise a choisi l’incorporation, les frais d’acquisition.',
        'Ventiler le coût entre terrain et construction, ou entre structure et composants, quand l’énoncé le demande.',
        'Calculer la TVA : 44562 pour la part immobilisée, 44566 pour les charges ; les droits de mutation ne supportent pas de TVA.',
        'Écriture : D 2x (coût HT) + D 6x (charges) + D 44562 / 44566 / C 404 (ou 512 si paiement comptant).'
      ],
      pieges: [
        'Inclure la formation du personnel ou la maintenance dans le coût de l’immobilisation.',
        'Oublier de déduire l’escompte de règlement : pour une immobilisation, il réduit le coût d’entrée (pas de compte 765).',
        'Amortir le terrain : seule la construction est amortissable.',
        'Créditer 401 au lieu de 404 : la dette envers un fournisseur d’immobilisation est hors exploitation.',
        'Appliquer de la TVA aux droits de mutation (droits d’enregistrement).'
      ],
      comptes: ['205 Logiciels', '211 Terrains', '213 Constructions', '2135 Installations générales', '2154 Matériel industriel', '2182 Matériel de transport', '44562 TVA sur immobilisations', '44566 TVA sur autres biens et services', '404 Fournisseurs d’immobilisations', '6354 Droits d’enregistrement', '6226 Honoraires']
    },
    gen: function (r) {
      var k = r.pick(['machine', 'machine', 'vehicule', 'logiciel', 'immeuble', 'immeuble']);
      var p = { nom: U.nom(r), k: k, d: { d: r.int(2, 28), m: r.int(1, 11) }, remise: 0, esc: 0, fa: r.chance(0.5) ? 'incl' : 'charges', frais: [], comp: 0 };
      var f = function (lib, mt, cat, compte, tva) { if (mt > 0) p.frais.push({ lib: lib, mt: mt, cat: cat, compte: compte || '', tva: tva === undefined ? true : tva }); };
      if (k === 'machine') {
        p.bien = r.pick(['une presse hydraulique', 'une machine de découpe laser', 'un four industriel', 'une ligne de conditionnement']);
        p.prix = r.int(20, 300) * 1000;
        p.remise = r.pick([0, 0.05, 0.1]); p.esc = r.chance(0.4) ? r.pick([0.01, 0.02]) : 0;
        f('Transport et livraison', U.r0(p.prix * r.int(1, 4) / 100 / 10) * 10, 'incl');
        f('Installation et montage', U.r0(p.prix * r.int(2, 8) / 100 / 10) * 10, 'incl');
        if (r.chance(0.5)) f('Essais de mise en service', U.r0(p.prix * r.int(1, 3) / 100 / 10) * 10, 'incl');
        if (r.chance(0.7)) f('Formation des opérateurs', U.r0(p.prix * r.int(1, 3) / 100 / 10) * 10, 'charge', '6228');
        if (r.chance(0.5)) f('Contrat de maintenance pour la première année', U.r0(p.prix * r.int(1, 4) / 100 / 10) * 10, 'charge', '6156');
        if (r.chance(0.4)) f('Commission versée à l’intermédiaire', U.r0(p.prix * r.int(1, 3) / 100 / 10) * 10, 'fa', '6222');
        if (r.chance(0.45)) p.comp = { lib: r.pick(['l’outillage de coupe, remplacé tous les 3 ans', 'le moteur principal, remplacé tous les 5 ans', 'le système de commande numérique, remplacé tous les 4 ans']), pct: r.pick([0.1, 0.15, 0.2, 0.25]) };
      } else if (k === 'vehicule') {
        p.bien = r.pick(['un camion de livraison', 'une fourgonnette utilitaire', 'un véhicule utilitaire frigorifique']);
        p.prix = r.int(25, 90) * 1000;
        p.remise = r.pick([0, 0.03, 0.05, 0.08]);
        f('Frais de livraison', r.int(3, 12) * 50, 'incl');
        if (r.chance(0.6)) f('Aménagement intérieur (rayonnages)', r.int(10, 60) * 50, 'incl');
        f('Certificat d’immatriculation (carte grise)', r.int(4, 16) * 50, 'fa', '6354', false);
        if (r.chance(0.6)) f('Premier plein de carburant', r.int(8, 20) * 10, 'charge', '6061');
        if (r.chance(0.4)) f('Contrat d’entretien annuel', r.int(4, 16) * 50, 'charge', '6156');
      } else if (k === 'logiciel') {
        p.bien = r.pick(['un progiciel de gestion intégré (licence perpétuelle)', 'un logiciel de conception assistée par ordinateur (licence perpétuelle)']);
        p.prix = r.int(10, 120) * 1000;
        p.remise = r.pick([0, 0.05, 0.1]); p.esc = r.chance(0.3) ? 0.01 : 0;
        f('Paramétrage et installation', U.r0(p.prix * r.int(10, 30) / 100 / 10) * 10, 'incl');
        if (r.chance(0.5)) f('Tests de bon fonctionnement', U.r0(p.prix * r.int(2, 6) / 100 / 10) * 10, 'incl');
        f('Formation des utilisateurs', U.r0(p.prix * r.int(3, 10) / 100 / 10) * 10, 'charge', '6228');
        if (r.chance(0.6)) f('Maintenance et assistance de la première année', U.r0(p.prix * r.int(8, 18) / 100 / 10) * 10, 'charge', '6156');
      } else {
        p.bien = r.pick(['un entrepôt', 'un immeuble de bureaux', 'un atelier']);
        p.prix = r.int(20, 150) * 10000;
        p.ter = r.pick([0.15, 0.2, 0.25, 0.3]);
        f('Droits de mutation', U.r0(p.prix * 0.058 / 10) * 10, 'fa', '6354', false);
        f('Honoraires du notaire', U.r0(p.prix * r.int(8, 12) / 1000 / 10) * 10, 'fa', '6226');
        if (r.chance(0.6)) f('Commission de l’agence immobilière', U.r0(p.prix * r.int(3, 5) / 100 / 100) * 100, 'fa', '6222');
        if (r.chance(0.5)) p.comp = { lib: 'les installations techniques (chauffage, climatisation, ascenseur), dont la durée d’utilisation est plus courte', pct: r.pick([0.1, 0.15, 0.2]) };
      }
      return p;
    },
    calc: function (p) {
      var x = {}, imm = p.k === 'immeuble';
      x.rem = U.r2(p.prix * p.remise); x.netCo = U.r2(p.prix - x.rem);
      x.esc = U.r2(x.netCo * p.esc); x.net = U.r2(x.netCo - x.esc);
      x.inclF = 0; x.faIncl = 0; x.ch = {}; x.chTot = 0; x.tvaI = imm ? 0 : U.r2(x.net * 0.2); x.tvaC = 0;
      p.frais.forEach(function (f) {
        var tv = f.tva ? U.r2(f.mt * 0.2) : 0;
        var inc = f.cat === 'incl' || (f.cat === 'fa' && p.fa === 'incl');
        if (inc) { if (f.cat === 'fa') x.faIncl = U.r2(x.faIncl + f.mt); else x.inclF = U.r2(x.inclF + f.mt); x.tvaI = U.r2(x.tvaI + tv); }
        else { x.ch[f.compte] = U.r2((x.ch[f.compte] || 0) + f.mt); x.chTot = U.r2(x.chTot + f.mt); x.tvaC = U.r2(x.tvaC + tv); }
      });
      x.cout = U.r2(x.net + x.inclF + x.faIncl);
      x.lignes = [];
      if (imm) {
        x.terrain = U.r2(x.cout * p.ter); x.constr = U.r2(x.cout - x.terrain);
        x.comp = p.comp ? U.r2(x.constr * p.comp.pct) : 0; x.struct = U.r2(x.constr - x.comp);
        x.lignes.push(['211', x.terrain], ['213', x.struct]); if (x.comp) x.lignes.push(['2135', x.comp]);
        x.compte = 2;
      } else if (p.k === 'machine') {
        x.comp = p.comp ? U.r2(x.cout * p.comp.pct) : 0; x.struct = U.r2(x.cout - x.comp);
        if (x.comp) x.lignes.push(['21541', x.struct], ['21542', x.comp]); else x.lignes.push(['2154', x.cout]);
        x.compte = 3;
      } else if (p.k === 'vehicule') { x.lignes.push(['2182', x.cout]); x.compte = 4; }
      else { x.lignes.push(['205', x.cout]); x.compte = 0; }
      x.tva = U.r2(x.tvaI + x.tvaC);
      x.ttc = U.r2(x.cout + x.chTot + x.tva);
      return x;
    },
    solve: function (p) {
      var x = this.calc(p), e = U.e, n = U.n, L = U.L, imm = p.k === 'immeuble', dA = U.dt(p.d.d, p.d.m);
      var tiers = p.esc ? '512' : '404';
      var en = '<p>Le ' + dA + ', la société <b>' + p.nom + '</b> acquiert ' + p.bien + '. ' + (imm ? 'Le prix global de ' + e(p.prix) + ' (immeuble achevé depuis plus de cinq ans, cession exonérée de TVA) comprend le terrain, estimé à ' + U.pcs(p.ter) + ' de la valeur de l’ensemble.' : 'La facture du fournisseur comporte les éléments suivants (montants hors taxes, TVA 20 %) :') + '</p>';
      var rows = [];
      if (!imm) {
        rows.push(['Prix catalogue', e(p.prix)]);
        if (p.remise) rows.push(['Remise', U.pcs(p.remise)]);
        if (p.esc) rows.push(['Escompte de règlement (paiement comptant)', U.pcs(p.esc) + ' du net commercial']);
      }
      p.frais.forEach(function (f) { rows.push([f.lib + (f.tva ? '' : ' (non soumis à TVA)'), e(f.mt)]); });
      en += U.kv(rows);
      var info = [];
      info.push(p.fa === 'incl' ? 'La société a opté pour l’incorporation des frais d’acquisition au coût des immobilisations.' : 'La société comptabilise les frais d’acquisition des immobilisations en charges.');
      if (p.comp) info.push('L’expert estime que ' + p.comp.lib + (imm ? ', représentent ' : ', représente ') + U.pcs(p.comp.pct) + ' du coût ' + (imm ? 'de la construction' : 'de la machine') + ' : ' + (imm ? 'elles constituent' : 'il constitue') + ' un composant distinct.');
      info.push(p.esc ? 'Le règlement est effectué comptant par virement.' : (imm ? 'Le prix et les frais seront réglés au notaire dans un mois.' : 'Le paiement interviendra à 30 jours.'));
      en += U.ul(info);
      en += '<p class="consigne">1. Indiquez le compte d’inscription du bien et calculez son coût d’entrée' + (imm ? ', ventilé entre terrain et construction' : '') + (p.comp ? ', puis décomposé par composants' : '') + '. 2. Calculez les charges de l’exercice et la TVA déductible. 3. Comptabilisez l’acquisition.</p>';

      var qs = [QC('cpt', 'Compte d’inscription du bien principal', COMPTES_BIEN, x.compte), Q('cout', 'Coût d’entrée total (HT)', x.cout, '€')];
      if (imm) qs.push(Q('ter', 'Valeur du terrain', x.terrain, '€'), Q('con', 'Valeur de la construction (amortissable)', x.constr, '€'));
      if (x.comp) qs.push(Q('comp', 'Valeur du composant', x.comp, '€'), Q('str', 'Valeur de la structure', x.struct, '€'));
      qs.push(Q('ch', 'Montant comptabilisé en charges (HT)', x.chTot, '€'), Q('tva', 'TVA déductible totale', x.tva, '€'), Q('ttc', 'Montant total ' + (p.esc ? 'payé' : 'dû'), x.ttc, '€'));

      var c = [];
      if (!imm) {
        c.push(['Prix d’achat net', n(p.prix) + (x.rem ? ' − ' + n(x.rem) + ' (remise)' : '') + (x.esc ? ' − ' + n(x.esc) + ' (escompte ' + U.pcs(p.esc) + ' × ' + n(x.netCo) + ')' : ''), e(x.net)]);
      } else c.push(['Prix d’achat', 'prix global de l’ensemble immobilier', e(x.net)]);
      p.frais.forEach(function (f) {
        var inc = f.cat === 'incl' || (f.cat === 'fa' && p.fa === 'incl');
        var why = f.cat === 'incl' ? 'directement attribuable à la mise en état d’utilisation → coût d’entrée' : f.cat === 'fa' ? 'frais d’acquisition : ' + (inc ? 'option pour l’incorporation → coût d’entrée' : 'option pour les charges → compte ' + f.compte) : 'non nécessaire à la mise en état du bien → charge (' + f.compte + ')';
        c.push([f.lib, why, (inc ? '' : 'charge ') + e(f.mt)]);
      });
      c.push(['<b>Coût d’entrée</b>', [n(x.net)].concat(x.inclF ? [n(x.inclF) + ' (frais accessoires)'] : []).concat(x.faIncl ? [n(x.faIncl) + ' (frais d’acquisition)'] : []).join(' + '), '<b>' + e(x.cout) + '</b>']);
      if (imm) {
        c.push(['Terrain', n(x.cout) + ' × ' + U.pcs(p.ter) + ' (non amortissable)', e(x.terrain)]);
        c.push(['Construction', n(x.cout) + ' − ' + n(x.terrain), e(x.constr)]);
      }
      if (x.comp) {
        c.push(['Composant', n(imm ? x.constr : x.cout) + ' × ' + U.pcs(p.comp.pct), e(x.comp)]);
        c.push(['Structure', n(imm ? x.constr : x.cout) + ' − ' + n(x.comp), e(x.struct)]);
      }
      c.push(['Charges', x.chTot ? Object.keys(x.ch).map(function (k) { return k + ' : ' + n(x.ch[k]); }).join(' ; ') : 'aucune', e(x.chTot)]);
      c.push(['TVA déductible', '44562 : ' + n(x.tvaI) + ' ; 44566 : ' + n(x.tvaC), e(x.tva)]);

      var lines = x.lignes.map(function (l) { return L(l[0], l[1], 0); });
      Object.keys(x.ch).forEach(function (k) { lines.push(L(k, x.ch[k], 0)); });
      lines.push(L('44562', x.tvaI, 0), L('44566', x.tvaC, 0), L(tiers, 0, x.ttc));
      var journal = [U.entry(dA, 'Acquisition : ' + p.bien.replace(/\s*\(.*\)$/, ''), lines)];

      var com = [];
      com.push('Le bien est une immobilisation ' + (p.k === 'logiciel' ? 'incorporelle' : 'corporelle') + ' : l’entreprise le contrôle, en attend des avantages économiques sur plusieurs exercices et son coût est mesurable de façon fiable.');
      com.push('Son coût d’entrée de ' + e(x.cout) + ' comprend le prix d’achat net' + (x.esc ? ' (l’escompte de règlement vient en déduction du coût)' : '') + ' et les seuls frais nécessaires à sa mise en état de fonctionner' + (p.fa === 'incl' ? ', ainsi que les frais d’acquisition puisque la société a opté pour leur incorporation' : '') + '.');
      if (x.chTot) com.push('Les autres dépenses (' + e(x.chTot) + ') ne contribuent pas à mettre le bien en état d’utilisation : ce sont des charges de l’exercice' + (p.fa === 'charges' && p.frais.some(function (f) { return f.cat === 'fa'; }) ? ' ; passer les frais d’acquisition en charges réduit le résultat de N mais aussi la base amortissable' : '') + '.');
      if (imm) com.push('Le terrain (' + e(x.terrain) + ') n’est pas amortissable, car il ne se déprécie pas par l’usage ; seule la construction (' + e(x.constr) + ') sera amortie.');
      if (x.comp) com.push('L’approche par composants impose d’isoler ' + e(x.comp) + ', amorti sur sa propre durée ; son remplacement futur sera immobilisé et l’ancien composant sorti de l’actif.');
      com.push('La TVA de ' + e(x.tva) + ' est récupérable ; la dette ' + (p.esc ? 'est réglée comptant' : 'est inscrite au compte 404, hors exploitation, ce qui la distingue des dettes fournisseurs dans l’analyse du BFR') + '.');
      return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Analyse de chaque dépense', html: U.calc(c) }], comment: com.join(' ') };
    }
  };

  /* ---------- Titres : qualification, inventaire, cession ---------- */
  var CAT_T = {
    tp: { o: 0, cpt: '261', dep: '2961', lib: 'titres de participation' },
    ati: { o: 1, cpt: '271', dep: '2971', lib: 'autres titres immobilisés' },
    tiap: { o: 2, cpt: '273', dep: '2973', lib: 'TIAP' },
    vmp: { o: 3, cpt: '503', dep: '590', lib: 'valeurs mobilières de placement' }
  };
  var OPT_T = ['261 Titres de participation', '271 Autres titres immobilisés', '273 Titres immobilisés de l’activité de portefeuille (TIAP)', '503 Valeurs mobilières de placement'];
  var SOC_T = ['SOLÉO', 'BRIVAL', 'NORTEX', 'ARGALIS', 'MAREVA', 'KALYS', 'OPTIMA', 'VELDOR', 'ISALIA', 'TÉLIS'];
  T.titres = {
    id: 'titres', nom: 'Titres : qualification, inventaire et cession', famille: 'Immobilisations', ctrl: false, minutes: 15,
    fiche: {
      objectif: 'Classer les titres selon l’intention de l’entreprise, calculer leur coût d’entrée, les déprécier à l’inventaire et dégager le résultat de cession.',
      cours: [
        { t: 'Qualification des titres', l: [
          'Titres de participation (261) : titres dont la possession durable est estimée utile à l’activité, notamment parce qu’elle permet d’exercer une influence ou le contrôle ; présomption à partir de 10 % du capital.',
          'TIAP (273) : titres acquis dans le cadre d’une activité de portefeuille, pour en retirer à plus ou moins longue échéance une rentabilité satisfaisante, sans intervenir dans la gestion.',
          'Autres titres immobilisés (271) : titres que l’entreprise a l’intention ou est tenue de conserver durablement, sans relever des deux catégories précédentes (par exemple des parts de banque mutualiste).',
          'Valeurs mobilières de placement (50) : titres acquis en vue de réaliser un gain à brève échéance.',
          'Le critère est l’intention à l’acquisition, appréciée avec le pourcentage de détention et les liens avec la société émettrice.'
        ] },
        { t: 'Évaluation', l: [
          'Coût d’entrée : prix d’achat + frais d’acquisition (courtage, commissions, honoraires) si l’entreprise opte pour leur incorporation ; sinon frais en charges (6271). Fiscalement, les frais incorporés aux titres de participation sont amortis sur 5 ans par amortissement dérogatoire.',
          'Valeur d’inventaire : titres de participation à la valeur d’utilité (ce que l’entreprise accepterait de payer, au vu de la rentabilité, des perspectives, de la quote-part de capitaux propres) ; TIAP à la valeur probable de négociation ; titres cotés au cours moyen du dernier mois.',
          'Moins-value latente : dépréciation, ligne par ligne, D 6866 / C 29x ou 590 ; plus-value latente : rien (prudence, pas de compensation entre lignes).',
          'Cession de titres de même nature acquis à des prix différents : coût moyen pondéré (méthode fiscale) ou premier entré, premier sorti.'
        ] },
        { t: 'Cession', l: [
          'Titres immobilisés : prix de cession en produits (757) et valeur comptable en charges (657), en exploitation depuis le PCG 2025.',
          'Valeurs mobilières de placement : résultat net de cession en 767 (gain) ou 667 (perte), D 512 / C 503.',
          'Dépréciation devenue sans objet sur les titres cédés : reprise D 29x ou 590 / C 7866.'
        ] }
      ],
      etapes: [
        'Qualifier chaque ligne de titres d’après l’intention et le pourcentage de détention.',
        'Coût d’entrée = nombre × prix + frais si incorporés ; sinon frais en 6271.',
        'Pour une ligne achetée en plusieurs fois, calculer le coût moyen pondéré unitaire.',
        'À l’inventaire, comparer ligne par ligne le coût et la valeur d’inventaire × nombre : seule la moins-value est dépréciée.',
        'À la cession de VMP : prix de cession − coût moyen × nombre cédé = 767 ou 667 ; reprendre la dépréciation à proportion des titres cédés.'
      ],
      pieges: [
        'Qualifier sur le seul pourcentage : sous 10 %, des titres peuvent être des titres de participation si l’intention est l’influence durable.',
        'Compenser la plus-value d’une ligne avec la moins-value d’une autre.',
        'Déprécier les titres de participation au cours de bourse plutôt qu’à la valeur d’utilité.',
        'Oublier la reprise de la dépréciation des titres cédés.',
        'Les frais de courtage sur titres sont exonérés de TVA.'
      ],
      comptes: ['261 Titres de participation', '271 Autres titres immobilisés', '273 TIAP', '503 Actions (VMP)', '6271 Frais sur titres', '2961 / 2971 / 2973 / 590 Dépréciations', '6866 / 7866 Dotations et reprises financières', '767 / 667 Résultat de cession de VMP']
    },
    gen: function (r) {
      for (var essai = 0; essai < 300; essai++) {
        var cats = r.pickN(['tp', 'tiap', 'ati'], 2), socs = r.pickN(SOC_T, 3), taux = r.pick([0.005, 0.008, 0.01, 0.012]);
        var items = cats.map(function (k, i) {
          var c = r.int(15, 150), q = k === 'tp' ? r.int(4, 40) * 100 : r.int(5, 60) * 50;
          return { k: k, soc: socs[i], q: q, c: c, pct: k === 'tp' ? r.int(12, 45) : r.int(1, 6), mois: r.int(2, 6), f: U.r2(q * c * taux), v: 0 };
        }).sort(function (a, b) { return a.mois - b.mois; });
        var c1 = r.int(20, 120), c2 = U.r2(c1 * r.int(80, 125) / 100);
        var v = { k: 'vmp', soc: socs[2], q1: r.int(2, 20) * 50, c1: c1, q2: r.int(2, 20) * 50, c2: c2, m1: r.int(2, 5), m2: r.int(7, 10) };
        v.f1 = U.r2(v.q1 * v.c1 * taux); v.f2 = U.r2(v.q2 * v.c2 * taux);
        var p = { nom: U.nom(r), taux: taux, incl: r.chance(0.5), items: items, v: v };
        // valeurs d'inventaire
        items.forEach(function (it) { it.v = U.r2(it.c * r.int(75, 120) / 100); });
        var x0 = this.calc(Object.assign({}, p, { v: Object.assign({}, v, { cv: 1, qc: 1, pc: 1 }) }));
        v.cv = U.r2(x0.cmu * r.int(75, 115) / 100);
        var qt = v.q1 + v.q2; v.qc = r.int(1, Math.floor(qt / 50) - 1) * 50; if (v.qc <= 0) continue;
        v.pc = U.r2(x0.cmu * r.int(80, 125) / 100);
        var x = this.calc(p);
        var petit = function (m) { return m > 0 && m < 50; };
        if (x.lignes.some(function (l) { return petit(l.dep); }) || petit(x.depV) || petit(x.rep)) continue;
        if (x.depTot <= 0 || Math.abs(x.rc) < 5 || x.depV === 0 && r.chance(0.5)) continue;
        return p;
      }
      return { nom: 'EXEMPLE', taux: 0.01, incl: true, items: [{ k: 'tp', soc: 'SOLÉO', q: 1000, c: 50, pct: 20, mois: 3, f: 500, v: 45 }, { k: 'tiap', soc: 'BRIVAL', q: 500, c: 40, pct: 3, mois: 4, f: 200, v: 42 }], v: { k: 'vmp', soc: 'NORTEX', q1: 400, c1: 30, q2: 600, c2: 35, m1: 3, m2: 9, f1: 120, f2: 210, cv: 30, qc: 300, pc: 36 } };
    },
    calc: function (p) {
      var x = { lignes: [] }, v = p.v, depTot = 0;
      p.items.forEach(function (it) {
        var brut = U.r2(it.q * it.c), cout = U.r2(brut + (p.incl ? it.f : 0)), inv = U.r2(it.q * it.v), dep = Math.max(0, U.r2(cout - inv));
        x.lignes.push({ k: it.k, brut: brut, cout: cout, inv: inv, dep: dep }); depTot = U.r2(depTot + dep);
      });
      x.cL1 = U.r2(v.q1 * v.c1 + (p.incl ? v.f1 : 0)); x.cL2 = U.r2(v.q2 * v.c2 + (p.incl ? v.f2 : 0));
      x.qt = v.q1 + v.q2; x.coutV = U.r2(x.cL1 + x.cL2); x.cmu = U.rd(x.coutV / x.qt, 4);
      x.invV = U.r2(x.qt * v.cv); x.depV = Math.max(0, U.r2(x.coutV - x.invV)); depTot = U.r2(depTot + x.depV);
      x.depTot = depTot;
      x.fraisCh = p.incl ? 0 : U.r2(p.items.reduce(function (a, it) { return a + it.f; }, 0) + v.f1 + v.f2);
      x.coutC = U.r2(x.coutV * v.qc / x.qt); x.prixC = U.r2(v.qc * v.pc); x.rc = U.r2(x.prixC - x.coutC);
      x.rep = U.r2(x.depV * v.qc / x.qt);
      return x;
    },
    solve: function (p) {
      var x = this.calc(p), e = U.e, n = U.n, L = U.L, v = p.v;
      var ACQ = {
        tp: function (it) { return 'acquiert ' + n(it.q) + ' actions de la société ' + it.soc + ' (' + it.pct + ' % du capital), un sous-traitant stratégique : ' + p.nom + ' obtient un siège au conseil d’administration et entend peser durablement sur sa gestion'; },
        tiap: function (it) { return 'acquiert ' + n(it.q) + ' actions de la jeune société ' + it.soc + ' (' + it.pct + ' % du capital), dans le cadre de son activité de portefeuille, pour en retirer à plus ou moins longue échéance une rentabilité satisfaisante, sans intervenir dans sa gestion'; },
        ati: function (it) { return 'souscrit ' + n(it.q) + ' parts sociales de la banque mutualiste ' + it.soc + ' (' + it.pct + ' % du capital), exigées pour obtenir un prêt, qu’elle conservera durablement sans exercer d’influence'; }
      };
      var li = p.items.map(function (it) { return 'Le ' + U.dt(r15(it.mois), it.mois) + ', ' + p.nom + ' ' + ACQ[it.k](it) + ', au prix unitaire de ' + U.e2(it.c) + '.'; });
      li.push('Le ' + U.dt(10, v.m1) + ' puis le ' + U.dt(20, v.m2) + ', elle achète en bourse ' + n(v.q1) + ' puis ' + n(v.q2) + ' actions cotées ' + v.soc + ', aux cours de ' + U.e2(v.c1) + ' et ' + U.e2(v.c2) + ', dans l’espoir de réaliser rapidement une plus-value.');
      function r15(m) { return m === 2 ? 14 : 15; }
      var en = '<p>Opérations sur titres de la société <b>' + p.nom + '</b> en N :</p>' + liste(li);
      en += '<p>Chaque achat supporte des frais de courtage de ' + U.pcs(p.taux) + ' du prix (exonérés de TVA). ' + (p.incl ? 'La société a opté pour l’incorporation des frais d’acquisition au coût des titres.' : 'La société comptabilise les frais d’acquisition en charges.') + ' Tous les règlements sont faits par banque.</p>';
      var inv = p.items.map(function (it) {
        var base = it.k === 'tp' ? 'valeur d’utilité estimée' : it.k === 'tiap' ? 'valeur probable de négociation' : 'valeur de remboursement des parts';
        return [it.soc + ' (' + base + ')', U.e2(it.v)];
      });
      inv.push([v.soc + ' (cours moyen de décembre N)', U.e2(v.cv)]);
      en += '<p>Valeurs unitaires au 31/12/N :</p>' + U.kv(inv);
      en += '<p>Le ' + U.dt(5, 3, 1) + ', la société cède ' + n(v.qc) + ' actions ' + v.soc + ' au prix net de ' + U.e2(v.pc) + ' (méthode du coût moyen pondéré).</p>';
      en += '<p class="consigne">1. Qualifiez chaque catégorie de titres et calculez leur coût d’entrée. 2. Calculez et comptabilisez les dépréciations au 31/12/N. 3. Comptabilisez la cession de N+1.</p>';

      var qs = [];
      p.items.forEach(function (it, i) { qs.push(QC('q' + i, 'Qualification des titres ' + it.soc, OPT_T, CAT_T[it.k].o)); });
      qs.push(QC('q2', 'Qualification des titres ' + v.soc, OPT_T, 3));
      p.items.forEach(function (it, i) { qs.push(Q('ce' + i, 'Coût d’entrée des titres ' + it.soc, x.lignes[i].cout, '€')); });
      qs.push(Q('cmu', 'Coût moyen pondéré unitaire des actions ' + v.soc, x.cmu, '€', { tol: 0.01 }));
      qs.push(Q('dep', 'Dépréciation totale au 31/12/N', x.depTot, '€'));
      qs.push(Q('rc', 'Résultat de cession en N+1 (+ gain, − perte)', x.rc, '€'));
      if (x.rep) qs.push(Q('rep', 'Reprise de dépréciation sur les titres cédés', x.rep, '€'));

      var c = [];
      p.items.forEach(function (it, i) {
        var l = x.lignes[i], ct = CAT_T[it.k];
        c.push([it.soc + ' : ' + ct.lib + ' (' + ct.cpt + ')', n(it.q) + ' × ' + n(it.c, 2) + (p.incl ? ' + ' + n(it.f, 2) + ' de frais' : ' (frais de ' + n(it.f, 2) + ' en charges)'), e(l.cout)]);
      });
      c.push([v.soc + ' : VMP (503)', '(' + n(v.q1) + ' × ' + n(v.c1, 2) + (p.incl ? ' + ' + n(v.f1, 2) : '') + ') + (' + n(v.q2) + ' × ' + n(v.c2, 2) + (p.incl ? ' + ' + n(v.f2, 2) : '') + ')', e(x.coutV)]);
      c.push(['Coût moyen unitaire ' + v.soc, n(x.coutV) + ' ÷ ' + n(x.qt), U.e2(x.cmu)]);
      var t = [];
      p.items.forEach(function (it, i) { var l = x.lignes[i]; t.push([it.soc, n(l.cout, 2), n(it.q) + ' × ' + n(it.v, 2) + ' = ' + n(l.inv, 2), l.dep ? '<b>' + n(l.dep, 2) + '</b>' : 'plus-value latente : rien']); });
      t.push([v.soc, n(x.coutV, 2), n(x.qt) + ' × ' + n(v.cv, 2) + ' = ' + n(x.invV, 2), x.depV ? '<b>' + n(x.depV, 2) + '</b>' : 'plus-value latente : rien']);
      t.push({ cls: 'tot', cells: ['Total des dépréciations', '', '', n(x.depTot, 2)] });
      var cs = [['Coût des titres cédés', n(x.coutV) + ' × ' + n(v.qc) + ' / ' + n(x.qt), e(x.coutC)], ['Prix de cession', n(v.qc) + ' × ' + n(v.pc, 2), e(x.prixC)], ['Résultat de cession', n(x.prixC) + ' − ' + n(x.coutC), '<b>' + (x.rc >= 0 ? 'gain ' : 'perte ') + e(Math.abs(x.rc)) + '</b>']];
      if (x.depV) cs.push(['Reprise de dépréciation', n(x.depV) + ' × ' + n(v.qc) + ' / ' + n(x.qt), e(x.rep)]);

      var J = [];
      p.items.forEach(function (it, i) {
        var ct = CAT_T[it.k], l = x.lignes[i];
        J.push(U.entry(U.dt(r15(it.mois), it.mois), 'Acquisition de titres ' + it.soc, [L(ct.cpt, l.cout, 0), L('6271', p.incl ? 0 : it.f, 0), L('512', 0, U.r2(l.brut + it.f))]));
      });
      J.push(U.entry(U.dt(10, v.m1), 'Achat d’actions ' + v.soc, [L('503', U.r2(v.q1 * v.c1 + (p.incl ? v.f1 : 0)), 0), L('6271', p.incl ? 0 : v.f1, 0), L('512', 0, U.r2(v.q1 * v.c1 + v.f1))]));
      J.push(U.entry(U.dt(20, v.m2), 'Achat d’actions ' + v.soc, [L('503', U.r2(v.q2 * v.c2 + (p.incl ? v.f2 : 0)), 0), L('6271', p.incl ? 0 : v.f2, 0), L('512', 0, U.r2(v.q2 * v.c2 + v.f2))]));
      var dl = [L('6866', x.depTot, 0)];
      p.items.forEach(function (it, i) { if (x.lignes[i].dep) dl.push(L(CAT_T[it.k].dep, 0, x.lignes[i].dep)); });
      if (x.depV) dl.push(L('590', 0, x.depV));
      J.push(U.entry('31/12/N', 'Dépréciation des titres', dl));
      J.push(U.entry(U.dt(5, 3, 1), 'Cession d’actions ' + v.soc, [L('512', x.prixC, 0), L('667', x.rc < 0 ? -x.rc : 0, 0), L('503', 0, x.coutC), L('767', 0, x.rc > 0 ? x.rc : 0)]));
      if (x.rep) J.push(U.entry(U.dt(5, 3, 1), 'Reprise de la dépréciation des titres cédés', [L('590', x.rep, 0), L('7866', 0, x.rep)]));

      var com = [];
      com.push('La qualification des titres dépend de l’intention de l’entreprise lors de l’achat, éclairée par le pourcentage de détention : elle détermine le poste du bilan, la valeur d’inventaire retenue et le traitement de la cession.');
      com.push(p.items.map(function (it) { return 'les titres ' + it.soc + ' sont des ' + CAT_T[it.k].lib; }).join(', ').replace(/^l/, 'L') + ', classés en immobilisations financières ; les actions ' + v.soc + ', acquises pour une plus-value rapide, sont des valeurs mobilières de placement (actif circulant).');
      com.push(p.incl ? 'Les frais d’acquisition, incorporés, augmentent le coût d’entrée.' : 'Les frais d’acquisition, passés en charges (' + e(x.fraisCh) + '), réduisent le résultat de N sans modifier le coût des titres.');
      com.push('À la clôture, chaque ligne est comparée à sa valeur d’inventaire : la prudence impose de constater les moins-values latentes (' + e(x.depTot) + ' au total) sans compenser avec les plus-values latentes, qui ne sont jamais comptabilisées.');
      com.push('En N+1, le coût des titres cédés est évalué au coût moyen pondéré : la cession dégage ' + (x.rc >= 0 ? 'un gain' : 'une perte') + ' de ' + e(Math.abs(x.rc)) + ' en résultat financier' + (x.rep ? ', et la dépréciation devenue sans objet sur les titres vendus (' + e(x.rep) + ') est reprise' : '') + '.');
      return { enonce: en, questions: qs, journal: J, steps: [{ h: 'Qualification et coût d’entrée', html: U.calc(c) }, { h: 'Inventaire au 31/12/N', html: U.tbl(['Ligne', 'Coût d’entrée', 'Valeur d’inventaire', 'Dépréciation'], t) }, { h: 'Cession en N+1', html: U.calc(cs) }], comment: com.join(' ') };
    }
  };

  /* ---------- Travaux d'inventaire : synthèse et résultat définitif ---------- */
  var BIENS_INV = [['un chariot élévateur', '2154', '28154', 5], ['un serveur informatique', '2183', '28183', 4], ['une camionnette', '2182', '28182', 5], ['une machine d’emballage', '2154', '28154', 8], ['des ordinateurs portables', '2183', '28183', 3]];
  var COURT_INV = { amort: 'Amortissement', douteux: 'Créance douteuse', cca: 'Charge constatée d’avance', fnp: 'Facture non parvenue', pca: 'Produit constaté d’avance', fae: 'Facture à établir', stock: 'Variation des stocks', terrain: 'Dépréciation du terrain', litige: 'Provision pour litige', change: 'Perte de change latente' };
  var CLI_INV = ['Dupuis', 'Martin', 'Lefèvre', 'Garnier', 'Roussel', 'Chevalier', 'Perrin', 'Morel'];
  T.inventaire = {
    id: 'inventaire', nom: 'Travaux d’inventaire : synthèse et résultat définitif', famille: 'Travaux d’inventaire', ctrl: true, minutes: 18,
    fiche: {
      objectif: 'Passer de la balance avant inventaire au résultat définitif : enregistrer chaque écriture d’inventaire et mesurer son incidence sur le résultat.',
      cours: [
        { t: 'Objet de l’inventaire', l: [
          'Obligation légale : au moins une fois tous les douze mois, contrôler l’existence et la valeur des éléments du patrimoine (code de commerce, art. L. 123-12).',
          'Inventaire physique : comptage des stocks, des immobilisations, de la caisse ; rapprochement avec la comptabilité.',
          'Indépendance des exercices : rattacher à chaque exercice les charges et produits qui le concernent, et seulement eux.',
          'Image fidèle : régularité, sincérité et prudence conduisent à un bilan et un résultat qui reflètent la réalité de l’entreprise.'
        ] },
        { t: 'Modalités de mise en œuvre', l: [
          'Balance avant inventaire : soldes des comptes après les opérations courantes de l’exercice.',
          'Écritures d’inventaire : amortissements, dépréciations, provisions, régularisations (CCA, PCA, FNP, FAE, intérêts courus), variation des stocks, écarts de conversion.',
          'Balance après inventaire : base de l’établissement des comptes annuels (bilan, compte de résultat, annexe).',
          'Contrepassation à l’ouverture de N+1 des régularisations et des écarts de conversion.'
        ] },
        { t: 'Règles générales d’évaluation', l: [
          'Valeur d’entrée : coût d’acquisition (achat), coût de production (biens produits), valeur vénale (biens reçus en apport ou à titre gratuit).',
          'Valeur d’inventaire (actuelle) : la plus élevée de la valeur vénale et de la valeur d’usage.',
          'Comparaison à la clôture : une moins-value est constatée par une dépréciation (ou un amortissement exceptionnel) ; une plus-value latente n’est jamais comptabilisée.',
          'Stocks : au plus faible du coût (CMUP ou PEPS) et de la valeur actuelle (prix de vente net des frais de vente).',
          'Créances et dettes : valeur nominale ; en devises, conversion au cours de clôture avec écarts de conversion et provision pour perte latente.',
          'Passif : provision dès qu’une obligation envers un tiers rend probable une sortie de ressources sans contrepartie.'
        ] }
      ],
      etapes: [
        'Lister les opérations d’inventaire et passer chaque écriture au 31/12/N.',
        'Pour chaque écriture, repérer les comptes de gestion (classes 6 et 7) : une charge diminue le résultat, un produit l’augmente ; les écritures entre comptes de bilan (411 → 416) sont neutres.',
        'Amortissement : coût ÷ durée × prorata temporis depuis la mise en service.',
        'Créance douteuse : dépréciation sur le HT ; régularisations : prorata des mois, montants HT ; stocks : + stock final − stock initial.',
        'Résultat définitif = résultat provisoire + produits − charges d’inventaire ; présenter un tableau récapitulatif.'
      ],
      pieges: [
        'Compter la TVA dans l’incidence sur le résultat (factures non parvenues, à établir).',
        'Oublier que la variation de stock joue dans les deux sens : un stock final supérieur au stock initial augmente le résultat.',
        'Déprécier le montant TTC d’une créance douteuse.',
        'Constater un gain latent de change ou une plus-value latente.',
        'Prendre l’année entière pour l’amortissement d’un bien mis en service en cours d’exercice.'
      ],
      comptes: ['6811 / 28x Amortissements', '6817 / 491 Créances douteuses', '486 / 487 CCA et PCA', '408 / 418 Factures non parvenues et à établir', '6037 / 37 Variation des stocks', '6815 / 1511 Provision pour litige', '476 / 6865 / 1515 Perte de change latente', '6816 / 2911 Dépréciation d’un terrain']
    },
    gen: function (r, opt) {
      var pool = ['amort', 'douteux', 'cca', 'fnp', 'pca', 'fae', 'stock', 'terrain'];
      if (!opt || opt.profil !== 'C') pool.push('litige', 'change');
      var ops = r.pickN(pool, r.int(4, 6)).map(function (k) {
        switch (k) {
          case 'amort': var b = r.pick(BIENS_INV); return { k: k, b: b, C: r.int(4, 80) * 500, d: r.pick([1, 1, 15]), m: r.int(2, 11) };
          case 'douteux': return { k: k, cl: r.pick(CLI_INV), ttc: r.int(5, 80) * 120, p: r.pick([0.2, 0.3, 0.4, 0.5, 0.6]) };
          case 'cca': return { k: k, mt: r.int(12, 120) * 120, m: r.int(2, 12) };
          case 'fnp': return { k: k, nat: r.pick([['l’électricité de décembre', '6061'], ['les honoraires de l’expert-comptable', '6226'], ['le transport sur achats de décembre', '6241']]), ht: r.int(5, 120) * 50 };
          case 'pca': return { k: k, mt: r.int(12, 100) * 120, m: r.int(2, 12) };
          case 'fae': return { k: k, ht: r.int(10, 200) * 100 };
          case 'stock': var si = r.int(10, 150) * 1000; return { k: k, si: si, sf: Math.max(1000, si + r.int(-20, 25) * 500) };
          case 'terrain': var Ct = r.int(50, 300) * 1000; return { k: k, C: Ct, V: U.r0(Ct * r.int(70, 95) / 100 / 1000) * 1000 };
          case 'litige': return { k: k, obj: r.pick(['Un ancien salarié a saisi les prud’hommes', 'Un client réclame une indemnité pour un défaut de fabrication', 'Un concurrent a engagé une action en concurrence déloyale']), est: r.int(3, 40) * 1000 };
          default: var c0 = U.rd(r.int(105, 120) / 100, 2); return { k: 'change', X: r.int(10, 200) * 1000, c0: c0, c1: U.rd(c0 + r.int(3, 10) / 100, 2), m: r.int(10, 12) };
        }
      });
      return { nom: U.nom(r), R0: r.int(20, 400) * 500, ops: ops };
    },
    calc: function (p) {
      var x = { inc: [], R: p.R0 };
      p.ops.forEach(function (o) {
        var v = 0, d = {};
        if (o.k === 'amort') { d.j = U.joursRestants(o.d, o.m); d.dot = U.r2(o.C / o.b[3] * d.j / 360); v = -d.dot; }
        else if (o.k === 'douteux') { d.ht = U.r2(o.ttc / 1.2); d.dep = U.r2(d.ht * o.p); v = -d.dep; }
        else if (o.k === 'cca') { d.cca = U.r2(o.mt * (o.m - 1) / 12); v = d.cca; }
        else if (o.k === 'fnp') { d.tva = U.r2(o.ht * 0.2); v = -o.ht; }
        else if (o.k === 'pca') { d.pca = U.r2(o.mt * (o.m - 1) / 12); v = -d.pca; }
        else if (o.k === 'fae') { d.tva = U.r2(o.ht * 0.2); v = o.ht; }
        else if (o.k === 'stock') { v = U.r2(o.sf - o.si); }
        else if (o.k === 'terrain') { d.dep = U.r2(o.C - o.V); v = -d.dep; }
        else if (o.k === 'litige') { v = -o.est; }
        else { d.V0 = U.r2(o.X / o.c0); d.V1 = U.r2(o.X / o.c1); d.perte = U.r2(d.V0 - d.V1); v = -d.perte; }
        x.inc.push({ v: U.r2(v), d: d }); x.R = U.r2(x.R + v);
      });
      return x;
    },
    solve: function (p) {
      var x = this.calc(p), e = U.e, n = U.n, L = U.L, li = [], qs = [], rows = [], J = [];
      p.ops.forEach(function (o, i) {
        var d = x.inc[i].d, v = x.inc[i].v, calc = '', txt = '';
        if (o.k === 'amort') {
          txt = 'L’entreprise a mis en service le ' + U.dt(o.d, o.m) + ' ' + o.b[0] + ' acquis ' + e(o.C) + ' HT, amorti en linéaire sur ' + o.b[3] + ' ans ; la dotation de N n’a pas été comptabilisée.';
          calc = 'Dotation : ' + n(o.C) + ' ÷ ' + o.b[3] + ' × ' + U.prorataTxt(d.j);
          J.push(U.entry('31/12/N', 'Dotation aux amortissements', [L('6811', d.dot, 0), L(o.b[2], 0, d.dot)]));
        } else if (o.k === 'douteux') {
          txt = 'La créance du client ' + o.cl + ' (' + e(o.ttc) + ' TTC) devient douteuse ; la perte probable est estimée à ' + U.pcs(o.p) + '.';
          calc = 'Dépréciation : ' + n(o.ttc) + ' ÷ 1,2 × ' + U.pcs(o.p) + ' (le transfert en 416 est sans incidence)';
          J.push(U.entry('31/12/N', 'Client ' + o.cl + ' douteux', [L('416', o.ttc, 0), L('411', 0, o.ttc)]));
          J.push(U.entry('31/12/N', 'Dépréciation de la créance ' + o.cl, [L('6817', d.dep, 0), L('491', 0, d.dep)]));
        } else if (o.k === 'cca') {
          txt = 'La prime annuelle d’assurance de ' + e(o.mt) + ', payée le ' + U.dt(1, o.m) + ', a été entièrement portée en charges ; elle couvre douze mois à compter de cette date.';
          calc = 'Charge constatée d’avance : ' + n(o.mt) + ' × ' + (o.m - 1) + '/12';
          J.push(U.entry('31/12/N', 'Assurance constatée d’avance', [L('486', d.cca, 0), L('616', 0, d.cca)]));
        } else if (o.k === 'fnp') {
          txt = 'La facture concernant ' + o.nat[0] + ' (' + e(o.ht) + ' HT, TVA 20 %) n’est pas encore parvenue.';
          calc = 'Charge à payer, montant HT (la TVA de ' + n(d.tva) + ' est sans incidence)';
          J.push(U.entry('31/12/N', 'Facture non parvenue', [L(o.nat[1], o.ht, 0), L('44586', d.tva, 0), L('408', 0, U.r2(o.ht + d.tva))]));
        } else if (o.k === 'pca') {
          txt = 'Un abonnement annuel de maintenance vendu à un client, ' + e(o.mt) + ' HT encaissés et facturés le ' + U.dt(1, o.m) + ', a été entièrement enregistré en prestations de services.';
          calc = 'Produit constaté d’avance : ' + n(o.mt) + ' × ' + (o.m - 1) + '/12';
          J.push(U.entry('31/12/N', 'Prestations constatées d’avance', [L('706', d.pca, 0), L('487', 0, d.pca)]));
        } else if (o.k === 'fae') {
          txt = 'Des marchandises livrées le 29/12/N pour ' + e(o.ht) + ' HT ne seront facturées qu’en janvier N+1.';
          calc = 'Produit à recevoir, montant HT (TVA de ' + n(d.tva) + ' sans incidence)';
          J.push(U.entry('31/12/N', 'Facture à établir', [L('418', U.r2(o.ht + d.tva), 0), L('707', 0, o.ht), L('44587', 0, d.tva)]));
        } else if (o.k === 'stock') {
          txt = 'Le stock initial de marchandises s’élevait à ' + e(o.si) + ' ; l’inventaire physique du 31/12/N l’évalue à ' + e(o.sf) + '.';
          calc = 'Variation : stock final ' + n(o.sf) + ' − stock initial ' + n(o.si);
          J.push(U.entry('31/12/N', 'Annulation du stock initial', [L('6037', o.si, 0), L('37', 0, o.si)]));
          J.push(U.entry('31/12/N', 'Constatation du stock final', [L('37', o.sf, 0), L('6037', 0, o.sf)]));
        } else if (o.k === 'terrain') {
          txt = 'Un terrain acquis ' + e(o.C) + ' a désormais une valeur vénale de ' + e(o.V) + ' (projet d’aménagement routier voisin).';
          calc = 'Dépréciation : ' + n(o.C) + ' − ' + n(o.V);
          J.push(U.entry('31/12/N', 'Dépréciation du terrain', [L('6816', d.dep, 0), L('2911', 0, d.dep)]));
        } else if (o.k === 'litige') {
          txt = o.obj + ' ; l’avocat estime la condamnation probable pour ' + e(o.est) + '.';
          calc = 'Provision pour litige : estimation de l’avocat';
          J.push(U.entry('31/12/N', 'Provision pour litige', [L('6815', o.est, 0), L('1511', 0, o.est)]));
        } else {
          txt = 'Une créance sur un client américain de ' + n(o.X) + ' USD, née le ' + U.dt(15, o.m) + ' (1 € = ' + n(o.c0, 2) + ' USD), est toujours due ; au 31/12/N, 1 € = ' + n(o.c1, 2) + ' USD.';
          calc = n(o.X) + ' ÷ ' + n(o.c0, 2) + ' − ' + n(o.X) + ' ÷ ' + n(o.c1, 2) + ' : perte latente provisionnée (l’écart de conversion seul est neutre)';
          J.push(U.entry('31/12/N', 'Écart de conversion actif', [L('476', d.perte, 0), L('411', 0, d.perte)]));
          J.push(U.entry('31/12/N', 'Provision pour perte de change', [L('6865', d.perte, 0), L('1515', 0, d.perte)]));
        }
        li.push(txt);
        qs.push(Q('o' + i, 'Opération ' + (i + 1) + ' : incidence sur le résultat (+ / −)', v, '€'));
        rows.push([(i + 1) + '. ' + COURT_INV[o.k], calc, '<b>' + sgn(v) + '</b>']);
      });
      qs.push(Q('rd', 'Résultat définitif de N', x.R, '€'));
      var en = '<p>Avant les travaux d’inventaire, la balance de la société <b>' + p.nom + '</b> fait apparaître un résultat provisoire (bénéfice) de ' + e(p.R0) + '. Il reste à tenir compte des éléments suivants (TVA 20 %, année de 360 jours) :</p>' + liste(li);
      en += '<p class="consigne">1. Passez les écritures d’inventaire au 31/12/N. 2. Indiquez l’incidence de chaque opération sur le résultat et calculez le résultat définitif.</p>';
      var tot = U.r2(x.R - p.R0);
      rows.unshift({ cls: 'tot', cells: ['Résultat provisoire', 'balance avant inventaire', e(p.R0)] });
      rows.push({ cls: 'tot', cells: ['Résultat définitif', n(p.R0) + ' ' + (tot >= 0 ? '+ ' : '− ') + n(Math.abs(tot)), '<b>' + e(x.R) + '</b>'] });
      var com = [];
      com.push('Les travaux d’inventaire font passer le résultat de ' + e(p.R0) + ' à ' + e(x.R) + ' (' + sgn(tot) + ') : ils sont indispensables pour que les comptes donnent une image fidèle du patrimoine et du résultat.');
      com.push('Ils appliquent l’indépendance des exercices (régularisations, amortissement au prorata temporis) et la prudence (dépréciations et provisions des pertes probables, jamais de gain latent).');
      com.push('Seules les écritures qui mouvementent des comptes de charges ou de produits modifient le résultat ; les reclassements entre comptes de bilan et la TVA sont neutres.');
      com.push('Dotations et provisions sont des charges calculées, sans décaissement : elles réduisent le résultat mais pas la capacité d’autofinancement.');
      com.push('Les régularisations et les écarts de conversion seront contrepassés à l’ouverture de N+1.');
      return { enonce: en, questions: qs, journal: J, steps: [{ h: 'Incidence sur le résultat', html: U.calc(rows) }], comment: com.join(' ') };
    }
  };

  /* ---------- Documents de synthèse : compte de résultat et bilan ---------- */
  T.etats = {
    id: 'etats', nom: 'Compte de résultat et bilan', famille: 'Documents de synthèse', ctrl: true, minutes: 20,
    fiche: {
      objectif: 'Établir le compte de résultat et le bilan à partir de la balance après inventaire, en classant chaque compte au bon niveau (exploitation, financier, exceptionnel).',
      cours: [
        { t: 'Les comptes annuels', l: [
          'Bilan : photographie du patrimoine à la clôture ; actif (emplois : immobilisations, actif circulant) et passif (ressources : capitaux propres, provisions, dettes) ; les actifs sont présentés en brut, amortissements et dépréciations, net.',
          'Compte de résultat : charges et produits de l’exercice, classés en exploitation, financier et exceptionnel, puis participation des salariés et impôt sur les bénéfices.',
          'Annexe : informations complémentaires indispensables à la compréhension (méthodes d’évaluation, engagements hors bilan, tableaux des immobilisations, amortissements, provisions, échéances des créances et dettes).',
          'Les trois documents forment un tout indissociable (code de commerce, art. L. 123-12) ; ils sont arrêtés par l’organe de gestion et approuvés par l’assemblée dans les six mois de la clôture.',
          'Présentation : modèles du PCG en système de base ; présentations simplifiées pour les petites entreprises (annexe allégée, voire dispense pour les micro-entreprises).'
        ] },
        { t: 'Principes de présentation', l: [
          'Non-compensation : pas de compensation entre actif et passif ni entre charges et produits (sauf exceptions prévues).',
          'Permanence des méthodes : mêmes méthodes d’évaluation et de présentation d’un exercice à l’autre, sauf changement justifié et expliqué en annexe.',
          'Comparabilité : chaque poste mentionne le chiffre de l’exercice précédent (N−1).',
          'Intangibilité du bilan d’ouverture : le bilan d’ouverture de N correspond au bilan de clôture de N−1.',
          'Image fidèle, régularité, sincérité, prudence, continuité d’exploitation, importance relative.'
        ] },
        { t: 'Classement des charges et produits', l: [
          'Exploitation (60 à 65, 68 d’exploitation ; 70 à 75, 78 d’exploitation) : activité courante, y compris les dotations aux amortissements, dépréciations et provisions d’exploitation.',
          'Financier (66, 686 ; 76, 786) : intérêts, revenus des titres, résultats de cession des VMP, change sur opérations financières, dépréciations financières.',
          'Exceptionnel (67, 687 ; 77, 787) : depuis le règlement ANC 2022-06 (PCG 2025, exercices ouverts à compter du 01/01/2025), limité aux produits et charges directement liés à un événement majeur et inhabituel ; les cessions d’immobilisations passent en exploitation (657 / 757).',
          'Résultat net = résultat d’exploitation + résultat financier + résultat exceptionnel − participation des salariés − impôt sur les bénéfices.'
        ] }
      ],
      etapes: [
        'Vérifier que la balance est équilibrée (total des soldes débiteurs = total des soldes créditeurs).',
        'Classe 7 moins classe 6 par niveau : exploitation, financier, exceptionnel ; retrancher l’impôt (695).',
        'Chiffre d’affaires = ventes de marchandises (707) + production vendue (701 à 706).',
        'Bilan : actif brut − amortissements et dépréciations (28, 29, 39, 49) = actif net ; passif = capitaux propres (capital, réserves, report à nouveau, résultat) + dettes.',
        'Contrôle : total actif net = total passif, résultat compris.'
      ],
      pieges: [
        'Oublier le résultat de l’exercice dans les capitaux propres.',
        'Inscrire les amortissements au passif : ils viennent en diminution de l’actif.',
        'Traiter la variation de stock comme un produit : c’est une correction des achats (solde créditeur si le stock augmente).',
        'Classer en exceptionnel des charges courantes, ou les cessions d’immobilisations depuis le PCG 2025.',
        'Compter l’impôt sur les bénéfices dans le résultat d’exploitation.'
      ],
      comptes: ['101 Capital', '106 Réserves', '164 Emprunts', '2x / 28x Immobilisations et amortissements', '37 Stocks', '411 Clients', '512 Banque', '60 à 65, 68 Charges d’exploitation', '66 / 76 Financier', '67 / 77 Exceptionnel', '695 Impôt sur les bénéfices']
    },
    gen: function (r) {
      for (var essai = 0; essai < 200; essai++) {
        var b = {}, V = r.int(60, 400) * 5000;
        b['707'] = -V; if (r.chance(0.5)) b['706'] = -r.int(5, 60) * 1000;
        b['607'] = U.r0(V * r.int(45, 62) / 100 / 100) * 100;
        var SI = U.r0(V * r.int(5, 15) / 100 / 100) * 100, SF = Math.max(1000, SI + r.int(-10, 15) * 500);
        if (SF === SI) continue;
        b['6037'] = SI - SF;
        b['613'] = U.r0(V * r.int(3, 7) / 100 / 100) * 100; b['616'] = r.int(3, 20) * 300; b['6226'] = r.int(2, 20) * 500; b['6061'] = r.int(5, 40) * 200;
        b['6351'] = r.int(2, 20) * 400;
        b['641'] = U.r0(V * r.int(14, 22) / 100 / 100) * 100; b['645'] = U.r0(b['641'] * r.int(38, 45) / 100 / 10) * 10;
        var C = r.int(10, 60) * 5000, M = r.int(4, 40) * 2500, T0 = r.chance(0.7) ? r.int(5, 40) * 2000 : 0;
        b['6811'] = U.r0((C / 25 + M / 8) / 100) * 100;
        var aC = U.r0(C * r.int(10, 50) / 100 / 100) * 100 + U.r0(C / 25 / 100) * 100, aM = Math.min(M - 500, U.r0(M * r.int(15, 70) / 100 / 100) * 100 + U.r0(M / 8 / 100) * 100);
        var CLt = U.r0(V * 1.2 * r.int(20, 60) / 360 / 100) * 100, dep = 0;
        if (r.chance(0.5)) { dep = r.int(2, 20) * 100; b['6817'] = dep; }
        if (r.chance(0.3)) b['7817'] = -r.int(1, 10) * 100;
        var emp = r.int(4, 40) * 5000;
        b['6611'] = U.r0(emp * r.pick([0.02, 0.03, 0.04, 0.05]) / 10) * 10;
        if (r.chance(0.6)) b['764'] = -r.int(2, 30) * 100;
        if (r.chance(0.6)) b['678'] = r.int(2, 30) * 500;
        if (r.chance(0.6) || !b['678']) b['778'] = -r.int(2, 40) * 500;
        var exc = { ch: r.pick(['destruction d’une partie du stock par une inondation', 'dommages causés par un incendie de l’entrepôt']), pr: r.pick(['indemnité d’assurance reçue à la suite d’un sinistre majeur', 'subvention d’équilibre exceptionnelle de la collectivité après une catastrophe naturelle']) };
        var base = 0; Object.keys(b).forEach(function (k) { if (/^[67]/.test(k)) base -= b[k]; });
        if (base < V * 0.02) continue;
        b['695'] = U.r0(base * 0.25 / 10) * 10;
        var RN = base - b['695'];
        // bilan
        var cap, RLg, res = r.int(0, 30) * 1000, ran = r.chance(0.5) ? r.int(1, 50) * 100 : 0;
        b['1061'] = 0; if (res) b['1068'] = -res; if (ran) b['110'] = -ran;
        if (T0) b['211'] = T0; b['213'] = C; b['2813'] = -aC; b['2154'] = M; b['28154'] = -aM;
        b['37'] = SF; b['411'] = CLt; if (dep) b['491'] = -(dep + r.int(0, 10) * 100);
        b['401'] = -U.r0((b['607'] * 1.2) * r.int(30, 75) / 360 / 100) * 100;
        b['431'] = -U.r0(b['645'] * r.int(8, 12) / 100 / 10) * 10;
        b['44551'] = -r.int(2, 30) * 500;
        b['444'] = -U.r0(b['695'] * r.int(10, 40) / 100 / 10) * 10;
        var bk = U.r0(V * r.int(2, 10) / 100 / 1000) * 1000;
        var anet = (T0 || 0) + C - aC + M - aM + SF + CLt + bk;
        cap = Math.max(10000, U.r0(anet * r.int(15, 35) / 100 / 10000) * 10000); RLg = U.r0(cap * r.int(2, 10) / 100 / 100) * 100;
        b['101'] = -cap; b['1061'] = -RLg;
        var actif = 0, pass = 0;
        Object.keys(b).forEach(function (k) { if (/^[1-5]/.test(k)) { if (b[k] > 0) actif += b[k]; else pass -= b[k]; } });
        // actif net (hors banque) : soldes débiteurs − amortissements/dépréciations (créditeurs des 28, 29, 39, 49)
        var need = actif + bk - pass - RN;
        if (need < 10000) continue;
        b['164'] = -U.r0(need);
        b['512'] = bk;
        if (b['164'] > -10000 || b['512'] <= 0) continue;
        var tD = 0, tC = 0; Object.keys(b).forEach(function (k) { if (b[k] > 0) tD += b[k]; else tC -= b[k]; });
        if (Math.abs(tD - tC) > 0.5) continue;
        return { nom: U.nom(r), b: b, exc: exc };
      }
      return null;
    },
    calc: function (p) {
      var b = p.b, g = function (k) { return b[k] || 0; }, x = {};
      x.CA = -(g('707') + g('706'));
      x.PE = U.r2(x.CA - g('7817'));
      x.CE = U.r2(g('607') + g('6037') + g('613') + g('616') + g('6226') + g('6061') + g('6351') + g('641') + g('645') + g('6811') + g('6817'));
      x.REX = U.r2(x.PE - x.CE);
      x.PF = -g('764'); x.CF = g('6611'); x.RFI = U.r2(x.PF - x.CF);
      x.PX = -g('778'); x.CX = g('678'); x.RXC = U.r2(x.PX - x.CX);
      x.IS = g('695'); x.RN = U.r2(x.REX + x.RFI + x.RXC - x.IS);
      x.immoB = g('211') + g('213') + g('2154'); x.amort = -(g('2813') + g('28154'));
      x.immoN = x.immoB - x.amort;
      x.cliN = g('411') + g('491');
      x.AN = U.r2(x.immoN + g('37') + x.cliN + g('512'));
      x.CP = U.r2(-(g('101') + g('1061') + g('1068') + g('110')) + x.RN);
      x.DET = -(g('164') + g('401') + g('431') + g('44551') + g('444'));
      x.TP = U.r2(x.CP + x.DET);
      return x;
    },
    solve: function (p) {
      var x = this.calc(p), b = p.b, n = U.n, e = U.e, g = function (k) { return b[k] || 0; };
      var LIB = { '6037': 'Variation des stocks de marchandises', '678': 'Charges exceptionnelles (' + p.exc.ch + ')', '778': 'Produits exceptionnels (' + p.exc.pr + ')', '2813': 'Amortissements des constructions', '28154': 'Amortissements du matériel industriel' };
      var ks = Object.keys(b).sort(), tD = 0, tC = 0;
      var rows = ks.map(function (k) { var s = b[k]; if (s > 0) tD += s; else tC -= s; return ['<span class="mono">' + k + '</span>', LIB[k] || U.lib(k), s > 0 ? n(s) : '', s < 0 ? n(-s) : '']; });
      rows.push({ cls: 'tot', cells: ['', 'Totaux', n(tD), n(tC)] });
      var en = '<p>Voici la balance après inventaire de la société <b>' + p.nom + '</b> au 31/12/N (en euros). Le résultat de l’exercice n’a pas encore été déterminé.</p>' + U.tbl(['Compte', 'Intitulé', 'Solde débiteur', 'Solde créditeur'], rows);
      en += '<p class="consigne">1. Présentez le compte de résultat de N (exploitation, financier, exceptionnel, impôt) et calculez le résultat net. 2. Présentez le bilan simplifié au 31/12/N (actif net, passif après résultat). 3. Commentez.</p>';
      var qs = [Q('ca', 'Chiffre d’affaires', x.CA, '€'), Q('rex', 'Résultat d’exploitation', x.REX, '€'), Q('rfi', 'Résultat financier', x.RFI, '€'), Q('rxc', 'Résultat exceptionnel', x.RXC, '€'), Q('rn', 'Résultat net', x.RN, '€'), Q('tb', 'Total du bilan (net)', x.AN, '€'), Q('cp', 'Capitaux propres (résultat compris)', x.CP, '€')];
      var cr = [];
      var L1 = function (lib, v) { return [lib, n(v)]; };
      cr.push(L1('Ventes de marchandises (707)', -g('707')));
      if (g('706')) cr.push(L1('Prestations de services (706)', -g('706')));
      if (g('7817')) cr.push(L1('Reprises sur dépréciations (7817)', -g('7817')));
      cr.push({ cls: 'tot', cells: ['Produits d’exploitation', n(x.PE)] });
      cr.push(L1('Achats de marchandises (607)', g('607')), L1('Variation des stocks (6037) : ' + n(g('37') + g('6037')) + ' − ' + n(g('37')), g('6037')), L1('Autres achats et charges externes (6061, 613, 616, 6226)', g('6061') + g('613') + g('616') + g('6226')), L1('Impôts et taxes (6351)', g('6351')), L1('Salaires et charges sociales (641, 645)', g('641') + g('645')), L1('Dotations aux amortissements et dépréciations (681)', g('6811') + g('6817')));
      cr.push({ cls: 'tot', cells: ['Charges d’exploitation', n(x.CE)] });
      cr.push({ cls: 'tot', cells: ['Résultat d’exploitation', '<b>' + n(x.REX) + '</b>'] });
      if (x.PF) cr.push(L1('Produits financiers (764)', x.PF));
      cr.push(L1('Charges financières (6611)', x.CF));
      cr.push({ cls: 'tot', cells: ['Résultat financier', '<b>' + n(x.RFI) + '</b>'] });
      if (x.PX) cr.push(L1('Produits exceptionnels (778)', x.PX));
      if (x.CX) cr.push(L1('Charges exceptionnelles (678)', x.CX));
      cr.push({ cls: 'tot', cells: ['Résultat exceptionnel', '<b>' + n(x.RXC) + '</b>'] });
      cr.push(L1('Impôt sur les bénéfices (695)', x.IS));
      cr.push({ cls: 'tot', cells: ['Résultat net (bénéfice)', '<b>' + n(x.RN) + '</b>'] });
      var bi = [];
      if (g('211')) bi.push(['Terrains', n(g('211')), '', n(g('211'))]);
      bi.push(['Constructions', n(g('213')), n(-g('2813')), n(g('213') + g('2813'))], ['Matériel industriel', n(g('2154')), n(-g('28154')), n(g('2154') + g('28154'))]);
      bi.push(['Stocks de marchandises', n(g('37')), '', n(g('37'))], ['Clients', n(g('411')), g('491') ? n(-g('491')) : '', n(x.cliN)], ['Banque', n(g('512')), '', n(g('512'))]);
      bi.push({ cls: 'tot', cells: ['Total actif', '', '', n(x.AN)] });
      var pa = [['Capital', n(-g('101'))], ['Réserve légale', n(-g('1061'))]];
      if (g('1068')) pa.push(['Autres réserves', n(-g('1068'))]);
      if (g('110')) pa.push(['Report à nouveau', n(-g('110'))]);
      pa.push(['Résultat de l’exercice', n(x.RN)], { cls: 'tot', cells: ['Capitaux propres', n(x.CP)] });
      pa.push(['Emprunts (164)', n(-g('164'))], ['Fournisseurs (401)', n(-g('401'))], ['Dettes fiscales et sociales (431, 44551, 444)', n(-(g('431') + g('44551') + g('444')))]);
      pa.push({ cls: 'tot', cells: ['Total passif', n(x.TP)] });
      var com = [];
      com.push('Le chiffre d’affaires de ' + e(x.CA) + ' dégage un résultat d’exploitation de ' + e(x.REX) + ' (' + U.pc(x.REX / x.CA, 1) + ' du CA), qui mesure la performance de l’activité courante, indépendamment du financement et des événements exceptionnels.');
      com.push('Le résultat financier (' + e(x.RFI) + ') reflète ' + (x.RFI >= 0 ? 'des revenus de placements supérieurs au coût de l’endettement' : 'surtout le coût de l’endettement' + (x.PF ? ', partiellement compensé par les revenus des placements' : '')) + '.');
      com.push('Le résultat exceptionnel (' + e(x.RXC) + ') ne regroupe que les effets d’événements majeurs et inhabituels, conformément au PCG 2025 ; il ne doit pas servir à apprécier la rentabilité récurrente.');
      com.push('Après impôt, le bénéfice net atteint ' + e(x.RN) + ', soit une rentabilité nette de ' + U.pc(x.RN / x.CA, 1) + ' du CA et de ' + U.pc(x.RN / x.CP, 1) + ' des capitaux propres.');
      com.push('Au bilan, les capitaux propres représentent ' + U.pc(x.CP / x.TP, 1) + ' du total : ' + (x.CP / x.TP >= 0.5 ? 'l’autonomie financière est solide' : x.CP / x.TP >= 0.2 ? 'la structure financière est équilibrée' : 'l’entreprise est fortement endettée') + '. Le total de l’actif net égale celui du passif (' + e(x.AN) + '), ce qui valide la balance et le résultat. L’annexe complète ces documents (méthodes, engagements, détail des immobilisations et des échéances).');
      return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Compte de résultat de N', html: U.tbl(['Poste', 'Montant'], cr) }, { h: 'Bilan au 31/12/N (actif)', html: U.tbl(['Actif', 'Brut', 'Amort. et dépréc.', 'Net'], bi) }, { h: 'Bilan au 31/12/N (passif)', html: U.tbl(['Passif', 'Montant'], pa) }], comment: com.join(' ') };
    }
  };
})();
