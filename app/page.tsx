import { DashboardApp } from "@/components/DashboardApp";
import { requireAdmin } from "@/lib/authz";
import { redirect } from "next/navigation";

export default async function Home() {
  let user;
  try {
    user = await requireAdmin();
  } catch {
    redirect("/auth/redirect");
  }

  return (
    <DashboardApp
      userName={user.name}
      userEmail={user.email}
    />
  );
}
