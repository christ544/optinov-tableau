import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

/*
  Compte de test des parcours de bout en bout. Administrateur : les tests
  ouvrent la liste et le formulaire de création des utilisateurs, réservés à
  ce rôle. Le nom est obligatoire dans la collection.
*/
export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
}

/**
 * Crée le compte de test (après avoir supprimé un éventuel reliquat).
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  await payload.create({
    collection: 'users',
    data: { ...testUser, name: 'Compte de test', role: 'administrateur' },
  })
}

/**
 * Supprime le compte de test après les tests.
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}
