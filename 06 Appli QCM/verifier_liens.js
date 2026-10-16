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
const os = require("os");
// curl de Git pour Windows (OpenSSL) : le curl système (Schannel) échoue sur certains certificats.
const CURL = ["C:\Program Files\Git\mingw64\bin\curl.exe"].find(p => fs.existsSync(p)) || "curl";
let seq = 0;
function curl(u, jar, body) {
  return new Promise(res => execFile(CURL, ["-s", "-o", body, "-c", jar, "-b", jar, "-w", "%{http_code} %{url_effective}", "-L", "-A", "Mozilla/5.0", "--max-time", "25", u], (err, out) => {
    const [code, eff] = String(out || "").trim().split(" "); res({ code, eff });
  }));
}
// Certains sites (vie-publique.fr, budget.gouv.fr) servent une page anti-robot en 200 : on suit sa redirection avec cookie.
async function check(u) {
  const n = seq++, jar = path.join(os.tmpdir(), `qcm_jar_${n}.txt`), body = path.join(os.tmpdir(), `qcm_body_${n}.html`);
  const enc = (() => { try { return new URL(u).href; } catch (e) { return u; } })(); // accents encodés : execFile sous Windows les altère
  let r = await curl(enc, jar, body);
  for (let t = 0; t < 4 && r.code === "429"; t++) { await new Promise(z => setTimeout(z, 3000 * (t + 1))); r = await curl(enc, jar, body); }
  let html = ""; try { html = fs.readFileSync(body, "utf8"); } catch (e) {}
  const m = html.length < 2000 && html.match(/window\.location\.href='([^']+)'/);
  if (m) { const next = new URL(m[1], u).href; r = await curl(next, jar, body); }
  try { fs.unlinkSync(jar); fs.unlinkSync(body); } catch (e) {}
  return { u, code: r.code, eff: r.eff, ok: r.code === "200" && norm(r.eff) === norm(u) };
}
(async () => {
  const results = []; let i = 0;
  const worker = async () => { while (i < urls.length) { const u = urls[i++]; let r = await check(u); if (!r.ok && r.code !== "200") r = await check(u); results.push(r); } };
  await Promise.all(Array.from({ length: 4 }, worker));
  // vie-publique.fr bloque les vérifications répétées : une URL déjà contrôlée (code 200 et titre) reste valide si le site ne répond pas.
  let vpOk = new Set();
  try { vpOk = new Set(fs.readFileSync(path.join(__dirname, "liens_vie_publique_verifies.tsv"), "utf8").split("\n").filter(l => /\t200 /.test(l)).map(l => l.split("\t")[0])); } catch (e) {}
  results.forEach(r => { if (!r.ok && r.code === "000" && vpOk.has(r.u)) { r.ok = true; r.note = "contrôle antérieur"; } });
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
