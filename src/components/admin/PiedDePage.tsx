/*
  PIED DE PAGE DU TABLEAU DE BORD.

  OÙ EST-IL BRANCHÉ, ET POURQUOI LÀ ?
  Payload n'expose pas d'emplacement « footer ». Il expose en revanche
  `admin.components.providers` : une liste de composants qui enveloppent toute
  l'application. Un composant qui rend `{children}` PUIS un <footer> ajoute donc
  un pied de page global, sur l'accueil, les listes, les fiches et jusqu'à la
  page de connexion, sans toucher aux gabarits de Payload.

  CE QU'IL DOIT ÊTRE : discret. Une ligne de séparation fine, du texte en
  petit, des liens sobres, et rien de plus.

  Les deux liens légaux pointent vers les pages RÉELLES du site vitrine
  (/mentions-legales et /politique-de-confidentialite existent bien). L'adresse
  du site vient de FRONTEND_URL ; à défaut, l'adresse actuelle du site.
*/

import React from 'react'

const SITE = process.env.FRONTEND_URL || 'https://optinov-agence.christkangah14.workers.dev'

const LIENS: Array<[string, string]> = [
  ['Mentions légales', `${SITE}/mentions-legales`],
  ['Politique de confidentialité', `${SITE}/politique-de-confidentialite`],
  ['Voir le site', SITE],
]

export const PiedDePage = ({ children }: { children?: React.ReactNode }) => (
  <>
    {children}
    <footer className="op-pied">
      <div className="op-pied__contenu">
        <span className="op-pied__marque">
          OPTINOV — Tableau de bord
          <span className="op-pied__sep" aria-hidden="true">
            ·
          </span>
          <span className="op-pied__annee">© {new Date().getFullYear()}</span>
        </span>

        <nav aria-label="Liens légaux" className="op-pied__liens">
          {LIENS.map(([libelle, href]) => (
            <a href={href} key={href} rel="noreferrer" target="_blank">
              {libelle}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  </>
)

export default PiedDePage
