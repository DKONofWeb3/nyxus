# NYXUS — Web3 Partnership Intelligence

## Day 1: Setup & App Shell

### Prerequisites
- Node.js 18+ installed ✅
- Supabase account ✅

---

## 🚀 Quick Start

### Step 1 — Install dependencies
Open this folder in VS Code, open the terminal, and run:
```bash
npm install
```

### Step 2 — Set up environment variables
```bash
cp .env.local.example .env.local
```
Then open `.env.local` and fill in your Supabase credentials:
- Go to https://supabase.com/dashboard
- Open your project → Settings → API
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 3 — Set up the database
- Go to your Supabase dashboard → SQL Editor
- Paste the entire contents of `supabase-schema.sql`
- Click **Run**

### Step 4 — Run the app
```bash
npm run dev
```
Open http://localhost:3000 — you'll be redirected to the login page.

---

## 📁 Project Structure

```
nexus/
├── app/
│   ├── auth/
│   │   ├── login/          # Login page
│   │   ├── signup/         # Signup page
│   │   └── callback/       # Email confirmation handler
│   ├── (app)/              # Protected app routes
│   │   ├── layout.tsx      # Sidebar + layout wrapper
│   │   ├── dashboard/      # Dashboard page
│   │   └── discovery/      # Discovery page (stub)
│   ├── globals.css         # Design system + Tailwind
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # Button, Input, Badge, TagSelector, Logo
│   └── layout/             # Sidebar, Topbar
├── lib/
│   ├── supabase/           # Browser + server Supabase clients
│   └── utils.ts            # cn(), formatNumber(), timeAgo()
├── types/
│   └── index.ts            # TypeScript types for all DB models
├── middleware.ts            # Auth protection + redirect logic
├── supabase-schema.sql     # Run this in Supabase SQL Editor
└── .env.local.example      # Copy to .env.local and fill in
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#F7F6F2` |
| Surface | `#FFFFFF` |
| Border | `#E0DDD8` |
| Text | `#1A1916` |
| Text secondary | `#6B6860` |
| Accent (orange) | `#FF5C1A` |
| Green | `#1DB954` |

**Fonts:** Syne (headings) · DM Sans (body) · JetBrains Mono (data/labels)

---

## 📅 Build Plan

| Day | Goal |
|-----|------|
| ✅ Day 1 | Project scaffold + design system + auth + app shell |
| Day 2 | DB schema + onboarding UI (4-step flow) |
| Day 3 | Connect onboarding to Supabase, protected routes |
| Day 4 | Telegram scraping pipeline (GramJS) |
| Day 5 | X/Twitter data via Apify |
| Day 6 | Matching engine v1 (Claude/OpenAI API) |
| Day 7 | Discovery UI wired to real data |
| Day 8 | Integration, testing, seed real data |
