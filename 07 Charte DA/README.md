# Charte « Copie double »

Direction artistique commune aux deux applis de révision du concours DGFiP 2027 :
**QCM DGFiP 2027** (`06 Appli QCM`) et **Atelier QRC compta** (`06 Atelier QRC`).

| Fichier | Contenu |
| --- | --- |
| `charte.html` | La charte : diagnostic, concept, logos, couleurs, typographie, composants, navigation, ton, mise en œuvre |
| `maquettes/index.html` | Galerie des 6 maquettes, sur téléphone et ordinateur, en clair et en sombre |
| `tokens.css` | Variables (couleurs, typo, espaces, rayons) et composants communs |
| `composants.css` | Composants propres à chaque appli (options QCM, feuille de réponse, journal comptable…) |
| `logos/` | Logos des deux applis en SVG |

## Maquettes

| QCM DGFiP 2027 | Atelier QRC compta |
| --- | --- |
| `qcm-aujourdhui.html` : session du jour, question corrigée | `qrc-progression.html` : tableau de bord |
| `qcm-examen.html` : examen blanc en cours | `qrc-exercice.html` : exercice corrigé avec journal |
| `qcm-progres.html` : progrès comparés au jury | `qrc-fiches.html` : fiche de méthode |

Les données affichées sont fictives. Ajouter `?theme=dark` à l'adresse d'une maquette pour la voir en sombre.

## Ouvrir

Double-cliquer sur `charte.html` ou `maquettes/index.html` suffit. Les polices viennent de Google Fonts ;
hors ligne, des polices système de repli prennent le relais.

## Principes

- **Papier** crème commun, feuilles blanches posées dessus.
- **Encre** propre à chaque appli : bleu stylo `#2A44C7` (QCM), pétrole `#0E6871` (QRC), via `<body data-app="qcm|qrc">`.
- **Chiffres** en IBM Plex Mono tabulaire ; titres en Newsreader ; interface en IBM Plex Sans.
- **Surligneur** jaune, un passage par écran, jamais pour un état.
- États juste / faux / à revoir toujours doublés d'un pictogramme ou d'un mot ; contrastes ≥ 4,5:1 en clair et en sombre.
