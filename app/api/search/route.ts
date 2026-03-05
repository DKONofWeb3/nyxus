/**
 * NYXUS — AI-Powered Smart Search
 * POST /api/search
 *
 * Takes natural language query, uses Groq to extract intent,
 * queries Supabase intelligently, returns ranked results.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function extractIntent(query: string) {
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a search intent extractor for a Web3 partnership platform. Extract search intent from natural language queries and return ONLY valid JSON.

Return this exact shape, nothing else, no markdown:
{"categories":[],"keywords":[],"minScore":0,"hasCollabSignal":false,"stage":null,"summary":""}

categories: array from ["DeFi","Meme coin","NFT","Gaming / GameFi","AI + Crypto","Protocol","Infrastructure","Trading bot"]
keywords: key terms to match in project name/narrative
minScore: minimum match score 0-100
hasCollabSignal: true if user wants actively looking projects
stage: "early","growing","established" or null
summary: one sentence describing the search intent`
        },
        { role: "user", content: query }
      ],
      temperature: 0.1,
      max_tokens:  200,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query, project_id } = await req.json();
    if (!query || !project_id) {
      return NextResponse.json({ error: "Missing query or project_id" }, { status: 400 });
    }

    // 1. Extract intent via Groq
    const intent = await extractIntent(query);

    // 2. Fetch matches with score filter
    const { data: matches, error } = await supabase
      .from("matches")
      .select(`
        id, score, reasoning, category_match,
        discovered_projects (
          id, name, category, narrative,
          twitter_handle, telegram_handle,
          twitter_followers, telegram_members,
          last_active, source, raw_data
        )
      `)
      .eq("project_id", project_id)
      .gte("score", intent?.minScore || 0)
      .order("score", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Filter by extracted intent
    let results = (matches || []).filter((m: any) => {
      const dp = Array.isArray(m.discovered_projects)
        ? m.discovered_projects[0]
        : m.discovered_projects;
      if (!dp) return false;

      // Category filter from intent
      if (intent?.categories?.length > 0) {
        if (!intent.categories.includes(dp.category)) {
          if (m.score < 75) return false; // let very high scores through regardless
        }
      }

      // Keyword filter
      if (intent?.keywords?.length > 0) {
        const text = `${dp.name} ${dp.narrative || ""}`.toLowerCase();
        const hasKeyword = intent.keywords.some((kw: string) =>
          text.includes(kw.toLowerCase())
        );
        if (!hasKeyword && m.score < 65) return false;
      }

      // Collab signal filter
      if (intent?.hasCollabSignal && !dp.raw_data?.has_collab_signal) return false;

      return true;
    });

    return NextResponse.json({ results, intent, total: results.length });

  } catch (err) {
    console.error("[NYXUS Search]", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
