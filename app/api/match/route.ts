/**
 * NYXUS — Rule-Based Matching Engine
 * POST /api/match
 *
 * Scores each discovered project against the user's project using
 * weighted rules — no AI API needed, no cost, runs instantly.
 *
 * Scoring breakdown (100 points total):
 *   35pts — Narrative keyword overlap
 *   25pts — Category compatibility
 *   20pts — Partnership goal alignment
 *   10pts — Collab signal detected
 *   10pts — Community size (activity proxy)
 *
 * Body: { project_id: string }
 * Returns: { matched: number, top_score: number, results: MatchResult[] }
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// ── Supabase (service role — bypasses RLS for server-side writes) ──
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Types ──────────────────────────────────────────────────────
interface UserProject {
  id: string;
  user_id: string;
  name: string;
  category: string;
  narrative: string;
  stage: string;
  goals: string[];
}

interface DiscoveredProject {
  id: string;
  name: string;
  category: string | null;
  narrative: string | null;
  twitter_followers: number | null;
  telegram_members: number | null;
  raw_data: { has_collab_signal?: boolean } | null;
}

interface MatchResult {
  discovered_project_id: string;
  name: string;
  score: number;
  reasoning: string;
  category_match: boolean;
  stage_compatible: boolean;
}

// ── Category compatibility matrix ──────────────────────────────
// How well each pair of categories can partner (0-1 multiplier)
const CATEGORY_COMPAT: Record<string, Record<string, number>> = {
  "DeFi":              { "DeFi": 1.0, "Meme coin": 0.7, "Protocol": 0.9, "Infrastructure": 0.8, "Trading bot": 0.8, "AI + Crypto": 0.6, "NFT": 0.5, "Gaming / GameFi": 0.5, "Casino / Gambling": 0.4 },
  "Meme coin":         { "Meme coin": 1.0, "DeFi": 0.7, "NFT": 0.8, "Gaming / GameFi": 0.7, "Trading bot": 0.6, "AI + Crypto": 0.5, "Protocol": 0.4, "Infrastructure": 0.3, "Casino / Gambling": 0.7 },
  "NFT":               { "NFT": 1.0, "Meme coin": 0.8, "Gaming / GameFi": 0.9, "AI + Crypto": 0.6, "DeFi": 0.5, "Protocol": 0.4, "Trading bot": 0.4, "Infrastructure": 0.3, "Casino / Gambling": 0.5 },
  "Gaming / GameFi":   { "Gaming / GameFi": 1.0, "NFT": 0.9, "Meme coin": 0.7, "AI + Crypto": 0.7, "DeFi": 0.5, "Protocol": 0.5, "Trading bot": 0.4, "Infrastructure": 0.4, "Casino / Gambling": 0.6 },
  "AI + Crypto":       { "AI + Crypto": 1.0, "Protocol": 0.8, "Infrastructure": 0.8, "DeFi": 0.6, "Trading bot": 0.7, "Gaming / GameFi": 0.7, "NFT": 0.6, "Meme coin": 0.4, "Casino / Gambling": 0.3 },
  "Protocol":          { "Protocol": 1.0, "Infrastructure": 1.0, "DeFi": 0.9, "AI + Crypto": 0.8, "Gaming / GameFi": 0.5, "Trading bot": 0.6, "NFT": 0.4, "Meme coin": 0.3, "Casino / Gambling": 0.3 },
  "Infrastructure":    { "Infrastructure": 1.0, "Protocol": 1.0, "DeFi": 0.8, "AI + Crypto": 0.8, "Trading bot": 0.6, "Gaming / GameFi": 0.4, "NFT": 0.4, "Meme coin": 0.3, "Casino / Gambling": 0.3 },
  "Trading bot":       { "Trading bot": 1.0, "DeFi": 0.8, "AI + Crypto": 0.7, "Protocol": 0.6, "Meme coin": 0.6, "Infrastructure": 0.6, "Gaming / GameFi": 0.4, "NFT": 0.4, "Casino / Gambling": 0.5 },
  "Casino / Gambling": { "Casino / Gambling": 1.0, "Meme coin": 0.7, "Gaming / GameFi": 0.6, "DeFi": 0.4, "NFT": 0.5, "Trading bot": 0.5, "AI + Crypto": 0.3, "Protocol": 0.3, "Infrastructure": 0.3 },
};

// ── Goal-to-keyword mapping ────────────────────────────────────
// If a user wants a certain goal, look for these signals in the candidate
const GOAL_KEYWORDS: Record<string, string[]> = {
  "Co-marketing campaigns":        ["marketing", "campaign", "collab", "partnership", "community", "announcement", "launch"],
  "Token integration":             ["token", "integration", "swap", "bridge", "yield", "staking", "liquidity", "defi"],
  "Liquidity sharing":             ["liquidity", "pool", "tvl", "amm", "yield", "farming", "defi", "swap"],
  "KOL introductions":             ["kol", "influencer", "ambassador", "community", "twitter", "telegram", "social"],
  "Technical integration":         ["api", "sdk", "integration", "protocol", "smart contract", "chain", "layer"],
  "Community cross-pollination":   ["community", "holders", "members", "followers", "dao", "governance", "collab"],
};

// ── Normalise text for keyword matching ───────────────────────
function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

// ── Extract meaningful keywords from a narrative ──────────────
function extractKeywords(text: string): Set<string> {
  const stopWords = new Set([
    "the", "and", "for", "with", "that", "this", "are", "from",
    "our", "your", "its", "has", "have", "been", "will", "can",
    "all", "not", "but", "more", "into", "than", "they", "their",
    "you", "how", "what", "when", "where", "which", "who", "why",
    "was", "were", "also", "any", "one", "new", "use", "via",
    "get", "let", "set", "we", "is", "in", "to", "of", "a", "an",
  ]);

  return new Set(
    normalise(text)
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w))
  );
}

// ── Score: narrative keyword overlap (35pts) ──────────────────
function scoreNarrative(userNarrative: string, candidateNarrative: string): number {
  if (!candidateNarrative || candidateNarrative === "No description available") return 5;

  const userKw      = extractKeywords(userNarrative);
  const candidateKw = extractKeywords(candidateNarrative);

  if (userKw.size === 0 || candidateKw.size === 0) return 5;

  // Jaccard similarity — intersection / union
  const intersection = new Set([...userKw].filter((w) => candidateKw.has(w)));
  const union        = new Set([...userKw, ...candidateKw]);

  const jaccard = intersection.size / union.size;

  // Scale to 0-35, with a floor of 5 for any result
  return Math.round(5 + jaccard * 30 * 10);
}

// ── Score: category compatibility (25pts) ─────────────────────
function scoreCategory(userCategory: string, candidateCategory: string | null): number {
  if (!candidateCategory) return 5;

  const compat = CATEGORY_COMPAT[userCategory]?.[candidateCategory] ?? 0.3;
  return Math.round(compat * 25);
}

// ── Score: partnership goal alignment (20pts) ─────────────────
function scoreGoals(userGoals: string[], candidateNarrative: string | null): number {
  if (!candidateNarrative || userGoals.length === 0) return 5;

  const normNarrative = normalise(candidateNarrative);
  let matched = 0;

  for (const goal of userGoals) {
    const keywords = GOAL_KEYWORDS[goal] ?? [];
    const hits = keywords.filter((kw) => normNarrative.includes(kw));
    if (hits.length > 0) matched++;
  }

  // % of goals that found keyword signals, scaled to 20pts
  const ratio = matched / userGoals.length;
  return Math.round(5 + ratio * 15);
}

// ── Score: collab signal detected (10pts) ─────────────────────
function scoreCollabSignal(rawData: DiscoveredProject["raw_data"]): number {
  return rawData?.has_collab_signal ? 10 : 0;
}

// ── Score: community size proxy (10pts) ───────────────────────
function scoreCommunitySize(followers: number | null, members: number | null): number {
  const size = followers ?? members ?? 0;
  if (size === 0)       return 2;
  if (size < 1000)      return 4;
  if (size < 10000)     return 6;
  if (size < 100000)    return 8;
  return 10;
}

// ── Build human-readable reasoning ────────────────────────────
function buildReasoning(
  userProject: UserProject,
  candidate: DiscoveredProject,
  scores: { narrative: number; category: number; goals: number; collab: number; community: number }
): string {
  const parts: string[] = [];

  // Category relationship
  const catCompat = CATEGORY_COMPAT[userProject.category]?.[candidate.category ?? ""] ?? 0;
  if (catCompat >= 0.8) {
    parts.push(`${candidate.category} and ${userProject.category} projects have strong partnership potential.`);
  } else if (catCompat >= 0.5) {
    parts.push(`${candidate.category} projects can complement ${userProject.category} in meaningful ways.`);
  } else {
    parts.push(`Category overlap between ${candidate.category ?? "this project"} and ${userProject.category} is limited.`);
  }

  // Narrative overlap
  if (scores.narrative >= 20) {
    parts.push(`Strong narrative alignment detected — shared themes in their descriptions.`);
  } else if (scores.narrative >= 12) {
    parts.push(`Moderate narrative overlap — some shared concepts and audience.`);
  } else {
    parts.push(`Limited narrative overlap — different focus areas.`);
  }

  // Collab signal
  if (scores.collab > 0) {
    parts.push(`Active partnership signal detected in recent activity.`);
  }

  return parts.join(" ");
}

// ── Main scoring function ──────────────────────────────────────
function scoreMatch(userProject: UserProject, candidate: DiscoveredProject): MatchResult {
  const narrativeScore  = scoreNarrative(userProject.narrative, candidate.narrative ?? "");
  const categoryScore   = scoreCategory(userProject.category, candidate.category);
  const goalsScore      = scoreGoals(userProject.goals, candidate.narrative);
  const collabScore     = scoreCollabSignal(candidate.raw_data);
  const communityScore  = scoreCommunitySize(candidate.twitter_followers, candidate.telegram_members);

  const total = Math.min(100, narrativeScore + categoryScore + goalsScore + collabScore + communityScore);

  const reasoning = buildReasoning(userProject, candidate, {
    narrative:  narrativeScore,
    category:   categoryScore,
    goals:      goalsScore,
    collab:     collabScore,
    community:  communityScore,
  });

  return {
    discovered_project_id: candidate.id,
    name:            candidate.name,
    score:           total,
    reasoning,
    category_match:  candidate.category === userProject.category,
    stage_compatible: true, // rule-based doesn't check stage for now
  };
}

// ── API route handler ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { project_id } = await req.json();

    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    // 1. Fetch user's project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 2. Fetch ALL discovered projects in batches of 1000
    const PAGE_SIZE = 1000;
    let discovered: DiscoveredProject[] = [];
    let from = 0;

    while (true) {
      const { data: page, error: pageError } = await supabase
        .from("discovered_projects")
        .select("id, name, category, narrative, twitter_followers, telegram_members, raw_data")
        .range(from, from + PAGE_SIZE - 1);

      if (pageError) {
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
      }

      if (!page || page.length === 0) break;
      discovered = [...discovered, ...page];
      if (page.length < PAGE_SIZE) break; // last page
      from += PAGE_SIZE;
    }

    if (discovered.length === 0) {
      return NextResponse.json(
        { error: "No discovered projects found. Run the scrapers first." },
        { status: 404 }
      );
    }

    // Deduplicate by lowercased name — keep row with most data (followers/members)
    const seen = new Map<string, DiscoveredProject>();
    for (const p of discovered) {
      const key = p.name.toLowerCase().trim();
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, p);
      } else {
        // Keep whichever has more community data
        const existingScore = (existing.twitter_followers || 0) + (existing.telegram_members || 0);
        const newScore = (p.twitter_followers || 0) + (p.telegram_members || 0);
        if (newScore > existingScore) seen.set(key, p);
      }
    }
    const deduplicated = Array.from(seen.values());
    console.log(`[NYXUS] After dedup: ${deduplicated.length} unique projects (from ${discovered.length})`);

    // 3. Score every candidate (synchronous — no API calls, instant)
    const results: MatchResult[] = deduplicated.map((candidate) =>
      scoreMatch(project, candidate)
    );

    // 4. Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // 5. Upsert matches to Supabase
    const matchRows = results.map((r) => ({
      project_id,
      discovered_project_id: r.discovered_project_id,
      score:            r.score,
      reasoning:        r.reasoning,
      category_match:   r.category_match,
      stage_compatible: r.stage_compatible,
    }));

    const { error: matchError } = await supabase
      .from("matches")
      .upsert(matchRows, { onConflict: "project_id,discovered_project_id" });

    if (matchError) {
      console.error("[NYXUS] Failed to save matches:", matchError);
      return NextResponse.json({ error: "Failed to save matches" }, { status: 500 });
    }

    // 6. Create scan_complete alert
    const topMatch = results[0];
    await supabase.from("alerts").insert({
      user_id:    project.user_id,
      project_id,
      type:       "scan_complete",
      title:      `Discovery scan complete — ${results.length} projects scored`,
      description: topMatch
        ? `Top match: ${topMatch.name} with a ${topMatch.score}% compatibility score.`
        : "No strong matches found yet.",
    });

    return NextResponse.json({
      matched:   results.length,
      top_score: results[0]?.score ?? 0,
      results,
    });

  } catch (err) {
    console.error("[NYXUS] Matching engine error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
