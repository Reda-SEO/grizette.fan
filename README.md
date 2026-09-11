# grizette.fan

Le fan club officiel (et affectueux) de Grizette, la chatte de Fanny.
Site 100 % statique : HTML, CSS et JavaScript, sans serveur applicatif. Chaque `git push` sur `main` est mis en ligne automatiquement par Coolify.

---

## 1. À faire une seule fois (sur l'ordinateur)

1. Installer **Node.js** (version 20 ou plus) : <https://nodejs.org> (bouton « LTS »).
2. Ouvrir un terminal **dans le dossier du site** (sous Windows : clic droit dans le dossier › « Open Git Bash here »), puis taper :

   ```sh
   cd outils && npm install && cd ..
   git config core.hooksPath .githooks
   ```

   - La première ligne installe l'outil qui optimise les photos (*sharp*).
   - La deuxième active le **hook** : à chaque commit, le site est régénéré tout seul.

C'est tout. Ces réglages restent actifs, y compris dans GitHub Desktop.

## 2. Ajouter une photo

1. Déposez la photo dans le dossier **`images/`**. N'importe quel nom convient, mais un nom du type `Grizette (40).jpg` lui donne le numéro 40 sur le site.
2. Faites un **commit** (dans GitHub Desktop ou avec `git commit`). Le hook régénère automatiquement la galerie, la page de la photo, le sitemap et les images optimisées, puis les ajoute au commit.
3. Faites un **push**. La photo est en ligne une à deux minutes plus tard.

Formats acceptés : `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif` (majuscules ou minuscules).
Les originaux ne sont jamais modifiés. Les versions optimisées sont rangées dans `img/` : ne touchez pas à ce dossier, il est géré automatiquement.

> Pour retirer une photo, supprimez-la de `images/`, puis commit et push. Sa page et ses versions optimisées disparaissent toutes seules.

## 3. Décrire une photo (important pour Google et l'accessibilité)

Les descriptions se trouvent dans **`photos-meta.json`**. Chaque photo y a une entrée, identifiée par son nom de fichier exact :

```json
"Grizette (40).jpg": {
  "alt": "Grizette endormie dans un carton, les pattes repliées sous elle",
  "legende": "Le carton, son palace",
  "date": "2026-09-01"
},
```

- **`alt`** : ce qu'on voit sur la photo, en une phrase factuelle. C'est ce que lisent les personnes aveugles et les moteurs de recherche.
- **`legende`** : un titre court et sympa (40 caractères environ). Il sert de titre à la page de la photo.
- **`date`** (facultatif) : la date de la photo, au format `AAAA-MM-JJ`.
- **`slug`** (facultatif, rarement utile) : force l'adresse de la page, par exemple `"slug": "grizette-carton"` donne `/photo/grizette-carton/`.

Attention à la syntaxe : guillemets droits `"`, une virgule entre deux entrées et **pas de virgule après la dernière**. En cas d'erreur, le commit passe quand même, mais le message affiché indique ce qui ne va pas.

Une photo sans description reçoit un texte par défaut (« Grizette, la chatte de Fanny, photo n°40 ») et apparaît dans la liste « photos sans description » affichée à chaque commit.

## 4. Modifier les textes du site

Les textes de l'accueil (« Qui est Grizette ? », fiche d'identité, questions fréquentes) sont dans **`contenu.json`**.

- `"a_confirmer": true` signale une information reprise de l'ancien site et pas encore vérifiée. Une fois vérifiée, passez-la à `false`.
- Une valeur vide `""` n'est pas affichée sur le site (exemple : l'année d'adoption). Remplissez-la quand vous avez l'information.
- `{nb_photos}` est remplacé automatiquement par le nombre de photos.
- `photo_vedette` désigne la photo affichée en premier sur l'accueil (et utilisée pour le partage sur les réseaux sociaux). `photo_404` désigne celle de la page « introuvable ».

## 5. Relancer la génération à la main

Le hook s'en charge normalement. Pour vérifier avant un commit :

```sh
node outils/generer.mjs
```

Relancer la commande sans rien changer ne modifie aucun fichier (le message indique « Rien à changer »).

## 6. Mettre en production

`git push` sur `main` suffit : Coolify détecte le push et redéploie le site statique.
**Chaque push part directement en ligne.**

### Configuration Coolify (une seule fois)

Le fichier `deploy/nginx.conf` doit être collé dans Coolify (application › **Configuration › General** › configuration nginx personnalisée), puis il faut **redéployer**. Il apporte :

- une vraie page 404 (sans lui, Coolify répond « 200 » avec l'accueil pour n'importe quelle adresse, ce qui est mauvais pour le référencement) ;
- les redirections 301 des anciennes adresses d'images (`/images/1 (N).jpg`, `/grizette/images/grizette.jpg`) ;
- la compression gzip et un cache adapté ;
- le blocage des fichiers internes (`outils/`, `deploy/`, `.git`, README).

Pour vérifier après le déploiement :

```sh
curl -I https://grizette.fan/nexiste-pas        # doit répondre 404
curl -I "https://grizette.fan/images/1%20(1).jpg" # doit répondre 301
```

## 7. Comment sont choisis le numéro et l'adresse d'une photo

Tout dépend **uniquement du nom du fichier**. L'ordre d'ajout et le nombre de photos n'entrent jamais en compte, donc les adresses restent stables quand on en ajoute.

| Nom du fichier | Numéro affiché | Adresse |
|---|---|---|
| `Grizette (12).jpg` | n°12 | `/photo/grizette-12/` |
| `Grizette (1).jpg` et `Grizette (1).jpeg` | n°1 et n°1 bis | `/photo/grizette-1/` et `/photo/grizette-1-jpeg/` |
| `Sieste été 2025.PNG` | hors-série | `/photo/grizette-sieste-ete-2025/` |

- Un nom de la forme `Grizette (N)`, `grizette-N` ou `Grizette N` donne le numéro N. Tout autre nom donne une photo « hors-série », rangée en fin de galerie.
- Si deux fichiers ne diffèrent que par l'extension, le `.jpg` garde l'adresse courte et l'autre reçoit l'extension en suffixe.
- **Renommer un fichier change son adresse.** Pour garder l'ancienne, ajoutez `"slug"` dans `photos-meta.json`.

## 8. Organisation des dossiers

| Dossier / fichier | Rôle | Modifier à la main ? |
|---|---|---|
| `images/` | photos originales | oui : c'est là qu'on ajoute les photos |
| `photos-meta.json` | descriptions des photos | oui |
| `contenu.json` | textes de l'accueil | oui |
| `assets/` | style (`site.css`), script (`site.js`), polices | pour faire évoluer le design |
| `outils/` | générateur et hook (non publiés) | pour faire évoluer les gabarits |
| `index.html`, `galerie/`, `photo/`, `404.html`, `img/`, `photos.json`, `sitemap.xml`, `llms.txt`, `robots.txt` | **générés automatiquement** | non : ils seraient écrasés |

Les icônes (`favicon.svg`…) se régénèrent avec `node outils/icones.mjs` après une modification de `favicon.svg`.

## 9. En cas de souci

- **« sharp absent »** : lancez `cd outils && npm install`. En attendant, le site fonctionne avec les photos originales (plus lourdes).
- **« n'est pas un JSON valide »** : il y a une faute de syntaxe dans `photos-meta.json` ou `contenu.json` (virgule en trop ou manquante, guillemet oublié). Le message donne la position de l'erreur.
- **Le hook ne se lance pas** : vérifiez que `git config core.hooksPath` affiche `.githooks`, et que Node.js est installé.
