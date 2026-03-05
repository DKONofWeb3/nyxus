"use client";

import { MatchScoreBadge } from "@/components/ui/Badge";
import {
  Search, X, ExternalLink, Twitter, MessageCircle,
  Users, Zap, Check, Loader2, Sparkles, SlidersHorizontal,
  Globe
} from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface DiscoveredProject {
  id: string; name: string; category: string | null;
  narrative: string | null; twitter_handle: string | null;
  telegram_handle: string | null; twitter_followers: number | null;
  telegram_members: number | null; last_active: string | null;
  source: string | null;
  raw_data: { has_collab_signal?: boolean; verified?: boolean; tvl?: number; market_cap?: number; website?: string; symbol?: string; chains?: string[]; } | null;
}

interface Match {
  id: string; score: number; reasoning: string; category_match: boolean;
  discovered_projects: DiscoveredProject | DiscoveredProject[];
}

interface Props { matches: Match[]; projectName: string; projectId: string; }

function getDP(match: Match): DiscoveredProject | null {
  if (!match.discovered_projects) return null;
  return Array.isArray(match.discovered_projects) ? match.discovered_projects[0] ?? null : match.discovered_projects;
}

const GRADIENTS: Record<string, string> = {
  "DeFi": "from-blue-500 to-purple-500", "Meme coin": "from-accent to-orange-400",
  "NFT": "from-pink-500 to-purple-500", "Gaming / GameFi": "from-green-500 to-teal-500",
  "AI + Crypto": "from-cyan-500 to-blue-500", "Protocol": "from-violet-500 to-indigo-500",
  "Infrastructure": "from-slate-500 to-gray-600", "Trading bot": "from-yellow-500 to-orange-500",
  "Casino / Gambling": "from-red-500 to-pink-500",
};

const CATEGORIES = ["All","DeFi","Meme coin","NFT","Gaming / GameFi","AI + Crypto","Protocol","Infrastructure","Trading bot"];
const SOURCES = ["All sources","coingecko","defillama","telegram"];

function timeAgo(d: string | null) {
  if (!d) return "Unknown";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "Today"; if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`; if (days < 30) return `${Math.floor(days/7)}w ago`;
  return `${Math.floor(days/30)}mo ago`;
}
function fmt(n: number | null) {
  if (!n) return "—";
  if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n/1e3).toFixed(1)}k`; return n.toString();
}
function fmtTvl(tvl?: number) {
  if (!tvl) return "";
  if (tvl >= 1e9) return `$${(tvl/1e9).toFixed(1)}B TVL`;
  if (tvl >= 1e6) return `$${(tvl/1e6).toFixed(1)}M TVL`;
  if (tvl >= 1e3) return `$${(tvl/1e3).toFixed(0)}k TVL`;
  return "";
}

