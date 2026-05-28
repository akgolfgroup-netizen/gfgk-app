import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    root: import.meta.dirname,
  },
}

export default config
