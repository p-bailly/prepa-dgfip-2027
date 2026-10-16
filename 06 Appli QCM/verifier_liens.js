// Vérifie tous les liens de la banque : node verifier_liens.js [--retirer]
// Un lien est valide si la page répond 200 et n'est pas redirigée vers une autre page (accueil, recherche).
// Avec --retirer, les liens invalides sont supprimés des fichiers de la banque.
const fs = require("fs"), path = require("path"), { execFile } = require("child_process");
const dir = path.join(__dirname, "banque");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".js")).sort();
const BANK = [];
for (const f of files) new Function("BANK", fs.readFileSync(path.join(dir, f), "utf8"))(BANK);
const urls = [...new Set(BANK.flatMap(c => Array.isArray(c.u) ? c.u : c.u ? [c.u] : []))];
const norm = u => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, "") + decodeURIComponent(x.pathname)).replace(/\/$/, "").toLowerCase(); } catch (e) { return u; } };
function check(u) {
  return new Promise(res => execFile("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code} %{url_effective}", "-L", "-A", "Mozilla/5.0", "--max-time", "25", u], (err, out) => {
    const [code, eff] = String(out || "").trim().split(" ");
    res({ u, code, eff, ok: code === "200" && norm(eff) === norm(u) });
  }));
}
(async () => {
  const results = []; let i = 0;
  const worker = async () => { while (i < urls.length) { const u = urls[i++]; let r = await check(u); if (!r.ok && r.code !== "200") r = await check(u); results.push(r); } };
  await Promise.all(Array.from({ length: 12 }, worker));
  const bad = results.filter(r => !r.ok);
  console.log(`Liens : ${urls.length} · valides : ${urls.length - bad.length} · invalides : ${bad.length}`);
  bad.forEach(r => console.log(`  ${r.code} ${r.u}${r.eff && norm(r.eff) !== norm(r.u) ? "  →  " + r.eff : ""}`));
  if (process.argv.includes("--retirer") && bad.length) {
    const badSet = new Set(bad.map(r => r.u));
    for (const f of files) {
      const p = path.join(dir, f); let s = fs.readFileSync(p, "utf8"); const before = s;
      for (const u of badSet) {
        const q = JSON.stringify(u);
        s = s.split(q + ",").join("").split("," + q).join("").split(q).join("");
      }
      s = s.replace(/,u:\[\]/g, "").replace(/u:\[\],/g, "");
      if (s !== before) { fs.writeFileSync(p, s); console.log("nettoyé : " + f); }
    }
  }
})();
