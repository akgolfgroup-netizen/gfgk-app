'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/db/schema'

const baseItems = [{ href: '/dashboard', label: 'Hjem' }] as const
const adminItems = [{ href: '/admin', label: 'Admin' }] as const

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname()
  const items = role === 'admin' ? [...baseItems, ...adminItems] : baseItems
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t-2 border-gfgk-gold bg-gfgk-charcoal/95 backdrop-blur pb-safe">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors ${
                  active ? 'text-gfgk-gold' : 'text-white/60 hover:text-white'
                }`}
              >
                {item.label}
                {active && <span className="h-0.5 w-4 rounded-full bg-gfgk-gold" />}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
