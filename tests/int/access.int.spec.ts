import { describe, expect, it } from 'vitest'

import { aLeRole, estAdministrateur, estConnecte, lecturePublique } from '@/access'

/*
  Ces fonctions décident qui peut lire ou écrire quoi. Une régression ici
  (une inversion de rôle, par exemple) ouvrirait la gestion des comptes à un
  éditeur sans qu'aucune autre protection ne la rattrape : d'où des tests,
  même si les fonctions sont courtes.

  Les fonctions d'accès de Payload attendent un objet complet, mais celles-ci
  ne lisent jamais que `req.user` : `any` est délibéré.
*/
const requete = (user: { role?: string } | null): any => ({ req: { user } })

describe('aLeRole', () => {
  it('refuse un visiteur non connecté', () => {
    expect(aLeRole(null, 'administrateur')).toBe(false)
    expect(aLeRole(undefined, 'administrateur')).toBe(false)
  })

  it('refuse un rôle absent de la liste demandée', () => {
    expect(aLeRole({ role: 'editeur' }, 'administrateur')).toBe(false)
  })

  it('accepte un rôle présent dans la liste demandée', () => {
    expect(aLeRole({ role: 'editeur' }, 'administrateur', 'editeur')).toBe(true)
  })

  it('refuse un compte sans rôle défini', () => {
    expect(aLeRole({}, 'administrateur')).toBe(false)
    expect(aLeRole({ role: null }, 'administrateur')).toBe(false)
  })
})

describe('estAdministrateur', () => {
  it('accepte uniquement le rôle administrateur', () => {
    expect(estAdministrateur(requete({ role: 'administrateur' }))).toBe(true)
    expect(estAdministrateur(requete({ role: 'editeur' }))).toBe(false)
    expect(estAdministrateur(requete(null))).toBe(false)
  })
})

describe('estConnecte', () => {
  it('accepte tout compte connecté, refuse un visiteur anonyme', () => {
    expect(estConnecte(requete({ role: 'editeur' }))).toBe(true)
    expect(estConnecte(requete({ role: 'administrateur' }))).toBe(true)
    expect(estConnecte(requete(null))).toBe(false)
  })
})

describe('lecturePublique', () => {
  it('autorise toujours, même sans utilisateur connecté', () => {
    expect(lecturePublique(requete(null))).toBe(true)
    expect(lecturePublique(requete({ role: 'editeur' }))).toBe(true)
  })
})
