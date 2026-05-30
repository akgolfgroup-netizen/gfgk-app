import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'

// Self-hostede variable-fonter fra GFGK/AK-designsystemet
const sans = localFont({
  src: './fonts/Inter.woff2',
  variable: '--font-sans',
  weight: '100 900',
  display: 'swap',
})
const display = localFont({
  src: [
    { path: './fonts/InterTight.woff2', style: 'normal', weight: '100 900' },
    { path: './fonts/InterTight-Italic.woff2', style: 'italic', weight: '100 900' },
  ],
  variable: '--font-display',
  display: 'swap',
})
const mono = localFont({
  src: './fonts/JetBrainsMono.woff2',
  variable: '--font-mono',
  weight: '100 900',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GFGK',
  description: 'AK Golf Group',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'GFGK' },
  icons: { apple: '/icons/apple-touch-icon.png' },
}

export const viewport: Viewport = {
  themeColor: '#FFCC00',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="no"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
