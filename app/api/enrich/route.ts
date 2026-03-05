/**
 * NYXUS — AI Project Enrichment
 * POST /api/enrich
 *
 * Takes a project name + basic info, uses Groq to generate
 * a rich, contextual summary about the project — its recent
 * activity, partnership potential, and why it matters.
 */

import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { name, category, narrative } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Missing project name" }, { status: 400 });
    }

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
            content: `You are a Web3 partnership analyst. Given a project name and category, write a concise 3-4 sentence analysis covering:
1. What this project actually does and its current standing in the ecosystem
2. Their typical partnership approach or recent collab activity (if known)
3. Why they'd make a good or challenging partner and what angle to use when reaching out

Be specific and direct. If you don't know the project well, say so briefly and focus on what the category typically does for partnerships. Never make up specific facts. Keep it under 120 words.`
          },
          {
            role: "user",
            content: `Project: ${name}\nCategory: ${category || "Web3"}\nDescription: ${narrative?.slice(0, 300) || "No description available"}`
          }
        ],
        temperature: 0.6,
        max_tokens:  200,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
    }

    const data = await res.json();
    const summary = data.choices?.[0]?.message?.content?.trim() || "";

    return NextResponse.json({ summary });

  } catch (err) {
    console.error("[NYXUS Enrich]", err);
    return NextResponse.json({ error: "Enrichment failed" }, { status: 500 });
  }
}
