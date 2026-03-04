-- ── NYXUS — CoinGecko Ingestion Schema Update ──────────────────
-- Run this in Supabase → SQL Editor BEFORE running ingest.js

-- 1. Add source_id column for deduplication across sources
--    e.g. "coingecko_bitcoin", "coingecko_uniswap", "telegram_@uniswap"
ALTER TABLE discovered_projects
  ADD COLUMN IF NOT EXISTS source_id text UNIQUE;

-- 2. Backfill source_id for existing Telegram rows
UPDATE discovered_projects
  SET source_id = 'telegram_' || telegram_handle
  WHERE source = 'telegram'
    AND telegram_handle IS NOT NULL
    AND source_id IS NULL;

-- 3. Index for fast upsert lookups
CREATE INDEX IF NOT EXISTS idx_discovered_projects_source_id
  ON discovered_projects (source_id)
  WHERE source_id IS NOT NULL;

-- 4. Index for market cap rank sorting (used in discovery ranking)
CREATE INDEX IF NOT EXISTS idx_discovered_projects_source
  ON discovered_projects (source);

-- Verify
SELECT COUNT(*) as total, source FROM discovered_projects GROUP BY source;
