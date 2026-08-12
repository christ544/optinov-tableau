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
  plugins: [
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
  ],
})
