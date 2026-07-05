-- Team invites table schema
create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_invites_inviter_id_idx on public.team_invites(inviter_id);
create index if not exists team_invites_email_idx on public.team_invites(email);
create index if not exists team_invites_status_idx on public.team_invites(status);

-- RLS for team_invites
alter table public.team_invites enable row level security;

-- Allow users to view invites they've sent
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_invites'
      and policyname = 'team_invites_select_inviter'
  ) then
    create policy "team_invites_select_inviter" on public.team_invites for select using (inviter_id = auth.uid());
  end if;
end $$;

-- Allow users to insert new invites
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_invites'
      and policyname = 'team_invites_insert_inviter'
  ) then
    create policy "team_invites_insert_inviter" on public.team_invites for insert with check (inviter_id = auth.uid());
  end if;
end $$;

-- Allow users to update invites they've sent
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_invites'
      and policyname = 'team_invites_update_inviter'
  ) then
    create policy "team_invites_update_inviter" on public.team_invites for update using (inviter_id = auth.uid());
  end if;
end $$;

-- set_updated_at trigger for team_invites
drop trigger if exists set_team_invites_updated_at on public.team_invites;
create trigger set_team_invites_updated_at
  before update on public.team_invites
  for each row execute procedure public.set_updated_at();
