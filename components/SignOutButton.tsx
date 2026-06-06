"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="h-8 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50 flex items-center gap-2"
      title="Sign out"
    >
      <LogOut className="size-3.5" />
      Sign out
    </button>
  );
}
