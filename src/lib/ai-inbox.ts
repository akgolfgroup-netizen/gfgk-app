'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { inboxMessages, inboxSkills } from '@/db/schema'
import { findRelevantArticles } from '@/lib/articles'
import { chat } from '@/lib/ai-client'

const BASE_PROMPT = `Du er Servicepunkt-assistenten for Gamle Fredrikstad Golfklubb (GFGK).

Du skriver korte, profesjonelle e-postsvar på norsk bokmål til medlemmer og kunder.

Regler:
- Aldri utropstegn
- Aldri emojis
- Aldri "selvsagt", "absolutt" eller "selvfølgelig"
- Bruk spørsmål når noe er uklart, ikke gjetting
- Signer med "Vennlig hilsen\\nServicepunkt · GFGK"
- Hold svaret kort (3-6 setninger pluss signatur)
- Hvis du ikke vet svaret, foreslå at admin kontaktes`

interface GenerateDraftInput {
  fromName: string | null
  fromEmail: string
  subject: string
  bodyText: string | null
  bodyHtml: string | null
}

interface GenerateDraftResult {
  draft: string
  skillUsed: string | null
}

/**
 * Velg en relevant skill ut fra emne + body.
 * Returnerer den første skill som matcher på keyword fra navn/beskrivelse,
 * eller null hvis ingen treff.
 */
async function pickRelevantSkill(
  subject: string,
  body: string,
): Promise<{ name: string; prompt: string } | null> {
  const haystack = `${subject} ${body}`.toLowerCase()
  const allSkills = await getDb().select().from(inboxSkills)

  for (const s of allSkills) {
    const keywords = `${s.name} ${s.description}`.toLowerCase().split(/\s+/)
    if (keywords.some((k) => k.length > 3 && haystack.includes(k))) {
      return { name: s.name, prompt: s.prompt }
    }
  }
  return null
}

/**
 * Trekk ut keywords fra emne + body for å hente relevant artikler.
 * Enkel implementasjon: ord >= 4 tegn, ikke stopord.
 */
function extractKeywords(text: string): string[] {
  const STOPWORDS = new Set([
    'jeg',
    'meg',
    'mitt',
    'mine',
    'med',
    'eller',
    'eller',
    'eller',
    'fra',
    'til',
    'som',
    'har',
    'kan',
    'skal',
    'vil',
    'det',
    'den',
    'dette',
    'denne',
    'disse',
    'noen',
    'noe',
    'hvis',
    'når',
    'hvor',
    'hva',
    'hvem',
    'gjennom',
    'over',
    'under',
    'mellom',
    'etter',
    'innen',
    'hilsen',
    'vennlig',
    'hei',
    'takk',
  ])
  const tokens = text
    .toLowerCase()
    .replace(/[^a-zæøåA-ZÆØÅ0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t))
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of tokens) {
    if (!seen.has(t)) {
      seen.add(t)
      out.push(t)
      if (out.length >= 8) break
    }
  }
  return out
}

/**
 * Generer AI-utkast for en innkommende melding.
 * Tar inn både subject og body, plukker relevante artikler og skills,
 * og returnerer markdown-svar.
 */
export async function generateDraft(
  input: GenerateDraftInput,
): Promise<GenerateDraftResult> {
  const body = input.bodyText ?? input.bodyHtml?.replace(/<[^>]+>/g, ' ') ?? ''

  const keywords = extractKeywords(`${input.subject} ${body}`)
  const [skill, relevantArticles] = await Promise.all([
    pickRelevantSkill(input.subject, body),
    findRelevantArticles(keywords, 3),
  ])

  const articleContext = relevantArticles
    .map((a, i) => `### Kilde ${i + 1}: ${a.title}\n${a.body.slice(0, 800)}`)
    .join('\n\n')

  const systemPrompt = [
    BASE_PROMPT,
    skill ? `\n## Relevant svar-mal: ${skill.name}\n${skill.prompt}` : '',
    articleContext
      ? `\n## Relevant kunnskapsbank\n${articleContext}\n\nBruk kun kunnskapen ovenfor for konkrete fakta. Ikke gjett.`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  const userPrompt = [
    `Fra: ${input.fromName ? `${input.fromName} <${input.fromEmail}>` : input.fromEmail}`,
    `Emne: ${input.subject}`,
    '',
    'Melding:',
    body.slice(0, 4000),
    '',
    'Skriv et passende svar.',
  ].join('\n')

  const draft = await chat({
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    maxTokens: 600,
    temperature: 0.3,
  })

  return { draft, skillUsed: skill?.name ?? null }
}

/**
 * Generer + lagre utkast for én melding. Brukt fra webhook etter ingest.
 */
export async function ensureDraftFor(messageId: string): Promise<void> {
  const db = getDb()
  const [msg] = await db
    .select()
    .from(inboxMessages)
    .where(eq(inboxMessages.id, messageId))
    .limit(1)
  if (!msg || msg.aiDraft) return

  const result = await generateDraft({
    fromName: msg.fromName,
    fromEmail: msg.fromEmail,
    subject: msg.subject,
    bodyText: msg.bodyText,
    bodyHtml: msg.bodyHtml,
  })

  await db
    .update(inboxMessages)
    .set({
      aiDraft: result.draft,
      aiSkillUsed: result.skillUsed,
      status: 'draft_ready',
    })
    .where(eq(inboxMessages.id, messageId))
}

/**
 * Re-generer utkast (admin trigger).
 */
export async function regenerateDraft(messageId: string): Promise<void> {
  const db = getDb()
  await db
    .update(inboxMessages)
    .set({ aiDraft: null, status: 'new' })
    .where(eq(inboxMessages.id, messageId))
  await ensureDraftFor(messageId)
}

