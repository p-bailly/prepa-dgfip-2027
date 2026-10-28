'use strict';
/* ===== Noyau : aléa, arrondis, formats, vérification ===== */
var T = {};          // registre des types d'exercices
var ANNALES = [];    // sujets réels rejouables

var U = (function () {
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rng(seed) {
    var f = mulberry32(seed >>> 0);
    var o = {
      seed: seed, f: f,
      int: function (a, b, s) { s = s || 1; var n = Math.floor((b - a) / s + 1e-9); return r2(a + s * Math.floor(f() * (n + 1))); },
      pick: function (a) { return a[Math.floor(f() * a.length)]; },
      chance: function (p) { return f() < p; },
      shuffle: function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(f() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; },
      pickN: function (a, n) { return o.shuffle(a).slice(0, n); }
    };
    return o;
  }
  function r2(x) { var y = Math.round(Math.abs(x) * 100 + 1e-7) / 100; return x < 0 ? -y : y; }
  function r0(x) { var y = Math.round(Math.abs(x) + 1e-9); return x < 0 ? -y : y; }
  function rd(x, d) { var k = Math.pow(10, d); var y = Math.round(Math.abs(x) * k + 1e-7) / k; return x < 0 ? -y : y; }
  function floorStep(x, s) { return r2(Math.floor(x / s + 1e-9) * s); }

  var NB = ' ', NBS = ' ';
  function n(x, dec) {
    if (x === null || x === undefined || isNaN(x)) return '—';
    if (dec === undefined) dec = (Math.abs(r2(x) - Math.round(r2(x))) > 1e-9) ? 2 : 0;
    var neg = x < 0; var v = Math.abs(rd(x, dec));
    var s = v.toFixed(dec); var parts = s.split('.');
    var ent = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, NB);
    return (neg ? '−' : '') + ent + (dec > 0 ? ',' + parts[1] : '');
  }
  function e(x, dec) { return n(x, dec) + NBS + '€'; }
  function e2(x) { return n(x, 2) + NBS + '€'; }
  function pc(x, dec) { return n(x * 100, dec === undefined ? 2 : dec) + NBS + '%'; }
  function pcs(x) { var v = rd(x * 100, 2); return n(v, Number.isInteger(v) ? 0 : (Number.isInteger(rd(v, 1)) ? 1 : 2)) + NBS + '%'; }
  function k(x) { return n(x, 0); }

  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function yl(y) { return y === 0 || y === undefined ? 'N' : (y > 0 ? 'N+' + y : 'N' + y); }
  function dt(d, m, y) { return (d < 10 ? '0' : '') + d + '/' + (m < 10 ? '0' : '') + m + '/' + yl(y); }
  function lastDay(m) { return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  // jours (année de 360 jours) de la date incluse au 31/12
  function joursRestants(d, m) { return (12 - m) * 30 + (30 - Math.min(d, 30) + 1); }
  // jours (360) du 01/01 à la date incluse
  function joursDepuis1Jan(d, m) { if (d >= lastDay(m)) d = 30; return (m - 1) * 30 + Math.min(d, 30); }
  function dureeTxt(j) { var mo = Math.floor(j / 30), jo = j % 30; return (mo ? mo + ' mois' : '') + (mo && jo ? ' et ' : '') + (jo ? jo + ' jour' + (jo > 1 ? 's' : '') : ''); }
  function prorataTxt(j) { return j % 30 === 0 ? (j / 30) + '/12' : j + '/360'; }

  // ---- HTML ----
  function tbl(head, rows, cls) {
    var h = '<div class="tw"><table class="' + (cls || '') + '">';
    if (head) h += '<thead><tr>' + head.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead>';
    h += '<tbody>' + rows.map(function (r) {
      var trc = '';
      if (r && r.cls) { trc = ' class="' + r.cls + '"'; r = r.cells; }
      return '<tr' + trc + '>' + r.map(function (c, i) { return '<td' + (i > 0 && /^[−\-+\d(]/.test(String(c).replace(/<[^>]+>/g, '')) ? ' class="num"' : '') + '>' + c + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
    return h;
  }
  function kv(rows) { return tbl(null, rows, 'kv'); }
  function calc(lines) { // [[libellé, calcul, résultat]]
    return tbl(['Élément', 'Calcul', 'Résultat'], lines, 'calc');
  }
  function p(s) { return '<p>' + s + '</p>'; }
  function ul(a) { return '<ul>' + a.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; }

  // ---- Comptes ----
  var PCG = {
    '101': 'Capital', '1011': 'Capital souscrit – non appelé', '1012': 'Capital souscrit – appelé, non versé', '1013': 'Capital souscrit – appelé, versé',
    '1041': 'Primes d’émission', '1061': 'Réserve légale', '1063': 'Réserves statutaires', '1068': 'Autres réserves (facultatives)',
    '109': 'Actionnaires : capital souscrit – non appelé', '110': 'Report à nouveau (solde créditeur)', '119': 'Report à nouveau (solde débiteur)',
    '120': 'Résultat de l’exercice (bénéfice)', '129': 'Résultat de l’exercice (perte)', '145': 'Amortissements dérogatoires',
    '1511': 'Provisions pour litiges', '1515': 'Provisions pour pertes de change', '1688': 'Intérêts courus sur emprunts',
    '2013': 'Frais d’augmentation de capital', '211': 'Terrains', '213': 'Constructions', '2154': 'Matériel industriel', '2182': 'Matériel de transport', '2183': 'Matériel de bureau et informatique',
    '28013': 'Amortissements des frais d’augmentation de capital', '2813': 'Amortissements des constructions', '28154': 'Amortissements du matériel industriel', '28182': 'Amortissements du matériel de transport', '28183': 'Amortissements du matériel de bureau et informatique',
    '2911': 'Dépréciations des terrains', '37': 'Stocks de marchandises', '397': 'Dépréciations des stocks de marchandises', '401': 'Fournisseurs', '404': 'Fournisseurs d’immobilisations', '408': 'Fournisseurs – factures non parvenues',
    '411': 'Clients', '416': 'Clients douteux ou litigieux', '418': 'Clients – produits non encore facturés', '4098': 'Fournisseurs – RRR à obtenir',
    '444': 'État – impôts sur les bénéfices', '4452': 'TVA due intracommunautaire', '44551': 'TVA à décaisser', '44562': 'TVA sur immobilisations',
    '44566': 'TVA sur autres biens et services', '445662': 'TVA déductible intracommunautaire', '44567': 'Crédit de TVA à reporter', '44571': 'TVA collectée',
    '44586': 'TVA sur factures non parvenues', '44587': 'TVA sur factures à établir', '457': 'Associés – dividendes à payer', '4563': 'Associés – versements reçus sur augmentation de capital',
    '462': 'Créances sur cessions d’immobilisations', '476': 'Différences de conversion – actif', '477': 'Différences de conversion – passif',
    '486': 'Charges constatées d’avance', '487': 'Produits constatés d’avance', '491': 'Dépréciations des comptes clients', '512': 'Banque',
    '6037': 'Variation des stocks de marchandises', '6061': 'Fournitures non stockables (eau, énergie)', '607': 'Achats de marchandises', '609': 'RRR obtenus sur achats', '613': 'Locations', '616': 'Primes d’assurance',
    '6226': 'Honoraires', '6241': 'Transports sur achats', '6358': 'Autres droits', '654': 'Pertes sur créances irrécouvrables', '656': 'Pertes de change sur créances et dettes commerciales',
    '657': 'Valeurs comptables des immobilisations cédées', '675': 'Valeurs comptables des éléments d’actif cédés', '6611': 'Intérêts des emprunts et dettes',
    '6811': 'Dotations aux amortissements des immobilisations', '6815': 'Dotations aux provisions d’exploitation', '6816': 'Dotations aux dépréciations des immobilisations', '6817': 'Dotations aux dépréciations des actifs circulants',
    '6865': 'Dotations aux provisions financières', '6872': 'Dotations aux provisions réglementées', '695': 'Impôts sur les bénéfices',
    '706': 'Prestations de services', '707': 'Ventes de marchandises', '756': 'Gains de change sur créances et dettes commerciales', '757': 'Produits des cessions d’immobilisations', '775': 'Produits des cessions d’éléments d’actif', '758': 'Produits divers de gestion courante',
    '7815': 'Reprises sur provisions d’exploitation', '7817': 'Reprises sur dépréciations des actifs circulants', '7865': 'Reprises sur provisions financières', '7872': 'Reprises sur provisions réglementées'
  };
  function lib(a) { return PCG[a] || ''; }

  // Équivalences admises (ancien / nouveau PCG, sous-comptes usuels)
  var ALT = {
    '44571': ['4457'], '44566': ['445661', '4456'], '44562': ['4456'], '445662': ['44566'],
    '657': ['675', '6752'], '757': ['775', '7752'], '675': ['657'], '775': ['757'],
    '1013': ['1012'], '4563': ['4562', '4561'], '462': ['512', '5121'],
    '1068': ['1062', '1064'], '6811': ['681'], '6817': ['681'], '6816': ['681'], '6815': ['681'], '6865': ['686'], '6872': ['687'],
    '7817': ['781'], '7815': ['781'], '7865': ['786'], '7872': ['787'],
    '1511': ['151'], '1515': ['151'], '37': ['370', '371'], '397': ['39', '3970'], '2911': ['291'], '491': ['4911'],
    '44551': ['4455'], '6611': ['661', '66116'], '706': ['708', '7083'], '613': ['6132'], '616': ['6161'],
    '695': ['6951'], '2013': ['201'], '28013': ['2801'], '6226': ['622', '6227', '6228'],
    '6358': ['635', '658', '678', '6788', '657', '675'], '758': ['7788', '778'],
    '404': ['512', '401'], '656': ['666'], '756': ['766']
  };
  function accepte(exp, alt, u) {
    if (!u) return 0;
    if (u === exp) return 3;
    if ((alt && alt.indexOf(u) >= 0) || (ALT[exp] && ALT[exp].indexOf(u) >= 0)) return 2;
    var sh = u.length < exp.length ? u : exp;
    if (sh.length >= 3 && (u.indexOf(exp) === 0 || exp.indexOf(u) === 0)) return 1;
    return 0;
  }

  // ---- Saisie et vérification ----
  function parseNum(s) {
    if (s === null || s === undefined) return NaN;
    s = String(s).trim().replace(/[\s  ]/g, '').replace(/€/g, '').replace(/%$/, '').replace(/^−/, '-').replace(/^\+/, '');
    if (!s) return NaN;
    if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) s = s.replace(/\./g, '');
    s = s.replace(',', '.');
    if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(s)) return NaN;
    return Number(s);
  }
  function tolDe(q) {
    if (q.tol !== undefined) return q.tol;
    switch (q.unit) {
      case '€': return Math.max(1, Math.abs(q.ans) * 0.001);
      case '%': return 0.1;
      case 'j': return 1;
      case 'u': return 0.5;
      default: return Math.max(0.01, Math.abs(q.ans) * 0.005);
    }
  }
  function checkNum(q, raw) {
    if (q.kind === 'choice') {
      if (raw === '' || raw === null || raw === undefined) return { ok: false, empty: true };
      return { ok: Number(raw) === q.ans };
    }
    var v = parseNum(raw);
    if (isNaN(v)) return { ok: false, empty: String(raw || '').trim() === '' };
    var t = tolDe(q);
    var ok = Math.abs(v - q.ans) <= t + 1e-9;
    if (!ok && q.alts) ok = q.alts.some(function (a) { return Math.abs(v - a) <= t + 1e-9; });
    if (!ok && q.unit === '%' && Math.abs(v * 100 - q.ans) <= t + 1e-9) ok = true;
    if (!ok && q.unit === 'coef' && Math.abs(v / 100 - q.ans) <= t + 1e-9) ok = true;
    return { ok: ok, v: v };
  }
  // entry : {lines:[{a, alt, d, c}]}, user : [{a, d, c}]
  function checkEntry(entry, user) {
    var exp = entry.lines.map(function (l) { return { a: l.a, alt: l.alt, side: l.d ? 'd' : 'c', mt: l.d || l.c, got: { d: 0, c: 0 }, hit: false }; });
    var extra = [];
    var tD = 0, tC = 0;
    user.forEach(function (ul) {
      var a = String(ul.a || '').replace(/\D/g, '');
      var d = parseNum(ul.d), c = parseNum(ul.c);
      d = isNaN(d) ? 0 : d; c = isNaN(c) ? 0 : c;
      if (!a && !d && !c) return;
      tD += d; tC += c;
      var side = d ? 'd' : 'c', mt = d || c;
      var best = -1, bestScore = -1;
      exp.forEach(function (x, i) {
        var lv = accepte(x.a, x.alt, a);
        if (!lv) return;
        var sc = lv * 10 + (x.side === side ? 5 : 0) + (Math.abs(x.mt - mt) <= Math.max(1, x.mt * 0.001) ? 3 : 0) + (x.hit ? 0 : 1);
        if (sc > bestScore) { bestScore = sc; best = i; }
      });
      if (best < 0) { extra.push({ a: a, d: d, c: c }); return; }
      exp[best].got.d += d; exp[best].got.c += c; exp[best].hit = true;
    });
    var okCount = 0;
    var detail = exp.map(function (x) {
      var g = x.side === 'd' ? x.got.d : x.got.c, o = x.side === 'd' ? x.got.c : x.got.d;
      var tol = Math.max(1, x.mt * 0.001);
      var st;
      if (!x.hit) st = 'manquant';
      else if (Math.abs(g - x.mt) <= tol && Math.abs(o) <= tol) { st = 'ok'; okCount++; }
      else if (Math.abs(o - x.mt) <= tol && Math.abs(g) <= tol) st = 'sens';
      else st = 'montant';
      return { a: x.a, side: x.side, mt: x.mt, st: st, got: x.got };
    });
    var score = Math.max(0, Math.min(1, (okCount - 0.5 * extra.length) / exp.length));
    return { score: score, detail: detail, extra: extra, equilibre: Math.abs(tD - tC) < 0.01, tD: tD, tC: tC };
  }

  function entryBalanced(en) {
    var d = 0, c = 0; en.lines.forEach(function (l) { d += l.d || 0; c += l.c || 0; });
    return Math.abs(d - c) < 0.005;
  }

  function L(a, d, c, extra) { var o = { a: a, d: d ? r2(d) : 0, c: c ? r2(c) : 0 }; if (extra) for (var k2 in extra) o[k2] = extra[k2]; return o; }
  function entry(date, libelle, lines) { return { date: date, lib: libelle, lines: lines.filter(function (l) { return (l.d || 0) > 0.004 || (l.c || 0) > 0.004; }) }; }
  function journalHtml(entries, pcgNew) {
    var rows = [];
    entries.forEach(function (en, i) {
      rows.push({ cls: 'jdate', cells: ['<b>' + en.date + '</b>', '<span>' + en.lib + '</span>', '', ''] });
      en.lines.forEach(function (l) {
        var a = l.show || l.a;
        rows.push({ cls: l.c ? 'jc' : 'jd', cells: ['<span class="acct">' + a + '</span>', (l.c ? '<span class="ind"></span>' : '') + (l.lib || lib(l.a)), l.d ? n(l.d, 2) : '', l.c ? n(l.c, 2) : ''] });
      });
    });
    return tbl(['Compte', 'Intitulé', 'Débit', 'Crédit'], rows, 'journal');
  }

  var NOMS = ['AUBRAC', 'BELLEDONNE', 'CALANQUES', 'DÉVOLUY', 'ESTÉREL', 'FLORAC', 'GAVARNIE', 'HOUAT', 'IROISE', 'JURANÇON', 'KERLAZ', 'LUBERON', 'MERCANTOUR', 'NÉBOUZAN', 'OUESSANT', 'PILAT', 'QUERCY', 'ROUERGUE', 'SANCY', 'TANARGUE', 'URDOS', 'VERCORS', 'VALMOREL', 'ZONZA', 'AIGOUAL', 'BRAMABIAU', 'CORBIÈRES', 'DIOIS', 'ÉCRINS', 'FANGO', 'GRÉSIVAUDAN', 'MINERVOIS', 'MORVAN', 'PÉRIGORD', 'TRIÈVES', 'VIVARAIS', 'CHARTREUSE', 'BAUGES', 'LAURAGAIS', 'MÉDOC'];
  function nom(r) { return r.pick(NOMS); }

  return {
    rng: rng, r2: r2, r0: r0, rd: rd, floorStep: floorStep, n: n, e: e, e2: e2, pc: pc, pcs: pcs, k: k,
    MOIS: MOIS, yl: yl, dt: dt, lastDay: lastDay, joursRestants: joursRestants, joursDepuis1Jan: joursDepuis1Jan, dureeTxt: dureeTxt, prorataTxt: prorataTxt,
    tbl: tbl, kv: kv, calc: calc, p: p, ul: ul, PCG: PCG, lib: lib, ALT: ALT, accepte: accepte,
    parseNum: parseNum, tolDe: tolDe, checkNum: checkNum, checkEntry: checkEntry, entryBalanced: entryBalanced,
    L: L, entry: entry, journalHtml: journalHtml, nom: nom
  };
})();

/* ===== Amortissements (partagé) ===== */
var AM = (function () {
  var r2 = U.r2;
  function coefDeg(n) { return n <= 4 ? 1.25 : (n <= 6 ? 1.75 : 2.25); }
  // Plan linéaire : départ à la date de mise en service (année 360 jours)
  function lineaire(base, n, d, m) {
    var annu = base / n, rows = [], cum = 0, vnc = base, y = 0;
    var j1 = U.joursRestants(d, m);
    var first = j1 >= 360 ? r2(annu) : r2(annu * j1 / 360);
    while (vnc > 0.004) {
      var a = y === 0 ? first : r2(annu);
      if (a > vnc - 0.004 || (y > 0 && vnc - a < 0.05)) a = vnc;
      cum = r2(cum + a); var v0 = vnc; vnc = r2(base - cum);
      rows.push({ y: y, base: base, v0: v0, a: a, cum: cum, vnc: vnc, prorata: y === 0 ? j1 : 360 });
      y++;
      if (y > 60) break;
    }
    return { annu: annu, taux: 1 / n, rows: rows, j1: j1 };
  }
  // Plan dégressif fiscal : départ le 1er jour du mois d'acquisition, n exercices
  function degressif(base, n, mAcq) {
    var c = coefDeg(n), t = c / n, rows = [], vnc = base, bascule = -1;
    var mois1 = 13 - mAcq;
    for (var k = 0; k < n; k++) {
      var rest = n - k, deg = vnc * t * (k === 0 ? mois1 / 12 : 1), lin = vnc / rest, a, mode = 'dég.';
      if (k === n - 1) { a = vnc; mode = bascule >= 0 ? 'lin.' : 'solde'; }
      else if (k > 0 && (bascule >= 0 || lin >= deg - 1e-9)) { a = lin; mode = 'lin.'; if (bascule < 0) bascule = k; }
      else a = deg;
      a = r2(a); var v0 = vnc; vnc = r2(vnc - a);
      rows.push({ y: k, v0: v0, a: a, vnc: vnc, mode: mode, rest: rest, tlin: 1 / rest });
    }
    if (bascule < 0 && n > 1) bascule = n - 1;
    return { coef: c, taux: t, rows: rows, bascule: bascule, mois1: mois1 };
  }
  return { coefDeg: coefDeg, lineaire: lineaire, degressif: degressif };
})();

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

/* ===== Immobilisations, amortissements, cessions, inventaire ===== */
function ACC(a) { return U.pcgOld ? ({ '657': '675', '757': '775', '747': '777' }[a] || a) : a; }
var BIENS = [
  { lib: 'une machine-outil', compte: '2154', amort: '28154', cat: 'matériel industriel' },
  { lib: 'une ligne d’embouteillage', compte: '2154', amort: '28154', cat: 'matériel industriel' },
  { lib: 'un bras robotisé', compte: '2154', amort: '28154', cat: 'matériel industriel' },
  { lib: 'un serveur informatique', compte: '2183', amort: '28183', cat: 'matériel informatique' },
  { lib: 'un camion frigorifique', compte: '2182', amort: '28182', cat: 'matériel de transport' }
];
function coutAcq(p) {
  var rem = U.r2(p.prix * (p.remise || 0));
  var base = U.r2(p.prix - rem);
  (p.frais || []).forEach(function (f) { if (f.incl) base = U.r2(base + f.mt); });
  return { rem: rem, base: base };
}
function coutTxt(p, ca) {
  var parts = [U.n(p.prix)];
  if (ca.rem) parts.push('− ' + U.n(ca.rem) + ' (remise)');
  (p.frais || []).forEach(function (f) { if (f.incl) parts.push('+ ' + U.n(f.mt) + ' (' + f.lib.toLowerCase() + ')'); });
  var exc = (p.frais || []).filter(function (f) { return !f.incl; }).map(function (f) { return f.lib.toLowerCase(); });
  return parts.join(' ') + (exc.length ? ' ; exclus : ' + exc.join(', ') + ' (charges)' : '');
}
function genFrais(r, prix) {
  var f = [];
  if (r.chance(0.7)) f.push({ lib: 'Frais de transport', mt: U.r0(prix * r.int(2, 5) / 100 / 10) * 10, incl: true });
  if (r.chance(0.7)) f.push({ lib: 'Frais d’installation et de montage', mt: U.r0(prix * r.int(3, 9) / 100 / 10) * 10, incl: true });
  if (r.chance(0.5)) f.push({ lib: 'Formation du personnel', mt: U.r0(prix * r.int(1, 3) / 100 / 10) * 10, incl: false });
  if (r.chance(0.3)) f.push({ lib: 'Frais de publicité pour le lancement du produit', mt: U.r0(prix * r.int(1, 3) / 100 / 10) * 10, incl: false });
  return f;
}
function planLinTable(pl) {
  return U.tbl(['Exercice', 'Base', 'Annuité', 'Cumul', 'VNC fin'], pl.rows.map(function (r) { return [U.yl(r.y) + (r.prorata < 360 ? ' (' + U.prorataTxt(r.prorata) + ')' : ''), U.n(r.base, 2), U.n(r.a, 2), U.n(r.cum, 2), U.n(r.vnc, 2)]; }));
}
function planDegTable(pd) {
  return U.tbl(['Exercice', 'VNC début', 'Taux', 'Annuité', 'VNC fin'], pd.rows.map(function (r) { return [U.yl(r.y) + (r.y === 0 ? ' (' + pd.mois1 + '/12)' : ''), U.n(r.v0, 2), r.mode === 'dég.' ? U.pcs(pd.taux) : (r.mode === 'lin.' ? 'lin. 1/' + r.rest : 'solde'), U.n(r.a, 2), U.n(r.vnc, 2)]; }));
}

/* ---------- 5. Plan d'amortissement ---------- */
T.amort = {
  id: 'amort', nom: 'Plan d’amortissement (linéaire, dégressif, variable)', famille: 'Immobilisations', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Déterminer le coût d’acquisition puis établir le plan d’amortissement linéaire, dégressif ou variable (en fonction des unités d’œuvre) avec le bon prorata.',
    cours: [
      { t: 'Point d’attention : la valeur résiduelle', l: [
        'Définition : montant, net des coûts de sortie attendus, que l’entreprise obtiendrait de la cession du bien à la fin de sa durée d’utilisation. Elle est estimée dès l’origine, pour établir le plan.',
        'Base amortissable = coût d’entrée − valeur résiduelle, mais seulement si cette valeur est à la fois significative et mesurable (véhicules ou matériels revendus bien avant leur usure complète, par exemple) ; sinon, elle est nulle et on amortit tout le coût d’entrée.',
        'Exemple : camion de 60 000 €, revendu après 4 ans pour 12 000 € (prix du marché de l’occasion) : base amortissable 48 000 €, annuité linéaire 12 000 €. La VNC en fin de plan est égale à 12 000 €, et non à zéro.',
        'Fiscalement, l’amortissement se calcule sur le coût d’entrée total, sans déduire la valeur résiduelle : l’écart entre l’amortissement fiscal et l’amortissement comptable est constaté en amortissement dérogatoire (compte 145).',
        'Révision : si l’estimation de la valeur résiduelle change de façon significative, le plan est modifié pour l’avenir (base = VNC − nouvelle valeur résiduelle, répartie sur la durée restante), sans retraiter les exercices passés.'
      ] },
      { t: 'Point d’attention : la valeur vénale', l: [
        'Définition : montant qui pourrait être obtenu, à la date de clôture, de la vente du bien lors d’une transaction conclue à des conditions normales de marché, net des coûts de sortie.',
        'À ne pas confondre avec la valeur résiduelle : la valeur vénale s’apprécie aujourd’hui, à la date de l’inventaire ; la valeur résiduelle est estimée pour la fin de l’utilisation.',
        'Test de dépréciation : en cas d’indice de perte de valeur, on compare la VNC à la valeur actuelle, qui est la plus élevée de la valeur vénale et de la valeur d’usage (avantages économiques attendus de l’utilisation du bien).',
        'Valeur actuelle < VNC : dépréciation (D 6816 / C 29xx), puis plan d’amortissement révisé pour l’avenir sur la nouvelle base (VNC dépréciée − valeur résiduelle) et la durée restante.',
        'Valeur vénale > VNC : aucune écriture ; la plus-value latente n’est jamais comptabilisée (prudence, coût historique).',
        'Valeur d’entrée : la valeur vénale sert aussi de coût d’entrée pour les biens reçus à titre gratuit ou par voie d’échange.'
      ] }
    ],
    etapes: [
      'Coût d’acquisition = prix net de remises + frais directement attribuables (transport, installation, montage, honoraires) ; on exclut la TVA récupérable, la formation du personnel, la publicité et les frais généraux.',
      'Base amortissable = coût d’acquisition − valeur résiduelle (seulement si elle est significative et mesurable ; à défaut, base = coût d’acquisition).',
      'Linéaire : annuité = base ÷ durée ; prorata au jour près (année de 360 jours) à partir de la mise en service ; la dernière annuité complète le plan (durée + 1 exercice si départ en cours d’année).',
      'Dégressif : taux = (1 ÷ durée) × coefficient (1,25 pour 3-4 ans ; 1,75 pour 5-6 ans ; 2,25 au-delà), appliqué à la VNC ; prorata en mois à partir du 1er jour du mois d’acquisition.',
      'Passage au linéaire : dès que VNC ÷ nombre d’années restantes ≥ annuité dégressive (l’année entamée compte pour une année entière).',
      'Le plan dégressif comporte exactement autant d’exercices que la durée : pas d’annuité supplémentaire.',
      'Mode variable (unités d’œuvre) : quand l’usage du bien se mesure (kilomètres, heures de fonctionnement, pièces produites), annuité = base × unités de l’exercice ÷ unités totales prévues sur la durée d’utilisation ; pas de prorata temporis, l’activité de l’exercice en tient lieu.',
      'Approche par composants : chaque composant significatif est amorti sur sa propre durée ; le terrain ne s’amortit pas.',
      'Écriture d’inventaire : D 6811 / C 28xx.'
    ],
    pieges: [
      'Prendre la date d’acquisition pour le linéaire (c’est la mise en service) ou la mise en service pour le dégressif (c’est le mois d’acquisition).',
      'Intégrer la formation du personnel dans le coût.',
      'Appliquer le taux dégressif à la valeur d’origine au lieu de la VNC.',
      'Oublier la bascule en linéaire, ou la calculer sur la durée totale au lieu de la durée restante.',
      'Amortir le terrain d’un immeuble.',
      'Mode variable : diviser par le nombre d’années au lieu du total des unités d’œuvre prévues, ou appliquer en plus un prorata temporis la première année.',
      'Confondre valeur résiduelle (estimée pour la fin de l’utilisation, elle réduit la base amortissable) et valeur vénale (prix de marché à la clôture, elle sert au test de dépréciation).',
      'Déduire une valeur résiduelle non significative, ou oublier qu’elle ne réduit pas la base fiscale (amortissement dérogatoire).',
      'Comptabiliser une hausse de la valeur vénale : seules les pertes de valeur sont constatées, par dépréciation.',
      'Le mode variable n’est admis fiscalement que s’il est économiquement justifié ; à défaut, l’écart avec le linéaire fiscal donne lieu à un amortissement dérogatoire.'
    ],
    comptes: ['2154 Matériel industriel / 2183 Matériel informatique / 213 Constructions', '6811 Dotations aux amortissements', '28154 / 28183 / 2813 Amortissements']
  },
  UO: [
    { b: 4, u: 'kilomètres parcourus', u1: 'km', tot: [150, 300], k: 1000 },
    { b: 0, u: 'heures de fonctionnement', u1: 'heures', tot: [8, 30], k: 1000 },
    { b: 2, u: 'pièces produites', u1: 'pièces', tot: [100, 600], k: 1000 }
  ],
  gen: function (r) {
    if (r.chance(0.2)) {
      // Mode variable : l'amortissement suit les unités d'œuvre consommées chaque exercice
      var uo = r.pick(this.UO), bU = BIENS[uo.b];
      var prixU = r.int(15, 150) * 1000, nU = r.int(4, 6), mU = r.int(2, 10);
      var totU = r.int(uo.tot[0], uo.tot[1]) * uo.k, w = [], sw = 0;
      for (var i = 0; i <= nU; i++) { var wi = i === 0 ? r.int(2, 6) * (13 - mU) / 12 : (i === nU ? r.int(1, 4) * (mU - 1) / 12 : r.int(6, 12)); w.push(wi); sw += wi; }
      var unites = [], acc0 = 0;
      w.forEach(function (wi, i) { var u = i < w.length - 1 ? Math.round(totU * wi / sw / 100) * 100 : totU - acc0; acc0 += u; unites.push(u); });
      if (unites.some(function (u) { return u <= 0; })) unites = null;
      if (unites) return { nom: U.nom(r), uo: uo.u, uo1: uo.u1, bien: bU, prix: prixU, remise: r.chance(0.3) ? r.pick([0.02, 0.05]) : 0, frais: genFrais(r, prixU), acq: { d: 1, m: mU }, mes: { d: 1, m: mU }, n: nU, tot: totU, unites: unites };
    }
    if (r.chance(0.25)) {
      var P = r.int(60, 400) * 10000;
      var ter = U.r0(P * r.int(10, 25) / 100 / 1000) * 1000;
      var rest = P - ter;
      var shares = [[r.int(50, 60), 'Gros œuvre', r.pick([40, 50])], [r.int(10, 18), 'Toiture et façades', r.pick([20, 25])], [r.int(12, 20), 'Installations techniques', r.pick([10, 15])]];
      var sumS = shares.reduce(function (a, b) { return a + b[0]; }, 0);
      var comps = [], acc = 0;
      shares.forEach(function (s, i) { var mt = i < shares.length - 1 ? U.r0(rest * s[0] / sumS / 1000) * 1000 : rest - acc; acc += mt; comps.push({ lib: s[1], mt: mt, n: s[2] }); });
      return { nom: U.nom(r), comp: true, P: P, terrain: ter, composants: comps, mes: { d: 1, m: r.int(2, 12) } };
    }
    var b = r.pick(BIENS.slice(0, 4));
    var prix = r.int(10, 120) * 1000;
    var n = r.pick([4, 5, 5, 8, 10]);
    var mAcq = r.int(1, 11), dAcq = r.pick([1, 1, 5, 10, 12, 18, 20]);
    var dec = r.chance(0.4);
    var mes = dec ? { d: 1, m: Math.min(12, mAcq + 1) } : { d: dAcq, m: mAcq };
    return { nom: U.nom(r), bien: b, prix: prix, remise: r.chance(0.4) ? r.pick([0.02, 0.05, 0.1]) : 0, frais: genFrais(r, prix), acq: { d: dAcq, m: mAcq }, mes: mes, n: n };
  },
  solve: function (p) {
    var e = U.e, n = U.n, L = U.L;
    if (p.comp) {
      var mois = 13 - p.mes.m, totD = 0, c = [], qs = [];
      var en = '<p>La société <b>' + p.nom + '</b> acquiert un bâtiment industriel pour ' + e(p.P) + ' HT (frais inclus), mis en service le ' + U.dt(1, p.mes.m) + '. L’approche par composants est retenue :</p>';
      en += U.tbl(['Élément', 'Montant', 'Durée'], [['Terrain', e(p.terrain), '—']].concat(p.composants.map(function (k) { return [k.lib, e(k.mt), k.n + ' ans']; })));
      en += '<p class="consigne">Calculez la base amortissable, la dotation de N de chaque composant et la dotation totale ; passez l’écriture au 31/12/N.</p>';
      var base = U.r2(p.P - p.terrain);
      qs.push(Q('base', 'Base amortissable totale', base, '€'));
      c.push(['Base amortissable', n(p.P) + ' − ' + n(p.terrain) + ' (le terrain ne s’amortit pas)', e(base)]);
      p.composants.forEach(function (k, i) {
        var d = U.r2(k.mt / k.n * mois / 12); totD = U.r2(totD + d);
        qs.push(Q('c' + i, 'Dotation N – ' + k.lib.toLowerCase(), d, '€'));
        c.push([k.lib, n(k.mt) + ' ÷ ' + k.n + ' × ' + mois + '/12', e(d)]);
      });
      qs.push(Q('tot', 'Dotation totale de N', totD, '€'));
      c.push(['Dotation totale', '', '<b>' + e(totD) + '</b>']);
      var com = 'L’approche par composants découpe l’immeuble en éléments dont les durées d’utilisation diffèrent nettement : la toiture ou les installations seront remplacées bien avant le gros œuvre. Amortir chaque composant sur sa propre durée donne une charge plus fidèle à la consommation réelle des avantages économiques. Le terrain, dont la durée d’utilisation est illimitée, n’est jamais amorti ; seule une dépréciation peut constater une perte de valeur. La dotation de N (' + e(totD) + ') ne porte que sur ' + mois + ' mois, du ' + U.dt(1, p.mes.m) + ' au 31/12/N. Lors du remplacement d’un composant, sa valeur nette sortira de l’actif et le nouveau composant sera immobilisé. Cette méthode, obligatoire en PCG pour les composants significatifs, augmente les dotations des premières années par rapport à un amortissement global sur la durée du gros œuvre.';
      return { enonce: en, questions: qs, journal: [U.entry('31/12/N', 'Dotation aux amortissements du bâtiment', [L('6811', totD, 0), L('2813', 0, totD)])], steps: [{ h: 'Dotations par composant', html: U.calc(c) }], comment: com };
    }
    if (p.unites) return this.solveUO(p);
    var ca = coutAcq(p), base = ca.base;
    var pl = AM.lineaire(base, p.n, p.mes.d, p.mes.m), pd = AM.degressif(base, p.n, p.acq.m);
    var b = p.bien;
    var en2 = '<p>La société <b>' + p.nom + '</b> a acquis le ' + U.dt(p.acq.d, p.acq.m) + ' ' + b.lib + ', mis' + (/^une/.test(b.lib) ? 'e' : '') + ' en service le ' + U.dt(p.mes.d, p.mes.m) + '. Extrait de la facture (montants HT, TVA 20 % récupérable) :</p>';
    var fr = [['Prix catalogue', e(p.prix)]];
    if (p.remise) fr.push(['Remise', U.pcs(p.remise)]);
    (p.frais || []).forEach(function (f) { fr.push([f.lib, e(f.mt)]); });
    en2 += U.kv(fr);
    en2 += '<p>Durée d’utilisation : ' + p.n + ' ans. Le bien est éligible à l’amortissement dégressif. Exercice clos le 31/12.</p>';
    en2 += '<p class="consigne">1. Calculez le coût d’acquisition. 2. Établissez le plan d’amortissement linéaire. 3. Établissez le plan dégressif que l’entreprise pourrait pratiquer. 4. Passez la dotation linéaire du 31/12/N.</p>';
    var r1 = pl.rows[1] || { a: 0, vnc: 0 };
    var opts = []; for (var y = 1; y < p.n; y++) opts.push('N+' + y);
    var qs2 = [Q('cout', 'Coût d’acquisition', base, '€'), Q('l0', 'Annuité linéaire de N', pl.rows[0].a, '€'), Q('l1', 'Annuité linéaire de N+1', r1.a, '€'), Q('v1', 'VNC linéaire au 31/12/N+1', r1.vnc, '€'),
      Q('td', 'Taux dégressif', U.rd(pd.taux * 100, 3), '%', { tol: 0.02 }), Q('d0', 'Annuité dégressive de N', pd.rows[0].a, '€'), Q('d1', 'Annuité dégressive de N+1', pd.rows[1].a, '€'),
      QC('bas', 'Premier exercice amorti en linéaire dans le plan dégressif', opts, pd.bascule - 1)];
    var c2 = [['Coût d’acquisition', coutTxt(p, ca), '<b>' + e(base) + '</b>'],
      ['Annuité linéaire pleine', n(base) + ' ÷ ' + p.n, e(U.r2(pl.annu))],
      ['Annuité linéaire N', n(base) + ' × ' + U.pcs(1 / p.n) + ' × ' + U.prorataTxt(pl.j1) + ' (du ' + U.dt(p.mes.d, p.mes.m) + ' au 31/12 : ' + U.dureeTxt(pl.j1) + ')', e(pl.rows[0].a)],
      ['Taux dégressif', U.pcs(1 / p.n) + ' × ' + n(pd.coef, 2), U.pcs(pd.taux)],
      ['Annuité dégressive N', n(base) + ' × ' + U.pcs(pd.taux) + ' × ' + pd.mois1 + '/12 (à partir du 1er ' + U.MOIS[p.acq.m - 1] + ')', e(pd.rows[0].a)],
      ['Annuité dégressive N+1', n(pd.rows[1].v0, 2) + ' × ' + U.pcs(pd.taux), e(pd.rows[1].a)],
      ['Bascule en linéaire', 'en ' + U.yl(pd.bascule) + ' : ' + n(pd.rows[pd.bascule].v0, 2) + ' ÷ ' + pd.rows[pd.bascule].rest + ' = ' + n(pd.rows[pd.bascule].v0 / pd.rows[pd.bascule].rest, 2) + ' ≥ ' + n(pd.rows[pd.bascule].v0 * pd.taux, 2), U.yl(pd.bascule)]];
    var com2 = 'L’amortissement constate la consommation des avantages économiques du bien : la base de ' + e(base) + ' ne retient que les coûts nécessaires pour mettre le bien en état de fonctionner' + ((p.frais || []).some(function (f) { return !f.incl; }) ? ', les autres frais restant en charges de l’exercice' : '') + '. En linéaire, la charge est constante (' + e(U.r2(pl.annu)) + ' par an), proratisée la première année à partir de la mise en service, ce qui reporte un reliquat sur un ' + (pl.rows.length > p.n ? (pl.rows.length) + 'e exercice' : 'exercice final') + '. Le dégressif concentre la charge sur les premières années (' + e(pd.rows[0].a) + ' dès N malgré le prorata) : il traduit mieux l’obsolescence rapide de certains équipements et procure un avantage fiscal de trésorerie, l’impôt étant différé. Il ne s’applique qu’aux biens neufs d’au moins 3 ans figurant sur la liste légale. Si l’entreprise conserve le linéaire en comptabilité et déduit le dégressif fiscalement, l’écart sera constaté en amortissement dérogatoire (compte 145). La VNC au 31/12/N+1 (' + e(r1.vnc) + ') sera la référence pour calculer une éventuelle plus ou moins-value de cession.';
    return { enonce: en2, questions: qs2, journal: [U.entry('31/12/N', 'Dotation aux amortissements (linéaire)', [L('6811', pl.rows[0].a, 0), L(b.amort, 0, pl.rows[0].a)])], steps: [{ h: 'Calculs', html: U.calc(c2) }, { h: 'Plan linéaire', html: planLinTable(pl) }, { h: 'Plan dégressif', html: planDegTable(pd) }], comment: com2 };
  },
  planUO: function (p) {
    var base = coutAcq(p).base, rows = [], cum = 0;
    p.unites.forEach(function (u, y) {
      var a = y === p.unites.length - 1 ? U.r2(base - cum) : U.r2(base * u / p.tot);
      cum = U.r2(cum + a); rows.push({ y: y, u: u, a: a, cum: cum, vnc: U.r2(base - cum) });
    });
    return { base: base, rows: rows };
  },
  solveUO: function (p) {
    var e = U.e, n = U.n, L = U.L, ca = coutAcq(p), pu = this.planUO(p), base = pu.base, b = p.bien, r0 = pu.rows[0], r1 = pu.rows[1];
    var en = '<p>La société <b>' + p.nom + '</b> a acquis et mis en service le ' + U.dt(1, p.acq.m) + ' ' + b.lib + '. Extrait de la facture (montants HT, TVA 20 % récupérable) :</p>';
    var fr = [['Prix catalogue', e(p.prix)]];
    if (p.remise) fr.push(['Remise', U.pcs(p.remise)]);
    (p.frais || []).forEach(function (f) { fr.push([f.lib, e(f.mt)]); });
    en += U.kv(fr);
    en += '<p>L’usure du bien dépend directement de son utilisation : la société l’amortit en fonction des ' + p.uo + ' ; leur total prévu sur la durée d’utilisation est de ' + n(p.tot) + ' ' + p.uo1 + '. Prévisions d’utilisation :</p>';
    en += U.tbl(['Exercice'].concat(p.unites.map(function (u, y) { return U.yl(y); })), [[p.uo1.charAt(0).toUpperCase() + p.uo1.slice(1)].concat(p.unites.map(function (u) { return n(u); }))]);
    en += '<p class="consigne">1. Calculez le coût d’acquisition. 2. Établissez le plan d’amortissement selon le mode variable (unités d’œuvre). 3. Comparez la dotation de N avec celle d’un amortissement linéaire sur ' + p.n + ' ans. 4. Passez la dotation du 31/12/N.</p>';
    var lin = AM.lineaire(base, p.n, 1, p.acq.m).rows[0].a;
    var qs = [Q('cout', 'Coût d’acquisition', base, '€'), Q('cu', 'Coût d’amortissement pour 1 000 ' + p.uo1, U.r2(base * 1000 / p.tot), '€'), Q('a0', 'Dotation de N (mode variable)', r0.a, '€'), Q('a1', 'Dotation de N+1 (mode variable)', r1.a, '€'), Q('v1', 'VNC au 31/12/N+1', r1.vnc, '€'), Q('lin', 'Dotation de N en linéaire (pour comparaison)', lin, '€')];
    var c = [['Coût d’acquisition', coutTxt(p, ca), '<b>' + e(base) + '</b>'], ['Coût par unité d’œuvre', n(base) + ' ÷ ' + n(p.tot) + ' ' + p.uo1, n(base / p.tot, 4) + ' € par ' + p.uo1.replace(/s$/, '') + ', soit ' + e(U.r2(base * 1000 / p.tot)) + ' pour 1 000 ' + p.uo1],
      ['Dotation N', n(base) + ' × ' + n(r0.u) + ' ÷ ' + n(p.tot), '<b>' + e(r0.a) + '</b>'], ['Dotation N+1', n(base) + ' × ' + n(r1.u) + ' ÷ ' + n(p.tot), e(r1.a)],
      ['Linéaire N (comparaison)', n(base) + ' ÷ ' + p.n + ' × ' + (13 - p.acq.m) + '/12', e(lin)]];
    var plan = U.tbl(['Exercice', 'Unités d’œuvre', 'Calcul', 'Annuité', 'Cumul', 'VNC fin'], pu.rows.map(function (r, i) { return [U.yl(r.y), n(r.u), i === pu.rows.length - 1 ? 'solde' : n(base) + ' × ' + n(r.u) + ' / ' + n(p.tot), n(r.a, 2), n(r.cum, 2), n(r.vnc, 2)]; }));
    var com = 'Le mode variable rattache la charge d’amortissement à l’usage effectif du bien : il convient aux équipements dont l’usure dépend de l’activité (' + p.uo + ') plutôt que du temps. Chaque ' + p.uo1.replace(/s$/, '') + ' consomme ' + n(base / p.tot, 4) + ' € de la valeur amortissable. En N, la dotation (' + e(r0.a) + ') est ' + (r0.a > lin ? 'supérieure' : 'inférieure') + ' à celle du linéaire (' + e(lin) + ') : elle suit le niveau réel d’utilisation et n’a pas besoin de prorata temporis, puisque les unités consommées ne portent que sur la période de mise en service. Ce mode reflète mieux la consommation des avantages économiques, mais il suppose une estimation fiable du total des unités, à revoir si l’utilisation prévue change (l’amortissement est alors modifié pour l’avenir). Fiscalement, il n’est admis que s’il est économiquement justifié ; à défaut, la différence avec le linéaire fiscal serait constatée en amortissement dérogatoire.';
    return { enonce: en, questions: qs, journal: [U.entry('31/12/N', 'Dotation aux amortissements (mode variable)', [L('6811', r0.a, 0), L(b.amort, 0, r0.a)])], steps: [{ h: 'Calculs', html: U.calc(c) }, { h: 'Plan d’amortissement selon les unités d’œuvre', html: plan }], comment: com };
  }
};

/* ---------- 6. Amortissement dérogatoire ---------- */
function planDerog(p, base) {
  var pl = AM.lineaire(base, p.n, p.mes.d, p.mes.m);
  var pf = p.fiscal === 'lin' ? AM.lineaire(base, p.nF, p.mes.d, p.mes.m) : AM.degressif(base, p.n, p.mes.m);
  var ny = Math.max(pl.rows.length, pf.rows.length), rows = [], solde = 0;
  for (var y = 0; y < ny; y++) {
    var a = pl.rows[y] ? pl.rows[y].a : 0, f = pf.rows[y] ? pf.rows[y].a : 0, d = U.r2(f - a);
    solde = U.r2(solde + d);
    rows.push({ y: y, c: a, f: f, d: d, solde: solde });
  }
  return { pl: pl, pf: pf, rows: rows };
}
T.derog = {
  id: 'derog', nom: 'Amortissement dérogatoire', famille: 'Immobilisations', ctrl: true, minutes: 18,
  fiche: {
    objectif: 'Construire en parallèle le plan comptable et le plan fiscal, puis le tableau des dotations et reprises d’amortissement dérogatoire.',
    etapes: [
      'Base commune : coût d’acquisition HT (prix + frais accessoires, hors formation).',
      'Plan comptable : linéaire sur la durée d’utilisation, depuis la mise en service.',
      'Plan fiscal : dégressif (1er jour du mois d’acquisition, n exercices) ou linéaire sur la durée d’usage fiscale plus courte.',
      'Dérogatoire de l’exercice = fiscal − comptable : positif → dotation (D 6872 / C 145) ; négatif → reprise (D 145 / C 7872).',
      'Le solde du 145 revient à zéro en fin de plan : total des dotations = total des reprises.',
      'Au 31/12 : deux écritures, la dotation comptable (6811 / 28) et le dérogatoire (6872 / 145).'
    ],
    pieges: [
      'Constater le dérogatoire dans le compte 28 : il va au 145 (provision réglementée, capitaux propres).',
      'Oublier les reprises des dernières années, quand le fiscal devient inférieur au comptable.',
      'Décaler le prorata : 6/12 pour un départ au 1er juillet dans les deux plans, mais le dégressif part du 1er jour du mois d’acquisition.',
      'Le plan fiscal dégressif finit un exercice avant le plan linéaire quand celui-ci démarre en cours d’année.'
    ],
    comptes: ['6811 / 28154 Amortissements comptables', '6872 Dotations aux provisions réglementées', '145 Amortissements dérogatoires', '7872 Reprises sur provisions réglementées']
  },
  gen: function (r) {
    var b = r.pick(BIENS.slice(0, 4));
    var prix = r.int(8, 90) * 1000 + r.pick([0, 500]);
    var lin = r.chance(0.25);
    var n = lin ? r.pick([6, 8, 10]) : r.pick([4, 5, 8, 10]);
    var m = r.int(1, 12);
    var p = { nom: U.nom(r), bien: b, prix: prix, remise: 0, frais: genFrais(r, prix), mes: { d: 1, m: m }, n: n, fiscal: lin ? 'lin' : 'deg' };
    if (lin) p.nF = r.pick([3, 4, 5].filter(function (x) { return x < n; }));
    return p;
  },
  solve: function (p) {
    var e = U.e, n = U.n, L = U.L, ca = coutAcq(p), base = ca.base, P = planDerog(p, base), b = p.bien;
    var en = '<p>La société <b>' + p.nom + '</b> a acquis et mis en service le ' + U.dt(p.mes.d, p.mes.m) + ' ' + b.lib + '. Facture (montants HT, TVA 20 % récupérable) :</p>';
    var fr = [['Prix d’achat', e(p.prix)]]; (p.frais || []).forEach(function (f) { fr.push([f.lib, e(f.mt)]); });
    en += U.kv(fr);
    en += p.fiscal === 'deg' ? '<p>Le bien est amorti en linéaire sur ' + p.n + ' ans en comptabilité ; fiscalement, l’entreprise pratique l’amortissement dégressif. Exercice clos le 31/12.</p>'
      : '<p>Le bien est amorti en linéaire sur sa durée d’utilisation de ' + p.n + ' ans ; fiscalement, l’entreprise l’amortit en linéaire sur la durée d’usage admise de ' + p.nF + ' ans. Exercice clos le 31/12.</p>';
    en += '<p class="consigne">1. Établissez le plan d’amortissement comptable, le plan fiscal et le tableau de l’amortissement dérogatoire. 2. Comptabilisez les dotations au 31/12/N.</p>';
    var r0 = P.rows[0], r1 = P.rows[1], r2r = P.rows[2];
    var firstRep = -1; P.rows.forEach(function (x) { if (firstRep < 0 && x.d < 0) firstRep = x.y; });
    var opts = []; for (var y = 1; y < P.rows.length; y++) opts.push(U.yl(y));
    var qs = [Q('cout', 'Base amortissable', base, '€'), Q('c0', 'Amortissement comptable de N', r0.c, '€'), Q('f0', 'Amortissement fiscal de N', r0.f, '€'), Q('d0', 'Dotation au dérogatoire de N', r0.d, '€'),
      Q('f1', 'Amortissement fiscal de N+1', r1.f, '€'), Q('s2', 'Solde du compte 145 au 31/12/N+2', r2r.solde, '€'), QC('rep', 'Premier exercice de reprise du dérogatoire', opts, firstRep - 1)];
    var c = [['Base', coutTxt(p, ca), '<b>' + e(base) + '</b>'], ['Comptable N', n(base) + ' × ' + U.pcs(1 / p.n) + ' × ' + U.prorataTxt(P.pl.j1), e(r0.c)]];
    if (p.fiscal === 'deg') {
      c.push(['Taux dégressif', U.pcs(1 / p.n) + ' × ' + n(P.pf.coef, 2), U.pcs(P.pf.taux)]);
      c.push(['Fiscal N', n(base) + ' × ' + U.pcs(P.pf.taux) + ' × ' + P.pf.mois1 + '/12', e(r0.f)]);
      c.push(['Fiscal N+1', n(P.pf.rows[1].v0, 2) + ' × ' + U.pcs(P.pf.taux), e(r1.f)]);
      c.push(['Bascule', 'linéaire à partir de ' + U.yl(P.pf.bascule) + ' (' + P.pf.rows[P.pf.bascule].rest + ' années restantes)', '']);
    } else {
      c.push(['Fiscal N', n(base) + ' × ' + U.pcs(1 / p.nF) + ' × ' + U.prorataTxt(P.pl.j1), e(r0.f)]);
    }
    c.push(['Dérogatoire N', n(r0.f) + ' − ' + n(r0.c), '<b>' + e(r0.d) + '</b>']);
    var tab = U.tbl(['Exercice', 'Comptable', 'Fiscal', 'Dotation (+) / reprise (−)', 'Solde 145'], P.rows.map(function (x) { return [U.yl(x.y), n(x.c, 2), n(x.f, 2), (x.d > 0 ? '+' : '') + n(x.d, 2), n(x.solde, 2)]; }).concat([{ cls: 'tot', cells: ['Total', n(base, 2), n(base, 2), '0,00', ''] }]));
    var journal = [U.entry('31/12/N', 'Dotation aux amortissements', [L('6811', r0.c, 0), L(b.amort, 0, r0.c)]), U.entry('31/12/N', 'Amortissement dérogatoire', [L('6872', r0.d, 0), L('145', 0, r0.d)])];
    var maxS = Math.max.apply(null, P.rows.map(function (x) { return x.solde; }));
    var com = 'Le plan comptable traduit la consommation réelle du bien (linéaire sur ' + p.n + ' ans), tandis que le plan fiscal ' + (p.fiscal === 'deg' ? 'accélère la déduction grâce au dégressif' : 'utilise la durée d’usage plus courte admise par l’administration') + '. Pour bénéficier fiscalement de cet excédent, l’entreprise doit le comptabiliser : c’est l’amortissement dérogatoire, une provision réglementée inscrite dans les capitaux propres (compte 145), sans lien avec une dépréciation réelle. En N, le fiscal dépasse le comptable de ' + e(r0.d) + ', ce qui réduit le résultat imposable et diffère l’impôt. Le compte 145 culmine à ' + e(maxS) + ', puis les reprises' + (firstRep > 0 ? ' à partir de ' + U.yl(firstRep) : '') + ' le ramènent à zéro : sur la durée totale, l’avantage est un simple décalage de trésorerie, pas une économie définitive. En analyse financière, le 145 est classé en capitaux propres (ressource stable) et ses dotations sont ajoutées pour calculer la CAF. En cas de cession avant la fin du plan, le solde restant serait repris en totalité.';
    return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Calculs', html: U.calc(c) }, { h: 'Tableau du dérogatoire', html: tab }, { h: 'Plan comptable', html: planLinTable(P.pl) }, { h: 'Plan fiscal', html: p.fiscal === 'deg' ? planDegTable(P.pf) : planLinTable(P.pf) }], comment: com };
  }
};

/* ---------- 7. Cession d'immobilisation ---------- */
T.cession = {
  id: 'cession', nom: 'Cession d’immobilisation', famille: 'Immobilisations', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Comptabiliser la sortie d’un bien cédé et calculer le résultat de cession.',
    etapes: [
      'Cumul des amortissements au 31/12/N-1 (prorata la première année).',
      'Dotation complémentaire de N : du 1er janvier à la date de cession (année de 360 jours).',
      'VNC = valeur d’origine − cumul total des amortissements.',
      'Résultat de cession = prix de cession HT − VNC (plus-value si positif).',
      'Écritures : (1) dotation complémentaire D 6811 / C 28 ; (2) sortie D 28 (cumul) + D 657 (VNC) / C 21 (valeur d’origine) ; (3) prix D 462 ou 512 / C 757 + C 44571 si cession soumise à TVA ; (4) reprise du dérogatoire restant D 145 / C 7872.'
    ],
    pieges: [
      'Oublier la dotation complémentaire jusqu’à la date de cession.',
      'Calculer le résultat avec le prix TTC.',
      'Comptabiliser la plus-value directement : on enregistre séparément la VNC (charge) et le prix (produit).',
      'Comptes : PCG 2025 → 657 / 757 ; ancien PCG → 675 / 775 (les deux sont acceptés).',
      'La cession d’un matériel ayant ouvert droit à déduction est soumise à TVA.'
    ],
    comptes: ['6811 / 28 Amortissements', '657 (ancien 675) Valeur comptable des immobilisations cédées', '757 (ancien 775) Produits des cessions', '462 Créances sur cessions d’immobilisations', '145 / 7872 Dérogatoire']
  },
  gen: function (r) {
    var b = r.pick(BIENS);
    var V = r.int(15, 150) * 1000, n = r.pick([4, 5, 6, 8, 10]);
    var k = r.int(1, n - 1);
    var p = { nom: U.nom(r), bien: b, V: V, n: n, acq: { m: r.int(1, 12), y: -k }, ces: { d: r.pick([15, 30, 31]), m: r.int(2, 11) }, s145: 0 };
    if (p.ces.d >= 30) p.ces.d = U.lastDay(p.ces.m);
    var s = this.calc(Object.assign({ prix: 0 }, p));
    p.prix = U.r0(s.vnc * r.int(50, 160) / 100 / 100) * 100;
    if (r.chance(0.25)) p.s145 = U.r0(V * r.int(3, 10) / 100);
    return p;
  },
  calc: function (p) {
    var annu = p.V / p.n, cum = 0, y;
    for (y = p.acq.y; y < 0; y++) { var a = y === p.acq.y ? annu * (13 - p.acq.m) / 12 : annu; cum = U.r2(cum + Math.min(U.r2(a), p.V - cum)); }
    var j = U.joursDepuis1Jan(p.ces.d, p.ces.m);
    var dot = Math.min(U.r2(annu * j / 360), U.r2(p.V - cum));
    var cumT = U.r2(cum + dot), vnc = U.r2(p.V - cumT), res = U.r2(p.prix - vnc);
    return { annu: annu, cum: cum, j: j, dot: dot, cumT: cumT, vnc: vnc, res: res, tva: U.r2(p.prix * 0.2) };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n, L = U.L, b = p.bien;
    var dc = U.dt(p.ces.d, p.ces.m);
    var en = '<p>La société <b>' + p.nom + '</b> a acquis le ' + U.dt(1, p.acq.m, p.acq.y) + ' ' + b.lib + ' pour ' + e(p.V) + ' HT, amorti' + (/^une/.test(b.lib) ? 'e' : '') + ' en linéaire sur ' + p.n + ' ans. Le bien est cédé le ' + dc + ' pour ' + e(p.prix) + ' HT (TVA 20 %), payable à 30 jours.' + (p.s145 ? ' Le compte 145 relatif à ce bien présente un solde de ' + e(p.s145) + '.' : '') + '</p>';
    en += '<p class="consigne">1. Calculez le cumul des amortissements, la valeur nette comptable et le résultat de cession. 2. Passez les écritures du ' + dc + '.</p>';
    var qs = [Q('cum', 'Cumul des amortissements au 31/12/N-1', x.cum, '€'), Q('dot', 'Dotation complémentaire de N', x.dot, '€'), Q('vnc', 'Valeur nette comptable à la date de cession', x.vnc, '€'), Q('res', 'Résultat de cession (négatif si moins-value)', x.res, '€')];
    var det = [];
    for (var y = p.acq.y; y < 0; y++) det.push(U.yl(y) + ' : ' + (y === p.acq.y ? n(p.V) + ' ÷ ' + p.n + ' × ' + (13 - p.acq.m) + '/12' : n(U.r2(x.annu))));
    var c = [['Annuité pleine', n(p.V) + ' ÷ ' + p.n, e(U.r2(x.annu))], ['Cumul au 31/12/N-1', det.join(' ; '), e(x.cum)],
      ['Dotation N', n(U.r2(x.annu)) + ' × ' + U.prorataTxt(x.j) + ' (du 01/01 au ' + dc + ')', e(x.dot)], ['Cumul total', n(x.cum) + ' + ' + n(x.dot), e(x.cumT)],
      ['VNC', n(p.V) + ' − ' + n(x.cumT), '<b>' + e(x.vnc) + '</b>'], ['Résultat de cession', n(p.prix) + ' − ' + n(x.vnc), '<b>' + (x.res >= 0 ? 'plus-value ' : 'moins-value ') + e(Math.abs(x.res)) + '</b>']];
    var journal = [U.entry(dc, 'Dotation complémentaire', [L('6811', x.dot, 0), L(b.amort, 0, x.dot)]),
      U.entry(dc, 'Sortie du bien cédé', [L(b.amort, x.cumT, 0), L(ACC('657'), x.vnc, 0), L(b.compte, 0, p.V)]),
      U.entry(dc, 'Prix de cession', [L('462', U.r2(p.prix + x.tva), 0), L(ACC('757'), 0, p.prix), L('44571', 0, x.tva)])];
    if (p.s145) journal.push(U.entry(dc, 'Reprise du dérogatoire', [L('145', p.s145, 0), L('7872', 0, p.s145)]));
    if (p.s145) qs.push(Q('rep', 'Reprise du dérogatoire', p.s145, '€'));
    var com = 'Avant de sortir le bien, on constate l’amortissement de N jusqu’au jour de la cession (' + e(x.dot) + '), pour que la VNC reflète la consommation réelle. La cession dégage une ' + (x.res >= 0 ? 'plus-value' : 'moins-value') + ' de ' + e(Math.abs(x.res)) + ' : le prix ' + (x.res >= 0 ? 'dépasse' : 'est inférieur à') + ' la valeur nette comptable de ' + e(x.vnc) + '. Comptablement, elle n’apparaît pas sur une ligne unique : la VNC est une charge (' + ACC('657') + ') et le prix un produit (' + ACC('757') + '), classés en exploitation dans le PCG 2025 (en exceptionnel dans l’ancien plan). ' + (x.res >= 0 ? 'Une plus-value régulière peut traduire un plan d’amortissement trop rapide.' : 'Une moins-value importante peut révéler une durée d’amortissement trop longue ou une obsolescence non anticipée.') + ' Pour la CAF, la VNC et le prix de cession sont neutralisés : la cession relève de l’investissement, pas de l’exploitation, et le prix figurera dans les ressources du tableau de financement. La cession étant soumise à TVA, l’entreprise collecte ' + e(x.tva) + '.' + (p.s145 ? ' Le dérogatoire restant (' + e(p.s145) + ') est repris en totalité, ce qui augmente le résultat imposable de l’exercice.' : '');
    return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Calculs', html: U.calc(c) }], comment: com };
  }
};

/* ---------- 8. Dépréciations et provisions ---------- */
var CLIENTS = ['Dupuis', 'Martin', 'Lefèvre', 'Garnier', 'Roussel', 'Chevalier', 'Perrin', 'Morel', 'Fontaine', 'Blanchard'];
T.depreciations = {
  id: 'depreciations', nom: 'Dépréciations et provisions', famille: 'Travaux d’inventaire', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Constater à l’inventaire les pertes de valeur des actifs (dépréciations) et les passifs probables (provisions), et ajuster celles qui existent.',
    etapes: [
      'Créance douteuse : virer la créance TTC du 411 au 416 ; déprécier la base HT × pourcentage de perte (la TVA sera récupérée en cas de perte) : D 6817 / C 491.',
      'Dépréciation existante : dépréciation nécessaire − dépréciation existante ; positif → dotation complémentaire, négatif → reprise (D 491 / C 7817).',
      'Créance irrécouvrable : D 654 (HT) + D 44571 (TVA) / C 416 (TTC) ; puis reprise totale de la dépréciation.',
      'Stocks : comparer coût et valeur actuelle ; reprendre la dépréciation de N-1 (D 397 / C 7817) et constater la nouvelle (D 6817 / C 397).',
      'Immobilisation non amortissable (terrain) : D 6816 / C 2911.',
      'Provision pour risques (litige, garantie) : obligation envers un tiers + sortie de ressources probable sans contrepartie + estimation fiable → D 6815 / C 1511.'
    ],
    pieges: [
      'Déprécier le montant TTC d’une créance.',
      'Oublier le transfert 411 → 416 l’année où la créance devient douteuse (une seule fois).',
      'Créance irrécouvrable : oublier la reprise de la dépréciation, ou la récupération de TVA.',
      'Confondre dépréciation (perte de valeur d’un actif, comptes 29 à 59) et provision (passif probable, compte 15).',
      'Programme contrôleur : pas de provisions pour risques.'
    ],
    comptes: ['416 Clients douteux', '491 Dépréciations des comptes clients', '397 Dépréciations des stocks', '2911 Dépréciations des terrains', '1511 Provisions pour litiges', '654 Pertes sur créances irrécouvrables', '6815 / 6816 / 6817 Dotations', '7815 / 7817 Reprises']
  },
  gen: function (r, opt) {
    var pool = ['douteux', 'ajust', 'irrec', 'stock', 'terrain'];
    if (!opt || opt.profil !== 'C') pool.push('litige', 'litige');
    var items = r.pickN(pool, r.int(3, 4)).map(function (k) {
      var cl = r.pick(CLIENTS);
      switch (k) {
        case 'douteux': return { k: k, cl: cl, ttc: r.int(5, 80) * 120, p: r.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7]) };
        case 'ajust': return { k: k, cl: cl, ttc: r.int(5, 80) * 120, p0: r.pick([0.2, 0.3, 0.4, 0.5]), p1: r.pick([0.1, 0.25, 0.6, 0.7, 0.8]) };
        case 'irrec': return { k: k, cl: cl, ttc: r.int(5, 60) * 120, p0: r.pick([0.3, 0.4, 0.5, 0.6]) };
        case 'stock': var S = r.int(20, 200) * 1000; return { k: k, S: S, V: U.r0(S * r.int(70, 97) / 100 / 10) * 10, D0: r.chance(0.7) ? r.int(1, 20) * 250 : 0 };
        case 'terrain': var Ct = r.int(50, 300) * 1000; return { k: k, C: Ct, V: U.r0(Ct * r.int(70, 95) / 100 / 1000) * 1000 };
        default: return { k: 'litige', obj: r.pick(['Un salarié licencié réclame des dommages et intérêts aux prud’hommes', 'Un client réclame une indemnité pour un retard de livraison', 'Un concurrent engage une action pour contrefaçon']), est: r.int(3, 60) * 1000, prev: r.chance(0.4) ? r.int(2, 40) * 1000 : 0 };
      }
    });
    return { nom: U.nom(r), items: items };
  },
  solve: function (p) {
    var e = U.e, n = U.n, L = U.L, li = [], qs = [], c = [], journal = [], com = [];
    p.items.forEach(function (it, i) {
      var id = 'i' + i;
      if (it.k === 'douteux') {
        var ht = U.r2(it.ttc / 1.2), dep = U.r2(ht * it.p);
        li.push('La créance du client ' + it.cl + ' (' + e(it.ttc) + ' TTC) devient douteuse : il est en redressement judiciaire et la perte est estimée à ' + U.pcs(it.p) + '.');
        qs.push(Q(id, 'Dépréciation de la créance ' + it.cl, dep, '€'));
        c.push(['Client ' + it.cl, n(it.ttc) + ' ÷ 1,2 = ' + n(ht) + ' HT × ' + U.pcs(it.p), e(dep)]);
        journal.push(U.entry('31/12/N', 'Client ' + it.cl + ' douteux', [L('416', it.ttc, 0), L('411', 0, it.ttc)]));
        journal.push(U.entry('31/12/N', 'Dépréciation de la créance ' + it.cl, [L('6817', dep, 0), L('491', 0, dep)]));
        com.push('La créance ' + it.cl + ' est dépréciée sur sa base hors taxes, car la TVA sera récupérée si la perte se confirme.');
      } else if (it.k === 'ajust') {
        var ht2 = U.r2(it.ttc / 1.2), d0 = U.r2(ht2 * it.p0), d1 = U.r2(ht2 * it.p1), dd = U.r2(d1 - d0);
        li.push('Le client douteux ' + it.cl + ' doit toujours ' + e(it.ttc) + ' TTC ; la créance était dépréciée de ' + e(d0) + ' (' + U.pcs(it.p0) + ' du HT). La perte est désormais estimée à ' + U.pcs(it.p1) + '.');
        qs.push(Q(id, 'Ajustement de la dépréciation ' + it.cl + ' (+ dotation, − reprise)', dd, '€'));
        c.push(['Client ' + it.cl, n(ht2) + ' × ' + U.pcs(it.p1) + ' = ' + n(d1) + ' nécessaire − ' + n(d0) + ' existante', '<b>' + (dd > 0 ? 'dotation ' : 'reprise ') + e(Math.abs(dd)) + '</b>']);
        if (dd > 0) journal.push(U.entry('31/12/N', 'Dotation complémentaire ' + it.cl, [L('6817', dd, 0), L('491', 0, dd)]));
        if (dd < 0) journal.push(U.entry('31/12/N', 'Reprise de dépréciation ' + it.cl, [L('491', -dd, 0), L('7817', 0, -dd)]));
        com.push('Pour ' + it.cl + ', seule la différence entre la dépréciation nécessaire et l’existante est comptabilisée (' + (dd > 0 ? 'dotation complémentaire' : 'reprise') + ').');
      } else if (it.k === 'irrec') {
        var ht3 = U.r2(it.ttc / 1.2), tv = U.r2(it.ttc - ht3), d03 = U.r2(ht3 * it.p0);
        li.push('La créance douteuse du client ' + it.cl + ' (' + e(it.ttc) + ' TTC, dépréciée de ' + e(d03) + ' en N-1) est définitivement irrécouvrable (clôture pour insuffisance d’actif).');
        qs.push(Q(id, 'Perte sur créance irrécouvrable ' + it.cl + ' (HT)', ht3, '€'));
        qs.push(Q(id + 'b', 'Reprise de la dépréciation ' + it.cl, d03, '€'));
        c.push(['Client ' + it.cl, 'perte HT ' + n(it.ttc) + ' ÷ 1,2 ; TVA récupérée ' + n(tv) + ' ; reprise de ' + n(d03), e(ht3)]);
        journal.push(U.entry('31/12/N', 'Créance ' + it.cl + ' irrécouvrable', [L('654', ht3, 0), L('44571', tv, 0, { lib: 'TVA collectée (récupérée)' }), L('416', 0, it.ttc)]));
        journal.push(U.entry('31/12/N', 'Reprise de la dépréciation ' + it.cl, [L('491', d03, 0), L('7817', 0, d03)]));
        com.push('La créance ' + it.cl + ' étant perdue, la perte HT passe en charge, la TVA est récupérée et la dépréciation devenue sans objet est reprise : l’impact net sur le résultat de N n’est que de ' + e(U.r2(ht3 - d03)) + '.');
      } else if (it.k === 'stock') {
        var dn = U.r2(it.S - it.V);
        li.push('Le stock final de marchandises est évalué au coût d’achat à ' + e(it.S) + ' ; sa valeur actuelle est de ' + e(it.V) + '. ' + (it.D0 ? 'Le compte 397 présente un solde de ' + e(it.D0) + ' (dépréciation du stock de N-1).' : 'Aucune dépréciation n’existait.') + ' L’entreprise reprend la dépréciation antérieure et constitue la nouvelle.');
        qs.push(Q(id, 'Dépréciation du stock final', dn, '€'));
        c.push(['Stock', (it.D0 ? 'reprise de ' + n(it.D0) + ' ; ' : '') + 'dotation ' + n(it.S) + ' − ' + n(it.V), e(dn)]);
        if (it.D0) journal.push(U.entry('31/12/N', 'Reprise de la dépréciation du stock initial', [L('397', it.D0, 0), L('7817', 0, it.D0)]));
        journal.push(U.entry('31/12/N', 'Dépréciation du stock final', [L('6817', dn, 0), L('397', 0, dn)]));
        com.push('Le stock est inscrit au plus faible du coût et de la valeur actuelle : la dépréciation de ' + e(dn) + ' applique le principe de prudence sans modifier la valeur d’origine.');
      } else if (it.k === 'terrain') {
        var dt2 = U.r2(it.C - it.V);
        li.push('Un terrain acquis ' + e(it.C) + ' a une valeur vénale estimée à ' + e(it.V) + ' en raison d’un projet de déviation routière.');
        qs.push(Q(id, 'Dépréciation du terrain', dt2, '€'));
        c.push(['Terrain', n(it.C) + ' − ' + n(it.V), e(dt2)]);
        journal.push(U.entry('31/12/N', 'Dépréciation du terrain', [L('6816', dt2, 0), L('2911', 0, dt2)]));
        com.push('Le terrain, non amortissable, ne peut perdre de la valeur comptable que par une dépréciation.');
      } else {
        var dl = U.r2(it.est - it.prev);
        li.push(it.obj + '. L’avocat estime la condamnation probable, pour ' + e(it.est) + '.' + (it.prev ? ' Une provision de ' + e(it.prev) + ' avait été constituée en N-1 pour ce litige.' : ''));
        qs.push(Q(id, 'Provision pour litige : ' + (it.prev ? 'ajustement (+ dotation, − reprise)' : 'dotation'), dl, '€'));
        c.push(['Litige', it.prev ? n(it.est) + ' − ' + n(it.prev) + ' existante' : 'estimation de l’avocat', e(dl)]);
        if (dl > 0) journal.push(U.entry('31/12/N', 'Provision pour litige', [L('6815', dl, 0), L('1511', 0, dl)]));
        if (dl < 0) journal.push(U.entry('31/12/N', 'Reprise partielle de la provision pour litige', [L('1511', -dl, 0), L('7815', 0, -dl)]));
        com.push('La provision pour litige est justifiée : il existe une obligation envers un tiers, la sortie de ressources est probable sans contrepartie et son montant est estimé de façon fiable ; c’est un passif, pas la dépréciation d’un actif.');
      }
    });
    var en = '<p>Travaux d’inventaire de la société <b>' + p.nom + '</b> au 31/12/N (TVA 20 %) :</p>' + '<ol>' + li.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol><p class="consigne">Calculez les montants et passez les écritures au 31/12/N.</p>';
    com.unshift('Ces écritures appliquent le principe de prudence : les pertes probables sont constatées dès la clôture, les gains latents ne le sont jamais.');
    com.push('Dotations et reprises sont des charges et produits calculés, sans effet sur la trésorerie : ils sont neutralisés dans le calcul de la CAF.');
    com.push('Chaque dépréciation sera réexaminée à la clôture suivante et ajustée ou reprise.');
    return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Calculs', html: U.calc(c) }], comment: com.join(' ') };
  }
};

