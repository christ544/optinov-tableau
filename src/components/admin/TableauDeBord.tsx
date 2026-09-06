/*
  ÉCRAN D'ACCUEIL DU TABLEAU DE BORD.

  Ce composant REMPLACE entièrement le tableau de bord par défaut de Payload
  (qui affichait une grille de cartes dupliquant la barre latérale). Il est
  branché via `admin.components.views.dashboard` dans payload.config.ts.

  À COMPRENDRE : c'est un COMPOSANT SERVEUR React. Il s'exécute sur le serveur,
  interroge directement la base via l'API locale de Payload (`payload.count`),
  et n'envoie au navigateur que du HTML déjà calculé.

  DEUX MOITIÉS. `chargerTableau` fait tous les comptages et lit l'heure ; le
  composant `TableauDeBord` ne fait que rendre ce qu'on lui donne. React exige
  qu'un composant soit « pur » (même entrée, même sortie) : lire l'horloge ou
  la base dedans est interdit par ses règles de lint, d'où la séparation.

  En tant que VUE, Payload ne passe pas `payload`/`user` directement : il les
  fournit dans `initPageResult.req`. On lit donc les deux emplacements possibles.

  OÙ SONT LES STYLES ? Dans src/app/(payload)/custom.scss, sous le préfixe
  `op-`, section « 5. TABLEAU DE BORD ».

  AUCUN CHIFFRE N'EST INVENTÉ ICI : tout vient de comptages réels sur la base.
*/

import Link from 'next/link'
import React from 'react'

import { CATEGORIES_BLOG } from '../../collections/Blog'
import { EMPLACEMENTS, SERVICES } from '../../globals/ServiceImages'
import { tempsRelatif, tendance } from '../../lib/format'
import {
  IconeArticle,
  IconeBrouillon,
  IconeCrayon,
  IconeEclair,
  IconePlus,
  IconeReglages,
  IconeRetard,
  IconeStable,
  IconeTendanceBaisse,
  IconeTendanceHausse,
} from './Icones'

const SITE = process.env.FRONTEND_URL || 'https://optinov-agence.christkangah14.workers.dev'

const JOUR = 24 * 60 * 60 * 1000

/* Nombre total d'emplacements d'illustration sur les pages Services. */
const EMPLACEMENTS_TOTAL = SERVICES.length * EMPLACEMENTS.length

/* ------------------------------------------------------------------ Tuiles */

type Pied =
  | { max: number; type: 'barre'; valeur: number; legende: string }
  | { type: 'tendance'; actuel: number; precedent: number; periode: string }
  | { type: 'aucun' }

type ProprietesTuile = {
  alerte?: boolean
  href: string
  icone: React.ReactNode
  label: string
  pied: Pied
  valeur: number
}

/*
  UNE TUILE DE CHIFFRE.

  Le ton « alerte » (orange) est réservé à UNE seule tuile : les illustrations
  manquantes sur les pages Services, parce qu'un bloc sans image s'affiche
  vide sur le site. Si trois tuiles crient en même temps, plus aucune ne se
  distingue.
*/
const Tuile: React.FC<ProprietesTuile> = ({ alerte, href, icone, label, pied, valeur }) => (
  <Link
    className={`op-tuile${alerte && valeur > 0 ? ' op-tuile--alerte' : ''}`}
    href={href}
  >
    <span className="op-tuile__pastille" aria-hidden="true">
      {icone}
    </span>

    <span className="op-tuile__valeur">{valeur}</span>
    <span className="op-tuile__label">{label}</span>

    <PiedDeTuile pied={pied} />
  </Link>
)

/*
  Le bas de tuile dit « et alors ? ». Un chiffre brut ne se commente pas tout
  seul : la barre montre une part, la tendance compare à la période précédente.
*/
const PiedDeTuile: React.FC<{ pied: Pied }> = ({ pied }) => {
  if (pied.type === 'aucun') return null

  if (pied.type === 'barre') {
    const part = pied.max > 0 ? Math.round((pied.valeur / pied.max) * 100) : 0
    return (
      <span className="op-tuile__pied">
        <span className="op-jauge" role="presentation">
          <span className="op-jauge__remplissage" style={{ width: `${part}%` }} />
        </span>
        <span className="op-tuile__legende">
          {part} % {pied.legende}
        </span>
      </span>
    )
  }

  const t = tendance(pied.actuel, pied.precedent)

  /* Rien sur les deux périodes : afficher « 0 % » serait du bruit. */
  if (t.ecart === 0 && pied.actuel === 0) {
    return (
      <span className="op-tuile__pied">
        <span className="op-tuile__legende">Aucun mouvement {pied.periode}</span>
      </span>
    )
  }

  const Fleche =
    t.sens === 'hausse' ? IconeTendanceHausse : t.sens === 'baisse' ? IconeTendanceBaisse : IconeStable

  const signe = t.ecart > 0 ? '+' : ''
  const mesure = t.pourcentage !== null ? `${signe}${t.pourcentage} %` : `${signe}${t.ecart}`

  return (
    <span className="op-tuile__pied">
      <span className={`op-tendance op-tendance--${t.sens}`}>
        <Fleche taille={14} />
        {mesure}
      </span>
      <span className="op-tuile__legende">{pied.periode}</span>
    </span>
  )
}

