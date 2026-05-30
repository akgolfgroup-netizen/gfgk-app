import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/cn'

interface MarkdownViewProps {
  content: string
  className?: string
}

/**
 * Rendrer markdown med GFGK-stil. Brukes for artikkel-visning + kommentarer.
 * Bevisst restriktiv komponentmapping for å unngå at brukere injiserer rare ting.
 */
export function MarkdownView({ content, className }: MarkdownViewProps) {
  return (
    <div className={cn('prose-gfgk', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="font-display mt-7 text-xl font-bold tracking-tight text-gfgk-text">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h2 className="font-display mt-7 text-lg font-bold tracking-tight text-gfgk-text">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-display mt-5 text-base font-semibold tracking-tight text-gfgk-text">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mt-3 text-[15px] leading-relaxed text-gfgk-text">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px] text-gfgk-text">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-[15px] text-gfgk-text">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="text-gfgk-gold-deep underline underline-offset-2 hover:text-gfgk-gold"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mt-4 border-l-4 border-gfgk-gold bg-gfgk-cream-deep py-2 pl-4 text-[15px] italic text-gfgk-text-2">
              {children}
            </blockquote>
          ),
          code: ({ children, className: codeClass }) => {
            const isInline = !codeClass
            if (isInline) {
              return (
                <code className="rounded bg-gfgk-cream-deep px-1.5 py-0.5 font-mono text-[13px] text-gfgk-text">
                  {children}
                </code>
              )
            }
            return (
              <code className="block whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-gfgk-text">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="mt-4 overflow-x-auto rounded-lg bg-gfgk-cream-deep p-4">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-6 border-gfgk-border" />,
          strong: ({ children }) => (
            <strong className="font-bold text-gfgk-text">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
