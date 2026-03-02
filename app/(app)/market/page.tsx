"use client";

import { Topbar } from "@/components/layout/Topbar";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, ArrowRight, Zap, Users, Radio, BarChart2, Lock } from "lucide-react";

// ── Demo data ──────────────────────────────────────────────────
const NARRATIVES = [
  { name: "AI + Crypto",      trend: "up",   change: "+18%", heat: 94, color: "#06b6d4", desc: "Agent protocols and AI-native tokens surging across Telegram and X." },
  { name: "RWA Tokenisation", trend: "up",   change: "+12%", heat: 87, color: "#8b5cf6", desc: "Real-world asset tokenisation accelerating. Institutional interest growing fast." },
  { name: "DeFi Revival",     trend: "up",   change: "+7%",  heat: 76, color: "#3b82f6", desc: "Yield farming returning. New protocols offering sustainable APYs." },
  { name: "Meme coins",       trend: "flat", change: "0%",   heat: 61, color: "#ff5c1a", desc: "Meme cycle cooling after Q1 rally. Community activity still elevated." },
  { name: "NFT",              trend: "down", change: "-9%",  heat: 34, color: "#ec4899", desc: "Floor prices declining. Low new project launches this month." },
  { name: "GameFi",           trend: "down", change: "-4%",  heat: 41, color: "#10b981", desc: "Play-to-earn fatigue. Only high-quality titles holding traction." },
];

const SIGNALS = [
  { project: "Fetch.ai",    signal: "Major partnership announced with Bosch",   time: "2h ago",  type: "collab",  color: "bg-accent/10 text-accent" },
  { project: "Arbitrum",   signal: "Grant program open — 500k ARB available",  time: "5h ago",  type: "grant",   color: "bg-brand-green/10 text-brand-green" },
  { project: "Berachain",  signal: "Testnet live — 120k wallets in 24 hours",  time: "8h ago",  type: "launch",  color: "bg-blue-500/10 text-blue-500" },
  { project: "Cosmos Hub", signal: "IBC volume up 40% this week",              time: "12h ago", type: "metric",  color: "bg-violet-500/10 text-violet-500" },
  { project: "Blur",       signal: "Season 3 airdrop farming heating up",      time: "1d ago",  type: "airdrop", color: "bg-yellow-500/10 text-yellow-600" },
];

// ── Guided tour steps ──────────────────────────────────────────
const TOUR_STEPS = [
  {
    icon: <Radio className="w-8 h-8 text-accent" />,
    title: "Real-time narrative tracking",
    body: "Web3 moves in narratives. AI summer. DeFi season. Meme supercycles. NYXUS scans thousands of Telegram channels and X posts every hour to detect which narratives are heating up — before the rest of the market notices.",
    cta: "Show me how →",
  },
  {
    icon: <BarChart2 className="w-8 h-8 text-accent" />,
    title: "The heat index",
    body: "Each narrative gets a 0–100 heat score based on message volume, sentiment, new project launches, and community growth. A score above 80 means the narrative is trending. Below 40? It's cooling off — and the partnership opportunities are drying up with it.",
    cta: "Got it — what else? →",
  },
  {
    icon: <Zap className="w-8 h-8 text-accent" />,
    title: "Live collab signals",
    body: "When a project tweets 'looking for partners', posts a collab request in their Telegram, or announces a grant program — NYXUS catches it in real-time and surfaces it as a signal. You get to reach out first, before everyone else sees it.",
    cta: "This is what I came for →",
  },
  {
    icon: <Users className="w-8 h-8 text-accent" />,
    title: "Your project's pulse",
    body: "Once you describe your project, Market Pulse personalises the feed to your category. A DeFi project sees DeFi heat data. An NFT project sees NFT narrative trends. The signals you get are the ones that actually matter for your partnerships.",
    cta: "Show me the demo →",
  },
];

// ── Animated heat bar ──────────────────────────────────────────
function HeatBar({ value, color }: { value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { setTimeout(() => setWidth(value), 100); }, [value]);

  return (
    <div className="w-full h-1.5 bg-bg-2 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${width}%`, background: color }}
      />
    </div>
  );
}

// ── Counting number ────────────────────────────────────────────
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const step = to / 40;
    let cur = 0;
    const t = setInterval(() => {
      cur += step;
      if (cur >= to) { setVal(to); clearInterval(t); }
      else setVal(Math.floor(cur));
    }, 25);
    return () => clearInterval(t);
  }, [to]);
  return <>{val.toLocaleString()}{suffix}</>;
}

