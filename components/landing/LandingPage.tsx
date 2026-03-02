"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Search, Bell, Zap, Users, ArrowRight, Check,
  TrendingUp, Clock, Target, Shield, ChevronDown,
  Twitter, MessageCircle, BarChart2, Star,
} from "lucide-react";

interface Props {
  isLoggedIn: boolean;
}

// ── Animated counter ───────────────────────────────────────────
function CountUp({ to, suffix = "", prefix = "", duration = 1500 }: {
  to: number; suffix?: string; prefix?: string; duration?: number;
}) {
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const stepDuration = duration / steps;
    let step = 0;
    const t = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * to));
      if (step >= steps) clearInterval(t);
    }, stepDuration);
    return () => clearInterval(t);
  }, [started, to, duration]);

  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ── Scroll reveal wrapper ──────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── How it works step ──────────────────────────────────────────
const HOW_STEPS = [
  {
    num: "01",
    icon: <Target className="w-5 h-5" />,
    title: "Describe your project",
    body: "Tell NYXUS your category, narrative, stage, and what you're looking for in a partner. Takes 2 minutes. This becomes the lens for everything.",
    time: "~2 minutes",
  },
  {
    num: "02",
    icon: <Search className="w-5 h-5" />,
    title: "We scan the ecosystem",
    body: "NYXUS searches Telegram channels and X across DeFi, meme, NFT, GameFi, AI, and protocol categories — pulling live project data and collab signals.",
    time: "~30 seconds",
  },
  {
    num: "03",
    icon: <BarChart2 className="w-5 h-5" />,
    title: "Get a ranked shortlist",
    body: "Every project gets a compatibility score based on narrative overlap, category fit, partnership goals, and community activity. You see who's actually worth reaching out to.",
    time: "Instant",
  },
  {
    num: "04",
    icon: <Zap className="w-5 h-5" />,
    title: "Reach out with context",
    body: "Each match comes with reasoning. You know why they're compatible, whether they're actively looking for collabs, and how to frame your outreach.",
    time: "Your call",
  },
];

// ── Features ───────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <Target className="w-5 h-5 text-accent" />,
    title: "Narrative matching",
    body: "Describe your project once. NYXUS matches you to projects with compatible narratives, audiences, and momentum — not just the same category label.",
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-accent" />,
    title: "Realistic scoring",
    body: "We factor in stage and traction. If a partnership isn't viable yet, we tell you why. Honesty saves time — and protects your reputation.",
  },
  {
    icon: <Bell className="w-5 h-5 text-accent" />,
    title: "Live collab signals",
    body: "Get notified when projects in your niche open collab requests, shift narratives, or launch campaigns. Timing in Web3 is everything.",
  },
  {
    icon: <Users className="w-5 h-5 text-accent" />,
    title: "Multi-project support",
    body: "Running multiple projects or managing BD for a portfolio? Switch between project profiles in one click. One account, multiple contexts.",
  },
  {
    icon: <Shield className="w-5 h-5 text-accent" />,
    title: "Ecosystem intelligence",
    body: "See narrative heat maps and category trends — which categories are heating up, which are cooling, and where partnership opportunities are emerging.",
  },
  {
    icon: <Clock className="w-5 h-5 text-accent" />,
    title: "Hours back every week",
    body: "The average Web3 BD manager spends 8+ hours/week manually searching X and Telegram for potential partners. NYXUS does it in minutes.",
  },
];

// ── Pricing tiers ──────────────────────────────────────────────
const TIERS = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    desc: "Test the waters. See if NYXUS fits your workflow.",
    cta: "Start free →",
    ctaHref: "/auth/signup",
    ctaStyle: "btn-ghost",
    featured: false,
    limits: [
      "3 discovery scans per month",
      "Top 5 matches per scan",
      "1 project profile",
      "Basic match reasoning",
      "Community access",
    ],
  },
  {
    name: "Pro",
    price: "19",
    period: "/ month",
    desc: "For active founders and BD managers who need real results.",
    cta: "Get Pro — $19/mo →",
    ctaHref: "/auth/signup?plan=pro",
    ctaStyle: "btn-primary",
    featured: true,
    badge: "🔥 Early access rate",
    limits: [
      "Unlimited discovery scans",
      "All matches — no cap",
      "Up to 5 project profiles",
      "Full match reasoning",
      "Collab signal alerts",
      "Ecosystem heat maps",
      "Priority support",
    ],
  },
];

// ── Social proof numbers ───────────────────────────────────────
const STATS = [
  { value: 17, suffix: "+", label: "Web3 projects indexed" },
  { value: 2,  suffix: " min", label: "To your first matches" },
  { value: 8,  suffix: " hrs", label: "Saved per week vs manual search" },
  { value: 100, suffix: "%", label: "Telegram-native data" },
];

