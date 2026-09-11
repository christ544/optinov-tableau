import path from 'path'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { fr } from '@payloadcms/translations/languages/fr'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'

import { cloudinaryAdapter } from './storage/cloudinary'
import { migrations } from './migrations'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Blog } from './collections/Blog'
import { Demandes } from './collections/Demandes'
import { Equipe } from './collections/Equipe'
import { Faq } from './collections/Faq'
import { Realisations } from './collections/Realisations'
import { Temoignages } from './collections/Temoignages'
import { Parametres } from './globals/Parametres'
import { ServiceImages } from './globals/ServiceImages'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/*
  Cloudinary n'est activé QUE si ses identifiants sont renseignés.

  En production (Render), les trois variables CLOUDINARY_* sont définies : les
  images partent sur le CDN Cloudinary, comme avant.

  En développement local, on les laisse vides : Payload retombe alors sur son
  comportement par défaut et écrit les fichiers sur le disque, dans ./media
  (dossier déjà ignoré par Git). Chacun peut ainsi lancer le tableau de bord
  sur son PC sans compte Cloudinary, et sans risquer d'écraser les images du
  site en ligne avec des essais.

  Garder le plugin déclaré avec un cloudName vide ne serait pas une option :
  chaque téléversement échouerait sur une URL Cloudinary invalide.
*/
const CLOUDINARY_ACTIF = Boolean(process.env.CLOUDINARY_CLOUD_NAME)

/*
  L'adresse du site vitrine. Elle sert à deux choses : autoriser ses appels à
  l'API (CORS, voir plus bas) et alimenter le lien « Voir le site en ligne ».
  À défaut de FRONTEND_URL, l'adresse actuelle du site sur Cloudflare.
*/
const SITE_VITRINE = process.env.FRONTEND_URL || 'https://optinov-agence.christkangah14.workers.dev'

/*
  L'adresse publique de CE tableau de bord. Payload en a besoin pour fabriquer
  des URL absolues (lien « mot de passe oublié » des e-mails) et pour la
  protection CSRF ci-dessous.

  Sur Render, la variable RENDER_EXTERNAL_URL est fournie automatiquement
  (https://optinov-dashboard.onrender.com) : rien à configurer. Le jour où le
  tableau de bord aura son propre nom de domaine, PAYLOAD_PUBLIC_SERVER_URL
  prendra le dessus. En local : http://localhost:3000.
*/
const SERVEUR =
  process.env.PAYLOAD_PUBLIC_SERVER_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'

