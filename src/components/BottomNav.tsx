'use client'

import { Calendar, CheckSquare, Home, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/db/schema'
import { cn } from '@/lib/cn'

const baseItems = [
  { href: '/dashboard', label: 'Hjem', icon: Home },
  { href: '/oppgaver', label: 'Oppgaver', icon: CheckSquare },
  { href: '/kalender', label: 'Kalender', icon: Calendar },
  { href: '/profil', label: 'Profil', icon: User },
] as const

const adminItem = { href: '/admin', label: 'Admin', icon: Settings } as const

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname()
  const items = role === 'admin' ? [...baseItems, adminItem] : baseItems

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-gfgk-black/95 backdrop-blur pb-safe">
      <ul className="mx-auto flex max-w-[480px] items-stretch justify-around">
        {items.map((item) => {
          const Icon = item.icon
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors',
                  active ? 'text-gfgk-gold' : 'text-white/60 hover:text-white',
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
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
