import { FileText } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { DocumentCard } from '@/components/blocks/DocumentCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { listDocumentsForUser } from '@/lib/documents'

export default async function ProfilDokumenterPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const docs = await listDocumentsForUser(session.user.id)

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader
          title="Mine dokumenter"
          subtitle="Kontrakter, attester og felles dokumenter"
          back={{ href: '/profil', label: 'Profil' }}
        />

        <div className="px-6 pt-6">
          {docs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Ingen dokumenter enda"
              description="Admin laster opp dokumenter for deg her."
            />
          ) : (
            <div className="space-y-2">
              {docs.map((d) => (
                <DocumentCard key={d.id} doc={d} canDelete={false} />
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
