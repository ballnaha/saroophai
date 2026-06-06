import { auth } from "@/auth";
import { DashboardApp } from "@/components/DashboardApp";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardApp
      userName={session.user.name}
      userEmail={session.user.email}
    />
  );
}
