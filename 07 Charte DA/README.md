# Charte graphique

Direction artistique commune au site et aux trois applis (QCM, QRC, écrit et oral) ; principes dans le [CLAUDE.md](../CLAUDE.md) racine.

## Charte « Pastille » (en service)

Déclinaison **Sage**, mise en page **Colonne** : accueil, page Documents et trois applis.

| Fichier | Contenu |
| --- | --- |
| `pastille/tokens.css` | Variables (couleurs, relief, rayons, police) et composants de base |
| `pastille/appli.css` | Ossature et composants communs aux applis (menu, onglets, QCM, journal…) |
| `logos/prepa.svg`, `prepa-icone.svg` | Logo « Quatre pastilles » ; version sur fond lilas, source des icônes de `site/icones/` |
| `logos/propositions.html` | Les six pistes de logo étudiées |

Les `build.js` intègrent `tokens.css` puis `appli.css` : rien à recopier. Chaque appli choisit son pastel par `data-app="qcm|qrc|atelier"`.

## Ancienne charte « Copie double » (pour mémoire)

Plus employée : `charte.html` (charte complète), `maquettes/index.html` (6 maquettes fictives, `?theme=dark`), `tokens.css`, `composants.css`, `logos/qcm.svg` et `qrc.svg`. Les `.html` s'ouvrent directement.
