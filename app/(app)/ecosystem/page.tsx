"use client";

import { Topbar } from "@/components/layout/Topbar";
import { useEffect, useRef, useState } from "react";
import { Lock, ArrowRight, Globe, GitBranch, Radar } from "lucide-react";

// ── Tour steps ─────────────────────────────────────────────────
const TOUR_STEPS = [
  {
    icon: <Globe className="w-8 h-8 text-accent" />,
    title: "The full Web3 graph",
    body: "Every project in Web3 exists in a network. DeFi protocols connect to infrastructure layers. Meme coins connect to NFT communities. GameFi connects to everything. NYXUS maps these connections in real-time so you can see exactly where your project fits.",
  },
  {
    icon: <GitBranch className="w-8 h-8 text-accent" />,
    title: "Partnership history",
    body: "The Ecosystem Map tracks announced partnerships, integrations, and collab campaigns. You can see which projects work together, how often, and what types of partnerships produce the most community growth — before you reach out.",
  },
  {
    icon: <Radar className="w-8 h-8 text-accent" />,
    title: "Your position in the graph",
    body: "Once your project is set up, it appears in the map — connected to your matches. You can see which clusters you're close to, which partnerships would expand your reach the most, and where the white space is in your ecosystem.",
  },
];

// ── Node/edge data ─────────────────────────────────────────────
const NODES = [
  { id: "user",    label: "Your Project", cat: "You",           size: 32, color: "#ff5c1a", x: 0.5,  y: 0.5 },
  { id: "d1",      label: "Uniswap",      cat: "DeFi",          size: 22, color: "#3b82f6", x: 0.65, y: 0.3 },
  { id: "d2",      label: "Aave",         cat: "DeFi",          size: 18, color: "#3b82f6", x: 0.75, y: 0.48 },
  { id: "d3",      label: "Curve",        cat: "DeFi",          size: 16, color: "#3b82f6", x: 0.68, y: 0.62 },
  { id: "m1",      label: "PEPE",         cat: "Meme",          size: 20, color: "#ff5c1a", x: 0.32, y: 0.25 },
  { id: "m2",      label: "DOGE",         cat: "Meme",          size: 22, color: "#ff5c1a", x: 0.2,  y: 0.42 },
  { id: "n1",      label: "OpenSea",      cat: "NFT",           size: 18, color: "#ec4899", x: 0.3,  y: 0.65 },
  { id: "n2",      label: "Blur",         cat: "NFT",           size: 15, color: "#ec4899", x: 0.18, y: 0.72 },
  { id: "a1",      label: "Fetch.ai",     cat: "AI",            size: 18, color: "#06b6d4", x: 0.55, y: 0.18 },
  { id: "a2",      label: "Render",       cat: "AI",            size: 15, color: "#06b6d4", x: 0.42, y: 0.15 },
  { id: "p1",      label: "Cosmos",       cat: "Protocol",      size: 22, color: "#8b5cf6", x: 0.82, y: 0.3 },
  { id: "p2",      label: "Polkadot",     cat: "Protocol",      size: 20, color: "#8b5cf6", x: 0.85, y: 0.55 },
  { id: "i1",      label: "Arbitrum",     cat: "Infra",         size: 22, color: "#6b7280", x: 0.78, y: 0.72 },
  { id: "g1",      label: "Axie",         cat: "GameFi",        size: 18, color: "#10b981", x: 0.42, y: 0.78 },
];

const EDGES: [string, string][] = [
  ["user","d1"],["user","m1"],["user","a1"],["user","p1"],
  ["d1","d2"],["d1","d3"],["d2","i1"],["d1","p1"],
  ["m1","m2"],["m1","n1"],["n1","n2"],["n1","g1"],
  ["a1","a2"],["a1","p1"],["p1","p2"],["p2","i1"],
  ["i1","d3"],["g1","m2"],["a2","m1"],
];

interface NodeState {
  id: string; label: string; cat: string;
  size: number; color: string;
  x: number; y: number; // 0-1 normalised, rendered as % of canvas
  ox: number; oy: number; // original position (home)
  phase: number; // random phase for gentle bobbing
}

