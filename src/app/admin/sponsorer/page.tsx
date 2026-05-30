import { Handshake, Plus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip, ChipBar } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { FAB } from '@/components/ui/FAB'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { SponsorStatus, SponsorTier } from '@/db/schema'
import { createSponsor, listSponsors, sponsorStats } from '@/lib/sponsors'

const TIER_LABEL: Record<SponsorTier, string> = {
  hovedsponsor: 'Hovedsponsor',
  gull: 'Gull',
  solv: 'Sølv',
  partner: 'Partner',
}
const TIER_TONE: Record<SponsorTier, 'black' | 'gold' | 'neutral'> = {
  hovedsponsor: 'black',
  gull: 'gold',
  solv: 'neutral',
  partner: 'neutral',
}
const STATUS_LABEL: Record<SponsorStatus, string> = {
  prospekt: 'Prospekt',
  aktiv: 'Aktiv',
  utlopt: 'Utløpt',
}
const STATUS_TONE: Record<SponsorStatus, 'teal' | 'gold' | 'red'> = {
  prospekt: 'gold',
  aktiv: 'teal',
  utlopt: 'red',
}

function formatNum(n: number) {
  return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(n)
}

const FILTERS: Array<{ key: 'alle' | SponsorStatus; label: string }> = [
  { key: 'alle', label: 'Alle' },
  { key: 'aktiv', label: 'Aktive' },
  { key: 'prospekt', label: 'Prospekt' },
  { key: 'utlopt', label: 'Utløpt' },
]

export default async function SponsorerPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'admin') redirect('/dashboard')

  const { status } = await searchParams
  const activeFilter = (FILTERS.map((f) => f.key) as string[]).includes(status ?? '')
    ? (status as 'alle' | SponsorStatus)
    : 'alle'

  const [all, stats] = await Promise.all([listSponsors(), sponsorStats()])
  const sponsors =
    activeFilter === 'alle' ? all : all.filter((s) => s.status === activeFilter)

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader title="Sponsorer" back={{ href: '/admin', label: 'Admin' }} />

        {/* KPI-strip */}
        <div className="px-6 pt-6">
          <div className="grid grid-cols-2 gap-3">
            <Card padding="md">
              <p className="kpi-label">Sponsorer</p>
              <p className="kpi-value mt-1 text-2xl">{stats.total}</p>
              <p className="text-[11px] text-gfgk-text-3">{stats.active} aktive</p>
            </Card>
            <Card padding="md">
              <p className="kpi-label">Årlig verdi</p>
              <p className="kpi-value mt-1 text-2xl text-gfgk-teal-deep">
                {formatNum(stats.totalValue)}
              </p>
              <p className="text-[11px] text-gfgk-text-3">kr/år</p>
            </Card>
            <Card padding="md" accent={stats.expiringSoon > 0 ? 'red' : 'none'}>
              <p className="kpi-label">Utløper snart</p>
              <p
                className={`kpi-value mt-1 text-2xl ${stats.expiringSoon > 0 ? 'text-gfgk-red-deep' : ''}`}
              >
                {stats.expiringSoon}
              </p>
              <p className="text-[11px] text-gfgk-text-3">neste 60 dager</p>
            </Card>
            <Card padding="md">
              <p className="kpi-label">Avtaler</p>
              <p className="kpi-value mt-1 text-2xl">
                {all.reduce((s, x) => s + Number(x.agreementCount), 0)}
              </p>
              <p className="text-[11px] text-gfgk-text-3">totalt</p>
            </Card>
          </div>
        </div>

        {/* Filter */}
        <div className="px-6 pt-4">
          <ChipBar>
            {FILTERS.map((f) => (
              <Chip
                key={f.key}
                active={activeFilter === f.key}
                href={f.key === 'alle' ? '/admin/sponsorer' : `/admin/sponsorer?status=${f.key}`}
              >
                {f.label}
              </Chip>
            ))}
          </ChipBar>
        </div>

        {/* Liste */}
        <div className="px-6 pt-5">
          {sponsors.length === 0 ? (
            <EmptyState
              icon={Handshake}
              title="Ingen sponsorer"
              description="Tap + nede til høyre for å legge til den første."
            />
          ) : (
            <div className="space-y-2">
              {sponsors.map((s) => (
                <Link
                  key={s.id}
                  href={`/admin/sponsorer/${s.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-gfgk-border bg-white p-4 shadow-card transition-[border-color,box-shadow] duration-150 hover:border-gfgk-border-strong hover:shadow-card-hover"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gfgk-text">{s.name}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Pill tone={TIER_TONE[s.tier]} size="sm">
                        {TIER_LABEL[s.tier]}
                      </Pill>
                      <Pill tone={STATUS_TONE[s.status]} size="sm">
                        {STATUS_LABEL[s.status]}
                      </Pill>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono-nums text-sm font-semibold text-gfgk-text">
                      {formatNum(Number(s.annualValue))}
                    </p>
                    <p className="text-[11px] text-gfgk-text-3">kr/år</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Ny sponsor */}
      <BottomSheet>
        <BottomSheetTrigger asChild>
          <FAB aria-label="Ny sponsor">
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </FAB>
        </BottomSheetTrigger>
        <BottomSheetContent>
          <BottomSheetTitle>Ny sponsor</BottomSheetTitle>
          <form action={createSponsor} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">Navn</label>
              <Input name="name" type="text" required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">Nivå</label>
                <Select name="tier" defaultValue="partner">
                  <option value="hovedsponsor">Hovedsponsor</option>
                  <option value="gull">Gull</option>
                  <option value="solv">Sølv</option>
                  <option value="partner">Partner</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">Status</label>
                <Select name="status" defaultValue="aktiv">
                  <option value="prospekt">Prospekt</option>
                  <option value="aktiv">Aktiv</option>
                  <option value="utlopt">Utløpt</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Kontaktperson
              </label>
              <Input name="contactName" type="text" placeholder="Navn" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input name="contactEmail" type="email" placeholder="E-post" />
              <Input name="contactPhone" type="tel" placeholder="Telefon" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Nettside
              </label>
              <Input name="website" type="text" placeholder="https://" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">Notat</label>
              <Textarea name="notes" rows={2} />
            </div>
            <div className="flex gap-2 pt-2">
              <BottomSheetClose asChild>
                <Button type="button" variant="secondary" fullWidth>
                  Avbryt
                </Button>
              </BottomSheetClose>
              <Button type="submit" variant="primary" fullWidth>
                Opprett
              </Button>
            </div>
          </form>
        </BottomSheetContent>
      </BottomSheet>

      <BottomNav role={session.user.role} />
    </>
  )
}
