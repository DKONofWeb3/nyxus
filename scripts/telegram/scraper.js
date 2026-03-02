/**
 * NYXUS — Telegram Scraper
 * ─────────────────────────────────────────────────────────────
 * Uses GramJS to scrape public web3 Telegram channels/groups
 * and stores discovered projects in Supabase.
 *
 * Usage:
 *   node scraper.js --auth       ← First time only: authenticate
 *   node scraper.js --scrape     ← Run the scraper
 *   node scraper.js --scrape --dry-run  ← Preview without saving
 */

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync, existsSync } from "fs";
import input from "input";
import { TARGETS } from "./targets.js";

// ── Load env from project root .env.local ─────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env.local") });

// ── Config ────────────────────────────────────────────────────
const API_ID = parseInt(process.env.TELEGRAM_API_ID || "0");
const API_HASH = process.env.TELEGRAM_API_HASH || "";
const PHONE = process.env.TELEGRAM_PHONE || "";
const SESSION_FILE = resolve(__dirname, ".session");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
// Service role key bypasses RLS — correct for server-side scripts
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY;

const isDryRun = process.argv.includes("--dry-run");
const isAuth = process.argv.includes("--auth");
const isScrape = process.argv.includes("--scrape");

// ── Client options ─────────────────────────────────────────────
// FIX: useWSS forces WebSocket Secure (port 443) instead of TCP port 80.
// Port 80 is commonly blocked by ISPs in West Africa and other regions.
// This is the ONLY change from the original — everything else is identical.
const CLIENT_OPTIONS = {
  connectionRetries: 5,
  useWSS: true,   // ← forces port 443, bypasses ISP block on port 80
  workers: 1,
};

// ── Validate env ───────────────────────────────────────────────
function validateEnv() {
  const missing = [];
  if (!API_ID) missing.push("TELEGRAM_API_ID");
  if (!API_HASH) missing.push("TELEGRAM_API_HASH");
  if (!PHONE) missing.push("TELEGRAM_PHONE");
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    console.error("\n❌ Missing environment variables:");
    missing.forEach((v) => console.error(`   • ${v}`));
    console.error("\nAdd them to your .env.local file and try again.\n");
    process.exit(1);
  }
}

// ── Load saved session ─────────────────────────────────────────
function loadSession() {
  if (existsSync(SESSION_FILE)) {
    const saved = readFileSync(SESSION_FILE, "utf-8").trim();
    console.log("✓ Found existing session");
    return new StringSession(saved);
  }
  return new StringSession("");
}

// ── Save session ───────────────────────────────────────────────
function saveSession(client) {
  const sessionString = client.session.save();
  writeFileSync(SESSION_FILE, sessionString);
  console.log("✓ Session saved to .session file");
}

// ── Authenticate (first time) ─────────────────────────────────
async function authenticate() {
  console.log("\n🔐 NYXUS — Telegram Authentication");
  console.log("─────────────────────────────────────");
  console.log("You only need to do this once.\n");

  validateEnv();

  const session = loadSession();
  const client = new TelegramClient(session, API_ID, API_HASH, CLIENT_OPTIONS);

  await client.start({
    phoneNumber: async () => {
      const phone = await input.text(`Phone number (with country code, e.g. +2348012345678): `);
      return phone.trim();
    },
    password: async () => {
      return await input.text("2FA Password (leave blank if none): ");
    },
    phoneCode: async () => {
      return await input.text("Telegram verification code: ");
    },
    onError: (err) => {
      console.error("Auth error:", err.message);
    },
  });

  saveSession(client);
  await client.disconnect();

  console.log("\n✅ Authentication successful! You can now run:");
  console.log("   node scraper.js --scrape\n");
}

// ── Extract project info from channel/group entity ────────────
function extractProjectInfo(entity, messages, defaultCategory) {
  const name = entity.title || entity.username || "Unknown";
  const username = entity.username || null;

  // Build narrative from description + recent message activity
  const description = entity.about || entity.description || "";
  const recentMessages = messages
    .slice(0, 5)
    .map((m) => m.message)
    .filter(Boolean)
    .join(" ")
    .slice(0, 300);

  const narrative = description
    ? `${description.slice(0, 400)}${recentMessages ? ` | Recent activity: ${recentMessages}` : ""}`
    : recentMessages || "No description available";

  // Detect collaboration signals in recent messages
  const collabKeywords = ["partnership", "collab", "integration", "join us", "collaborate",
    "announcement", "launch", "partner", "together", "ecosystem"];
  const hasCollabSignal = messages.some((m) =>
    m.message && collabKeywords.some((kw) => m.message.toLowerCase().includes(kw))
  );

  // Member/subscriber count
  const memberCount =
    entity.participantsCount ||
    entity.membersCount ||
    entity.subscribersCount ||
    null;

  // Detect source type
  const isChannel = entity.className === "Channel" && entity.broadcast;

  // Last active — date of most recent message
  const lastMessage = messages[0];
  const lastActive = lastMessage?.date
    ? new Date(lastMessage.date * 1000).toISOString()
    : null;

  return {
    name,
    category: defaultCategory,
    narrative: narrative.trim(),
    telegram_handle: username,
    telegram_members: memberCount,
    last_active: lastActive,
    source: "telegram",
    raw_data: {
      entity_type: entity.className,
      is_channel: isChannel,
      has_collab_signal: hasCollabSignal,
      verified: entity.verified || false,
      access_hash: entity.accessHash?.toString() || null,
    },
  };
}

