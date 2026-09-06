/*
  DONNÉES DE DÉMONSTRATION, pour le développement local uniquement.

  Remplit la base avec un jeu de contenus reconnaissables (préfixe « [Démo] »)
  afin de vérifier de bout en bout la chaîne tableau de bord -> API -> site :
  paramètres, deux témoignages, deux membres de l'équipe, huit questions de
  FAQ, une réalisation publiée et une non publiée, deux articles, et les trois
  illustrations d'une page Services.

  Lancement :  npm run seed
  Relançable : les contenus « [Démo] » précédents sont supprimés d'abord.

  À COMPRENDRE : ce script n'appelle pas l'API par le réseau, il utilise l'API
  LOCALE de Payload (`payload.create(...)`), qui parle directement à la base.
  Elle ignore les règles d'accès mais applique les hooks (slug automatique,
  reconstruction du site si SITE_DEPLOY_HOOK est défini, ce qui n'est pas le
  cas en local).

  GARDE-FOU : refuse de tourner sur une base Neon (production), sauf --force.
*/

import config from '@payload-config'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { getPayload } from 'payload'
import sharp from 'sharp'

const DEMO = '[Démo]'
const TEINTES = ['#0f1e3d', '#fc6303', '#3b4d70', '#c24d03', '#1c2f5a']

const paragraphe = (texte: string) => ({
  type: 'paragraph',
  version: 1,
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  textFormat: 0,
  children: [{ type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text: texte }],
})

const titre2 = (texte: string) => ({
  type: 'heading',
  tag: 'h2',
  version: 1,
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  children: [{ type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text: texte }],
})

const corps = (...blocs: Array<ReturnType<typeof paragraphe> | ReturnType<typeof titre2>>) => ({
  root: { type: 'root', version: 1, direction: 'ltr' as const, format: '' as const, indent: 0, children: blocs },
})

