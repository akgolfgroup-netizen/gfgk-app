import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-gfgk-black px-7 pt-safe pb-safe text-white">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 pt-20">
        <div className="surface-gold-soft grid h-36 w-36 place-items-center overflow-hidden rounded-[32px] shadow-gold-glow">
          <Image
            src="/logo.png"
            alt="GFGK Festningssoldaten"
            width={112}
            height={112}
            priority
            className="h-[78%] w-[78%] object-contain"
          />
        </div>
        <div className="text-center">
          <h1 className="text-5xl font-extrabold leading-none tracking-[-0.03em] text-gfgk-gold">
            GFGK
          </h1>
          <p className="mt-2 text-sm tracking-wide text-white/55">
            Gamle Fredrikstad Golfklubb
          </p>
          <p className="mt-1.5 text-[13px] italic text-gfgk-gold">Aktiv livet ut</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 pb-10">
        <Link
          href="/login"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-gfgk-gold font-bold text-gfgk-black shadow-card transition-colors hover:bg-gfgk-gold-deep"
        >
          Logg inn
        </Link>
        <p className="px-3 py-1 text-center text-[13px] text-white/55">
          Vil du bare se deg rundt?{' '}
          <Link href="/demo" className="font-semibold text-gfgk-gold hover:underline">
            Start demo
          </Link>
        </p>
      </div>
    </main>
  )
}
