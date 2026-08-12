import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Utilisateur',
    plural: 'Utilisateurs',
  },
  admin: {
    useAsTitle: 'email',
    description: 'Les personnes autorisées à se connecter au tableau de bord.',
  },
  auth: true, // connexion par email + mot de passe
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nom',
    },
    // L'email et le mot de passe sont ajoutés automatiquement par Payload.
  ],
}
