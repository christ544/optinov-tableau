'use client'

/*
  MENU DÉROULANT DU COMPTE, dans l'en-tête du tableau de bord.

  Payload place déjà un avatar en haut à droite, mais c'est un simple lien vers
  la page « Mon compte ». Les autres gestes du quotidien (ouvrir les images des
  pages Services, aller voir le site en ligne, se déconnecter) sont dispersés.
  On les regroupe ici.

  ACCESSIBILITÉ : un menu déroulant maison doit rendre ce qu'un <select> natif
  offre gratuitement :
    - `aria-expanded` dit aux lecteurs d'écran si le panneau est ouvert ;
    - la touche Échap referme et redonne le focus au bouton ;
    - un clic hors du panneau referme ;
    - les entrées sont de vrais liens, donc ouvrables dans un nouvel onglet.
*/

import { useAuth } from '@payloadcms/ui'
import Link from 'next/link'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { initiales } from '../../lib/format'
import {
  IconeChevron,
  IconeCompte,
  IconeLienExterne,
  IconeReglages,
  IconeSortie,
} from './Icones'

export const MenuCompte: React.FC<{ lienSite?: string }> = ({ lienSite }) => {
  const { user } = useAuth()
  const [ouvert, setOuvert] = useState(false)
  const conteneur = useRef<HTMLDivElement>(null)
  const bouton = useRef<HTMLButtonElement>(null)

  const fermer = useCallback((rendreLeFocus = false) => {
    setOuvert(false)
    if (rendreLeFocus) bouton.current?.focus()
  }, [])

  useEffect(() => {
    if (!ouvert) return

    const surClic = (e: MouseEvent) => {
      if (!conteneur.current?.contains(e.target as Node)) fermer()
    }
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer(true)
    }

    document.addEventListener('mousedown', surClic)
    document.addEventListener('keydown', surTouche)
    return () => {
      document.removeEventListener('mousedown', surClic)
      document.removeEventListener('keydown', surTouche)
    }
  }, [ouvert, fermer])

  if (!user) return null

  const nom = (user as { name?: string }).name
  const courriel = (user as { email?: string }).email

  return (
    <div className="op-menu-compte" ref={conteneur}>
      {/*
        Le déclencheur n'est qu'un chevron. L'avatar, lui, est rendu par Payload
        juste à droite (composant AvatarUtilisateur) : dupliquer les initiales
        ici donnerait deux pastilles identiques côte à côte.
      */}
      <button
        aria-expanded={ouvert}
        aria-haspopup="menu"
        aria-label={`Menu du compte${nom ? ` de ${nom}` : ''}`}
        className="op-menu-compte__declencheur"
        onClick={() => setOuvert((o) => !o)}
        ref={bouton}
        type="button"
      >
        <span aria-hidden="true" className="op-menu-compte__chevron">
          <IconeChevron taille={15} />
        </span>
      </button>

      {ouvert && (
        <div className="op-menu-compte__panneau" role="menu">
          <div className="op-menu-compte__identite">
            <span aria-hidden="true" className="op-menu-compte__initiales">
              {initiales(nom, courriel)}
            </span>
            <span className="op-menu-compte__identite-texte">
              <span className="op-menu-compte__nom">{nom || 'Mon compte'}</span>
              {courriel && <span className="op-menu-compte__courriel">{courriel}</span>}
            </span>
          </div>

          <Link className="op-menu-compte__entree" href="/admin/account" role="menuitem">
            <IconeCompte taille={17} />
            Mon compte
          </Link>
          <Link className="op-menu-compte__entree" href="/admin/globals/service-images" role="menuitem">
            <IconeReglages taille={17} />
            Images des pages Services
          </Link>
          {lienSite && (
            <a
              className="op-menu-compte__entree"
              href={lienSite}
              rel="noreferrer"
              role="menuitem"
              target="_blank"
            >
              <IconeLienExterne taille={17} />
              Voir le site en ligne
            </a>
          )}

          <div className="op-menu-compte__separateur" />

          {/*
            Un LIEN, pas un bouton appelant `logOut()` : la page /admin/logout
            efface le cookie de session ET renvoie vers la page de connexion en
            une seule étape.
          */}
          <Link
            className="op-menu-compte__entree op-menu-compte__entree--sortie"
            href="/admin/logout"
            role="menuitem"
          >
            <IconeSortie taille={17} />
            Se déconnecter
          </Link>
        </div>
      )}
    </div>
  )
}

export default MenuCompte
