-- ─────────────────────────────────────────────
-- NYXUS — Schema Update: Twitter unique constraint
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────

-- Add unique constraint on twitter_handle so we can upsert
ALTER TABLE public.discovered_projects
  ADD CONSTRAINT discovered_projects_twitter_handle_unique
  UNIQUE (twitter_handle);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_discovered_projects_twitter
  ON public.discovered_projects (twitter_handle)
  WHERE twitter_handle IS NOT NULL;
