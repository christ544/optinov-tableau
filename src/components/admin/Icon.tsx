/*
  Petite icône de marque, affichée dans le fil d'Ariane de l'en-tête et en haut
  de la barre latérale du tableau de bord.

  POURQUOI LA PASTILLE, ET NON LE LOGO HORIZONTAL.
  Cet emplacement attend une marque COMPACTE. Le logo complet fait quatre fois
  plus large que haut : demandé à 34 px de haut, il réclamerait 136 px de large
  dans un fil d'Ariane qui n'en accorde pas le quart, et se retrouverait écrasé.
  On rend donc la pastille orange du groupe OPTINOV (le point du « i » du logo) :
  carrée, elle traverse sans dommage un emplacement étroit, et son orange
  ressort aussi bien sur le fond clair de l'en-tête que sur le bleu marine de
  la barre latérale. Le logo complet garde sa place sur la page de connexion
  (Logo.tsx), où il dispose de toute la largeur.

  `flexShrink: 0` verrouille le tout : sans lui, le prochain élément ajouté à
  cette barre reproduirait la même compression, en silence.
*/

import React from 'react'

export const Icon: React.FC = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/favicon.png"
    alt="OPTINOV"
    style={{ height: 24, width: 24, display: 'block', flexShrink: 0, objectFit: 'contain' }}
  />
)

export default Icon
