/*
  JEU D'ICONES DU BACK-OFFICE.

  POURQUOI UN FICHIER MAISON PLUTOT QU'UNE LIBRAIRIE (lucide-react, heroicons) ?
  Parce qu'une librairie d'icones, c'est une dependance de plus a installer, a
  mettre a jour et a charger dans le navigateur — pour une quinzaine de dessins.
  Ici, chaque icone est un simple <svg> inline : zero dependance, zero requete
  reseau, et le trait suit automatiquement la couleur du texte (`currentColor`).

  REGLES DE DESSIN (elles font l'homogeneite de l'ensemble) :
    - grille 24x24, trait de 1.7 px, extremites et angles arrondis ;
    - aucun aplat de couleur : uniquement du contour, comme les icones du site ;
    - `aria-hidden` partout : ce sont des ornements, jamais l'unique porteur
      d'une information. Le libelle texte reste toujours a cote (CDC §15.3).
*/

import React from 'react'

export type ProprietesIcone = {
  /** Cote du carre de dessin, en pixels. 18 dans la barre laterale, 20 ailleurs. */
  taille?: number
  className?: string
}

/* Attributs communs a toutes les icones — c'est eux qui garantissent que deux
   icones cote a cote ont exactement le meme poids de trait. */
const socle = (taille: number, className?: string) => ({
  className,
  width: taille,
  height: taille,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
})

/* ------------------------------------------------------- Contenus / metier */

/** Maison — les biens. */
export const IconeMaison: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
    <path d="M9.5 21v-6.5h5V21" />
  </svg>
)

/** Immeuble en construction — les projets. */
export const IconeChantier: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
    <path d="M16 9h2a2 2 0 0 1 2 2v10" />
    <path d="M3 21h18" />
    <path d="M8 7h4M8 11h4M8 15h4" />
  </svg>
)

/** Feuille ecrite — les articles de blog. */
export const IconeArticle: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </svg>
)

/** Feuille avec crayon — les brouillons, ce qui reste a finir. */
export const IconeBrouillon: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
    <path d="M13 3v5h5" />
    <path d="M20.5 13.5 15 19l-2.5.5.5-2.5 5.5-5.5a1.4 1.4 0 0 1 2 2Z" />
  </svg>
)

/** Boite de reception — les demandes entrantes. */
export const IconeDemandes: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M4.5 5.5h15l1.5 6.5v6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18v-6Z" />
    <path d="M3 12h5l2 3h4l2-3h5" />
  </svg>
)

/** Horloge — le temps qui passe, donc le retard. */
export const IconeRetard: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.2 2" />
  </svg>
)

/* ---------------------------------------------------------------- Actions */

/** Plus — creer. */
export const IconePlus: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

/** Crayon — modifier. */
export const IconeCrayon: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    <path d="M14.5 6.5l3 3" />
  </svg>
)

/** Oeil — consulter. */
export const IconeOeil: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

/** Corbeille — supprimer. */
export const IconeCorbeille: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M4 7h16" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
    <path d="M6.5 7l.8 12.1a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    <path d="M10.5 11v6M13.5 11v6" />
  </svg>
)

/** Curseurs de reglage — les parametres. */
export const IconeReglages: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M5 21v-7M5 10V3M12 21v-9M12 8V3M19 21v-5M19 12V3" />
    <path d="M2.5 14h5M9.5 8h5M16.5 16h5" />
  </svg>
)

/** Loupe — la recherche. */
export const IconeLoupe: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.9-3.9" />
  </svg>
)

/** Cloche — les notifications. */
export const IconeCloche: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9Z" />
    <path d="M13.7 19a2 2 0 0 1-3.4 0" />
  </svg>
)

/** Chevron vers le bas — ouvre un menu deroulant. */
export const IconeChevron: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

/** Fleche montante — une tendance a la hausse. */
export const IconeTendanceHausse: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M22 7 13.5 15.5l-4-4L2 19" />
    <path d="M16 7h6v6" />
  </svg>
)

/** Fleche descendante — une tendance a la baisse. */
export const IconeTendanceBaisse: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M22 17 13.5 8.5l-4 4L2 5" />
    <path d="M16 17h6v-6" />
  </svg>
)

/** Trait horizontal — pas de variation. */
export const IconeStable: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M5 12h14" />
  </svg>
)

/** Eclair — les raccourcis, les gestes rapides. */
export const IconeEclair: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
  </svg>
)

/** Fleche vers un lien externe — « voir le site ». */
export const IconeLienExterne: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19V7.5A1.5 1.5 0 0 1 5.5 6H10" />
  </svg>
)

/** Sortie — la deconnexion. */
export const IconeSortie: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <path d="M10 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H10" />
    <path d="M15.5 8.5 19 12l-3.5 3.5" />
    <path d="M19 12H9" />
  </svg>
)

/** Personne — la fiche compte. */
export const IconeCompte: React.FC<ProprietesIcone> = ({ taille = 20, className }) => (
  <svg {...socle(taille, className)}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20.5v-.8a5 5 0 0 1 5-5h5a5 5 0 0 1 5 5v.8" />
  </svg>
)
