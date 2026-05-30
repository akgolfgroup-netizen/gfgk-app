import { BookOpen } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { ArticleCard } from '@/components/blocks/ArticleCard'
import { Chip, ChipBar } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { listArticles } from '@/lib/articles'
import type { ArticleCategory } from '@/db/schema'

interface PageProps {
  searchParams: Promise<{ kat?: string; q?: string }>
}

const CATEGORIES: Array<{ key: ArticleCategory | 'alle'; label: string }> = [
  { key: 'alle', label: 'Alle' },
  { key: 'medlemskap', label: 'Medlemskap' },
  { key: 'drift', label: 'Drift' },
  { key: 'faq', label: 'FAQ' },
  { key: 'prosedyrer', label: 'Prosedyrer' },
  { key: 'annet', label: 'Annet' },
]

const VALID: ArticleCategory[] = ['medlemskap', 'drift', 'faq', 'prosedyrer', 'annet']

export default async function KunnskapPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { kat, q } = await searchParams
  const category =
    kat && (VALID as string[]).includes(kat) ? (kat as ArticleCategory) : undefined
  const query = (q ?? '').trim() || undefined

  const articles = await listArticles({ category, query })

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader title="Kunnskap" subtitle="Klubbens informasjon og rutiner" />

        <div className="space-y-4 px-6 pt-4">
          {/* Søk */}
          <form action="/kunnskap" method="GET">
            {category && <input type="hidden" name="kat" value={category} />}
            <Input
              name="q"
              type="search"
              defaultValue={query ?? ''}
              placeholder="Søk i artikler..."
            />
          </form>

          {/* Kategori-chips */}
          <ChipBar>
            {CATEGORIES.map((c) => {
              const active = c.key === 'alle' ? !category : category === c.key
              const href =
                c.key === 'alle'
                  ? `/kunnskap${query ? `?q=${encodeURIComponent(query)}` : ''}`
                  : `/kunnskap?kat=${c.key}${query ? `&q=${encodeURIComponent(query)}` : ''}`
              return (
                <Chip key={c.key} active={active} href={href}>
                  {c.label}
                </Chip>
              )
            })}
          </ChipBar>

          {/* Resultater */}
          {articles.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={
                query
                  ? `Ingen treff for "${query}"`
                  : 'Ingen artikler enda'
              }
              description={
                session.user.role === 'admin'
                  ? 'Som admin kan du opprette artikler via /admin/kunnskap.'
                  : 'Admin har ikke lagt inn artikler i denne kategorien enda.'
              }
            />
          ) : (
            <div className="space-y-2">
              {articles.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
