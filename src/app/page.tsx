import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 pt-safe pb-safe bg-gfgk-black">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-gfgk-gold">GFGK</h1>
        <p className="text-sm text-white/50">Gamle Fredrikstad Golfklubb</p>
      </div>
      <Link
        href="/login"
        className="rounded-md bg-gfgk-gold px-8 py-3 text-sm font-bold text-gfgk-black hover:bg-gfgk-gold-deep transition-colors"
      >
        Logg inn
      </Link>
    </main>
  )
}
