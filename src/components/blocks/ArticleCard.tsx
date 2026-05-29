import Link from 'next/link'
import { Pill } from '@/components/ui/Pill'
import type { ArticleCategory } from '@/db/schema'

interface ArticleCardProps {
  article: {
    slug: string
    title: string
    category: ArticleCategory
    body: string
    updatedAt: Date
  }
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

function excerpt(markdown: string, max = 140): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*_`>\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > max ? `${plain.slice(0, max)}...` : plain
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      href={`/kunnskap/${article.slug}`}
      className="block rounded-xl border border-gfgk-border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.06)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
    >
      <h3 className="text-base font-bold text-gfgk-text line-clamp-2">{article.title}</h3>
      <p className="mt-1 text-sm text-gfgk-text-2 line-clamp-2">
        {excerpt(article.body)}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Pill tone={CATEGORY_TONE[article.category]} size="sm">
          {CATEGORY_LABEL[article.category]}
        </Pill>
        <span className="text-xs text-gfgk-text-3">
          Oppdatert{' '}
          {article.updatedAt.toLocaleDateString('nb-NO', {
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </div>
    </Link>
  )
}
