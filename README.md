# OPTINOV — Tableau de bord du site vitrine

Back-office du site vitrine de l'agence de communication OPTINOV. Il permet à
l'équipe de publier des articles de blog et de choisir les illustrations des
pages Services, sans toucher au code du site.

Il est construit avec [Payload CMS](https://payloadcms.com) 3 sur Next.js 16,
avec une base PostgreSQL. L'interface d'administration est en français.

> Ce dépôt ne contient **pas** le site vitrine lui-même. Le site vit dans son
> propre dépôt : il lit le contenu de ce tableau de bord par l'API REST
> (voir « Ce que le site peut lire ») et il est reconstruit automatiquement
> après chaque modification (voir « Reconstruction du site »).

## Pile technique

| Rôle | Outil |
| --- | --- |
| Back-office et API | Payload CMS 3.88 (TypeScript, collections définies en code) |
| Serveur | Next.js 16 (App Router) |
| Base de données | PostgreSQL 17 en local, [Neon](https://neon.tech) en production |
| Images | disque local en développement, [Cloudinary](https://cloudinary.com) en production |
| Hébergement | [Render](https://render.com), offre gratuite, décrit par `render.yaml` |
| Tests | Vitest (intégration) et Playwright (bout en bout) |

## Installation locale

Prérequis : Node.js 22 et PostgreSQL (17 recommandé) installés.

1. **Cloner et installer les dépendances**

   ```bash
   git clone https://github.com/christ544/optinov-tableau.git
   cd optinov-tableau
   npm install
   ```

2. **Créer un rôle et une base dédiés** (demande une fois le mot de passe de
   l'utilisateur `postgres`). Le mot de passe `optinov_tableau_dev` ne sert
   qu'à cette base locale.

   ```bash
   psql -U postgres -h localhost -c "CREATE ROLE optinov_tableau LOGIN PASSWORD 'optinov_tableau_dev';" -c "CREATE DATABASE optinov_tableau OWNER optinov_tableau;"
   ```

   Sous Windows, `psql` se trouve dans `C:\Program Files\PostgreSQL\17\bin\`.

3. **Créer le fichier `.env`** à partir de l'exemple, puis y renseigner
   `PAYLOAD_SECRET` avec une valeur aléatoire (`openssl rand -hex 32`).
   Laisser les variables Cloudinary et `SITE_DEPLOY_HOOK` vides : en local, les
   images vont sur le disque et aucune reconstruction du site n'est déclenchée.

   ```bash
   cp .env.example .env
   ```

4. **Créer les tables** puis **lancer le serveur**

   ```bash
   npm run migrate
   npm run dev
   ```

5. Ouvrir <http://localhost:3000/admin> : au premier lancement, Payload
   propose de créer le premier compte administrateur.

## Commandes

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de développement sur le port 3000 |
| `npm run build` puis `npm run start` | build et serveur de production |
| `npm run migrate` | applique les migrations en attente à la base |
| `npm run migrate:create` | génère une migration après une modification des collections |
| `npm run generate:types` | régénère `src/payload-types.ts` |
| `npm run generate:importmap` | régénère la carte d'imports de l'admin (après tout ajout de composant) |
| `npm run lint` | analyse ESLint |
| `npm run test` | tests d'intégration puis tests de bout en bout |
| `npm run seed` | remplit la base LOCALE d'un jeu de démonstration « [Démo] » (refuse une base Neon) |

## Ce que le site peut lire

Toutes les lectures sont publiques ; l'écriture exige un compte du tableau de bord.

| Adresse | Contenu |
| --- | --- |
| `GET /api/globals/parametres` | coordonnées, horaires, réseaux sociaux, liens PROS.CARDS, mentions légales |
| `GET /api/blog?sort=-date&limit=10` | articles du blog, du plus récent au plus ancien |
| `GET /api/blog?where[slug][equals]=mon-article` | un article par son identifiant d'URL |
| `GET /api/realisations?where[publiee][equals]=true&sort=ordre` | le portfolio (seules les fiches publiées sortent, même sans ce filtre) |
| `GET /api/temoignages?sort=ordre` | témoignages clients |
| `GET /api/equipe?sort=ordre&depth=1` | membres de l'équipe, portrait inclus |
| `GET /api/faq?sort=ordre` | questions fréquentes, avec leur thème |
| `GET /api/globals/service-images?depth=1` | les illustrations des cinq pages Services, images incluses |
| `GET /api/media/:id` | la fiche d'une image (URL, dimensions, texte alternatif, trois tailles) |

Le site lit tout cela au build, par `scripts/sync-content.mjs` dans son dépôt.

Le paramètre `depth` contrôle l'inclusion des relations : avec `depth=0`, une
image est renvoyée sous forme d'identifiant ; avec `depth=1`, sous forme
d'objet complet avec son `url`.

## Images

- **En local**, les fichiers sont écrits dans `./media` (ignoré par Git).
- **En production**, dès que `CLOUDINARY_CLOUD_NAME` est renseigné, ils partent
  sur Cloudinary et sont servis par son CDN. L'adaptateur, dans
  `src/storage/cloudinary.ts`, n'utilise pas le SDK Cloudinary : il signe
  lui-même ses requêtes vers l'API REST.

## Reconstruction du site

Le site vitrine est un site statique : il faut le reconstruire pour qu'une
modification de contenu apparaisse. Après chaque création, modification ou
suppression d'article, et après chaque changement d'illustration, le hook
`src/hooks/triggerSiteRebuild.ts` appelle l'URL définie par `SITE_DEPLOY_HOOK`
(le « Deploy Hook » de Cloudflare Pages). Variable vide : rien ne se passe.

Les appels sont regroupés : le hook ne part que deux minutes après le dernier
enregistrement, pour qu'une session de saisie ne déclenche qu'une seule
reconstruction et non une par clic sur « Enregistrer ».

## Comptes et sécurité

Deux rôles :

| Rôle | Droits |
| --- | --- |
| Administrateur | tout le contenu, plus la création et la suppression des comptes |
| Éditeur | tout le contenu (articles, images, illustrations des pages Services) |

Chacun peut modifier son propre compte, mais seul un administrateur peut
changer un rôle. Le tout premier compte créé est automatiquement
administrateur. Après cinq mots de passe erronés, un compte est bloqué dix
minutes.

Ce qui est en place par ailleurs :

- **CORS et CSRF** : seuls le site vitrine (`FRONTEND_URL`) et le tableau de
  bord lui-même peuvent appeler l'API en écriture avec un cookie de session.
  L'adresse du tableau de bord se déduit de `RENDER_EXTERNAL_URL` sur Render,
  ou de `PAYLOAD_PUBLIC_SERVER_URL` avec un nom de domaine dédié. Si cette
  adresse est fausse, la consultation marche mais tout enregistrement échoue.
- **Uploads** : images uniquement (JPEG, PNG, WebP, AVIF, GIF, pas de SVG),
  15 Mo maximum, converties en WebP et déclinées en trois tailles
  (`vignette` 400 px, `carte` 800 px, `grande` 1600 px).
- **GraphQL désactivé** : le site n'utilise que l'API REST.
- **Cookie de session** `Secure` dès que l'adresse publique est en `https://`.

## Déploiement sur Render

Render lit `render.yaml` et crée le service. Variables à renseigner dans son
interface : `DATABASE_URI` (Neon, avec `?sslmode=require`), les trois variables
`CLOUDINARY_*` et `SITE_DEPLOY_HOOK`. `PAYLOAD_SECRET` est généré par Render,
`FRONTEND_URL` est fixée dans `render.yaml`.

Les migrations s'appliquent automatiquement au démarrage en production
(`prodMigrations` dans `src/payload.config.ts`). Le schéma n'est jamais
modifié « à la volée » (`push: false`) : toute évolution passe par un fichier
de migration commité.

Sur l'offre gratuite, le service s'endort après quinze minutes sans visite et
met trente à soixante secondes à se réveiller : ce n'est pas une panne.

## Modifier le contenu pilotable

1. Modifier une collection dans `src/collections/` ou un global dans `src/globals/`.
2. `npm run migrate:create` : Payload compare le code et la base et écrit la migration dans `src/migrations/`.
3. `npm run migrate` en local pour l'appliquer, puis commiter le code **et** la migration.
4. `npm run generate:types` pour mettre à jour les types partagés.

## Tests

```bash
npm run test:int   # Vitest : l'API interne de Payload, sur la base du .env
npm run test:e2e   # Playwright : parcours dans l'admin, lance le serveur si besoin
```

Les tests de bout en bout créent puis suppriment un utilisateur de test.

## Historique

Projet démarré le 12 août 2026 à partir du gabarit Cloudflare D1 de Payload,
puis déplacé le jour même vers Render, Neon et Cloudinary. Le nettoyage de
septembre 2026 a retiré les dépendances Cloudflare, MongoDB et D1 devenues
inutiles, réparé ESLint et documenté l'installation.
