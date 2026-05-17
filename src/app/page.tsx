import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 pt-safe pb-safe bg-gfgk-black">
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/logo.png"
          alt="GFGK Festningssoldaten"
          width={160}
          height={160}
          priority
          className="drop-shadow-[0_4px_24px_rgba(245,197,24,0.25)]"
        />
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-gfgk-gold">GFGK</h1>
          <p className="text-sm text-white/50">Gamle Fredrikstad Golfklubb</p>
        </div>
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
