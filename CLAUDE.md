# Prépa DGFiP 2027 — notes pour travailler dans le repo

Le dépôt est un dossier de travail Windows synchronisé par Google Drive (`desktop.ini`, `.tmp.drivedownload/` ignorés).
Les dossiers numérotés 05 (sources des fiches) et 08 (`08 Depots/`, dépôts récupérés, non versionné) ne sont pas dans le dépôt.

## Build et vérifications (sans dépendance : Node pur, 20 en CI)
- Commandes exactes du CI (`.github/workflows/pages.yml`) :
  - `cd "06 Appli QCM" && node verifier_banque.js && node build.js`
  - `cd "06 Atelier QRC" && node build.js && node test/test.js`
  - `cd "06 Atelier Ecrit Oral" && node build.js && node test/test.js`
  - `node commun/test_sync.js` (synchro entre deux appareils : vrai `sync.js` et vrai code de fusion sur un faux Firestore ;
    lit `06 Appli QCM/app.html` et `06 Atelier QRC/src/app.js` par extraction de texte, donc à relancer si ces blocs bougent)
- Chaque `build.js` assemble une page HTML autonome : charte (`07 Charte DA/pastille/tokens.css` puis `appli.css`) +
  `commun/sync.js` + sources de l'appli + `commun/ecran.js` (iPhone, appli installée seulement : barre d'onglets du bas
  restée à mi-hauteur après le clavier, bug WebKit d'iOS 26 ; recalcul forcé puis décalage mesuré). Ces pages (`QCM_DGFiP_2027.html`, `Atelier QRC compta.html`,
  `Atelier Ecrit Oral.html`, `06 Atelier QRC/dist/*`) sont **versionnées mais générées** : éditer les sources, relancer
  `build.js`, ne jamais modifier la page à la main. Le build échoue si une source contient `</script>`.
- Le bloc PWA (manifeste, `theme-color` = `--side` clair/sombre, icônes, enregistrement du service worker, chemins
  `../manifest.webmanifest`, `../sw.js`, `../prepa.svg`) est dupliqué dans les trois `build.js` : le modifier partout.
- **QCM** : `app.html` (marqueurs `/*__CHARTE__*/ /*__SYNC__*/ /*__BANK__*/ /*__FICHES__*/`), `banque/*.js` (ordre
  alphabétique, chaque fichier fait `BANK.push(...)`), `fiches.js` (pas de tiret cadratin dans les fiches). Question :
  `id` unique, `t` thème (admin, ue, num, log, ang, fr, math, hg), `q`, `o` (4 propositions distinctes), `a` (index 0-3),
  `e` explication, `s` source ; optionnels `d:1` douteuse, `act:1` actualité datée, `u` lien(s). `verifier_banque.js`
  contrôle tout cela. `verifier_liens.js [--retirer]` teste les liens (via curl) et s'appuie sur
  `liens_vie_publique_verifies.tsv`.
