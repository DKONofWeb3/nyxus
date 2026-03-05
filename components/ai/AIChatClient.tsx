"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Send, Sparkles, Search, Users, MessageSquare,
  DollarSign, Loader2, ArrowRight, Lock, ChevronRight
} from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Project {
  id: string;
  name: string;
  category: string;
  narrative: string;
  stage: string;
  goals: string[];
}

interface Props {
  project:        Project;
  userId:         string;
  initialHistory: Message[];
  messagesUsed:   number;
}

const FREE_LIMIT = 20;

// ── Quick action chips ────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    id:    "partnerships",
    label: "Find partnership matches",
    icon:  Search,
    prompt: "Help me find the best partnership opportunities for my project right now. What types of projects should I be targeting and why?",
  },
  {
    id:    "kols",
    label: "Get KOL recommendations",
    icon:  Users,
    prompt: "What type of KOLs and influencers should I target for my project? Give me specific recommendations based on my category and stage.",
  },
  {
    id:    "outreach",
    label: "Draft outreach message",
    icon:  MessageSquare,
    prompt: "Help me draft an outreach message to a potential partner. What should I say to get a response?",
  },
  {
    id:    "budget",
    label: "Plan my marketing budget",
    icon:  DollarSign,
    prompt: "Help me plan my marketing budget. What should I allocate across KOLs, content creators, and partnership campaigns?",
  },
];

// ── Parse action cards from AI response ───────────────────────
function parseActionCards(content: string): { text: string; actions: { label: string; route: string }[] } {
  const actionRegex = /\[ACTION:\s*([^|]+)\|\s*([^\]]+)\]/g;
  const actions: { label: string; route: string }[] = [];
  let match;

  while ((match = actionRegex.exec(content)) !== null) {
    actions.push({ label: match[1].trim(), route: match[2].trim() });
  }

  const text = content.replace(actionRegex, "").trim();
  return { text, actions };
}

// ── Format message text ────────────────────────────────────────
function MessageText({ content }: { content: string }) {
  const { text, actions } = parseActionCards(content);

  // Convert markdown-like formatting
  const formatted = text
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("## ")) return <p key={i} className="font-syne font-bold text-sm mt-3 mb-1">{line.slice(3)}</p>;
      if (line.startsWith("# "))  return <p key={i} className="font-syne font-extrabold text-base mt-3 mb-1">{line.slice(2)}</p>;
      if (line.startsWith("- ") || line.startsWith("• ")) {
        return <p key={i} className="text-sm leading-relaxed pl-3 before:content-['•'] before:mr-2 before:text-accent">{line.slice(2)}</p>;
      }
      if (line.match(/^\d+\./)) {
        return <p key={i} className="text-sm leading-relaxed pl-3">{line}</p>;
      }
      if (line === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-sm leading-relaxed">{line}</p>;
    });

  return (
    <div className="flex flex-col gap-0.5">
      {formatted}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
          {actions.map((action, i) => (
            <Link
              key={i}
              href={action.route}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent border border-accent/30 bg-accent/5 hover:bg-accent/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              {action.label}
              <ChevronRight className="w-3 h-3" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export function AIChatClient({ project, userId, initialHistory, messagesUsed }: Props) {
  const [messages, setMessages]     = useState<Message[]>(initialHistory);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [used, setUsed]             = useState(messagesUsed);
  const [limitReached, setLimitReached] = useState(messagesUsed >= FREE_LIMIT);
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const inputRef                    = useRef<HTMLTextAreaElement>(null);
  const router                      = useRouter();

  const isFirstVisit = messages.length === 0;
  const remaining    = Math.max(0, FREE_LIMIT - used);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading || limitReached) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages:   newMessages,
          project_id: project.id,
          user_id:    userId,
        }),
      });

      const data = await res.json();

      if (res.status === 402) {
        setLimitReached(true);
        return;
      }

      if (data.reply) {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
        setUsed(data.usage?.used || used + 1);
        if (data.usage?.used >= FREE_LIMIT) setLimitReached(true);
      }
    } catch (err) {
      setMessages([...newMessages, {
        role:    "assistant",
        content: "Sorry, something went wrong. Please try again.",
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg">

      {/* ── Welcome screen (first visit) ─────────────────────── */}
      {isFirstVisit && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
          {/* Hero */}
          <div className="text-center max-w-md">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-accent" />
            </div>
            <h2 className="font-syne font-extrabold text-2xl mb-2">
              Hey, I'm NYXUS AI
            </h2>
            <p className="text-sm text-text-2 leading-relaxed">
              Your Web3 growth strategist. I know your project inside out — 
              tell me what you want to work on and I'll give you specific, 
              actionable guidance.
            </p>
          </div>

          {/* Project context pill */}
          <div className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-xs text-text-2">Working on</span>
            <span className="text-xs font-semibold">{project.name}</span>
            <span className="text-xs text-text-3">·</span>
            <span className="text-xs text-text-3">{project.category}</span>
          </div>

          {/* Quick action chips */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => sendMessage(action.prompt)}
                  className="card p-4 flex items-start gap-3 text-left hover:shadow-card-lg hover:-translate-y-px transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-snug">{action.label}</p>
                    <p className="text-[10px] text-text-3 mt-0.5">Quick start →</p>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-text-3">
            or type anything below · {remaining} messages remaining this month
          </p>
        </div>
      )}

      {/* ── Conversation ─────────────────────────────────────── */}
      {!isFirstVisit && (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">

          {/* Quick action chips at top of conversation too */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-border">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => sendMessage(action.prompt)}
                  disabled={loading || limitReached}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text-2 border border-border bg-surface hover:border-accent/40 hover:text-accent px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                >
                  <Icon className="w-3 h-3" />
                  {action.label}
                </button>
              );
            })}
          </div>

          {/* Messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                msg.role === "assistant"
                  ? "bg-accent text-white"
                  : "bg-bg-2 text-text-2 border border-border"
              }`}>
                {msg.role === "assistant" ? <Sparkles className="w-3.5 h-3.5" /> : "You"}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-accent text-white rounded-tr-sm"
                  : "bg-surface border border-border rounded-tl-sm"
              }`}>
                {msg.role === "assistant"
                  ? <MessageText content={msg.content} />
                  : <p className="text-sm leading-relaxed">{msg.content}</p>
                }
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* ── Input area ───────────────────────────────────────── */}
      <div className="border-t border-border bg-surface p-4">

        {/* Limit reached banner */}
        {limitReached && (
          <div className="flex items-center justify-between bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 mb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent flex-shrink-0" />
              <p className="text-xs text-text-2">
                You've used all {FREE_LIMIT} free messages this month.
              </p>
            </div>
            <Link
              href="/settings"
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              Upgrade <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Usage bar */}
        {!limitReached && used > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-1 bg-bg-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent/40 rounded-full transition-all"
                style={{ width: `${(used / FREE_LIMIT) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-text-3 font-mono">{remaining} left</span>
          </div>
        )}

        {/* Input */}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || limitReached}
            placeholder={
              limitReached
                ? "Upgrade to Pro for unlimited messages..."
                : `Ask anything about ${project.name}...`
            }
            rows={1}
            className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-accent/50 transition-colors placeholder:text-text-3 disabled:opacity-50 disabled:cursor-not-allowed max-h-32"
            style={{ fieldSizing: "content" } as any}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || limitReached}
            className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>

        <p className="text-[10px] text-text-3 text-center mt-2">
          NYXUS AI · Powered by Llama 3.3 · Press Enter to send
        </p>
      </div>
    </div>
  );
}
