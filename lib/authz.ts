import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "admin") {
    throw new Error("Forbidden");
  }

  return session.user;
}

export async function requireMember() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "member") {
    throw new Error("Forbidden");
  }

  return session.user;
}
