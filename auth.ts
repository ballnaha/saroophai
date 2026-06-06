import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Line from "next-auth/providers/line";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

const adminEmails = new Set(
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google, Line],
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) {
        return false;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true },
      });

      if (adminEmails.has(email)) {
        if (existingUser && existingUser.role !== "admin") {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { role: "admin" },
          });
        }
        return true;
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
  },
  events: {
    async createUser({ user }) {
      const email = user.email?.toLowerCase();
      if (email && adminEmails.has(email)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "admin" },
        });
      }
    },
  },
});
