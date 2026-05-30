'use client'

import {
  BookOpen,
  Calendar,
  CalendarClock,
  CheckSquare,
  FolderKanban,
  Home,
  ListChecks,
  LogOut,
  Settings,
  User,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/db/schema'
import { cn } from '@/lib/cn'

const baseItems = [
  { href: '/dashboard', label: 'Min dag', icon: Home },
  { href: '/oppgaver', label: 'Oppgaver', icon: CheckSquare },
  { href: '/kalender', label: 'Kalender', icon: Calendar },
  { href: '/vakter', label: 'Vakter', icon: CalendarClock },
  { href: '/sjekklister', label: 'Sjekklister', icon: ListChecks },
  { href: '/kunnskap', label: 'Kunnskap', icon: BookOpen },
  { href: '/prosjekter', label: 'Prosjekter', icon: FolderKanban },
  { href: '/profil', label: 'Profil', icon: User },
] as const

const adminItem = { href: '/admin', label: 'Admin', icon: Settings } as const

export function DesktopSidebar({
  role,
  userName,
  signOutAction,
}: {
  role: Role
  userName: string | null
  signOutAction: () => Promise<void>
}) {
  const pathname = usePathname()
  const items = role === 'admin' ? [...baseItems, adminItem] : baseItems

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/10 bg-gfgk-black lg:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <Image src="/logo.png" alt="GFGK" width={36} height={36} className="h-9 w-9" />
        <span className="text-sm font-extrabold uppercase tracking-wide text-white">
          Servicepunkt
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-white/5 text-gfgk-gold'
                      : 'text-white/60 hover:bg-white/5 hover:text-white',
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="px-3 pb-2">
          <p className="truncate text-sm font-semibold text-white">
            {userName ?? 'Ansatt'}
          </p>
          <p className="text-xs capitalize text-white/50">{role}</p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-5 w-5" strokeWidth={2} />
            Logg ut
          </button>
        </form>
      </div>
    </aside>
  )
}
