/**
 * NYXUS AI — Chat API Route
 * POST /api/chat
 *
 * Powered by Groq (Llama 3.3 70B) — free, fast, no credit card.
 * Injects full project context into every message so the AI
 * knows the user's project, matches, and pipeline.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL   = "llama-3.3-70b-versatile";

// ── Free tier limits ──────────────────────────────────────────
const FREE_MESSAGE_LIMIT = 20; // per month

// ── System prompt factory ─────────────────────────────────────
function buildSystemPrompt(context: {
  projectName: string;
  category: string;
  narrative: string;
  stage: string;
  goals: string[];
  topMatches: { name: string; score: number; category: string }[];
  partnershipsCount: number;
  pipelineSummary: string;
}) {
  return `You are NYXUS AI, a Web3 growth and partnership strategist built into the NYXUS platform. You are direct, specific, and actionable — you never give vague advice.

## The user's project
- Name: ${context.projectName}
- Category: ${context.category}
- Stage: ${context.stage}
- Narrative: ${context.narrative}
- Partnership goals: ${context.goals.join(", ")}

## Current discovery matches (top matches from their DB)
${context.topMatches.map((m) => `- ${m.name} (${m.category}) — ${m.score}% match`).join("\n") || "No matches run yet"}

## Partnerships pipeline
- ${context.partnershipsCount} partnerships being tracked
- ${context.pipelineSummary}

## Your job
Help the user grow their Web3 project through smart partnerships, KOL strategy, and marketing decisions. You have deep knowledge of Web3 ecosystems, DeFi, NFTs, GameFi, AI crypto, meme coins, and how partnerships actually work in this space.

## How you respond
- Be specific to THEIR project — never give generic crypto advice
- When recommending KOLs or partners, give real examples with reasoning
- When asked about budget, give actual estimated ranges (e.g. "$500-$2k per post for mid-tier KOL")
- Use action cards at the end of relevant responses using this exact format:
  [ACTION: label | route]
  Examples:
  [ACTION: View my discovery matches | /discovery]
  [ACTION: See my partnerships pipeline | /partnerships]
  [ACTION: Browse KOLs directory | /kols]
- Keep responses concise — max 4 paragraphs unless doing a detailed breakdown
- Never say "I'm just an AI" or add disclaimers. Just help.

## Guided flows
When a user picks a quick action, follow these flows:

FIND PARTNERSHIPS → Ask: what type (co-marketing, token integration, liquidity, technical)? Then suggest 3 specific project types to target from their matches.

GET KOL RECOMMENDATIONS → Ask: chain preference, content type (Twitter, YouTube, TikTok), budget range. Then suggest 5 KOL types with estimated rates.

DRAFT OUTREACH → Ask: which project/KOL they're reaching out to, what they're offering. Then write a specific, personalized DM.

PLAN BUDGET → Ask: total monthly budget. Then break it down across KOLs, content, campaigns with specific allocations.`;
}

// ── Main handler ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages, project_id, user_id } = await req.json();

    if (!messages || !project_id || !user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check free tier usage
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("ai_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)
      .gte("created_at", thisMonth.toISOString());

    // Check if pro user (simplified — check if they have a subscription flag)
    const { data: profile } = await supabase
      .from("projects")
      .select("is_pro")
      .eq("user_id", user_id)
      .limit(1)
      .single();

    const isPro = profile?.is_pro || false;
    const messageCount = count || 0;

    if (!isPro && messageCount >= FREE_MESSAGE_LIMIT) {
      return NextResponse.json({
        error: "free_limit_reached",
        message: `You've used all ${FREE_MESSAGE_LIMIT} free messages this month. Upgrade to Pro for unlimited access.`,
      }, { status: 402 });
    }

    // 2. Fetch project context
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 3. Fetch top matches for context
    const { data: matches } = await supabase
      .from("matches")
      .select("score, discovered_projects(name, category)")
      .eq("project_id", project_id)
      .order("score", { ascending: false })
      .limit(10);

    const topMatches = (matches || []).map((m: any) => ({
      name: Array.isArray(m.discovered_projects) ? m.discovered_projects[0]?.name : m.discovered_projects?.name,
      category: Array.isArray(m.discovered_projects) ? m.discovered_projects[0]?.category : m.discovered_projects?.category,
      score: m.score,
    })).filter((m: any) => m.name);

    // 4. Fetch pipeline summary
    const { data: partnerships } = await supabase
      .from("partnerships")
      .select("status")
      .eq("project_id", project_id);

    const pipelineCount = partnerships?.length || 0;
    const pipelineSummary = partnerships?.length
      ? Object.entries(
          partnerships.reduce((acc: any, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          }, {})
        ).map(([s, n]) => `${n} in ${s}`).join(", ")
      : "No partnerships tracked yet";

    // 5. Build system prompt with full context
    const systemPrompt = buildSystemPrompt({
      projectName:       project.name,
      category:          project.category,
      narrative:         project.narrative || "Not specified",
      stage:             project.stage || "Early stage",
      goals:             project.goals || [],
      topMatches,
      partnershipsCount: pipelineCount,
      pipelineSummary,
    });

    // 6. Call Groq
    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        messages:    [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.7,
        max_tokens:  1024,
        stream:      false,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("[NYXUS AI] Groq error:", err);
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const reply = groqData.choices?.[0]?.message?.content || "";

    // 7. Save message to DB for usage tracking
    await supabase.from("ai_messages").insert({
      user_id,
      project_id,
      role:    "assistant",
      content: reply,
    });

    // Also save user's last message
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user");
    if (lastUserMessage) {
      await supabase.from("ai_messages").insert({
        user_id,
        project_id,
        role:    "user",
        content: lastUserMessage.content,
      });
    }

    return NextResponse.json({
      reply,
      usage: {
        used:    messageCount + 1,
        limit:   FREE_MESSAGE_LIMIT,
        is_pro:  isPro,
      },
    });

  } catch (err) {
    console.error("[NYXUS AI] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
