import { Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { ConfirmButton } from '@/components/ConfirmButton'
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { shiftTemplates, users } from '@/db/schema'
import { createShiftTemplate, deleteShiftTemplate } from '@/lib/shift-templates'
import { generateShifts } from '@/lib/shift-generator'

interface PageProps {
  searchParams: Promise<{ uke?: string }>
}

async function runGenerator(formData: FormData) {
  'use server'
  const fromDate = (formData.get('fromDate') as string) ?? ''
  const numWeeks = parseInt((formData.get('numWeeks') as string) ?? '4', 10)
  const userIds = formData.getAll('userIds').map((v) => String(v))
  const templateIds = formData.getAll('templateIds').map((v) => String(v))

  if (!fromDate || isNaN(numWeeks) || userIds.length === 0 || templateIds.length === 0) {
    return
  }

  await generateShifts({ fromDate, numWeeks, userIds, templateIds })
  redirect(`/admin/vaktliste?uke=${fromDate}`)
}

export default async function GenererPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) return null
  if (session.user.role !== 'admin') redirect('/dashboard')

  const { uke } = await searchParams
  const fromDateDefault =
    uke || new Date().toISOString().slice(0, 10)

  const db = getDb()
  const [allUsers, templates] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        timerPerUke: users.timerPerUke,
        preferredShifts: users.preferredShifts,
      })
      .from(users)
      .where(eq(users.active, true))
      .orderBy(users.name),
    db.select().from(shiftTemplates).orderBy(shiftTemplates.startTime),
  ])

  return (
    <>
        <PageHeader
          title="Generer vakter"
          subtitle="Auto-fyll basert på preferanser og stillingsprosent"
          back={{ href: '/admin/vaktliste', label: 'Vaktliste' }}
          maxWidth="3xl"
        />

        <div className="space-y-6 px-6 pt-6 lg:mx-auto lg:max-w-3xl">
          <form action={runGenerator} className="space-y-6">
            {/* Periode */}
            <section>
              <SectionLabel>Periode</SectionLabel>
              <Card padding="md" className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                      Fra dato
                    </label>
                    <Input
                      name="fromDate"
                      type="date"
                      required
                      defaultValue={fromDateDefault}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                      Antall uker
                    </label>
                    <Input
                      name="numWeeks"
                      type="number"
                      required
                      min="1"
                      max="12"
                      defaultValue="4"
                    />
                  </div>
                </div>
              </Card>
            </section>

            {/* Vakt-maler */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <SectionLabel className="mb-0">Vakt-maler</SectionLabel>
                <BottomSheet>
                  <BottomSheetTrigger asChild>
                    <Button variant="ghost" size="sm" type="button">
                      <Plus className="h-4 w-4" />
                      Ny mal
                    </Button>
                  </BottomSheetTrigger>
                  <BottomSheetContent>
                    <BottomSheetTitle>Ny vakt-mal</BottomSheetTitle>
                    <form action={createShiftTemplate} className="space-y-3">
                      <Input name="name" type="text" required placeholder="F.eks. Morgen" />
                      <div className="grid grid-cols-2 gap-3">
                        <Input name="startTime" type="time" required />
                        <Input name="endTime" type="time" required />
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
              </div>
              {templates.length === 0 ? (
                <EmptyState
                  icon={Plus}
                  title="Ingen maler enda"
                  description="Lag minst én vakt-mal (f.eks. Morgen 07–14)."
                />
              ) : (
                <Card padding="sm" className="space-y-2">
                  {templates.map((t) => (
                    <label
                      key={t.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-gfgk-cream-deep"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          name="templateIds"
                          value={t.id}
                          defaultChecked
                          className="h-4 w-4 accent-gfgk-gold"
                        />
                        <span className="text-sm font-semibold text-gfgk-text">
                          {t.name}
                        </span>
                        <span className="text-xs text-gfgk-text-2">
                          {t.startTime}–{t.endTime} · {parseFloat(t.hours).toFixed(1)} t
                        </span>
                      </div>
                      <form
                        action={async () => {
                          'use server'
                          await deleteShiftTemplate(t.id)
                        }}
                      >
                        <ConfirmButton
                          message={`Slette mal "${t.name}"?`}
                          className="rounded-md px-2 py-0.5 text-[11px] font-semibold text-gfgk-red-deep hover:bg-gfgk-red-light"
                        >
                          Slett
                        </ConfirmButton>
                      </form>
                    </label>
                  ))}
                </Card>
              )}
            </section>

            {/* Ansatte */}
            <section>
              <SectionLabel>Ansatte å inkludere</SectionLabel>
              {allUsers.length === 0 ? (
                <p className="text-sm text-gfgk-text-3">Ingen aktive ansatte.</p>
              ) : (
                <Card padding="sm" className="space-y-2">
                  {allUsers.map((u) => (
                    <label
                      key={u.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-gfgk-cream-deep"
                    >
                      <input
                        type="checkbox"
                        name="userIds"
                        value={u.id}
                        defaultChecked
                        className="h-4 w-4 accent-gfgk-gold"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gfgk-text">
                          {u.name ?? u.email}
                        </p>
                        <p className="text-xs text-gfgk-text-2">
                          {u.timerPerUke ? `${parseFloat(u.timerPerUke)} t/uke` : 'Ingen timer-mål'}
                          {u.preferredShifts && u.preferredShifts.length > 0
                            ? ` · ${u.preferredShifts.join(', ')}`
                            : ''}
                        </p>
                      </div>
                      {(u.preferredShifts ?? []).map((s) => (
                        <Pill key={s} tone="neutral" size="sm">
                          {s}
                        </Pill>
                      ))}
                    </label>
                  ))}
                </Card>
              )}
            </section>

            <Button type="submit" variant="primary" size="lg" fullWidth>
              Generer forslag
            </Button>
            <p className="text-xs text-gfgk-text-2">
              Forslagene lagres som ikke-publisert. Du kan justere manuelt før du publiserer.
            </p>
          </form>
        </div>
    </>
  )
}
