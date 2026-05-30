import { Pencil } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { MarkdownView } from '@/components/blocks/MarkdownView'
import { Pill } from '@/components/ui/Pill'
import { SubHeader } from '@/components/ui/SubHeader'
import type { ArticleCategory } from '@/db/schema'
import { getArticleBySlug } from '@/lib/articles'

interface PageProps {
  params: Promise<{ slug: string }>
}

const CATEGORY_LABEL: Record<ArticleCategory, string> = {
  medlemskap: 'Medlemskap',
  drift: 'Drift',
  faq: 'FAQ',
  prosedyrer: 'Prosedyrer',
  annet: 'Annet',
}

const CATEGORY_TONE: Record<ArticleCategory, 'gold' | 'teal' | 'red' | 'neutral'> = {
  medlemskap: 'gold',
  drift: 'teal',
  faq: 'neutral',
  prosedyrer: 'red',
  annet: 'neutral',
}

export default async function ArtikkelPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  return (
    <>
      <main className="min-h-dvh pb-24">
        <SubHeader
          title={article.title}
          back={{ href: '/kunnskap', label: 'Kunnskap' }}
          action={
            session.user.role === 'admin' ? (
              <a
                href={`/admin/kunnskap/${article.id}/rediger`}
                className="rounded-lg p-1.5 text-gfgk-text-2 transition-colors hover:bg-gfgk-cream-deep hover:text-gfgk-text"
                aria-label="Rediger"
              >
                <Pencil className="h-5 w-5" />
              </a>
            ) : null
          }
        />

        <div className="space-y-4 px-6 pt-6">
          <div className="space-y-3">
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-gfgk-text">
              {article.title}
            </h1>
            <div className="flex items-center gap-2">
              <Pill tone={CATEGORY_TONE[article.category]} size="md">
                {CATEGORY_LABEL[article.category]}
              </Pill>
              <span className="text-xs text-gfgk-text-3">
                Oppdatert{' '}
                {article.updatedAt.toLocaleDateString('nb-NO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <MarkdownView content={article.body} />
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
