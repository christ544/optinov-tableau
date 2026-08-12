/**
 * Déclenche une reconstruction du site OPTINOV quand le contenu change.
 * Appelle le « Deploy Hook » Cloudflare (URL fournie via la variable
 * d'environnement SITE_DEPLOY_HOOK). Si la variable n'est pas définie,
 * la fonction ne fait rien (aucune erreur) — pratique en local.
 */
export const triggerSiteRebuild = async () => {
  const url = process.env.SITE_DEPLOY_HOOK
  if (!url) return
  try {
    await fetch(url, { method: 'POST' })
    console.log('[OPTINOV] Reconstruction du site déclenchée.')
  } catch (e) {
    console.error('[OPTINOV] Échec du déclenchement de la reconstruction:', String(e))
  }
}
