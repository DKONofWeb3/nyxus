"use client";

import { MatchScoreBadge } from "@/components/ui/Badge";
import { Search, X, ExternalLink, Twitter, MessageCircle, Users, Calendar, Zap, Check, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────
interface DiscoveredProject {
  id: string;
  name: string;
  category: string | null;
  narrative: string | null;
  twitter_handle: string | null;
  telegram_handle: string | null;
  twitter_followers: number | null;
  telegram_members: number | null;
  last_active: string | null;
  source: string | null;
  raw_data: { has_collab_signal?: boolean; verified?: boolean } | null;
}

interface Match {
  id: string;
  score: number;
  reasoning: string;
  category_match: boolean;
  discovered_projects: DiscoveredProject | DiscoveredProject[];
}

// Supabase joins always return arrays even for one-to-one relations
function getDP(match: Match): DiscoveredProject | null {
  if (!match.discovered_projects) return null;
  return Array.isArray(match.discovered_projects)
    ? match.discovered_projects[0] ?? null
    : match.discovered_projects;
}

interface Props {
  matches: Match[];
  projectName: string;
  projectId: string;
}

// ── Category gradient map ──────────────────────────────────────
const GRADIENTS: Record<string, string> = {
  "DeFi":              "from-blue-500 to-purple-500",
  "Meme coin":         "from-accent to-orange-400",
  "NFT":               "from-pink-500 to-purple-500",
  "Gaming / GameFi":   "from-green-500 to-teal-500",
  "AI + Crypto":       "from-cyan-500 to-blue-500",
  "Protocol":          "from-violet-500 to-indigo-500",
  "Infrastructure":    "from-slate-500 to-gray-600",
  "Trading bot":       "from-yellow-500 to-orange-500",
  "Casino / Gambling": "from-red-500 to-pink-500",
};

const CATEGORIES = ["All", "DeFi", "Meme coin", "NFT", "Gaming / GameFi", "AI + Crypto", "Protocol", "Infrastructure", "Trading bot"];

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatNumber(n: number | null): string {
  if (!n) return "—";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

// ── Project detail panel ───────────────────────────────────────
function DetailPanel({ match, onClose, projectId }: { match: Match; onClose: () => void; projectId: string }) {
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const handleSave = async () => {
    if (saving !== "idle") return;
    setSaving("saving");
    const dp = getDP(match);
    if (!dp) return;
    const supabase = createClient();
    const payload = {
      project_id: projectId,
      discovered_project_id: dp.id,
      name: dp.name,
      category: dp.category,
      status: "Identified",
      notes: match.reasoning,
      match_score: match.score,
    };
    console.log("[NYXUS] Saving partnership:", payload);

    const { data: saved, error } = await supabase
      .from("partnerships")
      .upsert(payload, { onConflict: "project_id,discovered_project_id" })
      .select();

    console.log("[NYXUS] Save result:", { saved, error });

    if (error) {
      console.error("[NYXUS] Save error:", error.message, error.details, error.hint);
      setSaving("error");
      setTimeout(() => setSaving("idle"), 3000);
    } else {
      setSaving("saved");
      setTimeout(() => { window.location.href = "/partnerships"; }, 900);
    }
  };
  const dp = getDP(match);
      if (!dp) return null;
  const gradient = GRADIENTS[dp.category ?? ""] ?? "from-gray-500 to-gray-600";
  const initials = dp.name.slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-text/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-surface border-l border-border h-full w-full max-w-md flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-syne font-bold text-base">{dp.name}</p>
            <p className="text-xs text-text-3">{dp.category ?? "Unknown category"}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-bg-2 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-text-2" />
          </button>
        </div>

        {/* Score banner */}
        <div className="px-5 py-3 bg-bg border-b border-border flex items-center justify-between">
          <div>
            <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-0.5">Match score</p>
            <p className="font-syne text-2xl font-extrabold">{match.score}%</p>
          </div>
          <MatchScoreBadge score={match.score} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {/* Reasoning */}
          <div>
            <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-2">Why this match</p>
            <p className="text-sm text-text-2 leading-relaxed bg-bg rounded-lg p-3">{match.reasoning}</p>
          </div>

          {/* Narrative */}
          {dp.narrative && dp.narrative !== "No description available" && (
            <div>
              <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-2">About this project</p>
              <p className="text-sm text-text-2 leading-relaxed">{dp.narrative.slice(0, 400)}{dp.narrative.length > 400 ? "..." : ""}</p>
            </div>
          )}

          {/* Stats */}
          <div>
            <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-2">Community stats</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-bg rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Twitter className="w-3 h-3 text-text-3" />
                  <p className="text-[10px] text-text-3 uppercase tracking-wide">X Followers</p>
                </div>
                <p className="font-syne font-bold text-lg">{formatNumber(dp.twitter_followers)}</p>
              </div>
              <div className="bg-bg rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageCircle className="w-3 h-3 text-text-3" />
                  <p className="text-[10px] text-text-3 uppercase tracking-wide">TG Members</p>
                </div>
                <p className="font-syne font-bold text-lg">{formatNumber(dp.telegram_members)}</p>
              </div>
              <div className="bg-bg rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3 h-3 text-text-3" />
                  <p className="text-[10px] text-text-3 uppercase tracking-wide">Last active</p>
                </div>
                <p className="font-syne font-bold text-lg">{timeAgo(dp.last_active)}</p>
              </div>
              <div className="bg-bg rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-3 h-3 text-text-3" />
                  <p className="text-[10px] text-text-3 uppercase tracking-wide">Collab signal</p>
                </div>
                <p className="font-syne font-bold text-lg">{dp.raw_data?.has_collab_signal ? "Yes 🔥" : "No"}</p>
              </div>
            </div>
          </div>

          {/* Links */}
          {(dp.twitter_handle || dp.telegram_handle) && (
            <div>
              <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-2">Find them</p>
              <div className="flex gap-2">
                {dp.twitter_handle && (
                  <a
                    href={`https://twitter.com/${dp.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-bg border border-border hover:border-text-2 transition-colors"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                    @{dp.twitter_handle}
                    <ExternalLink className="w-3 h-3 text-text-3" />
                  </a>
                )}
                {dp.telegram_handle && (
                  <a
                    href={`https://t.me/${dp.telegram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-bg border border-border hover:border-text-2 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {dp.telegram_handle}
                    <ExternalLink className="w-3 h-3 text-text-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="p-5 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving !== "idle"}
            className="w-full bg-accent text-white font-semibold text-sm py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {saving === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving === "saved"  && <Check   className="w-4 h-4" />}
            {saving === "idle"   && "Save to partnerships →"}
            {saving === "saving" && "Saving..."}
            {saving === "saved"  && "Saved!"}
            {saving === "error"  && "Error — try again"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main discovery client ──────────────────────────────────────
export function DiscoveryClient({ matches, projectName, projectId }: Props) {
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("All");
  const [minScore, setMinScore]     = useState(0);
  const [selected, setSelected]     = useState<Match | null>(null);
  const [sortBy, setSortBy]         = useState<"score" | "recent">("score");

  // Filter + sort
  const filtered = useMemo(() => {
    let result = [...matches];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          getDP(m)?.name.toLowerCase().includes(q) ||
          getDP(m)?.narrative?.toLowerCase().includes(q) ||
          getDP(m)?.category?.toLowerCase().includes(q)
      );
    }

    if (category !== "All") {
      result = result.filter((m) => getDP(m)?.category === category);
    }

    if (minScore > 0) {
      result = result.filter((m) => m.score >= minScore);
    }

    if (sortBy === "recent") {
      result.sort((a, b) => {
        const da = new Date(getDP(a)?.last_active ?? 0).getTime();
        const db = new Date(getDP(b)?.last_active ?? 0).getTime();
        return db - da;
      });
    } else {
      result.sort((a, b) => b.score - a.score);
    }

    return result;
  }, [matches, search, category, minScore, sortBy]);

  // No matches at all
  if (matches.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-bg">
        <div className="text-center">
          <p className="text-3xl mb-3">🔍</p>
          <p className="font-syne font-bold text-base mb-1">No matches yet</p>
          <p className="text-sm text-text-2">Go to the dashboard and hit "Run discovery →" first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-bg">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
        <input
          className="input-base pl-9 pr-4"
          placeholder="Search by name, narrative, category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Category chips */}
        <div className="flex gap-1.5 flex-wrap flex-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                category === cat
                  ? "bg-text text-bg border-text"
                  : "bg-surface border-border text-text-2 hover:border-text-2"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Score filter */}
        <select
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-surface text-text-2 outline-none focus:border-accent"
        >
          <option value={0}>All scores</option>
          <option value={40}>40%+</option>
          <option value={50}>50%+</option>
          <option value={60}>60%+</option>
          <option value={70}>70%+</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "score" | "recent")}
          className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-surface text-text-2 outline-none focus:border-accent"
        >
          <option value="score">Sort: Best match</option>
          <option value="recent">Sort: Most recent</option>
        </select>
      </div>

      {/* Result count */}
      <p className="text-[11px] text-text-3 font-mono mb-4">
        {filtered.length} projects · {projectName} · sorted by {sortBy === "score" ? "match score" : "recent activity"}
      </p>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-text-2">No projects match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((match) => {
            const dp = getDP(match);
      if (!dp) return null;
            const gradient = GRADIENTS[dp.category ?? ""] ?? "from-gray-500 to-gray-600";
            const initials = dp.name.slice(0, 2).toUpperCase();
            const isLow = match.score < 35;

            return (
              <div
                key={match.id}
                onClick={() => setSelected(match)}
                className={`card p-4 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-card-lg hover:-translate-y-px ${isLow ? "opacity-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{dp.name}</p>
                    <p className="text-[10px] text-text-3">{dp.category ?? "Unknown"}</p>
                  </div>
                  <MatchScoreBadge score={match.score} />
                </div>

                <p className="text-xs text-text-2 leading-relaxed line-clamp-2">
                  {match.reasoning}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    {dp.telegram_members && (
                      <span className="text-[10px] text-text-2 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {formatNumber(dp.telegram_members)}
                      </span>
                    )}
                    {dp.raw_data?.has_collab_signal && (
                      <span className="text-[10px] text-accent font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Active signal
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-text-3">{timeAgo(dp.last_active)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <DetailPanel match={selected} onClose={() => setSelected(null)} projectId={projectId} />
      )}
    </div>
  );
}