const LEGEND = [
  { label: "DeFi",     color: "#3b82f6" },
  { label: "Meme",     color: "#ff5c1a" },
  { label: "NFT",      color: "#ec4899" },
  { label: "AI",       color: "#06b6d4" },
  { label: "Protocol", color: "#8b5cf6" },
  { label: "Infra",    color: "#6b7280" },
  { label: "GameFi",   color: "#10b981" },
];

export default function EcosystemMapPage() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const stateRef   = useRef<NodeState[]>([]);
  const animRef    = useRef<number>(0);
  const frameRef   = useRef(0);

  const [tourStep, setTourStep] = useState(0);
  const [showMap, setShowMap]   = useState(false);
  const [locked, setLocked]     = useState(false);
  const [hovered, setHovered]   = useState<string | null>(null);
  const hoveredRef = useRef<string | null>(null);

  // ── Init node state once ───────────────────────────────────
  useEffect(() => {
    stateRef.current = NODES.map((n) => ({
      ...n,
      ox: n.x, oy: n.y,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  // ── Canvas animation ───────────────────────────────────────
  useEffect(() => {
    if (!showMap) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      frameRef.current++;
      const f = frameRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const nodes = stateRef.current;

      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--bg").trim() || "#f7f6f2";
      ctx.fillRect(0, 0, W, H);

      // Gentle bobbing — very small amplitude
      nodes.forEach((n) => {
        const bob = Math.sin(f * 0.015 + n.phase) * 0.008;
        n.x = n.ox + bob;
        n.y = n.oy + Math.cos(f * 0.012 + n.phase) * 0.005;
      });

      // ── Edges ──────────────────────────────────────────────
      EDGES.forEach(([sId, tId]) => {
        const s = nodes.find((n) => n.id === sId);
        const t = nodes.find((n) => n.id === tId);
        if (!s || !t) return;

        const sx = s.x * W, sy = s.y * H;
        const tx = t.x * W, ty = t.y * H;
        const isUserEdge = sId === "user" || tId === "user";
        const pulse = (Math.sin(f * 0.04) * 0.5 + 0.5);

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = isUserEdge
          ? `rgba(255, 92, 26, ${0.25 + pulse * 0.35})`
          : "rgba(0,0,0,0.07)";
        ctx.lineWidth = isUserEdge ? 1.5 : 1;
        ctx.setLineDash(isUserEdge ? [] : [4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // ── Nodes ──────────────────────────────────────────────
      nodes.forEach((node) => {
        const nx = node.x * W;
        const ny = node.y * H;
        const isUser = node.id === "user";
        const isHov  = node.id === hoveredRef.current;
        const pulse  = Math.sin(f * 0.04 + node.phase) * 0.5 + 0.5;

        // Glow for user node
        if (isUser) {
          const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, node.size + 20);
          grad.addColorStop(0, "rgba(255,92,26,0.2)");
          grad.addColorStop(1, "rgba(255,92,26,0)");
          ctx.beginPath();
          ctx.arc(nx, ny, node.size + 20, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Hover ring
        if (isHov && !isUser) {
          ctx.beginPath();
          ctx.arc(nx, ny, node.size + 5, 0, Math.PI * 2);
          ctx.strokeStyle = node.color + "80";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Node fill
        ctx.beginPath();
        ctx.arc(nx, ny, node.size, 0, Math.PI * 2);
        ctx.fillStyle = isUser ? "#ff5c1a" : node.color + "cc";
        ctx.fill();

        // White border
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth   = isUser ? 3 : 2;
        ctx.stroke();

        // Label
        const fontSize = Math.max(9, node.size * 0.42);
        ctx.font = `${isUser ? "700 " : "500 "}${fontSize}px DM Sans`;
        ctx.fillStyle = isUser ? "#ffffff" : "rgba(255,255,255,0.95)";
        ctx.textAlign  = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label, nx, ny);

        // Category label below
        ctx.font = `400 ${Math.max(8, node.size * 0.32)}px DM Sans`;
        ctx.fillStyle = "rgba(26,25,22,0.6)";
        ctx.fillText(node.cat, nx, ny + node.size + 11);
        ctx.textBaseline = "alphabetic";
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    // Mouse interaction
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left);
      const my = (e.clientY - rect.top);
      const W  = canvas.width, H = canvas.height;

      const found = stateRef.current.find((n) => {
        const dx = n.x * W - mx;
        const dy = n.y * H - my;
        return Math.sqrt(dx * dx + dy * dy) < n.size + 8;
      });
      hoveredRef.current = found?.id ?? null;
      setHovered(found?.id ?? null);
      canvas.style.cursor = found ? "pointer" : "default";
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const W  = canvas.width, H = canvas.height;

      const found = stateRef.current.find((n) => {
        const dx = n.x * W - mx;
        const dy = n.y * H - my;
        return Math.sqrt(dx * dx + dy * dy) < n.size + 8;
      });
      if (found && found.id !== "user") setLocked(true);
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
    };
  }, [showMap]);

  // ── Tour ────────────────────────────────────────────────────
  if (!showMap) {
    const step   = TOUR_STEPS[tourStep];
    const isLast = tourStep === TOUR_STEPS.length - 1;

    return (
      <>
        <Topbar title="Ecosystem Map" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-bg">

          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-10">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${
                i === tourStep ? "w-6 h-1.5 bg-accent" : i < tourStep ? "w-1.5 h-1.5 bg-accent/40" : "w-1.5 h-1.5 bg-border"
              }`} />
            ))}
          </div>

          <div key={tourStep} className="max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 rounded-2xl bg-accent/10 animate-ping opacity-30" />
              <div className="relative w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center">
                {step.icon}
              </div>
            </div>

            <h2 className="font-syne text-2xl font-extrabold tracking-tight mb-4">{step.title}</h2>
            <p className="text-sm text-text-2 leading-relaxed mb-10">{step.body}</p>

            <button
              onClick={() => { if (isLast) setShowMap(true); else setTourStep((s) => s + 1); }}
              className="inline-flex items-center gap-2 bg-accent text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              {isLast ? "Show me the map →" : "Next →"}
              <ArrowRight className="w-4 h-4" />
            </button>

            {tourStep > 0 && (
              <button onClick={() => setTourStep((s) => s - 1)}
                className="block mx-auto mt-4 text-xs text-text-3 hover:text-text-2 transition-colors">
                ← Back
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Map ──────────────────────────────────────────────────────
  return (
    <>
      <Topbar title="Ecosystem Map">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          <span className="text-xs font-mono text-text-2">Click any node to explore</span>
        </div>
      </Topbar>

      <div className="flex-1 relative overflow-hidden bg-bg">
        {/* Legend */}
        <div className="absolute top-4 left-4 z-10 card px-3 py-2 flex flex-wrap gap-x-3 gap-y-1.5 max-w-xs">
          {LEGEND.map((c) => (
            <div key={c.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
              <span className="text-[10px] text-text-2">{c.label}</span>
            </div>
          ))}
        </div>

        {/* Hovered node tooltip */}
        {hovered && hovered !== "user" && (() => {
          const n = stateRef.current.find((x) => x.id === hovered);
          return n ? (
            <div className="absolute top-4 right-4 z-10 card px-3 py-2">
              <p className="text-xs font-semibold">{n.label}</p>
              <p className="text-[10px] text-text-3">{n.cat} · Click to explore</p>
            </div>
          ) : null;
        })()}

        {/* Node count */}
        <div className="absolute bottom-4 left-4 z-10 card px-3 py-2">
          <p className="text-[10px] text-text-3 font-mono">
            {NODES.length - 1} projects · {EDGES.length} connections · Demo data
          </p>
        </div>

        <canvas ref={canvasRef} className="w-full h-full" />

        {/* Lock overlay */}
        {locked && (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-text/20 backdrop-blur-xl" onClick={() => setLocked(false)} />
            <div className="relative bg-surface rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl border border-border animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-accent animate-pulse" />
              </div>
              <p className="font-syne text-xl font-extrabold mb-2">Coming soon</p>
              <p className="text-sm text-text-2 mb-6 leading-relaxed">
                The full ecosystem map shows every Web3 project, their real partnership connections, and exactly where your project fits in the network.
              </p>
              <button className="btn-primary w-full text-sm mb-2">Join the waitlist →</button>
              <button onClick={() => setLocked(false)} className="text-xs text-text-3 hover:text-text-2 transition-colors">
                Keep exploring demo
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
