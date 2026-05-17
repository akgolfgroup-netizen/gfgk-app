import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { BottomNav } from '@/components/BottomNav'

async function signOutAction() {
  'use server'
  await signOut({ redirectTo: '/login' })
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <>
      <main className="min-h-dvh px-6 pt-safe pb-24">
        <header className="py-6">
          <h1 className="text-2xl font-semibold tracking-tight">Velkommen</h1>
          <p className="text-sm text-neutral-600">{session.user.email}</p>
          <p className="text-xs text-neutral-500">Rolle: {session.user.role}</p>
        </header>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm"
          >
            Logg ut
          </button>
        </form>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
