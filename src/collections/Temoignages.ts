/*
  COLLECTION « Témoignages » : la preuve sociale, sur la page d'accueil.

  Point juridique : un témoignage se publie avec l'accord écrit du client.
  D'où la case à cocher obligatoire ci-dessous : on ne publie pas la parole
  d'un client sans trace de son accord.
*/

import type { CollectionConfig } from 'payload'

import { estConnecte, lecturePublique } from '../access'
import { triggerSiteRebuild } from '../hooks/triggerSiteRebuild'

export const Temoignages: CollectionConfig = {
  slug: 'temoignages',

  labels: { singular: 'Témoignage', plural: 'Témoignages' },

  admin: {
    group: 'Contenus',
    hideAPIURL: true,
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'entreprise', 'ordre'],
    description: 'Les témoignages clients affichés sur la page d’accueil.',
  },

  access: {
    read: lecturePublique,
    create: estConnecte,
    update: estConnecte,
    delete: estConnecte,
  },

  hooks: {
    afterChange: [() => triggerSiteRebuild()],
    afterDelete: [() => triggerSiteRebuild()],
  },

  fields: [
    {
      type: 'row',
      fields: [
        { name: 'nom', type: 'text', label: 'Nom de la personne', required: true },
        { name: 'fonction', type: 'text', label: 'Fonction', required: true },
      ],
    },
    { name: 'entreprise', type: 'text', label: 'Entreprise', required: true },
    { name: 'verbatim', type: 'textarea', label: 'Témoignage', required: true },
    {
      name: 'consentement',
      type: 'checkbox',
      label: 'Accord écrit du client archivé',
      required: true,
      admin: {
        description: 'Un témoignage ne se publie pas sans accord écrit du client, conservé par l’agence.',
      },
    },
    {
      name: 'ordre',
      type: 'number',
      label: 'Ordre d’affichage',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Du plus petit au plus grand.' },
    },
  ],
}
