// Assemble le moteur (pour les tests) et la page autonome publiée sur le site (/qrc/).
// La charte vient de « 07 Charte DA/pastille » (tokens.css puis appli.css), commune aux trois applis.
// La synchro du compte vient de commun/sync.js, partagé avec les autres applis.
const fs = require('fs'), path = require('path');
const S = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const ENGINE = ['core.js', 't_affect_tva.js', 't_immo_inv.js', 't_capital_gestion.js', 't_analyse.js', 't_fiscal.js', 't_flux.js', 't_bases.js', 't_tresorerie.js', 't_synthese.js', 'annales.js'];
const engine = ENGINE.map(S).join('\n');
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'engine.js'), engine + '\nif (typeof module !== "undefined") module.exports = { T: T, ANNALES: ANNALES, U: U, AM: AM };\n');
if (fs.existsSync(path.join(__dirname, 'src', 'app.js'))) {
  const sync = fs.readFileSync(path.join(__dirname, '..', 'commun', 'sync.js'), 'utf8');
  // Charte « Pastille » : jetons puis composants communs aux trois applis, avant le style propre à l'atelier.
  const charte = ['tokens.css', 'appli.css'].map(f => fs.readFileSync(path.join(__dirname, '..', '07 Charte DA', 'pastille', f), 'utf8')).join('\n');
  if (/<\/script/i.test(sync + engine + S('app.js'))) throw new Error('Un script contient </script>');
  const reset = 'html{-webkit-text-size-adjust:100%}body{margin:0}img{max-width:100%}[hidden]{display:none!important}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}';
  const pwa = '<link rel="manifest" href="../manifest.webmanifest">\n<meta name="theme-color" content="#F7F5FF" media="(prefers-color-scheme: light)">\n<meta name="theme-color" content="#1A1926" media="(prefers-color-scheme: dark)">\n<link rel="icon" href="../prepa.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="../icones/icone-180.png">\n';
  const sw = '<script>if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("../sw.js").catch(function(){});</script>\n';
  const local = '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + pwa + S('head.html') + '\n<style>\n' + reset + '\n' + charte + '\n' + S('style.css') + '\n</style>\n</head>\n<body>\n' + S('body.html') + '\n<script>\n' + sync + '\n</script>\n<script>\n' + engine + '\n' + S('app.js') + '\n</script>\n' + sw + '</body>\n</html>\n';
  fs.writeFileSync(path.join(__dirname, 'dist', 'apercu_local.html'), local);
  fs.writeFileSync(path.join(__dirname, 'Atelier QRC compta.html'), local);
  console.log('page :', (local.length / 1024).toFixed(0), 'Ko');
}
console.log('moteur :', (engine.length / 1024).toFixed(0), 'Ko');
