/*
  DEMANDES DU SITE : libellés et textes d'e-mail.

  Fonctions PURES, sans accès réseau ni base : testables (voir
  tests/int/demandes.int.spec.ts). Le hook d'alerte et le tableau de bord
  ne font que les appeler, pour n'avoir qu'une seule source de vérité des
  libellés.
*/

export const TYPES_FORMULAIRE = [
  { value: 'contact', label: 'Contact général' },
  { value: 'devis-service', label: 'Demande de devis (service)' },
  { value: 'devis-flotte', label: 'Devis flotte PROS.CARDS' },
  { value: 'rappel', label: 'Demande de rappel' },
] as const

export type TypeFormulaire = (typeof TYPES_FORMULAIRE)[number]['value']

export const libelleFormulaire = (valeur?: null | string): string =>
  TYPES_FORMULAIRE.find((t) => t.value === valeur)?.label ?? 'Formulaire'

export const STATUTS_DEMANDE = [
  { value: 'nouveau', label: 'Nouveau' },
  { value: 'en-cours', label: 'En cours' },
  { value: 'traite', label: 'Traité' },
] as const

export const libelleStatut = (valeur?: null | string): string =>
  STATUTS_DEMANDE.find((s) => s.value === valeur)?.label ?? 'Nouveau'

/* Ce dont les textes d'e-mail ont besoin : un sous-ensemble de la demande. */
export type DemandeResume = {
  budget?: null | string
  creneau?: null | string
  effectif?: null | string
  email?: null | string
  entreprise?: null | string
  id: number | string
  message?: null | string
  nom: string
  pageSource?: null | string
  service?: null | string
  sujet?: null | string
  telephone: string
  typeFormulaire?: null | string
}

/*
  ALERTE INTERNE. Texte brut, lisible sur un téléphone entre deux rendez-vous :
  le numéro figure en premier, c'est la seule information dont on a besoin
  pour agir tout de suite.
*/
export const sujetAlerte = (d: DemandeResume): string =>
  `Nouvelle demande — ${libelleFormulaire(d.typeFormulaire)} — ${d.nom}`

export const texteAlerte = (d: DemandeResume, adminURL: string): string =>
  [
    `${d.nom} — ${d.telephone}`,
    d.email ? `E-mail : ${d.email}` : null,
    d.entreprise ? `Entreprise : ${d.entreprise}` : null,
    `Formulaire : ${libelleFormulaire(d.typeFormulaire)}`,
    d.sujet ? `Sujet : ${d.sujet}` : null,
    d.service ? `Service : ${d.service}` : null,
    d.budget ? `Budget : ${d.budget}` : null,
    d.effectif ? `Effectif : ${d.effectif}` : null,
    d.creneau ? `Créneau : ${d.creneau}` : null,
    d.message ? `\nMessage :\n${d.message}` : null,
    d.pageSource ? `\nPage d'origine : ${d.pageSource}` : null,
    `\nFiche complète : ${adminURL}`,
  ]
    .filter((l): l is string => Boolean(l))
    .join('\n')

/*
  ACCUSÉ DE RÉCEPTION au prospect. Il répond à la promesse du site (« réponse
  sous 24 h ouvrées ») et rappelle WhatsApp pour qui ne veut pas attendre.
*/
export const sujetAccuse = (): string => 'Votre demande a bien été reçue — OPTINOV'

export const texteAccuse = (d: DemandeResume, whatsapp?: null | string): string =>
  [
    `Bonjour ${d.nom},`,
    '',
    'Nous avons bien reçu votre demande et nous revenons vers vous sous 24 heures ouvrées.',
    '',
    whatsapp
      ? `Pour une réponse plus rapide, écrivez-nous sur WhatsApp : https://wa.me/${whatsapp}`
      : 'Pour une réponse plus rapide, vous pouvez aussi nous écrire sur WhatsApp.',
    '',
    'OPTINOV',
    'Communication • Marketing • Digital • IA',
  ].join('\n')