/* ---------- 9. Régularisations de charges et produits ---------- */
T.regul = {
  id: 'regul', nom: 'Régularisations de charges et produits', famille: 'Travaux d’inventaire', ctrl: true, minutes: 12,
  fiche: {
    objectif: 'Rattacher à chaque exercice les charges et produits qui le concernent (indépendance des exercices).',
    etapes: [
      'Charge payée en N pour N+1 : charge constatée d’avance, D 486 / C 6xx pour la part de N+1 (au prorata des mois).',
      'Produit perçu en N pour N+1 : produit constaté d’avance, D 7xx / C 487.',
      'Charge de N non encore facturée : D 6xx (HT) + D 44586 (TVA) / C 408 (TTC).',
      'Produit de N non encore facturé : D 418 (TTC) / C 7xx (HT) + C 44587 (TVA).',
      'Intérêts courus sur emprunt : capital restant dû × taux × mois écoulés depuis la dernière échéance ÷ 12 : D 6611 / C 1688.',
      'Avoir à recevoir : D 4098 (TTC) / C 609 (HT) + C 44586 (TVA).',
      'Toutes ces écritures sont contrepassées à l’ouverture de N+1.'
    ],
    pieges: [
      'Charges et produits constatés d’avance : montants HT, sans TVA.',
      'Compter les mois : une prime payée le 1er octobre pour 12 mois couvre 3 mois de N et 9 mois de N+1.',
      'Factures non parvenues : la TVA passe au 44586 (pas au 44566, elle n’est pas encore déductible).',
      'Intérêts courus : partir de la dernière échéance, pas de la date de l’emprunt si une échéance a déjà été payée.'
    ],
    comptes: ['486 Charges constatées d’avance', '487 Produits constatés d’avance', '408 Fournisseurs – factures non parvenues', '418 Clients – produits non encore facturés', '44586 / 44587 TVA sur factures', '1688 Intérêts courus', '4098 RRR à obtenir']
  },
  gen: function (r) {
    var pool = ['cca_assur', 'cca_loyer', 'pca', 'fnp', 'fae', 'icne', 'aar'];
    var items = r.pickN(pool, 4).map(function (k) {
      switch (k) {
        case 'cca_assur': return { k: k, mt: r.int(12, 120) * 120, m: r.int(2, 12) };
        case 'cca_loyer': var per = r.pick([3, 6]); return { k: k, per: per, mt: r.int(5, 60) * 300, m: r.int(14 - per, 12) };
        case 'pca': var per2 = r.pick([3, 6]); return { k: k, per: per2, mt: r.int(4, 40) * 600, m: r.int(14 - per2, 12) };
        case 'fnp': return { k: k, nat: r.pick([['électricité de décembre', '6061'], ['honoraires de l’expert-comptable', '6226'], ['transport sur achats de décembre', '6241']]), ht: r.int(5, 120) * 50 };
        case 'fae': return { k: k, ht: r.int(10, 200) * 100 };
        case 'icne': return { k: k, K: r.int(5, 50) * 10000, t: r.pick([0.025, 0.03, 0.035, 0.04, 0.045, 0.05]), m: r.int(2, 11) };
        default: return { k: 'aar', ht: r.int(5, 80) * 100 };
      }
    });
    return { nom: U.nom(r), items: items };
  },
  solve: function (p) {
    var e = U.e, n = U.n, L = U.L, li = [], qs = [], c = [], journal = [];
    p.items.forEach(function (it, i) {
      var id = 'i' + i, m = it.m, d1 = it.m ? U.dt(1, it.m) : '';
      if (it.k === 'cca_assur') {
        var nN1 = m - 1, cca = U.r2(it.mt * nN1 / 12);
        li.push('La prime annuelle d’assurance de ' + e(it.mt) + ', payée le ' + d1 + ', couvre la période du ' + d1 + ' au ' + U.dt(U.lastDay(m - 1), m - 1, 1) + '.');
        qs.push(Q(id, 'Charge constatée d’avance (assurance)', cca, '€'));
        c.push(['Assurance', n(it.mt) + ' × ' + nN1 + '/12 (mois de N+1)', e(cca)]);
        journal.push(U.entry('31/12/N', 'Assurance constatée d’avance', [L('486', cca, 0), L('616', 0, cca)]));
      } else if (it.k === 'cca_loyer') {
        var inN = 13 - m, nN1b = it.per - inN, ccb = U.r2(it.mt * nN1b / it.per);
        li.push('Le loyer ' + (it.per === 3 ? 'trimestriel' : 'semestriel') + ' de ' + e(it.mt) + ' HT, payé d’avance le ' + d1 + ', couvre ' + it.per + ' mois à compter de cette date.');
        qs.push(Q(id, 'Charge constatée d’avance (loyer)', ccb, '€'));
        c.push(['Loyer payé', n(it.mt) + ' × ' + nN1b + '/' + it.per + ' (' + nN1b + ' mois sur N+1)', e(ccb)]);
        journal.push(U.entry('31/12/N', 'Loyer constaté d’avance', [L('486', ccb, 0), L('613', 0, ccb)]));
      } else if (it.k === 'pca') {
        var inN2 = 13 - m, nN1c = it.per - inN2, pca = U.r2(it.mt * nN1c / it.per);
        li.push('La société loue un entrepôt inutilisé ; elle a encaissé le ' + d1 + ' le loyer ' + (it.per === 3 ? 'trimestriel' : 'semestriel') + ' d’avance de ' + e(it.mt) + ' HT, comptabilisé en produits.');
        qs.push(Q(id, 'Produit constaté d’avance', pca, '€'));
        c.push(['Loyer perçu', n(it.mt) + ' × ' + nN1c + '/' + it.per, e(pca)]);
        journal.push(U.entry('31/12/N', 'Loyer perçu d’avance', [L('706', pca, 0, { alt: ['7083', '708', '752'], show: '7083', lib: 'Locations diverses' }), L('487', 0, pca)]));
      } else if (it.k === 'fnp') {
        var tv = U.r2(it.ht * 0.2);
        li.push('La facture ' + (/^[aeiouéh]/i.test(it.nat[0]) ? 'd’' : 'de ') + it.nat[0] + ' (' + e(it.ht) + ' HT, TVA 20 %) ne sera reçue qu’en janvier N+1.');
        qs.push(Q(id, 'Montant TTC des factures non parvenues', U.r2(it.ht + tv), '€'));
        c.push(['Facture non parvenue', n(it.ht) + ' + 20 %', e(U.r2(it.ht + tv))]);
        journal.push(U.entry('31/12/N', 'Facture non parvenue', [L(it.nat[1], it.ht, 0), L('44586', tv, 0), L('408', 0, U.r2(it.ht + tv))]));
      } else if (it.k === 'fae') {
        var tv2 = U.r2(it.ht * 0.2);
        li.push('Des marchandises livrées le 28/12/N à un client pour ' + e(it.ht) + ' HT seront facturées en janvier N+1.');
        qs.push(Q(id, 'Montant TTC des produits à facturer', U.r2(it.ht + tv2), '€'));
        c.push(['Facture à établir', n(it.ht) + ' + 20 %', e(U.r2(it.ht + tv2))]);
        journal.push(U.entry('31/12/N', 'Facture à établir', [L('418', U.r2(it.ht + tv2), 0), L('707', 0, it.ht), L('44587', 0, tv2)]));
      } else if (it.k === 'icne') {
        var mo = 13 - m, ic = U.r2(it.K * it.t * mo / 12);
        li.push('Un emprunt dont le capital restant dû est de ' + e(it.K) + ' (taux ' + U.pcs(it.t) + ') a son échéance annuelle le ' + U.dt(1, m).slice(0, 5) + ' de chaque année ; la dernière échéance a été payée le ' + d1 + '.');
        qs.push(Q(id, 'Intérêts courus non échus', ic, '€'));
        c.push(['Intérêts courus', n(it.K) + ' × ' + U.pcs(it.t) + ' × ' + mo + '/12', e(ic)]);
        journal.push(U.entry('31/12/N', 'Intérêts courus', [L('6611', ic, 0), L('1688', 0, ic)]));
      } else {
        var tv3 = U.r2(it.ht * 0.2);
        li.push('Le principal fournisseur accordera une ristourne de ' + e(it.ht) + ' HT sur les achats de N ; l’avoir sera reçu en février N+1.');
        qs.push(Q(id, 'Avoir à recevoir TTC', U.r2(it.ht + tv3), '€'));
        c.push(['Avoir à recevoir', n(it.ht) + ' + 20 %', e(U.r2(it.ht + tv3))]);
        journal.push(U.entry('31/12/N', 'Avoir à recevoir', [L('4098', U.r2(it.ht + tv3), 0), L('609', 0, it.ht), L('44586', 0, tv3)]));
      }
    });
    var en = '<p>Informations d’inventaire de la société <b>' + p.nom + '</b> au 31/12/N (TVA 20 %) :</p><ol>' + li.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol><p class="consigne">Calculez les montants et passez les écritures de régularisation au 31/12/N.</p>';
    var com = 'Ces écritures appliquent le principe d’indépendance des exercices : chaque exercice doit supporter les charges et les produits qui le concernent, quelle que soit la date du paiement ou de la facture. Les charges et produits constatés d’avance retirent du résultat de N la part qui concerne N+1, toujours hors taxes. Les factures non parvenues, les factures à établir et les intérêts courus ajoutent au contraire des éléments déjà nés en N mais pas encore facturés ou échus ; la TVA correspondante transite par des comptes d’attente (44586, 44587) car elle n’est ni déductible ni exigible avant la facture. Au bilan, ces montants apparaissent en comptes de régularisation et en dettes ou créances. Toutes ces écritures seront contrepassées à l’ouverture de N+1, pour que la facture ou le paiement réel s’enregistre normalement. En analyse fonctionnelle, les charges et produits constatés d’avance d’exploitation entrent dans le BFRE, et les intérêts courus dans les dettes hors exploitation.';
    return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Calculs', html: U.calc(c) }], comment: com };
  }
};

