import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Line from "next-auth/providers/line";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

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
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
  },
});
