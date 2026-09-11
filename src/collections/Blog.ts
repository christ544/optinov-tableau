import type { CollectionConfig } from 'payload'

import { estConnecte, lecturePublique } from '../access'
import { triggerSiteRebuild } from '../hooks/triggerSiteRebuild'
import { slugify } from '../lib/slug'

/*
  Les catégories du blog. Exportées pour que le tableau de bord d'accueil
  affiche le libellé lisible (« Marketing digital ») et non la valeur stockée
  (« marketing-digital »).
*/
export const CATEGORIES_BLOG = [
  { label: 'Communication & branding', value: 'branding' },
  { label: 'Marketing digital', value: 'marketing-digital' },
  { label: 'Intelligence artificielle & automatisation', value: 'ia' },
  { label: 'Carte de visite digitale & networking', value: 'carte-digitale' },
  { label: 'Coulisses & actualités', value: 'agence' },
] as const

export const Blog: CollectionConfig = {
  slug: 'blog',
  labels: {
    singular: 'Article',
    plural: 'Articles du blog',
  },
  admin: {
    group: 'Contenus',
    hideAPIURL: true,
    useAsTitle: 'titre',
    defaultColumns: ['titre', 'categorie', 'date', 'aLaUne'],
    description: 'Créez, modifiez et illustrez vos articles de blog.',
  },
  access: {
    read: lecturePublique, // le site affiche les articles : lecture publique
    // Écriture réservée aux personnes connectées (administrateurs et éditeurs).
    create: estConnecte,
    update: estConnecte,
    delete: estConnecte,
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
    // Reconstruit le site après chaque création/modification/suppression d'article.
    afterChange: [() => { void triggerSiteRebuild() }],
    afterDelete: [() => { void triggerSiteRebuild() }],
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
      options: [...CATEGORIES_BLOG],
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
