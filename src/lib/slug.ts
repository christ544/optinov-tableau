/*
  IDENTIFIANT D'URL (« slug ») À PARTIR D'UN TITRE.
  « Créer une identité de marque » -> « creer-une-identite-de-marque ».

  Utilisé par les articles et les réalisations : l'adresse de la page sur le
  site est dérivée du titre, sans accent, sans espace, en minuscules.
*/
export const slugify = (valeur: string): string =>
  valeur
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // enlève les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
