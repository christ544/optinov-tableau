import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/*
  DONNEES INITIALES (etape 5, septembre 2026) : les vingt questions de la FAQ
  et les coordonnees du site, telles qu elles etaient ecrites en dur dans le
  code du site vitrine. Le site lit desormais ces contenus dans le tableau de
  bord : sans cette migration, la FAQ et les coordonnees disparaitraient du
  site a la premiere reconstruction.

  Migration de DONNEES, ecrite a la main : elle passe par l API locale de
  Payload plutot que par du SQL, pour que les dates, les slugs et les
  validations soient les memes que pour une saisie dans l admin.
  Relancable sans doublon : une question deja presente n est pas recreee.
*/

const QUESTIONS = [
  { theme: "agence", ordre: 1, question: "Quels types de clients accompagnez-vous ?", reponse: "Des PME, grandes entreprises, institutions, administrations, entrepreneurs, indépendants et associations. Notre point commun n'est pas la taille mais l'exigence : nous travaillons avec des dirigeants qui attendent des résultats mesurables." },
  { theme: "agence", ordre: 2, question: "Travaillez-vous en dehors d'Abidjan ?", reponse: "Oui. Nous sommes basés à Abidjan et intervenons sur l'ensemble du territoire ivoirien et en Afrique francophone. Les missions de conseil et de production digitale se conduisent à distance sans perte de qualité." },
  { theme: "agence", ordre: 3, question: "Comment se déroule un premier échange ?", reponse: "Un rendez-vous de trente minutes, sans engagement, pour comprendre votre contexte et vos objectifs. Si nous ne sommes pas le bon partenaire, nous vous le disons à ce moment-là." },
  { theme: "agence", ordre: 4, question: "Qui sera mon interlocuteur ?", reponse: "Un chef de projet unique, qui connaît votre dossier et reste joignable pendant toute la mission. Vous ne racontez jamais deux fois la même chose." },
  { theme: "agence", ordre: 5, question: "Signez-vous des accords de confidentialité ?", reponse: "Systématiquement, dès que vous le demandez, et avant tout partage d'information sensible." },
  { theme: "tarifs", ordre: 6, question: "Comment sont établis vos tarifs ?", reponse: "Au forfait pour les missions à périmètre défini, en abonnement mensuel pour l'accompagnement récurrent. Chaque devis détaille les livrables et le nombre d'allers-retours inclus." },
  { theme: "tarifs", ordre: 7, question: "Demandez-vous un acompte ?", reponse: "Les conditions de règlement sont précisées dans chaque devis, avant tout engagement." },
  { theme: "tarifs", ordre: 8, question: "Quels sont vos délais moyens ?", reponse: "Ils dépendent du périmètre et, surtout, de la réactivité des validations côté client. Le calendrier est contractualisé au brief." },
  { theme: "tarifs", ordre: 9, question: "Que se passe-t-il si le périmètre évolue en cours de mission ?", reponse: "Toute évolution fait l'objet d'un avenant chiffré et validé par écrit avant d'être engagée. Rien n'est produit hors devis." },
  { theme: "tarifs", ordre: 10, question: "Combien d'allers-retours sont inclus ?", reponse: "Deux allers-retours par livrable, précisés au devis. Au-delà, les ajustements sont facturés au temps passé — c'est ce qui nous permet de tenir les délais." },
  { theme: "pros-cards", ordre: 11, question: "Qu'est-ce que PROS.CARDS ?", reponse: "Une plateforme de cartes de visite digitales et interactives en libre-service, développée, exploitée et supportée par OPTINOV. Vous choisissez votre offre, créez votre compte, payez en ligne, et votre compte est activé automatiquement." },
  { theme: "pros-cards", ordre: 12, question: "OPTINOV crée-t-elle ma carte à ma place ?", reponse: "Non. PROS.CARDS est une plateforme en libre-service : vous créez, personnalisez et modifiez votre carte en toute autonomie depuis votre tableau de bord. OPTINOV administre la plateforme, pas votre contenu." },
  { theme: "pros-cards", ordre: 13, question: "Faut-il installer une application ?", reponse: "Ni pour vous, ni pour la personne à qui vous partagez votre carte. Tout se passe dans le navigateur." },
  { theme: "pros-cards", ordre: 14, question: "Comment équiper une équipe commerciale ?", reponse: "Via l'offre Entreprise. Le responsable devient administrateur de son espace, crée les comptes de ses collaborateurs et peut créer, modifier, suspendre ou supprimer leurs cartes." },
  { theme: "pros-cards", ordre: 15, question: "Où trouver les tarifs ?", reponse: "Sur la page dédiée PROS.CARDS, section Tarifs. Trois offres : Essentiel, Professionnel et Entreprise." },
  { theme: "support", ordre: 16, question: "Sous quel délai répondez-vous à une demande ?", reponse: "Sous 24 h ouvrées. Nos horaires d'ouverture figurent sur la page Contact." },
  { theme: "support", ordre: 17, question: "Assurez-vous la maintenance après livraison ?", reponse: "Oui, sur contrat de maintenance : mises à jour, sauvegardes, supervision et corrections. Le détail figure au devis." },
  { theme: "support", ordre: 18, question: "Formez-vous nos équipes ?", reponse: "Chaque livraison inclut une passation. Des sessions de formation complémentaires peuvent être ajoutées au périmètre." },
  { theme: "support", ordre: 19, question: "À qui appartiennent les fichiers et le code produits ?", reponse: "À vous. Fichiers sources, dépôts Git et droits d'exploitation sont cédés à la livraison." },
  { theme: "support", ordre: 20, question: "Comment contacter le support PROS.CARDS ?", reponse: "Le support de la plateforme est assuré par OPTINOV depuis Abidjan. Les canaux de contact figurent dans votre tableau de bord et sur la page Contact." },
] as const

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  for (const q of QUESTIONS) {
    const existe = await payload.count({ collection: 'faq', where: { question: { equals: q.question } } })
    if (existe.totalDocs === 0) {
      await payload.create({ collection: 'faq', data: { ...q } })
    }
  }

  /*
    Le global « Parametres » n existe en base qu apres un premier
    enregistrement. On le cree ici avec ses valeurs par defaut (celles du
    site), pour que l API le renvoie rempli des le premier build du site.
  */
  const parametres = await payload.findGlobal({ slug: 'parametres', depth: 0 })
  if (!parametres?.updatedAt) {
    await payload.updateGlobal({
      slug: 'parametres',
      data: {
        nom: 'OPTINOV',
        baseline: 'Communication · Marketing · Transformation digitale',
        telephone: '+225 01 73 73 24 21',
        telephoneFixe: '+225 27 22 25 22 74',
        whatsapp: '2250173732421',
        email: 'optinovagence@gmail.com',
        adresse: 'Cocody Angré 7ᵉ Tranche, Abidjan — Côte d’Ivoire',
        ville: 'Abidjan',
        pays: 'Côte d’Ivoire',
        delaiReponse: 'sous 24 h ouvrées',
      },
    })
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  for (const q of QUESTIONS) {
    await payload.delete({ collection: 'faq', where: { question: { equals: q.question } } })
  }
}
