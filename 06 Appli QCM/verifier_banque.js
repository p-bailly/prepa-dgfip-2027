// Vérifie la banque : node verifier_banque.js
const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "banque");
const BANK = [];
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".js")).sort()) {
  new Function("BANK", fs.readFileSync(path.join(dir, f), "utf8"))(BANK);
}
const THEMES = ["admin", "ue", "num", "log", "ang", "fr", "math", "hg"];
const errors = [], ids = new Set(), count = {};
for (const c of BANK) {
  const where = c.id || JSON.stringify(c).slice(0, 60);
  if (!c.id || ids.has(c.id)) errors.push(`${where} : id manquant ou en double`);
  ids.add(c.id);
  if (!THEMES.includes(c.t)) errors.push(`${where} : thème inconnu ${c.t}`);
  if (!c.q || !c.e || !c.s) errors.push(`${where} : question, explication ou source manquante`);
  if (!Array.isArray(c.o) || c.o.length !== 4) errors.push(`${where} : il faut 4 propositions`);
  else if (new Set(c.o.map(x => x.trim().toLowerCase())).size !== 4) errors.push(`${where} : propositions en double`);
  if (![0, 1, 2, 3].includes(c.a)) errors.push(`${where} : index de réponse invalide`);
  count[c.t] = (count[c.t] || 0) + 1;
}
const dupQ = {};
for (const c of BANK) { const k = (c.q + "|" + c.o.join("|")).toLowerCase(); (dupQ[k] = dupQ[k] || []).push(c.id); }
for (const [k, v] of Object.entries(dupQ)) if (v.length > 1) errors.push(`Énoncé identique : ${v.join(", ")}`);
console.log(`Questions : ${BANK.length}`);
console.log(THEMES.map(t => `${t} ${count[t] || 0}`).join(" · "));
console.log(`Douteuses : ${BANK.filter(c => c.d).map(c => c.id).join(", ")}`);
console.log(`Actualité datée : ${BANK.filter(c => c.act).length}`);
const pos = [0, 0, 0, 0]; BANK.forEach(c => pos[c.a]++);
console.log(`Position de la bonne réponse (avant mélange) : ${pos.join(" / ")}`);
if (errors.length) { console.log("\nERREURS :\n" + errors.join("\n")); process.exit(1); }
console.log("OK : aucune erreur de structure.");
