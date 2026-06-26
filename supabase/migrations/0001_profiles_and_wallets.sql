-- Run this in the Supabase SQL editor (or via `supabase db push` if
-- you're using the CLI with a linked project).

-- One row per auth user. Wallet fields start empty and get filled in
-- by the service-role key only (see lib/wallet.ts) — never by the user
-- directly.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  privy_wallet_id text unique,
  wallet_address text unique,
  wallet_status text not null default 'pending'
    check (wallet_status in ('pending', 'created', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- No insert/update policy for the anon/authenticated roles on purpose.
-- The row is created by the trigger below, and the wallet fields are
-- only ever written by the service-role key from lib/wallet.ts.

-- Auto-create a bare profile row the instant a new auth user exists,
-- regardless of signup method (email/password, Google OAuth, magic
-- link, ...). This is what the wallet-provisioning webhook listens for.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