/*
  Origines supplémentaires autorisées à écrire, séparées par des virgules.
  Utile le temps d'une bascule de nom de domaine : l'ancienne et la nouvelle
  adresse fonctionnent toutes deux pendant la propagation DNS.
  Exemple : ORIGINES_AUTORISEES=https://admin.optinov.ci,https://www.optinov.ci
*/
const ORIGINES_SUPPLEMENTAIRES = (process.env.ORIGINES_AUTORISEES ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — OPTINOV',
      title: 'Tableau de bord',
    },

    /*
      On impose le thème clair. Par défaut, Payload suit le réglage du système
      d'exploitation : sur un Windows en mode sombre, l'interface passerait en
      noir et la charte OPTINOV (fond clair, bleu marine, orange) deviendrait
      illisible.
    */
    theme: 'light',

    /*
      Photo de profil de la personne connectée : ses initiales sur le bleu
      marine, plutôt que la silhouette grise ou Gravatar (voir le composant).
    */
    avatar: {
      Component: '/components/admin/AvatarUtilisateur#AvatarUtilisateur',
    },

    /*
      Identité visuelle et écrans sur mesure du tableau de bord.
      Les chemins sont résolus depuis `importMap.baseDir` (donc depuis src/),
      et la partie après le « # » désigne l'export à utiliser dans le fichier.
      Après toute modification ici : npm run generate:importmap
    */
    components: {
      /*
        BARRE D'EN-TÊTE (coin supérieur droit, sur tous les écrans) : le
        chevron du menu compte, qui vient se coller à l'avatar rendu par Payload.
        La forme « objet » permet de passer une prop : l'adresse du site est
        connue du serveur, pas du navigateur.
      */
      actions: [
        {
          clientProps: { lienSite: SITE_VITRINE },
          path: '/components/admin/MenuCompte#MenuCompte',
        },
      ],

      graphics: {
        Logo: '/components/admin/Logo#Logo', // grand logo, page de connexion
        Icon: '/components/admin/Icon#Icon', // petite icône, barre latérale
      },

      /*
        Payload n'expose pas d'emplacement « pied de page ». Un « provider »
        (un composant qui enveloppe toute l'application) rend `{children}` puis
        le <footer> : c'est la façon propre d'en ajouter un partout.
      */
      providers: ['/components/admin/PiedDePage#PiedDePage'],

      views: {
        /*
          Écran d'accueil sur mesure : chiffres clés du blog et des pages
          Services, actions rapides, derniers articles, illustrations manquantes.
          On REMPLACE la vue « dashboard » par défaut, dont la grille de cartes
          ne faisait que dupliquer la barre latérale.
        */
        dashboard: {
          Component: '/components/admin/TableauDeBord#TableauDeBord',
        },
      },
    },
  },
  collections: [
    // Contenus
    Blog,
    Realisations,
    Temoignages,
    Equipe,
    Faq,
    // Commercial
    Demandes,
    // Bibliothèque
    Media,
    // Administration
    Users,
  ],
  globals: [ServiceImages, Parametres],
  editor: lexicalEditor(),
  // Interface d'administration entièrement en français.
  i18n: {
    fallbackLanguage: 'fr',
    supportedLanguages: { fr },

    /*
      La traduction française de Payload contourne le problème du genre par des
      tournures pénibles : « Créer un(e) nouveau ou nouvelle Article ». On
      remplace ces quelques chaînes par des formulations neutres en genre.
    */
    translations: {
      fr: {
        general: {
          createNew: 'Ajouter',
          createNewLabel: 'Ajouter : {{label}}',
          creatingNewLabel: 'Nouveau : {{label}}',
          addNew: 'Ajouter',
          addNewLabel: 'Ajouter : {{label}}',
          uploadNewLabel: 'Téléverser : {{label}}',
        },
      },
    },
  },
  /*
    ---------------------------------------------------------------- E-MAIL

    À quoi cela sert : prévenir l'agence dès qu'une demande arrive depuis le
    site, accuser réception au prospect, et faire fonctionner « mot de passe
    oublié ». Envoi par le Gmail de l'agence : SMTP_HOST=smtp.gmail.com,
    SMTP_PORT=465, SMTP_USER=l'adresse Gmail, SMTP_PASS=un « mot de passe
    d'application » (jamais le mot de passe du compte).

    ACTIVATION CONDITIONNELLE. Sans SMTP_HOST, aucun adaptateur : Payload écrit
    les e-mails dans la console. C'est ce qu'on veut en développement, où
    personne ne souhaite qu'un essai expédie un vrai message à un vrai prospect.
  */
  ...(process.env.SMTP_HOST
    ? {
        email: nodemailerAdapter({
          defaultFromAddress: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@optinov.ci',
          defaultFromName: 'OPTINOV',
          transportOptions: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 465,
            // 465 impose TLS dès la connexion ; 587 commence en clair puis bascule (STARTTLS).
            secure: (Number(process.env.SMTP_PORT) || 465) === 465,
            auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' },
          },
        }),
      }
    : {}),

  /*
    GRAPHQL DÉSACTIVÉ. Payload expose par défaut une API GraphQL en plus du
    REST, avec son introspection accessible sans authentification : une
    documentation d'attaque clé en main (noms exacts des mutations et de leurs
    champs). Le site n'appelle que l'API REST, et l'admin n'a pas besoin de
    GraphQL : rien ne justifie de garder cette seconde surface exposée.
  */
  graphQL: {
    disable: true,
  },

  /*
    ------------------------------------------------------------- SÉCURITÉ

    Le « secret » signe les cookies de session : c'est lui qui empêche de
    fabriquer un faux cookie pour se faire passer pour un administrateur. Il
    ne doit JAMAIS être commité : il vit dans .env (local) ou dans Render.
  */
  secret: process.env.PAYLOAD_SECRET || '',

  /*
    CORS : « qui a le droit d'appeler mon API depuis un navigateur ? »
    On autorise explicitement le site vitrine, et lui seul.

    CSRF : « quelles origines peuvent utiliser mon cookie de session ? »
    Cela empêche un site malveillant de déclencher, à votre insu et depuis
    votre navigateur déjà connecté, une suppression d'article.

    IMPORTANT : le tableau de bord lui-même DOIT figurer dans `csrf`
    (SERVEUR). Une requête d'écriture envoyée par l'admin porte l'en-tête
    Origin = son propre domaine ; si ce domaine n'est pas dans la liste,
    Payload ignore le cookie et refuse tout enregistrement, même à un
    administrateur. Symptôme : la consultation marche, l'enregistrement échoue
    avec « Vous n'êtes pas autorisé à effectuer cette action ». C'est pourquoi
    SERVEUR se déduit de RENDER_EXTERNAL_URL quand rien n'est configuré.
  */
  serverURL: SERVEUR,
  cors: Array.from(new Set([SITE_VITRINE, ...ORIGINES_SUPPLEMENTAIRES])),
  csrf: Array.from(new Set([SITE_VITRINE, SERVEUR, ...ORIGINES_SUPPLEMENTAIRES])),

  /*
    LIMITE DE TAILLE DES FICHIERS TÉLÉVERSÉS : sans elle, un compte compromis
    pouvait déposer un fichier de taille arbitraire. C'est un réglage global,
    pas par collection ; la liste blanche des types de fichiers, elle, est
    dans Media.ts. 15 Mo est largement au-dessus d'une photo normale, qui est
    de toute façon recompressée en WebP à l'upload.
  */
  upload: {
    limits: {
      fileSize: 15 * 1024 * 1024,
    },
  },

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Base de données PostgreSQL (Neon, gratuit sans carte).
  // push: false → on utilise des migrations explicites (fiable en production).
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
    push: false,
    prodMigrations: migrations, // applique le schéma automatiquement au démarrage en production
  }),
  sharp,
  plugins: CLOUDINARY_ACTIF
    ? [
        // Stockage des images sur Cloudinary (gratuit, sans carte).
        cloudStoragePlugin({
          collections: {
            media: {
              disablePayloadAccessControl: true, // images servies directement par le CDN Cloudinary
              adapter: cloudinaryAdapter({
                cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
                apiKey: process.env.CLOUDINARY_API_KEY || '',
                apiSecret: process.env.CLOUDINARY_API_SECRET || '',
                folder: 'optinov',
              }),
            },
          },
        }),
      ]
    : [], // en local : images sur le disque, dans ./media
})