// ── Fake match preview for hero ────────────────────────────────
const PREVIEW_MATCHES = [
  { initials: "CO", name: "Cosmos Network", category: "Protocol", score: 60, gradient: "from-violet-500 to-indigo-500", signal: true },
  { initials: "DE", name: "DeFi Pulse",     category: "DeFi",     score: 47, gradient: "from-blue-500 to-purple-500",   signal: true },
  { initials: "ME", name: "MemeCoin Alert", category: "Meme",     score: 45, gradient: "from-accent to-orange-400",     signal: false },
  { initials: "MA", name: "Maestro Portal", category: "Trading",  score: 42, gradient: "from-yellow-500 to-orange-500", signal: true },
];

export function LandingPage({ isLoggedIn }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep]         = useState(0);
  const [scrolled, setScrolled]             = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Auto-cycle through how-it-works steps
  useEffect(() => {
    const t = setInterval(() => setActiveStep((s) => (s + 1) % HOW_STEPS.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text font-sans">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-surface/95 backdrop-blur-md border-b border-border shadow-card" : "bg-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="font-syne font-extrabold text-base tracking-tight">
            NYX<span className="text-accent">US</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: "How it works", href: "#how" },
              { label: "Features",     href: "#features" },
              { label: "Pricing",      href: "#pricing" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xs font-medium text-text-2 px-3 py-2 rounded-lg hover:bg-bg-2 hover:text-text transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="text-xs font-semibold bg-accent text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                Go to dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="hidden md:block text-xs font-medium text-text-2 px-3 py-2 rounded-lg hover:bg-bg-2 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-xs font-semibold bg-accent text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Get early access →
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(255,92,26,0.07) 0%, transparent 70%)" }}
        />

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Left — copy */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-bg-2 border border-border px-3 py-1.5 rounded-full text-xs font-medium text-text-2 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                Partnership intelligence for Web3
              </div>

              <h1 className="font-syne font-extrabold text-4xl md:text-5xl tracking-tight leading-[1.05] mb-5">
                Find the right<br />
                partners.<br />
                <span className="text-accent">Not just any</span><br />
                partners.
              </h1>

              <p className="text-base text-text-2 leading-relaxed mb-8 max-w-md">
                NYXUS scans Telegram and X to surface the Web3 projects most worth reaching out to — based on your narrative, stage, and goals. Stop spending days on manual research. Get clarity in minutes.
              </p>

              {/* CTAs */}
              <div className="flex items-center gap-3 mb-10">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 bg-accent text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 hover:-translate-y-px transition-all"
                >
                  Start free — no card needed
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-text-2 hover:text-text transition-colors"
                >
                  How it works
                  <ChevronDown className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                {STATS.map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <span className="font-syne font-extrabold text-2xl tracking-tight">
                      <CountUp to={s.value} suffix={s.suffix} />
                    </span>
                    <span className="text-[11px] text-text-3 font-medium mt-0.5">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — live app preview */}
            <div className="hidden md:block">
              <div className="bg-surface border border-border rounded-2xl shadow-card-lg overflow-hidden">
                {/* Browser bar */}
                <div className="bg-bg-2 border-b border-border px-4 py-2.5 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <div className="flex-1 bg-surface border border-border rounded-md px-3 py-1 mx-3 font-mono text-[10px] text-text-3">
                    nyxus.app/discovery
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="text-[9px] font-mono text-text-3">LIVE</span>
                  </div>
                </div>

                {/* Mini dashboard */}
                <div className="p-4">
                  {/* Topbar */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-syne font-bold text-sm">Top matches for Nyxus</p>
                      <p className="text-[10px] text-text-3 font-mono">4 projects · sorted by match score</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-accent text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg">
                      Run discovery →
                    </div>
                  </div>

                  {/* Match cards */}
                  <div className="flex flex-col gap-2">
                    {PREVIEW_MATCHES.map((m, i) => (
                      <div
                        key={m.name}
                        className="flex items-center gap-2.5 bg-bg rounded-lg p-2.5 border border-border"
                        style={{
                          opacity: 1 - i * 0.15,
                          animationDelay: `${i * 100}ms`,
                        }}
                      >
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${m.gradient} flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0`}>
                          {m.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold">{m.name}</p>
                          <p className="text-[9px] text-text-3">{m.category}</p>
                        </div>
                        {m.signal && (
                          <span className="text-[8px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                            Signal
                          </span>
                        )}
                        <span className={`font-syne font-bold text-xs ${
                          m.score >= 55 ? "text-brand-green" : "text-brand-yellow"
                        }`}>
                          {m.score}%
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer hint */}
                  <p className="text-center text-[9px] text-text-3 mt-3 font-mono">
                    Real data from your Telegram scraper
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TIME SAVED BANNER ────────────────────────────────── */}
      <section className="bg-bg-2 border-y border-border py-5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3">
            {[
              { icon: "📋", label: "Manual research on X", before: "8 hrs/week", after: "0" },
              { icon: "🔍", label: "Scanning Telegram channels", before: "Daily grind", after: "Automated" },
              { icon: "🤝", label: "Finding the right angle", before: "Guesswork", after: "Match reasoning" },
              { icon: "⏱️", label: "Time to first shortlist", before: "Days", after: "2 minutes" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-xs">
                <span>{item.icon}</span>
                <div>
                  <p className="text-text-3 font-medium">{item.label}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="line-through text-text-3">{item.before}</span>
                    <span className="text-text-3">→</span>
                    <span className="font-semibold text-accent">{item.after}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-[11px] font-mono text-accent uppercase tracking-widest mb-2">How it works</p>
            <h2 className="font-syne font-extrabold text-3xl tracking-tight mb-3">
              From zero to shortlist in minutes
            </h2>
            <p className="text-sm text-text-2 max-w-lg mb-12 leading-relaxed">
              Four steps. No manual searching. No spreadsheets. Just your project description → ranked partnership matches.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Steps list */}
            <div className="flex flex-col gap-3">
              {HOW_STEPS.map((step, i) => (
                <Reveal key={step.num} delay={i * 80}>
                  <button
                    onClick={() => setActiveStep(i)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      activeStep === i
                        ? "bg-surface border-accent/30 shadow-card"
                        : "bg-bg border-border hover:border-border hover:bg-surface/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        activeStep === i ? "bg-accent text-white" : "bg-bg-2 text-text-3"
                      }`}>
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-semibold transition-colors ${activeStep === i ? "text-text" : "text-text-2"}`}>
                            {step.title}
                          </p>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full transition-colors ${
                            activeStep === i ? "bg-accent/10 text-accent" : "bg-bg-2 text-text-3"
                          }`}>
                            {step.time}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed transition-colors ${activeStep === i ? "text-text-2" : "text-text-3"}`}>
                          {step.body}
                        </p>
                      </div>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>

            {/* Visual — step illustration */}
            <Reveal delay={200}>
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-card sticky top-20">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center text-white text-xs font-bold">
                    {activeStep + 1}
                  </div>
                  <p className="font-syne font-bold text-sm">{HOW_STEPS[activeStep].title}</p>
                </div>

                {/* Dynamic content per step */}
                <div key={activeStep} style={{ animation: "fadeIn 0.4s ease" }}>
                  {activeStep === 0 && (
                    <div className="flex flex-col gap-2">
                      {[
                        { label: "PROJECT NAME", value: "Your project" },
                        { label: "CATEGORY",     value: "DeFi / Meme coin / NFT..." },
                        { label: "STAGE",        value: "Early growth" },
                        { label: "NARRATIVE",    value: "What makes you different..." },
                        { label: "GOALS",        value: "Co-marketing · Token integration" },
                      ].map((f) => (
                        <div key={f.label} className="bg-bg rounded-lg px-3 py-2">
                          <p className="text-[9px] text-text-3 font-semibold uppercase tracking-widest mb-0.5">{f.label}</p>
                          <p className="text-xs text-text-2">{f.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeStep === 1 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] text-text-3 font-mono mb-2">Scanning channels...</p>
                      {["DeFi projects", "Meme communities", "Protocol networks", "GameFi hubs", "AI + Crypto", "Trading bots"].map((c, i) => (
                        <div key={c} className="flex items-center gap-2 bg-bg rounded-lg px-3 py-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                          <p className="text-xs text-text-2 flex-1">{c}</p>
                          <p className="text-[10px] text-text-3 font-mono">scanning...</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="flex flex-col gap-2">
                      {PREVIEW_MATCHES.map((m) => (
                        <div key={m.name} className="flex items-center gap-2.5 bg-bg rounded-lg px-3 py-2">
                          <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${m.gradient} flex items-center justify-center text-white text-[9px] font-bold`}>
                            {m.initials}
                          </div>
                          <p className="text-xs font-medium flex-1">{m.name}</p>
                          <div className="flex-1">
                            <div className="h-1.5 bg-bg-2 rounded-full overflow-hidden">
                              <div className="h-full bg-accent rounded-full" style={{ width: `${m.score}%`, transition: "width 1s ease" }} />
                            </div>
                          </div>
                          <span className="text-xs font-bold font-syne">{m.score}%</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="flex flex-col gap-3">
                      <div className="bg-bg rounded-lg p-3">
                        <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-1.5">Why this match</p>
                        <p className="text-xs text-text-2 leading-relaxed">Protocol and DeFi projects have strong partnership potential. Active collab signal detected in recent activity.</p>
                      </div>
                      <div className="bg-bg rounded-lg p-3">
                        <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-1.5">Best angle</p>
                        <p className="text-xs text-text-2">Community cross-pollination — their audience matches your growth goals.</p>
                      </div>
                      <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Zap className="w-3 h-3 text-accent" />
                          <p className="text-[10px] text-accent font-semibold uppercase tracking-widest">Live collab signal</p>
                        </div>
                        <p className="text-xs text-text-2">This project posted a partnership request 2 hours ago.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 bg-bg-2 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-[11px] font-mono text-accent uppercase tracking-widest mb-2">Features</p>
            <h2 className="font-syne font-extrabold text-3xl tracking-tight mb-3">
              Everything you need to find the right deal
            </h2>
            <p className="text-sm text-text-2 max-w-lg mb-12 leading-relaxed">
              Built for Web3 founders, BDMs, and agencies who are serious about partnerships — not just connections.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div className="bg-surface border border-border rounded-xl p-5 hover:shadow-card-lg hover:-translate-y-px transition-all duration-200">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-syne font-bold text-sm mb-2">{f.title}</h3>
                  <p className="text-xs text-text-2 leading-relaxed">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="bg-surface border border-border rounded-2xl p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-1 mb-4">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <blockquote className="font-syne font-bold text-xl tracking-tight leading-snug mb-4">
                    "I used to spend my Sundays manually going through Telegram groups looking for potential partners. NYXUS just... does it. The match scoring is surprisingly accurate."
                  </blockquote>
                  <p className="text-sm text-text-2">
                    Web3 BD Manager · DeFi Protocol · Early Access User
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Hours saved per week", value: "8+" },
                    { label: "Avg match score quality", value: "High" },
                    { label: "Time to first results", value: "< 2 min" },
                  ].map((s) => (
                    <div key={s.label} className="bg-bg-2 rounded-xl p-4">
                      <p className="font-syne font-extrabold text-2xl mb-1">{s.value}</p>
                      <p className="text-[11px] text-text-3 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6 bg-bg-2 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-12">
            <p className="text-[11px] font-mono text-accent uppercase tracking-widest mb-2">Pricing</p>
            <h2 className="font-syne font-extrabold text-3xl tracking-tight mb-3">
              Start free. Upgrade when it clicks.
            </h2>
            <p className="text-sm text-text-2 max-w-md mx-auto leading-relaxed">
              No contracts. No credit card for free tier. Cancel anytime.
              <br />
              <span className="text-accent font-semibold">Early access pricing — locked in forever.</span>
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {TIERS.map((tier, i) => (
              <Reveal key={tier.name} delay={i * 100}>
                <div className={`relative bg-surface rounded-2xl p-6 border transition-shadow hover:shadow-card-lg ${
                  tier.featured ? "border-accent/30 shadow-card" : "border-border"
                }`}>
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      {tier.badge}
                    </div>
                  )}

                  <div className="mb-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-3 mb-2">{tier.name}</p>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="font-syne font-extrabold text-4xl tracking-tight">${tier.price}</span>
                      <span className="text-sm text-text-2 mb-1">{tier.period}</span>
                    </div>
                    <p className="text-xs text-text-2 leading-relaxed">{tier.desc}</p>
                  </div>

                  <ul className="flex flex-col gap-2 mb-6">
                    {tier.limits.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-text-2">
                        <Check className="w-3.5 h-3.5 text-brand-green flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={tier.ctaHref}
                    className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-all ${
                      tier.featured
                        ? "bg-accent text-white hover:opacity-90"
                        : "border border-border text-text-2 hover:bg-bg-2 hover:text-text"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <p className="text-center text-xs text-text-3 mt-6">
              Agency plan coming soon · Multiple projects · Team access · Priority scraping
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <Reveal>
            <h2 className="font-syne font-extrabold text-3xl tracking-tight mb-4">
              Your next partnership is already out there.
              <br />
              <span className="text-accent">NYXUS finds it first.</span>
            </h2>
            <p className="text-sm text-text-2 leading-relaxed mb-8 max-w-lg mx-auto">
              The average Web3 BD manager spends 8+ hours a week on manual research. The ones using NYXUS spend 8 minutes — and close better deals.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-accent text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 hover:-translate-y-px transition-all"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-text-3 mt-4">No credit card. No commitment. Just results.</p>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="font-syne font-extrabold text-sm tracking-tight">
            NYX<span className="text-accent">US</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-text-3">
            <Link href="/terms"   className="hover:text-text-2 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-text-2 transition-colors">Privacy</Link>
            <a href="mailto:hello@nyxus.xyz" className="hover:text-text-2 transition-colors">hello@nyxus.xyz</a>
          </div>

          <p className="text-xs text-text-3">© 2026 NYXUS. Partnership intelligence for Web3.</p>
        </div>
      </footer>

      {/* Keyframe for step content fade */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
