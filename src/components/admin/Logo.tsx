/*
  Logo affiché sur la page de connexion du tableau de bord.
  Payload prévoit deux emplacements de marque :
    - « Logo » : le grand logo de la page de connexion (ce fichier) ;
    - « Icon » : la petite icône du bandeau (Icon.tsx).

  Le fichier logo-optinov.png est celui du site vitrine de l'agence, recopié
  dans public/. La taille est fluide (`clamp`) : elle s'adapte de l'écran de
  téléphone au grand écran sans jamais déborder.
*/

import React from 'react'

export const Logo: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      padding: '0.5rem 0 1.5rem',
    }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/logo-optinov.png"
      alt="OPTINOV"
      style={{
        // min 56 px sur mobile, idéal 9 % de la largeur d'écran, max 80 px.
        height: 'clamp(56px, 9vw, 80px)',
        width: 'auto',
        maxWidth: '100%',
      }}
    />
    <span
      style={{
        fontSize: '0.72rem',
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: '#5b616e',
        textAlign: 'center',
      }}
    >
      Communication • Marketing • Digital • IA
    </span>
  </div>
)

export default Logo