// ── Scrape a single target ────────────────────────────────────
async function scrapeTarget(client, target) {
  try {
    console.log(`  ↳ Scraping @${target.username}...`);

    // Get entity info
    const entity = await client.getEntity(target.username);

    // Get recent messages (last 20)
    const messages = await client.getMessages(entity, { limit: 20 });

    const projectData = extractProjectInfo(entity, messages, target.category);

    console.log(`     ✓ ${projectData.name} | ${projectData.telegram_members ?? "??"} members | ${messages.length} messages`);

    return projectData;
  } catch (err) {
    // Some channels may be private, deleted, or restricted
    if (err.message?.includes("USERNAME_NOT_OCCUPIED") ||
        err.message?.includes("USERNAME_INVALID") ||
        err.message?.includes("CHANNEL_PRIVATE")) {
      console.log(`     ⚠ @${target.username} — skipped (${err.message})`);
    } else {
      console.log(`     ✗ @${target.username} — error: ${err.message}`);
    }
    return null;
  }
}

// ── Save to Supabase ──────────────────────────────────────────
async function saveToSupabase(projects) {
  // Use service role key to bypass RLS on discovered_projects
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let saved = 0;
  let skipped = 0;
  let errors = 0;

  for (const project of projects) {
    // Upsert by telegram_handle to avoid duplicates
    const { error } = await supabase
      .from("discovered_projects")
      .upsert(project, {
        onConflict: "telegram_handle",
        ignoreDuplicates: false, // update existing records
      });

    if (error) {
      // If no unique constraint on telegram_handle yet, try insert
      const { error: insertError } = await supabase
        .from("discovered_projects")
        .insert(project);

      if (insertError) {
        console.error(`  ✗ Failed to save ${project.name}:`, insertError.message);
        errors++;
      } else {
        saved++;
      }
    } else {
      saved++;
    }
  }

  return { saved, skipped, errors };
}

// ── Main scrape function ──────────────────────────────────────
async function scrape() {
  console.log("\n🔍 NYXUS — Telegram Scraper");
  console.log("─────────────────────────────────────");
  if (isDryRun) console.log("🧪 DRY RUN — nothing will be saved\n");

  validateEnv();

  const session = loadSession();
  // Check file existence — session.save() returns empty before first connect
  if (!existsSync(SESSION_FILE)) {
    console.error("❌ No session found. Run authentication first:");
    console.error("   node scraper.js --auth\n");
    process.exit(1);
  }

  const client = new TelegramClient(session, API_ID, API_HASH, CLIENT_OPTIONS);

  console.log("⚡ Connecting to Telegram...");
  await client.connect();
  console.log("✓ Connected\n");

  const results = [];
  let processed = 0;

  console.log(`📡 Scraping ${TARGETS.length} targets...\n`);

  for (const target of TARGETS) {
    const data = await scrapeTarget(client, target);
    if (data) results.push(data);
    processed++;

    // Rate limiting — be polite to Telegram's servers
    await new Promise((r) => setTimeout(r, 1500));
  }

  await client.disconnect();

  console.log(`\n──────────────────────────────────────`);
  console.log(`📊 Scraped ${results.length}/${processed} targets successfully`);

  if (isDryRun) {
    console.log("\n🧪 Dry run results (not saved):");
    results.forEach((p) => {
      console.log(`   • ${p.name} (${p.category}) — ${p.telegram_members ?? "?"} members`);
    });
  } else {
    console.log("💾 Saving to Supabase...");
    const { saved, errors } = await saveToSupabase(results);
    console.log(`✅ Done — ${saved} projects saved, ${errors} errors`);
  }

  console.log("\n🏁 Scrape complete.\n");
}

// ── Entry point ────────────────────────────────────────────────
if (isAuth) {
  authenticate().catch(console.error);
} else if (isScrape) {
  scrape().catch(console.error);
} else {
  console.log(`
NYXUS Telegram Scraper
─────────────────────────────────
Commands:
  node scraper.js --auth        First-time authentication
  node scraper.js --scrape      Run scraper (saves to Supabase)
  node scraper.js --scrape --dry-run  Preview without saving
`);
}