/* ---------- 18. Stocks au coût moyen pondéré ---------- */
var MARCHANDISES = [['casques de vélo', 'casque'], ['théières en fonte', 'théière'], ['lampes frontales', 'lampe'], ['sacs à dos', 'sac'], ['bouilloires', 'bouilloire'], ['tapis de yoga', 'tapis'], ['gourdes isothermes', 'gourde']];
T.stocks = {
  id: 'stocks', nom: 'Stocks : CMUP et PEPS', famille: 'Travaux d’inventaire', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Valoriser les sorties et le stock final au coût unitaire moyen pondéré (CMUP), de fin de période ou après chaque entrée, ou selon la méthode « premier entré, premier sorti » (PEPS), puis passer les écritures d’inventaire.',
    etapes: [
      'Coût d’entrée = prix d’achat net de remises + frais accessoires (transport), hors TVA récupérable.',
      'CMUP de fin de période = (valeur du stock initial + coût des entrées) ÷ (quantité initiale + quantités entrées). Toutes les sorties de la période partent à ce coût unique.',
      'CMUP après chaque entrée : à chaque entrée, nouveau coût = (valeur du stock + coût de l’entrée) ÷ (quantité en stock + quantité entrée) ; les sorties suivantes partent à ce coût jusqu’à l’entrée suivante.',
      'Stock final = quantité restante × CMUP (arrondi au centime).',
      'PEPS (premier entré, premier sorti, ou FIFO) : chaque sortie consomme d’abord les lots les plus anciens, à leur coût d’entrée ; quand un lot est épuisé, on passe au suivant. Le stock final est constitué des lots les plus récents.',
      'Inventaire intermittent au 31/12 : annuler le stock initial (D 6037 / C 37), puis constater le stock final (D 37 / C 6037).',
      'Variation de stock (6037) = stock initial − stock final : un stock qui augmente diminue les charges et augmente le résultat.',
      'Dépréciation si la valeur actuelle (prix de vente estimé − frais de vente) est inférieure au coût : (coût − valeur actuelle) × quantité, D 6817 / C 397.'
    ],
    pieges: [
      'Oublier le stock initial dans le calcul du CMUP de fin de période.',
      'Méthode permanente : valoriser une sortie au CMUP en vigueur à sa date, pas au CMUP de fin de période.',
      'PEPS : une sortie qui chevauche deux lots se valorise en deux tranches, à deux coûts différents ; ne pas la valoriser au coût du dernier achat.',
      'Le DEPS (dernier entré, premier sorti, ou LIFO) est interdit en PCG comme en IFRS : seuls le CMUP et le PEPS sont admis pour les biens interchangeables.',
      'En période de hausse des prix, le PEPS donne un stock final plus élevé et un coût des ventes plus faible que le CMUP, donc un résultat plus élevé.',
      'Inverser les deux écritures d’inventaire : le stock initial sort par le crédit du 37, le stock final y entre au débit.',
      'Le stock se déprécie, il ne s’amortit pas ; la dépréciation est reprise l’exercice suivant (D 397 / C 7817).'
    ],
    comptes: ['37 Stocks de marchandises', '6037 Variation des stocks de marchandises', '607 Achats de marchandises', '397 Dépréciations des stocks de marchandises', '6817 Dotations aux dépréciations des actifs circulants']
  },
  gen: function (r) {
    for (var t = 0; t < 200; t++) {
      var c0 = r.int(60, 900) / 10, q0 = r.int(2, 40) * 10;
      var q1 = r.int(5, 60) * 10, c1 = U.r2(c0 * r.int(92, 118) / 100);
      var s1 = r.int(1, Math.floor((q0 + q1) * 0.8 / 10)) * 10;
      var q2 = r.int(5, 60) * 10, c2 = U.r2(c1 * r.int(92, 118) / 100);
      var s2 = r.int(1, Math.floor((q0 + q1 - s1 + q2) * 0.8 / 10)) * 10;
      if (q0 + q1 + q2 - s1 - s2 < 10 || c1 === c0 || c2 === c1) continue;
      var m = [r.int(2, 3), r.int(4, 5), r.int(6, 8), r.int(9, 11)];
      var p = { nom: U.nom(r), mar: r.pick(MARCHANDISES), q0: q0, c0: c0, ev: [{ k: 'e', q: q1, c: c1, d: U.dt(r.int(2, 27), m[0]) }, { k: 's', q: s1, d: U.dt(r.int(2, 27), m[1]) }, { k: 'e', q: q2, c: c2, d: U.dt(r.int(2, 27), m[2]) }, { k: 's', q: s2, d: U.dt(r.int(2, 27), m[3]) }] };
      if (r.chance(0.5)) p.va = U.r2(this.calc(p).cmup * r.int(80, 95) / 100);
      return p;
    }
  },
  calc: function (p) {
    var x = { V0: U.r2(p.q0 * p.c0), qin: 0, vin: 0, qout: 0 };
    p.ev.forEach(function (ev) { if (ev.k === 'e') { x.qin += ev.q; x.vin = U.r2(x.vin + ev.q * ev.c); } else x.qout += ev.q; });
    x.qf = p.q0 + x.qin - x.qout;
    x.cmupX = (x.V0 + x.vin) / (p.q0 + x.qin); x.cmup = U.r2(x.cmupX);
    x.sf = U.r2(x.qf * x.cmup); x.sfX = U.r2(x.qf * x.cmupX);
    x.cs = U.r2(x.qout * x.cmup); x.csX = U.r2(x.qout * x.cmupX);
    x.vari = U.r2(x.V0 - x.sf);
    // Méthode permanente : le coût change à chaque entrée, chaque sortie part au coût du moment
    var q = p.q0, v = x.V0, cu = p.c0, cuX = p.c0, vX = x.V0;
    x.fiche = [{ d: '01/01/N', lib: 'Stock initial', st: [q, cu, v] }];
    x.cmups = [];
    p.ev.forEach(function (ev) {
      if (ev.k === 'e') {
        var ve = U.r2(ev.q * ev.c);
        cuX = (vX + ve) / (q + ev.q); vX = vX + ve;
        cu = U.r2((v + ve) / (q + ev.q)); q += ev.q; v = U.r2(q * cu);
        x.cmups.push(cu);
        x.fiche.push({ d: ev.d, lib: 'Achat', en: [ev.q, ev.c, ve], st: [q, cu, v] });
      } else {
        var vs = U.r2(ev.q * cu); vX -= ev.q * cuX; q -= ev.q; v = U.r2(q * cu);
        x.fiche.push({ d: ev.d, lib: 'Vente', so: [ev.q, cu, vs], st: [q, cu, v] });
      }
    });
    x.sfp = v; x.sfpX = U.r2(vX);
    // PEPS : file des lots, les sorties consomment les plus anciens
    var lots = [{ q: p.q0, c: p.c0 }];
    x.peps = [{ d: '01/01/N', lib: 'Stock initial', lots: lots.map(function (l) { return { q: l.q, c: l.c }; }) }]; x.csPeps = 0;
    p.ev.forEach(function (ev) {
      if (ev.k === 'e') { lots.push({ q: ev.q, c: ev.c }); x.peps.push({ d: ev.d, lib: 'Achat', en: { q: ev.q, c: ev.c }, lots: lots.map(function (l) { return { q: l.q, c: l.c }; }) }); return; }
      var reste = ev.q, tr = [];
      while (reste > 0) { var l = lots[0], pris = Math.min(reste, l.q); tr.push({ q: pris, c: l.c }); l.q -= pris; reste -= pris; if (!l.q) lots.shift(); }
      var vs = U.r2(tr.reduce(function (a, t) { return a + t.q * t.c; }, 0)); x.csPeps = U.r2(x.csPeps + vs);
      x.peps.push({ d: ev.d, lib: 'Vente', so: tr, vs: vs, lots: lots.map(function (l) { return { q: l.q, c: l.c }; }) });
    });
    x.sfPeps = U.r2(lots.reduce(function (a, l) { return a + l.q * l.c; }, 0)); x.lotsF = lots;
    if (p.va) { x.depU = U.r2(x.cmup - p.va); x.dep = U.r2(x.qf * x.depU); }
    return x;
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, e2 = U.e2, n = U.n, L = U.L;
    var mv = p.ev.map(function (ev) { return ev.d + ' : ' + (ev.k === 'e' ? 'achat de ' + n(ev.q) + ' ' + p.mar[0] + ' au coût unitaire de ' + e2(ev.c) + ' HT' : 'vente de ' + n(ev.q) + ' ' + p.mar[0]) + ' ;'; });
    var en = '<p>La société <b>' + p.nom + '</b> commercialise des ' + p.mar[0] + '. Au 01/01/N, le stock comprend ' + n(p.q0) + ' ' + p.mar[0] + ' évalués à ' + e2(p.c0) + ' l’unité. Mouvements de l’exercice N :</p>';
    en += U.ul(mv);
    en += '<p>Elle tient son inventaire de façon intermittente : le stock n’est enregistré en comptabilité qu’à la clôture.' + (p.va ? ' Au 31/12/N, la concurrence a fait baisser les prix : la valeur actuelle d’un ' + p.mar[1] + ' (prix de vente estimé diminué des frais de vente) n’est plus que de ' + e2(p.va) + '.' : '') + '</p>';
    en += '<p class="consigne">1. Calculez le CMUP de fin de période, le coût des sorties et la valeur du stock final. 2. Établissez la fiche de stock au CMUP après chaque entrée, puis selon la méthode PEPS, et comparez. 3. Passez les écritures d’inventaire au 31/12/N' + (p.va ? ', dépréciation comprise' : '') + ' (stock final au CMUP de fin de période).</p>';
    var qs = [Q('cmup', 'CMUP de fin de période', x.cmup, '€', { tol: 0.01 }), Q('qf', 'Quantité en stock au 31/12/N', x.qf, 'u', { tol: 0 }),
      Q('cs', 'Coût des sorties au CMUP de fin de période', x.cs, '€', { alts: [x.csX] }), Q('sf', 'Stock final au CMUP de fin de période', x.sf, '€', { alts: [x.sfX] }),
      Q('cm2', 'CMUP après la seconde entrée (méthode permanente)', x.cmups[1], '€', { tol: 0.01 }), Q('sfp', 'Stock final au CMUP après chaque entrée', x.sfp, '€', { alts: [x.sfpX] }),
      Q('csp', 'Coût des sorties selon le PEPS', x.csPeps, '€'), Q('sfps', 'Stock final selon le PEPS', x.sfPeps, '€'),
      Q('var', 'Variation des stocks (compte 6037 : stock initial − stock final)', x.vari, '€')];
    if (p.va) qs.push(Q('dep', 'Dépréciation du stock au 31/12/N', x.dep, '€'));
    var c = [['Valeur du stock initial', n(p.q0) + ' × ' + n(p.c0, 2), e(x.V0)]];
    p.ev.forEach(function (ev) { if (ev.k === 'e') c.push(['Achat du ' + ev.d, n(ev.q) + ' × ' + n(ev.c, 2), e(U.r2(ev.q * ev.c))]); });
    c.push(['CMUP de fin de période', '(' + n(x.V0) + ' + ' + n(x.vin) + ') ÷ (' + n(p.q0) + ' + ' + n(x.qin) + ') = ' + n(x.cmupX, 4), '<b>' + e2(x.cmup) + '</b>'],
      ['Quantité finale', n(p.q0) + ' + ' + n(x.qin) + ' − ' + n(x.qout), n(x.qf) + ' unités'], ['Coût des sorties', n(x.qout) + ' × ' + n(x.cmup, 2), e(x.cs)],
      ['Stock final', n(x.qf) + ' × ' + n(x.cmup, 2), '<b>' + e(x.sf) + '</b>'], ['Variation des stocks', n(x.V0) + ' − ' + n(x.sf), e(x.vari)]);
    if (p.va) c.push(['Dépréciation', n(x.qf) + ' × (' + n(x.cmup, 2) + ' − ' + n(p.va, 2) + ')', '<b>' + e(x.dep) + '</b>']);
    var tri = function (a) { return a ? [n(a[0]), n(a[1], 2), n(a[2], 2)] : ['', '', '']; };
    var fs = U.tbl(['Date', 'Libellé', 'Entrées Q', 'CU', 'Montant', 'Sorties Q', 'CU', 'Montant', 'Stock Q', 'CU', 'Montant'], x.fiche.map(function (l) { return [l.d, l.lib].concat(tri(l.en), tri(l.so), tri(l.st)); }));
    var lt = function (a) { return a.length ? a.map(function (l) { return n(l.q) + ' × ' + n(l.c, 2); }).join(' + ') : '—'; };
    var fp = U.tbl(['Date', 'Opération', 'Valorisation', 'Stock restant (lots)'], x.peps.map(function (l) {
      return [l.d, l.lib, l.en ? 'entrée : ' + n(l.en.q) + ' × ' + n(l.en.c, 2) : l.so ? 'sortie : ' + lt(l.so) + ' = ' + n(l.vs, 2) : n(U.r2(p.q0 * p.c0), 2), lt(l.lots)];
    }));
    fp += U.calc([['Coût des sorties PEPS', 'somme des sorties', '<b>' + e(x.csPeps) + '</b>'], ['Stock final PEPS', lt(x.lotsF), '<b>' + e(x.sfPeps) + '</b>'], ['Contrôle', n(x.V0) + ' + ' + n(x.vin) + ' − ' + n(x.csPeps), e(U.r2(x.V0 + x.vin - x.csPeps))]]);
    var journal = [U.entry('31/12/N', 'Annulation du stock initial', [L('6037', x.V0, 0), L('37', 0, x.V0)]), U.entry('31/12/N', 'Constatation du stock final', [L('37', x.sf, 0), L('6037', 0, x.sf)])];
    if (p.va) journal.push(U.entry('31/12/N', 'Dépréciation du stock de marchandises', [L('6817', x.dep, 0), L('397', 0, x.dep)]));
    var hausse = p.ev[2].c > p.c0, ecart = U.r2(x.sfp - x.sf);
    var com = 'Le CMUP de fin de période (' + e2(x.cmup) + ') lisse les ' + (hausse ? 'hausses' : 'variations') + ' de prix de l’exercice : toutes les sorties partent au même coût, mais ce coût n’est connu qu’à la clôture, ce qui interdit de suivre la marge au fil des ventes. ';
    com += 'Le CMUP après chaque entrée suit mieux les prix récents : le stock final vaut ' + e(x.sfp) + ' contre ' + e(x.sf) + ', soit un écart de ' + e(Math.abs(ecart)) + (Math.abs(ecart) < 1 ? ', négligeable ici. ' : ' : la méthode choisie modifie le coût des ventes et donc le résultat. ');
    var dP = U.r2(x.sfPeps - x.sf);
    com += 'Selon le PEPS, les sorties consomment d’abord les lots les plus anciens : le stock final, composé des derniers achats, vaut ' + e(x.sfPeps) + (Math.abs(dP) < 1 ? ', presque autant qu’au CMUP. ' : ', soit ' + e(Math.abs(dP)) + (dP > 0 ? ' de plus' : ' de moins') + ' qu’au CMUP de fin de période : ' + (dP > 0 ? 'les prix ayant monté, le PEPS valorise le stock aux coûts récents et affiche un coût des ventes plus faible, donc un résultat plus élevé. ' : 'les derniers achats étant moins chers, le PEPS donne un stock plus faible et un coût des ventes plus élevé, donc un résultat moindre. ')) + 'Le PEPS et le CMUP sont les deux seules méthodes admises ; le DEPS (dernier entré, premier sorti) est interdit. La méthode retenue doit être appliquée de façon permanente. ';
    com += 'La variation des stocks (' + e(x.vari) + ') ' + (x.vari < 0 ? 'est créditrice : le stock a augmenté, ce qui réduit les charges de l’exercice. Les achats non vendus ne pèsent pas sur le résultat de N.' : 'est débitrice : le stock a diminué, l’entreprise a vendu une partie du stock initial, ce qui alourdit les charges de l’exercice.') + ' ';
    com += p.va ? 'La dépréciation de ' + e(x.dep) + ' applique la prudence : le stock ne peut figurer au bilan pour plus que sa valeur actuelle. Elle sera reprise en N+1, à la vente des marchandises ou si les prix se redressent.' : 'Aucune dépréciation n’est nécessaire si la valeur actuelle des ' + p.mar[0] + ' reste supérieure à leur coût.';
    return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'CMUP de fin de période', html: U.calc(c) }, { h: 'Fiche de stock au CMUP après chaque entrée', html: fs }, { h: 'Fiche de stock selon le PEPS', html: fp }], comment: com };
  }
};

