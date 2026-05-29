'use server'

import { and, desc, eq, ilike, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { articles, type ArticleCategory } from '@/db/schema'

const VALID_CATEGORIES: ArticleCategory[] = [
  'medlemskap',
  'drift',
  'faq',
  'prosedyrer',
  'annet',
]

function isCategory(c: string): c is ArticleCategory {
  return (VALID_CATEGORIES as string[]).includes(c)
}

async function requireAdmin(): Promise<{ id: string } | null> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return { id: session.user.id }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const db = getDb()
  let slug = base
  let counter = 1
  while (true) {
    const [hit] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1)
    if (!hit || hit.id === excludeId) return slug
    counter++
    slug = `${base}-${counter}`
  }
}

export async function createArticle(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  const title = ((formData.get('title') as string) ?? '').trim()
  const body = ((formData.get('body') as string) ?? '').trim()
  const categoryRaw = (formData.get('category') as string) ?? 'annet'
  const category: ArticleCategory = isCategory(categoryRaw) ? categoryRaw : 'annet'

  if (!title || !body) return

  const slug = await uniqueSlug(slugify(title))

  await getDb().insert(articles).values({
    slug,
    title,
    body,
    category,
    published: true,
    createdBy: admin.id,
    updatedBy: admin.id,
  })

  revalidatePath('/kunnskap')
  revalidatePath('/admin/kunnskap')
  redirect(`/kunnskap/${slug}`)
}

export async function updateArticle(id: string, formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  const title = ((formData.get('title') as string) ?? '').trim()
  const body = ((formData.get('body') as string) ?? '').trim()
  const categoryRaw = (formData.get('category') as string) ?? 'annet'
  const category: ArticleCategory = isCategory(categoryRaw) ? categoryRaw : 'annet'

  if (!title || !body) return

  await getDb()
    .update(articles)
    .set({
      title,
      body,
      category,
      updatedAt: new Date(),
      updatedBy: admin.id,
    })
    .where(eq(articles.id, id))

  revalidatePath('/kunnskap')
  revalidatePath('/admin/kunnskap')
}

export async function deleteArticle(id: string): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  await getDb().delete(articles).where(eq(articles.id, id))
  revalidatePath('/kunnskap')
  revalidatePath('/admin/kunnskap')
  redirect('/admin/kunnskap')
}

export async function listArticles(opts?: {
  category?: ArticleCategory
  query?: string
  limit?: number
}) {
  const db = getDb()
  const conditions = [eq(articles.published, true)]
  if (opts?.category) conditions.push(eq(articles.category, opts.category))
  if (opts?.query) {
    const q = `%${opts.query}%`
    const search = or(ilike(articles.title, q), ilike(articles.body, q))
    if (search) conditions.push(search)
  }

  return db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      category: articles.category,
      updatedAt: articles.updatedAt,
      body: articles.body,
    })
    .from(articles)
    .where(and(...conditions))
    .orderBy(desc(articles.updatedAt))
    .limit(opts?.limit ?? 50)
}

export async function getArticleBySlug(slug: string) {
  const [article] = await getDb()
    .select()
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1)
  return article ?? null
}

export async function listAllArticlesForAdmin() {
  return getDb().select().from(articles).orderBy(desc(articles.updatedAt))
}

/**
 * Lite RAG-helper: hent topp-N artikler matchet på keyword fra body/title.
 * For Sub-prosjekt D bruker vi enkel ilike-match. Full embedding-search kan
 * legges til senere.
 */
export async function findRelevantArticles(keywords: string[], limit = 3) {
  if (keywords.length === 0) return []
  const db = getDb()
  const terms = keywords.slice(0, 5).map((k) => `%${k.replace(/[%_]/g, '')}%`)
  const orMatch = or(
    ...terms.flatMap((t) => [ilike(articles.title, t), ilike(articles.body, t)]),
  )
  if (!orMatch) return []
  return db
    .select({ title: articles.title, body: articles.body, slug: articles.slug })
    .from(articles)
    .where(and(eq(articles.published, true), orMatch))
    .limit(limit)
}
