/**
 * Seeds the first admin user. Run once per environment:
 *
 *   ADMIN_EMAIL=daglig.leder@gfgk.no \
 *   ADMIN_PASSWORD='a-strong-password' \
 *   ADMIN_NAME='Daglig leder' \
 *   pnpm seed:admin
 *
 * DATABASE_URL must be set. The script is idempotent: re-running with the
 * same email updates the existing row's password/name/role.
 */
import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { users } from '@/db/schema'

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME ?? null

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set.')
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.')
    process.exit(1)
  }

  const passwordHash = await hash(password, 10)
  const db = getDb()

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing) {
    await db
      .update(users)
      .set({ passwordHash, name, role: 'admin' })
      .where(eq(users.email, email))
    console.log(`Updated existing admin: ${email}`)
  } else {
    await db.insert(users).values({ email, passwordHash, name, role: 'admin' })
    console.log(`Created admin: ${email}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
