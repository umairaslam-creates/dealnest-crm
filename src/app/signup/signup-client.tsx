"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import {
  User,
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Palette,
  Type,
  Briefcase,
  Target,
  Mail,
  Lock,
  Phone,
  Crown,
  Users,
  Compass,
  Check,
  Eye,
  EyeOff,
  X,
  ChevronDown,
} from "lucide-react";
import { AuthShowcaseGlass } from "@/components/auth/auth-showcase-glass";
import { DealNestLogo } from "@/components/brand/dealnest-logo";
import { THEMES, FONT_COMBINATIONS, useTheme } from "@/components/theme-context";
import {
  checkTeamLeadAvailabilityAction,
  registerUserAction,
} from "./actions";
import { isPublicWebmail, extractEmailDomain } from "@/lib/domain-helpers";

const DEPARTMENTS = [
  { id: "Sales", name: "Sales & Revenue", icon: "💼", desc: "Pipeline, inbound leads & enterprise deal velocity" },
  { id: "Marketing", name: "Growth & Marketing", icon: "🚀", desc: "Campaigns, acquisition channels & product launches" },
  { id: "Engineering", name: "Engineering & Tech", icon: "⚙️", desc: "System architecture, dev sprints & platform health" },
  { id: "Finance", name: "Finance & Operations", icon: "💰", desc: "Treasury, billing, invoicing & commercial credit" },
  { id: "Customer Success", name: "Customer Success & Support", icon: "🤝", desc: "Retention, client onboarding & account satisfaction" },
  { id: "Product", name: "Product & Design", icon: "📦", desc: "Roadmap, feature scoping & client feedback loops" },
  { id: "Operations", name: "Executive & Operations", icon: "🏢", desc: "Cross-functional governance & compliance" },
];

const ORG_ROLES = [
  {
    id: "TEAM_LEAD",
    title: "Team Lead",
    badge: "Strictly 1 Per Dept",
    icon: Crown,
    desc: "Department leader: Manages approvals, assigns leads & sets rep permissions",
  },
  {
    id: "REPRESENTATIVE",
    title: "Representative",
    badge: "Core Contributor",
    icon: Target,
    desc: "Active sales or operations specialist working assigned leads and pipeline deals",
  },
  {
    id: "EXECUTIVE",
    title: "Account Executive",
    badge: "Senior Dealmaker",
    icon: Briefcase,
    desc: "Handles enterprise contracts, negotiations, and strategic accounts",
  },
  {
    id: "SPECIALIST",
    title: "Operations Specialist",
    badge: "Support Specialist",
    icon: Users,
    desc: "Technical enablement, KYC vetting, and workflow automation",
  },
  {
    id: "INTERN",
    title: "Associate / Intern",
    badge: "Trainee",
    icon: Compass,
    desc: "Assisting with pipeline research, lead qualification, and reporting",
  },
];

const INDUSTRIES = [
  "Fintech & Digital Banking",
  "Software & SaaS",
  "E-commerce & Retail",
  "Real Estate & Property Development",
  "Consulting & Professional Services",
  "Healthcare & Life Sciences",
  "Logistics & Supply Chain",
  "Media & Creative Agency",
  "Other / Independent Venture",
];

