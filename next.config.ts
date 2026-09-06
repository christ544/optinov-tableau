import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Images servies par Payload depuis le disque (développement local).
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },

  /*
    Le build de production passe par Webpack (voir `npm run build`). Ces alias
    permettent à Webpack de résoudre les imports `.js` vers des sources `.ts`,
    comme le fait Payload dans ses propres paquets.
  */
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
