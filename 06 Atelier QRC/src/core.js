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
