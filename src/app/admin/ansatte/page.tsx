import { and, gt, isNull } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { invites, users } from '@/db/schema'
import { BottomNav } from '@/components/BottomNav'
import { CopyButton } from '@/components/CopyButton'
import { createInvite, revokeInvite } from '@/lib/invite'

export default async function AnsattePage() {
  const [session, headersList] = await Promise.all([auth(), headers()])
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
      <main className="min-h-dvh px-6 pt-safe pb-24">
        <header className="py-6">
          <a href="/admin" className="text-sm text-neutral-500">
            ← Admin
          </a>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Ansatte</h1>
        </header>

        <section className="mb-8 space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Brukere ({allUsers.length})
          </h2>
          {allUsers.map((user) => (
            <div key={user.id} className="rounded-2xl border border-neutral-200 p-4">
              <p className="font-medium">{user.name ?? user.email}</p>
              {user.name && <p className="text-sm text-neutral-500">{user.email}</p>}
              <p className="mt-1 text-xs text-neutral-400">{user.role}</p>
            </div>
          ))}
        </section>

        {pendingInvites.length > 0 && (
          <section className="mb-8 space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Ventende invitasjoner ({pendingInvites.length})
            </h2>
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="rounded-2xl border border-neutral-200 p-4 space-y-2">
                <p className="font-medium">{invite.email}</p>
                <p className="text-xs text-neutral-400">
                  {invite.role} · utløper {invite.expiresAt.toLocaleDateString('nb-NO')}
                </p>
                <div className="flex gap-2 pt-1">
                  <CopyButton text={`${baseUrl}/invite/${invite.token}`} />
                  <form action={revokeInvite.bind(null, invite.id)}>
                    <button
                      type="submit"
                      className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600"
                    >
                      Trekk tilbake
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </section>
        )}

        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Ny invitasjon
          </h2>
          <form action={createInvite} className="space-y-4 rounded-2xl border border-neutral-200 p-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">E-post</span>
              <input
                name="email"
                type="email"
                required
                inputMode="email"
                autoComplete="off"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Rolle</span>
              <select
                name="role"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-neutral-900"
              >
                <option value="ansatt">Ansatt</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-neutral-900 py-3 text-sm font-medium text-white"
            >
              Generer invitasjonslenke
            </button>
          </form>
        </section>
      </main>
      <BottomNav role={session!.user.role} />
    </>
  )
}
