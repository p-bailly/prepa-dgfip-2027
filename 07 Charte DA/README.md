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

# Charte « Pastille » (en service)

Direction actuelle, déclinaison **Sage** avec la mise en page **Colonne**. Appliquée à l'accueil (`site/index.html`),
à la page Documents (`site/docs/index.html`) et aux trois applis.

| Fichier | Contenu |
| --- | --- |
| `pastille/tokens.css` | Variables (couleurs, relief, rayons, police) et composants de base |
| `pastille/appli.css` | Ossature et composants communs aux trois applis (menu latéral, onglets du bas, options QCM, feuille de réponse, journal…). Garde les noms de classes de « Copie double » pour que les vues n'aient pas à changer |
| `logos/prepa.svg` | Logo du site, piste « Quatre pastilles » : favicon (suit le thème sombre) et pastille du menu de l'accueil |
| `logos/prepa-icone.svg` | Le logo sur fond lilas très pâle, source des icônes PNG de `site/icones/` (180 et « maskable » 512 plein cadre, 192 et 512 aux coins arrondis) |
| `logos/propositions.html` | Les six pistes de logo étudiées, montrées dans le menu latéral (clair et sombre), l'onglet du navigateur et l'écran d'accueil |

Les `build.js` des trois applis ajoutent `tokens.css` puis `appli.css` avant le style propre à chaque appli :
rien à recopier à la main. Chaque appli choisit son pastel avec `data-app="qcm|qrc|atelier"`.

- **Fond** blanc, encre `#1B1B2F`, menu latéral lilas très pâle `#F7F5FF` ; en sombre, fond `#15141D` et surfaces `#1E1C2A`.
- **Un pastel par appli**, réservé aux pictogrammes et aux étiquettes : lilas `#C9C2FF` (QCM), menthe `#B8E6C9` (QRC),
  corail `#FFD2C2` (écrit et oral), soleil `#FFE07A` (documents). Le texte posé dessus reste `#1B1B2F` dans les deux thèmes.
- **Relief** discret : traits de 1,5 px ; seuls l'entrée de menu courante et la carte principale portent un contour
  d'encre et une ombre décalée pleine (4 px, sans flou). Action principale en vert menthe `#7CE0A3`.
- **Mise en page** : menu latéral de 260 px sur ordinateur, barre d'onglets en bas sur téléphone (< 860 px),
  tableau de bord du jour au centre. L'accueil lit la progression que chaque appli garde dans le navigateur.
- **Typographie** : Nunito seule, de 600 à 900 ; la graisse fait la hiérarchie.
- **Logo** « Quatre pastilles » : un rond par outil dans l'ordre du menu (QCM lilas, QRC menthe, écrit et oral corail,
  documents soleil), lu aussi comme les cases A, B, C, D d'un QCM ; la case cochée est seule en relief.
- États juste / faux / à revoir toujours doublés d'un pictogramme ou d'un mot ; contrastes ≥ 4,5:1 en clair et en sombre
  (juste `#1D7540`, faux `#B8322A`, à revoir `#855000` sur blanc et sur leur teinte).

La charte « Copie double » ci-dessus (`tokens.css`, `composants.css`, `charte.html`, maquettes) n'est plus employée
par aucune page ; elle reste pour mémoire.
