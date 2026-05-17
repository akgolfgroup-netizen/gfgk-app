import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { BottomNav } from '@/components/BottomNav'

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <>
      <main className="min-h-dvh px-6 pt-safe pb-24">
        <header className="py-6">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
          <p className="text-sm text-neutral-600">{user.email}</p>
        </header>
      </main>
      <BottomNav />
    </>
  )
}