/* ===== Augmentation de capital, comptabilité de gestion ===== */

/* ---------- 10. Augmentation de capital ---------- */
T.augcap = {
  id: 'augcap', nom: 'Augmentation de capital', famille: 'Comptabilité des sociétés', ctrl: false, minutes: 18,
  fiche: {
    objectif: 'Comptabiliser une augmentation de capital (numéraire ou incorporation de réserves) et calculer la valeur du droit préférentiel de souscription ou du droit d’attribution.',
    etapes: [
      'Modalités : apports en numéraire, apports en nature, incorporation de réserves, conversion de dettes (compensation de créances), paiement du dividende en actions.',
      'Prix d’émission = nominal + prime d’émission. Prime totale = (prix d’émission − nominal) × nombre d’actions nouvelles.',
      'Libération minimale à la souscription : 1/4 du nominal + la totalité de la prime ; le solde est appelé dans les 5 ans.',
      'Souscription : D 109 (non appelé) + D 4563 (sommes à verser) / C 1011 (non appelé) + C 1013 (appelé versé) + C 1041 (prime).',
      'Versement des fonds : D 512 / C 4563.',
      'DPS : valeur après = (N × V + n × E) ÷ (N + n) ; DPS = V − valeur après. Droit d’attribution (actions gratuites) : V − N × V ÷ (N + n).',
      'Frais : imputés sur la prime d’émission (D 1041), ou en charges ; certains sujets les inscrivent en frais d’établissement (2013) amortis sur 5 ans au plus : suis la consigne de l’énoncé.'
    ],
    pieges: [
      'Oublier que la prime est intégralement libérée dès la souscription.',
      'Mettre la prime d’émission dans le capital.',
      'TVA sur les frais : 20 % du HT (le corrigé officiel du sujet test indique 400 € pour 4 000 € HT, c’est une coquille : 800 €).',
      'Amortissement des frais d’établissement au prorata à partir de la date de l’opération.',
      'Incorporation de réserves : aucun mouvement de trésorerie, D 1068 / C 1013.'
    ],
    comptes: ['109 Actionnaires – capital souscrit non appelé', '1011 / 1012 / 1013 Capital souscrit', '1041 Primes d’émission', '4563 Associés – versements reçus sur augmentation de capital', '2013 Frais d’augmentation de capital', '1068 Autres réserves']
  },
  gen: function (r) {
    var v = r.pick([10, 15, 20, 50, 100]), N = r.int(2, 40) * 1000, par = r.pick([2, 4, 5, 8, 10]), n = N / par;
    var V = U.r0(v * r.int(13, 30) / 10);
    if (r.chance(0.25)) return { nom: U.nom(r), mode: 'res', v: v, N: N, n: n, V: V, date: { d: 1, m: r.int(3, 10) } };
    var E = U.r0(v + (V - v) * r.int(3, 8) / 10);
    if (E <= v) E = v + 1;
    var m = r.int(2, 10);
    var fm = r.pick(['prime', 'prime', 'charges', 'etab']);
    return { nom: U.nom(r), mode: 'num', v: v, N: N, n: n, V: V, E: E, lib: r.pick([0.25, 0.25, 0.5, 1]), frais: r.int(4, 40) * 500, fraisMode: fm, date: { d: 1, m: m }, vers: { d: r.int(10, 25), m: m } };
  },
  solve: function (p) {
    var e = U.e, n = U.n, L = U.L, qs = [], c = [], journal = [], en, com;
    var dA = U.dt(p.date.d, p.date.m);
    if (p.mode === 'res') {
      var inc = U.r2(p.n * p.v), apres = U.r2(p.N * p.V / (p.N + p.n)), da = U.r2(p.V - apres);
      en = '<p>Le capital de la société <b>' + p.nom + '</b> est composé de ' + n(p.N) + ' actions de nominal ' + e(p.v) + ', cotées ' + e(p.V) + '. Le ' + dA + ', elle augmente son capital par incorporation de réserves facultatives, en attribuant gratuitement ' + n(p.n) + ' actions nouvelles.</p>';
      en += '<p class="consigne">1. Calculez le montant incorporé, la valeur théorique de l’action après l’opération et la valeur du droit d’attribution. 2. Comptabilisez l’opération.</p>';
      qs = [Q('inc', 'Montant des réserves incorporées', inc, '€'), Q('par', 'Nombre d’actions anciennes pour 1 action nouvelle', p.N / p.n, 'u', { tol: 0 }), Q('ap', 'Valeur théorique après l’opération', apres, '€', { tol: 0.01 }), Q('da', 'Valeur du droit d’attribution', da, '€', { tol: 0.01 })];
      c = [['Réserves incorporées', n(p.n) + ' × ' + n(p.v), e(inc)], ['Parité', n(p.N) + ' ÷ ' + n(p.n), (p.N / p.n) + ' anciennes pour 1 nouvelle'], ['Valeur après', n(p.N) + ' × ' + n(p.V) + ' ÷ (' + n(p.N) + ' + ' + n(p.n) + ')', U.e2(apres)], ['Droit d’attribution', n(p.V) + ' − ' + n(apres, 2), '<b>' + U.e2(da) + '</b>']];
      journal = [U.entry(dA, 'Incorporation de réserves au capital', [L('1068', inc, 0), L('1013', 0, inc)])];
      com = 'L’incorporation de réserves transforme des réserves en capital : les capitaux propres totaux ne changent pas et aucune trésorerie n’entre dans l’entreprise. L’opération renforce cependant la garantie des créanciers, car le capital ne peut plus être distribué. Le nombre d’actions augmente de ' + n(p.n) + ' alors que la valeur de l’entreprise reste identique : le cours théorique baisse de ' + e(p.V) + ' à ' + U.e2(apres) + '. Le droit d’attribution (' + U.e2(da) + ') compense exactement cette baisse pour l’actionnaire ancien : avec ' + (p.N / p.n) + ' droits, il reçoit une action gratuite. Un actionnaire qui ne veut pas augmenter sa participation peut céder ses droits. L’opération améliore aussi la liquidité du titre en abaissant son cours unitaire.';
      return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Calculs', html: U.calc(c) }], comment: com };
    }
    var prU = U.r2(p.E - p.v), prT = U.r2(prU * p.n), capT = U.r2(p.n * p.v), appele = U.r2(capT * p.lib), nonApp = U.r2(capT - appele), verse = U.r2(appele + prT);
    var libTxt = { 0.25: 'du minimum légal (le quart du nominal)', 0.5: 'de la moitié du nominal', 1: 'intégralement' }[p.lib];
    en = '<p>La société <b>' + p.nom + '</b> procède le ' + dA + ' à une augmentation de capital en numéraire :</p>';
    var li = ['émission de ' + n(p.n) + ' actions nouvelles de nominal ' + e(p.v) + ' au prix de ' + e(p.E) + ' ;', 'les actions sont libérées ' + libTxt + ' et de la totalité de la prime ;'];
    if (p.N) li.push('avant l’opération, le capital comprend ' + n(p.N) + ' actions, dont la valeur réelle est de ' + e(p.V) + ' ;');
    if (p.frais) li.push('les frais d’augmentation de capital s’élèvent à ' + e(p.frais) + ' HT (TVA 20 %), réglés par virement le ' + dA + ' ; ' + { prime: 'ils sont imputés sur la prime d’émission.', charges: 'ils sont comptabilisés en charges (honoraires).', etab: 'ils sont inscrits en frais d’établissement, amortis sur 5 ans.' }[p.fraisMode]);
    li.push('les fonds sont reçus en banque le ' + U.dt(p.vers.d, p.vers.m) + '.');
    en += U.ul(li);
    en += '<p class="consigne">1. Rappelez les modalités d’une augmentation de capital. 2. ' + (p.N ? 'Calculez la valeur théorique du droit préférentiel de souscription. 3. ' : 'Définissez le droit préférentiel de souscription. 3. ') + 'Passez les écritures au journal' + (p.fraisMode === 'etab' ? ', y compris au 31/12/N' : '') + '.</p>';
    qs = [Q('pr', 'Prime d’émission totale', prT, '€'), Q('ve', 'Somme à verser à la souscription', verse, '€'), Q('na', 'Capital souscrit non appelé', nonApp, '€')];
    c = [['Prime unitaire', n(p.E) + ' − ' + n(p.v), e(prU)], ['Prime totale', n(prU) + ' × ' + n(p.n), e(prT)], ['Augmentation du capital', n(p.n) + ' × ' + n(p.v), e(capT)],
      ['Capital appelé et versé', n(capT) + ' × ' + n(p.lib, 2), e(appele)], ['Capital non appelé', n(capT) + ' − ' + n(appele), e(nonApp)], ['À verser à la souscription', n(appele) + ' + ' + n(prT), '<b>' + e(verse) + '</b>']];
    var apres, dps;
    if (p.N) {
      apres = U.r2((p.N * p.V + p.n * p.E) / (p.N + p.n)); dps = U.r2(p.V - (p.N * p.V + p.n * p.E) / (p.N + p.n));
      qs.push(Q('ap', 'Valeur théorique de l’action après l’augmentation', apres, '€', { tol: 0.01 }), Q('dps', 'Valeur théorique du DPS', dps, '€', { tol: 0.01 }));
      c.push(['Valeur après', '(' + n(p.N) + ' × ' + n(p.V) + ' + ' + n(p.n) + ' × ' + n(p.E) + ') ÷ ' + n(p.N + p.n), U.e2(apres)], ['DPS', n(p.V) + ' − ' + n(apres, 2), '<b>' + U.e2(dps) + '</b>'], ['Parité', n(p.N) + ' ÷ ' + n(p.n), (p.N / p.n) + ' DPS pour 1 action nouvelle']);
    }
    journal.push(U.entry(dA, 'Souscription de l’augmentation de capital', [L('109', nonApp, 0), L('4563', verse, 0, { alt: ['4562'] }), L('1011', 0, nonApp), L('1013', 0, appele, { alt: ['1012'] }), L('1041', 0, prT)]));
    var tvaF = U.r2(p.frais * 0.2), dotF = 0;
    if (p.frais) {
      if (p.fraisMode === 'prime') journal.push(U.entry(dA, 'Frais imputés sur la prime d’émission', [L('1041', p.frais, 0), L('44566', tvaF, 0), L('512', 0, U.r2(p.frais + tvaF))]));
      if (p.fraisMode === 'charges') journal.push(U.entry(dA, 'Frais d’augmentation de capital', [L('6226', p.frais, 0), L('44566', tvaF, 0), L('512', 0, U.r2(p.frais + tvaF))]));
      if (p.fraisMode === 'etab') journal.push(U.entry(dA, 'Frais d’augmentation de capital', [L('2013', p.frais, 0), L('44562', tvaF, 0), L('512', 0, U.r2(p.frais + tvaF))]));
      c.push(['TVA sur frais', n(p.frais) + ' × 20 %', e(tvaF)]);
    }
    journal.push(U.entry(U.dt(p.vers.d, p.vers.m), 'Versement des fonds', [L('512', verse, 0), L('4563', 0, verse, { alt: ['4562'] })]));
    if (p.frais && p.fraisMode === 'etab') {
      var mo = 13 - p.date.m; dotF = U.r2(p.frais / 5 * mo / 12);
      qs.push(Q('dotf', 'Dotation aux amortissements des frais au 31/12/N', dotF, '€'));
      c.push(['Dotation des frais', n(p.frais) + ' × 1/5 × ' + mo + '/12', e(dotF)]);
      journal.push(U.entry('31/12/N', 'Amortissement des frais d’augmentation de capital', [L('6811', dotF, 0), L('28013', 0, dotF)]));
    }
    var modal = U.ul(['apport en numéraire (cas présent) ;', 'apport en nature ;', 'incorporation de réserves (attribution d’actions gratuites) ;', 'compensation avec des créances liquides et exigibles sur la société (conversion de dettes) ;', 'paiement du dividende en actions.']);
    var defDps = U.p('Le droit préférentiel de souscription (DPS) permet aux actionnaires anciens de souscrire en priorité aux actions nouvelles, proportionnellement à leur participation. Il compense la dilution : les actions nouvelles sont émises sous la valeur réelle, ce qui fait baisser la valeur de l’action. Il est négociable : l’actionnaire qui ne souscrit pas peut le vendre.');
    com = 'L’augmentation de capital en numéraire apporte des ressources propres durables : ' + e(capT) + ' de capital et ' + e(prT) + ' de prime, soit ' + e(U.r2(capT + prT)) + ' de capitaux propres nouveaux, dont ' + e(verse) + ' encaissés immédiatement' + (nonApp ? ' et ' + e(nonApp) + ' à appeler dans les cinq ans' : '') + '. La prime d’émission rémunère l’écart entre la valeur réelle de l’action et son nominal : elle protège les anciens actionnaires, qui ont contribué aux réserves accumulées. ' + (p.N ? 'Le prix d’émission (' + e(p.E) + ') étant inférieur à la valeur réelle (' + e(p.V) + '), l’action perd ' + U.e2(dps) + ' de valeur théorique : c’est la valeur du DPS, qui indemnise exactement l’actionnaire ancien. ' : '') + 'Pour l’analyse financière, l’opération renforce le fonds de roulement et l’autonomie financière, et améliore la capacité d’emprunt. Le capital non appelé figure à l’actif (109) et doit être déduit des capitaux propres dans le bilan fonctionnel. ' + (p.fraisMode === 'prime' ? 'L’imputation des frais sur la prime évite de pénaliser le résultat de l’exercice.' : (p.fraisMode === 'etab' ? 'Les frais immobilisés sont étalés sur cinq ans ; le PCG modernisé privilégie leur imputation sur la prime ou leur passage en charges.' : 'Les frais passés en charges réduisent le résultat de l’exercice mais sont fiscalement déductibles.'));
    return { enonce: en, questions: qs, journal: journal, steps: [{ h: 'Modalités', html: modal }, { h: 'Droit préférentiel de souscription', html: defDps }, { h: 'Calculs', html: U.calc(c) }], comment: com };
  }
};

