// ── NYXUS — Apify Twitter Scraper Targets ───────────────────────────
// Two types of targets:
//   1. PROFILES — scrape a specific web3 project's Twitter profile
//   2. SEARCHES — scrape tweets matching a search query (finds new projects)
//
// Profiles give us known projects. Searches surface unknown ones.
// Both feed into the same discovered_projects table.

export const PROFILE_TARGETS = [
  // ── DeFi ──────────────────────────────────────────────────────────
  { handle: "Uniswap",         category: "DeFi",            notes: "Uniswap DEX" },
  { handle: "AaveAave",        category: "DeFi",            notes: "Aave lending protocol" },
  { handle: "CurveFinance",    category: "DeFi",            notes: "Curve stablecoin DEX" },
  { handle: "compoundfinance", category: "DeFi",            notes: "Compound lending" },
  { handle: "MakerDAO",        category: "DeFi",            notes: "MakerDAO / DAI" },
  { handle: "beefyfinance",    category: "DeFi",            notes: "Beefy yield optimizer" },
  { handle: "yearnfi",         category: "DeFi",            notes: "Yearn Finance" },

  // ── Meme / Culture ────────────────────────────────────────────────
  { handle: "pepecoineth",     category: "Meme coin",       notes: "PEPE meme coin" },
  { handle: "base",            category: "Meme coin",       notes: "Base chain ecosystem" },
  { handle: "dogecoin",        category: "Meme coin",       notes: "DOGE" },
  { handle: "Floki_Inu",       category: "Meme coin",       notes: "Floki" },

  // ── NFT ───────────────────────────────────────────────────────────
  { handle: "opensea",         category: "NFT",             notes: "OpenSea marketplace" },
  { handle: "blur_io",         category: "NFT",             notes: "Blur NFT marketplace" },
  { handle: "MagicEden",       category: "NFT",             notes: "Magic Eden" },

  // ── Gaming / GameFi ───────────────────────────────────────────────
  { handle: "AxieInfinity",    category: "Gaming / GameFi", notes: "Axie Infinity" },
  { handle: "GuildSquad",      category: "Gaming / GameFi", notes: "GuildSquad gaming" },
  { handle: "illuviumio",      category: "Gaming / GameFi", notes: "Illuvium game" },

  // ── AI + Crypto ───────────────────────────────────────────────────
  { handle: "Fetch_ai",        category: "AI + Crypto",     notes: "Fetch.ai" },
  { handle: "rendernetwork",   category: "AI + Crypto",     notes: "Render Network" },
  { handle: "TAONet_",         category: "AI + Crypto",     notes: "Bittensor / TAO" },
  { handle: "numerai",         category: "AI + Crypto",     notes: "Numerai AI hedge fund" },

  // ── Infrastructure / Protocol ─────────────────────────────────────
  { handle: "Polkadot",        category: "Protocol",        notes: "Polkadot ecosystem" },
  { handle: "cosmos",          category: "Protocol",        notes: "Cosmos IBC" },
  { handle: "arbitrum",        category: "Infrastructure",  notes: "Arbitrum L2" },
  { handle: "LayerZero_Core",  category: "Infrastructure",  notes: "LayerZero messaging" },
  { handle: "optimismFND",     category: "Infrastructure",  notes: "Optimism L2" },

  // ── Trading Bots ──────────────────────────────────────────────────
  { handle: "MaestroBots",     category: "Trading bot",     notes: "Maestro trading bots" },
  { handle: "bonkbot_io",      category: "Trading bot",     notes: "BonkBot Solana" },
];

// Search queries — these surface NEW unknown projects talking about partnerships
export const SEARCH_QUERIES = [
  { query: "web3 partnership collab announcement",          category: "DeFi" },
  { query: "DeFi protocol partnership integration 2025",    category: "DeFi" },
  { query: "meme coin collab community partnership",        category: "Meme coin" },
  { query: "NFT project collaboration announcement",        category: "NFT" },
  { query: "GameFi partnership play to earn collab",        category: "Gaming / GameFi" },
  { query: "AI crypto partnership launch announcement",     category: "AI + Crypto" },
  { query: "web3 BD business development seeking partner",  category: "DeFi" },
  { query: "crypto ecosystem partnership open to collab",   category: "Infrastructure" },
];
