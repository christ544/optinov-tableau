import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Média',
    plural: 'Médias (images)',
  },
  admin: {
    description: 'Toutes les images téléversées (couvertures, illustrations…).',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texte alternatif (description de l’image)',
      required: true,
    },
  ],
  upload: {
    // Non supportés sur Workers pour l'instant (pas de sharp).
    crop: false,
    focalPoint: false,
  },
}
