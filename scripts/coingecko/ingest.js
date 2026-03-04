/**
 * NYXUS — CoinGecko Ingestion Script
 * ─────────────────────────────────────────────────────────────
 * Fetches Web3 projects from CoinGecko by category and stores
 * them in the discovered_projects table.
 *
 * Covers: DeFi, Meme, NFT, GameFi, AI+Crypto, Protocol/L1/L2,
 *         Infrastructure, Trading Bots
 *
 * Usage:
 *   node ingest.js              ← Run full ingestion
 *   node ingest.js --dry-run    ← Preview without saving
 *   node ingest.js --category defi  ← Single category only
 *   node ingest.js --limit 100  ← Cap projects per category
 *
 * Free tier: 30 calls/min — script auto-throttles to stay safe.
 * One full run takes ~15–20 minutes and yields 3,000–5,000 projects.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env.local") });

// ── Config ────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || ""; // optional demo key

const isDryRun       = process.argv.includes("--dry-run");
const singleCategory = process.argv.includes("--category")
  ? process.argv[process.argv.indexOf("--category") + 1]
  : null;
const limitArg       = process.argv.includes("--limit")
  ? parseInt(process.argv[process.argv.indexOf("--limit") + 1])
  : 250; // default: 250 per category = ~3,500 total

// ── CoinGecko category → NYXUS category mapping ──────────────
// CoinGecko category IDs: https://api.coingecko.com/api/v3/coins/categories/list
const CATEGORY_MAP = [
  // ── DeFi ──────────────────────────────────────────────────
  { cgId: "decentralized-finance-defi",     nyxus: "DeFi",            priority: 1 },
  { cgId: "yield-farming",                  nyxus: "DeFi",            priority: 2 },
  { cgId: "decentralized-exchange",         nyxus: "DeFi",            priority: 2 },
  { cgId: "lending-borrowing",              nyxus: "DeFi",            priority: 2 },
  { cgId: "liquid-staking-tokens",          nyxus: "DeFi",            priority: 2 },
  { cgId: "perpetuals",                     nyxus: "DeFi",            priority: 3 },

  // ── Meme Coins ────────────────────────────────────────────
  { cgId: "meme-token",                     nyxus: "Meme coin",       priority: 1 },
  { cgId: "dog-themed-coins",               nyxus: "Meme coin",       priority: 2 },
  { cgId: "cat-themed-coins",               nyxus: "Meme coin",       priority: 2 },
  { cgId: "solana-meme-coins",              nyxus: "Meme coin",       priority: 2 },

  // ── NFT ───────────────────────────────────────────────────
  { cgId: "non-fungible-tokens-nft",        nyxus: "NFT",             priority: 1 },
  { cgId: "nft-marketplace",               nyxus: "NFT",             priority: 2 },

  // ── Gaming / GameFi ───────────────────────────────────────
  { cgId: "gaming",                         nyxus: "Gaming / GameFi", priority: 1 },
  { cgId: "play-to-earn",                   nyxus: "Gaming / GameFi", priority: 2 },
  { cgId: "metaverse",                      nyxus: "Gaming / GameFi", priority: 2 },

  // ── AI + Crypto ───────────────────────────────────────────
  { cgId: "artificial-intelligence",        nyxus: "AI + Crypto",     priority: 1 },
  { cgId: "ai-agents",                      nyxus: "AI + Crypto",     priority: 1 },
  { cgId: "depin",                          nyxus: "AI + Crypto",     priority: 2 },

  // ── Protocol / L1 / L2 ───────────────────────────────────
  { cgId: "layer-1",                        nyxus: "Protocol",        priority: 1 },
  { cgId: "layer-2",                        nyxus: "Protocol",        priority: 1 },
  { cgId: "ethereum-ecosystem",             nyxus: "Protocol",        priority: 2 },
  { cgId: "solana-ecosystem",              nyxus: "Protocol",        priority: 2 },
  { cgId: "cosmos-ecosystem",             nyxus: "Protocol",        priority: 2 },
  { cgId: "bnb-chain-ecosystem",           nyxus: "Protocol",        priority: 2 },

  // ── Infrastructure ────────────────────────────────────────
  { cgId: "cross-chain-communication",      nyxus: "Infrastructure",  priority: 1 },
  { cgId: "oracle",                         nyxus: "Infrastructure",  priority: 1 },
  { cgId: "interoperability",               nyxus: "Infrastructure",  priority: 2 },
  { cgId: "storage",                        nyxus: "Infrastructure",  priority: 2 },
  { cgId: "zero-knowledge-zk",             nyxus: "Infrastructure",  priority: 2 },

  // ── Trading Bot ───────────────────────────────────────────
  { cgId: "trading-bots",                  nyxus: "Trading bot",     priority: 1 },
  { cgId: "copy-trading",                   nyxus: "Trading bot",     priority: 2 },

  // ── Casino / Gambling ─────────────────────────────────────
  { cgId: "gambling",                       nyxus: "Casino / Gambling", priority: 1 },
  { cgId: "prediction-markets",             nyxus: "Casino / Gambling", priority: 2 },
];

// ── Rate limiter ──────────────────────────────────────────────
// Free tier: 30 calls/min. We use 20/min to stay safe.
const DELAY_MS = 3500; // ~17 calls/min — safe buffer
let lastCallAt = 0;

async function rateLimitedFetch(url) {
  const now = Date.now();
  const wait = Math.max(0, DELAY_MS - (now - lastCallAt));
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();

  const headers = { "Accept": "application/json" };
  if (COINGECKO_API_KEY) {
    headers["x-cg-demo-api-key"] = COINGECKO_API_KEY;
  }

  const res = await fetch(url, { headers });

  if (res.status === 429) {
    console.log("  ⏳ Rate limited — waiting 60s...");
    await sleep(60000);
    return rateLimitedFetch(url); // retry
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  return res.json();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Fetch projects for one CoinGecko category ─────────────────
async function fetchCategory(cgId, page = 1) {
  const url = `https://api.coingecko.com/api/v3/coins/markets`
    + `?vs_currency=usd`
    + `&category=${cgId}`
    + `&order=market_cap_desc`
    + `&per_page=250`
    + `&page=${page}`
    + `&sparkline=false`
    + `&locale=en`;

  return rateLimitedFetch(url);
}

// ── Fetch detailed coin info (social links, description) ───────
async function fetchCoinDetail(coinId) {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}`
    + `?localization=false`
    + `&tickers=false`
    + `&market_data=false`
    + `&community_data=true`
    + `&developer_data=false`
    + `&sparkline=false`;

  return rateLimitedFetch(url);
}

// ── Map CoinGecko coin → NYXUS discovered_project ─────────────
function mapToProject(coin, detail, nyxusCategory) {
  // Build narrative from description (strip HTML, truncate)
  let narrative = "";
  if (detail?.description?.en) {
    narrative = detail.description.en
      .replace(/<[^>]*>/g, " ")   // strip HTML tags
      .replace(/\s+/g, " ")       // collapse whitespace
      .trim()
      .slice(0, 800);
  }
  if (!narrative) {
    narrative = `${coin.name} (${coin.symbol?.toUpperCase()}) — ${nyxusCategory} project on CoinGecko.`;
  }

  // Social links
  const links = detail?.links || {};
  const twitterHandle = links.twitter_screen_name || null;
  const telegramHandle = links.telegram_channel_identifier || null;
  const website = links.homepage?.[0] || null;

  // Community size — use Twitter followers as primary signal
  const twitterFollowers = detail?.community_data?.twitter_followers || null;
  const telegramMembers  = detail?.community_data?.telegram_channel_user_count || null;
  const redditSubscribers = detail?.community_data?.reddit_subscribers || null;

  // Collab signal — projects with active socials + large community are partnership-ready
  const hasCollabSignal = (
    (twitterFollowers && twitterFollowers > 5000) ||
    (telegramMembers && telegramMembers > 1000) ||
    false
  );

  return {
    name:              coin.name,
    category:          nyxusCategory,
    narrative:         narrative,
    twitter_handle:    twitterHandle,
    telegram_handle:   telegramHandle,
    twitter_followers: twitterFollowers,
    telegram_members:  telegramMembers,
    last_active:       new Date().toISOString(), // CoinGecko = live data
    source:            "coingecko",
    raw_data: {
      coingecko_id:        coin.id,
      symbol:              coin.symbol,
      market_cap:          coin.market_cap,
      market_cap_rank:     coin.market_cap_rank,
      price_usd:           coin.current_price,
      volume_24h:          coin.total_volume,
      website:             website,
      reddit_subscribers:  redditSubscribers,
      has_collab_signal:   hasCollabSignal,
      verified:            (coin.market_cap_rank && coin.market_cap_rank <= 500) || false,
      image:               coin.image || null,
    },
  };
}

// ── Save to Supabase ───────────────────────────────────────────
async function saveProject(supabase, project) {
  // Upsert by coingecko_id stored in raw_data — use name as fallback unique key
  // We use a generated unique source_id column for upserting
  const { error } = await supabase
    .from("discovered_projects")
    .upsert(
      { ...project, source_id: `coingecko_${project.raw_data.coingecko_id}` },
      { onConflict: "source_id", ignoreDuplicates: false }
    );

  return error;
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  console.log("\n🚀 NYXUS — CoinGecko Ingestion");
  console.log("─────────────────────────────────────────");
  if (isDryRun) console.log("⚠️  DRY RUN — nothing will be saved\n");

  // Validate env
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Filter categories if --category flag used
  const categories = singleCategory
    ? CATEGORY_MAP.filter((c) => c.nyxus.toLowerCase().includes(singleCategory.toLowerCase()) || c.cgId.includes(singleCategory))
    : CATEGORY_MAP;

  if (categories.length === 0) {
    console.error(`❌ No categories matched "${singleCategory}"`);
    console.log("Available:", [...new Set(CATEGORY_MAP.map((c) => c.nyxus))].join(", "));
    process.exit(1);
  }

  console.log(`📋 Categories to fetch: ${categories.length}`);
  console.log(`📦 Max per category: ${limitArg}`);
  console.log(`🔑 API key: ${COINGECKO_API_KEY ? "✓ demo key" : "none (public)"}\n`);

  let totalSaved   = 0;
  let totalSkipped = 0;
  let totalErrors  = 0;

  // Track seen CoinGecko IDs so we don't double-fetch details
  const seenIds = new Set();

  for (const cat of categories) {
    console.log(`\n📂 ${cat.nyxus} ← ${cat.cgId}`);

    let coins = [];
    try {
      const page1 = await fetchCategory(cat.cgId, 1);
      coins = page1 || [];

      // Fetch page 2 if we need more and there are more
      if (limitArg > 250 && coins.length === 250) {
        console.log(`  ↳ Fetching page 2...`);
        const page2 = await fetchCategory(cat.cgId, 2);
        coins = [...coins, ...(page2 || [])];
      }

      coins = coins.slice(0, limitArg);
      console.log(`  ↳ ${coins.length} coins fetched`);
    } catch (err) {
      console.error(`  ✗ Failed to fetch category ${cat.cgId}:`, err.message);
      continue;
    }

    for (const coin of coins) {
      // Skip if we already processed this coin in another category
      if (seenIds.has(coin.id)) {
        totalSkipped++;
        continue;
      }
      seenIds.add(coin.id);

      // Skip coins with no market cap (usually dead/scam)
      if (!coin.market_cap || coin.market_cap < 10000) {
        totalSkipped++;
        continue;
      }

      process.stdout.write(`  → ${coin.name.padEnd(30)} `);

      try {
        // Fetch detail for social links + description
        const detail = await fetchCoinDetail(coin.id);
        const project = mapToProject(coin, detail, cat.nyxus);

        if (isDryRun) {
          console.log(`[DRY] ${project.twitter_followers ?? 0} Twitter · ${project.telegram_members ?? 0} TG`);
        } else {
          const error = await saveProject(supabase, project);
          if (error) {
            // source_id column might not exist yet — show the SQL to add it
            if (error.message?.includes("source_id")) {
              console.error("\n\n❌ Missing source_id column. Run this SQL in Supabase first:\n");
              console.error("ALTER TABLE discovered_projects ADD COLUMN IF NOT EXISTS source_id text UNIQUE;\n");
              process.exit(1);
            }
            console.log(`✗ ${error.message}`);
            totalErrors++;
          } else {
            console.log(`✓ saved`);
            totalSaved++;
          }
        }
      } catch (err) {
        console.log(`✗ ${err.message}`);
        totalErrors++;
      }
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`✅ Done!`);
  console.log(`   Saved:   ${totalSaved}`);
  console.log(`   Skipped: ${totalSkipped} (duplicates or no market cap)`);
  console.log(`   Errors:  ${totalErrors}`);
  console.log(`   Total processed: ${seenIds.size}`);
  console.log("─────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
