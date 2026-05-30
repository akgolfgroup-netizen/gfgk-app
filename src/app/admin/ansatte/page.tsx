import { and, gt, isNull } from 'drizzle-orm'
import { headers } from 'next/headers'
import { getDb } from '@/db'
import { invites, users } from '@/db/schema'
import { ConfirmButton } from '@/components/ConfirmButton'
import { CopyButton } from '@/components/CopyButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { createInvite, revokeInvite } from '@/lib/invite'

export default async function AnsattePage() {
  const headersList = await headers()
  const db = getDb()

  const [allUsers, pendingInvites] = await Promise.all([
    db.select().from(users).orderBy(users.createdAt),
    db
      .select()
      .from(invites)
      .where(and(isNull(invites.usedAt), gt(invites.expiresAt, new Date())))
      .orderBy(invites.createdAt),
  ])

  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  return (
    <>
        <PageHeader title="Ansatte" back={{ href: '/admin', label: 'Admin' }} />

        <div className="px-6 pt-6 space-y-8">
          <section>
            <SectionLabel>Brukere ({allUsers.length})</SectionLabel>
            <div className="space-y-2">
              {allUsers.map((user) => (
                <a
                  key={user.id}
                  href={`/admin/ansatte/${user.id}`}
                  className="block rounded-lg border border-gfgk-border border-l-4 border-l-gfgk-gold bg-white px-4 py-3 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="font-semibold text-gfgk-text">{user.name ?? user.email}</p>
                  {user.name && <p className="text-sm text-gfgk-text-2">{user.email}</p>}
                  <p className="mt-1 text-xs text-gfgk-text-3 uppercase tracking-wide">
                    {user.role}
                    {!user.active && ' · Inaktiv'}
                  </p>
                </a>
              ))}
            </div>
          </section>

          {pendingInvites.length > 0 && (
            <section>
              <SectionLabel>Ventende invitasjoner ({pendingInvites.length})</SectionLabel>
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="rounded-lg border border-gfgk-border bg-gfgk-gold-light px-4 py-3 shadow-card space-y-2"
                  >
                    <p className="font-semibold text-gfgk-text">{invite.email}</p>
                    <p className="text-xs text-gfgk-text-2 uppercase tracking-wide">
                      {invite.role} · utløper {invite.expiresAt.toLocaleDateString('nb-NO')}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <CopyButton text={`${baseUrl}/invite/${invite.token}`} />
                      <form action={revokeInvite.bind(null, invite.id)}>
                        <ConfirmButton
                          message={`Trekke tilbake invitasjon til ${invite.email}?`}
                          className="rounded-md bg-gfgk-red-light px-3 py-1.5 text-xs font-semibold text-gfgk-red-deep hover:bg-gfgk-red/20 transition-colors"
                        >
                          Trekk tilbake
                        </ConfirmButton>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionLabel>Ny invitasjon</SectionLabel>
            <form action={createInvite} className="space-y-4 rounded-lg border border-gfgk-border bg-white p-4 shadow-card">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-gfgk-text">E-post</span>
                <input
                  name="email"
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="off"
                  className="w-full"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-gfgk-text">Rolle</span>
                <select name="role" className="w-full">
                  <option value="ansatt">Ansatt</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <button
                type="submit"
                className="w-full rounded-md bg-gfgk-gold py-3 text-sm font-bold text-gfgk-black hover:bg-gfgk-gold-deep transition-colors"
              >
                Generer invitasjonslenke
              </button>
            </form>
          </section>
        </div>
    </>
  )
}
