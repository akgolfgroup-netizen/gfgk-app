import { asc, eq } from 'drizzle-orm'
import { CheckSquare, Plus } from 'lucide-react'
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
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { getDb } from '@/db'
import { checklistItems, checklists } from '@/db/schema'
import { createChecklist, deleteChecklist } from '@/lib/checklists'

const REPEAT_LABEL = {
  daglig: 'Daglig',
  ukentlig: 'Ukentlig',
  manedlig: 'Månedlig',
} as const

const WEEKDAYS = [
  { value: 'man', label: 'Man' },
  { value: 'tir', label: 'Tir' },
  { value: 'ons', label: 'Ons' },
  { value: 'tor', label: 'Tor' },
  { value: 'fre', label: 'Fre' },
  { value: 'lor', label: 'Lør' },
  { value: 'son', label: 'Søn' },
] as const

export default async function AdminSjekklisterPage() {
  const session = await auth()
  if (!session?.user) return null

  const db = getDb()
  const all = await db
    .select({
      id: checklists.id,
      name: checklists.name,
      repeat: checklists.repeat,
      weekdays: checklists.weekdays,
      assignedRole: checklists.assignedRole,
      itemCount: checklistItems.id,
    })
    .from(checklists)
    .leftJoin(checklistItems, eq(checklistItems.checklistId, checklists.id))
    .orderBy(asc(checklists.name))

  // Grupper for å telle items per checklist
  const grouped = new Map<
    string,
    {
      id: string
      name: string
      repeat: 'daglig' | 'ukentlig' | 'manedlig'
      weekdays: string[] | null
      assignedRole: string
      itemCount: number
    }
  >()
  for (const row of all) {
    const cur = grouped.get(row.id)
    if (cur) {
      if (row.itemCount) cur.itemCount += 1
    } else {
      grouped.set(row.id, {
        id: row.id,
        name: row.name,
        repeat: row.repeat,
        weekdays: row.weekdays,
        assignedRole: row.assignedRole,
        itemCount: row.itemCount ? 1 : 0,
      })
    }
  }
  const list = Array.from(grouped.values())

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader
          title="Sjekklister"
          back={{ href: '/admin', label: 'Admin' }}
        />

        <div className="px-6 pt-6">
          {list.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="Ingen sjekklister enda"
              description="Tap + nede til høyre for å lage den første."
            />
          ) : (
            <div className="space-y-2">
              {list.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-3 rounded-xl border border-gfgk-border bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,.06)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gfgk-text">{c.name}</p>
                    <p className="mt-0.5 text-xs text-gfgk-text-2">
                      {REPEAT_LABEL[c.repeat]}
                      {c.repeat === 'ukentlig' && c.weekdays?.length
                        ? ` (${c.weekdays.join(', ')})`
                        : ''}
                      {' · '}
                      {c.itemCount} punkter · {c.assignedRole}
                    </p>
                  </div>
                  <form action={deleteChecklist.bind(null, c.id)}>
                    <ConfirmButton
                      message={`Slette "${c.name}"?`}
                      className="rounded-md bg-gfgk-red-light px-3 py-1.5 text-xs font-semibold text-gfgk-red-deep hover:bg-gfgk-red/20"
                    >
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
          <FAB aria-label="Ny sjekkliste">
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </FAB>
        </BottomSheetTrigger>
        <BottomSheetContent>
          <BottomSheetTitle>Ny sjekkliste</BottomSheetTitle>
          <form action={createChecklist} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Navn
              </label>
              <Input
                name="name"
                type="text"
                required
                autoFocus
                placeholder="F.eks. Morgen-åpning"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Beskrivelse (valgfri)
              </label>
              <Textarea name="description" rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                  Gjentakelse
                </label>
                <Select name="repeat" defaultValue="daglig">
                  <option value="daglig">Daglig</option>
                  <option value="ukentlig">Ukentlig</option>
                  <option value="manedlig">Månedlig (1. hver mnd)</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                  Rolle
                </label>
                <Select name="assignedRole" defaultValue="ansatt">
                  <option value="ansatt">Ansatt</option>
                  <option value="admin">Admin</option>
                  <option value="alle">Alle</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Ukedager (kun ved ukentlig)
              </label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => (
                  <label
                    key={d.value}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gfgk-cream-deep px-3 py-1.5 text-xs font-semibold text-gfgk-text"
                  >
                    <input
                      type="checkbox"
                      name="weekdays"
                      value={d.value}
                      className="h-3 w-3 accent-gfgk-gold"
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Punkter (én per linje)
              </label>
              <Textarea
                name="items"
                rows={6}
                required
                placeholder={'Sjekk parkeringen\nTøm søppel\nFyll vann'}
              />
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
