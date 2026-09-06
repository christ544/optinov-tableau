/*
  PETITS OUTILS DE MISE EN FORME DU TABLEAU DE BORD.

  Ces fonctions sont PURES : même entrée, même sortie, aucun effet de bord.
  C'est un choix délibéré : il les rend testables sans navigateur ni base de
  données (voir tests/int/format.int.spec.ts). Les composants d'affichage
  (avatar, tableau de bord) ne font que les appeler.

  Reprises du back-office OPTINOV IMMOBILIER, qui partage la même charte.
*/

/*
  TEMPS RELATIF, EN FRANÇAIS.
  « il y a 3 h », « hier », « il y a 4 j »...

  Sur un tableau de bord, savoir QUAND un article a été modifié se lit d'un
  coup d'œil en relatif, bien mieux qu'avec une date exacte.

  Le second paramètre `maintenant` (par défaut l'heure courante) sert
  d'ancrage : en le fixant, le test devient déterministe.
*/
export const tempsRelatif = (date: string | number | Date, maintenant: number = Date.now()): string => {
  const t = date instanceof Date ? date.getTime() : new Date(date).getTime()
  if (Number.isNaN(t)) return ''

  const secondes = Math.round((maintenant - t) / 1000)

  // Dates futures (décalage d'horloge, saisie manuelle) : on ne bricole pas.
  if (secondes < 0) return 'à l’instant'

  if (secondes < 60) return 'à l’instant'

  const minutes = Math.floor(secondes / 60)
  if (minutes < 60) return `il y a ${minutes} min`

  const heures = Math.floor(minutes / 60)
  if (heures < 24) return `il y a ${heures} h`

  const jours = Math.floor(heures / 24)
  if (jours === 1) return 'hier'
  if (jours < 7) return `il y a ${jours} j`

  const semaines = Math.floor(jours / 7)
  if (semaines < 5) return `il y a ${semaines} sem.`

  const mois = Math.floor(jours / 30)
  if (mois < 12) return `il y a ${mois} mois`

  const annees = Math.floor(jours / 365)
  return `il y a ${annees} an${annees > 1 ? 's' : ''}`
}

/*
  INITIALES D'UNE PERSONNE, pour une pastille d'avatar.
  « Paul Brou » -> « PB ».  « konan.yao@ex.ci » -> « KY ».  « Ana » -> « AN ».

  La chaîne de repli est volontairement courte : nom, sinon partie gauche de
  l'e-mail, sinon « ? ». Jamais de retour vide, qui laisserait un rond creux.
*/
export const initiales = (nom?: null | string, courriel?: null | string): string => {
  const source = (nom ?? '').trim() || (courriel ?? '').split('@')[0]?.trim() || ''
  if (!source) return '?'

  // On coupe sur les espaces ET sur les séparateurs courants des e-mails.
  const mots = source.split(/[\s._-]+/).filter(Boolean)
  if (mots.length === 0) return '?'
  if (mots.length >= 2) return (mots[0][0] + mots[1][0]).toUpperCase()
  return mots[0].slice(0, 2).toUpperCase()
}

export type Tendance = {
  /** Différence brute entre les deux périodes : -3, 0, +12... */
  ecart: number
  /** Variation en pourcentage, ou `null` quand elle n'aurait aucun sens. */
  pourcentage: null | number
  sens: 'baisse' | 'hausse' | 'stable'
}

/*
  COMPARE DEUX PÉRIODES ÉGALES (par exemple les 30 derniers jours contre les 30
  précédents) et en tire une tendance affichable.

  LE PIÈGE QU'ON ÉVITE ICI : le pourcentage sur de très petits nombres. Passer
  de 1 à 3 articles, c'est « +200 % », un chiffre spectaculaire qui ne veut
  rien dire. On ne renvoie donc un pourcentage QUE si la période précédente
  comptait au moins 5 éléments ; en dessous, seul l'écart brut est fiable.
*/
export const SEUIL_POURCENTAGE = 5

export const tendance = (actuel: number, precedent: number): Tendance => {
  const ecart = actuel - precedent
  const sens: Tendance['sens'] = ecart > 0 ? 'hausse' : ecart < 0 ? 'baisse' : 'stable'
  const pourcentage =
    precedent >= SEUIL_POURCENTAGE ? Math.round((ecart / precedent) * 100) : null

  return { ecart, pourcentage, sens }
}
