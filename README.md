# grizette.fan

Le fan club officiel (et affectueux) de Grizette, la chatte de Fanny.
Site 100 % statique : HTML, CSS et JavaScript, sans serveur applicatif. Chaque `git push` sur `main` est mis en ligne automatiquement par Coolify.

> **Qui génère le site ?** La **GitHub Action** « Génération du site » (`.github/workflows/generer.yml`).
> C'est **la source de vérité** : à chaque push sur `main`, d'où qu'il vienne (PC, GitHub Desktop, envoi de photos
> depuis le téléphone), elle régénère galerie, pages photo, sitemap, images optimisées et numéros des photos, puis
> commite le résultat. Le hook `pre-commit` décrit plus bas n'est qu'un **confort local** : il permet de voir le
> résultat avant de pousser, mais même s'il n'est pas installé, l'Action fait le travail.

---

## 1. À faire une seule fois (sur l'ordinateur)

1. Installer **Node.js** (version 20 ou plus) : <https://nodejs.org> (bouton « LTS »).
2. Ouvrir un terminal **dans le dossier du site** (sous Windows : clic droit dans le dossier › « Open Git Bash here »), puis taper :

   ```sh
   cd outils && npm install && cd ..
   git config core.hooksPath .githooks
   ```

   - La première ligne installe l'outil qui optimise les photos (*sharp*).
   - La deuxième active le **hook** (facultatif) : à chaque commit, le site est régénéré sur le PC, pour vérifier avant de pousser.

C'est tout. Ces réglages restent actifs, y compris dans GitHub Desktop. Sans eux, la GitHub Action régénère quand même le site après le push.

## 2. Ajouter une photo

Le plus simple : depuis le téléphone, avec l'espace d'envoi de photos (documenté dans son propre dépôt privé).

Depuis le PC :

1. Déposez la photo dans le dossier **`images/`**. N'importe quel nom convient. Un nom du type `Grizette (60).jpg` demande le numéro 60 s'il n'a encore jamais été attribué ; sinon la photo reçoit le numéro suivant.
2. Faites un **commit** (dans GitHub Desktop ou avec `git commit`). Si le hook est installé, il régénère la galerie, la page de la photo, le sitemap et les images optimisées, et les ajoute au commit.
3. Faites un **push**. La GitHub Action vérifie et complète la génération, puis le site est en ligne une à deux minutes plus tard.

Formats acceptés : `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif` (majuscules ou minuscules).
Les originaux ne sont jamais modifiés. Les versions optimisées sont rangées dans `img/` : ne touchez pas à ce dossier, il est géré automatiquement.

> Pour retirer une photo, supprimez-la de `images/` (et sa ligne dans `photos-meta.json`), puis commit et push. Sa page et ses versions optimisées disparaissent toutes seules. Rien n'est perdu : elle reste dans l'historique git.

## 3. Décrire une photo (important pour Google et l'accessibilité)

Les descriptions se trouvent dans **`photos-meta.json`**. Chaque photo y a une entrée, identifiée par son nom de fichier exact :

```json
"Grizette (40).jpeg": { "alt": "Grizette endormie dans un carton, les pattes repliées sous elle", "legende": "Le carton, son palace", "date": "2026-09-01", "num": 40, "slug": "grizette-40" },
```

- **`alt`** : ce qu'on voit sur la photo, en une phrase factuelle. C'est ce que lisent les personnes aveugles et les moteurs de recherche.
- **`legende`** : un titre court et sympa (40 caractères environ). Il sert de titre à la page de la photo.
- **`date`** (facultatif) : la date de la photo, au format `AAAA-MM-JJ`.
- **`num`**, **`rang`**, **`slug`** : numéro et adresse de la page, **écrits automatiquement** la première fois que la photo est vue, puis figés. **Ne les modifiez pas** : changer `slug` change l'adresse publique de la photo (liens et référencement cassés). Pour une nouvelle photo, vous pouvez écrire vous-même un `slug` avant le premier commit pour choisir son adresse.
- **`ajoute_par`**, **`ajoute_le`** : ajoutés par l'envoi depuis le téléphone (qui, et quand).
- **`_numero_suivant`** (en haut du fichier) : prochain numéro attribué. Il ne redescend jamais, pour qu'un numéro supprimé ne soit jamais réattribué à une autre photo.

Attention à la syntaxe : guillemets droits `"`, une virgule entre deux entrées et **pas de virgule après la dernière**. En cas d'erreur, le commit passe quand même, mais le message affiché indique ce qui ne va pas, et la GitHub Action échoue (GitHub prévient par e-mail ; rien n'est déployé tant que ce n'est pas corrigé). Le générateur réécrit ce fichier dans un format fixe (une ligne par photo, rangées par numéro) : c'est normal.

Une photo sans description reçoit un texte par défaut (« Grizette, la chatte de Fanny, photo n°40 ») et apparaît dans la liste « photos sans description » affichée à chaque génération.

## 4. Modifier les textes du site

Les textes de l'accueil (« Qui est Grizette ? », fiche d'identité, questions fréquentes) sont dans **`contenu.json`**.

