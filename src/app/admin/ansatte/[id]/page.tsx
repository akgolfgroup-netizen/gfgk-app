import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { ConfirmButton } from '@/components/ConfirmButton'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Select } from '@/components/ui/Select'
import {
  deleteEmployee,
  toggleEmployeeActive,
  updateEmployee,
} from '@/lib/users-admin'
import { listAllTimeOff, setTimeOffStatus } from '@/lib/time-off'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AnsattDetaljPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) return null

  const { id } = await params
  const [user] = await getDb().select().from(users).where(eq(users.id, id)).limit(1)
  if (!user) notFound()

  const isSelf = session.user.id === user.id
  const preferred = user.preferredShifts ?? []
  const timeOffRows = await listAllTimeOff(user.id)

  return (
    <>
        <PageHeader
          title={user.name ?? user.email}
          subtitle={user.email}
          back={{ href: '/admin/ansatte', label: 'Ansatte' }}
        />

        <div className="space-y-8 px-6 pt-6">
          {/* Avatar + status */}
          <section className="flex flex-col items-center gap-3">
            <Avatar
              size="xl"
              src={user.avatarUrl}
              name={user.name}
              email={user.email}
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Pill tone={user.role === 'admin' ? 'black' : 'gold'} size="md">
                {user.role}
              </Pill>
              <Pill tone={user.active ? 'teal' : 'red'} size="md">
                {user.active ? 'Aktiv' : 'Inaktiv'}
              </Pill>
            </div>
            {preferred.length > 0 && (
              <p className="text-xs text-gfgk-text-2">
                Foretrekker: {preferred.join(', ')}
              </p>
            )}
          </section>

          {/* Rask-lenker */}
          <section className="grid grid-cols-2 gap-2">
            <a
              href={`/admin/ansatte/${user.id}/dokumenter`}
              className="rounded-xl border border-gfgk-border bg-white px-4 py-3 text-center text-sm font-semibold text-gfgk-text transition-colors hover:bg-gfgk-cream-deep"
            >
              Dokumenter →
            </a>
          </section>

          {/* Rediger felter */}
          <section>
            <SectionLabel>Rediger ansatt</SectionLabel>
            <Card padding="md">
              <form action={updateEmployee.bind(null, user.id)} className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                    Navn
                  </label>
                  <Input
                    name="name"
                    type="text"
                    defaultValue={user.name ?? ''}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                    Telefon
                  </label>
                  <Input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    defaultValue={user.phone ?? ''}
                    placeholder="+47 ..."
                  />
                </div>

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
                      defaultValue={user.stillingsprosent ?? ''}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                      Timer/uke
                    </label>
                    <Input
                      name="timerPerUke"
                      type="number"
                      min="0"
                      max="80"
                      step="0.5"
                      placeholder="37.5"
                      defaultValue={user.timerPerUke ?? ''}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                    Timesats (kr)
                  </label>
                  <Input
                    name="hourlyRate"
                    type="number"
                    min="0"
                    placeholder="250"
                    defaultValue={user.hourlyRate ?? ''}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                    Rolle
                  </label>
                  <Select name="role" defaultValue={user.role} disabled={isSelf}>
                    <option value="ansatt">Ansatt</option>
                    <option value="admin">Admin</option>
                  </Select>
                  {isSelf && (
                    <p className="mt-1 text-xs text-gfgk-text-3">
                      Du kan ikke endre din egen rolle.
                    </p>
                  )}
                </div>

                <Button type="submit" fullWidth size="lg">
                  Lagre endringer
                </Button>
              </form>
            </Card>
          </section>

          {/* Ferie og fri */}
          {timeOffRows.length > 0 && (
            <section>
              <SectionLabel>Ferie og fri</SectionLabel>
              <Card padding="md" className="space-y-2">
                {timeOffRows.map((t) => {
                  const start = new Date(t.startDate + 'T00:00:00')
                  const end = new Date(t.endDate + 'T00:00:00')
                  const tone =
                    t.status === 'approved'
                      ? 'teal'
                      : t.status === 'declined'
                        ? 'red'
                        : 'gold'
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
                            year: 'numeric',
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
                        {t.status === 'approved'
                          ? 'Godkjent'
                          : t.status === 'declined'
                            ? 'Avvist'
                            : 'Venter'}
                      </Pill>
                      {t.status === 'pending' && (
                        <div className="flex gap-1">
                          <form
                            action={async () => {
                              'use server'
                              await setTimeOffStatus(t.id, 'approved')
                            }}
                          >
                            <Button type="submit" size="sm" variant="primary">
                              OK
                            </Button>
                          </form>
                          <form
                            action={async () => {
                              'use server'
                              await setTimeOffStatus(t.id, 'declined')
                            }}
                          >
                            <Button type="submit" size="sm" variant="destructive">
                              Avvis
                            </Button>
                          </form>
                        </div>
                      )}
                    </div>
                  )
                })}
              </Card>
            </section>
          )}

          {/* Farlig sone */}
          {!isSelf && (
            <section>
              <SectionLabel>Tilgang</SectionLabel>
              <Card padding="md" className="space-y-3">
                <form action={toggleEmployeeActive.bind(null, user.id)}>
                  <Button
                    type="submit"
                    variant={user.active ? 'secondary' : 'primary'}
                    fullWidth
                  >
                    {user.active ? 'Deaktiver konto' : 'Aktiver konto'}
                  </Button>
                  <p className="mt-2 text-xs text-gfgk-text-2">
                    {user.active
                      ? 'Inaktive ansatte kan ikke logge inn og hoppes over i vaktgenerering.'
                      : 'Aktiverer kontoen igjen så ansatt kan logge inn.'}
                  </p>
                </form>

                <form action={deleteEmployee.bind(null, user.id)}>
                  <ConfirmButton
                    message={`Slette ${user.name ?? user.email} permanent?`}
                    className="w-full rounded-lg bg-gfgk-red-light px-4 py-3 text-sm font-bold text-gfgk-red-deep transition-colors hover:bg-gfgk-red/20"
                  >
                    Slett permanent
                  </ConfirmButton>
                  <p className="mt-2 text-xs text-gfgk-text-2">
                    Sletting feiler hvis ansatt har timer eller vakter registrert.
                    Bruk deaktivering i stedet.
                  </p>
                </form>
              </Card>
            </section>
          )}
        </div>
    </>
  )
}