/* --------------------------------------------------------------- Pastilles */

/*
  Pastille « À la une » : l'orange de la marque, posé en fond clair.
  Le petit point en tête rend la pastille lisible même pour un œil qui
  distingue mal les couleurs : la forme renseigne autant que la teinte.
*/
const PastilleUne: React.FC = () => (
  <span className="op-pastille" style={{ background: '#ffe7d3', color: '#c24d03' }}>
    <span aria-hidden="true" className="op-pastille__point" />À la une
  </span>
)

const libelleCategorie = (valeur?: null | string): string =>
  CATEGORIES_BLOG.find((c) => c.value === valeur)?.label ?? ''

const dateCourte = (valeur?: null | string): string => {
  if (!valeur) return ''
  const d = new Date(valeur)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}

/* ---------------------------------------------------------------- Données */

type ArticleResume = {
  aLaUne?: boolean | null
  categorie?: null | string
  date?: null | string
  id: number | string
  image?: null | number | string | { sizes?: Record<string, { url?: string }>; url?: string }
  tempsLecture?: null | number
  titre: string
  updatedAt?: null | string
}

type Tache = { href: string; libelle: string; reste: number }

/*
  Tous les comptages du tableau de bord, en une fois. C'est ICI, et pas dans le
  composant, qu'on lit l'horloge et la base (voir l'en-tête du fichier).
*/
async function chargerTableau(payload: any, user: any) {
  const maintenant = Date.now()
  const ilYA30j = new Date(maintenant - 30 * JOUR).toISOString()
  const ilYA60j = new Date(maintenant - 60 * JOUR).toISOString()

  const compter = async (collection: string, where: any): Promise<number> => {
    try {
      return (await payload.count({ collection, where })).totalDocs
    } catch {
      return 0
    }
  }

  /* Fenêtre glissante : les 30 derniers jours, puis les 30 qui précèdent. */
  const surLes30DerniersJours = { createdAt: { greater_than: ilYA30j } }
  const surLes30JoursPrecedents = {
    and: [{ createdAt: { greater_than: ilYA60j } }, { createdAt: { less_than: ilYA30j } }],
  }

  const [
    articles,
    articlesALaUne,
    articlesSansImage,
    articlesSansExtrait,
    articles30j,
    articles30jPrec,
    medias,
    medias30j,
    medias30jPrec,
  ] = await Promise.all([
    compter('blog', {}),
    compter('blog', { aLaUne: { equals: true } }),
    compter('blog', { image: { exists: false } }),
    compter('blog', { or: [{ extrait: { exists: false } }, { extrait: { equals: '' } }] }),
    compter('blog', surLes30DerniersJours),
    compter('blog', surLes30JoursPrecedents),
    compter('media', {}),
    compter('media', surLes30DerniersJours),
    compter('media', surLes30JoursPrecedents),
  ])

  /*
    Les illustrations des pages Services : pour chaque service, combien des
    trois emplacements sont remplis. Un emplacement vide = un bloc du site
    sans image.
  */
  let imagesServices: Record<string, unknown> = {}
  try {
    imagesServices = await payload.findGlobal({ slug: 'service-images', depth: 0 })
  } catch {
    imagesServices = {}
  }
  const etatServices = SERVICES.map((service) => {
    const groupe = (imagesServices?.[service.slug] ?? {}) as Record<string, unknown>
    const remplis = EMPLACEMENTS.filter((e) => groupe[e] !== null && groupe[e] !== undefined).length
    return { nom: service.nom, remplis, slug: service.slug }
  })
  const emplacementsRemplis = etatServices.reduce((somme, s) => somme + s.remplis, 0)
  const emplacementsManquants = EMPLACEMENTS_TOTAL - emplacementsRemplis
  const servicesIncomplets = etatServices.filter((s) => s.remplis < EMPLACEMENTS.length).length

  /* Les derniers articles, image de couverture incluse (depth 1). */
  let derniersArticles: ArticleResume[] = []
  try {
    const resultat = await payload.find({ collection: 'blog', depth: 1, limit: 5, sort: '-updatedAt' })
    derniersArticles = resultat.docs as ArticleResume[]
  } catch {
    derniersArticles = []
  }

  const prenom = (user as { name?: string } | undefined)?.name?.split(' ')[0] ?? ''

  const dateDuJour = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(new Date(maintenant))

  /*
    LES TÂCHES DU JOUR ne sont pas une liste écrite à la main : chacune est
    déduite d'un comptage réel, et se coche toute seule quand le compteur tombe
    à zéro.
  */
  const taches: Tache[] = [
    {
      href: '/admin/globals/service-images',
      libelle: 'Compléter les illustrations des pages Services',
      reste: servicesIncomplets,
    },
    {
      href: '/admin/collections/blog?where[image][exists]=false',
      libelle: 'Ajouter une image de couverture aux articles',
      reste: articlesSansImage,
    },
    {
      href: '/admin/collections/blog?where[extrait][exists]=false',
      libelle: 'Rédiger le résumé court des articles',
      reste: articlesSansExtrait,
    },
  ]

  return {
    articles,
    articles30j,
    articles30jPrec,
    articlesALaUne,
    articlesSansImage,
    dateDuJour,
    derniersArticles,
    emplacementsManquants,
    etatServices,
    maintenant,
    medias,
    medias30j,
    medias30jPrec,
    prenom,
    taches,
  }
}

