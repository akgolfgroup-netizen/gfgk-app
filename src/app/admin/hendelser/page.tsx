import { AlertTriangle } from 'lucide-react'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { listShiftEvents } from '@/lib/shift-events'
import { cn } from '@/lib/cn'
import type { ShiftEventCategory, ShiftEventSeverity } from '@/db/schema'

interface PageProps {
  searchParams: Promise<{ category?: string; severity?: string }>
}

const CATEGORY_LABEL: Record<ShiftEventCategory, string> = {
  hendelse: 'Hendelse',
  klage: 'Klage',
  maskin: 'Maskin',
  observasjon: 'Observasjon',
  annet: 'Annet',
}

const SEVERITY_TONE: Record<ShiftEventSeverity, 'gold' | 'red' | 'neutral'> = {
  info: 'neutral',
  medium: 'gold',
  hoy: 'red',
}

const SEVERITY_LABEL: Record<ShiftEventSeverity, string> = {
  info: 'Info',
  medium: 'Medium',
  hoy: 'Høy',
}

const CATEGORIES: ShiftEventCategory[] = [
  'hendelse',
  'klage',
  'maskin',
  'observasjon',
  'annet',
]
const SEVERITIES: ShiftEventSeverity[] = ['info', 'medium', 'hoy']

export default async function AdminHendelserPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) return null

  const { category: cParam, severity: sParam } = await searchParams
  const category = (CATEGORIES as string[]).includes(cParam ?? '')
    ? (cParam as ShiftEventCategory)
    : undefined
  const severity = (SEVERITIES as string[]).includes(sParam ?? '')
    ? (sParam as ShiftEventSeverity)
    : undefined

  const events = await listShiftEvents({ category, severity })

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader title="Hendelseslogg" back={{ href: '/admin', label: 'Admin' }} />

        {/* Filter-chips */}
        <div className="space-y-2 px-6 pt-4">
          <div className="overflow-x-auto">
            <div className="flex gap-2 pb-1">
              <FilterChip
                href="/admin/hendelser"
                active={!category && !severity}
                label="Alle"
              />
              {CATEGORIES.map((c) => {
                const href = `/admin/hendelser?category=${c}${severity ? `&severity=${severity}` : ''}`
                return (
                  <FilterChip
                    key={c}
                    href={href}
                    active={category === c}
                    label={CATEGORY_LABEL[c]}
                  />
                )
              })}
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-2 pb-1">
              {SEVERITIES.map((s) => {
                const href = `/admin/hendelser?severity=${s}${category ? `&category=${category}` : ''}`
                return (
                  <FilterChip
                    key={s}
                    href={href}
                    active={severity === s}
                    label={SEVERITY_LABEL[s]}
                  />
                )
              })}
            </div>
          </div>
        </div>

        <div className="px-6 pt-6">
          {events.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Ingen hendelser"
              description="Hendelser ansatte logger fra vakter dukker opp her."
            />
          ) : (
            <div className="space-y-3">
              {events.map((e) => (
                <article
                  key={e.id}
                  className="rounded-xl border border-gfgk-border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.06)]"
                >
                  <div className="mb-2 flex items-start gap-3">
                    <Avatar
                      size="sm"
                      src={e.userAvatar}
                      name={e.userName}
                      email={e.userEmail}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gfgk-text">
                        {e.userName ?? e.userEmail}
                      </p>
                      <p className="text-xs text-gfgk-text-2">
                        {e.createdAt.toLocaleDateString('nb-NO', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {e.shiftDate && ` · vakt ${e.shiftDate}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Pill tone="neutral" size="sm">
                        {CATEGORY_LABEL[e.category]}
                      </Pill>
                      {e.severity !== 'info' && (
                        <Pill tone={SEVERITY_TONE[e.severity]} size="sm">
                          {SEVERITY_LABEL[e.severity]}
                        </Pill>
                      )}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-gfgk-text">{e.body}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string
  active: boolean
  label: string
}) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex h-8 shrink-0 items-center rounded-full px-3 text-[13px] font-semibold transition-colors',
        active
          ? 'bg-gfgk-gold text-gfgk-black'
          : 'bg-gfgk-cream-deep text-gfgk-text hover:bg-gfgk-cream',
      )}
    >
      {label}
    </a>
  )
}
