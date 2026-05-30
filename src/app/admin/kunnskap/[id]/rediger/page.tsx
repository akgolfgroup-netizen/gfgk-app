import { eq } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { MarkdownEditor } from '@/components/blocks/MarkdownEditor'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { getDb } from '@/db'
import { articles } from '@/db/schema'
import { updateArticle } from '@/lib/articles'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RedigerArtikkelPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'admin') redirect('/kunnskap')

  const { id } = await params
  const [article] = await getDb().select().from(articles).where(eq(articles.id, id)).limit(1)
  if (!article) notFound()

  return (
    <>
        <PageHeader
          title="Rediger artikkel"
          subtitle={article.title}
          back={{ href: `/kunnskap/${article.slug}`, label: 'Tilbake' }}
          maxWidth="3xl"
        />

        <div className="px-6 pt-6 lg:mx-auto lg:max-w-3xl">
          <form action={updateArticle.bind(null, id)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Tittel
              </label>
              <Input name="title" type="text" required defaultValue={article.title} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Kategori
              </label>
              <Select name="category" defaultValue={article.category}>
                <option value="medlemskap">Medlemskap</option>
                <option value="priser">Priser</option>
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
              <MarkdownEditor name="body" rows={14} required defaultValue={article.body} />
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth>
              Lagre endringer
            </Button>
          </form>
        </div>
    </>
  )
}
