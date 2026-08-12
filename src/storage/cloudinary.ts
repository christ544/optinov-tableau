import type { Adapter, GeneratedAdapter } from '@payloadcms/plugin-cloud-storage/types'

/**
 * Adaptateur de stockage Cloudinary compatible Cloudflare Workers.
 * Il n'utilise PAS le SDK Node de Cloudinary (incompatible Workers) : tout
 * passe par `fetch` + l'API REST signée (signature SHA-1 via Web Crypto).
 */

type CloudinaryOptions = {
  cloudName: string
  apiKey: string
  apiSecret: string
  folder?: string
}

const enc = new TextEncoder()

async function sha1hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', enc.encode(input))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Signature Cloudinary : SHA1( params triés "k=v&k2=v2" + apiSecret ).
async function sign(params: Record<string, string | number>, apiSecret: string): Promise<string> {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  return sha1hex(toSign + apiSecret)
}

const sansExtension = (filename: string) => filename.replace(/\.[^.]+$/, '')

export const cloudinaryAdapter =
  (opts: CloudinaryOptions): Adapter =>
  (): GeneratedAdapter => {
    const folder = opts.folder || 'optinov'
    const base = `https://api.cloudinary.com/v1_1/${opts.cloudName}`
    const publicIdOf = (filename: string) => `${folder}/${sansExtension(filename)}`

    return {
      name: 'cloudinary',

      // URL publique de l'image (CDN Cloudinary).
      generateURL: ({ filename }) =>
        `https://res.cloudinary.com/${opts.cloudName}/image/upload/${folder}/${filename}`,

      // Téléversement vers Cloudinary.
      handleUpload: async ({ file }) => {
        const publicId = publicIdOf(file.filename)
        const timestamp = Math.floor(Date.now() / 1000)
        const signature = await sign(
          { invalidate: 'true', overwrite: 'true', public_id: publicId, timestamp },
          opts.apiSecret,
        )

        const form = new FormData()
        form.append('file', new Blob([file.buffer], { type: file.mimeType }), file.filename)
        form.append('api_key', opts.apiKey)
        form.append('timestamp', String(timestamp))
        form.append('public_id', publicId)
        form.append('overwrite', 'true')
        form.append('invalidate', 'true')
        form.append('signature', signature)

        const res = await fetch(`${base}/auto/upload`, { method: 'POST', body: form })
        if (!res.ok) {
          const txt = await res.text()
          throw new Error(`Cloudinary upload échoué (${res.status}): ${txt}`)
        }
      },

      // Suppression sur Cloudinary.
      handleDelete: async ({ filename }) => {
        const publicId = publicIdOf(filename)
        const timestamp = Math.floor(Date.now() / 1000)
        const signature = await sign(
          { invalidate: 'true', public_id: publicId, timestamp },
          opts.apiSecret,
        )

        const form = new FormData()
        form.append('api_key', opts.apiKey)
        form.append('timestamp', String(timestamp))
        form.append('public_id', publicId)
        form.append('invalidate', 'true')
        form.append('signature', signature)

        await fetch(`${base}/image/destroy`, { method: 'POST', body: form }).catch(() => {})
      },

      // Sert le fichier : redirection vers le CDN Cloudinary.
      staticHandler: async (_req, { params: { filename } }) =>
        Response.redirect(
          `https://res.cloudinary.com/${opts.cloudName}/image/upload/${folder}/${filename}`,
          302,
        ),
    }
  }