const COUNTRY_CODES = [
  { name: "United States", iso: "US", flag: "🇺🇸", code: "+1" },
  { name: "Canada", iso: "CA", flag: "🇨🇦", code: "+1" },
  { name: "United Kingdom", iso: "GB", flag: "🇬🇧", code: "+44" },
  { name: "Pakistan", iso: "PK", flag: "🇵🇰", code: "+92" },
  { name: "India", iso: "IN", flag: "🇮🇳", code: "+91" },
  { name: "United Arab Emirates", iso: "AE", flag: "🇦🇪", code: "+971" },
  { name: "Saudi Arabia", iso: "SA", flag: "🇸🇦", code: "+966" },
  { name: "Qatar", iso: "QA", flag: "🇶🇦", code: "+974" },
  { name: "Kuwait", iso: "KW", flag: "🇰🇼", code: "+965" },
  { name: "Bahrain", iso: "BH", flag: "🇧🇭", code: "+973" },
  { name: "Oman", iso: "OM", flag: "🇴🇲", code: "+968" },
  { name: "Turkey", iso: "TR", flag: "🇹🇷", code: "+90" },
  { name: "Egypt", iso: "EG", flag: "🇪🇬", code: "+20" },
  { name: "Jordan", iso: "JO", flag: "🇯🇴", code: "+962" },
  { name: "Lebanon", iso: "LB", flag: "🇱🇧", code: "+961" },
  { name: "Germany", iso: "DE", flag: "🇩🇪", code: "+49" },
  { name: "France", iso: "FR", flag: "🇫🇷", code: "+33" },
  { name: "Italy", iso: "IT", flag: "🇮🇹", code: "+39" },
  { name: "Spain", iso: "ES", flag: "🇪🇸", code: "+34" },
  { name: "Netherlands", iso: "NL", flag: "🇳🇱", code: "+31" },
  { name: "Australia", iso: "AU", flag: "🇦🇺", code: "+61" },
  { name: "Singapore", iso: "SG", flag: "🇸🇬", code: "+65" },
  { name: "Malaysia", iso: "MY", flag: "🇲🇾", code: "+60" },
  { name: "China", iso: "CN", flag: "🇨🇳", code: "+86" },
  { name: "Japan", iso: "JP", flag: "🇯🇵", code: "+81" },
  { name: "South Korea", iso: "KR", flag: "🇰🇷", code: "+82" },
  { name: "South Africa", iso: "ZA", flag: "🇿🇦", code: "+27" },
  { name: "Nigeria", iso: "NG", flag: "🇳🇬", code: "+234" },
  { name: "Brazil", iso: "BR", flag: "🇧🇷", code: "+55" },
  { name: "Mexico", iso: "MX", flag: "🇲🇽", code: "+52" },
];

