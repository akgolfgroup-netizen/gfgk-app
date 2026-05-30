import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { getDb } from '@/db'
import { timeEntries, users } from '@/db/schema'
import { AvatarUpload } from '@/components/blocks/AvatarUpload'
import { PreferredShiftChips } from '@/components/blocks/PreferredShiftChips'
import { AppShell } from '@/components/AppShell'
import { ConfirmButton } from '@/components/ConfirmButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { toDateString } from '@/lib/dates'
import {
  changePassword,
  togglePreferredShift,
  updateName,
  updatePhone,
  updateWorkInfo,
  uploadAvatarAction,
} from '@/lib/profile'
import { createTimeEntry, deleteTimeEntry } from '@/lib/timeEntries'
import { cancelTimeOff, listUpcomingTimeOff, requestTimeOff } from '@/lib/time-off'
import { Pill } from '@/components/ui/Pill'
import { Select } from '@/components/ui/Select'

async function signOutAction() {
  'use server'
  await signOut({ redirectTo: '/login' })
}

function formatHours(h: string | number) {
  return `${parseFloat(String(h)).toFixed(1)} t`
}

export default async function ProfilPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const db = getDb()
  const [me] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!me) redirect('/login')

  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthEnd = toDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  const today = toDateString(now)

  const myMonthEntries = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, me.id),
        gte(timeEntries.date, monthStart),
        lte(timeEntries.date, monthEnd),
      ),
    )
    .orderBy(desc(timeEntries.date))

  const totalHours = myMonthEntries.reduce((s, e) => s + parseFloat(e.hours), 0)
  const preferredShifts = me.preferredShifts ?? []
  const upcomingTimeOff = await listUpcomingTimeOff(me.id)

  return (
    <AppShell role={me.role} userName={me.name ?? null}>
        <PageHeader title="Min profil" subtitle={me.email} />

        <div className="space-y-8 px-6 pt-6">
          {/* Avatar + identitet */}
          <section className="flex flex-col items-center gap-3">
            <AvatarUpload
              src={me.avatarUrl}
              name={me.name}
              email={me.email}
              onUpload={uploadAvatarAction}
            />
            <p className="text-xs text-gfgk-text-3">Tap bildet for å endre</p>
          </section>

          {/* Personlig info */}
          <section>
            <SectionLabel>Personlig informasjon</SectionLabel>
            <Card padding="md" className="space-y-4">
              <form action={updateName} className="space-y-2">
                <label className="block text-sm font-semibold text-gfgk-text">
                  Navn
                </label>
                <Input
                  name="name"
                  type="text"
                  required
                  defaultValue={me.name ?? ''}
                  autoComplete="name"
                />
                <Button type="submit" size="sm" className="mt-2">
                  Lagre
                </Button>
              </form>

              <form action={updatePhone} className="space-y-2">
                <label className="block text-sm font-semibold text-gfgk-text">
                  Telefon
                </label>
                <Input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+47 ..."
                  defaultValue={me.phone ?? ''}
                  autoComplete="tel"
                />
                <Button type="submit" size="sm" className="mt-2">
                  Lagre
                </Button>
              </form>
            </Card>
          </section>

          {/* Arbeid */}
          <section>
            <SectionLabel>Arbeid</SectionLabel>
            <Card padding="md" className="space-y-4">
              <form action={updateWorkInfo} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                      Stillingsprosent
                    </label>
                    <Input
                      name="stillingsprosent"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="100"
                      defaultValue={me.stillingsprosent ?? ''}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                      Timer per uke
                    </label>
                    <Input
                      name="timerPerUke"
                      type="number"
                      min="0"
                      max="80"
                      step="0.5"
                      placeholder="37.5"
                      defaultValue={me.timerPerUke ?? ''}
                    />
                  </div>
                </div>
                <Button type="submit" size="sm">
                  Lagre
                </Button>
              </form>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gfgk-text">
                  Foretrukne vakter
                </label>
                <PreferredShiftChips
                  current={preferredShifts}
                  onToggle={togglePreferredShift}
                />
              </div>
            </Card>
          </section>

          {/* Passord */}
          <section>
            <SectionLabel>Bytt passord</SectionLabel>
            <Card padding="md">
              <form action={changePassword} className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                    Nåværende passord
                  </label>
                  <Input
                    name="current"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                    Nytt passord
                  </label>
                  <Input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                    Bekreft nytt passord
                  </label>
                  <Input
                    name="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" size="md">
                  Bytt passord
                </Button>
              </form>
            </Card>
          </section>

          {/* Timer denne måneden */}
          <section>
            <SectionLabel>Timer denne måneden</SectionLabel>

            <Card padding="md" accent="gold" className="mb-3 !bg-gfgk-black !border-gfgk-border">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-white/50">
                Totalt
              </p>
              <p className="mt-1 text-2xl font-extrabold text-gfgk-gold">
                {totalHours.toFixed(1)} timer
              </p>
            </Card>

            {myMonthEntries.length > 0 && (
              <div className="mb-4 space-y-2">
                {myMonthEntries.map((entry) => (
                  <Card
                    key={entry.id}
                    padding="sm"
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gfgk-text">
                        {formatHours(entry.hours)}
                      </p>
                      <p className="text-xs text-gfgk-text-2">
                        {new Date(entry.date + 'T00:00:00').toLocaleDateString('nb-NO', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                        {entry.note ? ` · ${entry.note}` : ''}
                      </p>
                    </div>
                    <form action={deleteTimeEntry.bind(null, entry.id)}>
                      <ConfirmButton
                        message="Slette denne timeregistreringen?"
                        className="rounded-md bg-gfgk-red-light px-3 py-1 text-xs font-semibold text-gfgk-red-deep transition-colors hover:bg-gfgk-red/20"
                      >
                        Slett
                      </ConfirmButton>
                    </form>
                  </Card>
                ))}
              </div>
            )}

            <Card padding="md">
              <form action={createTimeEntry} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                      Dato
                    </label>
                    <Input name="date" type="date" required defaultValue={today} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                      Timer
                    </label>
                    <Input
                      name="hours"
                      type="number"
                      required
                      min="0.5"
                      max="24"
                      step="0.5"
                      placeholder="7.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                    Notat (valgfritt)
                  </label>
                  <Input name="note" type="text" />
                </div>
                <Button type="submit" fullWidth size="lg">
                  Registrer timer
                </Button>
              </form>
            </Card>
          </section>

          {/* Mine dokumenter + varsler */}
          <section className="space-y-3">
            <SectionLabel>Mer</SectionLabel>
            <Card padding="md" interactive>
              <a
                href="/profil/dokumenter"
                className="flex items-center justify-between"
              >
                <span className="text-sm font-semibold text-gfgk-text">
                  Mine dokumenter
                </span>
                <span className="text-sm text-gfgk-text-2">Åpne →</span>
              </a>
            </Card>
            <Card padding="md" interactive>
              <a
                href="/profil/varsler"
                className="flex items-center justify-between"
              >
                <span className="text-sm font-semibold text-gfgk-text">Varsler</span>
                <span className="text-sm text-gfgk-text-2">Åpne →</span>
              </a>
            </Card>
          </section>

          {/* Ferie */}
          <section>
            <SectionLabel>Ferie og fri</SectionLabel>
            <Card padding="md" className="space-y-3">
              {upcomingTimeOff.length > 0 && (
                <div className="space-y-2">
                  {upcomingTimeOff.map((t) => {
                    const start = new Date(t.startDate + 'T00:00:00')
                    const end = new Date(t.endDate + 'T00:00:00')
                    const tone =
                      t.status === 'approved'
                        ? 'teal'
                        : t.status === 'declined'
                          ? 'red'
                          : 'gold'
                    const label =
                      t.status === 'approved'
                        ? 'Godkjent'
                        : t.status === 'declined'
                          ? 'Avvist'
                          : 'Venter'
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-gfgk-border bg-white p-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gfgk-text">
                            {start.toLocaleDateString('nb-NO', {
                              day: 'numeric',
                              month: 'short',
                            })}
                            {' – '}
                            {end.toLocaleDateString('nb-NO', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                          <p className="text-xs text-gfgk-text-2 capitalize">
                            {t.type}
                            {t.note ? ` · ${t.note}` : ''}
                          </p>
                        </div>
                        <Pill tone={tone} size="sm">
                          {label}
                        </Pill>
                        {t.status === 'pending' && (
                          <form
                            action={async () => {
                              'use server'
                              await cancelTimeOff(t.id)
                            }}
                          >
                            <ConfirmButton
                              message="Avbryt forespørsel?"
                              className="rounded-md px-2 py-1 text-xs font-semibold text-gfgk-red-deep hover:bg-gfgk-red-light"
                            >
                              Avbryt
                            </ConfirmButton>
                          </form>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <form action={requestTimeOff} className="space-y-2">
                <p className="text-sm font-semibold text-gfgk-text">Ny forespørsel</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input name="startDate" type="date" required />
                  <Input name="endDate" type="date" required />
                </div>
                <Select name="type" defaultValue="ferie">
                  <option value="ferie">Ferie</option>
                  <option value="sykemelding">Sykemelding</option>
                  <option value="permisjon">Permisjon</option>
                </Select>
                <Input name="note" type="text" placeholder="Notat (valgfri)" />
                <Button type="submit" size="sm" fullWidth>
                  Send forespørsel
                </Button>
              </form>
            </Card>
          </section>

          {/* Logg ut */}
          <section>
            <form action={signOutAction}>
              <Button type="submit" variant="secondary" fullWidth>
                Logg ut
              </Button>
            </form>
          </section>
        </div>
    </AppShell>
  )
}
