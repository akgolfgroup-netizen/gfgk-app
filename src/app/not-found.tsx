import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-gfgk-cream px-6 pt-safe pb-safe">
      <div className="max-w-[480px] text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
          404
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gfgk-text">
          Siden finnes ikke
        </h1>
        <p className="mt-2 text-sm text-gfgk-text-2">
          Lenken kan være utdatert, eller siden ble fjernet. Gå tilbake til oversikten.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-lg bg-gfgk-gold px-6 py-3 text-sm font-bold text-gfgk-black transition-colors hover:bg-gfgk-gold-deep"
        >
          Til hjem
        </Link>
      </div>
    </main>
  )
}
