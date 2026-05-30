import Link from 'next/link'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function AdminPage() {
  const session = await auth()
  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader title="Admin" subtitle="Internt panel for daglig leder" />

        <div className="px-6 pt-6">
          <section className="space-y-3">
            {[
              { href: '/admin/ansatte', title: 'Ansatte', desc: 'Inviter og administrer ansatte.' },
              { href: '/admin/vaktliste', title: 'Vaktliste', desc: 'Lag og publiser vaktlister.' },
              { href: '/admin/sjekklister', title: 'Sjekklister', desc: 'Daglige rutiner og protokoller.' },
              { href: '/admin/annonseringer', title: 'Annonseringer', desc: 'Beskjeder til alle eller utvalgte.' },
              { href: '/admin/hendelser', title: 'Hendelser', desc: 'Klager, maskinfeil og observasjoner fra vakter.' },
              { href: '/admin/aktiviteter', title: 'Aktiviteter', desc: 'Turneringer, kurs og events i kalenderen.' },
              { href: '/admin/kunnskap', title: 'Kunnskap', desc: 'Artikler for ansatte og kundeservice.' },
              { href: '/admin/inbox', title: 'Inbox', desc: 'AI-assistert servicepunkt-e-post.' },
              { href: '/admin/innstillinger/ai-skills', title: 'AI svar-maler', desc: 'Maler som agenten bruker.' },
              { href: '/admin/budsjett', title: 'Budsjett', desc: 'Inntekter, utgifter og rapporter.' },
              { href: '/admin/lonn', title: 'Lønn', desc: 'Timesatser og lønnskostnader.' },
              { href: '/admin/rapporter', title: 'Rapporter', desc: 'Statistikk og månedlig oversikt.' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block overflow-hidden rounded-lg border border-gfgk-border shadow-card hover:-translate-y-0.5 hover:shadow-md transition-all duration-150"
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