/* ---------- 11. Seuil de rentabilité ---------- */
var PRODUITS = [['vélos électriques', 'vélo'], ['tables de jardin', 'table'], ['poêles à granulés', 'poêle'], ['kayaks', 'kayak'], ['casques audio', 'casque'], ['ruches connectées', 'ruche'], ['fauteuils de bureau', 'fauteuil'], ['trottinettes', 'trottinette']];
function pointMortDate(jours) {
  var d = Math.ceil(jours - 1e-9); if (d < 1) d = 1; if (d > 360) return 'au-delà de l’exercice';
  var m = Math.ceil(d / 30), j = d - 30 * (m - 1);
  return 'le ' + (j === 1 ? '1er' : j) + ' ' + U.MOIS[m - 1];
}
T.seuil = {
  id: 'seuil', nom: 'Seuil de rentabilité et marge sur coût variable', famille: 'Comptabilité de gestion', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Présenter le compte de résultat différentiel et en déduire le seuil de rentabilité, le point mort, la marge et l’indice de sécurité, le levier opérationnel.',
    etapes: [
      'Compte de résultat différentiel : CA − charges variables = marge sur coût variable (MCV) ; MCV − charges fixes = résultat. Ajoute la colonne en % du CA.',
      'Taux de MCV = MCV ÷ CA.',
      'Seuil de rentabilité (SR) en valeur = charges fixes ÷ taux de MCV.',
      'SR en quantité = charges fixes ÷ MCV unitaire, arrondi à l’unité supérieure.',
      'Point mort = SR ÷ CA × 360 jours (ou × 12 mois) si l’activité est régulière ; traduis-le en date.',
      'Marge de sécurité = CA − SR ; indice de sécurité = marge de sécurité ÷ CA.',
      'Levier opérationnel = MCV ÷ résultat : variation du résultat (en %) pour 1 % de variation du CA.'
    ],
    pieges: [
      'Arrondir le taux de MCV trop tôt (le corrigé officiel du sujet test arrondit à 0,5625 : 1 337 493 € au lieu de 1 337 545 €).',
      'Arrondir le SR en quantité à l’inférieur : avec 385 unités le résultat reste négatif, il faut 386.',
      'Point mort : année commerciale de 360 jours, mois de 30 jours, à partir du début de l’exercice.',
      'Définir le compte de résultat différentiel : il classe les charges selon leur variabilité (et non selon leur nature).'
    ],
    comptes: []
  },
  gen: function (r) {
    for (var i = 0; i < 100; i++) {
      var pr = r.pick(PRODUITS), p = r.int(20, 3500), q = r.int(10, 400) * (p > 1000 ? 5 : 100);
      var tx = r.int(25, 65) / 100, cvu = U.r2(p * (1 - tx)), CA = p * q, MCV = CA - cvu * q;
      var CF = U.r0(MCV * r.int(55, 90) / 100 / 100) * 100;
      if (MCV - CF <= 0) continue;
      return { nom: U.nom(r), prod: pr, p: p, q: q, cvu: cvu, CF: CF, global: r.chance(0.4), dCA: r.pick([0.05, 0.1, 0.15, -0.1, 0.2]) };
    }
  },
  calc: function (p) {
    var CA = U.r2(p.p * p.q), CV = p.CV !== undefined ? p.CV : U.r2(p.cvu * p.q), MCV = U.r2(CA - CV), tx = MCV / CA, R = U.r2(MCV - p.CF);
    var SR = U.r2(p.CF / tx), mcvu = MCV / p.q, SRq = p.CF / mcvu, SRqc = Math.ceil(SRq - 1e-9), PMj = SR / CA * 360;
    var MS = U.r2(CA - SR), IS = MS / CA, LO = MCV / R, R2 = U.r2(MCV * (1 + p.dCA) - p.CF);
    return { CA: CA, CV: CV, MCV: MCV, tx: tx, R: R, SR: SR, mcvu: mcvu, SRq: SRq, SRqc: SRqc, PMj: PMj, MS: MS, IS: IS, LO: LO, R2: R2 };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n;
    var en = '<p>La société <b>' + p.nom + '</b> fabrique des ' + p.prod[0] + '. Données de l’exercice N :</p>';
    en += U.kv(p.global ? [['Prix de vente unitaire', e(p.p) + ' HT'], ['Chiffre d’affaires', e(x.CA) + ' HT'], ['Charges variables', e(x.CV)], ['Charges fixes', e(p.CF)]]
      : [['Quantités vendues', n(p.q) + ' ' + p.prod[0]], ['Prix de vente unitaire', e(p.p) + ' HT'], ['Coût variable unitaire', U.e2(p.cvu)], ['Charges fixes annuelles', e(p.CF)]]);
    en += '<p>L’activité est régulière sur l’année (exercice du 01/01 au 31/12).</p>';
    en += '<p class="consigne">1. Définissez et présentez le compte de résultat différentiel. 2. Calculez le seuil de rentabilité en valeur et en quantité, puis le point mort. 3. Calculez la marge et l’indice de sécurité et le levier opérationnel ; que devient le résultat si le chiffre d’affaires varie de ' + (p.dCA > 0 ? '+' : '') + U.pcs(p.dCA) + ' ?</p>';
    var qs = [Q('mcv', 'Marge sur coût variable', x.MCV, '€'), Q('tx', 'Taux de marge sur coût variable', U.rd(x.tx * 100, 2), '%', { tol: 0.06 }), Q('res', 'Résultat', x.R, '€'), Q('sr', 'Seuil de rentabilité en valeur', x.SR, '€', { tol: Math.max(2, x.SR * 0.001) }),
      Q('srq', 'Seuil de rentabilité en quantité (arrondi supérieur)', x.SRqc, 'u', { tol: 1 }), Q('pm', 'Point mort (jour de l’année de 360 jours)', Math.ceil(x.PMj - 1e-9), 'j', { tol: 1 }), Q('ms', 'Marge de sécurité', x.MS, '€', { tol: Math.max(2, x.MS * 0.002) }),
      Q('is', 'Indice de sécurité', U.rd(x.IS * 100, 2), '%', { tol: 0.1 }), Q('lo', 'Levier opérationnel', U.rd(x.LO, 2), '', { tol: 0.03 }), Q('r2', 'Résultat après variation du CA', x.R2, '€')];
    var crd = U.tbl(['Compte de résultat différentiel', 'Montant', '% du CA'], [['Chiffre d’affaires' + (p.global ? '' : ' (' + n(p.q) + ' × ' + n(p.p) + ')'), e(x.CA), '100 %'], ['− Charges variables', e(x.CV), U.pc(x.CV / x.CA)], { cls: 'tot', cells: ['= Marge sur coût variable', e(x.MCV), U.pc(x.tx)] }, ['− Charges fixes', e(p.CF), U.pc(p.CF / x.CA)], { cls: 'tot', cells: ['= Résultat', e(x.R), U.pc(x.R / x.CA)] }]);
    var c = [['Taux de MCV', n(x.MCV) + ' ÷ ' + n(x.CA), U.pc(x.tx, 4)], ['Seuil en valeur', n(p.CF) + ' ÷ ' + n(x.tx, 6), '<b>' + e(x.SR) + '</b>'],
      ['MCV unitaire', n(x.MCV) + ' ÷ ' + n(p.q), U.e2(x.mcvu)], ['Seuil en quantité', n(p.CF) + ' ÷ ' + n(x.mcvu, 2) + ' = ' + n(x.SRq, 2), '<b>' + n(x.SRqc) + ' unités</b>'],
      ['Point mort', n(x.SR) + ' ÷ ' + n(x.CA) + ' × 360 = ' + n(x.PMj, 1) + ' jours', pointMortDate(x.PMj)], ['Marge de sécurité', n(x.CA) + ' − ' + n(x.SR), e(x.MS)], ['Indice de sécurité', n(x.MS) + ' ÷ ' + n(x.CA), U.pc(x.IS)],
      ['Levier opérationnel', n(x.MCV) + ' ÷ ' + n(x.R), n(x.LO, 2)], ['Résultat après variation', n(x.MCV) + ' × ' + n(1 + p.dCA, 2) + ' − ' + n(p.CF) + ' (soit ' + (p.dCA * x.LO > 0 ? '+' : '') + U.pc(p.dCA * x.LO, 1) + ')', e(x.R2)]];
    var def = U.p('Le compte de résultat différentiel reclasse les charges selon leur comportement face à l’activité : les charges variables évoluent avec le volume vendu, les charges fixes en sont indépendantes à court terme. Il fait apparaître la marge sur coût variable, qui doit couvrir les charges fixes, et permet de calculer le seuil de rentabilité : le chiffre d’affaires pour lequel le résultat est nul.');
    var com = 'Avec un taux de marge sur coût variable de ' + U.pc(x.tx, 1) + ', chaque euro de chiffre d’affaires dégage ' + n(x.tx, 2) + ' € pour couvrir les ' + e(p.CF) + ' de charges fixes. Le seuil de rentabilité est atteint pour ' + e(x.SR) + ' de chiffre d’affaires, soit ' + n(x.SRqc) + ' ' + p.prod[0] + ' ; si l’activité est régulière, le point mort est atteint ' + pointMortDate(x.PMj) + '. L’indice de sécurité de ' + U.pc(x.IS, 1) + ' signifie que le chiffre d’affaires peut baisser de ' + U.pc(x.IS, 1) + ' avant que l’entreprise ne devienne déficitaire : ' + (x.IS < 0.15 ? 'la marge est faible, l’entreprise est vulnérable à un retournement de la demande.' : (x.IS > 0.35 ? 'la marge est confortable.' : 'la sécurité est correcte sans être confortable.')) + ' Le levier opérationnel de ' + n(x.LO, 2) + ' indique qu’une variation de 1 % du chiffre d’affaires fait varier le résultat de ' + n(x.LO, 2) + ' % : ' + (x.LO > 5 ? 'le risque d’exploitation est élevé, lié au poids des charges fixes.' : 'le risque d’exploitation reste mesuré.') + ' Une variation de ' + U.pcs(p.dCA) + ' du chiffre d’affaires porterait ainsi le résultat à ' + e(x.R2) + '. Pour abaisser le seuil, l’entreprise peut réduire ses charges fixes, améliorer son taux de marge (prix, achats) ou transformer des charges fixes en charges variables (sous-traitance).';
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Définition', html: def }, { h: 'Compte de résultat différentiel', html: crd }, { h: 'Calculs', html: U.calc(c) }], comment: com };
  }
};

/* ---------- 12. Commande spéciale et coût marginal ---------- */
T.commande = {
  id: 'commande', nom: 'Commande spéciale et coût marginal', famille: 'Comptabilité de gestion', ctrl: true, minutes: 15,
  fiche: {
    objectif: 'Décider d’accepter une commande supplémentaire à prix réduit par le raisonnement global puis par le coût marginal.',
    etapes: [
      'Raisonnement global : résultat sans la commande et résultat avec la commande (CA, charges variables, charges fixes), puis l’écart.',
      'Coût marginal = coût de la série supplémentaire = charges variables de la commande + charges fixes supplémentaires éventuelles.',
      'Recette marginale = quantité × prix négocié.',
      'Résultat marginal = recette marginale − coût marginal (égal à l’écart du raisonnement global).',
      'Conclusion : accepter si le résultat marginal est positif, en vérifiant la capacité, l’absence d’effet sur les prix des clients habituels et le caractère ponctuel.'
    ],
    pieges: [
      'Comparer le prix proposé au coût complet unitaire : le coût complet intègre des charges fixes déjà couvertes.',
      'Oublier une charge fixe supplémentaire (location d’une machine, embauche) ou un surcoût variable (heures supplémentaires).',
      'Conclure sans réserve : risque commercial (clients habituels), saturation de la capacité.'
    ],
    comptes: []
  },
  gen: function (r) {
    var pr = r.pick(PRODUITS), p = r.int(80, 900), cvu = U.r0(p * r.int(40, 65) / 100), q = r.int(5, 120) * 10;
    var CF = U.r0(q * (p - cvu) * r.int(60, 90) / 100 / 100) * 100;
    var q2 = U.r0(q * r.int(15, 45) / 100 / 10) * 10 || 10;
    var v = r.pick(['simple', 'simple', 'surcout', 'refus']);
    var p2, cvu2 = cvu, dCF = 0;
    if (v === 'refus') { p2 = U.r0(cvu * r.int(85, 98) / 100); }
    else { p2 = U.r0(cvu + (p - cvu) * r.int(10, 60) / 100); }
    if (v === 'surcout') { cvu2 = U.r0(cvu * r.int(103, 110) / 100); dCF = Math.max(0, U.r0(q2 * (p2 - cvu2) * r.int(20, 130) / 100 / 100) * 100); }
    return { nom: U.nom(r), prod: pr, p: p, cvu: cvu, q: q, CF: CF, q2: q2, p2: p2, cvu2: cvu2, dCF: dCF, mois: r.pick(U.MOIS) };
  },
  calc: function (p) {
    var CA0 = p.q * p.p, CV0 = p.q * p.cvu, R0 = U.r2(CA0 - CV0 - p.CF);
    var CA1 = U.r2(CA0 + p.q2 * p.p2), CV1 = U.r2(CV0 + p.q2 * p.cvu2), CF1 = U.r2(p.CF + p.dCF), R1 = U.r2(CA1 - CV1 - CF1);
    var cm = U.r2(p.q2 * p.cvu2 + p.dCF), rm = U.r2(p.q2 * p.p2), res = U.r2(rm - cm);
    return { CA0: CA0, CV0: CV0, R0: R0, CA1: CA1, CV1: CV1, CF1: CF1, R1: R1, cm: cm, cmu: cm / p.q2, rm: rm, res: res, cc: (CV0 + p.CF) / p.q };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n;
    var en = '<p>Chaque mois, la société <b>' + p.nom + '</b> fabrique et vend ' + n(p.q) + ' ' + p.prod[0] + ' au prix unitaire de ' + e(p.p) + '. Coût mensuel de cette production :</p>';
    en += U.kv([['Charges variables', e(x.CV0) + ' (' + U.e2(p.cvu) + ' par unité)'], ['Charges fixes', e(p.CF)], ['Coût total', e(U.r2(x.CV0 + p.CF)) + ' (' + U.e2(x.cc) + ' par unité)']]);
    en += '<p>Elle reçoit pour le mois ' + (/^[aeiou]/.test(p.mois) ? 'd’' : 'de ') + p.mois + ' une commande complémentaire de ' + n(p.q2) + ' ' + p.prod[0] + ' au prix négocié de ' + e(p.p2) + ' l’unité. ';
    en += p.dCF || p.cvu2 !== p.cvu ? 'Pour l’exécuter, il faudrait recourir à des heures supplémentaires, qui portent le coût variable des unités de la commande à ' + U.e2(p.cvu2) + (p.dCF ? ', et louer un équipement pour ' + e(p.dCF) + ' sur le mois' : '') + '.</p>' : 'La capacité de production permet de l’exécuter sans modifier les charges fixes mensuelles.</p>';
    en += '<p class="consigne">1. Présentez le raisonnement global. 2. Présentez le raisonnement par le coût marginal. 3. Concluez sur l’opportunité d’accepter la commande.</p>';
    var qs = [Q('r0', 'Résultat mensuel sans la commande', x.R0, '€'), Q('r1', 'Résultat mensuel avec la commande', x.R1, '€'), Q('cm', 'Coût marginal de la commande', x.cm, '€'), Q('cmu', 'Coût marginal unitaire', U.r2(x.cmu), '€', { tol: 0.05 }),
      Q('rm', 'Recette marginale', x.rm, '€'), Q('res', 'Résultat marginal', x.res, '€'), QC('dec', 'Décision', ['Accepter la commande', 'Refuser la commande'], x.res > 0 ? 0 : 1)];
    var glob = U.tbl(['', 'Sans la commande', 'Avec la commande'], [['Chiffre d’affaires', n(p.q) + ' × ' + n(p.p) + ' = ' + e(x.CA0), n(x.CA0) + ' + ' + n(p.q2) + ' × ' + n(p.p2) + ' = ' + e(x.CA1)], ['Charges variables', n(p.q) + ' × ' + n(p.cvu, 2) + ' = ' + e(x.CV0), e(x.CV1)], ['Charges fixes', e(p.CF), e(x.CF1)], { cls: 'tot', cells: ['Résultat', e(x.R0), e(x.R1)] }]);
    var c = [['Coût marginal', n(p.q2) + ' × ' + n(p.cvu2, 2) + (p.dCF ? ' + ' + n(p.dCF) : ''), e(x.cm)], ['Coût marginal unitaire', n(x.cm) + ' ÷ ' + n(p.q2), U.e2(x.cmu)], ['Recette marginale', n(p.q2) + ' × ' + n(p.p2), e(x.rm)], ['Résultat marginal', n(x.rm) + ' − ' + n(x.cm), '<b>' + e(x.res) + '</b>'], ['Écart global', n(x.R1) + ' − ' + n(x.R0), e(U.r2(x.R1 - x.R0))]];
    var com = x.res > 0
      ? 'La commande doit être acceptée : elle augmente le résultat mensuel de ' + e(x.res) + '. Le prix proposé (' + e(p.p2) + ') est inférieur au coût complet unitaire (' + U.e2(x.cc) + '), mais ce coût contient des charges fixes déjà couvertes par la production habituelle ; seul compte le coût marginal, ici ' + U.e2(x.cmu) + ' par unité, que le prix dépasse de ' + U.e2(p.p2 - x.cmu) + '. ' + (p.dCF ? 'Les charges fixes supplémentaires de ' + e(p.dCF) + ' sont absorbées par la marge de la commande. ' : '') + 'Trois réserves s’imposent : la capacité doit réellement absorber ' + n(p.q2) + ' unités sans désorganiser la production, les clients habituels ne doivent pas apprendre ce prix et réclamer la même remise, et l’opération doit rester ponctuelle, faute de quoi le prix ne couvrirait plus durablement les charges fixes. Il faut aussi vérifier la solvabilité du client et l’absence de coûts cachés (transport, garantie).'
      : 'La commande doit être refusée : elle ' + (x.res < 0 ? 'réduirait' : 'ne modifierait pas') + ' le résultat mensuel (' + e(x.res) + '). ' + (p.p2 < p.cvu2 ? 'Le prix proposé (' + e(p.p2) + ') ne couvre même pas le coût variable unitaire (' + U.e2(p.cvu2) + ') : chaque unité vendue creuse la perte.' : 'Le prix couvre le coût variable, mais pas les charges supplémentaires qu’impose la commande : le coût marginal unitaire atteint ' + U.e2(x.cmu) + '.') + ' Le raisonnement par le coût marginal le montre directement : la recette marginale (' + e(x.rm) + ') est inférieure au coût marginal (' + e(x.cm) + '). L’entreprise pourrait renégocier le prix au-dessus de ' + U.e2(x.cmu) + ', ou accepter pour des raisons stratégiques (conquête d’un client, occupation de la capacité), mais en connaissant le coût de ce choix. Elle doit aussi éviter qu’un prix aussi bas ne serve de référence à ses clients habituels.';
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Raisonnement global', html: glob }, { h: 'Coût marginal', html: U.calc(c) }], comment: com };
  }
};

