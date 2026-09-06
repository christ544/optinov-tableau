import path from 'path'
import { postgresAdapter } from '@payloadcms/db-postgres'
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
  L'adresse du site vitrine. Elle sert au lien « Voir le site en ligne » du
  menu compte et du tableau de bord. À défaut de FRONTEND_URL, l'adresse
  actuelle du site sur Cloudflare.
*/
const SITE_VITRINE = process.env.FRONTEND_URL || 'https://optinov-agence.christkangah14.workers.dev'

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
  collections: [Users, Media, Blog],
  globals: [ServiceImages],
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
  secret: process.env.PAYLOAD_SECRET || '',
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
