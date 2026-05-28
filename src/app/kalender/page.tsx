import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Calendar } from 'lucide-react'

/**
 * Placeholder — full kalender bygges i Sub-prosjekt C.
 */
export default async function KalenderPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader title="Kalender" subtitle="Aktiviteter og turneringer" />
        <div className="px-6 pt-12">
          <EmptyState
            icon={Calendar}
            title="Kommer snart"
            description="Aktivitetskalenderen blir tilgjengelig i neste oppdatering."
          />
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