/* ---------- 19. Coût complet ---------- */
// Matière : [avec article défini, après « kg »], puis les deux produits
var FABRICATIONS = [[['l’aluminium', 'd’aluminium'], ['vélos', 'vélo'], ['trottinettes', 'trottinette']], [['l’acier', 'd’acier'], ['radiateurs', 'radiateur'], ['sèche-serviettes', 'sèche-serviettes']], [['la laine', 'de laine'], ['pulls', 'pull'], ['plaids', 'plaid']], [['l’argile', 'd’argile'], ['vases', 'vase'], ['saladiers', 'saladier']], [['le chêne', 'de chêne'], ['tables', 'table'], ['bancs', 'banc']]];
T.cout_complet = {
  id: 'cout_complet', nom: 'Coût complet : achat, production, revient', famille: 'Comptabilité de gestion', ctrl: false, minutes: 20,
  fiche: {
    objectif: 'Calculer le coût de l’unité d’œuvre des centres d’analyse, puis la chaîne des coûts (achat, production, revient) et le résultat analytique de chaque produit.',
    etapes: [
      'Charges directes : affectées sans calcul à un produit (matière consommée, main-d’œuvre directe). Charges indirectes : réparties dans les centres d’analyse.',
      'Coût de l’unité d’œuvre (UO) d’un centre = total du centre après répartition secondaire ÷ nombre d’unités d’œuvre. Assiette de frais : l’UO est « 100 € de chiffre d’affaires ».',
      'Coût d’achat = prix d’achat + charges directes d’achat + centre Approvisionnement (UO × coût de l’UO).',
      'Coût de production = matière consommée (au coût d’achat) + main-d’œuvre directe + centres de production.',
      'Coût de revient = coût de production des produits vendus + centre Distribution.',
      'Résultat analytique = chiffre d’affaires − coût de revient ; la somme des résultats analytiques, corrigée des charges non incorporables et supplétives, redonne le résultat comptable.'
    ],
    pieges: [
      'Oublier le centre Approvisionnement dans le coût de la matière consommée.',
      'Multiplier le coût de l’UO Distribution par le chiffre d’affaires au lieu du nombre de « 100 € de CA ».',
      'Conclure à l’abandon d’un produit déficitaire en coût complet : ses charges fixes resteraient à la charge des autres produits. Raisonne en coût variable avant de décider.',
      'Arrondir le coût de l’UO trop tôt : garde au moins deux décimales.'
    ],
    comptes: []
  },
  gen: function (r) {
    var f = r.pick(FABRICATIONS), M = r.int(10, 80) * 100, pm = r.int(20, 120) / 10, mA = U.r0(M * r.int(35, 65) / 100 / 10) * 10;
    var qA = r.int(4, 40) * 50, qB = r.int(4, 40) * 50, hA = U.r0(qA * r.int(5, 30) / 10), hB = U.r0(qB * r.int(5, 30) / 10);
    var p = { nom: U.nom(r), mat: f[0], pA: f[1], pB: f[2], M: M, pm: pm, mA: mA, mB: M - mA, uoA: r.int(5, 60) / 100, qA: qA, qB: qB, hA: hA, hB: hB, th: r.int(14, 30), uoP: r.int(150, 600) / 10, uoD: r.int(30, 120) / 10 };
    var d = p.uoD / 100, base = this.calc(p);
    p.vA = U.r0(base.cpA / qA / (1 - d) * r.int(88, 125) / 100);
    p.vB = U.r0(base.cpB / qB / (1 - d) * r.int(85, 120) / 100);
    return p;
  },
  calc: function (p) {
    var x = {};
    x.TA = U.r2(p.M * p.uoA); x.cam = U.r2(p.M * p.pm + x.TA); x.cu = x.cam / p.M;
    x.matA = U.r2(p.mA * x.cu); x.matB = U.r2(p.mB * x.cu);
    x.modA = U.r2(p.hA * p.th); x.modB = U.r2(p.hB * p.th);
    x.TP = U.r2((p.hA + p.hB) * p.uoP); x.atA = U.r2(p.hA * p.uoP); x.atB = U.r2(p.hB * p.uoP);
    x.cpA = U.r2(x.matA + x.modA + x.atA); x.cpB = U.r2(x.matB + x.modB + x.atB);
    if (p.vA) {
      x.caA = U.r2(p.qA * p.vA); x.caB = U.r2(p.qB * p.vB); x.nbD = (x.caA + x.caB) / 100; x.TD = U.r2(x.nbD * p.uoD);
      x.diA = U.r2(x.caA / 100 * p.uoD); x.diB = U.r2(x.caB / 100 * p.uoD);
      x.crA = U.r2(x.cpA + x.diA); x.crB = U.r2(x.cpB + x.diB);
      x.raA = U.r2(x.caA - x.crA); x.raB = U.r2(x.caB - x.crB); x.ra = U.r2(x.raA + x.raB);
    }
    return x;
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, e2 = U.e2, n = U.n;
    var A = p.pA[0], B = p.pB[0], dcu = Math.abs(x.cu - U.r2(x.cu)) < 1e-9 ? 2 : 4;
    var en = '<p>La société <b>' + p.nom + '</b> fabrique des ' + A + ' et des ' + B + ' à partir d’une seule matière, ' + p.mat[0] + '. Données du mois (aucun stock en début ni en fin de mois : tout ce qui est acheté est consommé, tout ce qui est produit est vendu) :</p>';
    en += U.ul(['achats : ' + n(p.M) + ' kg ' + p.mat[1] + ' à ' + e2(p.pm) + ' le kg ; consommation : ' + n(p.mA) + ' kg pour les ' + A + ', ' + n(p.mB) + ' kg pour les ' + B + ' ;',
      'main-d’œuvre directe à ' + e(p.th) + ' de l’heure, charges comprises : ' + n(p.hA) + ' heures pour les ' + A + ', ' + n(p.hB) + ' heures pour les ' + B + ' ;',
      'production et ventes : ' + n(p.qA) + ' ' + A + ' vendus ' + e(p.vA) + ' HT l’unité, ' + n(p.qB) + ' ' + B + ' vendus ' + e(p.vB) + ' HT l’unité.']);
    en += '<p>Tableau de répartition des charges indirectes, après répartition secondaire :</p>';
    en += U.tbl(['Centre', 'Total', 'Unité d’œuvre'], [['Approvisionnement', e(x.TA), 'kg de matière achetée'], ['Atelier', e(x.TP), 'heure de main-d’œuvre directe'], ['Distribution', e(x.TD), '100 € de chiffre d’affaires']]);
    en += '<p class="consigne">1. Calculez le coût de l’unité d’œuvre de chaque centre. 2. Calculez le coût d’achat de la matière, le coût de production et le coût de revient de chaque produit. 3. Calculez les résultats analytiques et commentez.</p>';
    var t1 = { tol: 0.01 };
    var qs = [Q('uoa', 'Coût de l’unité d’œuvre Approvisionnement (par kg)', p.uoA, '€', t1), Q('uop', 'Coût de l’unité d’œuvre Atelier (par heure)', p.uoP, '€', t1), Q('uod', 'Coût de l’unité d’œuvre Distribution (pour 100 € de CA)', p.uoD, '€', t1),
      Q('cam', 'Coût d’achat de la matière', x.cam, '€'), Q('cpa', 'Coût de production des ' + A, x.cpA, '€'), Q('cpb', 'Coût de production des ' + B, x.cpB, '€'),
      Q('cra', 'Coût de revient des ' + A, x.crA, '€'), Q('crb', 'Coût de revient des ' + B, x.crB, '€'), Q('raa', 'Résultat analytique des ' + A, x.raA, '€'), Q('rab', 'Résultat analytique des ' + B, x.raB, '€')];
    var uo = U.tbl(['Centre', 'Total', 'Nombre d’UO', 'Coût de l’UO'], [['Approvisionnement', e(x.TA), n(p.M) + ' kg', e2(p.uoA)], ['Atelier', e(x.TP), n(p.hA + p.hB) + ' h (' + n(p.hA) + ' + ' + n(p.hB) + ')', e2(p.uoP)], ['Distribution', e(x.TD), n(x.nbD, 2) + ' (' + n(U.r2(x.caA + x.caB)) + ' ÷ 100)', e2(p.uoD)]]);
    var ach = U.tbl(['Coût d’achat de la matière', 'Quantité', 'Coût unitaire', 'Montant'], [['Prix d’achat', n(p.M), n(p.pm, 2), n(U.r2(p.M * p.pm), 2)], ['Centre Approvisionnement', n(p.M), n(p.uoA, 2), n(x.TA, 2)], { cls: 'tot', cells: ['Coût d’achat', n(p.M), n(x.cu, dcu), n(x.cam, 2)] }]);
    var prod = U.tbl(['Coût de production', A, B], [['Matière consommée', n(p.mA) + ' × ' + n(x.cu, dcu) + ' = ' + n(x.matA, 2), n(p.mB) + ' × ' + n(x.cu, dcu) + ' = ' + n(x.matB, 2)], ['Main-d’œuvre directe', n(p.hA) + ' × ' + n(p.th) + ' = ' + n(x.modA, 2), n(p.hB) + ' × ' + n(p.th) + ' = ' + n(x.modB, 2)], ['Centre Atelier', n(p.hA) + ' × ' + n(p.uoP, 2) + ' = ' + n(x.atA, 2), n(p.hB) + ' × ' + n(p.uoP, 2) + ' = ' + n(x.atB, 2)], { cls: 'tot', cells: ['Coût de production', n(x.cpA, 2) + ' (' + n(x.cpA / p.qA, 2) + ' par unité)', n(x.cpB, 2) + ' (' + n(x.cpB / p.qB, 2) + ' par unité)'] }]);
    var rev = U.tbl(['Coût de revient et résultat', A, B], [['Coût de production', n(x.cpA, 2), n(x.cpB, 2)], ['Centre Distribution', n(x.caA / 100, 2) + ' × ' + n(p.uoD, 2) + ' = ' + n(x.diA, 2), n(x.caB / 100, 2) + ' × ' + n(p.uoD, 2) + ' = ' + n(x.diB, 2)], { cls: 'tot', cells: ['Coût de revient', n(x.crA, 2), n(x.crB, 2)] }, ['Chiffre d’affaires', n(p.qA) + ' × ' + n(p.vA) + ' = ' + n(x.caA, 2), n(p.qB) + ' × ' + n(p.vB) + ' = ' + n(x.caB, 2)], { cls: 'tot', cells: ['Résultat analytique', n(x.raA, 2), n(x.raB, 2)] }]);
    var tA = x.raA / x.caA, tB = x.raB / x.caB, com = [];
    com.push('Le résultat analytique global atteint ' + e(x.ra) + '. Les ' + A + ' ' + (x.raA >= 0 ? 'dégagent ' + e(x.raA) + ', soit ' + U.pc(tA, 1) + ' de leur chiffre d’affaires' : 'perdent ' + e(-x.raA)) + ', les ' + B + ' ' + (x.raB >= 0 ? 'dégagent ' + e(x.raB) + ', soit ' + U.pc(tB, 1) + ' de leur chiffre d’affaires.' : 'perdent ' + e(-x.raB) + '.'));
    if (x.raA < 0 || x.raB < 0) com.push('Un résultat négatif en coût complet ne suffit pas à justifier l’abandon du produit : le coût complet contient des charges indirectes, en partie fixes, qui resteraient à couvrir par l’autre produit. Il faut d’abord vérifier si le produit dégage une marge sur coût variable positive ; si oui, il contribue à couvrir les charges fixes et son abandon dégraderait le résultat global. Les pistes sont plutôt un relèvement du prix, la baisse de la consommation de matière ou d’heures, ou la renégociation des achats.');
    else com.push('Les deux produits sont rentables ; ' + (tA > tB ? 'les ' + A : 'les ' + B) + ' le sont davantage, ce qui peut orienter l’effort commercial, sous réserve de la capacité de production.');
    com.push('Ces coûts dépendent du choix des unités d’œuvre : l’heure de main-d’œuvre répartit les charges de l’atelier au prorata du temps passé, ce qui pénalise le produit le plus long à fabriquer. La méthode ABC, qui répartit les charges par activités et inducteurs de coût, donne une image plus fidèle quand les charges indirectes pèsent lourd.');
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Coût des unités d’œuvre', html: uo }, { h: 'Coût d’achat', html: ach }, { h: 'Coût de production', html: prod }, { h: 'Coût de revient et résultat analytique', html: rev }], comment: com.join(' ') };
  }
};

/* ---------- Coûts partiels : coût variable par produit et imputation rationnelle ---------- */
var GAMMES = [
  { act: 'du mobilier de jardin', p: [['tables', 'table'], ['chaises', 'chaise'], ['parasols', 'parasol']] },
  { act: 'des vélos', p: [['vélos de ville', 'vélo de ville'], ['vélos tout-terrain', 'VTT'], ['vélos électriques', 'vélo électrique']] },
  { act: 'des articles de cuisine', p: [['poêles', 'poêle'], ['casseroles', 'casserole'], ['autocuiseurs', 'autocuiseur']] },
  { act: 'des luminaires', p: [['lampes de bureau', 'lampe'], ['suspensions', 'suspension'], ['lampadaires', 'lampadaire']] },
  { act: 'des fenêtres', p: [['fenêtres PVC', 'fenêtre PVC'], ['fenêtres aluminium', 'fenêtre aluminium'], ['baies coulissantes', 'baie']] }
];
function genGamme(r, opt) {
  var g = r.pick(GAMMES), pr = [];
  for (var i = 0; i < 3; i++) {
    var p = r.int(3, 90) * 10, q = r.int(4, 60) * 100;
    var tx = r.int(opt && opt[i] !== undefined ? opt[i][0] : 25, opt && opt[i] !== undefined ? opt[i][1] : 55) / 100;
    var dist = r.pick([0.04, 0.05, 0.06, 0.08]);
    var cvp = U.r2(p * (1 - tx - dist));
    pr.push({ nom: g.p[i], p: p, q: q, cvp: cvp, dist: dist });
  }
  return { act: g.act, pr: pr };
}
function mcvProduits(pr) {
  return pr.map(function (o) {
    var CA = U.r2(o.p * o.q), CVP = U.r2(o.cvp * o.q), CVD = U.r2(CA * o.dist), CV = U.r2(CVP + CVD), MCV = U.r2(CA - CV);
    return { CA: CA, CVP: CVP, CVD: CVD, CV: CV, MCV: MCV, tx: MCV / CA, mcvu: MCV / o.q };
  });
}

T.couts_partiels = {
  id: 'couts_partiels', nom: 'Coûts partiels : coût variable et imputation rationnelle', famille: 'Comptabilité de gestion', ctrl: false, minutes: 20,
  fiche: {
    objectif: 'Calculer la marge sur coût variable de chaque produit pour juger de sa contribution, puis neutraliser l’effet du niveau d’activité sur les coûts par l’imputation rationnelle des charges fixes.',
    cours: [
      { t: 'Coût complet et coûts partiels', l: [
        'Coût complet : il incorpore toutes les charges, y compris les charges indirectes réparties entre les produits par des clés plus ou moins arbitraires ; son coût unitaire varie avec le volume produit, car les charges fixes sont réparties sur plus ou moins d’unités.',
        'Coût partiel : il ne retient qu’une partie des charges, choisie selon un critère pertinent pour la décision (variabilité, rattachement direct, niveau d’activité).',
        'Coût variable (direct costing simple) : charges qui varient avec l’activité (matières, main-d’œuvre payée à la pièce, commissions, transport sur ventes) ; les charges fixes sont traitées globalement.',
        'Coût spécifique (direct costing évolué) : coût variable + charges fixes directement rattachables au produit (voir la fiche « Méthode des coûts spécifiques »).',
        'Coût marginal : coût de la dernière unité ou de la dernière série produite (voir la fiche « Commande spéciale et coût marginal »).',
        'Imputation rationnelle : les charges fixes sont incorporées aux coûts en proportion du niveau d’activité réel par rapport à l’activité normale.'
      ] },
      { t: 'Imputation rationnelle des charges fixes', l: [
        'Coefficient d’imputation rationnelle = activité réelle ÷ activité normale.',
        'Charges fixes imputées = charges fixes réelles × coefficient.',
        'Coefficient < 1 : une partie des charges fixes n’est pas imputée, c’est le coût de la sous-activité (coût du chômage), qui est une charge de la période et non du produit.',
        'Coefficient > 1 : on impute plus que les charges réelles, c’est un boni de suractivité.',
        'Intérêt : le coût unitaire ne dépend plus du niveau d’activité ; il sert de base stable pour fixer les prix et pour évaluer les stocks (le PCG impose d’exclure la sous-activité du coût de production des stocks).'
      ] }
    ],
    etapes: [
      'Pour chaque produit : CA = quantité × prix ; coût variable = coût variable de production + coût variable de distribution.',
      'Marge sur coût variable (MCV) = CA − coût variable ; taux de MCV = MCV ÷ CA ; MCV unitaire = MCV ÷ quantité.',
      'Résultat global = somme des MCV − charges fixes (non réparties).',
      'Imputation rationnelle : coefficient = activité réelle ÷ activité normale ; charges fixes imputées = charges fixes × coefficient.',
      'Écart d’imputation = charges fixes imputées − charges fixes réelles : négatif, coût de sous-activité ; positif, boni de suractivité.',
      'Coût unitaire rationnel = coût variable unitaire + charges fixes imputées ÷ quantité produite (= coût variable unitaire + charges fixes ÷ activité normale).'
    ],
    pieges: [
      'Répartir les charges fixes entre produits en direct costing simple : elles sont couvertes globalement par la somme des MCV.',
      'Oublier les charges variables de distribution (commissions, emballages, transport sur ventes) dans le coût variable.',
      'Abandonner un produit à MCV positive : il contribue à la couverture des charges fixes, qui resteraient à la charge des autres produits.',
      'Inverser le coefficient (activité normale ÷ activité réelle).',
      'Incorporer le coût de sous-activité au coût des produits ou à la valeur des stocks.'
    ],
    comptes: []
  },
  gen: function (r) {
    for (var t = 0; t < 100; t++) {
      var g = genGamme(r), m = mcvProduits(g.pr), MCV = m.reduce(function (a, o) { return a + o.MCV; }, 0);
      var CF = U.r0(MCV * r.int(60, 105) / 100 / 1000) * 1000;
      var AN = r.int(10, 60) * 100, coef = r.pick([0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.05, 1.1, 1.15]);
      var AR = U.r0(AN * coef / 10) * 10;
      if (AR === AN || CF <= 0) continue;
      return { nom: U.nom(r), act: g.act, pr: g.pr, CF: CF, at: { cvu: r.int(15, 120), F: r.int(20, 200) * 1000, AN: AN, AR: AR, prod: g.pr[0].nom } };
    }
  },
  calc: function (p) {
    var m = mcvProduits(p.pr), tot = { CA: 0, CV: 0, MCV: 0 };
    m.forEach(function (o) { tot.CA = U.r2(tot.CA + o.CA); tot.CV = U.r2(tot.CV + o.CV); tot.MCV = U.r2(tot.MCV + o.MCV); });
    var R = U.r2(tot.MCV - p.CF), a = p.at;
    var coef = a.AR / a.AN, FI = U.r2(a.F * coef), ecart = U.r2(FI - a.F);
    var cuComplet = U.r2(a.cvu + a.F / a.AR), cuRat = U.r2(a.cvu + FI / a.AR);
    return { m: m, tot: tot, R: R, tx: tot.MCV / tot.CA, coef: coef, FI: FI, ecart: ecart, cuComplet: cuComplet, cuRat: cuRat };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n, a = p.at;
    var en = '<p>La société <b>' + p.nom + '</b> fabrique et vend ' + p.act + '. Données de l’exercice N :</p>';
    en += U.tbl(['', p.pr[0].nom[0], p.pr[1].nom[0], p.pr[2].nom[0]], [['Quantités vendues'].concat(p.pr.map(function (o) { return n(o.q); })), ['Prix de vente unitaire HT'].concat(p.pr.map(function (o) { return U.e2(o.p); })), ['Coût variable unitaire de production'].concat(p.pr.map(function (o) { return U.e2(o.cvp); })), ['Charges variables de distribution (% du CA)'].concat(p.pr.map(function (o) { return U.pcs(o.dist); }))]);
    en += '<p>Les charges fixes de l’entreprise s’élèvent à ' + e(p.CF) + ' ; elles ne sont pas réparties entre les produits.</p>';
    en += '<p>Par ailleurs, l’atelier de montage des ' + a.prod[0] + ' supporte ' + e(a.F) + ' de charges fixes par an. Son activité normale est de ' + n(a.AN) + ' ' + a.prod[0] + ' ; il en a produit ' + n(a.AR) + ' en N. Le coût variable unitaire de production y est de ' + e(a.cvu) + '.</p>';
    en += '<p class="consigne">1. Présentez le compte de résultat par variabilité de chaque produit et le résultat global ; commentez la contribution de chaque produit. 2. Calculez le coefficient d’imputation rationnelle, les charges fixes imputées et l’écart d’imputation de l’atelier. 3. Comparez le coût unitaire de production complet et le coût unitaire rationnel.</p>';
    var qs = p.pr.map(function (o, i) { return Q('m' + i, 'Marge sur coût variable – ' + o.nom[0], x.m[i].MCV, '€'); });
    qs.push(Q('tx', 'Taux de marge sur coût variable global', U.rd(x.tx * 100, 2), '%', { tol: 0.06 }), Q('res', 'Résultat global', x.R, '€'),
      Q('coef', 'Coefficient d’imputation rationnelle', U.rd(x.coef, 4), 'coef', { tol: 0.006 }), Q('fi', 'Charges fixes imputées', x.FI, '€'),
      Q('ec', 'Écart d’imputation (− coût de sous-activité, + boni de suractivité)', x.ecart, '€'), Q('cuc', 'Coût unitaire de production complet', x.cuComplet, '€', { tol: 0.01 }), Q('cur', 'Coût unitaire de production rationnel', x.cuRat, '€', { tol: 0.01 }));
    var rows = [['Chiffre d’affaires'].concat(x.m.map(function (o) { return n(o.CA, 2); }), [n(x.tot.CA, 2)]),
      ['− Coût variable de production'].concat(x.m.map(function (o) { return n(o.CVP, 2); }), [n(U.r2(x.m.reduce(function (s, o) { return s + o.CVP; }, 0)), 2)]),
      ['− Coût variable de distribution'].concat(x.m.map(function (o) { return n(o.CVD, 2); }), [n(U.r2(x.m.reduce(function (s, o) { return s + o.CVD; }, 0)), 2)]),
      { cls: 'tot', cells: ['= Marge sur coût variable'].concat(x.m.map(function (o) { return n(o.MCV, 2); }), [n(x.tot.MCV, 2)]) },
      ['Taux de MCV'].concat(x.m.map(function (o) { return U.pc(o.tx, 1); }), [U.pc(x.tx, 1)]),
      ['− Charges fixes', '', '', '', n(p.CF, 2)], { cls: 'tot', cells: ['= Résultat', '', '', '', n(x.R, 2)] }];
    var crd = U.tbl(['', p.pr[0].nom[0], p.pr[1].nom[0], p.pr[2].nom[0], 'Total'], rows);
    var sous = x.ecart < 0;
    var c = [['Coefficient d’imputation rationnelle', n(a.AR) + ' ÷ ' + n(a.AN), n(x.coef, 4)], ['Charges fixes imputées', n(a.F) + ' × ' + n(x.coef, 4), e(x.FI)],
      ['Écart d’imputation', n(x.FI) + ' − ' + n(a.F), '<b>' + (sous ? 'coût de sous-activité ' : 'boni de suractivité ') + e(Math.abs(x.ecart)) + '</b>'],
      ['Coût unitaire complet', n(a.cvu) + ' + ' + n(a.F) + ' ÷ ' + n(a.AR), e(x.cuComplet)], ['Coût unitaire rationnel', n(a.cvu) + ' + ' + n(x.FI) + ' ÷ ' + n(a.AR) + ' (= ' + n(a.cvu) + ' + ' + n(a.F) + ' ÷ ' + n(a.AN) + ')', e(x.cuRat)]];
    var best = 0, worst = 0;
    x.m.forEach(function (o, i) { if (o.tx > x.m[best].tx) best = i; if (o.tx < x.m[worst].tx) worst = i; });
    var com = 'Le direct costing simple ne retient que les charges variables : chaque produit dégage une marge sur coût variable qui contribue à couvrir les ' + e(p.CF) + ' de charges fixes, traitées globalement. Les ' + p.pr[best].nom[0] + ' sont les plus contributifs (taux de MCV de ' + U.pc(x.m[best].tx, 1) + '), les ' + p.pr[worst].nom[0] + ' les moins (' + U.pc(x.m[worst].tx, 1) + ') ; tous ayant une marge positive, aucun ne doit être abandonné à court terme, car sa marge disparaîtrait alors que les charges fixes resteraient. ' + (x.R >= 0 ? 'Le résultat global est un bénéfice de ' + e(x.R) + '.' : 'La somme des marges ne couvre pas les charges fixes : la perte de ' + e(-x.R) + ' appelle une action sur les prix, les volumes ou les charges fixes.') + ' ';
    com += 'Dans l’atelier, l’activité réelle représente ' + U.pc(x.coef, 1) + ' de l’activité normale. ' + (sous ? 'En coût complet, les charges fixes sont réparties sur moins d’unités et le coût unitaire gonfle (' + U.e2(x.cuComplet) + ') : le produit supporterait le coût d’une capacité inemployée. L’imputation rationnelle ramène le coût à ' + U.e2(x.cuRat) + ' et isole un coût de sous-activité de ' + e(-x.ecart) + ', charge de la période imputable à la gestion de la capacité, qui ne doit pas être incorporée à la valeur des stocks.' : 'En coût complet, les charges fixes sont réparties sur plus d’unités et le coût unitaire baisse (' + U.e2(x.cuComplet) + '). L’imputation rationnelle retient un coût stable de ' + U.e2(x.cuRat) + ' et fait apparaître un boni de suractivité de ' + e(x.ecart) + ', gain lié à une meilleure utilisation des capacités.') + ' Le coût rationnel, indépendant des fluctuations d’activité, est une base plus fiable pour fixer les prix.';
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Compte de résultat par variabilité', html: crd }, { h: 'Imputation rationnelle', html: U.calc(c) }], comment: com };
  }
};

