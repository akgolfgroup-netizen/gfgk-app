import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gfgk-cream px-6 pt-safe pb-safe">
      <div className="max-w-[480px] text-center">
        <WifiOff className="mx-auto h-12 w-12 text-gfgk-gold" strokeWidth={1.5} />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-gfgk-text">
          Du er offline
        </h1>
        <p className="mt-2 text-sm text-gfgk-text-2">
          Sjekk nettverket og prøv igjen. Vakter og kalender du allerede har åpnet
          er fortsatt tilgjengelig.
        </p>
      </div>
    </main>
  )
}
