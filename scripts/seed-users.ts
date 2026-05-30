/**
 * Seeder de første ekte brukerne for GFGK Servicepunkt.
 * Idempotent — kjør på nytt trygt (oppdaterer eksisterende rad på e-post).
 *
 *   pnpm seed:users
 *
 * Midlertidig passord settes likt for alle og bør byttes ved første innlogging.
 */
import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { users, type Role } from '@/db/schema'

const TEMP_PASSWORD = 'GfgkVelkommen1!'

const SEED: Array<{ email: string; name: string; role: Role }> = [
  { email: 'njo@gfgk.no', name: 'Nils Jørgen Olsen', role: 'admin' },
  { email: 'ww@gfgk.no', name: 'William Wahlberg', role: 'ansatt' },
  { email: 'vs@gfgk.no', name: 'Viktoria Skaarberg', role: 'ansatt' },
  { email: 'mrp@gfgk.no', name: 'Markus Røinås Pedersen', role: 'ansatt' },
]

async function main() {
  const db = getDb()
  const passwordHash = await hash(TEMP_PASSWORD, 10)

  for (const u of SEED) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, u.email))
      .limit(1)
    if (existing) {
      await db
        .update(users)
        .set({ name: u.name, role: u.role })
        .where(eq(users.email, u.email))
      console.log(`Oppdatert: ${u.name} <${u.email}> (${u.role})`)
    } else {
      await db
        .insert(users)
        .values({ email: u.email, passwordHash, name: u.name, role: u.role })
      console.log(`Opprettet: ${u.name} <${u.email}> (${u.role})`)
    }
  }
  console.log(`\nMidlertidig passord for nye brukere: ${TEMP_PASSWORD}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