function DetailPanel({ match, onClose, projectId }: { match: Match; onClose: () => void; projectId: string }) {
  const [saving, setSaving] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [enriching, setEnriching] = useState(false);
  const [enriched, setEnriched] = useState<string | null>(null);
  const dp = getDP(match);
  if (!dp) return null;
  const gradient = GRADIENTS[dp.category ?? ""] ?? "from-gray-500 to-gray-600";

  const handleSave = async () => {
    if (saving !== "idle") return;
    setSaving("saving");
    const supabase = createClient();
    const { error } = await supabase.from("partnerships").upsert({
      project_id: projectId, discovered_project_id: dp.id, name: dp.name,
      category: dp.category, status: "Identified", notes: match.reasoning, match_score: match.score,
    }, { onConflict: "project_id,discovered_project_id" });
    if (error) { setSaving("error"); setTimeout(() => setSaving("idle"), 2000); }
    else { setSaving("saved"); setTimeout(() => { window.location.href = "/partnerships"; }, 900); }
  };

  const handleEnrich = async () => {
    if (enriching || enriched) return;
    setEnriching(true);
    try {
      const res = await fetch("/api/enrich", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: dp.name, category: dp.category, narrative: dp.narrative }),
      });
      const data = await res.json();
      setEnriched(data.summary || "No additional data found.");
    } catch { setEnriched("Could not load enriched data."); }
    finally { setEnriching(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end">
      <div className="absolute inset-0 bg-text/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border-l border-border h-full w-full max-w-md flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
            {dp.name.slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-syne font-bold text-base truncate">{dp.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-text-3">{dp.category ?? "Unknown"}</p>
              {dp.raw_data?.verified && <span className="text-[9px] font-bold text-green-400 border border-green-400/30 bg-green-400/10 px-1.5 py-px rounded-full">VERIFIED</span>}
              {dp.source && <span className="text-[9px] text-text-3 border border-border px-1.5 py-px rounded-full capitalize">{dp.source}</span>}
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-bg-2 flex items-center justify-center"><X className="w-4 h-4 text-text-2" /></button>
        </div>

        <div className="px-5 py-3 bg-bg border-b border-border flex items-center justify-between">
          <div>
            <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-0.5">Match score</p>
            <p className="font-syne text-2xl font-extrabold">{match.score}%</p>
          </div>
          <MatchScoreBadge score={match.score} />
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          <div>
            <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-2">Why this match</p>
            <p className="text-sm text-text-2 leading-relaxed bg-bg rounded-lg p-3">{match.reasoning}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest">AI Deep Dive</p>
              {!enriched && (
                <button onClick={handleEnrich} disabled={enriching}
                  className="flex items-center gap-1 text-[10px] text-accent font-semibold hover:opacity-80 transition-opacity disabled:opacity-50">
                  {enriching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {enriching ? "Researching..." : "Get AI insights →"}
                </button>
              )}
            </div>
            {enriched
              ? <p className="text-sm text-text-2 leading-relaxed bg-accent/5 border border-accent/20 rounded-lg p-3">{enriched}</p>
              : <p className="text-xs text-text-3 italic">Click above for AI-powered insights on this project's recent activity and partnership fit.</p>
            }
          </div>

          {dp.narrative && dp.narrative.length > 20 && (
            <div>
              <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-2">About</p>
              <p className="text-sm text-text-2 leading-relaxed">{dp.narrative.slice(0,400)}{dp.narrative.length > 400 ? "..." : ""}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-2">Stats</p>
            <div className="grid grid-cols-2 gap-2">
              {dp.twitter_followers && <div className="bg-bg rounded-lg p-3"><p className="text-[10px] text-text-3 mb-1 flex items-center gap-1"><Twitter className="w-3 h-3"/>Twitter</p><p className="text-sm font-semibold">{fmt(dp.twitter_followers)}</p></div>}
              {dp.telegram_members && <div className="bg-bg rounded-lg p-3"><p className="text-[10px] text-text-3 mb-1 flex items-center gap-1"><MessageCircle className="w-3 h-3"/>Telegram</p><p className="text-sm font-semibold">{fmt(dp.telegram_members)}</p></div>}
              {dp.raw_data?.tvl && <div className="bg-bg rounded-lg p-3 col-span-2"><p className="text-[10px] text-text-3 mb-1">TVL</p><p className="text-sm font-semibold">{fmtTvl(dp.raw_data.tvl)}</p></div>}
              {dp.raw_data?.chains && dp.raw_data.chains.length > 0 && <div className="bg-bg rounded-lg p-3 col-span-2"><p className="text-[10px] text-text-3 mb-1">Chains</p><p className="text-sm font-semibold">{dp.raw_data.chains.slice(0,4).join(", ")}</p></div>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {dp.twitter_handle && <a href={`https://x.com/${dp.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-bg border border-border hover:border-text-2 transition-colors"><Twitter className="w-3.5 h-3.5"/>@{dp.twitter_handle}<ExternalLink className="w-3 h-3 text-text-3"/></a>}
            {dp.telegram_handle && <a href={`https://t.me/${dp.telegram_handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-bg border border-border hover:border-text-2 transition-colors"><MessageCircle className="w-3.5 h-3.5"/>{dp.telegram_handle}<ExternalLink className="w-3 h-3 text-text-3"/></a>}
            {dp.raw_data?.website && <a href={dp.raw_data.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-bg border border-border hover:border-text-2 transition-colors"><Globe className="w-3.5 h-3.5"/>Website<ExternalLink className="w-3 h-3 text-text-3"/></a>}
          </div>
        </div>

        <div className="p-5 border-t border-border">
          <button onClick={handleSave} disabled={saving !== "idle"}
            className="w-full bg-accent text-white font-semibold text-sm py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
            {saving === "saving" && <Loader2 className="w-4 h-4 animate-spin"/>}
            {saving === "saved" && <Check className="w-4 h-4"/>}
            {saving === "idle" && "Save to partnerships →"}
            {saving === "saving" && "Saving..."}
            {saving === "saved" && "Saved!"}
            {saving === "error" && "Error — try again"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DiscoveryClient({ matches, projectName, projectId }: Props) {
  const [search, setSearch] = useState("");
  const [aiSearch, setAiSearch] = useState("");
  const [aiResults, setAiResults] = useState<Match[] | null>(null);
  const [aiIntent, setAiIntent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [category, setCategory] = useState("All");
  const [source, setSource] = useState("All sources");
  const [minScore, setMinScore] = useState(0);
  const [collabOnly, setCollabOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Match | null>(null);
  const [sortBy, setSortBy] = useState<"score"|"recent">("score");

  const handleAiSearch = async () => {
    if (!aiSearch.trim() || aiLoading) return;
    setAiLoading(true); setAiResults(null); setAiIntent("");
    try {
      const res = await fetch("/api/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiSearch, project_id: projectId }),
      });
      const data = await res.json();
      setAiResults(data.results || []); setAiIntent(data.intent?.summary || "");
    } catch { setAiResults([]); } finally { setAiLoading(false); }
  };

  const clearAi = () => { setAiSearch(""); setAiResults(null); setAiIntent(""); };

  const displayMatches = aiResults ?? matches;
  const collabCount = matches.filter(m => getDP(m)?.raw_data?.has_collab_signal).length;

  const filtered = useMemo(() => {
    let r = [...displayMatches];
    if (search && !aiResults) {
      const q = search.toLowerCase();
      r = r.filter(m => getDP(m)?.name.toLowerCase().includes(q) || getDP(m)?.narrative?.toLowerCase().includes(q) || getDP(m)?.category?.toLowerCase().includes(q));
    }
    if (category !== "All") r = r.filter(m => getDP(m)?.category === category);
    if (source !== "All sources") r = r.filter(m => getDP(m)?.source === source);
    if (minScore > 0) r = r.filter(m => m.score >= minScore);
    if (collabOnly) r = r.filter(m => getDP(m)?.raw_data?.has_collab_signal);
    if (sortBy === "recent") r.sort((a,b) => new Date(getDP(b)?.last_active??0).getTime() - new Date(getDP(a)?.last_active??0).getTime());
    else r.sort((a,b) => b.score - a.score);
    return r;
  }, [displayMatches, search, category, source, minScore, collabOnly, sortBy, aiResults]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-bg">
      {/* AI Search */}
      <div className="mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
            <input value={aiSearch} onChange={e => setAiSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAiSearch()}
              placeholder="Ask anything — 'find gaming projects on Solana actively looking for collabs'..."
              className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-sm outline-none focus:border-accent/50 transition-colors placeholder:text-text-3" />
            {aiSearch && <button onClick={clearAi} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-text-3 hover:text-text-2"/></button>}
          </div>
          <button onClick={handleAiSearch} disabled={!aiSearch.trim() || aiLoading}
            className="px-4 py-3 bg-accent text-white font-semibold text-sm rounded-xl hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-2">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
            {aiLoading ? "Searching..." : "AI Search"}
          </button>
        </div>
        {aiIntent && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-accent font-medium bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full">✦ {aiIntent}</span>
            <button onClick={clearAi} className="text-xs text-text-3 hover:text-text-2">clear →</button>
          </div>
        )}
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-3"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by name..."
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm outline-none focus:border-accent/50 transition-colors placeholder:text-text-3"/>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${category === cat ? "bg-accent text-white" : "bg-surface border border-border text-text-2 hover:border-accent/40"}`}>
              {cat}
            </button>
          ))}
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0 ${showFilters ? "bg-accent/10 border-accent/30 text-accent" : "bg-surface border-border text-text-2"}`}>
          <SlidersHorizontal className="w-3.5 h-3.5"/>Filters
          {(minScore > 0 || collabOnly || source !== "All sources") && <span className="w-1.5 h-1.5 rounded-full bg-accent"/>}
        </button>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as "score"|"recent")}
          className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-surface text-text-2 outline-none flex-shrink-0">
          <option value="score">Best match</option>
          <option value="recent">Most recent</option>
        </select>
      </div>

      {/* Extended filters */}
      {showFilters && (
        <div className="card p-4 mb-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-semibold text-text-3 uppercase tracking-widest block mb-2">Min score: {minScore}%</label>
            <input type="range" min={0} max={90} step={5} value={minScore} onChange={e => setMinScore(Number(e.target.value))} className="w-full accent-[#ff5c1a]"/>
            <div className="flex justify-between text-[10px] text-text-3 mt-0.5"><span>0%</span><span>50%</span><span>90%</span></div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-text-3 uppercase tracking-widest block mb-2">Source</label>
            <div className="flex gap-1.5 flex-wrap">
              {SOURCES.map(s => (
                <button key={s} onClick={() => setSource(s)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors capitalize ${source === s ? "bg-accent text-white border-accent" : "bg-bg border-border text-text-2 hover:border-accent/40"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCollabOnly(!collabOnly)}
              className={`relative w-9 h-5 rounded-full transition-colors ${collabOnly ? "bg-accent" : "bg-bg-2 border border-border"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${collabOnly ? "translate-x-4" : "translate-x-0.5"}`}/>
            </button>
            <span className="text-xs text-text-2"><Zap className="w-3 h-3 inline text-accent mr-1"/>Collab signal only <span className="text-text-3">({collabCount})</span></span>
          </div>
          {(minScore > 0 || collabOnly || source !== "All sources") && (
            <button onClick={() => { setMinScore(0); setCollabOnly(false); setSource("All sources"); }} className="text-xs text-accent hover:underline self-end">Reset</button>
          )}
        </div>
      )}

      <p className="text-[11px] text-text-3 font-mono mb-4">
        {filtered.length} projects · {projectName} · {aiResults ? "AI search results" : `sorted by ${sortBy === "score" ? "match score" : "recent activity"}`}
      </p>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-text-2 mb-2">No projects match your filters.</p>
          <p className="text-xs text-text-3">Try adjusting your score threshold or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(match => {
            const dp = getDP(match);
            if (!dp) return null;
            const gradient = GRADIENTS[dp.category ?? ""] ?? "from-gray-500 to-gray-600";
            const tvlStr = fmtTvl(dp.raw_data?.tvl);
            return (
              <div key={match.id} onClick={() => setSelected(match)}
                className="card p-4 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-card-lg hover:-translate-y-px">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {dp.name.slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{dp.name}</p>
                    <p className="text-[10px] text-text-3">{dp.category ?? "Unknown"}</p>
                  </div>
                  <MatchScoreBadge score={match.score}/>
                </div>
                <p className="text-xs text-text-2 leading-relaxed line-clamp-2">{match.reasoning}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {(dp.twitter_followers || dp.telegram_members) && <span className="text-[10px] text-text-2 flex items-center gap-1"><Users className="w-3 h-3"/>{fmt(dp.twitter_followers || dp.telegram_members)}</span>}
                    {tvlStr && <span className="text-[10px] text-text-3">{tvlStr}</span>}
                    {dp.raw_data?.has_collab_signal && <span className="text-[10px] text-accent font-semibold flex items-center gap-1"><Zap className="w-3 h-3"/>Signal</span>}
                  </div>
                  <span className="text-[10px] text-text-3">{timeAgo(dp.last_active)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && <DetailPanel match={selected} onClose={() => setSelected(null)} projectId={projectId}/>}
    </div>
  );
}