export default function MarketPulsePage() {
  const [tourStep, setTourStep]   = useState(0);
  const [showDemo, setShowDemo]   = useState(false);
  const [locked, setLocked]       = useState(false);
  const [signalVisible, setSignalVisible] = useState(0);

  // Animate signals in one by one
  useEffect(() => {
    if (!showDemo) return;
    const t = setInterval(() => {
      setSignalVisible((v) => {
        if (v >= SIGNALS.length) { clearInterval(t); return v; }
        return v + 1;
      });
    }, 400);
    return () => clearInterval(t);
  }, [showDemo]);

  // ── Tour screen ──────────────────────────────────────────────
  if (!showDemo) {
    const step = TOUR_STEPS[tourStep];
    const isLast = tourStep === TOUR_STEPS.length - 1;

    return (
      <>
        <Topbar title="Market Pulse" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-bg">

          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-10">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === tourStep ? "w-6 h-1.5 bg-accent" : i < tourStep ? "w-1.5 h-1.5 bg-accent/40" : "w-1.5 h-1.5 bg-border"
                }`}
              />
            ))}
          </div>

          {/* Step card */}
          <div className="max-w-md w-full text-center">
            <div
              key={tourStep}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {/* Icon with pulsing ring */}
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 rounded-2xl bg-accent/10 animate-ping opacity-30" />
                <div className="relative w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center">
                  {step.icon}
                </div>
              </div>

              <h2 className="font-syne text-2xl font-extrabold tracking-tight mb-4">{step.title}</h2>
              <p className="text-sm text-text-2 leading-relaxed mb-10">{step.body}</p>

              <button
                onClick={() => {
                  if (isLast) setShowDemo(true);
                  else setTourStep((s) => s + 1);
                }}
                className="inline-flex items-center gap-2 bg-accent text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                {step.cta}
                <ArrowRight className="w-4 h-4" />
              </button>

              {tourStep > 0 && (
                <button
                  onClick={() => setTourStep((s) => s - 1)}
                  className="block mx-auto mt-4 text-xs text-text-3 hover:text-text-2 transition-colors"
                >
                  ← Back
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Demo screen ──────────────────────────────────────────────
  return (
    <>
      <Topbar title="Market Pulse" />

      <div className="flex-1 overflow-y-auto p-6 bg-bg relative">

        {/* Live indicator */}
        <div className="flex items-center gap-2 mb-5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          <span className="text-[11px] font-mono text-text-2">Live intelligence feed · Updated hourly</span>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 font-semibold">Demo data</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Projects tracked",  value: 2847 },
            { label: "Signals this week", value: 143 },
            { label: "Narratives active", value: 12 },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-1">{s.label}</p>
              <p className="font-syne text-2xl font-extrabold"><CountUp to={s.value} /></p>
            </div>
          ))}
        </div>

        {/* Narrative heat index */}
        <h2 className="font-syne text-sm font-bold mb-3 tracking-tight">Narrative heat index</h2>
        <div className="flex flex-col gap-2 mb-6">
          {NARRATIVES.map((n, i) => (
            <div
              key={n.name}
              className="card p-3 animate-in fade-in slide-in-from-left-2 duration-500"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: n.color }} />
                    <p className="text-sm font-semibold">{n.name}</p>
                    {n.trend === "up"   && <TrendingUp   className="w-3.5 h-3.5 text-brand-green" />}
                    {n.trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-brand-red" />}
                    <span className={`text-[10px] font-mono font-semibold ${
                      n.trend === "up" ? "text-brand-green" : n.trend === "down" ? "text-brand-red" : "text-text-3"
                    }`}>{n.change}</span>
                  </div>
                  <p className="text-[10px] text-text-2 mt-0.5 ml-4">{n.desc}</p>
                </div>
                <span className="font-syne font-extrabold text-sm">{n.heat}</span>
              </div>
              <HeatBar value={n.heat} color={n.color} />
            </div>
          ))}
        </div>

        {/* Live signals */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-syne text-sm font-bold tracking-tight">Live collab signals</h2>
          <button
            onClick={() => setLocked(true)}
            className="text-[10px] text-accent font-semibold hover:underline flex items-center gap-1"
          >
            Get real data <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {SIGNALS.slice(0, signalVisible).map((s, i) => (
            <div
              key={i}
              className="card p-3 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0 mt-0.5 ${s.color}`}>
                {s.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{s.project}</p>
                <p className="text-[11px] text-text-2">{s.signal}</p>
              </div>
              <span className="text-[10px] text-text-3 font-mono flex-shrink-0">{s.time}</span>
            </div>
          ))}
        </div>

        {/* Coming soon lock overlay */}
        {locked && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-text/20 backdrop-blur-xl" onClick={() => setLocked(false)} />
            <div className="relative bg-surface rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl border border-border animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-accent" />
              </div>
              <p className="font-syne text-xl font-extrabold mb-2">Coming soon</p>
              <p className="text-sm text-text-2 mb-6 leading-relaxed">
                Real-time narrative intelligence, live collab signals, and personalised market pulse for your project. This is what NYXUS Pro unlocks.
              </p>
              <button className="btn-primary w-full text-sm mb-2">Join the waitlist →</button>
              <button onClick={() => setLocked(false)} className="text-xs text-text-3 hover:text-text-2 transition-colors">
                Back to demo
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
