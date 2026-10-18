# Prépa DGFiP 2027

Outils de révision pour les concours d'inspecteur et de contrôleur des finances publiques (session 2027), publiés sur **https://prepa.pbailly.fr** (GitHub Pages, voir `.github/workflows/pages.yml`).

| Dossier | Contenu |
| --- | --- |
| `06 Appli QCM` | **QCM DGFiP 2027** : révision espacée, examens blancs (feuille de copie, questions signalées, temps par question), progrès comparés au jury, fiches de cours, repères officiels de l'épreuve. `node build.js` assemble `QCM_DGFiP_2027.html` à partir de `app.html`, de `banque/` et de `fiches.js`. |
| `06 Atelier QRC` | **Atelier QRC compta** : exercices chiffrés de comptabilité et d'analyse financière, corrigés et journal, épreuves blanches notées sur 20 avec historique et revue de copie. `node build.js` assemble `Atelier QRC compta.html` à partir de `src/`. |
| `06 Atelier Ecrit Oral` | **Atelier écrit et oral** : note de synthèse et analyse de dossier chronométrées avec grille d'auto-évaluation, entraînement à l'oral avec enregistrement audio et banque des questions d'oral. `node build.js` assemble `Atelier Ecrit Oral.html`. |
| `commun` | `sync.js` : compte (identifiant + mot de passe), synchronisation Firestore entre appareils et dépôt de fichiers, intégré par chaque appli à la construction. |
| `outils` | `depots.js` : récupère les copies et réponses déposées dans l'atelier (`node outils/depots.js liste`, `recuperer`) et enregistre leur correction (`noter <id> <correction.json>`). Clé de compte de service dans `%USERPROFILE%\.prepa-dgfip\cle-service.json`, jamais versionnée ; les dépôts récupérés vont dans `08 Depots/` (non versionné). `analyse_oral.py` mesure la fluidité des oraux enregistrés (débit, pauses, tics, intonation) avec faster-whisper en local, dans l'environnement `%USERPROFILE%\.prepa-dgfip\venv` ; `recuperer` le lance tout seul. |
| `site` | Page d'accueil, manifeste et service worker (appli installable, utilisable hors connexion), icônes et PDF publiés (`site/docs/`). |
| `07 Charte DA` | **Charte « Pastille »** commune au site et aux applis : `pastille/tokens.css` et `pastille/appli.css`, intégrés par chaque `build.js`. L'ancienne charte « Copie double » (`charte.html`, maquettes, `tokens.css`) reste pour mémoire, avec les logos. |

## Synchronisation

Projet Firebase `prepa-dgfip-2027` : connexion par e-mail/mot de passe (l'identifiant devient `identifiant@prepa.pbailly.fr`, adresse interne sans courrier), base Firestore en Europe (`eur3`). Règle d'accès : chaque compte ne lit et n'écrit que `users/{uid}/…`. Chaque appli stocke son état dans `users/{uid}/apps/{qcm|qrc|atelier}`.

Les PDF publiés sur le site (fiches, sujets, guides ENFiP, programmes, rapports de jury) sont dans `site/docs/` ; les autres PDF ne sont pas versionnés.

Ces outils sont des projets personnels de préparation : ils ne sont ni produits ni validés par la DGFiP.
