"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="h-9 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-550/10 active:scale-[0.98] flex items-center gap-2 shadow-sm cursor-pointer"
      title="Sign out"
    >
      <LogOut className="size-4" />
      Sign out
    </button>
  );
}
