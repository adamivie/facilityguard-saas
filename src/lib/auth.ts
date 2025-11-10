import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import MicrosoftEntraIDProvider from 'next-auth/providers/microsoft-entra-id'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import { Role } from '@prisma/client'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    MicrosoftEntraIDProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID,
      allowDangerousEmailAccountLinking: true,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if this is a new user or existing user
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
        include: { organization: true }
      })

      if (!existingUser) {
        // New user - they need to create/join an organization
        return `/onboarding?email=${encodeURIComponent(user.email!)}&name=${encodeURIComponent(user.name || '')}`
      }

      // Existing user - update their provider info if needed
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          provider: account?.provider,
          providerId: account?.providerAccountId,
          image: user.image,
          name: user.name || existingUser.name
        }
      })

      return true
    },
    
    async jwt({ token, user, account }) {
      if (user) {
        // Fetch user with organization on login
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { 
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
                status: true
              }
            }
          }
        })

        if (dbUser) {
          token.role = dbUser.role
          token.organizationId = dbUser.organizationId
          token.organization = dbUser.organization
        }
      }
      return token
    },
    
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          role: token.role as Role,
          organizationId: token.organizationId as string,
          organization: token.organization as any
        }
      }
    },

    async redirect({ url, baseUrl }) {
      // Handle post-login redirects
      if (url.startsWith('/onboarding')) {
        return url
      }
      
      // Default to dashboard after successful auth
      if (url === baseUrl) {
        return `${baseUrl}/dashboard`
      }
      
      return url.startsWith(baseUrl) ? url : baseUrl
    }
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  session: {
    strategy: 'jwt'
  },
  
  events: {
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`)
    },
    
    async signIn({ user, account, isNewUser }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`)
    }
  }
})