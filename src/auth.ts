import { randomBytes } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      const email = credentials?.email;
      const password = credentials?.password;
      if (typeof email !== "string" || typeof password !== "string") return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.deletedAt) return null;

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return null;

      return {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        isAiAgent: user.isAiAgent,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, user }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;

      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });

      if (!dbUser) {
        await prisma.user.create({
          data: {
            name: user.name || user.email.split("@")[0],
            email: user.email,
            password: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
            role: "AGENT",
            deletedAt: new Date(),
          },
        });
        return "/login?pending=1";
      }

      if (dbUser.deletedAt) {
        return "/login?pending=1";
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === "google" && user.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser) {
          token.id = String(dbUser.id);
          token.role = dbUser.role;
          token.isAiAgent = dbUser.isAiAgent;
        }
        return token;
      }

      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.isAiAgent = user.isAiAgent;
      }
      return token;
    },
  },
});
