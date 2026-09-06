/*
  COLLECTION « Équipe » : la grille de portraits de la page À propos.
  Réassurance : mettre un visage et un nom sur l'agence.
*/

import type { CollectionConfig } from 'payload'

import { estConnecte, lecturePublique } from '../access'
import { triggerSiteRebuild } from '../hooks/triggerSiteRebuild'

export const Equipe: CollectionConfig = {
  slug: 'equipe',

  labels: { singular: 'Membre de l’équipe', plural: 'Équipe' },

  admin: {
    group: 'Contenus',
    hideAPIURL: true,
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'role', 'ordre'],
    description: 'Les portraits affichés sur la page À propos.',
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
        { name: 'nom', type: 'text', label: 'Nom', required: true },
        { name: 'role', type: 'text', label: 'Rôle dans l’agence', required: true },
      ],
    },
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Portrait' },
    {
      name: 'linkedin',
      type: 'text',
      label: 'Profil LinkedIn',
      admin: { description: 'Facultatif. Adresse complète du profil.' },
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
