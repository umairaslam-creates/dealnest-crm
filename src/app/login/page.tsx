"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import { loginAction } from "./actions";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { AuthShowcaseGlass } from "@/components/auth/auth-showcase-glass";
import { DealNestLogo } from "@/components/brand/dealnest-logo";

export default function LoginPage() {
  const router = useRouter();
  const [error, formAction, pending] = useActionState(loginAction, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setSocialError(null);
    const providers = await getProviders();
    if (!providers?.google) {
      setSocialError("Google sign-in is not configured yet. Add Google OAuth credentials in Vercel first.");
      return;
    }
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <div className="min-h-screen w-full relative bg-[#07080e] text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden">
      {/* Radiant Fluid Chromatic Auroras (Exact Background from Reference Image) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        <div
          className="absolute -bottom-32 -left-32 w-[680px] h-[680px] rounded-full opacity-65 blur-[90px]"
          style={{
            background:
              "radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, rgba(59, 130, 246, 0.3) 40%, rgba(147, 51, 234, 0.2) 70%, transparent 100%)",
          }}
        />
        <div
          className="absolute -top-40 right-1/4 w-[720px] h-[620px] rounded-full opacity-45 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(236, 72, 153, 0.35) 0%, rgba(168, 85, 247, 0.25) 50%, transparent 100%)",
          }}
        />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 px-6 py-4 flex items-center justify-between border-b border-white/[0.08] backdrop-blur-md bg-[#07080e]/40">
        <DealNestLogo size="md" href="/" />

        <div className="flex items-center gap-2 text-[12.5px]">
          <span className="text-slate-400 hidden sm:inline">Enterprise Portal</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </header>

      {/* Main Split Body: Left Form, Right Enterprise Glass Showcase */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-72px)]">
        {/* LEFT COLUMN: Luxury Frosted Glass Form (Matching Reference media_1789984511848.png) */}
        <div className="lg:col-span-5 p-4 sm:p-8 lg:p-12 flex flex-col justify-center items-center">
          <div className="w-full max-w-[440px] rounded-[32px] border border-white/[0.12] bg-[#12131a]/70 p-7 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.65)] backdrop-blur-3xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Top Bar: [ Sign up | Sign in ] Pill and (X) Close */}
            <div className="flex items-center justify-between mb-6">
              <div className="inline-flex items-center rounded-full bg-black/50 border border-white/10 p-1">
                <Link
                  href="/signup"
                  className="rounded-full px-5 py-1.5 text-[13.5px] font-medium text-white/55 hover:text-white transition-colors"
                >
                  Sign up
                </Link>
                <span className="rounded-full bg-white/15 px-5 py-1.5 text-[13.5px] font-semibold text-white shadow-xs">
                  Sign in
                </span>
              </div>

              <Link
                href="/"
                title="Close"
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              >
                <X size={15} />
              </Link>
            </div>

            <div className="mb-5">
              <h1 className="text-[23px] font-bold tracking-tight text-white">Sign in to workspace</h1>
              <p className="text-[13px] text-white/60 mt-1">
                Enter your workspace credentials to access your CRM.
              </p>
            </div>

            <form action={formAction} className="space-y-3.5">
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] pl-11 pr-4 py-3 text-[14px] text-white placeholder:text-white/35 outline-none focus:border-white/35 focus:bg-white/[0.09] transition-all"
                />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] pl-11 pr-11 py-3 text-[14px] text-white placeholder:text-white/35 outline-none focus:border-white/35 focus:bg-white/[0.09] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-2.5 text-[12px] font-medium text-rose-300">
                {error}
              </div>
            )}
            {socialError && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/15 p-2.5 text-[12px] font-medium text-amber-200">
                {socialError}
              </div>
            )}

              {/* Solid Pure White Primary Button */}
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-2xl bg-white hover:bg-slate-100 py-3.5 px-6 text-[14.5px] font-bold text-slate-950 shadow-xl active:scale-[0.99] disabled:opacity-40 transition-all cursor-pointer mt-1"
              >
                {pending ? "Signing in..." : "Sign in to workspace"}
              </button>
            </form>

            {/* Subtle Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-[1px] bg-white/[0.1]" />
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-white/40">
                or continue with
              </span>
              <div className="flex-1 h-[1px] bg-white/[0.1]" />
            </div>

            {/* Social SSO Button (Google) */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.09] py-3 px-4 text-[13px] font-semibold text-white transition-all cursor-pointer shadow-sm hover:border-white/20 mb-3"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Terms Disclaimer */}
            <p className="mt-5 text-center text-[11px] text-white/40 leading-tight">
              By signing in, you agree to our Terms &amp; Service
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Luxury Enterprise Glass Showcase & Live Theme Switcher */}
        <div className="lg:col-span-7 relative border-t lg:border-t-0 lg:border-l border-white/[0.08] flex flex-col justify-between">
          <AuthShowcaseGlass />
        </div>
      </main>
    </div>
  );
}
