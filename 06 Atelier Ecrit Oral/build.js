// Assemble la page autonome « Atelier Ecrit Oral.html » à partir de src/.
// La charte vient directement de « 07 Charte DA/pastille » (tokens.css puis appli.css, communs aux trois applis) : rien à recopier à la main.
// La synchro du compte vient de « commun/sync.js », partagé avec les autres applis.
const fs = require('fs'), path = require('path');
const SRC = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const CHARTE = path.join(__dirname, '..', '07 Charte DA', 'pastille');
const charte = f => {
  const p = path.join(CHARTE, f);
  if (!fs.existsSync(p)) { console.error('Introuvable : ' + p); process.exit(1); }
  return fs.readFileSync(p, 'utf8');
};

const reset = 'html{-webkit-text-size-adjust:100%}body{margin:0}img{max-width:100%}[hidden]{display:none!important}';
const css = [
  '/* --- « 07 Charte DA/pastille/tokens.css » --- */', charte('tokens.css'),
  '/* --- « 07 Charte DA/pastille/appli.css » --- */', charte('appli.css'),
  SRC('style.css')
].join('\n');
const js = [SRC('data.js'), SRC('core.js'), SRC('app.js')].join('\n');
// Synchro du compte, partagée avec les autres applis ; manifeste et service worker du site (chemins relatifs à /atelier/).
const sync = fs.readFileSync(path.join(__dirname, '..', 'commun', 'sync.js'), 'utf8');
if (/<\/script/i.test(sync + js)) { console.error('Un script contient </script>'); process.exit(1); }
const pwa = '<link rel="manifest" href="../manifest.webmanifest">\n<meta name="theme-color" content="#F7F5FF" media="(prefers-color-scheme: light)">\n<meta name="theme-color" content="#1A1926" media="(prefers-color-scheme: dark)">\n<link rel="apple-touch-icon" href="../icones/icone-180.png">\n';
const sw = '<script>if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("../sw.js").catch(function(){});</script>\n';

const page = '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  + pwa + SRC('head.html') + '\n<style>\n' + reset + '\n' + css + '\n</style>\n</head>\n<body>\n'
  + SRC('body.html') + '\n<script>\n' + sync + '\n</script>\n<script>\n' + js + '\n</script>\n' + sw + '</body>\n</html>\n';

// Contrôle : chaque script de la page doit s’analyser sans erreur
const scripts = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
scripts.forEach((code, i) => {
  try { new Function(code); } catch (e) { console.error('Script ' + (i + 1) + ' invalide : ' + e.message); process.exit(1); }
});

const out = path.join(__dirname, 'Atelier Ecrit Oral.html');
fs.writeFileSync(out, page);
console.log('Atelier Ecrit Oral.html :', (page.length / 1024).toFixed(0), 'Ko,', scripts.length, 'scripts analysés sans erreur');
