create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_github_id bigint not null,
  name text not null,
  scene_json text not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists projects_owner_updated_idx
  on public.projects (owner_github_id, updated_at desc)
  where deleted_at is null;

create index if not exists projects_owner_lookup_idx
  on public.projects (owner_github_id, id)
  where deleted_at is null;