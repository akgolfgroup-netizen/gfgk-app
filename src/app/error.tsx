'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Logg til server-konsollet via Next.js — Vercel plukker dette opp i Runtime Logs.
    console.error('[app:error]', error)
  }, [error])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-gfgk-cream px-6 pt-safe pb-safe">
      <div className="max-w-[480px] text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-gfgk-red-deep">
          Feil
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gfgk-text">
          Noe gikk galt
        </h1>
        <p className="mt-2 text-sm text-gfgk-text-2">
          Vi fikk ikke til å laste denne siden. Prøv på nytt, eller gå tilbake til hjem.
        </p>
        {error.digest && (
          <p className="mt-4 text-xs text-gfgk-text-3">Feilkode: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-gfgk-gold px-6 py-3 text-sm font-bold text-gfgk-black transition-colors hover:bg-gfgk-gold-deep"
          >
            Prøv på nytt
          </button>
          <a
            href="/dashboard"
            className="rounded-lg border-2 border-gfgk-black px-6 py-3 text-sm font-semibold text-gfgk-text transition-colors hover:bg-gfgk-black hover:text-white"
          >
            Til hjem
          </a>
        </div>
      </div>
    </main>
  )
}
