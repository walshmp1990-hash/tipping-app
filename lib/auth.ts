import { compare } from 'bcryptjs';
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';
import { prisma } from './prisma';

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const parsed = credsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user) return null;
        const matches = await compare(parsed.data.password, user.passwordHash);
        if (!matches) return null;
        return { id: user.id, email: user.email, name: user.displayName, isAdmin: user.isAdmin } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id;
        token.isAdmin = (user as any).isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).user.id = token.userId;
      (session as any).user.isAdmin = token.isAdmin;
      return session;
    }
  }
};

export default NextAuth(authOptions);
