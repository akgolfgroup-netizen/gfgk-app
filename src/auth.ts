import { compare } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from '@/auth.config'
import { getDb } from '@/db'
import { users } from '@/db/schema'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-post', type: 'email' },
        password: { label: 'Passord', type: 'password' },
      },
      async authorize(credentials) {
        const email = typeof credentials.email === 'string' ? credentials.email.toLowerCase() : null
        const password = typeof credentials.password === 'string' ? credentials.password : null
        if (!email || !password) return null

        const [user] = await getDb().select().from(users).where(eq(users.email, email)).limit(1)
        if (!user) return null

        const ok = await compare(password, user.passwordHash)
        if (!ok) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
})
