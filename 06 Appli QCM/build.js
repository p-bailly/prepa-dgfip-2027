// Assemble la page : node build.js
//  - QCM_DGFiP_2027.html : page autonome, publiée sur le site (/qcm/) et lisible hors ligne
//  - la charte vient de « 07 Charte DA/pastille » (tokens.css puis appli.css), commune aux trois applis
//  - la synchro du compte vient de commun/sync.js, partagé avec les autres applis
const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "banque");
const bank = fs.readdirSync(dir).filter(f => f.endsWith(".js")).sort()
  .map(f => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
const sync = fs.readFileSync(path.join(__dirname, "..", "commun", "sync.js"), "utf8");
// Charte « Pastille » : jetons puis composants communs aux trois applis.
const charte = ["tokens.css", "appli.css"].map(f => fs.readFileSync(path.join(__dirname, "..", "07 Charte DA", "pastille", f), "utf8")).join("\n");
for (const [n, s] of [["banque", bank], ["synchro", sync]]) if (/<\/script/i.test(s)) throw new Error("La " + n + " contient </script>");
const page = fs.readFileSync(path.join(__dirname, "app.html"), "utf8")
  .replace("/*__CHARTE__*/", () => charte)
  .replace("/*__SYNC__*/", () => sync)
  .replace("/*__BANK__*/", () => bank);
const head = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  + '<link rel="manifest" href="../manifest.webmanifest"><meta name="theme-color" content="#F7F5FF" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#1A1926" media="(prefers-color-scheme: dark)"><link rel="apple-touch-icon" href="../icones/icone-180.png">'
  + '<style>[hidden]{display:none!important}body{margin:0}</style></head><body>\n';
const tail = '\n<script>if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("../sw.js").catch(function(){});</script>\n</body></html>\n';
fs.writeFileSync(path.join(__dirname, "QCM_DGFiP_2027.html"), head + page + tail);
console.log("Page : " + Math.round(page.length / 1024) + " Ko");
