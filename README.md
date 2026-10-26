# Prépa DGFiP 2027

Outils de révision pour les concours d'inspecteur et de contrôleur des finances publiques (session 2027), publiés sur **https://prepa.pbailly.fr** (GitHub Pages). Projets personnels de préparation : ni produits ni validés par la DGFiP.

| Dossier | Contenu |
| --- | --- |
| `06 Appli QCM` | **QCM DGFiP 2027** : révision espacée, examens blancs, progrès comparés au jury, fiches de cours |
| `06 Atelier QRC` | **Atelier QRC compta** : exercices chiffrés de comptabilité et d'analyse financière, épreuves blanches notées sur 20 |
| `06 Atelier Ecrit Oral` | **Atelier écrit et oral** : note de synthèse, analyse de dossier et oral chronométrés, avec auto-évaluation |
| `commun`, `outils`, `site` | Synchro des comptes (`sync.js`), correction des copies déposées, site publié (accueil, hors connexion, PDF dans `site/docs/`) |
| `07 Charte DA` | Charte graphique « Pastille » commune au site et aux applis ([détails](07%20Charte%20DA/README.md)) |

Chaque appli est une page HTML autonome produite par son `build.js` :

```sh
cd "06 Appli QCM" && node build.js    # idem dans les deux autres dossiers 06
```

Synchronisation, outils, tests et déploiement : voir [CLAUDE.md](CLAUDE.md).
