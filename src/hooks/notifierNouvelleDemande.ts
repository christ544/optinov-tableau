import type { CollectionAfterChangeHook } from 'payload'

import { sujetAccuse, sujetAlerte, texteAccuse, texteAlerte } from '../lib/demandes'

/*
  NOTIFICATION À LA RÉCEPTION D'UNE DEMANDE.

  Deux messages partent à la création d'une demande :
    - une ALERTE INTERNE vers l'adresse de l'agence (ALERTES_EMAIL), avec tout
      ce qu'il faut pour rappeler sans ouvrir le tableau de bord ;
    - un ACCUSÉ DE RÉCEPTION au prospect, s'il a laissé un e-mail.

  TROIS RÈGLES DE PRUDENCE.

  1. UNIQUEMENT À LA CRÉATION. Sans ce test, chaque passage de « Nouveau » à
     « Traité » renverrait la même alerte, et l'équipe apprendrait vite à
     ignorer ces messages.

  2. UN ÉCHEC D'ENVOI NE DOIT JAMAIS PERDRE LA DEMANDE. Ce hook s'exécute APRÈS
     l'enregistrement, mais une exception ferait échouer la requête du visiteur,
     qui verrait une erreur alors que sa demande est en base. Tout est donc
     dans un try/catch : au pire, personne n'est prévenu, la donnée est sauvée.

  3. AUCUN ENVOI SANS SMTP. Sans SMTP_HOST, on ne tente rien : en développement,
     Payload écrirait les messages dans la console, lisible une fois, pénible
     à chaque essai.
*/
export const notifierNouvelleDemande: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  const { payload } = req
  if (!process.env.SMTP_HOST) {
    payload.logger.info('Nouvelle demande enregistrée — aucun e-mail envoyé (SMTP_HOST non configuré).')
    return doc
  }

  const destinataire = process.env.ALERTES_EMAIL
  const serveur = process.env.PAYLOAD_PUBLIC_SERVER_URL || process.env.RENDER_EXTERNAL_URL || ''
  const adminURL = `${serveur}/admin/collections/demandes/${doc.id}`

  // ------------------------------------------------------ 1. Alerte interne
  if (destinataire) {
    try {
      await payload.sendEmail({ to: destinataire, subject: sujetAlerte(doc), text: texteAlerte(doc, adminURL) })
      payload.logger.info(`Alerte envoyée à ${destinataire} pour la demande ${doc.id}.`)
    } catch (erreur) {
      payload.logger.error(
        { err: erreur },
        `Alerte NON envoyée pour la demande ${doc.id} — elle reste consultable dans le tableau de bord.`,
      )
    }
  } else {
    payload.logger.warn('ALERTES_EMAIL non configuré : personne n’est prévenu des nouvelles demandes.')
  }

  // -------------------------------------------- 2. Accusé de réception
  if (doc.email) {
    try {
      let whatsapp: null | string = null
      try {
        const parametres = await payload.findGlobal({ slug: 'parametres', depth: 0 })
        whatsapp = (parametres as { whatsapp?: null | string })?.whatsapp ?? null
      } catch {
        whatsapp = null
      }
      await payload.sendEmail({ to: doc.email, subject: sujetAccuse(), text: texteAccuse(doc, whatsapp) })
    } catch (erreur) {
      // Sans gravité : la demande est enregistrée et l'agence a été prévenue.
      payload.logger.error({ err: erreur }, `Accusé de réception non envoyé à ${doc.email}.`)
    }
  }

  return doc
}
