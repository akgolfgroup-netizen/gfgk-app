import { desc } from 'drizzle-orm'
import { CalendarPlus, FileUp, Plus, Trash2 } from 'lucide-react'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { ConfirmButton } from '@/components/ConfirmButton'
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FAB } from '@/components/ui/FAB'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { getDb } from '@/db'
import { activities, type ActivityType } from '@/db/schema'
import { createActivity, deleteActivity } from '@/lib/activities'

const TYPE_LABEL: Record<ActivityType, string> = {
  turnering: 'Turnering',
  kurs: 'Kurs',
  intern: 'Intern',
  sosial: 'Sosial',
}

const TYPE_TONE: Record<ActivityType, 'gold' | 'teal' | 'red' | 'neutral'> = {
  turnering: 'gold',
  kurs: 'teal',
  intern: 'neutral',
  sosial: 'red',
}

export default async function AdminAktiviteterPage() {
  const session = await auth()
  if (!session?.user) return null

  const all = await getDb()
    .select()
    .from(activities)
    .orderBy(desc(activities.startAt))
    .limit(100)

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader
          title="Aktiviteter"
          subtitle="Turneringer, kurs og events"
          back={{ href: '/admin', label: 'Admin' }}
          action={
            <a
              href="/admin/aktiviteter/import"
              className="rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="Importer CSV"
            >
              <FileUp className="h-5 w-5" />
            </a>
          }
        />

        <div className="px-6 pt-6">
          {all.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="Ingen aktiviteter enda"
              description="Lag den første med + nede til høyre, eller importer CSV fra øverst-høyre."
            />
          ) : (
            <div className="space-y-2">
              {all.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-gfgk-border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.06)]"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gfgk-text">{a.title}</p>
                      <p className="mt-0.5 text-xs text-gfgk-text-2">
                        {a.startAt.toLocaleDateString('nb-NO', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {' · '}
                        {a.startAt.toLocaleTimeString('nb-NO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        –
                        {a.endAt.toLocaleTimeString('nb-NO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {a.location ? ` · ${a.location}` : ''}
                      </p>
                    </div>
                    <Pill tone={TYPE_TONE[a.type]} size="sm">
                      {TYPE_LABEL[a.type]}
                    </Pill>
                  </div>
                  {a.description && (
                    <p className="mb-2 text-xs text-gfgk-text-2">{a.description}</p>
                  )}
                  <form
                    action={async () => {
                      'use server'
                      await deleteActivity(a.id)
                    }}
                  >
                    <ConfirmButton
                      message={`Slette "${a.title}"?`}
                      className="inline-flex items-center gap-1 rounded-md bg-gfgk-red-light px-3 py-1 text-xs font-semibold text-gfgk-red-deep hover:bg-gfgk-red/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Slett
                    </ConfirmButton>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomSheet>
        <BottomSheetTrigger asChild>
          <FAB aria-label="Ny aktivitet">
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </FAB>
        </BottomSheetTrigger>
        <BottomSheetContent>
          <BottomSheetTitle>Ny aktivitet</BottomSheetTitle>
          <form action={createActivity} className="space-y-3">
            <Input name="title" type="text" required autoFocus placeholder="Tittel" />
            <Select name="type" defaultValue="intern">
              <option value="turnering">Turnering</option>
              <option value="kurs">Kurs</option>
              <option value="intern">Intern</option>
              <option value="sosial">Sosial</option>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input name="startAt" type="datetime-local" required />
              <Input name="endAt" type="datetime-local" required />
            </div>
            <Input name="location" type="text" placeholder="Sted (valgfri)" />
            <Textarea name="description" rows={2} placeholder="Beskrivelse (valgfri)" />
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
