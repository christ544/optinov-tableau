import type { CollectionConfig } from 'payload'

// Génère un slug (identifiant d'URL) à partir du titre.
const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // enlève les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

export const Blog: CollectionConfig = {
  slug: 'blog',
  labels: {
    singular: 'Article',
    plural: 'Articles du blog',
  },
  admin: {
    useAsTitle: 'titre',
    defaultColumns: ['titre', 'categorie', 'date', 'aLaUne'],
    description: 'Créez, modifiez et illustrez vos articles de blog.',
  },
  access: {
    read: () => true, // les articles sont lisibles publiquement (le site les affiche)
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.titre) {
          data.slug = slugify(data.titre)
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'titre',
      type: 'text',
      label: 'Titre',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Identifiant URL (généré automatiquement)',
      admin: {
        position: 'sidebar',
        description: 'Laissez vide : il se remplit tout seul à partir du titre.',
      },
    },
    {
      name: 'categorie',
      type: 'select',
      label: 'Catégorie',
      defaultValue: 'agence',
      options: [
        { label: 'Communication & branding', value: 'branding' },
        { label: 'Marketing digital', value: 'marketing-digital' },
        { label: 'Intelligence artificielle & automatisation', value: 'ia' },
        { label: 'Carte de visite digitale & networking', value: 'carte-digitale' },
        { label: 'Coulisses & actualités', value: 'agence' },
      ],
    },
    {
      name: 'date',
      type: 'date',
      label: 'Date de publication',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' },
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image de couverture',
      required: false,
    },
    {
      name: 'extrait',
      type: 'textarea',
      label: 'Résumé court (accroche)',
    },
    {
      name: 'tempsLecture',
      type: 'number',
      label: 'Temps de lecture (minutes)',
      defaultValue: 5,
      min: 1,
      admin: { position: 'sidebar' },
    },
    {
      name: 'auteur',
      type: 'text',
      label: 'Auteur',
      defaultValue: "L'équipe OPTINOV",
    },
    {
      name: 'aLaUne',
      type: 'checkbox',
      label: 'Mettre à la une',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'serviceLie',
      type: 'text',
      label: 'Service lié (facultatif)',
      admin: { description: 'Ex : communication-visuelle' },
    },
    {
      name: 'landingLiee',
      type: 'text',
      label: 'Lien landing (facultatif)',
    },
    {
      name: 'body',
      type: 'richText',
      label: "Contenu de l'article",
    },
  ],
}
