/*
  RECONSTRUCTION DU SITE VITRINE QUAND LE CONTENU CHANGE.

  Le site est statique : pour qu'une modification apparaisse, il faut le
  reconstruire. On appelle pour cela le « Deploy Hook » de Cloudflare Pages
  (URL fournie par la variable SITE_DEPLOY_HOOK). Sans la variable, on ne
  fait rien : pratique en local, où personne ne veut déclencher un vrai
  déploiement à chaque essai.

  POURQUOI REGROUPER LES APPELS. Une session de saisie, c'est dix
  enregistrements en dix minutes : un article, sa correction, sa couverture,
  trois illustrations de services... Appeler le hook à chaque fois lançait dix
  reconstructions complètes à la file, pour un site identique au bout du
  compte. On attend donc que l'éditeur ait fini : chaque demande REPOUSSE un
  minuteur, et le hook n'est appelé qu'une fois le calme revenu (deux minutes
  sans nouvelle modification).

  `creerDeclencheur` est une fabrique, pour que les tests puissent fournir
  leur propre délai et leur propre fonction d'appel sans toucher au réseau.
*/

export const DELAI_REGROUPEMENT = 2 * 60 * 1000 // 2 minutes, en millisecondes

type Options = {
  /** Délai de calme avant d'appeler le hook, en millisecondes. */
  delai?: number
  /** La fonction qui appelle réellement le hook (remplaçable dans les tests). */
  appeler?: () => Promise<void>
}

/** Appelle le Deploy Hook. Ne lève jamais : un échec ne doit pas bloquer l'enregistrement. */
export const appelerLeHook = async (): Promise<void> => {
  const url = process.env.SITE_DEPLOY_HOOK
  if (!url) return
  try {
    await fetch(url, { method: 'POST' })
    console.log('[OPTINOV] Reconstruction du site déclenchée.')
  } catch (e) {
    console.error('[OPTINOV] Échec du déclenchement de la reconstruction :', String(e))
  }
}

export const creerDeclencheur = ({ delai = DELAI_REGROUPEMENT, appeler = appelerLeHook }: Options = {}) => {
  let minuteur: ReturnType<typeof setTimeout> | undefined

  return {
    /** Signale une modification : l'appel partira `delai` ms après la dernière demande. */
    demander: (): void => {
      if (minuteur) clearTimeout(minuteur)
      minuteur = setTimeout(() => {
        minuteur = undefined
        void appeler()
      }, delai)
      // Ne pas retenir le processus ouvert pour ce seul minuteur (tests, arrêt propre).
      minuteur.unref?.()
    },
    /** Abandonne la demande en attente, s'il y en a une. */
    annuler: (): void => {
      if (minuteur) clearTimeout(minuteur)
      minuteur = undefined
    },
    /** Vrai si une reconstruction est programmée et pas encore partie. */
    enAttente: (): boolean => minuteur !== undefined,
  }
}

/* L'instance partagée par toutes les collections. */
const declencheur = creerDeclencheur()

/**
 * À appeler après chaque création, modification ou suppression de contenu.
 * Regroupe les appels : une seule reconstruction par session de saisie.
 */
export const triggerSiteRebuild = (): void => {
  if (!process.env.SITE_DEPLOY_HOOK) return
  declencheur.demander()
}
