import Link from 'next/link'
import type { Role } from '@/db/schema'

const baseItems = [{ href: '/dashboard', label: 'Hjem' }] as const
const adminItems = [{ href: '/admin', label: 'Admin' }] as const

export function BottomNav({ role }: { role: Role }) {
  const items = role === 'admin' ? [...baseItems, ...adminItems] : baseItems
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white/95 backdrop-blur pb-safe">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map((item) => (
          <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              className="flex h-14 items-center justify-center text-xs font-medium text-neutral-700"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
