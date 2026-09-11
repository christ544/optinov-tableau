import React from 'react'

/*
  Gabarit racine du groupe "(frontend)", c'est-à-dire de tout ce qui n'est ni
  /admin ni /api. Ce projet n'a pas de site public (le site vitrine vit dans
  son propre dépôt), la seule page de ce groupe redirige vers l'admin.
*/
export const metadata = {
  title: 'OPTINOV — Tableau de bord',
  description: "Tableau de bord du site vitrine de l'agence OPTINOV.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
