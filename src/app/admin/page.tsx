import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Banknote,
  CalendarDays,
  CalendarPlus,
  Handshake,
  Inbox,
  ListChecks,
  Megaphone,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { PageHeader } from '@/components/ui/PageHeader'

const ITEMS: Array<{
  href: string
  title: string
  desc: string
  icon: LucideIcon
}> = [
  { href: '/admin/ansatte', title: 'Ansatte', desc: 'Inviter og administrer ansatte', icon: Users },
  { href: '/admin/sponsorer', title: 'Sponsorer', desc: 'Avtaler, verdi og oppfølging', icon: Handshake },
  { href: '/admin/vaktliste', title: 'Vaktliste', desc: 'Lag og publiser vaktlister', icon: CalendarDays },
  { href: '/admin/sjekklister', title: 'Sjekklister', desc: 'Daglige rutiner og protokoller', icon: ListChecks },
  { href: '/admin/annonseringer', title: 'Annonseringer', desc: 'Beskjeder til alle eller utvalgte', icon: Megaphone },
  { href: '/admin/hendelser', title: 'Hendelser', desc: 'Klager, maskinfeil, observasjoner', icon: AlertTriangle },
  { href: '/admin/aktiviteter', title: 'Aktiviteter', desc: 'Turneringer, kurs og events', icon: CalendarPlus },
  { href: '/admin/kunnskap', title: 'Kunnskap', desc: 'Artikler og kundeservice', icon: BookOpen },
  { href: '/admin/inbox', title: 'Inbox', desc: 'AI-assistert servicepunkt-e-post', icon: Inbox },
  { href: '/admin/innstillinger/ai-skills', title: 'AI svar-maler', desc: 'Maler agenten bruker', icon: Sparkles },
  { href: '/admin/budsjett', title: 'Budsjett', desc: 'Inntekter og utgifter', icon: Wallet },
  { href: '/admin/lonn', title: 'Lønn', desc: 'Timesatser og lønnskostnad', icon: Banknote },
  { href: '/admin/rapporter', title: 'Rapporter', desc: 'Statistikk og oversikt', icon: BarChart3 },
]

export default async function AdminPage() {
  const session = await auth()
  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader title="Admin" subtitle="Internt panel for daglig leder" />

        <div className="px-6 pt-6">
          <div className="grid grid-cols-2 gap-3">
            {ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col rounded-2xl border border-gfgk-border bg-white p-4 shadow-card transition-[border-color,box-shadow] duration-150 hover:border-gfgk-border-strong hover:shadow-card-hover"
                >
                  <div className="surface-gold-soft mb-3 grid h-9 w-9 place-items-center rounded-xl">
                    <Icon className="h-5 w-5 text-gfgk-gold-deep" strokeWidth={1.8} />
                  </div>
                  <h2 className="text-sm font-semibold text-gfgk-text">{item.title}</h2>
                  <p className="mt-0.5 text-xs leading-snug text-gfgk-text-2">{item.desc}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
      <BottomNav role={session!.user.role} />
    </>
  )
}
