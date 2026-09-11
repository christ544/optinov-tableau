import { describe, expect, it } from 'vitest'

import { initiales, SEUIL_POURCENTAGE, tempsRelatif, tendance } from '@/lib/format'

/*
  Ces fonctions sont pures : on les teste sans base ni navigateur.
  `tempsRelatif` prend une heure de référence en second paramètre, ce qui rend
  chaque cas déterministe quelle que soit l'heure d'exécution.
*/

describe('initiales', () => {
  it('prend la première lettre des deux premiers mots du nom', () => {
    expect(initiales('Paul Brou')).toBe('PB')
    expect(initiales('Alfred N’zue Kouassi')).toBe('AN')
  })

  it('se rabat sur la partie gauche de l’e-mail', () => {
    expect(initiales(undefined, 'konan.yao@exemple.ci')).toBe('KY')
    expect(initiales('', 'agence@optinov.ci')).toBe('AG')
  })

  it('tronque un nom d’un seul mot à deux lettres', () => {
    expect(initiales('Ana')).toBe('AN')
  })

  it('ne renvoie jamais une chaîne vide', () => {
    expect(initiales()).toBe('?')
    expect(initiales('   ', '')).toBe('?')
  })
})

describe('tempsRelatif', () => {
  const maintenant = Date.parse('2026-09-06T12:00:00Z')
  const ilYA = (ms: number) => new Date(maintenant - ms).toISOString()
  const MIN = 60_000
  const H = 60 * MIN
  const J = 24 * H

  it('arrondit les moins d’une minute à « à l’instant »', () => {
    expect(tempsRelatif(ilYA(20_000), maintenant)).toBe('à l’instant')
  })

  it('compte en minutes, heures puis jours', () => {
    expect(tempsRelatif(ilYA(5 * MIN), maintenant)).toBe('il y a 5 min')
    expect(tempsRelatif(ilYA(3 * H), maintenant)).toBe('il y a 3 h')
    expect(tempsRelatif(ilYA(1 * J), maintenant)).toBe('hier')
    expect(tempsRelatif(ilYA(4 * J), maintenant)).toBe('il y a 4 j')
  })

  it('passe aux semaines, mois et années', () => {
    expect(tempsRelatif(ilYA(15 * J), maintenant)).toBe('il y a 2 sem.')
    expect(tempsRelatif(ilYA(70 * J), maintenant)).toBe('il y a 2 mois')
    expect(tempsRelatif(ilYA(800 * J), maintenant)).toBe('il y a 2 ans')
  })

  it('ne bricole pas une date future ni une date invalide', () => {
    expect(tempsRelatif(new Date(maintenant + H), maintenant)).toBe('à l’instant')
    expect(tempsRelatif('pas une date', maintenant)).toBe('')
  })
})

describe('tendance', () => {
  it('donne le sens et l’écart brut', () => {
    expect(tendance(8, 5)).toMatchObject({ ecart: 3, sens: 'hausse' })
    expect(tendance(2, 6)).toMatchObject({ ecart: -4, sens: 'baisse' })
    expect(tendance(4, 4)).toMatchObject({ ecart: 0, sens: 'stable' })
  })

  it('ne calcule un pourcentage qu’au-dessus du seuil', () => {
    expect(tendance(10, SEUIL_POURCENTAGE).pourcentage).toBe(100)
    expect(tendance(3, 1).pourcentage).toBeNull()
  })
})
