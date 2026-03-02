-- ─────────────────────────────────────────────
-- NYXUS — Database Schema v1
-- Run this in your Supabase SQL Editor
-- ─────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ──────────────────────────────────
-- Extends Supabase auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── PROJECTS ──────────────────────────────────
-- User's own web3 project profile
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  category text not null,
  narrative text not null,
  stage text not null,
  goals text[] default '{}',
  twitter_handle text,
  telegram_handle text,
  website text,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

-- ── DISCOVERED PROJECTS ────────────────────────
-- Web3 projects scraped from X / Telegram
create table public.discovered_projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text,
  narrative text,
  twitter_handle text,
  telegram_handle text,
  twitter_followers integer,
  telegram_members integer,
  last_active timestamp with time zone,
  source text check (source in ('twitter', 'telegram', 'both')),
  raw_data jsonb,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

-- ── MATCHES ───────────────────────────────────
-- AI-generated match scores between user project and discovered projects
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  discovered_project_id uuid references public.discovered_projects(id) on delete cascade not null,
  score integer check (score >= 0 and score <= 100) not null,
  reasoning text,
  category_match boolean default false,
  stage_compatible boolean default true,
  reviewed boolean default false, -- admin review gate (Phase 1)
  created_at timestamp with time zone default timezone('utc', now()) not null,
  unique(project_id, discovered_project_id)
);

-- ── ALERTS ────────────────────────────────────
create table public.alerts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade,
  type text check (type in ('new_project', 'narrative_shift', 'collab_signal', 'scan_complete')) not null,
  title text not null,
  description text,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- ── ROW LEVEL SECURITY ────────────────────────
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.matches enable row level security;
alter table public.alerts enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Projects: users can only manage their own
create policy "Users can view own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can insert own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

-- Discovered projects: readable by all authenticated users
create policy "Authenticated users can view discovered projects" on public.discovered_projects
  for select using (auth.role() = 'authenticated');

-- Matches: users can only see their own
create policy "Users can view own matches" on public.matches
  for select using (
    auth.uid() = (select user_id from public.projects where id = project_id)
  );

-- Alerts: users can only see their own
create policy "Users can view own alerts" on public.alerts
  for select using (auth.uid() = user_id);

create policy "Users can update own alerts" on public.alerts
  for update using (auth.uid() = user_id);
