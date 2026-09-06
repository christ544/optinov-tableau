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

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— OPTINOV',
      title: 'OPTINOV — Tableau de bord',
    },
  },
  collections: [Users, Media, Blog],
  globals: [ServiceImages],
  editor: lexicalEditor(),
  // Interface d'administration entièrement en français.
  i18n: {
    fallbackLanguage: 'fr',
    supportedLanguages: { fr },
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
