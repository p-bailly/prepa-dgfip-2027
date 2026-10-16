// Assemble le moteur (pour les tests) et la page autonome (pour l'Artifact).
const fs = require('fs'), path = require('path');
const S = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const ENGINE = ['core.js', 't_affect_tva.js', 't_immo_inv.js', 't_capital_gestion.js', 't_analyse.js', 't_fiscal.js', 'annales.js'];
const engine = ENGINE.map(S).join('\n');
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'engine.js'), engine + '\nif (typeof module !== "undefined") module.exports = { T: T, ANNALES: ANNALES, U: U, AM: AM };\n');
if (fs.existsSync(path.join(__dirname, 'src', 'app.js'))) {
  const page = S('head.html') + '\n<style>\n' + S('style.css') + '\n</style>\n' + S('body.html') + '\n<script>\n' + engine + '\n' + S('app.js') + '\n</script>\n';
  fs.writeFileSync(path.join(__dirname, 'dist', 'Atelier_QRC.html'), page);
  // Version locale autonome (fichier à ouvrir directement dans le navigateur, progression dans le navigateur)
  const reset = 'html{-webkit-text-size-adjust:100%}body{margin:0}img{max-width:100%}[hidden]{display:none!important}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}';
  const local = '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + S('head.html') + '\n<style>\n' + reset + '\n' + S('style.css') + '\n</style>\n</head>\n<body>\n' + S('body.html') + '\n<script>\n' + engine + '\n' + S('app.js') + '\n</script>\n</body>\n</html>\n';
  fs.writeFileSync(path.join(__dirname, 'dist', 'apercu_local.html'), local);
  fs.writeFileSync(path.join(__dirname, 'Atelier QRC compta.html'), local);
  console.log('page :', (page.length / 1024).toFixed(0), 'Ko');
}
console.log('moteur :', (engine.length / 1024).toFixed(0), 'Ko');