- `"a_confirmer": true` signale une information reprise de l'ancien site et pas encore vérifiée. Une fois vérifiée, passez-la à `false`.
- Une valeur vide `""` n'est pas affichée sur le site (exemple : l'année d'adoption). Remplissez-la quand vous avez l'information.
- `{nb_photos}` est remplacé automatiquement par le nombre de photos.
- `photo_vedette` désigne la photo affichée en premier sur l'accueil (et utilisée pour le partage sur les réseaux sociaux). `photo_404` désigne celle de la page « introuvable ».

## 5. Relancer la génération à la main

La GitHub Action s'en charge à chaque push. Pour la relancer sans rien changer : onglet **Actions** du dépôt › « Génération du site » › **Run workflow**. Pour vérifier sur le PC avant un commit :

```sh
node outils/generer.mjs
```

Relancer la commande sans rien changer ne modifie aucun fichier (le message indique « Rien à changer »).

## 6. Mettre en production

`git push` sur `main` suffit. **Chaque push part directement en ligne.**

1. La GitHub Action « Génération du site » régénère le site et commite les fichiers générés s'ils ont changé (commit `Génération automatique du site [generation-auto]`, signé `github-actions[bot]`). Ce commit ne relance pas l'Action : pas de boucle.
2. Coolify redéploie le site statique :
   - **mode recommandé (un seul déploiement)** : *Auto Deploy* coupé dans Coolify, et l'Action appelle le webhook de déploiement de Coolify à la fin (secrets GitHub `COOLIFY_DEPLOY_WEBHOOK` et `COOLIFY_API_TOKEN`). Si la génération échoue, rien n'est déployé ;
   - **sans ces secrets** : Coolify redéploie de lui-même à chaque push, donc deux fois de suite (votre commit, puis celui de l'Action). C'est sans conséquence.

La procédure détaillée (Coolify, secrets) est dans le dépôt privé de l'espace d'envoi de photos.

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

**Une fois attribués, le numéro et l'adresse d'une photo ne changent plus jamais** : ils sont enregistrés dans `photos-meta.json` (`num`, `slug`) la première fois que le générateur voit la photo. Ni l'ordre de tri, ni le nombre de photos, ni les suppressions ne les modifient.

Pour une **nouvelle** photo :

| Nom du fichier | Numéro attribué | Adresse |
|---|---|---|
| `grizette-20261103-a1b2c3.jpg` (envoyée depuis le téléphone) | le numéro suivant, par ex. n°50 | `/photo/grizette-50/` |
| `Grizette (60).jpg` (60 jamais attribué) | n°60 | `/photo/grizette-60/` |
| `Grizette (12).png` ou `Grizette (9).jpg` (numéro déjà attribué, même si la photo a été supprimée) | le numéro suivant | `/photo/grizette-<numéro>/` |
| `Sieste été 2025.PNG` | le numéro suivant | `/photo/grizette-<numéro>/` |

- Les photos envoyées ensemble sont numérotées dans l'ordre de l'envoi.
- Un numéro attribué n'est **jamais réattribué**, même après suppression de la photo (y compris celle au plus grand numéro) : le compteur `_numero_suivant` ne redescend jamais. S'il disparaît du fichier, la génération s'arrête avec un message plutôt que de risquer une réattribution.
- **Renommer un fichier** revient à supprimer la photo et en ajouter une nouvelle : nouveau numéro, nouvelle adresse. Pour garder les anciens, recopiez `num` et `slug` de l'ancienne ligne de `photos-meta.json` sur la nouvelle.

## 8. Organisation des dossiers

| Dossier / fichier | Rôle | Modifier à la main ? |
|---|---|---|
| `images/` | photos originales | oui : c'est là qu'on ajoute les photos |
| `photos-meta.json` | descriptions des photos (+ numéros figés, écrits automatiquement) | oui, sauf `num`, `rang`, `slug` |
| `contenu.json` | textes de l'accueil | oui |
| `assets/` | style (`site.css`), script (`site.js`), polices | pour faire évoluer le design |
| `outils/` | générateur et hook (non publiés) | pour faire évoluer les gabarits |
| `.github/workflows/generer.yml` | GitHub Action de génération (source de vérité) | rarement |
| `index.html`, `galerie/`, `photo/`, `404.html`, `img/`, `photos.json`, `sitemap.xml`, `llms.txt`, `robots.txt` | **générés automatiquement** | non : ils seraient écrasés |

Les icônes (`favicon.svg`…) se régénèrent avec `node outils/icones.mjs` après une modification de `favicon.svg`.

## 9. En cas de souci

- **« sharp absent »** : lancez `cd outils && npm install`. En attendant, le site fonctionne avec les photos originales (plus lourdes).
- **« n'est pas un JSON valide »** : il y a une faute de syntaxe dans `photos-meta.json` ou `contenu.json` (virgule en trop ou manquante, guillemet oublié). Le message donne la position de l'erreur.
- **Le hook ne se lance pas** : vérifiez que `git config core.hooksPath` affiche `.githooks`, et que Node.js est installé. Ce n'est pas bloquant : la GitHub Action génère le site après le push.
- **Une photo envoyée n'apparaît pas** : onglet **Actions** du dépôt sur GitHub. Une croix rouge sur « Génération du site » montre l'erreur (souvent une faute de syntaxe dans `photos-meta.json` ou `contenu.json`) ; après correction, push ou **Re-run**.
