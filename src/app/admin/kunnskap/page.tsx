import { BookOpen, Plus } from 'lucide-react'
import Link from 'next/link'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { ConfirmButton } from '@/components/ConfirmButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { FAB } from '@/components/ui/FAB'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import type { ArticleCategory } from '@/db/schema'
import { deleteArticle, listAllArticlesForAdmin } from '@/lib/articles'

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

export default async function AdminKunnskapPage() {
  const session = await auth()
  if (!session?.user) return null

  const articles = await listAllArticlesForAdmin()

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader
          title="Kunnskap"
          subtitle="Administrer artikler"
          back={{ href: '/admin', label: 'Admin' }}
        />

        <div className="px-6 pt-6">
          {articles.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Ingen artikler enda"
              description="Tap + nede til høyre for å lage den første."
            />
          ) : (
            <div className="space-y-2">
              {articles.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-gfgk-border bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,.06)]"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <Link
                      href={`/kunnskap/${a.slug}`}
                      className="min-w-0 flex-1 hover:underline"
                    >
                      <p className="truncate text-sm font-semibold text-gfgk-text">
                        {a.title}
                      </p>
                      <p className="text-xs text-gfgk-text-3">/{a.slug}</p>
                    </Link>
                    <Pill tone={CATEGORY_TONE[a.category]} size="sm">
                      {CATEGORY_LABEL[a.category]}
                    </Pill>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/kunnskap/${a.id}/rediger`}
                      className="rounded-md bg-gfgk-cream-deep px-3 py-1.5 text-xs font-semibold text-gfgk-text hover:bg-gfgk-cream"
                    >
                      Rediger
                    </Link>
                    <form action={deleteArticle.bind(null, a.id)}>
                      <ConfirmButton
                        message={`Slette "${a.title}"?`}
                        className="rounded-md bg-gfgk-red-light px-3 py-1.5 text-xs font-semibold text-gfgk-red-deep hover:bg-gfgk-red/20"
                      >
                        Slett
                      </ConfirmButton>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <FAB asChild aria-label="Ny artikkel">
        <Link href="/admin/kunnskap/ny">
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </Link>
      </FAB>

      <BottomNav role={session.user.role} />
    </>
  )
}
