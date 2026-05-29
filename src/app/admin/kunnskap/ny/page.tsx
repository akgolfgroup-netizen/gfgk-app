import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { MarkdownEditor } from '@/components/blocks/MarkdownEditor'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { createArticle } from '@/lib/articles'

export default async function NyArtikkelPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'admin') redirect('/kunnskap')

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader
          title="Ny artikkel"
          back={{ href: '/admin/kunnskap', label: 'Kunnskap' }}
        />

        <div className="px-6 pt-6">
          <form action={createArticle} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Tittel
              </label>
              <Input
                name="title"
                type="text"
                required
                autoFocus
                placeholder="F.eks. Slik melder du inn nye medlemmer"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Kategori
              </label>
              <Select name="category" defaultValue="annet">
                <option value="medlemskap">Medlemskap</option>
                <option value="drift">Drift</option>
                <option value="faq">FAQ</option>
                <option value="prosedyrer">Prosedyrer</option>
                <option value="annet">Annet</option>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Innhold (Markdown)
              </label>
              <MarkdownEditor
                name="body"
                rows={14}
                required
                placeholder="## Overskrift&#10;&#10;Skriv innholdet her..."
              />
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth>
              Publiser
            </Button>
          </form>
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
