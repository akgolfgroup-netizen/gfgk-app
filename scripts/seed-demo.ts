/**
 * Creates a demo ansatt user for live demos:
 *   email: demo@gfgk.no
 *   password: Demo1234!
 *
 * DATABASE_URL must be set. Idempotent — safe to re-run.
 */
import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { users } from '@/db/schema'

async function main() {
  const email = 'demo@gfgk.no'
  const password = 'Demo1234!'
  const name = 'Demo Ansatt'

  const passwordHash = await hash(password, 10)
  const db = getDb()

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing) {
    await db.update(users).set({ passwordHash, name, role: 'ansatt' }).where(eq(users.email, email))
    console.log(`Updated demo user: ${email}`)
  } else {
    await db.insert(users).values({ email, passwordHash, name, role: 'ansatt' })
    console.log(`Created demo user: ${email} / ${password}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
