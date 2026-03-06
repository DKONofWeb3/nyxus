"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, ArrowRight, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface Partnership {
  id: string;
  name: string;
  category: string | null;
  status: string;
  notes: string | null;
  match_score: number | null;
  contact_name: string | null;
  contact_handle: string | null;
  next_step: string | null;
  created_at: string;
}

const COLUMNS = [
  { id: "Identified", label: "Identified",  dot: "bg-text-3",       text: "text-text-3",       bg: "bg-text-3/10" },
  { id: "Contacted",  label: "Contacted",   dot: "bg-blue-400",     text: "text-blue-400",     bg: "bg-blue-400/10" },
  { id: "In talks",   label: "In talks",    dot: "bg-yellow-400",   text: "text-yellow-400",   bg: "bg-yellow-400/10" },
  { id: "Agreed",     label: "Agreed",      dot: "bg-green-400",    text: "text-green-400",    bg: "bg-green-400/10" },
];

const GRADIENTS: Record<string, string> = {
  "DeFi":            "from-blue-500 to-purple-500",
  "Meme coin":       "from-orange-400 to-red-400",
  "NFT":             "from-pink-500 to-purple-500",
  "Gaming / GameFi": "from-green-500 to-teal-500",
  "AI + Crypto":     "from-cyan-500 to-blue-500",
  "Protocol":        "from-violet-500 to-indigo-500",
  "Infrastructure":  "from-slate-500 to-gray-600",
  "Trading bot":     "from-yellow-500 to-orange-500",
};

