import { describe, expect, it } from 'vitest'

import { libelleFormulaire, libelleStatut, sujetAlerte, texteAccuse, texteAlerte } from '@/lib/demandes'

const demande = {
  id: 42,
  nom: 'Aïcha Koné',
  telephone: '+225 07 00 00 00 00',
  email: 'aicha@exemple.ci',
  typeFormulaire: 'devis-service',
  service: 'communication-visuelle',
  budget: '500 000 – 2 000 000 FCFA',
  message: 'Nous refaisons notre identité.',
  pageSource: '/services/communication-visuelle',
}

describe('libellés', () => {
  it('traduit les valeurs stockées en libellés lisibles', () => {
    expect(libelleFormulaire('devis-flotte')).toBe('Devis flotte PROS.CARDS')
    expect(libelleStatut('en-cours')).toBe('En cours')
  })

  it('ne renvoie jamais une chaîne vide pour une valeur inconnue', () => {
    expect(libelleFormulaire('inconnu')).toBe('Formulaire')
    expect(libelleStatut(null)).toBe('Nouveau')
  })
})

describe('alerte interne', () => {
  it('met le téléphone en première ligne et le lien vers la fiche en dernière', () => {
    const texte = texteAlerte(demande, 'https://admin/collections/demandes/42')
    const lignes = texte.split('\n')
    expect(lignes[0]).toBe('Aïcha Koné — +225 07 00 00 00 00')
    expect(lignes[lignes.length - 1]).toBe('Fiche complète : https://admin/collections/demandes/42')
    expect(texte).toContain('Budget : 500 000 – 2 000 000 FCFA')
    expect(texte).toContain('Message :\nNous refaisons notre identité.')
  })

  it('omet les lignes sans valeur', () => {
    const texte = texteAlerte({ id: 1, nom: 'X', telephone: '0', typeFormulaire: 'rappel' }, 'u')
    expect(texte).not.toContain('E-mail')
    expect(texte).not.toContain('Message')
  })

  it('nomme le formulaire dans le sujet', () => {
    expect(sujetAlerte(demande)).toBe('Nouvelle demande — Demande de devis (service) — Aïcha Koné')
  })
})

describe('accusé de réception', () => {
  it('salue par le nom et donne le lien WhatsApp quand il est connu', () => {
    const texte = texteAccuse(demande, '2250173732421')
    expect(texte.startsWith('Bonjour Aïcha Koné,')).toBe(true)
    expect(texte).toContain('https://wa.me/2250173732421')
  })

  it('reste correct sans numéro WhatsApp', () => {
    expect(texteAccuse(demande, null)).toContain('WhatsApp')
    expect(texteAccuse(demande, null)).not.toContain('wa.me')
  })
})
