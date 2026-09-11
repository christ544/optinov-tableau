/*
  COLLECTION « FAQ » : les questions fréquentes de la page /faq.

  Regroupées par thème sur le site et balisées Schema.org FAQPage : bien
  rédigées, elles peuvent apparaître directement dans les résultats Google.
  Les quatre thèmes sont ceux de la page ; leur ordre et leurs titres sont
  fixés ici et repris par le site.
*/

import type { CollectionConfig } from 'payload'

import { estConnecte, lecturePublique } from '../access'
import { triggerSiteRebuild } from '../hooks/triggerSiteRebuild'

export const THEMES_FAQ = [
  { value: 'agence', label: 'OPTINOV & méthode' },
  { value: 'tarifs', label: 'Tarifs & délais' },
  { value: 'pros-cards', label: 'PROS.CARDS' },
  { value: 'support', label: 'Support & suivi' },
] as const

export const Faq: CollectionConfig = {
  slug: 'faq',

  labels: { singular: 'Question fréquente', plural: 'FAQ' },

  admin: {
    group: 'Contenus',
    hideAPIURL: true,
    useAsTitle: 'question',
    defaultColumns: ['question', 'theme', 'ordre'],
    description: 'Les questions-réponses de la page FAQ, par thème.',
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
      name: 'theme',
      type: 'select',
      label: 'Thème',
      required: true,
      defaultValue: 'agence',
      options: [...THEMES_FAQ],
      admin: { position: 'sidebar' },
    },
    { name: 'question', type: 'text', label: 'Question', required: true },
    { name: 'reponse', type: 'textarea', label: 'Réponse', required: true },
    {
      name: 'ordre',
      type: 'number',
      label: 'Ordre d’affichage',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Dans le thème, du plus petit au plus grand.' },
    },
  ],
}
