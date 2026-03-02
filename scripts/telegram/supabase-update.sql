-- ─────────────────────────────────────────────
-- NYXUS — Schema Update: Unique constraint for upserts
-- Run this in Supabase SQL Editor AFTER the main schema
-- ─────────────────────────────────────────────

-- Add unique constraint on telegram_handle so we can upsert
-- (update existing records instead of creating duplicates)
ALTER TABLE public.discovered_projects
  ADD CONSTRAINT discovered_projects_telegram_handle_unique
  UNIQUE (telegram_handle);

-- Also index it for fast lookups
CREATE INDEX IF NOT EXISTS idx_discovered_projects_telegram
  ON public.discovered_projects (telegram_handle)
  WHERE telegram_handle IS NOT NULL;

-- Index for category filtering (used in discovery page)
CREATE INDEX IF NOT EXISTS idx_discovered_projects_category
  ON public.discovered_projects (category);

-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_discovered_projects_source
  ON public.discovered_projects (source);
