import { signOut } from '@/auth'
import type { Role } from '@/db/schema'
import { BottomNav } from '@/components/BottomNav'
import { DesktopSidebar } from '@/components/DesktopSidebar'

async function signOutAction() {
  'use server'
  await signOut({ redirectTo: '/login' })
}

export function AppShell({
  role,
  userName,
  children,
}: {
  role: Role
  userName: string | null
  children: React.ReactNode
}) {
  return (
    <>
      <DesktopSidebar role={role} userName={userName} signOutAction={signOutAction} />
      <div className="lg:pl-60">
        <main className="min-h-dvh pb-24 lg:pb-0">{children}</main>
      </div>
      <div className="lg:hidden">
        <BottomNav role={role} />
      </div>
    </>
  )
}
