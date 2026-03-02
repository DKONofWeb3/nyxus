/**
 * NYXUS — Apify X/Twitter Scraper
 * ─────────────────────────────────────────────────────────────
 * Uses Apify's Tweet Scraper V2 (apidojo/tweet-scraper-v2) to
 * pull web3 project data from Twitter profiles and search queries,
 * then stores discovered projects in Supabase.
 *
 * Unlike the Telegram scraper, no authentication is needed —
 * Apify handles everything. Just run it.
 *
 * Usage:
 *   node scraper.js --scrape            ← Run the scraper
 *   node scraper.js --scrape --dry-run  ← Preview without saving
 *
 * Cost: ~$0.40 per 1,000 tweets. Free tier gives you $5 credit.
 */

import { ApifyClient } from "apify-client";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { PROFILE_TARGETS, SEARCH_QUERIES } from "./targets.js";

// ── Load env from project root .env.local ─────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env.local") });

// ── Config ────────────────────────────────────────────────────
const APIFY_TOKEN      = process.env.APIFY_API_TOKEN || "";
const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// Service role key bypasses RLS — correct for server-side scripts
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Apify actor ID for Tweet Scraper V2
const ACTOR_ID = "61RPP7dywgiy0JPD0";

// How many tweets to pull per profile/search (keep low to save credits)
const TWEETS_PER_PROFILE = 20;
const TWEETS_PER_SEARCH  = 15;

const isDryRun = process.argv.includes("--dry-run");
const isScrape = process.argv.includes("--scrape");

// ── Validate env ───────────────────────────────────────────────
function validateEnv() {
  const missing = [];
  if (!APIFY_TOKEN)       missing.push("APIFY_API_TOKEN");
  if (!SUPABASE_URL)      missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    console.error("\n❌ Missing environment variables:");
    missing.forEach((v) => console.error(`   • ${v}`));
    console.error("\nAdd them to your .env.local file and try again.\n");
    process.exit(1);
  }
}

// ── Build Apify input for a Twitter profile ────────────────────
function buildProfileInput(handle) {
  return {
    startUrls: [{ url: `https://twitter.com/${handle}` }],
    maxItems: TWEETS_PER_PROFILE,
    addUserInfo: true,      // include follower count, bio, etc.
    scrapeTweetReplies: false,
  };
}

// ── Build Apify input for a search query ──────────────────────
function buildSearchInput(query) {
  return {
    startUrls: [{ url: `https://twitter.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live` }],
    maxItems: TWEETS_PER_SEARCH,
    addUserInfo: true,
    scrapeTweetReplies: false,
  };
}

// ── Run one Apify actor job and wait for results ───────────────
async function runActorAndGetResults(client, input, label) {
  try {
    console.log(`  ↳ Running actor for ${label}...`);

const run = await client.actor(ACTOR_ID).call(input);
    // Fetch results from the run's dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log(`     ✓ ${items.length} tweets fetched`);
    return items;
  } catch (err) {
    console.log(`     ✗ ${label} — error: ${err.message}`);
    return [];
  }
}

// ── Extract project info from a set of tweets ─────────────────
// Tweets from a profile all belong to the same project.
// Tweets from a search may come from many different accounts.
function extractFromProfileTweets(tweets, target) {
  if (tweets.length === 0) return null;

  // User info comes from the first tweet's author
  const user = tweets[0].author || tweets[0].user || {};

  const name            = user.name || target.handle;
  const twitterHandle   = user.userName || user.screen_name || target.handle;
  const bio             = user.description || user.bio || "";
  const followersCount  = user.followers || user.followersCount || 0;
  const verified        = user.isVerified || user.verified || false;

  // Build narrative from bio + recent tweet text
  const recentTweets = tweets
    .slice(0, 5)
    .map((t) => t.text || t.full_text || "")
    .filter(Boolean)
    .join(" ")
    .slice(0, 300);

  const narrative = bio
    ? `${bio.slice(0, 400)}${recentTweets ? ` | Recent tweets: ${recentTweets}` : ""}`
    : recentTweets || "No bio available";

  // Detect collaboration signals in tweets
  const collabKeywords = ["partnership", "collab", "integration", "join us",
    "collaborate", "announcement", "partner", "together", "ecosystem", "thrilled to"];
  const hasCollabSignal = tweets.some((t) => {
    const text = (t.text || t.full_text || "").toLowerCase();
    return collabKeywords.some((kw) => text.includes(kw));
  });

  // Last active = most recent tweet date
  const lastTweet  = tweets[0];
  const lastActive = lastTweet?.createdAt || lastTweet?.created_at
    ? new Date(lastTweet.createdAt || lastTweet.created_at).toISOString()
    : null;

  return {
    name,
    category:          target.category,
    narrative:         narrative.trim(),
    twitter_handle:    twitterHandle,
    twitter_followers: followersCount,
    last_active:       lastActive,
    source:            "twitter",
    raw_data: {
      verified,
      has_collab_signal: hasCollabSignal,
      tweet_count:       tweets.length,
      profile_url:       `https://twitter.com/${twitterHandle}`,
      scraped_from:      "profile",
    },
  };
}

