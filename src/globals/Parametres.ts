/*
  GLOBAL « Paramètres du site » : tout ce qui n'existe qu'en un exemplaire.

  Coordonnées, horaires, réseaux sociaux, liens de la plateforme PROS.CARDS,
  mentions légales. Le site les lit au build (script de synchronisation) et
  les affiche dans l'en-tête, le pied de page, la page Contact et les pages
  légales. Un champ laissé vide n'affiche rien sur le site, jamais un texte
  « à compléter ».

  Les valeurs par défaut sont celles que le site affiche aujourd'hui.
*/

import type { GlobalConfig } from 'payload'

import { estConnecte, lecturePublique } from '../access'
import { triggerSiteRebuild } from '../hooks/triggerSiteRebuild'

export const Parametres: GlobalConfig = {
  slug: 'parametres',
  label: 'Paramètres du site',

  admin: {
    group: 'Administration',
    hideAPIURL: true,
    description: 'Coordonnées, réseaux sociaux, liens PROS.CARDS et mentions légales.',
  },

  access: {
    read: lecturePublique, // le site les affiche
    update: estConnecte,
  },

  hooks: {
    afterChange: [() => triggerSiteRebuild()],
  },

  fields: [
    {
      type: 'tabs', // des onglets : le formulaire reste lisible malgré ses vingt champs
      tabs: [
        {
          label: 'Identité',
          fields: [
            { name: 'nom', type: 'text', label: 'Nom de l’agence', required: true, defaultValue: 'OPTINOV' },
            {
              name: 'baseline',
              type: 'text',
              label: 'Baseline',
              required: true,
              defaultValue: 'Communication · Marketing · Transformation digitale',
              admin: { description: 'Sous le logo, dans le pied de page et les partages.' },
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'telephone',
                  type: 'text',
                  label: 'Téléphone mobile',
                  required: true,
                  defaultValue: '+225 01 73 73 24 21',
                },
                { name: 'telephoneFixe', type: 'text', label: 'Ligne fixe', defaultValue: '+225 27 22 25 22 74' },
              ],
            },
            {
              name: 'whatsapp',
              type: 'text',
              label: 'Numéro WhatsApp',
              required: true,
              defaultValue: '2250173732421',
              admin: { description: 'Format international sans « + » ni espace, ex. 2250700000000.' },
            },
            { name: 'email', type: 'email', label: 'E-mail', required: true, defaultValue: 'optinovagence@gmail.com' },
            {
              name: 'adresse',
              type: 'text',
              label: 'Adresse',
              required: true,
              defaultValue: 'Cocody Angré 7ᵉ Tranche, Abidjan — Côte d’Ivoire',
            },
            {
              type: 'row',
              fields: [
                { name: 'ville', type: 'text', label: 'Ville', required: true, defaultValue: 'Abidjan' },
                { name: 'pays', type: 'text', label: 'Pays', required: true, defaultValue: 'Côte d’Ivoire' },
              ],
            },
            {
              name: 'horaires',
              type: 'text',
              label: 'Horaires',
              admin: { description: 'Ex. « Lundi–vendredi, 8 h–18 h ». Vide : non affiché.' },
            },
            {
              name: 'delaiReponse',
              type: 'text',
              label: 'Engagement de délai de réponse',
              defaultValue: 'sous 24 h ouvrées',
            },
            {
              name: 'rdvUrl',
              type: 'text',
              label: 'Lien de prise de rendez-vous',
              admin: {
                description:
                  'Adresse Cal.com ou Calendly. Vide : le bouton « Prendre rendez-vous » mène à la page Contact.',
              },
            },
          ],
        },
        {
          label: 'Réseaux sociaux',
          fields: [
            {
              name: 'reseaux',
              type: 'group',
              label: ' ',
              admin: { description: 'Un réseau sans adresse n’est pas affiché.' },
              fields: [
                { name: 'linkedin', type: 'text', label: 'LinkedIn' },
                { name: 'instagram', type: 'text', label: 'Instagram' },
                { name: 'facebook', type: 'text', label: 'Facebook' },
              ],
            },
          ],
        },
        {
          label: 'PROS.CARDS',
          fields: [
            {
              name: 'prosCards',
              type: 'group',
              label: ' ',
              admin: {
                description:
                  'Points d’entrée vers la plateforme. Un lien vide mène à la page Contact.',
              },
              fields: [
                { name: 'inscription', type: 'text', label: 'Tunnel d’inscription' },
                { name: 'connexion', type: 'text', label: 'Espace client (connexion)' },
                { name: 'demo', type: 'text', label: 'Démonstration' },
              ],
            },
          ],
        },
        {
          label: 'Mentions légales',
          fields: [
            { name: 'rccm', type: 'text', label: 'Numéro RCCM' },
            { name: 'directeurPublication', type: 'text', label: 'Directeur de la publication' },
            { name: 'hebergeur', type: 'text', label: 'Hébergeur du site' },
          ],
        },
      ],
    },
  ],
}
