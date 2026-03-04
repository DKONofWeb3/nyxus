# NYXUS — CoinGecko Ingestion Script

Fetches Web3 projects from CoinGecko and loads them into your `discovered_projects` table.

## What it fetches

| NYXUS Category | CoinGecko Categories |
|---|---|
| DeFi | defi, yield-farming, dex, lending, liquid-staking, perpetuals |
| Meme coin | meme-token, dog-themed, cat-themed, solana-meme |
| NFT | nft, nft-marketplace |
| Gaming / GameFi | gaming, play-to-earn, metaverse |
| AI + Crypto | artificial-intelligence, ai-agents, depin |
| Protocol | layer-1, layer-2, ethereum, solana, cosmos, bnb |
| Infrastructure | cross-chain, oracles, interoperability, storage, zk |
| Trading bot | trading-bots, copy-trading |
| Casino / Gambling | gambling, prediction-markets |

## Setup

**Step 1 — Run the SQL migration in Supabase first:**
```
Supabase → SQL Editor → paste contents of migration.sql → Run
```

**Step 2 — Install dependencies:**
```bash
cd scripts/coingecko
npm install
```

**Step 3 — Get a free CoinGecko API key (optional but recommended):**
- Go to https://www.coingecko.com/en/api
- Sign up → Developer Dashboard → Create Demo Key (free)
- Add to your `.env.local`:
```
COINGECKO_API_KEY=CG-xxxxxxxxxxxxxxxxxxxx
```
Without a key it still works, but rate limits are stricter.

## Running

```bash
# Full ingestion — all categories (~15-20 min, ~3,000-5,000 projects)
npm run ingest

# Preview what would be saved without touching the DB
npm run dry-run

# Single category runs (faster, ~2-5 min each)
npm run defi
npm run meme
npm run ai
npm run nft
npm run gaming
npm run protocol
npm run infra

# Custom limit per category
node ingest.js --limit 50

# Specific category by name
node ingest.js --category "ai"
```

## What gets saved

Each project in `discovered_projects`:
- `name` — project name
- `category` — NYXUS category
- `narrative` — CoinGecko description (cleaned, up to 800 chars)
- `twitter_handle` — Twitter/X username
- `telegram_handle` — Telegram channel
- `twitter_followers` — community size signal
- `telegram_members` — Telegram community size
- `source` — `"coingecko"`
- `source_id` — `"coingecko_{id}"` — used for deduplication on re-runs
- `raw_data` — market cap, rank, volume, website, collab signal flag

## Re-running

Safe to run multiple times — uses `upsert` on `source_id` so existing rows get updated, not duplicated. Run weekly to keep data fresh.