/* ---------- Méthode des coûts spécifiques (direct costing évolué) ---------- */
T.couts_specifiques = {
  id: 'couts_specifiques', nom: 'Méthode des coûts spécifiques', famille: 'Comptabilité de gestion', ctrl: false, minutes: 20,
  fiche: {
    objectif: 'Calculer la marge sur coût spécifique de chaque produit, la comparer au résultat en coût complet et décider du maintien ou de l’abandon d’un produit.',
    cours: [
      { t: 'Principe', l: [
        'Coût spécifique (ou coût direct) : coût variable du produit + charges fixes qui lui sont propres et disparaîtraient avec lui (amortissement d’une machine dédiée, salaire du chef de produit, publicité spécifique, loyer d’un atelier réservé).',
        'Charges fixes communes : charges qui subsistent quel que soit le portefeuille de produits (direction, siège, comptabilité) ; elles ne sont pas réparties.',
        'Marge sur coût spécifique (MCS) = marge sur coût variable − charges fixes spécifiques : c’est la contribution du produit à la couverture des charges communes.',
        'Résultat global = somme des MCS − charges fixes communes.'
      ] },
      { t: 'Décision de maintien ou d’abandon', l: [
        'MCS positive : le produit couvre ses charges propres et contribue aux charges communes ; l’abandonner ferait baisser le résultat du montant de sa MCS, même s’il paraît déficitaire en coût complet.',
        'MCS négative : le produit ne couvre même pas ses charges propres ; son abandon améliore le résultat du montant de sa MCS (sous réserve des effets commerciaux : produit d’appel, gamme complète, clientèle commune).',
        'Piège du coût complet : la répartition des charges communes (au prorata du CA par exemple) peut faire apparaître une perte sur un produit qui est pourtant rentable au sens de la MCS.',
        'Limites : distinction parfois délicate entre charges spécifiques et communes, raisonnement de court terme.'
      ] }
    ],
    etapes: [
      'Pour chaque produit : CA, coût variable, marge sur coût variable (MCV).',
      'Retrancher les charges fixes spécifiques : marge sur coût spécifique (MCS).',
      'Résultat global = Σ MCS − charges fixes communes.',
      'Si demandé, résultat en coût complet par produit : MCS − quote-part des charges communes (clé de répartition indiquée).',
      'Abandon d’un produit : nouveau résultat = résultat global − MCS du produit (sa MCV et ses charges spécifiques disparaissent, les charges communes demeurent).',
      'Conclure : maintien si MCS > 0, abandon envisageable si MCS < 0, en nuançant par les effets commerciaux.'
    ],
    pieges: [
      'Répartir les charges communes avant de décider : la décision se fonde sur la MCS, pas sur le résultat en coût complet.',
      'Supprimer les charges communes en même temps que le produit abandonné : elles subsistent.',
      'Classer en charges spécifiques des charges qui ne disparaîtraient pas avec le produit.',
      'Confondre MCV (direct costing simple) et MCS (direct costing évolué).'
    ],
    comptes: []
  },
  gen: function (r) {
    for (var t = 0; t < 300; t++) {
      var g = genGamme(r), m = mcvProduits(g.pr), X = r.int(0, 2), garder = r.chance(0.6);
      var CFS = m.map(function (o, i) { return U.r0(o.MCV * (i === X ? (garder ? r.int(55, 85) : r.int(110, 140)) : r.int(25, 55)) / 100 / 100) * 100; });
      var MCS = m.map(function (o, i) { return o.MCV - CFS[i]; }), sMCS = MCS.reduce(function (a, b) { return a + b; }, 0);
      var CFC = U.r0(sMCS * r.int(50, 85) / 100 / 1000) * 1000;
      var p = { nom: U.nom(r), act: g.act, pr: g.pr, CFS: CFS, CFC: CFC, X: X };
      var c = this.calc(p);
      if (CFC <= 0 || c.R <= 0) continue;
      if (garder ? !(c.MCS[X] > 0 && c.RC[X] < 0) : !(c.MCS[X] < 0)) continue;
      return p;
    }
  },
  calc: function (p) {
    var m = mcvProduits(p.pr), MCS = m.map(function (o, i) { return U.r2(o.MCV - p.CFS[i]); });
    var CA = U.r2(m.reduce(function (a, o) { return a + o.CA; }, 0)), sMCS = U.r2(MCS.reduce(function (a, b) { return a + b; }, 0));
    var R = U.r2(sMCS - p.CFC);
    var QP = m.map(function (o) { return U.r2(p.CFC * o.CA / CA); });
    QP[2] = U.r2(p.CFC - QP[0] - QP[1]);
    var RC = MCS.map(function (v, i) { return U.r2(v - QP[i]); });
    return { m: m, MCS: MCS, CA: CA, sMCS: sMCS, R: R, QP: QP, RC: RC, Rab: U.r2(R - MCS[p.X]) };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, n = U.n, X = p.pr[p.X].nom[0];
    var en = '<p>La société <b>' + p.nom + '</b> fabrique et vend ' + p.act + '. Données de l’exercice N :</p>';
    en += U.tbl(['', p.pr[0].nom[0], p.pr[1].nom[0], p.pr[2].nom[0]], [['Quantités vendues'].concat(p.pr.map(function (o) { return n(o.q); })), ['Prix de vente unitaire HT'].concat(p.pr.map(function (o) { return U.e2(o.p); })), ['Coût variable unitaire de production'].concat(p.pr.map(function (o) { return U.e2(o.cvp); })), ['Charges variables de distribution (% du CA)'].concat(p.pr.map(function (o) { return U.pcs(o.dist); })), ['Charges fixes spécifiques'].concat(p.CFS.map(function (v) { return e(v); }))]);
    en += '<p>Les charges fixes communes (direction, administration) s’élèvent à ' + e(p.CFC) + '. Le contrôleur de gestion les répartit habituellement au prorata du chiffre d’affaires ; en coût complet, les ' + X + ' apparaissent ' + (x.RC[p.X] < 0 ? 'déficitaires' : 'peu rentables') + ' et la direction envisage d’en arrêter la production. Les charges spécifiques disparaîtraient avec le produit.</p>';
    en += '<p class="consigne">1. Présentez le tableau de résultat selon la méthode des coûts spécifiques. 2. Calculez le résultat de chaque produit en coût complet. 3. Faut-il abandonner les ' + X + ' ? Chiffrez le résultat global après abandon.</p>';
    var qs = p.pr.map(function (o, i) { return Q('s' + i, 'Marge sur coût spécifique – ' + o.nom[0], x.MCS[i], '€'); });
    qs.push(Q('res', 'Résultat global', x.R, '€'), Q('rc', 'Résultat des ' + X + ' en coût complet', x.RC[p.X], '€'), Q('rab', 'Résultat global après abandon des ' + X, x.Rab, '€'),
      QC('dec', 'Décision', ['Maintenir les ' + X, 'Abandonner les ' + X], x.MCS[p.X] > 0 ? 0 : 1));
    var col = function (f) { return x.m.map(f); };
    var rows = [['Chiffre d’affaires'].concat(col(function (o) { return n(o.CA, 2); }), [n(x.CA, 2)]), ['− Coût variable'].concat(col(function (o) { return n(o.CV, 2); }), [n(U.r2(x.m.reduce(function (s, o) { return s + o.CV; }, 0)), 2)]),
      { cls: 'tot', cells: ['= Marge sur coût variable'].concat(col(function (o) { return n(o.MCV, 2); }), [n(U.r2(x.m.reduce(function (s, o) { return s + o.MCV; }, 0)), 2)]) },
      ['− Charges fixes spécifiques'].concat(p.CFS.map(function (v) { return n(v, 2); }), [n(p.CFS.reduce(function (a, b) { return a + b; }, 0), 2)]),
      { cls: 'tot', cells: ['= Marge sur coût spécifique'].concat(x.MCS.map(function (v) { return n(v, 2); }), [n(x.sMCS, 2)]) },
      ['− Charges fixes communes', '', '', '', n(p.CFC, 2)], { cls: 'tot', cells: ['= Résultat', '', '', '', n(x.R, 2)] }];
    var tab = U.tbl(['', p.pr[0].nom[0], p.pr[1].nom[0], p.pr[2].nom[0], 'Total'], rows);
    var cc = U.tbl(['', p.pr[0].nom[0], p.pr[1].nom[0], p.pr[2].nom[0], 'Total'], [['Marge sur coût spécifique'].concat(x.MCS.map(function (v) { return n(v, 2); }), [n(x.sMCS, 2)]), ['− Charges communes (prorata du CA)'].concat(x.QP.map(function (v) { return n(v, 2); }), [n(p.CFC, 2)]), { cls: 'tot', cells: ['= Résultat en coût complet'].concat(x.RC.map(function (v) { return n(v, 2); }), [n(x.R, 2)]) }]);
    var c = [['Résultat actuel', 'Σ MCS − charges communes', e(x.R)], ['Abandon des ' + X, n(x.R) + ' − (' + n(x.MCS[p.X]) + ')', '<b>' + e(x.Rab) + '</b>'], ['Variation du résultat', 'perte de la MCS des ' + X, e(U.r2(x.Rab - x.R))]];
    var garder = x.MCS[p.X] > 0;
    var com = 'La méthode des coûts spécifiques ne retient, pour chaque produit, que les charges qu’il génère : son coût variable et ses charges fixes propres. Les charges communes, qui subsisteraient quel que soit le portefeuille de produits, ne sont pas réparties. ' + (garder
      ? 'En coût complet, les ' + X + ' affichent une perte de ' + e(-x.RC[p.X]) + ', mais elle résulte de la quote-part de charges communes qui leur est attribuée. Leur marge sur coût spécifique est positive (' + e(x.MCS[p.X]) + ') : ils couvrent leurs charges propres et contribuent à la couverture des charges communes. Les abandonner ferait tomber le résultat global de ' + e(x.R) + ' à ' + e(x.Rab) + ', car les charges communes resteraient à la charge des autres produits. Il faut donc les maintenir, et chercher plutôt à améliorer leur marge (prix, coûts variables, charges spécifiques).'
      : 'La marge sur coût spécifique des ' + X + ' est négative (' + e(x.MCS[p.X]) + ') : ils ne couvrent même pas leurs charges propres et détruisent du résultat. Leur abandon porterait le résultat global de ' + e(x.R) + ' à ' + e(x.Rab) + '. Avant de décider, l’entreprise doit vérifier que l’arrêt n’entraîne pas la perte de clients communs aux autres produits (produit d’appel, gamme complète) et qu’une relance (hausse de prix, baisse des charges spécifiques) est impossible.') + ' La décision se fonde sur la marge sur coût spécifique, et non sur le résultat en coût complet, qui dépend d’une clé de répartition arbitraire.';
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Tableau des marges sur coût spécifique', html: tab }, { h: 'Résultat en coût complet (pour comparaison)', html: cc }, { h: 'Incidence de l’abandon', html: U.calc(c) }], comment: com };
  }
};

/* ---------- Charges fixes et charges variables ---------- */
// [libellé, nature (0 variable, 1 fixe, 2 semi-variable), justification]
var CHARGES_CLASSEES = [
  ['Matières premières consommées par la production', 0, 'la consommation augmente avec chaque unité produite'],
  ['Commissions des représentants (3 % du chiffre d’affaires)', 0, 'proportionnelles au chiffre d’affaires réalisé'],
  ['Emballages des produits expédiés', 0, 'un emballage par colis expédié'],
  ['Main-d’œuvre directe rémunérée à la pièce', 0, 'payée selon le nombre de pièces produites'],
  ['Transport sur ventes facturé au colis', 0, 'facturé en proportion du nombre de colis'],
  ['Loyer des bâtiments (montant mensuel constant)', 1, 'montant indépendant du niveau d’activité'],
  ['Prime d’assurance des locaux', 1, 'prime forfaitaire sans lien avec le volume produit'],
  ['Amortissement linéaire du matériel', 1, 'annuité constante quelle que soit l’utilisation'],
  ['Salaire du directeur administratif et financier', 1, 'rémunération mensuelle fixe'],
  ['Abonnement de télésurveillance de l’entrepôt', 1, 'forfait mensuel constant'],
  ['Facture d’électricité de l’atelier (abonnement + consommation au kWh)', 2, 'abonnement fixe et consommation variable'],
  ['Location du photocopieur (forfait mensuel + prix par copie)', 2, 'forfait fixe et coût variable à la copie'],
  ['Contrat de maintenance des machines (forfait + interventions facturées à l’heure)', 2, 'forfait fixe et interventions variables'],
  ['Forfait téléphonique (abonnement + minutes hors forfait)', 2, 'abonnement fixe et minutes supplémentaires variables']
];
// Charges semi-variables : activité x de min à max par pas, charge variable unitaire a, charge fixe b
var MIXTES = [
  { lib: 'Maintenance des machines', un: 'heures-machine', x: [400, 1200, 20], a: [3, 4, 5, 6, 8, 10, 12], b: [2000, 9000, 500] },
  { lib: 'Énergie de l’atelier', un: 'heures de fonctionnement', x: [300, 900, 10], a: [2, 2.5, 3, 4, 4.5, 6], b: [1500, 6000, 250] },
  { lib: 'Frais de transport', un: 'kilomètres parcourus', x: [8000, 30000, 500], a: [0.4, 0.5, 0.6, 0.8, 1.2], b: [1000, 5000, 250] },
  { lib: 'Frais de livraison', un: 'colis expédiés', x: [1000, 6000, 100], a: [2, 2.5, 3, 3.5, 4.5], b: [2000, 8000, 500] }
];
function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

T.charges_fv = {
  id: 'charges_fv', nom: 'Charges fixes et charges variables', famille: 'Comptabilité de gestion', ctrl: true, minutes: 18,
  fiche: {
    objectif: 'Classer les charges selon leur comportement face à l’activité, décomposer une charge semi-variable en part fixe et part variable par la méthode des points extrêmes, et en déduire la charge prévue et le coût unitaire.',
    cours: [
      { t: 'Charges variables, fixes et semi-variables', l: [
        'Charge variable (opérationnelle) : son montant total évolue avec le niveau d’activité (matières, énergie de production, commissions, emballages) ; si elle est proportionnelle, son montant par unité reste constant.',
        'Charge fixe (de structure) : son montant total ne dépend pas du niveau d’activité à court terme (loyers, assurances, amortissements linéaires, salaires du personnel permanent) ; par unité, elle diminue quand l’activité augmente.',
        'Charge semi-variable (mixte) : elle comprend une part fixe et une part variable (électricité : abonnement + consommation ; maintenance : forfait + interventions) ; elle doit être décomposée avant tout calcul de marge.',
        'Charges fixes par paliers (semi-fixes) : fixes dans un intervalle d’activité, elles augmentent par sauts au-delà d’une capacité (nouvel atelier, nouvel entrepôt, embauche).',
        'Intervalle de pertinence : le classement fixe ou variable n’est valable que pour une plage d’activité et un horizon de court terme ; à long terme, toutes les charges deviennent variables.',
        'Ne pas confondre : charges variables ou fixes (comportement face à l’activité) et charges directes ou indirectes (affectation au produit) ; une charge fixe peut être directe (amortissement d’une machine dédiée) et une charge variable indirecte (énergie d’un atelier commun).'
      ] },
      { t: 'Décomposition d’une charge semi-variable', l: [
        'Méthode des points extrêmes (haut-bas) : on retient les périodes d’activité la plus haute et la plus basse ; charge variable unitaire a = (charge haute − charge basse) ÷ (activité haute − activité basse).',
        'Charge fixe b = charge haute − a × activité haute (le calcul avec la période basse donne le même résultat) ; charge prévue pour une activité X = b + a × X.',
        'Ajustement linéaire (moindres carrés) : droite y = a x + b qui minimise l’écart avec l’ensemble des périodes ; plus fiable quand les données sont dispersées, mais lourd à la main ; les points extrêmes ignorent toutes les périodes intermédiaires.',
        'Coût unitaire = a + b ÷ X : la part variable est constante, la part fixe se dilue quand l’activité augmente (effet de taille).',
        'Utilité : compte de résultat différentiel, seuil de rentabilité, coût marginal, budgets flexibles (voir les fiches « Seuil de rentabilité » et « Commande spéciale »).'
      ] }
    ],
    etapes: [
      'Classer chaque charge : variable (évolue avec l’activité), fixe (indépendante de l’activité dans l’intervalle de pertinence) ou semi-variable (à décomposer) ; une charge fixe par paliers se calcule palier par palier.',
      'Repérer la période d’activité la plus haute et celle d’activité la plus basse du tableau (on raisonne sur l’activité, pas sur le montant des charges).',
      'Charge variable unitaire a = (charge haute − charge basse) ÷ (activité haute − activité basse).',
      'Charge fixe b = charge haute − a × activité haute ; contrôle avec la période basse : charge basse − a × activité basse.',
      'Charge prévue = b + a × activité prévue ; coût unitaire = charge prévue ÷ activité prévue, soit a + b ÷ activité.',
      'Charge fixe par paliers : nombre de paliers = activité ÷ capacité d’un palier, arrondi à l’entier supérieur ; charge fixe = nombre de paliers × charge d’un palier.'
    ],
    pieges: [
      'Retenir comme période haute et basse celles de charge extrême au lieu de celles d’activité extrême.',
      'Diviser l’écart de charges par l’écart de mois ou par le nombre de périodes au lieu de l’écart d’activité.',
      'Traiter une charge semi-variable comme entièrement variable : la marge sur coût variable serait faussée et le seuil de rentabilité aussi.',
      'Croire que la charge fixe unitaire est constante : c’est la charge fixe totale qui est constante, la charge fixe par unité diminue quand l’activité augmente.',
      'Oublier d’arrondir au palier supérieur : pour un besoin de 2,3 entrepôts, il faut en louer 3 et non 2,3.'
    ],
    comptes: []
  },
  gen: function (r) {
    for (var t = 0; t < 200; t++) {
      var m = r.pick(MIXTES), g = [], v;
      for (v = m.x[0]; v <= m.x[1]; v += m.x[2]) g.push(v);
      var xs = r.pickN(g, 6), lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs);
      if (hi - lo < (m.x[1] - m.x[0]) * 0.4) continue;
      var a = r.pick(m.a), b = r.int(m.b[0], m.b[1], m.b[2]), m0 = r.int(0, 6);
      // points extrêmes exactement sur la droite, périodes intermédiaires dispersées de ± 4 %
      var mois = xs.map(function (x, i) {
        var y = U.r0(b + a * x);
        if (x !== lo && x !== hi) y += U.r0(y * r.int(-4, 4) / 100);
        return { m: U.MOIS[m0 + i], x: x, y: y };
      });
      var cap = r.pick([500, 800, 1000, 1200, 1500, 2000]), k = r.int(1, 3);
      var pal = { cap: cap, F: r.int(6, 24) * 1000, V: cap * k + r.int(1, 9) * cap / 10 };
      return { nom: U.nom(r), lib: m.lib, un: m.un, mois: mois, prev: r.int(lo, hi, m.x[2]), pal: pal, cls: this.classes(r) };
    }
  },
  // quatre charges à classer : au moins une de chaque nature
  classes: function (r) {
    var par = [[], [], []], ch = [];
    CHARGES_CLASSEES.forEach(function (c, i) { par[c[1]].push(i); });
    par.forEach(function (l) { ch.push(r.pick(l)); });
    var reste = CHARGES_CLASSEES.map(function (c, i) { return i; }).filter(function (i) { return ch.indexOf(i) < 0; });
    ch.push(r.pick(reste));
    return r.shuffle(ch);
  },
  calc: function (p) {
    var d = p.mois, hi = 0, lo = 0;
    d.forEach(function (o, i) { if (o.x > d[hi].x) hi = i; if (o.x < d[lo].x) lo = i; });
    var a = (d[hi].y - d[lo].y) / (d[hi].x - d[lo].x), b = U.r2(d[hi].y - a * d[hi].x), bLo = U.r2(d[lo].y - a * d[lo].x);
    var P = U.r2(b + a * p.prev), np = Math.ceil(p.pal.V / p.pal.cap - 1e-9), dev = 0, devM = '';
    d.forEach(function (o, i) { var ec = o.y - (b + a * o.x); if (i !== hi && i !== lo && Math.abs(ec) > Math.abs(dev)) { dev = ec; devM = o.m; } });
    return { ihi: hi, ilo: lo, xhi: d[hi].x, xlo: d[lo].x, yhi: d[hi].y, ylo: d[lo].y, a: a, b: b, bLo: bLo, P: P, cfu: b / p.prev, ctu: P / p.prev,
      np: np, cfp: U.r2(np * p.pal.F), dev: dev, devM: devM };
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, e2 = U.e2, n = U.n, d = p.mois, ci = p.cls.map(function (i) { return CHARGES_CLASSEES[i]; });
    var NAT = ['variable', 'fixe', 'semi-variable'];
    var en = '<p>La société <b>' + p.nom + '</b> étudie le comportement de ses charges face à l’activité. Le contrôleur de gestion doit d’abord classer les charges suivantes :</p>' + U.ul(ci.map(function (c) { return c[0]; }));
    en += '<p>Il étudie ensuite la charge « ' + p.lib + ' », qui varie avec l’activité (' + p.un + ') sans lui être proportionnelle. Relevé des six derniers mois :</p>';
    en += U.tbl(['Mois', 'Activité (' + p.un + ')', 'Charge'], d.map(function (o) { return [cap1(o.m), n(o.x), e(o.y)]; }));
    en += '<p>Par ailleurs, la société stocke ses produits dans des entrepôts d’une capacité de ' + n(p.pal.cap) + ' unités, loués ' + e(p.pal.F) + ' par an chacun. Elle prévoit de stocker ' + n(p.pal.V) + ' unités sur l’année.</p>';
    en += '<p class="consigne">1. Définissez les charges fixes et les charges variables, puis classez les quatre charges ci-dessus. 2. Décomposez la charge « ' + p.lib + ' » en part fixe et part variable par la méthode des points extrêmes. 3. Calculez la charge prévue pour une activité de ' + n(p.prev) + ' ' + p.un + ' et le coût unitaire correspondant ; commentez l’évolution du coût unitaire avec l’activité. 4. Calculez la charge fixe annuelle de stockage.</p>';
    var qs = ci.map(function (c, i) { return QC('c' + i, 'Nature – ' + c[0], ['Charge variable', 'Charge fixe', 'Charge semi-variable'], c[1]); });
    qs.push(Q('cv', 'Charge variable par unité d’activité', x.a, '€', { tol: 0.01 }), Q('cf', 'Charge fixe mensuelle', x.b, '€'), Q('pv', 'Charge prévue pour ' + n(p.prev) + ' ' + p.un, x.P, '€'),
      Q('cfu', 'Charge fixe par unité d’activité à ce niveau', x.cfu, '€', { tol: 0.01 }), Q('ctu', 'Coût unitaire total à ce niveau', x.ctu, '€', { tol: 0.01 }), Q('pal', 'Charge fixe annuelle de stockage', x.cfp, '€'));
    var def = U.p('Une charge variable évolue avec le niveau d’activité (proportionnellement dans le cas simple) ; une charge fixe est indépendante de l’activité, sur un intervalle de pertinence et à court terme ; une charge semi-variable comprend une part fixe et une part variable, qu’il faut séparer.')
      + U.tbl(['Charge', 'Nature', 'Justification'], ci.map(function (c) { return [c[0], '<b>' + NAT[c[1]] + '</b>', c[2]]; }));
    var c1 = [['Activité la plus haute', cap1(d[x.ihi].m), n(x.xhi) + ' ' + p.un + ' pour ' + e(x.yhi)], ['Activité la plus basse', cap1(d[x.ilo].m), n(x.xlo) + ' ' + p.un + ' pour ' + e(x.ylo)],
      ['Charge variable par unité (a)', '(' + n(x.yhi) + ' − ' + n(x.ylo) + ') ÷ (' + n(x.xhi) + ' − ' + n(x.xlo) + ')', '<b>' + e2(x.a) + '</b>'],
      ['Charge fixe (b), avec la période haute', n(x.yhi) + ' − ' + n(x.a) + ' × ' + n(x.xhi), '<b>' + e(x.b) + '</b>'],
      ['Contrôle avec la période basse', n(x.ylo) + ' − ' + n(x.a) + ' × ' + n(x.xlo), e(x.bLo)],
      ['Équation de la charge mensuelle', 'y = a x + b', 'y = ' + n(x.a) + ' x + ' + n(x.b)]];
    var niv = [['Activité basse', x.xlo], ['Activité prévue', p.prev], ['Activité haute', x.xhi]].map(function (o, i) {
      var ch = U.r2(x.b + x.a * o[1]), cells = [o[0], n(o[1]), e(ch), e2(x.a), e2(x.b / o[1]), e2(ch / o[1])];
      return i === 1 ? { cls: 'tot', cells: cells } : cells;
    });
    var c2 = [['Charge prévue', n(x.b) + ' + ' + n(x.a) + ' × ' + n(p.prev), '<b>' + e(x.P) + '</b>'], ['Charge fixe par unité', n(x.b) + ' ÷ ' + n(p.prev), e2(x.cfu)], ['Coût unitaire total', n(x.P) + ' ÷ ' + n(p.prev), '<b>' + e2(x.ctu) + '</b>']];
    var c3 = [['Nombre d’entrepôts', n(p.pal.V) + ' ÷ ' + n(p.pal.cap) + ' = ' + n(p.pal.V / p.pal.cap, 2), '<b>' + n(x.np) + '</b> (arrondi à l’entier supérieur)'], ['Charge fixe annuelle de stockage', n(x.np) + ' × ' + n(p.pal.F), '<b>' + e(x.cfp) + '</b>']];
    var com = 'La charge « ' + p.lib + ' » est semi-variable : elle comprend une part fixe de ' + e(x.b) + ' par mois, due même sans activité, et une part variable de ' + e2(x.a) + ' par unité d’activité, soit l’équation y = ' + n(x.a) + ' x + ' + n(x.b) + '. ';
    com += 'La méthode des points extrêmes est simple mais fragile, car elle ne retient que deux périodes sur six : ' + (Math.abs(x.dev) < 0.5 ? 'ici les autres mois se placent sur la droite.' : 'ici, en ' + x.devM + ', la charge réelle s’écarte de ' + e(Math.abs(U.r2(x.dev))) + ' de la droite ; un ajustement par les moindres carrés exploiterait toutes les périodes.') + ' ';
    com += 'À ' + n(p.prev) + ' ' + p.un + ', le coût unitaire de ' + e2(x.ctu) + ' se décompose en ' + e2(x.a) + ' de charge variable, identique à tout niveau d’activité, et ' + e2(x.cfu) + ' de charge fixe, qui se dilue quand l’activité augmente (' + e2(x.b / x.xlo) + ' à l’activité basse, ' + e2(x.b / x.xhi) + ' à l’activité haute) : comparer des coûts unitaires de périodes d’activité différentes sans séparer le fixe du variable fausse l’analyse. ';
    com += 'Cette décomposition est la condition du compte de résultat différentiel : la part variable entre dans la marge sur coût variable, la part fixe dans les charges fixes, d’où le seuil de rentabilité et le coût marginal. ';
    com += 'Les entrepôts illustrent les charges fixes par paliers : la charge ne varie pas avec chaque unité stockée, mais un entrepôt supplémentaire devient nécessaire dès que la capacité est atteinte. Pour ' + n(p.pal.V) + ' unités, il faut ' + n(x.np) + ' entrepôts, soit ' + e(x.cfp) + ' par an ; la charge n’est fixe que dans l’intervalle de pertinence de ' + n(p.pal.cap) + ' unités par palier.';
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Définitions et classement des charges', html: def }, { h: 'Décomposition par les points extrêmes', html: U.calc(c1) }, { h: 'Charge prévue et coût unitaire', html: U.calc(c2) + U.tbl(['Niveau', 'Activité', 'Charge totale', 'Variable par unité', 'Fixe par unité', 'Coût unitaire'], niv) }, { h: 'Charge fixe par paliers', html: U.calc(c3) }], comment: com };
  }
};