/* ------------------------------------------------------------------- Vue */

export const TableauDeBord = async (props: any) => {
  // Selon le point de branchement : props directes ou via la vue.
  const payload = props?.payload ?? props?.initPageResult?.req?.payload
  const user = props?.user ?? props?.initPageResult?.req?.user
  if (!payload) return null

  const d = await chargerTableau(payload, user)

  return (
    <div className="op-tdb">
      {/* ------------------------------------------------ Bandeau d'accueil */}
      <header className="op-hero">
        <div className="op-hero__texte">
          <p className="op-hero__kicker">Communication • Marketing • Digital • IA</p>
          <h1 className="op-hero__titre">
            Bonjour{d.prenom ? ' ' : ''}
            <strong>{d.prenom}</strong>, voici votre tableau de bord
          </h1>
          <p className="op-hero__sous-titre">
            Chaque enregistrement déclenche la reconstruction du site : la modification apparaît
            en ligne quelques minutes plus tard, sans intervention technique.
          </p>
        </div>
        <p className="op-hero__date">{d.dateDuJour}</p>
      </header>

      {/* -------------------------------------------- Les chiffres qui comptent */}
      <div className="op-tuiles">
        <Tuile
          alerte
          href="/admin/globals/service-images"
          icone={<IconeRetard taille={19} />}
          label="Illustrations manquantes sur les pages Services"
          pied={{
            legende: 'des emplacements à remplir',
            max: EMPLACEMENTS_TOTAL,
            type: 'barre',
            valeur: d.emplacementsManquants,
          }}
          valeur={d.emplacementsManquants}
        />
        <Tuile
          href="/admin/collections/blog"
          icone={<IconeArticle taille={19} />}
          label="Articles de blog"
          pied={{ actuel: d.articles30j, periode: 'sur 30 jours', precedent: d.articles30jPrec, type: 'tendance' }}
          valeur={d.articles}
        />
        <Tuile
          href="/admin/collections/blog?where[aLaUne][equals]=true"
          icone={<IconeEclair taille={19} />}
          label="Articles à la une"
          pied={
            d.articles > 0
              ? { legende: 'des articles', max: d.articles, type: 'barre', valeur: d.articlesALaUne }
              : { type: 'aucun' }
          }
          valeur={d.articlesALaUne}
        />
        <Tuile
          href="/admin/collections/blog?where[image][exists]=false"
          icone={<IconeBrouillon taille={19} />}
          label="Articles sans image de couverture"
          pied={
            d.articles > 0
              ? { legende: 'des articles à illustrer', max: d.articles, type: 'barre', valeur: d.articlesSansImage }
              : { type: 'aucun' }
          }
          valeur={d.articlesSansImage}
        />
        <Tuile
          href="/admin/collections/media"
          icone={<IconePlus taille={19} />}
          label="Images dans la médiathèque"
          pied={{ actuel: d.medias30j, periode: 'sur 30 jours', precedent: d.medias30jPrec, type: 'tendance' }}
          valeur={d.medias}
        />
      </div>

      {/* ---------------------------------------------------- Actions rapides */}
      <div className="op-rapides">
        <span className="op-rapides__intro">Actions rapides</span>
        <Link className="op-bouton" href="/admin/collections/blog/create">
          <IconeCrayon taille={17} />
          Écrire un article
        </Link>
        <Link className="op-bouton" href="/admin/collections/media/create">
          <IconePlus taille={17} />
          Ajouter une image
        </Link>
        <Link className="op-bouton op-bouton--secondaire" href="/admin/globals/service-images">
          <IconeReglages taille={17} />
          Images des pages Services
        </Link>
      </div>

      {/* --------------------------- Deux listes + le panneau des raccourcis */}
      <div className="op-grille">
        {/* ------------------------------------------- Derniers articles */}
        <section className="op-carte">
          <div className="op-carte__entete">
            <h2 className="op-carte__titre">Derniers articles</h2>
            <Link className="op-carte__lien" href="/admin/collections/blog">
              Tout voir
            </Link>
          </div>

          {d.derniersArticles.length === 0 ? (
            <p className="op-vide">Aucun article pour l’instant. Le premier n’attend que vous.</p>
          ) : (
            <ul className="op-liste">
              {d.derniersArticles.map((a) => {
                const couverture = a.image && typeof a.image === 'object' ? a.image : null
                const vignette = couverture?.sizes?.vignette?.url ?? couverture?.url

                return (
                  <li className="op-ligne" key={a.id}>
                    {vignette ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="op-vignette" src={vignette} />
                    ) : (
                      <span aria-hidden="true" className="op-vignette op-vignette--absente">
                        <IconeArticle taille={18} />
                      </span>
                    )}

                    <Link className="op-ligne__corps" href={`/admin/collections/blog/${a.id}`}>
                      <span className="op-ligne__haut">
                        <span className="op-ligne__nom">{a.titre}</span>
                        {a.updatedAt && (
                          <span className="op-ligne__date">{tempsRelatif(a.updatedAt, d.maintenant)}</span>
                        )}
                      </span>
                      <span className="op-ligne__meta">
                        {libelleCategorie(a.categorie)}
                        {a.date ? ` · ${dateCourte(a.date)}` : ''}
                        {a.tempsLecture ? ` · ${a.tempsLecture} min` : ''}
                      </span>
                    </Link>

                    <span className="op-ligne__fin">{a.aLaUne && <PastilleUne />}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* ------------------------------------ Illustrations des Services */}
        <section className="op-carte">
          <div className="op-carte__entete">
            <h2 className="op-carte__titre">Illustrations des pages Services</h2>
            <Link className="op-carte__lien" href="/admin/globals/service-images">
              Modifier
            </Link>
          </div>

          <ul className="op-liste">
            {d.etatServices.map((s) => {
              const part = Math.round((s.remplis / EMPLACEMENTS.length) * 100)
              return (
                <li className="op-ligne" key={s.slug}>
                  <Link className="op-ligne__corps" href="/admin/globals/service-images">
                    <span className="op-ligne__haut">
                      <span className="op-ligne__nom">{s.nom}</span>
                      <span className="op-ligne__date">
                        {s.remplis} / {EMPLACEMENTS.length}
                      </span>
                    </span>
                    <span className="op-jauge" role="presentation">
                      <span className="op-jauge__remplissage" style={{ width: `${part}%` }} />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        {/* ------------------------------------- Panneau latéral : le jour */}
        <aside className="op-aside">
          <div className="op-aside__bloc">
            <h2 className="op-aside__titre">
              <IconeEclair taille={16} />
              Tâches du jour
            </h2>

            <ul className="op-taches">
              {d.taches.map((t) => (
                <li className={`op-tache${t.reste === 0 ? ' op-tache--faite' : ''}`} key={t.libelle}>
                  <Link href={t.href}>
                    <span aria-hidden="true" className="op-tache__case">
                      {t.reste === 0 ? '✓' : t.reste}
                    </span>
                    <span className="op-tache__libelle">{t.libelle}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {d.taches.every((t) => t.reste === 0) && (
              <p className="op-aside__note">Tout est à jour. Rien ne vous attend.</p>
            )}
          </div>

          <div className="op-aside__bloc">
            <h2 className="op-aside__titre">Raccourcis</h2>
            <ul className="op-raccourcis">
              <li>
                <Link href="/admin/collections/blog">Tous les articles</Link>
              </li>
              <li>
                <Link href="/admin/collections/media">Médiathèque</Link>
              </li>
              <li>
                <Link href="/admin/globals/service-images">Images des pages Services</Link>
              </li>
              <li>
                <Link href="/admin/collections/users">Utilisateurs</Link>
              </li>
              <li>
                <a href={SITE} rel="noreferrer" target="_blank">
                  Voir le site en ligne
                </a>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default TableauDeBord
