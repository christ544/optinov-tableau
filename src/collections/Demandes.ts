/*
  COLLECTION « Demandes » : les messages envoyés par les visiteurs du site
  (contact, devis service, devis flotte PROS.CARDS, demande de rappel).

  C'est la collection la plus sensible du tableau de bord : elle contient des
  données personnelles (nom, téléphone, e-mail). D'où les règles d'accès.
*/

import { APIError, type CollectionConfig, type FieldAccess } from 'payload'

import { estAdministrateur, estConnecte } from '../access'
import { notifierNouvelleDemande } from '../hooks/notifierNouvelleDemande'
import { STATUTS_DEMANDE, TYPES_FORMULAIRE } from '../lib/demandes'

/* Version « champ » d'estConnecte : Payload type différemment l'accès à un champ. */
const champReserveALEquipe: FieldAccess = ({ req: { user } }) => Boolean(user)

/*
  GARDE-FOU CONTRE LES RAFALES. Un visiteur (ou un robot) qui dépose plus de
  cinq demandes en dix minutes avec le même téléphone ou le même e-mail est
  refusé. Les personnes connectées (saisie manuelle) ne sont pas concernées.
*/
const MAX_PAR_10_MIN = 5

export const Demandes: CollectionConfig = {
  slug: 'demandes',

  labels: { singular: 'Demande', plural: 'Demandes' },

  admin: {
    group: 'Commercial',
    hideAPIURL: true,
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'telephone', 'typeFormulaire', 'statutTraitement', 'createdAt'],
    description: 'Les messages envoyés depuis les formulaires du site.',
  },

  access: {
    /*
      ASYMÉTRIE VOLONTAIRE, ET C'EST TOUT L'INTÉRÊT :
      - create: () => true  -> n'importe quel visiteur peut DÉPOSER une demande,
        c'est le formulaire public du site ;
      - read: estConnecte   -> mais personne ne peut les RELIRE sans être connecté.
        Sans cette ligne, n'importe qui appellerait /api/demandes et repartirait
        avec les noms et téléphones de tous les prospects.
      Une boîte aux lettres : tout le monde peut y glisser une enveloppe, seul
      le propriétaire a la clé pour l'ouvrir.
    */
    create: () => true,
    read: estConnecte,
    update: estConnecte,
    delete: estAdministrateur,
  },

  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation !== 'create' || req.user || !data) return data

        // Champ piège des formulaires (honeypot) : un robot le remplit, un humain ne le voit pas.
        if (typeof (data as Record<string, unknown>).site_web === 'string' && (data as Record<string, unknown>).site_web) {
          throw new APIError('Demande refusée.', 400)
        }

        const depuis = new Date(Date.now() - 10 * 60 * 1000).toISOString()
        const memeOrigine = [
          data.telephone ? { telephone: { equals: data.telephone } } : null,
          data.email ? { email: { equals: data.email } } : null,
        ].filter(Boolean)
        if (memeOrigine.length === 0) return data

        const { totalDocs } = await req.payload.count({
          collection: 'demandes',
          where: { and: [{ createdAt: { greater_than: depuis } }, { or: memeOrigine as never[] }] },
        })
        if (totalDocs >= MAX_PAR_10_MIN) {
          throw new APIError('Trop de demandes envoyées en peu de temps. Réessayez dans quelques minutes.', 429)
        }
        return data
      },
    ],
    afterChange: [notifierNouvelleDemande],
  },

  fields: [
    {
      name: 'typeFormulaire',
      type: 'select',
      label: 'Formulaire d’origine',
      required: true,
      index: true,
      options: [...TYPES_FORMULAIRE],
    },
    {
      type: 'row',
      fields: [
        { name: 'nom', type: 'text', label: 'Nom', required: true },
        { name: 'telephone', type: 'text', label: 'Téléphone', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email', label: 'E-mail' },
        { name: 'entreprise', type: 'text', label: 'Entreprise' },
      ],
    },
    { name: 'sujet', type: 'text', label: 'Sujet' },
    {
      type: 'row',
      fields: [
        { name: 'service', type: 'text', label: 'Service concerné' },
        { name: 'budget', type: 'text', label: 'Budget indicatif' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'effectif', type: 'text', label: 'Effectif à équiper' },
        { name: 'creneau', type: 'text', label: 'Créneau de rappel' },
      ],
    },
    { name: 'message', type: 'textarea', label: 'Message' },

    // ------------------------------------------------------- Traçabilité
    {
      name: 'pageSource',
      type: 'text',
      label: 'Page d’origine',
      admin: { position: 'sidebar' },
    },
    {
      name: 'consentement',
      type: 'checkbox',
      label: 'Consentement recueilli',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Sans consentement explicite, la demande ne doit pas être enregistrée.',
      },
      validate: (valeur) => valeur === true || 'Le consentement est obligatoire.',
    },

    // ----------------------------------------------- Traitement commercial
    {
      name: 'statutTraitement',
      type: 'select',
      label: 'Traitement',
      required: true,
      defaultValue: 'nouveau',
      index: true,
      admin: { position: 'sidebar' },
      options: [...STATUTS_DEMANDE],
      /*
        Le dépôt est public, mais un visiteur ne doit pas pouvoir choisir ce
        champ : sinon une demande envoyée directement à l'API pourrait naître
        « Traitée » et ne jamais apparaître comme à traiter. L'accès par champ
        fait ignorer la valeur envoyée par un visiteur : Payload retombe sur
        « nouveau », sans faire échouer la création.
      */
      access: { create: champReserveALEquipe },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes internes',
      admin: { description: 'Non visible du prospect : compte rendu d’appel, suite donnée…' },
      access: { create: champReserveALEquipe },
    },
  ],
}