async function main() {
  const uri = process.env.DATABASE_URI || ''
  if ((uri.includes('neon.tech') || process.env.NODE_ENV === 'production') && !process.argv.includes('--force')) {
    console.error('Refus : cette base ressemble à la production. Ajoutez --force si vous savez ce que vous faites.')
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const log = (m: string) => payload.logger.info(m)

  // ------------------------------------------------ Nettoyage des démos passées
  for (const collection of ['blog', 'realisations', 'temoignages', 'equipe', 'faq', 'demandes'] as const) {
    const champ =
      collection === 'temoignages' || collection === 'equipe' || collection === 'demandes'
        ? 'nom'
        : collection === 'faq'
          ? 'question'
          : 'titre'
    const { docs } = await payload.delete({ collection, where: { [champ]: { contains: DEMO } } })
    if (docs.length) log(`${collection} : ${docs.length} contenu(s) de démo supprimé(s)`)
  }
  const anciensMedias = await payload.delete({ collection: 'media', where: { alt: { contains: DEMO } } })
  if (anciensMedias.docs.length) log(`media : ${anciensMedias.docs.length} image(s) de démo supprimée(s)`)

  // ---------------------------------------------------------------- Images
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'optinov-demo-'))
  const images: number[] = []
  for (let i = 0; i < TEINTES.length; i++) {
    const fichier = path.join(dossier, `demo-${i + 1}.jpg`)
    await sharp({ create: { width: 1600, height: 1000, channels: 3, background: TEINTES[i] } })
      .jpeg()
      .toFile(fichier)
    const media = await payload.create({
      collection: 'media',
      data: { alt: `${DEMO} Illustration ${i + 1}` },
      filePath: fichier,
    })
    images.push(media.id as number)
  }
  log(`${images.length} images créées`)

  // ------------------------------------------------------------ Paramètres
  await payload.updateGlobal({
    slug: 'parametres',
    data: {
      horaires: 'Lundi–vendredi, 8 h–18 h',
      rdvUrl: 'https://cal.com/optinov/decouverte',
      reseaux: { linkedin: 'https://www.linkedin.com/company/optinov', instagram: '', facebook: '' },
      rccm: 'CI-ABJ-2020-B-12345',
      directeurPublication: 'Direction OPTINOV',
      hebergeur: 'Cloudflare, Inc.',
    },
  })
  log('paramètres du site renseignés')

  // ------------------------------------------------------ Images des services
  await payload.updateGlobal({
    slug: 'service-images',
    data: { 'communication-visuelle': { img1: images[0], img2: images[1], img3: images[2] } },
  })
  log('illustrations de la page Communication visuelle renseignées')

  // ------------------------------------------------------------ Témoignages
  await payload.create({
    collection: 'temoignages',
    data: {
      nom: `${DEMO} Aïcha Koné`,
      fonction: 'Directrice générale',
      entreprise: 'Koné Distribution',
      verbatim: 'En trois mois, notre image a changé de dimension et nos demandes entrantes ont doublé.',
      consentement: true,
      ordre: 1,
    },
  })
  await payload.create({
    collection: 'temoignages',
    data: {
      nom: `${DEMO} Jean-Marc Diallo`,
      fonction: 'Responsable marketing',
      entreprise: 'Clinique des Lagunes',
      verbatim: 'Une équipe qui écoute, qui tient ses délais et qui montre ses résultats tels quels.',
      consentement: true,
      ordre: 2,
    },
  })
  log('2 témoignages créés')

  // ----------------------------------------------------------------- Équipe
  await payload.create({
    collection: 'equipe',
    data: { nom: `${DEMO} Alfred N’zue`, role: 'Directeur de création', photo: images[3], ordre: 1 },
  })
  await payload.create({
    collection: 'equipe',
    data: { nom: `${DEMO} Mariam Touré`, role: 'Cheffe de projet digital', photo: images[4], ordre: 2 },
  })
  log('2 membres de l’équipe créés')

  // -------------------------------------------------------------------- FAQ
  const faq: Array<['agence' | 'tarifs' | 'pros-cards' | 'support', string, string]> = [
    ['agence', 'Quels types de clients accompagnez-vous ?', 'Des PME, grandes entreprises, institutions et indépendants qui attendent des résultats mesurables.'],
    ['agence', 'Travaillez-vous en dehors d’Abidjan ?', 'Oui, sur tout le territoire ivoirien et en Afrique francophone, à distance sans perte de qualité.'],
    ['tarifs', 'Comment sont établis vos tarifs ?', 'Au forfait pour les missions à périmètre défini, en abonnement mensuel pour l’accompagnement récurrent.'],
    ['tarifs', 'Demandez-vous un acompte ?', 'Les conditions de règlement sont précisées dans chaque devis, avant tout engagement.'],
    ['pros-cards', 'Qu’est-ce que PROS.CARDS ?', 'Une plateforme de cartes de visite digitales en libre-service, développée et exploitée par OPTINOV.'],
    ['pros-cards', 'Faut-il installer une application ?', 'Non : tout se passe dans le navigateur, pour vous comme pour vos contacts.'],
    ['support', 'Qui sera mon interlocuteur ?', 'Un chef de projet unique, qui connaît votre dossier et reste joignable pendant toute la mission.'],
    ['support', 'Que se passe-t-il après la livraison ?', 'Un point de suivi à trente jours, et un support par e-mail et WhatsApp aux horaires de l’agence.'],
  ]
  let ordre = 0
  for (const [theme, question, reponse] of faq) {
    await payload.create({ collection: 'faq', data: { theme, question: `${DEMO} ${question}`, reponse, ordre: ++ordre } })
  }
  log(`${faq.length} questions de FAQ créées`)

  // ----------------------------------------------------------- Réalisations
  await payload.create({
    collection: 'realisations',
    data: {
      titre: `${DEMO} Refonte d’identité et site vitrine pour Koné Distribution`,
      client: 'Koné Distribution',
      annee: '2026',
      services: ['visuel', 'digital'],
      secteur: 'distribution',
      extrait: 'Une identité clarifiée, un site qui convertit, et des équipes commerciales enfin équipées.',
      visuel: images[0],
      galerie: [images[1], images[2]],
      contexte: 'Un distributeur en forte croissance, une image datée et un site qui ne générait aucune demande.',
      objectifs: [{ texte: 'Moderniser l’identité visuelle' }, { texte: 'Doubler les demandes entrantes' }, { texte: 'Équiper 12 commerciaux' }],
      reponse: 'Plateforme de marque, nouvelle identité, site vitrine orienté conversion et déploiement de PROS.CARDS.',
      resultats: [{ valeur: '+112 %', label: 'de demandes entrantes' }, { valeur: '12', label: 'commerciaux équipés' }, { valeur: '6 sem.', label: 'de la commande à la mise en ligne' }],
      temoignage: { verbatim: 'Nos demandes entrantes ont doublé.', nom: 'Aïcha Koné', fonction: 'Directrice générale' },
      avantApres: { activer: true, avant: images[3], apres: images[4] },
      etudeDeCas: true,
      publiee: true,
      ordre: 1,
    },
  })
  await payload.create({
    collection: 'realisations',
    data: {
      titre: `${DEMO} Fiche en cours de rédaction (non publiée)`,
      client: 'Client confidentiel',
      annee: '2026',
      services: ['photo-video'],
      secteur: 'sante',
      extrait: 'Cette fiche ne doit pas apparaître sur le site.',
      contexte: 'En cours.',
      objectifs: [{ texte: 'En cours.' }],
      reponse: 'En cours.',
      publiee: false,
    },
  })
  log('2 réalisations créées (1 publiée, 1 non publiée)')

  // --------------------------------------------------------------- Articles
  await payload.create({
    collection: 'blog',
    data: {
      titre: `${DEMO} Comment créer une identité de marque qui tient dix ans`,
      categorie: 'branding',
      date: '2026-09-01',
      image: images[0],
      extrait: 'Un logo n’est pas une identité. Ce que recouvre une plateforme de marque, et pourquoi la sauter coûte cher.',
      tempsLecture: 8,
      aLaUne: true,
      serviceLie: 'communication-visuelle',
      body: corps(
        paragraphe('Une identité de marque ne se résume pas à un logo : c’est un système de signes, de mots et de comportements.'),
        titre2('Commencer par la plateforme de marque'),
        paragraphe('Mission, promesse, ton, preuves : quatre décisions à prendre avant la première esquisse.'),
      ),
    },
  })
  await payload.create({
    collection: 'blog',
    data: {
      titre: `${DEMO} Automatisation IA en entreprise : par où commencer`,
      categorie: 'ia',
      date: '2026-08-20',
      image: images[2],
      extrait: 'Cartographier avant d’automatiser. Trois cas d’usage à gain rapide.',
      tempsLecture: 10,
      body: corps(paragraphe('Avant d’automatiser, cartographiez les tâches répétitives et mesurez leur coût réel.')),
    },
  })
  log('2 articles créés')

  // --------------------------------------------------------------- Demandes
  await payload.create({
    collection: 'demandes',
    data: {
      typeFormulaire: 'devis-service',
      nom: `${DEMO} Yao Kouamé`,
      telephone: '+225 07 11 22 33 44',
      email: 'yao@exemple.ci',
      service: 'communication-visuelle',
      budget: '500 000 – 2 000 000 FCFA',
      message: 'Nous voulons refaire notre logo et nos supports avant le salon de novembre.',
      pageSource: '/services/communication-visuelle',
      consentement: true,
      statutTraitement: 'nouveau',
    },
  })
  await payload.create({
    collection: 'demandes',
    data: {
      typeFormulaire: 'rappel',
      nom: `${DEMO} Fatou Bamba`,
      telephone: '+225 05 66 77 88 99',
      creneau: 'Matin (8h–12h)',
      pageSource: '/solutions/pros-cards',
      consentement: true,
      statutTraitement: 'nouveau',
    },
  })
  log('2 demandes créées')

  log('Démonstration prête. Lancez la synchronisation du site : DASHBOARD_URL=http://localhost:3000 node scripts/sync-content.mjs')
  process.exit(0)
}

/*
  `await` de premier niveau, et non `main().catch(...)` : `payload run` charge
  ce fichier par un import et quitte dès que l'import est résolu. Sans
  l'attente, le processus se terminait avant la première écriture en base.
*/
try {
  await main()
} catch (e) {
  console.error(e)
  process.exit(1)
}
