import { auth } from "@/auth";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  LineChart,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Lock,
} from "lucide-react";

function LineIcon() {
  return (
    <img
      src="/images/line_icon.png"
      alt="LINE Logo"
      className="size-5 shrink-0 mr-2 object-contain select-none"
    />
  );
}

function GoogleIcon() {
  return (
    <svg className="size-5 shrink-0 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="relative min-h-screen lg:h-screen lg:overflow-hidden bg-zinc-50 text-zinc-900 selection:bg-emerald-500/30">
      {/* Custom Keyframe Styles for Drifting Ambient Glow */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float-glow-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(45px, -35px) scale(1.1); }
        }
        @keyframes float-glow-2 {
          0%, 100% { transform: translate(0, 0) scale(1.1); }
          50% { transform: translate(-35px, 45px) scale(0.95); }
        }
        .animate-glow-1 {
          animation: float-glow-1 14s infinite alternate ease-in-out;
        }
        .animate-glow-2 {
          animation: float-glow-2 18s infinite alternate ease-in-out;
        }
      `}} />

      {/* Modern Dotted Grid Background */}
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70" />

      {/* Animated Ambient Glowing Highlights */}
      <div className="absolute -top-40 -left-40 -z-10 size-[650px] rounded-full bg-emerald-500/5 blur-[128px] animate-glow-1" />
      <div className="absolute -bottom-40 -right-40 -z-10 size-[650px] rounded-full bg-indigo-500/5 blur-[128px] animate-glow-2" />

      <div className="mx-auto grid min-h-screen lg:h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-[1fr_450px]">
        {/* Left Panel: Brand & Value Proposition Dashboard Mock */}
        <section className="hidden lg:flex flex-col justify-between px-6 py-6 sm:px-10 lg:py-8 lg:pr-6 lg:h-full lg:overflow-hidden">
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-3 select-none">
            <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition-opacity hover:opacity-100" />
              <LineChart className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent">
                SaroopHai
              </h1>
              <p className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase">
                LINE operations intelligence
              </p>
            </div>
          </div>

          {/* Main Value Proposition & Live Demo */}
          <div className="my-auto py-6 lg:py-0 flex flex-col justify-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-500/10 shadow-sm">
                <Sparkles className="size-3.5 text-emerald-600 animate-pulse" />
                <span>AI Operations Intelligence</span>
              </div>
            </div>

            <h2 className="mt-3.5 max-w-xl text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900">
              <span className="block leading-normal">สรุปงานจาก LINE</span>
              <span className="block pl-1 leading-normal bg-gradient-to-r from-[#06C755] via-emerald-500 to-[#4285F4] bg-clip-text text-transparent">
                ให้ทีมเห็นภาพเดียวกัน
              </span>
            </h2>
            <p className="mt-3 max-w-lg text-xs sm:text-sm leading-relaxed text-zinc-500 font-medium">
              เชื่อมต่อกลุ่ม LINE ของคุณเพื่อวิเคราะห์แชทแบบเรียลไทม์
              สรุปประเด็นด้วย AI ดึงนัดหมาย และติดตามความคืบหน้าของงานผ่าน Dashboard ส่วนกลางได้ทันที
            </p>

            {/* Interactive Mockup Component (Macbook-style Application Window) */}
            <div className="relative mt-6 w-full max-w-sm rounded-2xl border border-zinc-200 bg-white/70 shadow-lg backdrop-blur-md transition-all duration-500 hover:shadow-xl hover:border-zinc-300 dark:border-zinc-800/40 dark:bg-zinc-900/20 overflow-hidden">
              {/* Mac-style Top Control Bar */}
              <div className="flex items-center justify-between border-b border-zinc-200/50 bg-zinc-50/50 px-4 py-2 dark:border-zinc-800/50 dark:bg-zinc-950/20">
                <div className="flex gap-1.5">
                  <span className="size-2 rounded-full bg-[#FF5F56] select-none" />
                  <span className="size-2 rounded-full bg-[#FFBD2E] select-none" />
                  <span className="size-2 rounded-full bg-[#27C93F] select-none" />
                </div>
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1 select-none">
                  <span className="flex size-1 rounded-full bg-emerald-500 animate-pulse" />
                  SaroopHai Engine
                </span>
                <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/10 select-none scale-90">
                  Active
                </span>
              </div>

              <div className="p-4 space-y-3">
                {/* Chat Stream (Only 1 message) */}
                <div className="flex items-start gap-2.5">
                  <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-[8px] font-bold text-white shadow-sm shrink-0 select-none">
                    สม
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">สมยศ</span>
                      <span className="text-[8px] text-zinc-400">10:12</span>
                    </div>
                    <div className="mt-0.5 rounded-lg rounded-tl-none bg-zinc-100/65 dark:bg-zinc-800/70 px-2.5 py-1 text-[11px] leading-relaxed text-zinc-650 dark:text-zinc-350 border border-zinc-200/10">
                      เดี๋ยวผมเข้าพบซัพพลายเออร์ A สรุปราคาเหล็กบ่ายสองครึ่งครับ
                    </div>
                  </div>
                </div>

                {/* AI Summary Box */}
                <div className="relative rounded-lg border border-emerald-500/15 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent p-3 overflow-hidden dark:bg-emerald-950/20 dark:border-emerald-500/10 shadow-sm">
                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-400">
                    <Sparkles className="size-3 text-emerald-500 animate-pulse" />
                    <span>AI สรุปคำสั่งงาน</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-350">
                    ประชุมสรุปราคาเหล็กกับซัพพลายเออร์ A (<strong className="text-emerald-700 dark:text-emerald-400">วันนี้ 14:30 น.</strong>)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Features Info - Clean Row Badge layout */}
          <div className="hidden lg:flex items-center gap-5 pt-3.5 border-t border-zinc-200/50 text-[11px] text-zinc-400 font-medium select-none">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
              <span>Protected Session</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="size-3.5 text-emerald-600 shrink-0" />
              <span>LINE Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="size-3.5 text-emerald-600 shrink-0" />
              <span>Team Workspace</span>
            </div>
          </div>
        </section>

        {/* Right Panel: Login Card */}
        <section className="flex items-center justify-center px-6 py-6 lg:p-0 lg:h-full lg:overflow-hidden">
          <div className="relative w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-9 shadow-2xl shadow-zinc-200/50 dark:border-zinc-800/80 dark:bg-zinc-950 dark:shadow-none">
            {/* Decorative soft glow inside card */}
            <div className="absolute -top-12 -right-12 -z-10 size-40 rounded-full bg-emerald-500/10 blur-2xl" />

            {/* Logo & Brand Header (Mobile Only) */}
            <div className="flex lg:hidden items-center gap-3 select-none mb-6 justify-center">
              <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
                <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition-opacity hover:opacity-100" />
                <LineChart className="size-5" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent">
                  SaroopHai
                </h1>
                <p className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase">
                  LINE operations intelligence
                </p>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-500/10 select-none">
                Secure Access
              </div>
              <h2 className="mt-2.5 text-xl sm:text-2xl font-extrabold tracking-tight leading-snug text-zinc-950 dark:text-zinc-50">
                เข้าสู่ระบบ Dashboard
              </h2>
              <p className="mt-1 text-xs text-zinc-400 font-medium leading-relaxed">
                เลือกวิธีเข้าสู่ระบบให้เหมาะกับบทบาทของคุณ
              </p>
            </div>

            {/* Social Auth Forms Container */}
            <div className="mt-6 space-y-3.5">
              {/* LINE Login */}
              <form
                action={async () => {
                  "use server";
                  await signIn("line", { redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="group relative flex h-12 w-full items-center justify-between overflow-hidden rounded-xl bg-[#06C755] px-4 text-sm font-bold text-white shadow-md shadow-emerald-600/10 transition-all duration-300 hover:bg-[#05b64d] hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98] cursor-pointer"
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="flex items-center">
                    <LineIcon />
                    Continue with LINE Login
                  </span>
                  <ArrowRight className="size-4 opacity-80 transition-transform group-hover:translate-x-1" />
                </button>
              </form>

              {/* Google Login */}
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="group relative flex h-12 w-full items-center justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-800 shadow-sm transition-all duration-300 hover:bg-zinc-50 hover:border-zinc-300 hover:shadow active:scale-[0.98] cursor-pointer dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  <span className="flex items-center">
                    <GoogleIcon />
                    Continue with Google
                  </span>
                  <ArrowRight className="size-4 text-zinc-400 transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            </div>

            {/* Security SSL & Encryption Info */}
            <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-zinc-450 font-semibold select-none">
              <Lock className="size-3 text-zinc-400" />
              <span>Secure Session Encrypted</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
