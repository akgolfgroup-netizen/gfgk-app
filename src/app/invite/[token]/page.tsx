import { and, eq, isNull } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { getDb } from '@/db'
import { invites } from '@/db/schema'
import { AcceptForm } from './AcceptForm'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const db = getDb()

  const [invite] = await db
    .select({ email: invites.email, expiresAt: invites.expiresAt, usedAt: invites.usedAt })
    .from(invites)
    .where(and(eq(invites.token, token), isNull(invites.usedAt)))
    .limit(1)

  if (!invite) redirect('/login?error=invite_invalid')
  if (invite.expiresAt < new Date()) redirect('/login?error=invite_expired')

  return (
    <main className="flex min-h-dvh flex-col justify-center px-6 pt-safe pb-safe">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-gfgk-text">Opprett konto</h1>
          <p className="text-sm text-gfgk-text-2">{invite.email}</p>
        </div>
        <AcceptForm token={token} />
      </div>
    </main>
  )
}