export function SignupClient() {
  const router = useRouter();
  const { setTheme, setFontCombo } = useTheme();
  const [isPending, startTransition] = useTransition();

  // Mode: "signup" or "signin"
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");

  // Account Architecture: "INDIVIDUAL" | "ORGANIZATION"
  const [accountType, setAccountType] = useState<"INDIVIDUAL" | "ORGANIZATION">("INDIVIDUAL");

  // Step in signup wizard: 1 = Basic Info, 2 = Role/Purpose or Dept, 3 = Theme & Font or Org Verification
  const [wizardStep, setWizardStep] = useState(1);

  // Form Fields (Split into First Name and Last Name as in reference image)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [showPassword, setShowPassword] = useState(false);

  // Individual fields
  const [occupation, setOccupation] = useState("");
  const [purpose, setPurpose] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [selectedThemeId, setSelectedThemeId] = useState("clinexa-blue");
  const [selectedFontId, setSelectedFontId] = useState("saas-modern");

  // Organization fields
  const [department, setDepartment] = useState("Sales");
  const [orgRole, setOrgRole] = useState<"TEAM_LEAD" | "REPRESENTATIVE" | "EXECUTIVE" | "SPECIALIST" | "INTERN">("REPRESENTATIVE");

  // Validations & Server Checks
  const [leadConflictMessage, setLeadConflictMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detect domain
  const currentDomain = extractEmailDomain(email);
  const isWebmail = isPublicWebmail(currentDomain);

  const fullName = `${firstName} ${lastName}`.trim();

  // Check Team Lead availability in real-time
  useEffect(() => {
    if (accountType === "ORGANIZATION" && orgRole === "TEAM_LEAD" && currentDomain && !isWebmail && department) {
      let active = true;
      checkTeamLeadAvailabilityAction({
        companyDomain: currentDomain,
        department,
      })
        .then((res) => {
          if (!active) return;
          if (!res.available) {
            setLeadConflictMessage(
              `⚠️ ${res.currentLeadName || "A team lead"} has already registered as the verified Team Lead for ${department} in this organization. Each department can have only one Team Lead. Please choose Representative, Executive, Specialist, or Intern.`
            );
          } else {
            setLeadConflictMessage(null);
          }
        })
        .catch(() => {});

      return () => {
        active = false;
      };
    } else {
      setLeadConflictMessage(null);
    }
  }, [accountType, orgRole, currentDomain, isWebmail, department]);

  // Handle final registration
  async function handleRegister() {
    setErrorMessage(null);

    startTransition(async () => {
      const res = await registerUserAction({
        accountType,
        name: fullName || firstName || email.split("@")[0],
        email,
        password,
        phone: `${countryCode} ${phone}`.trim(),
        occupation,
        purpose,
        industry,
        themePreference: selectedThemeId,
        fontPreference: selectedFontId,
        department: accountType === "ORGANIZATION" ? department : undefined,
        orgRole: accountType === "ORGANIZATION" ? orgRole : undefined,
      });

      if (res.error) {
        setErrorMessage(res.error);
        return;
      }

      if (res.success) {
        if (selectedThemeId) setTheme(selectedThemeId);
        if (selectedFontId) setFontCombo(selectedFontId);

        try {
          await signIn("credentials", {
            email,
            password,
            redirect: false,
          });

          if (res.status === "PENDING_APPROVAL") {
            router.push("/pending-approval");
          } else {
            router.push("/");
          }
        } catch (e) {
          router.push("/login");
        }
      }
    });
  }

  // Handle Sign In mode submission
  async function handleSignIn() {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (res?.error) {
          setErrorMessage("Invalid email or password.");
        } else {
          router.push("/");
        }
      } catch (e) {
        setErrorMessage("Sign in failed. Please try again.");
      }
    });
  }

  async function handleGoogleSignIn() {
    setErrorMessage(null);
    const providers = await getProviders();
    if (!providers?.google) {
      setErrorMessage("Google sign-in is not configured yet. Add Google OAuth credentials in Vercel first.");
      return;
    }
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <div className="min-h-screen w-full relative bg-[#07080e] text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden">
      {/* Radiant Fluid Chromatic Auroras (Exact Background from Reference Image media_1789984511848.png) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        {/* Glowing electric blue fluid curve at bottom left */}
        <div
          className="absolute -bottom-32 -left-32 w-[680px] h-[680px] rounded-full opacity-65 blur-[90px]"
          style={{
            background:
              "radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, rgba(59, 130, 246, 0.3) 40%, rgba(147, 51, 234, 0.2) 70%, transparent 100%)",
          }}
        />
        {/* Soft iridescent rainbow curve at top center */}
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

      {/* Main Split Body: Left Form (Exact match to image), Right Enterprise Glass Showcase */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-72px)]">
        {/* ======================= LEFT COLUMN: EXACT LUXURY GLASS FORM (COL-SPAN-5) ======================= */}
        <div className="lg:col-span-5 p-4 sm:p-8 lg:p-12 flex flex-col justify-center items-center">
          {/* Glass Card Container (Matching Reference Image media_1789984511848.png) */}
          <div className="w-full max-w-[440px] rounded-[32px] border border-white/[0.12] bg-[#12131a]/70 p-7 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.65)] backdrop-blur-3xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Top Bar: Segmented Pill Switcher [ Sign up | Sign in ] and Circular Close (X) */}
            <div className="flex items-center justify-between mb-6">
              <div className="inline-flex items-center rounded-full bg-black/50 border border-white/10 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setErrorMessage(null);
                  }}
                  className={`rounded-full px-5 py-1.5 text-[13.5px] font-semibold transition-all ${
                    authMode === "signup"
                      ? "bg-white/15 text-white shadow-xs"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  Sign up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setErrorMessage(null);
                  }}
                  className={`rounded-full px-5 py-1.5 text-[13.5px] font-semibold transition-all ${
                    authMode === "signin"
                      ? "bg-white/15 text-white shadow-xs"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  Sign in
                </button>
              </div>

              <button
                type="button"
                onClick={() => router.push("/")}
                title="Close"
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              >
                <X size={15} />
              </button>
            </div>

            {/* ===================== MODE A: SIGN UP ===================== */}
            {authMode === "signup" ? (
              <div>
                {/* Form Title & Architecture Switcher */}
                <div className="mb-5">
                  <h1 className="text-[23px] font-bold tracking-tight text-white">Create an account</h1>

                  {/* Architecture Pill: Individual vs Organization */}
                  <div className="mt-3 flex items-center gap-2 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountType("INDIVIDUAL");
                        setWizardStep(1);
                        setErrorMessage(null);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
                        accountType === "INDIVIDUAL"
                          ? "bg-white text-slate-950 shadow-xs"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      <User size={13} />
                      <span>Individual (Gmail)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountType("ORGANIZATION");
                        setWizardStep(1);
                        setErrorMessage(null);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
                        accountType === "ORGANIZATION"
                          ? "bg-white text-slate-950 shadow-xs"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      <Building2 size={13} />
                      <span>Organization</span>
                    </button>
                  </div>
                </div>

                {/* --- STEP 1: Basic Fields (Exact Match to Reference Image) --- */}
                {wizardStep === 1 && (
                  <div className="space-y-3.5">
                    {/* Side-by-side First Name & Last Name */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First name"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[14px] text-white placeholder:text-white/35 outline-none focus:border-white/35 focus:bg-white/[0.09] transition-all"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last name"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[14px] text-white placeholder:text-white/35 outline-none focus:border-white/35 focus:bg-white/[0.09] transition-all"
                        />
                      </div>
                    </div>

                    {/* Email Field with Envelope Icon */}
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={
                          accountType === "ORGANIZATION"
                            ? "name@company.com (corporate domain)"
                            : "Enter your email"
                        }
                        className={`w-full rounded-xl border pl-11 pr-4 py-3 text-[14px] text-white placeholder:text-white/35 outline-none transition-all ${
                          accountType === "ORGANIZATION" && isWebmail
                            ? "border-rose-500 bg-rose-500/10 focus:border-rose-400"
                            : "border-white/10 bg-white/[0.06] focus:border-white/35 focus:bg-white/[0.09]"
                        }`}
                      />
                    </div>

                    {/* Webmail Warning for Organization */}
                    {accountType === "ORGANIZATION" && isWebmail && (
                      <p className="text-[11.5px] text-rose-300 px-1 font-medium">
                        ⚠️ Corporate email domain required (e.g. name@company.com), not @{currentDomain}.
                      </p>
                    )}

                    {/* Phone Number Field with Country Flag Dropdown */}
                    <div className="flex items-center gap-2">
                      <div className="relative shrink-0">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          aria-label="Country calling code"
                          className="h-[46px] w-[124px] appearance-none rounded-xl border border-white/10 bg-[#161722] px-3 pr-8 text-[13px] font-semibold text-white outline-none transition-all hover:bg-white/10 focus:border-white/35 focus:bg-[#1b1c28]"
                        >
                          {COUNTRY_CODES.map((country) => (
                            <option
                              key={`${country.iso}-${country.code}`}
                              value={country.code}
                              className="bg-[#12131a] text-white"
                            >
                              {country.flag} {country.name} {country.code}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
                        />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(775) 351-6501"
                        className="flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[14px] text-white placeholder:text-white/35 outline-none focus:border-white/35 focus:bg-white/[0.09] transition-all"
                      />
                    </div>

                    {/* Password Field */}
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password (min 6 chars)"
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

                    {errorMessage && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-2.5 text-[12px] font-medium text-rose-300">
                        {errorMessage}
                      </div>
                    )}

                    {/* Primary Button: Solid Crisp Pure White (Exact Match to Image) */}
                    <button
                      type="button"
                      disabled={
                        !firstName.trim() ||
                        !email.trim() ||
                        password.length < 6 ||
                        (accountType === "ORGANIZATION" && (isWebmail || !currentDomain))
                      }
                      onClick={() => setWizardStep(2)}
                      className="w-full rounded-2xl bg-white hover:bg-slate-100 py-3.5 px-6 text-[14.5px] font-bold text-slate-950 shadow-xl active:scale-[0.99] disabled:opacity-40 transition-all cursor-pointer mt-2"
                    >
                      {accountType === "INDIVIDUAL" ? "Continue: Role & Purpose" : "Continue: Department"}
                    </button>
                  </div>
                )}

                {/* --- STEP 2 (INDIVIDUAL): Occupation & Purpose --- */}
                {accountType === "INDIVIDUAL" && wizardStep === 2 && (
                  <div className="space-y-3.5 animate-in fade-in duration-150">
                    <div>
                      <label className="text-[12px] font-semibold text-white/70">What do you do? *</label>
                      <input
                        type="text"
                        required
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        placeholder="e.g. Independent Tech Consultant / Deal Broker"
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[14px] text-white placeholder:text-white/35 outline-none focus:border-white/35 focus:bg-white/[0.09] transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[12px] font-semibold text-white/70">Purpose of using CRM *</label>
                      <input
                        type="text"
                        required
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="e.g. Managing high-ticket client pipelines"
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[14px] text-white placeholder:text-white/35 outline-none focus:border-white/35 focus:bg-white/[0.09] transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[12px] font-semibold text-white/70">Industry</label>
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-[#161722] px-4 py-3 text-[13.5px] text-white outline-none focus:border-white/35 transition-all"
                      >
                        {INDUSTRIES.map((ind) => (
                          <option key={ind} value={ind} className="bg-[#12131a] text-white">
                            {ind}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setWizardStep(1)}
                        className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-3 text-[13px] font-semibold text-white transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={!occupation.trim() || !purpose.trim()}
                        onClick={() => setWizardStep(3)}
                        className="flex-1 rounded-2xl bg-white hover:bg-slate-100 py-3 text-[14px] font-bold text-slate-950 shadow-xl active:scale-[0.99] disabled:opacity-40 transition-all cursor-pointer"
                      >
                        Continue: Theme &amp; Font
                      </button>
                    </div>
                  </div>
                )}

                {/* --- STEP 3 (INDIVIDUAL): Theme & Font Customizer --- */}
                {accountType === "INDIVIDUAL" && wizardStep === 3 && (
                  <div className="space-y-3.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-white/70">
                        Pick CRM Palette
                      </span>
                      <span className="text-[11px] text-pink-400 font-semibold">
                        {THEMES.length} Themes
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto no-scrollbar pr-1">
                      {THEMES.slice(0, 8).map((th) => {
                        const isSelected = selectedThemeId === th.id;
                        return (
                          <div
                            key={th.id}
                            onClick={() => setSelectedThemeId(th.id)}
                            className={`cursor-pointer rounded-xl border p-2.5 transition-all ${
                              isSelected
                                ? "border-white bg-white/15 ring-1 ring-white/30"
                                : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                            }`}
                          >
                            <span className="text-[11px] font-bold text-white truncate block">
                              {th.name}
                            </span>
                            <div className="mt-1.5 flex items-center gap-1">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: th.palette.bg }}
                              />
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: th.palette.brand }}
                              />
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: th.palette.accent }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-white/70 block mb-1.5">
                        Typography Pairing
                      </span>
                      <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto no-scrollbar pr-1">
                        {FONT_COMBINATIONS.slice(0, 4).map((fc) => {
                          const isSelected = selectedFontId === fc.id;
                          return (
                            <div
                              key={fc.id}
                              onClick={() => setSelectedFontId(fc.id)}
                              className={`cursor-pointer rounded-xl border p-2 transition-all ${
                                isSelected
                                  ? "border-white bg-white/15 ring-1 ring-white/30"
                                  : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                              }`}
                            >
                              <span className="text-[11px] font-bold text-white block truncate">
                                {fc.name}
                              </span>
                              <span
                                className="text-[10px] text-white/60 block truncate"
                                style={{ fontFamily: fc.headingFont }}
                              >
                                {fc.preview.heading}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-2.5 text-[12px] font-medium text-rose-300">
                        {errorMessage}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setWizardStep(2)}
                        className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-3 text-[13px] font-semibold text-white transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleRegister}
                        className="flex-1 rounded-2xl bg-white hover:bg-slate-100 py-3.5 text-[14px] font-bold text-slate-950 shadow-xl active:scale-[0.99] disabled:opacity-40 transition-all cursor-pointer"
                      >
                        {isPending ? "Creating Workspace..." : "Create an account"}
                      </button>
                    </div>
                  </div>
                )}

                {/* --- STEP 2 (ORGANIZATION): Department & Role with Strict 1-Lead Check --- */}
                {accountType === "ORGANIZATION" && wizardStep === 2 && (
                  <div className="space-y-3.5 animate-in fade-in duration-150">
                    <div>
                      <label className="text-[12px] font-semibold text-white/70">Department *</label>
                      <div className="grid grid-cols-2 gap-2 mt-1.5 max-h-[140px] overflow-y-auto no-scrollbar pr-1">
                        {DEPARTMENTS.map((dept) => {
                          const isSelected = department === dept.id;
                          return (
                            <div
                              key={dept.id}
                              onClick={() => setDepartment(dept.id)}
                              className={`cursor-pointer rounded-xl border p-2 flex items-center gap-2 transition-all ${
                                isSelected
                                  ? "border-white bg-white/15"
                                  : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                              }`}
                            >
                              <span className="text-base">{dept.icon}</span>
                              <span className="text-[12px] font-semibold text-white truncate">
                                {dept.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[12px] font-semibold text-white/70">
                          Organizational Role *
                        </label>
                        <span className="text-[10px] font-bold text-amber-400">1 Lead Rule</span>
                      </div>

                      {leadConflictMessage && (
                        <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-2.5 text-[11.5px] text-rose-200 mb-2">
                          {leadConflictMessage}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        {ORG_ROLES.map((r) => {
                          const isSelected = orgRole === r.id;
                          const isLeadConflict = r.id === "TEAM_LEAD" && !!leadConflictMessage;
                          return (
                            <div
                              key={r.id}
                              onClick={() => setOrgRole(r.id as any)}
                              className={`cursor-pointer rounded-xl border p-2.5 flex items-center justify-between transition-all ${
                                isSelected
                                  ? isLeadConflict
                                    ? "border-rose-500 bg-rose-500/15"
                                    : "border-white bg-white/15"
                                  : isLeadConflict
                                  ? "border-white/5 bg-white/[0.02] opacity-40"
                                  : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                              }`}
                            >
                              <div>
                                <span className="text-[12.5px] font-bold text-white">{r.title}</span>
                                <span className="text-[11px] text-white/50 block">{r.desc}</span>
                              </div>
                              <span className="text-[10px] uppercase font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded-md">
                                {r.badge}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-2.5 text-[12px] font-medium text-rose-300">
                        {errorMessage}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setWizardStep(1)}
                        className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-3 text-[13px] font-semibold text-white transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={isPending || (orgRole === "TEAM_LEAD" && !!leadConflictMessage)}
                        onClick={handleRegister}
                        className="flex-1 rounded-2xl bg-white hover:bg-slate-100 py-3.5 text-[14px] font-bold text-slate-950 shadow-xl active:scale-[0.99] disabled:opacity-40 transition-all cursor-pointer"
                      >
                        {isPending
                          ? "Registering..."
                          : orgRole === "TEAM_LEAD"
                          ? "Register as Team Lead"
                          : "Submit for Lead Approval"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Subtle Divider (OR SIGN IN WITH) */}
                <div className="my-5 flex items-center gap-3">
                  <div className="flex-1 h-[1px] bg-white/[0.1]" />
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-white/40">
                    or sign in with
                  </span>
                  <div className="flex-1 h-[1px] bg-white/[0.1]" />
                </div>

                {/* Social SSO Button */}
                <div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.09] py-3 px-4 text-[13px] font-semibold text-white transition-all cursor-pointer shadow-sm hover:border-white/20"
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
                </div>

                {/* Terms Disclaimer */}
                <p className="mt-5 text-center text-[11px] text-white/40 leading-tight">
                  By creating an account, you agree to our Terms &amp; Service
                </p>
              </div>
            ) : (
              /* ===================== MODE B: SIGN IN ===================== */
              <div className="space-y-4">
                <div className="mb-2">
                  <h1 className="text-[23px] font-bold tracking-tight text-white">Sign in</h1>
                  <p className="text-[13px] text-white/60 mt-1">
                    Enter your workspace credentials to access your pipeline.
                  </p>
                </div>

                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
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

                {errorMessage && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-2.5 text-[12px] font-medium text-rose-300">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="button"
                  disabled={isPending || !email.trim() || !password}
                  onClick={handleSignIn}
                  className="w-full rounded-2xl bg-white hover:bg-slate-100 py-3.5 px-6 text-[14.5px] font-bold text-slate-950 shadow-xl active:scale-[0.99] disabled:opacity-40 transition-all cursor-pointer mt-1"
                >
                  {isPending ? "Signing in..." : "Sign in to account"}
                </button>

                <div className="pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("ahmad.aziz@mytm.co");
                      setPassword("mytm2026");
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] p-2 text-[12px] text-white/70 hover:text-white transition-colors"
                  >
                    ✨ Fill Demo Credentials (Ahmad Aziz • Sales Lead)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================= RIGHT COLUMN: LUXURY ENTERPRISE GLASS SHOWCASE (COL-SPAN-7) ======================= */}
        <div className="lg:col-span-7 relative border-t lg:border-t-0 lg:border-l border-white/[0.08] flex flex-col justify-between">
          <AuthShowcaseGlass />
        </div>
      </main>
    </div>
  );
}
