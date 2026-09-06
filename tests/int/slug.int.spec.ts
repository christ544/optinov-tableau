import { describe, expect, it } from 'vitest'

import { slugify } from '@/lib/slug'

describe('slugify', () => {
  it('met en minuscules, retire les accents et remplace les séparateurs par des tirets', () => {
    expect(slugify('Créer une identité de marque')).toBe('creer-une-identite-de-marque')
    expect(slugify('Carte NFC ou carte papier : le vrai calcul')).toBe('carte-nfc-ou-carte-papier-le-vrai-calcul')
  })

  it('ne laisse jamais de tiret en début ou en fin', () => {
    expect(slugify('  — Réalisations 2026 !  ')).toBe('realisations-2026')
  })

  it('renvoie une chaîne vide pour un titre sans lettre ni chiffre', () => {
    expect(slugify('???')).toBe('')
  })
})
