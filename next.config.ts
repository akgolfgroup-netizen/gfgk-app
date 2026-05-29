import withSerwistInit from '@serwist/next'
import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    root: import.meta.dirname,
  },
}

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // Slå av PWA i dev for å unngå caching-friksjon under utvikling.
  disable: process.env.NODE_ENV === 'development',
})

export default withSerwist(config)
