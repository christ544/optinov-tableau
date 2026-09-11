/*
  CONTRÔLE D'ACCÈS : qui a le droit de faire quoi.

  À COMPRENDRE : dans Payload, une fonction d'accès reçoit la requête (donc
  l'utilisateur connecté) et renvoie :
    - `true`  -> autorisé sur tous les documents ;
    - `false` -> interdit ;
    - un objet « Where » (ex. { id: { equals: user.id } })
      -> autorisé UNIQUEMENT sur les documents qui correspondent à ce filtre.

  DEUX RÔLES SUFFISENT à l'agence :
    - administrateur : tout, y compris créer et supprimer des comptes ;
    - éditeur : tout le contenu (articles, images, illustrations des pages
      Services), mais pas les comptes.
  Pour en ajouter un troisième un jour (rédacteur limité au blog, par
  exemple), il suffit d'étendre le type `Role`, la liste `options` du champ
  rôle dans Users.ts, et d'écrire ici la fonction d'accès correspondante.
*/

import type { Access } from 'payload'

export type Role = 'administrateur' | 'editeur'

/*
  On type l'utilisateur de façon « souple » (rôle optionnel) pour que ce
  fichier compile même avant la première génération des types Payload.
*/
type Utilisateur = { role?: Role | null } | null | undefined

/** Vrai si l'utilisateur connecté possède l'un des rôles demandés. */
export const aLeRole = (user: Utilisateur, ...roles: Role[]): boolean =>
  Boolean(user?.role && roles.includes(user.role))

/** Réservé aux administrateurs. */
export const estAdministrateur: Access = ({ req: { user } }) => aLeRole(user, 'administrateur')

/** Toute personne connectée au tableau de bord, quel que soit son rôle. */
export const estConnecte: Access = ({ req: { user } }) => Boolean(user)

/*
  Lecture publique : tout le monde lit. C'est le cas de tout ce que le site
  vitrine doit afficher (articles, images, illustrations des pages Services).
*/
export const lecturePublique: Access = () => true
