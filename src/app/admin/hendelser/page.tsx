import { AlertTriangle, ClipboardPlus } from 'lucide-react'
import { auth } from '@/auth'
import { createTask } from '@/lib/tasks'
import { Avatar } from '@/components/ui/Avatar'
import { Chip, ChipBar } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { listShiftEvents } from '@/lib/shift-events'
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
        <PageHeader
          title="Hendelseslogg"
          back={{ href: '/admin', label: 'Admin' }}
          maxWidth="6xl"
        />

        {/* Filter-chips: kategori + alvorlighet */}
        <div className="space-y-2 px-6 pt-6 lg:mx-auto lg:max-w-6xl">
          <ChipBar>
            <Chip href="/admin/hendelser" active={!category && !severity}>
              Alle
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                active={category === c}
                href={`/admin/hendelser?category=${c}${severity ? `&severity=${severity}` : ''}`}
              >
                {CATEGORY_LABEL[c]}
              </Chip>
            ))}
          </ChipBar>
          <ChipBar>
            {SEVERITIES.map((s) => (
              <Chip
                key={s}
                active={severity === s}
                href={`/admin/hendelser?severity=${s}${category ? `&category=${category}` : ''}`}
              >
                {SEVERITY_LABEL[s]}
              </Chip>
            ))}
          </ChipBar>
        </div>

        <div className="px-6 pt-6 lg:mx-auto lg:max-w-6xl">
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
                  className="rounded-xl border border-gfgk-border bg-white p-4 shadow-card"
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
                      <p className="font-mono-nums text-xs text-gfgk-text-2">
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
                  <form action={createTask} className="mt-3">
                    <input
                      type="hidden"
                      name="title"
                      value={`Oppfølging: ${e.body.length > 50 ? e.body.slice(0, 50) + '…' : e.body}`}
                    />
                    <input type="hidden" name="description" value={e.body} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gfgk-border bg-white px-3 py-1.5 text-xs font-semibold text-gfgk-text transition-colors hover:bg-gfgk-cream-deep"
                    >
                      <ClipboardPlus className="h-3.5 w-3.5" />
                      Lag oppgave
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </div>
    </>
  )
}
