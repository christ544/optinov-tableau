/*
  COLLECTION « Médias » : la bibliothèque d'images du site.

  À COMPRENDRE : la clé `upload` transforme une collection ordinaire en
  bibliothèque de fichiers. Payload se charge de recevoir le fichier, de le
  stocker (disque en local, Cloudinary en production, voir payload.config.ts)
  et, grâce à `imageSizes`, de générer plusieurs tailles avec sharp.

  POURQUOI PLUSIEURS TAILLES ? Envoyer une photo de 4000 px à un téléphone en
  4G, c'est plusieurs secondes de chargement pour rien. Le site choisit la
  taille adaptée à l'écran, et le tableau de bord affiche la vignette.
*/

import type { CollectionConfig } from 'payload'

import { estConnecte, lecturePublique } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',

  labels: {
    singular: 'Média',
    plural: 'Médias (images)',
  },

  admin: {
    group: 'Bibliothèque',
    hideAPIURL: true,
    description: 'Toutes les images téléversées (couvertures, illustrations…).',
  },

  access: {
    // Les images doivent être lisibles par les visiteurs du site : lecture publique.
    read: lecturePublique,
    // Mais seuls les membres connectés du tableau de bord peuvent en déposer ou en retirer.
    create: estConnecte,
    update: estConnecte,
    delete: estConnecte,
  },

  upload: {
    /*
      LISTE BLANCHE des types de fichiers : uniquement des images. Un compte
      compromis ne pourra pas déposer un script exécutable.

      LES SVG SONT EXCLUS DÉLIBÉRÉMENT : un SVG est un document XML qui peut
      contenir du <script>, un vecteur d'attaque classique. Aucun besoin
      métier ici (photos, illustrations), donc autant l'exclure.
    */
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],

    /*
      LA LIMITE DE TAILLE se règle ailleurs : Payload la lit dans le champ
      `upload` global de buildConfig (voir payload.config.ts), pas ici.
    */

    /*
      Une photo JPEG de 3 Mo ressort typiquement autour de 300 Ko en WebP,
      sans différence visible à l'œil. Payload le fait à l'upload, une fois
      pour toutes.
    */
    formatOptions: {
      format: 'webp',
      options: { quality: 80 },
    },

    /*
      Largeur seule : les proportions de l'original sont conservées (les
      couvertures d'articles et les illustrations de services n'ont pas toutes
      le même format).
        - vignette : listes et accueil du tableau de bord ;
        - carte    : cartes d'articles sur le site ;
        - grande   : en-tête d'article et blocs des pages Services.
    */
    imageSizes: [
      { name: 'vignette', width: 400 },
      { name: 'carte', width: 800 },
      { name: 'grande', width: 1600 },
    ],

    // Recadrage et point d'attention : sharp est disponible, on les réactive.
    crop: true,
    focalPoint: true,
  },

  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texte alternatif (description de l’image)',
      /*
        OBLIGATOIRE, et ce n'est pas une coquetterie :
        - accessibilité : c'est ce que lit un lecteur d'écran ;
        - référencement : c'est ce que lit Google, qui ne « voit » pas les images.
      */
      required: true,
      admin: {
        description: 'Décrivez l’image en une phrase (ex. « Séance photo corporate dans nos locaux »).',
      },
    },
  ],
}
