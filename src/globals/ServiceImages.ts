import type { GlobalConfig } from 'payload'
import { triggerSiteRebuild } from '../hooks/triggerSiteRebuild'

/*
  Les cinq pages Services du site, avec les trois blocs illustrés de chacune.
  Cette liste est exportée : le tableau de bord d'accueil s'en sert pour
  compter les illustrations renseignées et signaler celles qui manquent.
  L'ordre est celui du menu du site.
*/
export const SERVICES = [
  {
    slug: 'communication-visuelle',
    nom: 'Communication visuelle',
    blocs: [
      "Bloc « L'identité prend forme »",
      'Bloc « Votre marque prend la parole »',
      'Bloc « La preuve par nos réalisations »',
    ],
  },
  {
    slug: 'communication-digitale',
    nom: 'Communication digitale',
    blocs: [
      'Bloc « Chaque point de contact compte »',
      'Bloc « De la visibilité à la confiance »',
      'Bloc « Des résultats concrets »',
    ],
  },
  {
    slug: 'marketing-strategie',
    nom: 'Marketing & stratégie',
    blocs: [
      'Bloc « Faire les bons choix »',
      "Bloc « Passer à l'action »",
      'Bloc « Voir les résultats »',
    ],
  },
  {
    slug: 'automatisation-ia',
    nom: 'Performance & automatisation',
    blocs: [
      'Bloc « Une entreprise plus simple à gérer »',
      'Bloc « Des solutions adaptées »',
      'Bloc « Plus de performance »',
    ],
  },
  {
    slug: 'photo-video',
    nom: 'Photo & vidéo corporate',
    blocs: [
      "Bloc « Nous capturons l'essentiel »",
      'Bloc « Des contenus qui vous servent »',
      'Bloc « Valorisez votre image »',
    ],
  },
] as const

/** Les trois emplacements d'image d'un service, dans l'ordre des blocs. */
export const EMPLACEMENTS = ['img1', 'img2', 'img3'] as const

// Un groupe de 3 images pour un service donné.
const blocsService = (service: (typeof SERVICES)[number]) => ({
  name: service.slug,
  type: 'group' as const,
  label: service.nom,
  fields: EMPLACEMENTS.map((name, i) => ({
    name,
    type: 'upload' as const,
    relationTo: 'media' as const,
    label: service.blocs[i],
    required: false,
  })),
})

export const ServiceImages: GlobalConfig = {
  slug: 'service-images',
  label: 'Images des pages Services',
  admin: {
    group: 'Contenus',
    description: 'Illustrations de chaque bloc des pages Services.',
  },
  access: {
    read: () => true, // lisible par le site
  },
  hooks: {
    afterChange: [() => { void triggerSiteRebuild() }],
  },
  fields: SERVICES.map(blocsService),
}
