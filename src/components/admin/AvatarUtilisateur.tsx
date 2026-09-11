/*
  AVATAR DE LA PERSONNE CONNECTÉE, dans l'en-tête du tableau de bord.

  Payload affiche par défaut soit une silhouette grise générique, soit une image
  Gravatar. La silhouette ne dit rien ; Gravatar envoie l'e-mail (haché) de vos
  éditeurs à un service tiers pour un résultat qui, neuf fois sur dix, est la
  même silhouette grise. On remplace les deux par des initiales sur le bleu
  marine de la marque : lisible, identifiable, et aucune requête sortante.

  Branché via `admin.avatar` dans payload.config.ts. Payload enveloppe ce
  composant dans son propre lien vers /admin/account : on ne rend donc ici que
  la pastille, jamais un lien (deux liens imbriqués seraient invalides).
*/

import React from 'react'

import { initiales } from '../../lib/format'

export const AvatarUtilisateur = (props: any) => {
  const utilisateur = props?.user ?? props?.initPageResult?.req?.user
  const nom = (utilisateur as { name?: string } | undefined)?.name
  const courriel = (utilisateur as { email?: string } | undefined)?.email

  return (
    <span aria-hidden="true" className="op-avatar" title={nom || courriel || undefined}>
      {initiales(nom, courriel)}
    </span>
  )
}

export default AvatarUtilisateur
