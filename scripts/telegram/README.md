# NYXUS — Telegram Scraper

Scrapes public web3 Telegram channels and groups, stores discovered projects in Supabase.

---

## Setup (do this once)

### 1. Get your Telegram API credentials
- Go to https://my.telegram.org
- Log in with your Telegram account
- Click **"API development tools"**
- Create a new app (name/platform don't matter)
- Copy your **`api_id`** (a number) and **`api_hash`** (a string)

### 2. Add credentials to your `.env.local`
Open `.env.local` in the root of your nyxus project and add:

```env
# ─── TELEGRAM ───────────────────────────────────────────
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890
TELEGRAM_PHONE=+2348012345678
```

> ⚠️ Use your full phone number with country code. This is the number linked to your Telegram account.

### 3. Run the Supabase schema update
In Supabase dashboard → SQL Editor, run the contents of `supabase-update.sql`.

### 4. Install dependencies
```bash
cd scripts/telegram
npm install
```

---

## Usage

### First time — authenticate
```bash
cd scripts/telegram
node scraper.js --auth
```
You'll be prompted for your phone number and the verification code Telegram sends you.
Your session is saved to `.session` — you won't need to authenticate again.

### Run the scraper
```bash
node scraper.js --scrape
```

### Preview without saving (dry run)
```bash
node scraper.js --scrape --dry-run
```

---

## How it works

1. Connects to Telegram as your user account (not a bot)
2. Loops through the target list in `targets.js`
3. For each channel/group: fetches entity info + last 20 messages
4. Extracts: name, description, member count, last active date, collab signals
5. Upserts into Supabase `discovered_projects` table

## Adding more targets
Edit `targets.js` and add entries:
```js
{ username: "yourproject", category: "DeFi", notes: "Why this is relevant" },
```

## Scheduling (Day 5+)
Once working, you can schedule weekly runs using GitHub Actions or a cron job.
