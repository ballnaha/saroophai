import { auth } from "@/auth";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  LineChart,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

function LineIcon() {
  return (
    <span className="flex size-5 items-center justify-center rounded-[4px] bg-white text-[9px] font-extrabold leading-none text-[#06C755]">
      LINE
    </span>
  );
}

function GoogleIcon() {
  return (
    <span className="relative flex size-5 items-center justify-center rounded-full border border-zinc-200 bg-white text-[13px] font-extrabold leading-none">
      <span className="text-[#4285F4]">G</span>
    </span>
  );
}

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-[1fr_420px]">
        <section className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <LineChart className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">SaroopHai</h1>
              <p className="text-xs font-medium text-zinc-500">
                LINE operations intelligence
              </p>
            </div>
          </div>

          <div className="py-14 lg:py-0">
            <p className="text-sm font-bold text-emerald-700">
              Production-ready dashboard
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight tracking-normal text-zinc-950 sm:text-5xl">
              สรุปงานจาก LINE ให้ทีมเห็นภาพเดียวกัน
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600">
              เข้าสู่ระบบเพื่อดู dashboard, สรุปแชทด้วย AI, ติดตาม action items
              และเตรียม workflow สำหรับทีมที่ใช้ LINE เป็นศูนย์กลางการทำงาน
            </p>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <ShieldCheck className="size-5 text-emerald-600" />
                <p className="mt-3 text-sm font-bold text-zinc-900">Protected</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Dashboard และ server actions ต้องมี session
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <MessageCircle className="size-5 text-emerald-600" />
                <p className="mt-3 text-sm font-bold text-zinc-900">LINE Ready</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  รองรับ LINE webhook และ LINE Login
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <Building2 className="size-5 text-emerald-600" />
                <p className="mt-3 text-sm font-bold text-zinc-900">Team Fit</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  พร้อมต่อยอด role, workspace และ reports
                </p>
              </div>
            </div>
          </div>

          <p className="hidden text-xs text-zinc-400 lg:block">
            Secure access for internal team operations.
          </p>
        </section>

        <section className="flex items-center px-6 pb-8 sm:px-10 lg:px-0 lg:pr-12">
          <div className="w-full rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-emerald-700">
                Sign in
              </p>
              <h2 className="mt-2 text-xl font-extrabold text-zinc-950">
                เข้าสู่ระบบ Dashboard
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                เลือกวิธีเข้าสู่ระบบให้เหมาะกับบทบาทของคุณ
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <form
                action={async () => {
                  "use server";
                  await signIn("line", { redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="group h-11 w-full rounded-lg bg-[#06C755] px-3 text-sm font-bold text-white transition-colors hover:bg-[#05b64d] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <LineIcon />
                    Continue with LINE
                  </span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>

              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="group h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-800 transition-colors hover:bg-zinc-50 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <GoogleIcon />
                    Continue with Google
                  </span>
                  <ArrowRight className="size-4 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>
            </div>

            <div className="mt-6 rounded-lg bg-zinc-50 p-4">
              <p className="text-xs font-bold text-zinc-800">Recommended setup</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                ใช้ LINE Login สำหรับผู้ใช้ที่ทำงานในกลุ่ม LINE และใช้ Google
                สำหรับ admin หรือทีม management
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
