import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { creerDeclencheur } from '@/hooks/triggerSiteRebuild'

/*
  Le déclencheur regroupe les demandes de reconstruction du site : on vérifie
  qu'une rafale d'enregistrements ne produit qu'UN appel, une fois le calme
  revenu. Les minuteurs sont simulés : les tests ne durent que quelques
  millisecondes et n'appellent jamais le réseau.
*/

describe('creerDeclencheur', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('n’appelle pas le hook avant la fin du délai de calme', () => {
    const appeler = vi.fn(async () => {})
    const d = creerDeclencheur({ appeler, delai: 1000 })

    d.demander()
    vi.advanceTimersByTime(999)

    expect(appeler).not.toHaveBeenCalled()
    expect(d.enAttente()).toBe(true)
  })

  it('regroupe une rafale de demandes en un seul appel', () => {
    const appeler = vi.fn(async () => {})
    const d = creerDeclencheur({ appeler, delai: 1000 })

    // Dix enregistrements espacés de 300 ms : le minuteur est repoussé à chaque fois.
    for (let i = 0; i < 10; i++) {
      d.demander()
      vi.advanceTimersByTime(300)
    }
    expect(appeler).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)
    expect(appeler).toHaveBeenCalledTimes(1)
    expect(d.enAttente()).toBe(false)
  })

  it('repart pour un nouvel appel après une nouvelle modification', () => {
    const appeler = vi.fn(async () => {})
    const d = creerDeclencheur({ appeler, delai: 1000 })

    d.demander()
    vi.advanceTimersByTime(1000)
    d.demander()
    vi.advanceTimersByTime(1000)

    expect(appeler).toHaveBeenCalledTimes(2)
  })

  it('peut annuler une demande en attente', () => {
    const appeler = vi.fn(async () => {})
    const d = creerDeclencheur({ appeler, delai: 1000 })

    d.demander()
    d.annuler()
    vi.advanceTimersByTime(5000)

    expect(appeler).not.toHaveBeenCalled()
    expect(d.enAttente()).toBe(false)
  })
})