- **QRC** : `src/core.js` (aléa reproductible, arrondis, vérification) + `t_*.js` (types d'exercices, registre `T`) +
  `annales.js` (sujets réels rejouables) sont concaténés dans `dist/engine.js` (exporte `T, ANNALES, U, AM`), que
  `test/test.js` vérifie (corrigés sur sujets réels + milliers de variantes aléatoires).
- **Écrit et oral** : `src/data.js` (données), `core.js` (fusion, chrono, notes), `app.js` ; `test/test.js` contrôle aussi
  la page construite, et `build.js` vérifie que chaque `<script>` s'analyse.

## Synchronisation (`commun/sync.js`, Firebase)
- Projet `prepa-dgfip-2027` ; SDK Firebase 12.19.0 chargé depuis gstatic seulement après connexion. Comptes e-mail/mot de
  passe : l'identifiant devient `identifiant@prepa.pbailly.fr` (adresse fictive, pas de « mot de passe oublié ») ; le mot
  de passe envoyé est `p1:` + SHA-256 de `prepa-dgfip-2027|mdp` (accepte moins de 6 caractères), avec conversion
  automatique des anciens comptes. La clé web dans `CONFIG` est publique par conception.
- Firestore en Europe (`eur3`), règle : chaque compte ne lit/écrit que `users/{uid}/…` (les règles ne sont pas dans le
  dépôt : non vérifié ici). Une appli s'attache par `PrepaSync.attach(clé, {get, merge})` avec la clé `qcm`, `qrc` ou
  `atelier`, puis appelle `PrepaSync.changed(clé)` après chaque sauvegarde locale.
  État : `users/{uid}/apps/{clé}` = `{json, u, dev}`, envoi différé de 1,2 s, comparaison canonique (clés triées) ; au-delà
  de 900 000 caractères l'état reste local (statut « plein »).
- Écoute avec `includeMetadataChanges` ; le premier envoi attend une version venue du serveur (fusionner avec un cache
  périmé puis écrire effaçait du compte ce que l'autre appareil y avait mis). Écoute relancée après une erreur (5 s à 60 s),
  au retour au premier plan après 30 s de veille, au retour du réseau et par le bouton « Resynchroniser » du bloc Compte,
  qui affiche aussi l'identifiant de l'appareil et les heures du dernier échange (pour comparer deux appareils).
- Envoi non confirmé depuis 30 s, réseau présent (ou écriture en attente héritée d'une ouverture précédente) : le libellé
  dit « l'envoi au compte attend depuis … » au lieu de « synchronisée ». Tant qu'une écriture attend, les versions du
  compte sont masquées par elle. « Réparer la synchro » : `terminate` + `clearIndexedDbPersistence` puis rechargement
  (la progression est dans le `localStorage`, la connexion est gardée) ; l'état est renvoyé au premier passage serveur.
- `merge(o)` d'une appli doit être idempotente : après chaque fusion distante, si l'état local diffère de celui du compte,
  la synchro le renvoie (4 renvois par minute au plus). Sans cela, un appareil qui écrit depuis un état périmé (hors
  connexion) écrase le compte et l'autre appareil garde ses données pour lui jusqu'à sa prochaine sauvegarde.
  Fusions : QCM carte par carte (planning de la révision la plus récente ; compteurs de réponses par appareil, 9e élément
  `{appareil: [réponses, justes]}` de la carte, fusionnés au maximum, les 7e et 8e étant les compteurs figés d'avant), QRC type par type (champ `u` ; un type vidé ou effacé reste à
  zéro daté, une épreuve supprimée entre dans `xdel`), atelier entrée par entrée (`updatedAt`, pierres tombales).
- `PrepaSync.peek(clé, cb)` : lecture seule du compte. L'accueil l'utilise pour afficher la plus récente des deux
  progressions (navigateur, compte), car les applis ne fusionnent dans le navigateur que lorsqu'elles sont ouvertes.
- Dépôts de fichiers (copies, oraux) : `users/{uid}/depots/{id}` + `parts/{n}` (base64, morceaux de 700 000 octets,
  écrits avant la description : description présente = dépôt complet).

## Outils de correction (`outils/`, Windows)
- `node outils/depots.js liste | recuperer [id…] | noter <id> <correction.json>` ; correction :
  `{"scores": {critère: niveau}, "defauts": ["id",…], "commentaire": "…"}` (niveaux 0-4 à l'écrit, 1-4 à l'oral, note /20
  calculée comme dans l'atelier). `recuperer` écrit dans `08 Depots/`.
- Clé de compte de service Firebase : `%USERPROFILE%\.prepa-dgfip\cle-service.json` (ou variable `PREPA_CLE`), jamais
  versionnée (`.gitignore`). `analyse_oral.py` (faster-whisper « small », local, rien en ligne) est lancé par `recuperer`
  avec `%USERPROFILE%\.prepa-dgfip\venv\Scripts\python.exe` (variable `PREPA_PY`) ; il écrit `analyse-audio.md/json`.

## Déploiement
- `pages.yml` à chaque push sur `main` : build + vérifications, puis `_site` = accueil (`site/`), `/qcm/`, `/qrc/`,
  `/atelier/`, `/docs/`, `sync.js`, `prepa.svg`, icônes. Domaine `prepa.pbailly.fr` (Settings › Pages, CNAME chez OVH).
- `.gitignore` : `*.pdf` ignorés sauf `site/docs/**` (fiches, sujets, guides ENFiP, rapports de jury publiés).
- `site/sw.js` (cache `prepa-v5`) : HTML réseau d'abord (6 s, `cache: "no-cache"` car Pages sert `max-age=600`), polices/SDK cache d'abord, le reste servi du cache puis
  rafraîchi ; la synchro n'est jamais interceptée. Changer le nom du cache pour forcer le renouvellement.

## Charte « Pastille » (en service ; l'ancienne « Copie double » n'est plus employée, voir `07 Charte DA/charte.html`)
- Valeurs dans `pastille/tokens.css` (jetons) et `appli.css` (états `--ok`/`--bad`/`--warn`, classes héritées de « Copie
  double » pour ne pas toucher aux vues). Nunito seule (600-900) : la graisse fait la hiérarchie.
- Un pastel par appli, réservé aux pictogrammes et étiquettes : `--qcm` lilas, `--qrc` menthe, `--ate` corail (écrit et
  oral), `--doc` soleil (documents) ; texte dessus en `--on-tile` dans les deux thèmes ; action principale `--go`.
- Relief unique : traits de 1,5 px ; seuls l'entrée de menu courante et la carte principale ont contour d'encre + ombre
  décalée pleine (4 px, sans flou). Menu latéral de 260 px dès 860 px, sinon onglets en bas.
- États juste / faux / à revoir toujours doublés d'un pictogramme ou d'un mot ; contrastes ≥ 4,5:1 en clair et en sombre.
- Logo « Quatre pastilles » : un rond par outil dans l'ordre du menu, lu aussi comme les cases A, B, C, D d'un QCM (case
  cochée seule en relief) ; `prepa.svg` suit le thème sombre. L'accueil lit la progression que chaque appli garde dans le navigateur.

## Pièges connus
- `verifier_liens.js` : le chemin du curl de Git pour Windows est écrit sans échapper les antislashs (`\b` = retour
  arrière), il est donc toujours ignoré et le `curl` du PATH est utilisé.
