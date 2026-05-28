import Link from 'next/link'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'

export default async function AdminPage() {
  const session = await auth()
  return (
    <>
      <main className="min-h-dvh pb-24">
        <header className="bg-gfgk-black px-6 pt-safe pb-6">
          <div className="pt-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-gfgk-gold">Admin</h1>
            <p className="text-sm text-white/50 mt-0.5">Internt panel for daglig leder</p>
          </div>
        </header>

        <div className="px-6 pt-6">
          <section className="space-y-3">
            {[
              { href: '/admin/ansatte', title: 'Ansatte', desc: 'Inviter og administrer ansatte.' },
              { href: '/admin/vaktliste', title: 'Vaktliste', desc: 'Lag og publiser vaktlister.' },
              { href: '/admin/aktiviteter', title: 'Aktiviteter', desc: 'Turneringer, kurs og events i kalenderen.' },
              { href: '/admin/budsjett', title: 'Budsjett', desc: 'Inntekter, utgifter og rapporter.' },
              { href: '/admin/lonn', title: 'Lønn', desc: 'Timesatser og lønnskostnader.' },
              { href: '/admin/rapporter', title: 'Rapporter', desc: 'Statistikk og månedlig oversikt.' },
              { href: '/admin/prosjekter', title: 'Prosjekter', desc: 'Prosjekter og oppgaver.' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block overflow-hidden rounded-lg border border-gfgk-border shadow-[0_1px_2px_rgba(0,0,0,.06)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-150"
              >
                <div className="bg-gfgk-black px-4 py-3">
                  <h2 className="text-[11px] font-extrabold uppercase tracking-wide text-gfgk-gold">{item.title}</h2>
                </div>
                <div className="bg-white px-4 py-3">
                  <p className="text-sm text-gfgk-text-2">{item.desc}</p>
                </div>
              </Link>
            ))}
          </section>
        </div>
      </main>
      <BottomNav role={session!.user.role} />
    </>
  )
}
