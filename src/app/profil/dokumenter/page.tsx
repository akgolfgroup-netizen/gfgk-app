import { FileText } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { DocumentCard } from '@/components/blocks/DocumentCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { SubHeader } from '@/components/ui/SubHeader'
import { listDocumentsForUser } from '@/lib/documents'

export default async function ProfilDokumenterPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const docs = await listDocumentsForUser(session.user.id)

  return (
    <AppShell role={session.user.role} userName={session.user.name ?? null}>
        <SubHeader
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
    </AppShell>
  )
}
