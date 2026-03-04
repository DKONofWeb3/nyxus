"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, ArrowRight } from "lucide-react";
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
  { id: "Identified", label: "Identified",  color: "bg-border",        dot: "bg-text-3" },
  { id: "Contacted",  label: "Contacted",   color: "bg-blue-500/10",   dot: "bg-blue-500" },
  { id: "In talks",   label: "In talks",    color: "bg-yellow-500/10", dot: "bg-yellow-500" },
  { id: "Agreed",     label: "Agreed",      color: "bg-brand-green/10",dot: "bg-brand-green" },
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
  const [moving, setMoving] = useState<string | null>(null);

  const moveToStatus = async (id: string, status: string) => {
    setMoving(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("partnerships")
      .update({ status })
      .eq("id", id);

    if (!error) {
      setPartnerships((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );
    }
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
          <Link
            href="/discovery"
            className="inline-flex items-center gap-2 bg-accent text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Go to Discovery <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto bg-bg p-6">
      <div className="flex gap-4 h-full min-w-max">
        {COLUMNS.map((col) => {
          const cards = partnerships.filter((p) => p.status === col.id);
          return (
            <div key={col.id} className="w-72 flex flex-col gap-3 flex-shrink-0">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-semibold text-text-2">{col.label}</span>
                <span className="ml-auto text-[10px] text-text-3 font-mono bg-bg-2 px-1.5 py-px rounded-full">
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {cards.map((p) => {
                  const gradient = GRADIENTS[p.category ?? ""] ?? "from-gray-500 to-gray-600";
                  const initials = p.name.slice(0, 2).toUpperCase();
                  const isMoving = moving === p.id;
                  const nextCols = COLUMNS.filter((c) => c.id !== col.id);

                  return (
                    <div key={p.id} className={`card p-4 flex flex-col gap-3 transition-opacity ${isMoving ? "opacity-50" : ""}`}>
                      <div className="flex items-start gap-2.5">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{p.name}</p>
                          <p className="text-[10px] text-text-3">{p.category ?? "Unknown"}</p>
                        </div>
                        {p.match_score && (
                          <span className="text-[10px] font-mono text-text-3 flex-shrink-0">{p.match_score}%</span>
                        )}
                      </div>

                      {p.notes && (
                        <p className="text-xs text-text-2 leading-relaxed line-clamp-2">{p.notes}</p>
                      )}

                      {/* Move to next stage */}
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-border">
                        {nextCols.map((nc) => (
                          <button
                            key={nc.id}
                            onClick={() => moveToStatus(p.id, nc.id)}
                            disabled={isMoving}
                            className="text-[10px] text-text-3 hover:text-accent border border-border hover:border-accent/30 px-2 py-0.5 rounded transition-colors"
                          >
                            → {nc.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Empty column placeholder */}
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
    </div>
  );
}
