// ── NYXUS Telegram Target List ──────────────────────────────────────
// These are public web3 channels/groups to scrape for project discovery.
// Last validated: Feb 2026 — 17/17 confirmed working
// Add more as you find relevant communities.
// Format: { username: string, category: string, notes: string }

export const TARGETS = [
  // ── DeFi ──────────────────────────────────────────────────────────
  { username: "defipulse",          category: "DeFi",            notes: "DeFi Pulse community" },
  { username: "defi_nation",        category: "DeFi",            notes: "DeFi Nation community" },
  { username: "cryptopartnerships", category: "DeFi",            notes: "Crypto partnership announcements" },
  { username: "uniswap_en",         category: "DeFi",            notes: "Uniswap English community" },
  { username: "aave_official",      category: "DeFi",            notes: "Aave official" },
  { username: "curvefi",            category: "DeFi",            notes: "Curve Finance" },

  // ── Meme / Culture ────────────────────────────────────────────────
  { username: "pepecoineth",        category: "Meme coin",       notes: "PEPE community" },
  { username: "memecoinsalerts",    category: "Meme coin",       notes: "Meme coin alerts" },
  { username: "memecoin_hub",       category: "Meme coin",       notes: "Meme coin hub" },
  { username: "base_org",           category: "Meme coin",       notes: "Base chain ecosystem" },

  // ── NFT ───────────────────────────────────────────────────────────
  { username: "nftnewsofficial",    category: "NFT",             notes: "NFT News" },
  { username: "opensea",            category: "NFT",             notes: "OpenSea updates" },
  { username: "nft_calendar",       category: "NFT",             notes: "NFT Calendar drops" },

  // ── Gaming / GameFi ───────────────────────────────────────────────
  { username: "axieinfinity",       category: "Gaming / GameFi", notes: "Axie Infinity" },
  { username: "gamefihub",          category: "Gaming / GameFi", notes: "GameFi projects" },
  { username: "playtoearnofficial", category: "Gaming / GameFi", notes: "Play to earn hub" },

  // ── AI + Crypto ───────────────────────────────────────────────────
  { username: "fetch_ai",           category: "AI + Crypto",     notes: "Fetch.ai community" },
  { username: "render_token",       category: "AI + Crypto",     notes: "Render Network" },
  { username: "aiandcrypto",        category: "AI + Crypto",     notes: "AI crypto projects" },
  { username: "numeraiofficial",    category: "AI + Crypto",     notes: "Numerai AI" },

  // ── Infrastructure / Protocol ─────────────────────────────────────
  { username: "polkadot",           category: "Protocol",        notes: "Polkadot ecosystem" },
  { username: "cosmosnetwork",      category: "Protocol",        notes: "Cosmos ecosystem" },
  { username: "arbitrum",           category: "Infrastructure",  notes: "Arbitrum ecosystem" },
  { username: "layerzero_core",     category: "Infrastructure",  notes: "LayerZero" },
  { username: "optimismofficial",   category: "Infrastructure",  notes: "Optimism L2" },

  // ── Trading Bots ──────────────────────────────────────────────────
  { username: "maestrobots",        category: "Trading bot",     notes: "Maestro trading bots" },
  { username: "bonkbot_io",         category: "Trading bot",     notes: "BonkBot Solana" },
];