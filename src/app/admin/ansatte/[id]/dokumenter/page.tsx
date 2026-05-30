import { eq } from 'drizzle-orm'
import { FileText } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { DocumentCard } from '@/components/blocks/DocumentCard'
import { DocumentUploader } from '@/components/blocks/DocumentUploader'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { deleteDocument, listDocumentsByUser, uploadDocument } from '@/lib/documents'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminAnsattDokumenterPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params
  const [user] = await getDb().select().from(users).where(eq(users.id, id)).limit(1)
  if (!user) notFound()

  const docs = await listDocumentsByUser(id)

  return (
    <>
        <PageHeader
          title="Dokumenter"
          subtitle={user.name ?? user.email}
          back={{ href: `/admin/ansatte/${id}`, label: user.name ?? user.email }}
          maxWidth="3xl"
        />

        <div className="space-y-6 px-6 pt-6 lg:mx-auto lg:max-w-3xl">
          {docs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Ingen dokumenter enda"
              description="Last opp kontrakter, attester eller andre filer."
            />
          ) : (
            <div className="space-y-2">
              {docs.map((d) => (
                <DocumentCard
                  key={d.id}
                  doc={d}
                  canDelete={true}
                  onDelete={deleteDocument}
                />
              ))}
            </div>
          )}

          <DocumentUploader userId={id} onUpload={uploadDocument} />
        </div>
    </>
  )
}
