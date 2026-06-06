import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "admin") {
    redirect("/");
  }

  if (session.user.role === "member") {
    redirect("/member");
  }

  redirect("/login?error=AccessDenied");
}