/* ---------- Méthode ABC (Activity Based Costing) ---------- */
var ABC_PAIRES = [['Tables standard', 'Tables sur mesure'], ['Vélos de série', 'Vélos personnalisés'], ['Portes standard', 'Portes sur mesure'], ['Cartes électroniques standard', 'Cartes électroniques spécifiques'], ['Escaliers préfabriqués', 'Escaliers sur mesure']];
function minus1(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

T.abc = {
  id: 'abc', nom: 'Méthode ABC (coûts par activités)', famille: 'Comptabilité de gestion', ctrl: false, minutes: 25,
  fiche: {
    objectif: 'Répartir les charges indirectes par activités et inducteurs de coût (méthode ABC), calculer le coût de revient de chaque produit et le comparer à celui de la méthode des centres d’analyse pour repérer les produits sur- ou sous-évalués.',
    cours: [
      { t: 'Principe de la méthode ABC (Activity Based Costing)', l: [
        'Idée : les produits consomment des activités et les activités consomment des ressources (les charges) ; on impute donc les charges indirectes aux produits en suivant la consommation d’activités, et non le seul volume de production.',
        'Activité : ensemble de tâches homogènes qui consomme des ressources pour un résultat utile (lancer une série, contrôler la qualité, traiter une commande, livrer).',
        'Pool de coûts : ensemble des charges d’une même activité ; il remplace les centres d’analyse de la méthode classique, sans répartition secondaire.',
        'Inducteur de coût (cost driver) : mesure de l’activité qui explique le niveau de ses charges (nombre de lancements, de contrôles, de commandes, d’heures-machine) ; il joue le rôle de l’unité d’œuvre.',
        'Coût de l’inducteur = coût de l’activité ÷ nombre total d’inducteurs ; charge imputée à un produit = nombre d’inducteurs qu’il consomme × coût de l’inducteur.',
        'Coût de revient = charges directes + charges indirectes imputées par les inducteurs ; le total imputé doit égaler le total des charges indirectes.'
      ] },
      { t: 'Méthode ABC et méthode des centres d’analyse', l: [
        'Unité d’œuvre classique (heure de MOD, kg de matière) : proportionnelle au volume ; elle ignore la taille des séries et la complexité des produits.',
        'Inducteur ABC : indépendant du volume pour les activités liées aux séries (un lancement coûte autant pour 50 que pour 5 000 pièces) ; il révèle le coût des petites séries, des produits complexes et des commandes fractionnées.',
        'Subventions croisées : la méthode classique surévalue les produits standard en grandes séries et sous-évalue les produits spécifiques en petites séries ; ABC corrige cet effet.',
        'Hiérarchie des activités : liées à l’unité produite (heures-machine), au lot (lancement, réglage, commande), au produit (conception, gamme) ou à l’entreprise (direction, locaux) ; les dernières n’ont pas d’inducteur pertinent et sont souvent traitées à part.',
        'Limites : mise en œuvre longue et coûteuse (enquêtes, système d’information), choix des inducteurs parfois subjectif ; ABC reste une méthode de coût complet, dont une partie des charges fixes ne disparaîtrait pas avec le produit.'
      ] }
    ],
    etapes: [
      'Identifier les activités et regrouper les charges indirectes par activité (un pool de coûts par activité).',
      'Choisir pour chaque activité l’inducteur qui explique le mieux ses charges (lancements, contrôles, commandes, heures-machine).',
      'Coût de l’inducteur = coût de l’activité ÷ nombre total d’inducteurs consommés par l’ensemble des produits.',
      'Imputer à chaque produit : nombre d’inducteurs consommés × coût de l’inducteur, activité par activité, puis additionner.',
      'Coût de revient du produit = matières + main-d’œuvre directe + charges indirectes ABC ; diviser par la quantité pour le coût unitaire.',
      'Comparer au coût de la méthode des centres d’analyse : un écart marqué signale des subventions croisées entre produits ; calculer les résultats analytiques et commenter.'
    ],
    pieges: [
      'Diviser le coût de l’activité par la quantité produite au lieu du nombre d’inducteurs.',
      'Diviser par le nombre d’inducteurs d’un seul produit : le dénominateur est la somme des consommations de tous les produits.',
      'Oublier une activité ou compter deux fois des charges : le total imputé aux produits doit égaler le total des charges indirectes.',
      'Conclure à l’abandon d’un produit dont le résultat ABC est négatif : ABC est un coût complet ; il faut regarder la marge sur coût variable et les charges réellement évitables.',
      'Choisir une mesure de volume pour une activité qui dépend du nombre de séries ou de commandes : c’est le défaut que la méthode ABC veut corriger.'
    ],
    comptes: []
  },
  gen: function (r) {
    for (var t = 0; t < 300; t++) {
      var pa = r.pick(ABC_PAIRES), th = r.int(14, 30);
      var S = { nom: pa[0], q: r.int(20, 60) * 100, h: r.int(10, 30) / 10, m: r.int(8, 40), mh: r.int(5, 15) / 10 };
      var M = { nom: pa[1], q: r.int(3, 10) * 100, h: r.int(15, 40) / 10, m: r.int(10, 50), mh: r.int(8, 20) / 10 };
      // [activité, inducteur, nombre total, part des produits sur mesure (%), coût de l’inducteur] : les petites séries pèsent sur les lancements, contrôles et commandes
      var acts = [['Lancement et préparation des séries', 'lancements de série', r.int(30, 90), r.int(55, 80), r.int(40, 150) * 10], ['Contrôle qualité', 'contrôles réalisés', r.int(150, 400), r.int(40, 65), r.int(10, 60) * 5],
        ['Gestion des commandes et livraisons', 'commandes traitées', r.int(300, 900), r.int(35, 60), r.int(20, 80)]].map(function (s) {
        var nM = U.r0(s[2] * s[3] / 100);
        return { nom: s[0], ind: s[1], u: s[4], n: [s[2] - nM, nM] };
      });
      acts.push({ nom: 'Maintenance et énergie des machines', ind: 'heures-machine', u: r.int(4, 12), n: [U.r0(S.q * S.mh), U.r0(M.q * M.mh)] });
      var swap = r.chance(0.5), iM = swap ? 0 : 1, iS = 1 - iM;
      if (swap) acts.forEach(function (a) { a.n.reverse(); });
      var p = { nom: U.nom(r), th: th, prod: swap ? [M, S] : [S, M], acts: acts };
      var x = this.calc(p);
      if (!(x.pr[iM].cua > x.pr[iM].cut * 1.1 && x.pr[iS].cua < x.pr[iS].cut)) continue;
      p.prod[iS].v = U.r0(x.pr[iS].cut * r.int(108, 130) / 100);
      // prix des produits sur mesure : tantôt fixé sur l’ancien coût (le produit s’avère déficitaire en ABC), tantôt sur le coût ABC (il reste rentable)
      p.prod[iM].v = r.chance(0.4) ? U.r0(x.pr[iM].cua * r.int(103, 125) / 100) : U.r0(x.pr[iM].cut * r.int(100, 120) / 100);
      return p;
    }
  },
  calc: function (p) {
    var x = {}, hT = 0;
    x.act = p.acts.map(function (a) { var nt = a.n[0] + a.n[1]; return { T: nt, C: U.r2(a.u * nt), imp: [U.r2(a.n[0] * a.u), U.r2(a.n[1] * a.u)] }; });
    x.Ctot = U.r2(x.act.reduce(function (s, a) { return s + a.C; }, 0));
    p.prod.forEach(function (o) { hT += o.q * o.h; });
    x.H = U.r2(hT); x.uo = x.Ctot / x.H;
    x.pr = p.prod.map(function (o, i) {
      var y = { mat: U.r2(o.q * o.m), mod: U.r2(o.q * o.h * p.th), it: U.r2(o.q * o.h * x.uo) };
      y.ia = U.r2(x.act.reduce(function (s, a) { return s + a.imp[i]; }, 0));
      y.cra = U.r2(y.mat + y.mod + y.ia); y.crt = U.r2(y.mat + y.mod + y.it); y.cua = y.cra / o.q; y.cut = y.crt / o.q;
      if (o.v) { y.ca = U.r2(o.q * o.v); y.ra = U.r2(y.ca - y.cra); y.rt = U.r2(y.ca - y.crt); }
      return y;
    });
    // produit que la méthode actuelle sous-évalue : celui dont le coût ABC dépasse le plus le coût classique
    x.iM = x.pr[0].cua / x.pr[0].cut > x.pr[1].cua / x.pr[1].cut ? 0 : 1;
    return x;
  },
  solve: function (p) {
    var x = this.calc(p), e = U.e, e2 = U.e2, n = U.n, P = p.prod, I = x.iM, J = 1 - I, cm = x.pr[I], cs = x.pr[J];
    var en = '<p>La société <b>' + p.nom + '</b> fabrique deux gammes de produits : les ' + minus1(P[0].nom) + ' et les ' + minus1(P[1].nom) + '. Données de l’exercice N (production égale aux ventes, aucun stock) :</p>';
    en += U.tbl(['', P[0].nom, P[1].nom], [['Quantités produites et vendues', n(P[0].q), n(P[1].q)], ['Prix de vente unitaire HT', e(P[0].v), e(P[1].v)], ['Matière première par unité', e(P[0].m), e(P[1].m)],
      ['Main-d’œuvre directe par unité (heures)', n(P[0].h, 1), n(P[1].h, 1)], ['Temps machine par unité (heures)', n(P[0].mh, 1), n(P[1].mh, 1)]]);
    en += '<p>La main-d’œuvre directe coûte ' + e(p.th) + ' de l’heure, charges comprises. Les charges indirectes de l’exercice s’élèvent à ' + e(x.Ctot) + ' ; elles sont regroupées par activité :</p>';
    en += U.tbl(['Activité', 'Charges', 'Inducteur', P[0].nom, P[1].nom], p.acts.map(function (a, i) { return [a.nom, e(x.act[i].C), a.ind, n(a.n[0]), n(a.n[1])]; }));
    en += '<p>Jusqu’ici, la société répartit toutes ses charges indirectes dans un centre unique, au prorata des heures de main-d’œuvre directe (unité d’œuvre : l’heure de main-d’œuvre directe).</p>';
    en += '<p class="consigne">1. Rappelez le principe de la méthode ABC et ses différences avec la méthode des centres d’analyse. 2. Calculez le coût de chaque inducteur, puis le coût de revient unitaire de chaque produit par la méthode ABC. 3. Calculez le coût de revient unitaire par la méthode actuelle. 4. Calculez le résultat analytique de chaque produit dans les deux méthodes, comparez et commentez.</p>';
    var qs = p.acts.map(function (a, i) { return Q('i' + (i + 1), 'Coût de l’inducteur « ' + a.ind + ' »', a.u, '€', { tol: 0.01 }); });
    qs.push(Q('cua0', 'Coût de revient unitaire ABC – ' + P[0].nom, x.pr[0].cua, '€', { tol: 0.02 }), Q('cua1', 'Coût de revient unitaire ABC – ' + P[1].nom, x.pr[1].cua, '€', { tol: 0.02 }),
      Q('uo', 'Coût de l’heure de main-d’œuvre directe (méthode actuelle)', x.uo, '€', { tol: 0.01 }),
      Q('cut0', 'Coût de revient unitaire actuel – ' + P[0].nom, x.pr[0].cut, '€', { tol: 0.02 }), Q('cut1', 'Coût de revient unitaire actuel – ' + P[1].nom, x.pr[1].cut, '€', { tol: 0.02 }),
      Q('ram', 'Résultat analytique ABC – ' + P[I].nom, cm.ra, '€'), QC('sous', 'Produit sous-évalué par la méthode actuelle', [P[0].nom, P[1].nom], I));
    var def = U.p('La méthode ABC part du constat que les produits consomment des activités, et les activités des ressources. Les charges indirectes sont regroupées par activité ; le coût de chaque activité est ramené à un inducteur (lancement, contrôle, commande, heure-machine), puis imputé aux produits selon le nombre d’inducteurs qu’ils consomment. Contrairement à l’unité d’œuvre classique, proportionnelle au volume, l’inducteur mesure la cause de la dépense : un produit en petites séries déclenche beaucoup de lancements, de contrôles et de commandes pour peu d’heures de main-d’œuvre.');
    var ind = U.tbl(['Activité', 'Charges', 'Inducteur', 'Nombre d’inducteurs', 'Coût de l’inducteur'], p.acts.map(function (a, i) { return [a.nom, e(x.act[i].C), a.ind, n(x.act[i].T) + ' (' + n(a.n[0]) + ' + ' + n(a.n[1]) + ')', e2(a.u)]; }));
    var imp = p.acts.map(function (a, i) { return [a.nom, n(a.n[0]) + ' × ' + n(a.u, 2) + ' = ' + n(x.act[i].imp[0], 2), n(a.n[1]) + ' × ' + n(a.u, 2) + ' = ' + n(x.act[i].imp[1], 2)]; });
    imp.push({ cls: 'tot', cells: ['Total des charges indirectes', n(x.pr[0].ia, 2), n(x.pr[1].ia, 2)] });
    var abc = U.tbl(['Coût de revient ABC', P[0].nom, P[1].nom], [['Matière première', n(P[0].q) + ' × ' + n(P[0].m) + ' = ' + n(x.pr[0].mat, 2), n(P[1].q) + ' × ' + n(P[1].m) + ' = ' + n(x.pr[1].mat, 2)],
      ['Main-d’œuvre directe', n(P[0].q * P[0].h) + ' h × ' + n(p.th) + ' = ' + n(x.pr[0].mod, 2), n(P[1].q * P[1].h) + ' h × ' + n(p.th) + ' = ' + n(x.pr[1].mod, 2)], ['Charges indirectes (ABC)', n(x.pr[0].ia, 2), n(x.pr[1].ia, 2)],
      { cls: 'tot', cells: ['Coût de revient', n(x.pr[0].cra, 2), n(x.pr[1].cra, 2)] }, ['Coût de revient unitaire', n(x.pr[0].cua, 2), n(x.pr[1].cua, 2)],
      ['Chiffre d’affaires', n(x.pr[0].ca, 2), n(x.pr[1].ca, 2)], { cls: 'tot', cells: ['Résultat analytique', n(x.pr[0].ra, 2), n(x.pr[1].ra, 2)] }]);
    var sg = function (v) { return (v > 0 ? '+' : '') + n(v, 2); };
    var cmp = U.calc([['Coût de l’heure de main-d’œuvre directe', n(x.Ctot) + ' ÷ ' + n(x.H) + ' h', '<b>' + e(x.uo, 4) + '</b>']])
      + U.tbl(['Comparaison', P[0].nom, P[1].nom], [['Charges indirectes par unité, méthode actuelle', n(P[0].h, 1) + ' h × ' + n(x.uo, 4) + ' = ' + n(x.pr[0].it / P[0].q, 2), n(P[1].h, 1) + ' h × ' + n(x.uo, 4) + ' = ' + n(x.pr[1].it / P[1].q, 2)],
        ['Charges indirectes par unité, ABC', n(x.pr[0].ia / P[0].q, 2), n(x.pr[1].ia / P[1].q, 2)], ['Coût de revient unitaire, méthode actuelle', n(x.pr[0].cut, 2), n(x.pr[1].cut, 2)], ['Coût de revient unitaire, ABC', n(x.pr[0].cua, 2), n(x.pr[1].cua, 2)],
        { cls: 'tot', cells: ['Écart ABC − méthode actuelle', sg(x.pr[0].cua - x.pr[0].cut), sg(x.pr[1].cua - x.pr[1].cut)] }, ['Résultat analytique, méthode actuelle', n(x.pr[0].rt, 2), n(x.pr[1].rt, 2)], ['Résultat analytique, ABC', n(x.pr[0].ra, 2), n(x.pr[1].ra, 2)]]);
    var shH = U.r2(P[I].q * P[I].h) / x.H, parts = p.acts.slice(0, 3).map(function (a) { return U.pc(a.n[I] / (a.n[0] + a.n[1]), 0) + ' des ' + a.ind; });
    var res = function (v) { return v >= 0 ? 'un bénéfice de ' + e(v) : 'une perte de ' + e(-v); };
    var com = [];
    com.push('Avec la méthode actuelle, les ' + minus1(P[I].nom) + ' semblent coûter ' + e2(cm.cut) + ' l’unité et dégager ' + res(cm.rt) + '. La méthode ABC les fait coûter ' + e2(cm.cua) + ', soit ' + e2(cm.cua - cm.cut) + ' de plus (' + U.pc(cm.cua / cm.cut - 1, 0) + '), et ramène leur résultat à ' + res(cm.ra) + '. À l’inverse, les ' + minus1(P[J].nom) + ' passent de ' + e2(cs.cut) + ' à ' + e2(cs.cua) + ' l’unité : leur coût était surévalué.');
    com.push('L’écart vient de l’unité d’œuvre. Les ' + minus1(P[I].nom) + ' ne représentent que ' + U.pc(shH, 0) + ' des heures de main-d’œuvre directe, donc ' + U.pc(shH, 0) + ' des charges indirectes avec la méthode actuelle, mais cette gamme consomme ' + parts[0] + ', ' + parts[1] + ' et ' + parts[2] + '. Ces activités dépendent du nombre de séries et de commandes, non du nombre d’unités : la méthode actuelle faisait supporter aux ' + minus1(P[J].nom) + ' des coûts causés par les petites séries (subvention croisée).');
    com.push((cm.ra < 0 ? 'Le résultat négatif des ' + minus1(P[I].nom) + ' en ABC montre que leur prix ne couvre pas les activités mobilisées ;' : 'Les ' + minus1(P[I].nom) + ' restent rentables en ABC, mais bien moins que la méthode actuelle ne le laissait croire ; ') + 'l’entreprise peut relever leur prix, facturer les options et les petites commandes, regrouper les séries et les livraisons pour réduire les lancements, les contrôles et les commandes, ou standardiser les composants.');
    com.push('ABC reste une méthode de coût complet : une partie de ces charges est fixe et ne disparaîtrait pas avec le produit. Avant toute décision d’abandon, il faut raisonner en marge sur coût variable ou en coût spécifique. La méthode a aussi un coût de mise en œuvre (enquêtes sur les activités, suivi des inducteurs) qui se justifie quand les charges indirectes sont élevées et la gamme diversifiée.');
    return { enonce: en, questions: qs, journal: [], steps: [{ h: 'Principe de la méthode', html: def }, { h: 'Coût des inducteurs', html: ind }, { h: 'Imputation des charges indirectes aux produits', html: U.tbl(['Activité', P[0].nom, P[1].nom], imp) }, { h: 'Coût de revient et résultat (méthode ABC)', html: abc }, { h: 'Comparaison avec la méthode actuelle', html: cmp }], comment: com.join(' ') };
  }
};

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

/* ===== Sujets réels : données des annales, résultats attendus (corrigés publiés ou recalculés) ===== */
ANNALES = [
  { id: 'ifip26_1', src: 'Inspecteur 2026 – exercice 1', type: 'commande', ctrl: false,
    p: { nom: 'PATRA', prod: ['tables de jardin en fibre composite', 'table'], p: 582, cvu: 300, q: 700, CF: 127400, q2: 280, p2: 345, cvu2: 300, dCF: 0, mois: 'mai' },
    attendu: { r0: 70000, r1: 82600, cm: 84000, cmu: 300, rm: 96600, res: 12600, dec: 0 } },
  { id: 'ifip26_2', src: 'Inspecteur 2026 – exercice 2', type: 'ratios', ctrl: false,
    note: 'Dans le PDF, la colonne des montants est décalée d’une ligne ; les valeurs retenues sont celles qui équilibrent le bilan (capitaux propres 700 000 €, résultat 120 000 €, CA 1 500 000 €, dettes à long terme 600 000 €, liquidités 300 000 €, actif circulant 1 000 000 €, passif circulant 900 000 €).',
    p: { nom: 'BARRINGTON', TP: 2200000, CP: 700000, RN: 120000, CA: 1500000, DLT: 600000, DISP: 300000, AC: 1000000, PC: 900000, ST: 0, CL: 700000, FOU: 0, ACH: 0, liste: ['endet', 'liqG', 'roe'], hideST: true },
    attendu: { endet: 68.18, liqG: 1.11, roe: 17.14 } },
  { id: 'ifip26_3', src: 'Inspecteur 2026 – exercice 3', type: 'affectation', ctrl: true,
    p: { nom: 'ALBOROSIE', C: 1000000, v: 10, lib: 1, RL0: 60000, RAN0: 1500, R: 110000, t: 0.05, RS: 0, F: 0, arr: 0.5, mode: 'super', dateAG: '28/06/N+1' },
    attendu: { rl: 5500, bd: 106000, is: 50000, du: 1, dt: 100000, ran: 6000 } },
  { id: 'ifip26_4', src: 'Inspecteur 2026 – exercice 4', type: 'tva_coef', ctrl: false,
    note: 'Lecture retenue par les corrigés publiés : formation exonérée, donc dans le champ (assujettissement 1, taxation 0,68). Si l’on traite la formation comme hors champ (étages 3 et 4), assujettissement 3/5 = 0,6 et taxation 1 : déduction 0,6.',
    p: { nom: 'SIZZLA', actT: 'la construction d’aéronefs', actE: 'la formation en mécanique aéronautique', exoTxt: 'exonérée de TVA', T: 11220000, E: 5280000, P: 825700, m: 8, duree: 30, niveaux: 5, hc: 0 },
    attendu: { as: 1, ta: 0.68, ad: 1, de: 0.68, tvad: 112295.20, cout: 878544.80, dot: 12202.01 } },
  { id: 'cfip26_1', src: 'Contrôleur 2026 – question 1', type: 'affectation', ctrl: true,
    p: { nom: 'CORFU', C: 45000, v: 15, lib: 1, RL0: 4320, RAN0: -870, R: 5745, t: 0, RS: 0, F: 800, arr: 1, mode: 'unique' },
    attendu: { rl: 180, bd: 4695, du: 1, dt: 3000, ran: 895 } },
  { id: 'cfip26_2', src: 'Contrôleur 2026 – question 2', type: 'derog', ctrl: true,
    p: { nom: 'MADRIGAL', bien: { lib: 'un bras robotique', compte: '2154', amort: '28154' }, prix: 25000, remise: 0, frais: [{ lib: 'Frais de montage', mt: 3000, incl: true }], mes: { d: 1, m: 7 }, n: 10, fiscal: 'deg' },
    attendu: { cout: 28000, c0: 1400, f0: 3150, d0: 1750, f1: 5591.25, s2: 6074.47 } },
  { id: 'cfip26_3', src: 'Contrôleur 2026 – question 3', type: 'tva_ca3', ctrl: true,
    note: 'Dans le PDF, la colonne des montants est décalée ; montants retenus : 4452 = 2 457 ; 44562 = 2 489 ; 445661 = 38 657 ; 445662 = 2 796 ; 44567 = 1 678 ; 4457 = 86 355.',
    p: { nom: 'BIJADOM’', mode: 'soldes', mois: 11, s: { c4457: 86355, c4452: 2457, d44562: 2489, d44566: 38657, d445662: 2796, d44567: 1678 } },
    attendu: { coll: 86355, due: 2457, ded: 43942, sens: 0, net: 43192 } },
  { id: 'test_1', src: 'Sujet test inspecteur – cas 1', type: 'augcap', ctrl: false,
    note: 'Le corrigé officiel porte 400 € de TVA sur les frais : c’est une coquille (20 % de 4 000 € = 800 €, cohérent avec le décaissement de 4 800 €).',
    p: { nom: 'CAPITALISONS', mode: 'num', v: 100, n: 2000, E: 120, lib: 0.25, frais: 4000, fraisMode: 'etab', date: { d: 1, m: 6 }, vers: { d: 14, m: 6 } },
    attendu: { pr: 40000, ve: 90000, na: 150000, dotf: 466.67 } },
  { id: 'test_2', src: 'Sujet test inspecteur – cas 2', type: 'seuil', ctrl: true,
    note: 'Le corrigé officiel arrondit le taux de MCV à 0,5625 : 1 337 493 € et 385 unités. Sans arrondi : 1 337 545 € et 386 unités (avec 385, le résultat reste négatif).',
    p: { nom: 'le sujet test', prod: ['produits', 'produit'], p: 3470, q: 1200, CV: 1821840, cvu: 1518.2, CF: 752340, global: true, dCA: 0.1 },
    attendu: { mcv: 2342160, tx: 56.25, sr: 1337545, srq: 386 } },
  { id: 'test_3', src: 'Sujet test inspecteur – cas 3', type: 'sig_caf', ctrl: true,
    p: { nom: 'CORSIC’AUBRAC', k: true, ebeOnly: true, EBE: 514, DAPtot: 110, AP: 0, AC: 0, PFt: 14, RF: 0, CFt: 6, DF: 0, PEt: 75, PCEA: 38, QPS: 14, REX: 0, CEt: 33, VCEC: 23, DEX: 0, PART: 50, IS: 130, DIV: 120, RDP: 0, DA: 110, DDAC: 0, DPR: 0 },
    attendu: { caf: 355, af: 235 } },
  { id: 'blanc_1', src: 'Sujet blanc (dossier d’entraînement) – NOVALIS', type: 'sig_caf', ctrl: true,
    p: { nom: 'NOVALIS', k: true, VM: 1200, AM: 700, VSM: -20, PV: 2800, PS: 50, PI: 30, AMP: 1100, VSMP: 30, ACE: 600, SE: 40, IT: 80, SAL: 900, CS: 360, DA: 250, DDAC: 30, DPR: 20, AC: 10, RDP: 20, AP: 10, PFt: 15, RF: 5, CFt: 50, INT: 45, DF: 5, PEt: 60, PCEA: 50, QPS: 10, REX: 0, CEt: 45, VCEC: 40, DEX: 0, PART: 0, IS: 15, DIV: 20 },
    attendu: { mc: 520, prod: 2880, va: 1670, ebe: 370, re: 90, rcai: 55, rex: 15, rn: 55, caf: 315, af: 295, pva: 75.4 } },
  { id: 'blanc_2', src: 'Sujet blanc (dossier d’entraînement) – BELCAMP', type: 'bilan_fonc', ctrl: true,
    p: { nom: 'BELCAMP', k: true, II: [200, 80], IC: [3000, 1200], IF: [150, 10], ST: [400, 20], CL: [900, 40], AUT: 120, VMP: 60, DISP: 90, CCA: 20, CSNA: 0, CAP: 1000, RESV: 600, RES_: 150, SUB: 100, PROV: 80, EMP: 730, CBC: 70, ICNE: 0, FOU: 600, DFS: 250, ISD: 40, DIMMO: 50, PCA: 30, CA: 4000 },
    attendu: { es: 3350, rs: 3940, frng: 590, bfre: 480, bfrhe: 30, tn: 80, j: 43.2 } },
  { id: 'blanc_3', src: 'Sujet blanc (dossier d’entraînement) – TERRANOVA, machine', type: 'derog', ctrl: true,
    p: { nom: 'TERRANOVA', bien: { lib: 'une machine', compte: '2154', amort: '28154' }, prix: 48000, remise: 0, frais: [{ lib: 'Transport', mt: 1500, incl: true }, { lib: 'Installation', mt: 2500, incl: true }, { lib: 'Formation des opérateurs', mt: 1000, incl: false }], mes: { d: 1, m: 4 }, n: 5, fiscal: 'deg' },
    attendu: { cout: 52000, c0: 7800, f0: 13650, d0: 5850, f1: 13422.5 } },
  { id: 'blanc_3b', src: 'Sujet blanc (dossier d’entraînement) – TERRANOVA, créance et litige', type: 'depreciations', ctrl: false,
    p: { nom: 'TERRANOVA', items: [{ k: 'douteux', cl: 'Dupuis', ttc: 3600, p: 0.3 }, { k: 'litige', obj: 'Un salarié licencié réclame 15 000 € aux prud’hommes', est: 15000, prev: 0 }] },
    attendu: { i0: 900, i1: 15000 } },
  { id: 'blanc_3c', src: 'Sujet blanc (dossier d’entraînement) – TERRANOVA, régularisations', type: 'regul', ctrl: true,
    p: { nom: 'TERRANOVA', items: [{ k: 'cca_loyer', per: 3, mt: 4500, m: 12 }, { k: 'fnp', nat: ['électricité de décembre', '6061'], ht: 1200 }] },
    attendu: { i0: 3000, i1: 1440 } },
  { id: 'blanc_4', src: 'Sujet blanc (dossier d’entraînement) – ORBIS', type: 'seuil', ctrl: true,
    p: { nom: 'ORBIS', prod: ['articles', 'article'], p: 40, q: 20000, cvu: 24, CF: 240000, global: false, dCA: 0.1 },
    attendu: { mcv: 320000, tx: 40, res: 80000, sr: 600000, srq: 15000, pm: 270, ms: 200000, is: 25, lo: 4, r2: 112000 } }
];

if (typeof module !== "undefined") module.exports = { T: T, ANNALES: ANNALES, U: U, AM: AM };
