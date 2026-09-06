/*
  COLLECTION « Utilisateurs » : les comptes du tableau de bord.

  À COMPRENDRE : `auth` suffit à Payload pour fabriquer TOUT le système
  d'authentification : champ e-mail, mot de passe haché, page de connexion,
  cookie de session signé, « mot de passe oublié ». C'est exactement ce qu'il
  ne faut JAMAIS réécrire soi-même.

  Le « rôle » ne crée pas un second tableau de bord : il décide seulement de
  ce que la personne connectée a le droit de voir et de modifier à l'intérieur
  (voir src/access/index.ts).
*/

import type { CollectionConfig } from 'payload'

import { aLeRole, estAdministrateur } from '../access'

/*
  L'adresse publique du serveur dit sans ambiguïté si l'on est en http://
  (local) ou en https:// (production). Sur Render, RENDER_EXTERNAL_URL est
  fournie automatiquement ; voir payload.config.ts.
*/
const ADRESSE_PUBLIQUE =
  process.env.PAYLOAD_PUBLIC_SERVER_URL || process.env.RENDER_EXTERNAL_URL || ''

export const Users: CollectionConfig = {
  slug: 'users',

  labels: {
    singular: 'Utilisateur',
    plural: 'Utilisateurs',
  },

  admin: {
    group: 'Administration',
    // Le tableau de bord s'adresse à des éditeurs, pas à des développeurs :
    // on masque l'onglet « API », qui n'affiche que du JSON technique.
    hideAPIURL: true,
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    description: 'Les personnes autorisées à se connecter au tableau de bord.',
  },

  auth: {
    /*
      Verrouillage après tentatives échouées : après 5 échecs, le compte est
      bloqué 10 minutes. C'est la parade de base contre le « bourrage
      d'identifiants » (essayer des milliers de mots de passe volés à la
      chaîne jusqu'à ce que l'un fonctionne).
    */
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000, // 10 minutes, en millisecondes

    /*
      Sans ce bloc, le cookie de session n'a pas l'attribut Secure : un
      navigateur l'enverrait même sur une connexion http:// non chiffrée.
      En local (http://localhost), Secure doit rester désactivé, sinon le
      navigateur refuse le cookie et la connexion devient impossible.
    */
    cookies: {
      secure: ADRESSE_PUBLIQUE.startsWith('https://'),
      sameSite: 'Lax',
    },
  },

  access: {
    // Seul un administrateur crée ou supprime des comptes.
    create: estAdministrateur,
    delete: estAdministrateur,

    // Chacun peut modifier SON propre compte (mot de passe, nom).
    update: ({ req: { user }, id }) => {
      if (!user) return false
      if (aLeRole(user, 'administrateur')) return true
      return user.id === id
    },

    /*
      Lecture : un administrateur voit tous les comptes ; les autres ne voient
      que le leur.

      LA PREMIÈRE LIGNE EST LA PLUS IMPORTANTE. Sans elle, un visiteur non
      connecté produirait le filtre { id: { equals: undefined } }, dont le sens
      dépend de la base de données. Une règle de sécurité ne doit jamais
      dépendre d'un hasard d'implémentation : on refuse d'abord explicitement.

      Le `return { id: { equals: user.id } }` n'est pas un booléen mais un
      FILTRE que Payload ajoute à la requête : la manière propre de dire « tu
      n'as accès qu'à tes propres données ».
    */
    read: ({ req: { user } }) => {
      if (!user) return false
      if (aLeRole(user, 'administrateur')) return true
      return { id: { equals: user.id } }
    },
  },

  hooks: {
    /*
      LE TOUT PREMIER COMPTE EST FORCÉMENT ADMINISTRATEUR.
      Payload propose de créer le premier utilisateur sur un écran dédié, sans
      personne de connecté. Si ce compte naissait « éditeur », plus personne
      ne pourrait jamais gérer les comptes : le tableau de bord serait
      verrouillé de l'intérieur. On force donc le rôle quand la table est vide.
    */
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users' })
        if (totalDocs === 0) return { ...data, role: 'administrateur' }
        return data
      },
    ],
  },

  fields: [
    // Les champs « email » et « password » sont ajoutés automatiquement par `auth`.
    {
      name: 'name',
      type: 'text',
      label: 'Nom complet',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      label: 'Rôle',
      required: true,
      defaultValue: 'editeur',
      options: [
        { label: 'Administrateur (contenus et comptes)', value: 'administrateur' },
        { label: 'Éditeur (contenus uniquement)', value: 'editeur' },
      ],
      access: {
        /*
          SUBTILITÉ DE SÉCURITÉ : plus haut, on autorise chacun à modifier son
          propre compte. Sans la règle ci-dessous, un éditeur pourrait donc
          s'auto-promouvoir administrateur en modifiant sa propre fiche. Ici,
          seul un administrateur peut ÉCRIRE dans le champ « rôle ».
        */
        update: ({ req: { user } }) => aLeRole(user, 'administrateur'),
      },
    },
  ],
}