// ── Extract unique projects from search result tweets ──────────
// Search results are a mix of accounts — group by author
function extractFromSearchTweets(tweets, query, defaultCategory) {
  if (tweets.length === 0) return [];

  // Group tweets by author
  const byAuthor = {};
  for (const tweet of tweets) {
    const user   = tweet.author || tweet.user || {};
    const handle = user.userName || user.screen_name;
    if (!handle) continue;

    if (!byAuthor[handle]) {
      byAuthor[handle] = { user, tweets: [] };
    }
    byAuthor[handle].tweets.push(tweet);
  }

  // Extract one project per unique author
  const projects = [];
  for (const [handle, { user, tweets: authorTweets }] of Object.entries(byAuthor)) {
    const name           = user.name || handle;
    const bio            = user.description || user.bio || "";
    const followersCount = user.followers || user.followersCount || 0;

    // Skip accounts with very few followers — likely not real projects
    if (followersCount < 100) continue;

    const recentText = authorTweets
      .map((t) => t.text || t.full_text || "")
      .filter(Boolean)
      .join(" ")
      .slice(0, 300);

    const narrative = bio
      ? `${bio.slice(0, 400)}${recentText ? ` | Found via: "${query}"` : ""}`
      : `Found via search: "${query}". Recent: ${recentText}`;

    const collabKeywords = ["partnership", "collab", "integration", "partner", "ecosystem"];
    const hasCollabSignal = authorTweets.some((t) => {
      const text = (t.text || t.full_text || "").toLowerCase();
      return collabKeywords.some((kw) => text.includes(kw));
    });

    const lastTweet  = authorTweets[0];
    const lastActive = lastTweet?.createdAt || lastTweet?.created_at
      ? new Date(lastTweet.createdAt || lastTweet.created_at).toISOString()
      : null;

    projects.push({
      name,
      category:          defaultCategory,
      narrative:         narrative.trim(),
      twitter_handle:    handle,
      twitter_followers: followersCount,
      last_active:       lastActive,
      source:            "twitter",
      raw_data: {
        verified:          user.isVerified || false,
        has_collab_signal: hasCollabSignal,
        tweet_count:       authorTweets.length,
        profile_url:       `https://twitter.com/${handle}`,
        scraped_from:      "search",
        search_query:      query,
      },
    });
  }

  return projects;
}

// ── Save results to Supabase ───────────────────────────────────
async function saveToSupabase(projects) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let saved  = 0;
  let errors = 0;

  for (const project of projects) {
    // Upsert by twitter_handle to avoid duplicates
    // If a project already exists from Telegram, update it with Twitter data
    const { error } = await supabase
      .from("discovered_projects")
      .upsert(project, {
        onConflict: "twitter_handle",
        ignoreDuplicates: false, // always update with fresh data
      });

    if (error) {
      // Fallback: try plain insert
      const { error: insertError } = await supabase
        .from("discovered_projects")
        .insert(project);

      if (insertError) {
        console.error(`  ✗ Failed to save ${project.name}: ${insertError.message}`);
        errors++;
      } else {
        saved++;
      }
    } else {
      saved++;
    }
  }

  return { saved, errors };
}

// ── Main scrape function ──────────────────────────────────────
async function scrape() {
  console.log("\n🐦 NYXUS — Apify X/Twitter Scraper");
  console.log("─────────────────────────────────────");
  if (isDryRun) console.log("🧪 DRY RUN — nothing will be saved\n");

  validateEnv();

  const apify = new ApifyClient({ token: APIFY_TOKEN });
  const allProjects = [];

  // ── Phase 1: Profile scraping ──────────────────────────────
  console.log(`\n📋 Phase 1: Scraping ${PROFILE_TARGETS.length} Twitter profiles...\n`);

  for (const target of PROFILE_TARGETS) {
    const input  = buildProfileInput(target.handle);
    const tweets = await runActorAndGetResults(apify, input, `@${target.handle}`);
    const project = extractFromProfileTweets(tweets, target);

    if (project) {
      allProjects.push(project);
      console.log(`     → ${project.name} | ${project.twitter_followers?.toLocaleString() ?? "?"} followers`);
    }

    // Small delay between runs to avoid rate limits
    await new Promise((r) => setTimeout(r, 2000));
  }

  // ── Phase 2: Search scraping ───────────────────────────────
  console.log(`\n🔍 Phase 2: Running ${SEARCH_QUERIES.length} search queries...\n`);

  for (const searchTarget of SEARCH_QUERIES) {
    const input    = buildSearchInput(searchTarget.query);
    const tweets   = await runActorAndGetResults(apify, input, `"${searchTarget.query}"`);
    const projects = extractFromSearchTweets(tweets, searchTarget.query, searchTarget.category);

    allProjects.push(...projects);
    console.log(`     → Found ${projects.length} unique accounts from this search`);

    await new Promise((r) => setTimeout(r, 2000));
  }

  // ── Deduplicate by twitter_handle ─────────────────────────
  const seen = new Set();
  const uniqueProjects = allProjects.filter((p) => {
    if (!p.twitter_handle || seen.has(p.twitter_handle)) return false;
    seen.add(p.twitter_handle);
    return true;
  });

  console.log(`\n──────────────────────────────────────`);
  console.log(`📊 Total unique projects found: ${uniqueProjects.length}`);

  if (isDryRun) {
    console.log("\n🧪 Dry run results (not saved):");
    uniqueProjects.forEach((p) => {
      console.log(`   • ${p.name} (@${p.twitter_handle}) | ${p.twitter_followers?.toLocaleString() ?? "?"} followers | ${p.category}`);
    });
  } else {
    console.log("💾 Saving to Supabase...");
    const { saved, errors } = await saveToSupabase(uniqueProjects);
    console.log(`✅ Done — ${saved} projects saved, ${errors} errors`);
  }

  console.log("\n🏁 Scrape complete.\n");
}

// ── Entry point ────────────────────────────────────────────────
if (isScrape) {
  scrape().catch(console.error);
} else {
  console.log(`
NYXUS Apify X/Twitter Scraper
─────────────────────────────────
Commands:
  node scraper.js --scrape            Run scraper (saves to Supabase)
  node scraper.js --scrape --dry-run  Preview without saving

No authentication needed — Apify handles everything.
Cost: ~$0.40 per 1,000 tweets. Free tier = $5 credit (~12,500 tweets).
`);
}
