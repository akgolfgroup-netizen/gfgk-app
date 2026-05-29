/**
 * Vercel AI Gateway-wrapper. Bruker default Claude Sonnet via gateway-strenger
 * for å få fallback og observability uten provider-spesifikke pakker.
 *
 * Hvis AI_GATEWAY_API_KEY ikke er satt, returnerer en stubb-respons så
 * appen kan kjøre i dev uten AI-tilkobling.
 */

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4-5'
const GATEWAY_BASE = 'https://gateway.ai.vercel.app/v1'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatOptions {
  system?: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
  model?: string
}

export async function chat(opts: ChatOptions): Promise<string> {
  const apiKey = process.env.AI_GATEWAY_API_KEY
  if (!apiKey) {
    console.log('[ai] skipped (no AI_GATEWAY_API_KEY)')
    return '[Utkast ikke generert — AI Gateway-nøkkel mangler. Skriv svar manuelt.]'
  }

  const messages: ChatMessage[] = []
  if (opts.system) messages.push({ role: 'system', content: opts.system })
  messages.push(...opts.messages)

  try {
    const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: opts.model ?? DEFAULT_MODEL,
        messages,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.3,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[ai] gateway error:', res.status, text)
      return '[Klarte ikke å generere utkast. Skriv svar manuelt.]'
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data.choices?.[0]?.message?.content ?? ''
    return content.trim() || '[Tom respons fra AI. Skriv svar manuelt.]'
  } catch (err) {
    console.error('[ai] fetch failed:', err)
    return '[Klarte ikke å koble til AI Gateway. Skriv svar manuelt.]'
  }
}
