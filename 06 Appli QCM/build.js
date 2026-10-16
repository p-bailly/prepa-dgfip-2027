// Assemble la page : node build.js
//  - QCM_DGFiP_2027.html : version hors ligne autonome (à ouvrir dans un navigateur)
//  - artefact/QCM_DGFiP_2027.html : contenu publié comme Artifact (le squelette est ajouté à la publication)
const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "banque");
const bank = fs.readdirSync(dir).filter(f => f.endsWith(".js")).sort()
  .map(f => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
if (/<\/script/i.test(bank)) throw new Error("La banque contient </script>");
const page = fs.readFileSync(path.join(__dirname, "app.html"), "utf8").replace("/*__BANK__*/", () => bank);
const offline = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>\n' + page + '\n</body></html>\n';
fs.mkdirSync(path.join(__dirname, "artefact"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "QCM_DGFiP_2027.html"), offline);
fs.writeFileSync(path.join(__dirname, "artefact", "QCM_DGFiP_2027.html"), page);
console.log("Page : " + Math.round(page.length / 1024) + " Ko");
