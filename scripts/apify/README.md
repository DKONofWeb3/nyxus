# NYXUS — Apify X/Twitter Scraper

Scrapes Twitter profiles and search queries to discover web3 projects.
No authentication needed — Apify handles all the Twitter access.

---

## Setup (do this once)

### 1. Add your Apify token to `.env.local`
```env
APIFY_API_TOKEN=apify_api_your_token_here
```
Get it from: Apify console → Settings → Integrations → Personal API token

### 2. Run the Supabase schema update
In Supabase dashboard → SQL Editor, run the contents of `supabase-update.sql`.

### 3. Install dependencies
```bash
cd scripts/apify
npm install
```

---

## Usage

### Dry run first (no cost, no saving):
```bash
node scraper.js --scrape --dry-run
```

### Real run (uses Apify credits):
```bash
node scraper.js --scrape
```

---

## How it works

**Phase 1 — Profile scraping:**
Scrapes the last 20 tweets from each known web3 project profile.
Extracts: name, bio, follower count, collab signals, last active date.

**Phase 2 — Search scraping:**
Runs 8 partnership/collab search queries on Twitter.
Groups results by author, filters out low-follower accounts (<100).
This is how we find NEW unknown projects.

Results from both phases are deduplicated by twitter_handle,
then upserted into the `discovered_projects` table.

---

## Cost estimate
- 27 profiles × 20 tweets = ~540 tweets
- 8 searches × 15 tweets = ~120 tweets
- Total: ~660 tweets per run = ~$0.27
- Free tier ($5) = ~18 full runs before paying anything

## Adding more targets
Edit `targets.js`:
```js
// Add to PROFILE_TARGETS
{ handle: "newproject_eth", category: "DeFi", notes: "Why relevant" },

// Add to SEARCH_QUERIES
{ query: "your search terms here", category: "DeFi" },
```
