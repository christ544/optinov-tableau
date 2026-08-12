import type { GlobalConfig } from 'payload'
import { triggerSiteRebuild } from '../hooks/triggerSiteRebuild'

// Un bloc de 3 images pour un service donné.
const blocsService = (service: string, labels: [string, string, string]) => ({
  name: service,
  type: 'group' as const,
  label: service,
  fields: [
    { name: 'img1', type: 'upload' as const, relationTo: 'media' as const, label: labels[0], required: false },
    { name: 'img2', type: 'upload' as const, relationTo: 'media' as const, label: labels[1], required: false },
    { name: 'img3', type: 'upload' as const, relationTo: 'media' as const, label: labels[2], required: false },
  ],
})

export const ServiceImages: GlobalConfig = {
  slug: 'service-images',
  label: 'Images des pages Services',
  admin: {
    description: 'Illustrations de chaque bloc des pages Services.',
  },
  access: {
    read: () => true, // lisible par le site
  },
  hooks: {
    afterChange: [() => { void triggerSiteRebuild() }],
  },
  fields: [
    blocsService('communication-visuelle', [
      "Bloc « L'identité prend forme »",
      'Bloc « Votre marque prend la parole »',
      'Bloc « La preuve par nos réalisations »',
    ]),
    blocsService('communication-digitale', [
      'Bloc « Chaque point de contact compte »',
      'Bloc « De la visibilité à la confiance »',
      'Bloc « Des résultats concrets »',
    ]),
    blocsService('marketing-strategie', [
      'Bloc « Faire les bons choix »',
      "Bloc « Passer à l'action »",
      'Bloc « Voir les résultats »',
    ]),
    blocsService('automatisation-ia', [
      'Bloc « Une entreprise plus simple à gérer »',
      'Bloc « Des solutions adaptées »',
      'Bloc « Plus de performance »',
    ]),
    blocsService('photo-video', [
      "Bloc « Nous capturons l'essentiel »",
      'Bloc « Des contenus qui vous servent »',
      'Bloc « Valorisez votre image »',
    ]),
  ],
}
