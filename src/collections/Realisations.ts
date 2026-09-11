/*
  COLLECTION « Réalisations » : le portfolio (page /realisations et fiches).

  Chaque fiche suit le gabarit du site : contexte, objectifs, réponse OPTINOV,
  résultats chiffrés, témoignage, visuels, et en option le comparateur
  avant / après. La case « Publiée » décide de la présence sur le site : une
  fiche en cours de rédaction reste invisible des visiteurs, même par l'API.
*/

import type { CollectionConfig } from 'payload'

import { estConnecte } from '../access'
import { triggerSiteRebuild } from '../hooks/triggerSiteRebuild'
import { slugify } from '../lib/slug'

/* Les filtres de la page Réalisations : mêmes identifiants que le site. */
export const SERVICES_REALISATION = [
  { value: 'visuel', label: 'Communication visuelle' },
  { value: 'digital', label: 'Communication digitale' },
  { value: 'marketing', label: 'Marketing & stratégie' },
  { value: 'ia', label: 'Performance & automatisation' },
  { value: 'photo-video', label: 'Photo & vidéo' },
] as const

export const SECTEURS = [
  { value: 'btp', label: 'BTP' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'sante', label: 'Santé' },
  { value: 'institution', label: 'Institution' },
  { value: 'services', label: 'Services' },
] as const

export const Realisations: CollectionConfig = {
  slug: 'realisations',

  labels: { singular: 'Réalisation', plural: 'Réalisations' },

  admin: {
    group: 'Contenus',
    hideAPIURL: true,
    useAsTitle: 'titre',
    defaultColumns: ['titre', 'client', 'secteur', 'annee', 'publiee'],
    description: 'Le portfolio : une fiche par projet, publiée quand elle est prête.',
  },

  access: {
    /*
      Lecture : les personnes connectées voient tout ; les visiteurs (donc le
      site, au build) ne voient que les fiches publiées. C'est un FILTRE, pas
      un booléen : Payload l'ajoute à la requête, une fiche non publiée ne
      sort jamais de l'API publique, même en devinant son adresse.
    */
    read: ({ req: { user } }) => (user ? true : { publiee: { equals: true } }),
    create: estConnecte,
    update: estConnecte,
    delete: estConnecte,
  },

  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.titre) data.slug = slugify(data.titre)
        return data
      },
    ],
    afterChange: [() => triggerSiteRebuild()],
    afterDelete: [() => triggerSiteRebuild()],
  },

  fields: [
    { name: 'titre', type: 'text', label: 'Titre de la fiche', required: true },
    {
      name: 'slug',
      type: 'text',
      label: 'Identifiant URL (généré automatiquement)',
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Laissez vide : il se remplit tout seul à partir du titre.' },
    },
    {
      name: 'publiee',
      type: 'checkbox',
      label: 'Publiée sur le site',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Décochée : la fiche reste invisible des visiteurs.' },
    },
    {
      name: 'ordre',
      type: 'number',
      label: 'Ordre d’affichage',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Du plus petit au plus grand.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'client', type: 'text', label: 'Client', required: true },
        { name: 'annee', type: 'text', label: 'Année', required: true, admin: { description: 'Ex. 2026' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'services',
          type: 'select',
          label: 'Services concernés',
          hasMany: true,
          required: true,
          options: [...SERVICES_REALISATION],
          admin: { description: 'Le premier choisi donne le type de mission affiché.' },
        },
        {
          name: 'secteur',
          type: 'select',
          label: 'Secteur d’activité',
          required: true,
          options: [...SECTEURS],
        },
      ],
    },
    {
      name: 'extrait',
      type: 'textarea',
      label: 'Accroche (une ou deux phrases)',
      required: true,
    },
    { name: 'visuel', type: 'upload', relationTo: 'media', label: 'Visuel principal' },
    {
      name: 'galerie',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Galerie',
    },
    { name: 'contexte', type: 'textarea', label: '1. Le contexte', required: true },
    {
      name: 'objectifs',
      type: 'array',
      label: '2. Objectifs',
      minRows: 1,
      labels: { singular: 'Objectif', plural: 'Objectifs' },
      fields: [{ name: 'texte', type: 'text', label: 'Objectif', required: true }],
    },
    { name: 'reponse', type: 'textarea', label: '3. Notre réponse', required: true },
    {
      name: 'resultats',
      type: 'array',
      label: '4. Résultats chiffrés',
      labels: { singular: 'Résultat', plural: 'Résultats' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'valeur', type: 'text', label: 'Valeur', required: true, admin: { description: 'Ex. « +40 % »' } },
            { name: 'label', type: 'text', label: 'Intitulé', required: true, admin: { description: 'Ex. « de demandes entrantes »' } },
          ],
        },
      ],
    },
    {
      name: 'temoignage',
      type: 'group',
      label: '5. Témoignage du client',
      fields: [
        { name: 'verbatim', type: 'textarea', label: 'Témoignage' },
        {
          type: 'row',
          fields: [
            { name: 'nom', type: 'text', label: 'Nom' },
            { name: 'fonction', type: 'text', label: 'Fonction' },
          ],
        },
      ],
    },
    {
      name: 'avantApres',
      type: 'group',
      label: 'Comparateur avant / après',
      admin: { description: 'Facultatif : deux images de même cadrage, le visiteur déplace un curseur.' },
      fields: [
        { name: 'activer', type: 'checkbox', label: 'Afficher le comparateur', defaultValue: false },
        {
          type: 'row',
          fields: [
            { name: 'avant', type: 'upload', relationTo: 'media', label: 'Image AVANT' },
            { name: 'apres', type: 'upload', relationTo: 'media', label: 'Image APRÈS' },
          ],
        },
      ],
    },
    {
      name: 'etudeDeCas',
      type: 'checkbox',
      label: 'Étude de cas longue',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Mise en avant comme étude de cas détaillée.' },
    },
  ],
}