export function PartnershipsClient({
  partnerships: initial,
  projectId,
}: {
  partnerships: Partnership[];
  projectId: string;
}) {
  const [partnerships, setPartnerships] = useState<Partnership[]>(initial);
  const [moving, setMoving]   = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");

  const moveToStatus = async (id: string, status: string) => {
    setMoving(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("partnerships").update({ status }).eq("id", id);
    if (!error) setPartnerships(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    setMoving(null);
  };

  if (partnerships.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-bg">
        <div className="text-center max-w-sm">
          <p className="text-3xl mb-4">🤝</p>
          <p className="font-syne font-extrabold text-lg mb-2">No partnerships yet</p>
          <p className="text-sm text-text-2 mb-6 leading-relaxed">
            Go to Discovery, open any project, and hit "Save to partnerships" to start tracking deals here.
          </p>
          <Link href="/discovery"
            className="inline-flex items-center gap-2 bg-accent text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
            Go to Discovery <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const tabs = ["All", ...COLUMNS.map(c => c.id)];
  const displayed = activeTab === "All" ? partnerships : partnerships.filter(p => p.status === activeTab);
  const col = COLUMNS.find(c => c.id === activeTab);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg">

      {/* ── Stage tabs (mobile-first horizontal scroll) ──── */}
      <div className="flex items-center gap-1.5 px-4 py-3 overflow-x-auto border-b border-border flex-shrink-0 no-scrollbar">
        {tabs.map(tab => {
          const colDef = COLUMNS.find(c => c.id === tab);
          const count  = tab === "All"
            ? partnerships.length
            : partnerships.filter(p => p.status === tab).length;
          const isActive = tab === activeTab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-accent text-white"
                  : "bg-surface border border-border text-text-2 hover:border-accent/30"
              }`}
            >
              {colDef && (
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : colDef.dot}`} />
              )}
              {tab}
              <span className={`text-[10px] font-mono ${isActive ? "text-white/70" : "text-text-3"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Desktop: horizontal kanban ────────────────────── */}
      <div className="hidden md:flex flex-1 overflow-x-auto p-6 gap-4">
        {COLUMNS.map((col) => {
          const cards = partnerships.filter(p => p.status === col.id);
          return (
            <div key={col.id} className="w-72 flex flex-col gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-semibold text-text-2">{col.label}</span>
                <span className="ml-auto text-[10px] text-text-3 font-mono bg-bg-2 px-1.5 py-px rounded-full">{cards.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {cards.map(p => <PartnerCard key={p.id} p={p} moving={moving} moveToStatus={moveToStatus} />)}
                {cards.length === 0 && (
                  <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
                    <p className="text-[11px] text-text-3">Drop projects here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Mobile: vertical list ─────────────────────────── */}
      <div className="md:hidden flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className={`w-12 h-12 rounded-2xl ${col?.bg ?? "bg-bg-2"} flex items-center justify-center`}>
              <Users className={`w-6 h-6 ${col?.text ?? "text-text-3"}`} />
            </div>
            <p className="text-sm text-text-2 font-semibold">Nothing in {activeTab}</p>
            <p className="text-xs text-text-3 text-center max-w-xs">
              Move deals here from other stages or save new ones from Discovery.
            </p>
          </div>
        ) : (
          displayed.map(p => <MobilePartnerCard key={p.id} p={p} moving={moving} moveToStatus={moveToStatus} />)
        )}
      </div>
    </div>
  );
}

// ── Desktop card ───────────────────────────────────────────────
function PartnerCard({ p, moving, moveToStatus }: {
  p: Partnership;
  moving: string | null;
  moveToStatus: (id: string, status: string) => void;
}) {
  const gradient = GRADIENTS[p.category ?? ""] ?? "from-gray-500 to-gray-600";
  const isMoving = moving === p.id;
  const nextCols = COLUMNS.filter(c => c.id !== p.status);

  return (
    <div className={`card p-4 flex flex-col gap-3 transition-opacity ${isMoving ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-2.5">
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {p.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{p.name}</p>
          <p className="text-[10px] text-text-3">{p.category ?? "Unknown"}</p>
        </div>
        {p.match_score && <span className="text-[10px] font-mono text-text-3 flex-shrink-0">{p.match_score}%</span>}
      </div>
      {p.notes && <p className="text-xs text-text-2 leading-relaxed line-clamp-2">{p.notes}</p>}
      <div className="flex flex-wrap gap-1 pt-1 border-t border-border">
        {nextCols.map(nc => (
          <button key={nc.id} onClick={() => moveToStatus(p.id, nc.id)} disabled={isMoving}
            className="text-[10px] text-text-3 hover:text-accent border border-border hover:border-accent/30 px-2 py-0.5 rounded transition-colors">
            → {nc.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Mobile card ────────────────────────────────────────────────
function MobilePartnerCard({ p, moving, moveToStatus }: {
  p: Partnership;
  moving: string | null;
  moveToStatus: (id: string, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const gradient = GRADIENTS[p.category ?? ""] ?? "from-gray-500 to-gray-600";
  const isMoving = moving === p.id;
  const currentCol = COLUMNS.find(c => c.id === p.status);
  const nextCols   = COLUMNS.filter(c => c.id !== p.status);

  return (
    <div className={`card transition-opacity ${isMoving ? "opacity-50" : ""}`}>
      {/* Main row */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {p.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{p.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-semibold flex items-center gap-1 ${currentCol?.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentCol?.dot}`} />
              {p.status}
            </span>
            {p.category && <span className="text-[10px] text-text-3">· {p.category}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {p.match_score && (
            <span className="text-xs font-bold text-accent">{p.match_score}%</span>
          )}
          {isMoving
            ? <Loader2 className="w-4 h-4 text-text-3 animate-spin" />
            : <ChevronRight className={`w-4 h-4 text-text-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
          }
        </div>
      </button>

      {/* Expanded actions */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-border pt-3">
          {p.notes && (
            <p className="text-xs text-text-2 leading-relaxed">{p.notes}</p>
          )}
          <div>
            <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-2">Move to stage</p>
            <div className="grid grid-cols-3 gap-1.5">
              {nextCols.map(nc => (
                <button
                  key={nc.id}
                  onClick={() => moveToStatus(p.id, nc.id)}
                  disabled={isMoving}
                  className={`flex items-center justify-center gap-1 text-[11px] font-semibold px-2 py-2 rounded-lg border transition-colors ${nc.bg} ${nc.text} border-current/20 hover:opacity-80`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${nc.dot}`} />
                  {nc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
