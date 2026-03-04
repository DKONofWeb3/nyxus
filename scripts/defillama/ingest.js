/**
 * NYXUS — DeFiLlama Ingestion Script
 * Fetches all protocols in one API call (no key, no rate limits)
 *
 * Usage:
 *   node ingest.js              ← Full run (~2-3 min)
 *   node ingest.js --dry-run    ← Preview without saving
 *   node ingest.js --min-tvl 100000   ← Only TVL > $100k
 *   node ingest.js --category bridge  ← Filter by category
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const isDryRun  = process.argv.includes("--dry-run");
const minTvl    = process.argv.includes("--min-tvl")
  ? parseFloat(process.argv[process.argv.indexOf("--min-tvl") + 1])
  : 0; // no floor — include all stages
const filterCat = process.argv.includes("--category")
  ? process.argv[process.argv.indexOf("--category") + 1].toLowerCase()
  : null;

// ── DeFiLlama category → NYXUS category ──────────────────────
const CATEGORY_MAP = {
  "dexes":                "DeFi",
  "dex":                  "DeFi",
  "lending":              "DeFi",
  "yield":                "DeFi",
  "yield aggregator":     "DeFi",
  "liquid staking":       "DeFi",
  "derivatives":          "DeFi",
  "options":              "DeFi",
  "stablecoin":           "DeFi",
  "algo-stables":         "DeFi",
  "liquidity manager":    "DeFi",
  "leveraged farming":    "DeFi",
  "cdp":                  "DeFi",
  "insurance":            "DeFi",
  "rwa":                  "DeFi",
  "synthetics":           "DeFi",
  "reserve currency":     "DeFi",
  "indexes":              "DeFi",
  "farm":                 "DeFi",
  "chain":                "Protocol",
  "l1":                   "Protocol",
  "l2":                   "Protocol",
  "rollup":               "Protocol",
  "sidechain":            "Protocol",
  "bridge":               "Infrastructure",
  "cross chain":          "Infrastructure",
  "oracle":               "Infrastructure",
  "interoperability":     "Infrastructure",
  "privacy":              "Infrastructure",
  "payments":             "Infrastructure",
  "launchpad":            "Infrastructure",
  "nft marketplace":      "NFT",
  "nft lending":          "NFT",
  "gaming":               "Gaming / GameFi",
  "game":                 "Gaming / GameFi",
  "ai":                   "AI + Crypto",
  "depin":                "AI + Crypto",
  "prediction market":    "Trading bot",
};

function mapCategory(llamaCategory) {
  if (!llamaCategory) return "DeFi";
  return CATEGORY_MAP[llamaCategory.toLowerCase().trim()] ?? "DeFi";
}

function formatTvl(tvl) {
  if (!tvl) return "N/A";
  if (tvl >= 1_000_000_000) return `${(tvl / 1_000_000_000).toFixed(1)}B`;
  if (tvl >= 1_000_000)     return `${(tvl / 1_000_000).toFixed(1)}M`;
  if (tvl >= 1_000)         return `${(tvl / 1_000).toFixed(0)}k`;
  return tvl.toFixed(0);
}

function mapToProject(protocol) {
  const nyxusCategory = mapCategory(protocol.category);

  let narrative = (protocol.description || "").trim();
  if (narrative.length < 20) {
    const chains = (protocol.chains || []).slice(0, 3).join(", ") || "multiple chains";
    narrative = `${protocol.name} is a ${protocol.category || "DeFi"} protocol on ${chains}. TVL: $${formatTvl(protocol.tvl)}.`;
  } else {
    narrative = narrative.replace(/\s+/g, " ").slice(0, 800);
  }

  let twitterHandle = null;
  if (protocol.twitter) {
    twitterHandle = protocol.twitter
      .replace("https://twitter.com/", "")
      .replace("https://x.com/", "")
      .replace("@", "")
      .trim() || null;
  }

  const tvl = protocol.tvl || 0;
  const slug = protocol.slug || protocol.name.toLowerCase().replace(/\s+/g, "-");

  return {
    name:              protocol.name,
    category:          nyxusCategory,
    narrative:         narrative,
    twitter_handle:    twitterHandle,
    telegram_handle:   null,
    twitter_followers: null,
    telegram_members:  null,
    last_active:       new Date().toISOString(),
    source:            "defillama",
    source_id:         `defillama_${slug}`,
    raw_data: {
      slug:              slug,
      llama_category:    protocol.category,
      tvl:               tvl,
      chains:            protocol.chains || [],
      website:           protocol.url || null,
      audit_links:       protocol.audit_links || [],
      has_collab_signal: tvl > 1_000_000,
      verified:          tvl > 10_000_000,
      change_1d:         protocol.change_1d || null,
      change_7d:         protocol.change_7d || null,
    },
  };
}

async function main() {
  console.log("\n🦙 NYXUS — DeFiLlama Ingestion");
  console.log("─────────────────────────────────────────");
  if (isDryRun) console.log("⚠️  DRY RUN — nothing will be saved\n");
  console.log(`💰 Min TVL filter: ${minTvl > 0 ? '$' + minTvl.toLocaleString() : 'none (all projects)'}`);
  if (filterCat) console.log(`📂 Category filter: ${filterCat}`);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Single API call — all protocols
  console.log("\n  ↳ Fetching from api.llama.fi...");
  const res = await fetch("https://api.llama.fi/protocols");
  if (!res.ok) { console.error(`❌ HTTP ${res.status}`); process.exit(1); }
  const protocols = await res.json();
  console.log(`  ↳ ${protocols.length} total protocols\n`);

  // CEXes to exclude — they track reserves, not partnership targets
  const CEX_SKIP = new Set([
    "cex", "exchange", "binance", "coinbase", "okx", "bybit",
    "bitfinex", "kraken", "robinhood", "bitget", "gate.io",
    "kucoin", "huobi", "crypto.com", "mexc",
  ]);

  // Filter
  let filtered = protocols.filter((p) => {
    if (!p.name) return false;
    if ((p.tvl || 0) < minTvl) return false;
    if (filterCat && !p.category?.toLowerCase().includes(filterCat)) return false;
    // Skip CEXes
    const nameLower = p.name.toLowerCase();
    if (CEX_SKIP.has(nameLower)) return false;
    if (p.category?.toLowerCase() === "cex") return false;
    return true;
  });
  filtered.sort((a, b) => (b.tvl || 0) - (a.tvl || 0));

  console.log(`📋 After filters: ${filtered.length} protocols`);
  console.log(`   (${protocols.length - filtered.length} skipped — CEXes or filtered)\n`);

  // Category breakdown
  const cats = {};
  filtered.forEach((p) => {
    const c = mapCategory(p.category);
    cats[c] = (cats[c] || 0) + 1;
  });
  console.log("📊 Category breakdown:");
  Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
    console.log(`   ${c.padEnd(25)} ${n}`);
  });
  console.log();

  if (isDryRun) {
    console.log("🔍 Sample (first 15):");
    filtered.slice(0, 15).forEach((p) => {
      console.log(`   ${p.name.padEnd(32)} TVL: $${formatTvl(p.tvl).padEnd(8)} → ${mapCategory(p.category)}`);
    });
    console.log("\n✅ Dry run complete. Run without --dry-run to save.");
    return;
  }

  // Batch upsert
  const BATCH_SIZE = 50;
  let saved = 0, errors = 0;

  for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
    const batch = filtered.slice(i, i + BATCH_SIZE).map(mapToProject);

    const { error } = await supabase
      .from("discovered_projects")
      .upsert(batch, { onConflict: "source_id", ignoreDuplicates: false });

    if (error) {
      // Unique constraint on twitter_handle — fall back to one-by-one
      if (error.message?.includes("unique constraint")) {
        for (const project of batch) {
          const { error: e2 } = await supabase
            .from("discovered_projects")
            .upsert(project, { onConflict: "source_id", ignoreDuplicates: true });
          if (e2) errors++; else saved++;
        }
      } else {
        console.error(`\n  ✗ ${error.message}`);
        errors += batch.length;
      }
    } else {
      saved += batch.length;
    }

    const pct = Math.min(100, Math.round(((i + BATCH_SIZE) / filtered.length) * 100));
    process.stdout.write(`\r  Progress: ${pct}% — ${saved} saved, ${errors} errors    `);
  }

  console.log("\n\n─────────────────────────────────────────");
  console.log("✅ DeFiLlama ingestion complete!");
  console.log(`   Saved:  ${saved}`);
  console.log(`   Errors: ${errors}`);
  console.log("─────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
