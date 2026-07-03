-- BlindReview (Probely) backend schema.
-- Run after your existing profiles/auth setup. All statements are
-- idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS) so this is safe to
-- re-run against an already-partially-migrated database.

-- =============================================================================
-- profiles: small additive changes only. We assume this table already exists
-- (created by your Supabase auth trigger) with at least:
--   id uuid primary key references auth.users(id)
--   wallet_address text
--   privy_wallet_id text
--   wallet_status text
-- =============================================================================
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists company text,
  add column if not exists role text default 'admin';

-- =============================================================================
-- app_wallets — system-owned wallets (currently just the 'operator' wallet
-- used for permissionless txs like submitRevealedScores and gas drips).
-- Service-role only; RLS enabled with zero policies = default-deny to anon
-- and authenticated clients.
-- =============================================================================
create table if not exists public.app_wallets (
  key text primary key,
  privy_wallet_id text not null,
  wallet_address text not null,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- chain_sync_state — indexer cursor. Service-role only.
-- =============================================================================
create table if not exists public.chain_sync_state (
  id text primary key,
  last_synced_block bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- review_status enum
-- =============================================================================
do $$ begin
  create type public.review_status as enum (
    'draft',
    'pending_tx',
    'active',
    'reveal_requested',
    'revealed',
    'cancelled',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

-- =============================================================================
-- candidates
-- =============================================================================
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  candidate_ref text not null unique,
  full_name text not null,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists candidates_created_by_idx on public.candidates(created_by);

-- =============================================================================
-- reviews
-- =============================================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  chain_review_id numeric,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  candidate_ref text not null,
  role text not null,
  round_number int,
  reviewer_count int not null,
  deadline timestamptz not null,
  -- {problemSolving, technicalDepth, communication, collaboration, cultureGrowth} in basis points
  category_weights jsonb not null,
  -- {enabled, passThreshold, failThreshold, passAction, failAction}
  auto_advance_rule jsonb not null,
  status public.review_status not null default 'draft',
  submitted_count int not null default 0,
  extension_used boolean not null default false,
  create_tx_hash text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists reviews_chain_review_id_idx on public.reviews(chain_review_id) where chain_review_id is not null;
create index if not exists reviews_admin_id_idx on public.reviews(admin_id);
create index if not exists reviews_candidate_id_idx on public.reviews(candidate_id);
create index if not exists reviews_status_idx on public.reviews(status);

-- =============================================================================
-- review_reviewers
-- =============================================================================
create table if not exists public.review_reviewers (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  wallet_address text not null,
  is_active boolean not null default true,
  replaced_by_reviewer_id uuid references public.profiles(id),
  has_submitted boolean not null default false,
  tag_mask int,
  submitted_at timestamptz,
  submit_tx_hash text,
  invited_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (review_id, reviewer_id)
);
create index if not exists review_reviewers_review_id_idx on public.review_reviewers(review_id);
create index if not exists review_reviewers_reviewer_id_idx on public.review_reviewers(reviewer_id);

-- =============================================================================
-- review_score_submissions
-- =============================================================================
create table if not exists public.review_score_submissions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  tx_hash text,
  handles jsonb,
  tag_mask int,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index if not exists review_score_submissions_review_id_idx on public.review_score_submissions(review_id);

-- =============================================================================
-- review_reveals
-- =============================================================================
create table if not exists public.review_reveals (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.reviews(id) on delete cascade,
  requested_by uuid references public.profiles(id),
  request_tx_hash text,
  handles jsonb,
  decryption_proof text,
  abi_encoded_clear_values text,
  finalize_tx_hash text,
  status text not null default 'requested'
    check (status in ('requested', 'decrypting', 'finalizing', 'finalized', 'failed')),
  error_message text,
  requested_at timestamptz not null default now(),
  finalized_at timestamptz
);

-- =============================================================================
-- review_results
-- =============================================================================
create table if not exists public.review_results (
  review_id uuid primary key references public.reviews(id) on delete cascade,
  sum_problem_solving int not null,
  sum_technical_depth int not null,
  sum_communication int not null,
  sum_collaboration int not null,
  sum_culture_growth int not null,
  sum_sq_problem_solving int not null,
  sum_sq_technical_depth int not null,
  sum_sq_communication int not null,
  sum_sq_collaboration int not null,
  sum_sq_culture_growth int not null,
  reviewer_count int not null,
  tag_counts jsonb not null,
  -- Σ(sum_i × weight_i) / reviewerCount — same scale (0-100,000) the contract
  -- uses for its own AutoAdvanceRule thresholds.
  weighted_score numeric,
  revealed_at timestamptz not null default now(),
  reveal_tx_hash text
);

-- =============================================================================
-- review_events
-- =============================================================================
create table if not exists public.review_events (
  id bigint generated always as identity primary key,
  review_id uuid references public.reviews(id) on delete cascade,
  chain_review_id numeric,
  event_type text not null,
  tx_hash text,
  block_number bigint,
  log_index int,
  payload jsonb,
  created_at timestamptz not null default now(),
  unique (tx_hash, log_index)
);
create index if not exists review_events_review_id_idx on public.review_events(review_id);

-- =============================================================================
-- wallet_transactions
-- =============================================================================
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  review_id uuid references public.reviews(id) on delete set null,
  tx_hash text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index if not exists wallet_transactions_profile_id_idx on public.wallet_transactions(profile_id);

-- =============================================================================
-- notifications
-- =============================================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  review_id uuid references public.reviews(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_profile_id_idx on public.notifications(profile_id, read_at);

-- =============================================================================
-- ENABLE RLS FOR ALL TABLES
-- =============================================================================
alter table public.app_wallets enable row level security;
alter table public.chain_sync_state enable row level security;
alter table public.candidates enable row level security;
alter table public.reviews enable row level security;
alter table public.review_reviewers enable row level security;
alter table public.review_score_submissions enable row level security;
alter table public.review_reveals enable row level security;
alter table public.review_results enable row level security;
alter table public.review_events enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.notifications enable row level security;

-- =============================================================================
-- CANDIDATES POLICIES (idempotent)
-- =============================================================================
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'candidates'
      and policyname = 'candidates_select_own'
  ) then
    create policy "candidates_select_own" on public.candidates for select using (created_by = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'candidates'
      and policyname = 'candidates_insert_own'
  ) then
    create policy "candidates_insert_own" on public.candidates for insert with check (created_by = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'candidates'
      and policyname = 'candidates_update_own'
  ) then
    create policy "candidates_update_own" on public.candidates for update using (created_by = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'candidates'
      and policyname = 'candidates_delete_own'
  ) then
    create policy "candidates_delete_own" on public.candidates for delete using (created_by = auth.uid());
  end if;
end $$;

-- =============================================================================
-- REVIEWS POLICIES (idempotent)
-- =============================================================================
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'reviews'
      and policyname = 'reviews_select_admin'
  ) then
    create policy "reviews_select_admin" on public.reviews for select using (admin_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'reviews'
      and policyname = 'reviews_select_reviewer'
  ) then
    create policy "reviews_select_reviewer" on public.reviews for select using (
      exists (
        select 1 from public.review_reviewers rr
        where rr.review_id = reviews.id and rr.reviewer_id = auth.uid() and rr.is_active
      )
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'reviews'
      and policyname = 'reviews_insert_admin'
  ) then
    create policy "reviews_insert_admin" on public.reviews for insert with check (admin_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'reviews'
      and policyname = 'reviews_update_admin'
  ) then
    create policy "reviews_update_admin" on public.reviews for update using (admin_id = auth.uid());
  end if;
end $$;

-- =============================================================================
-- REVIEW_REVIEWERS POLICIES (idempotent)
-- =============================================================================
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'review_reviewers'
      and policyname = 'review_reviewers_select'
  ) then
    create policy "review_reviewers_select" on public.review_reviewers for select using (
      reviewer_id = auth.uid()
      or exists (select 1 from public.reviews r where r.id = review_reviewers.review_id and r.admin_id = auth.uid())
    );
  end if;
end $$;

-- =============================================================================
-- REVIEW_SCORE_SUBMISSIONS POLICIES (idempotent)
-- =============================================================================
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'review_score_submissions'
      and policyname = 'review_score_submissions_select'
  ) then
    create policy "review_score_submissions_select" on public.review_score_submissions for select using (
      reviewer_id = auth.uid()
      or exists (select 1 from public.reviews r where r.id = review_score_submissions.review_id and r.admin_id = auth.uid())
    );
  end if;
end $$;

-- =============================================================================
-- REVIEW_REVEALS POLICIES (idempotent)
-- =============================================================================
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'review_reveals'
      and policyname = 'review_reveals_select'
  ) then
    create policy "review_reveals_select" on public.review_reveals for select using (
      exists (
        select 1 from public.reviews r
        where r.id = review_reveals.review_id
          and (
            r.admin_id = auth.uid()
            or exists (select 1 from public.review_reviewers rr where rr.review_id = r.id and rr.reviewer_id = auth.uid())
          )
      )
    );
  end if;
end $$;

-- =============================================================================
-- REVIEW_RESULTS POLICIES (idempotent)
-- =============================================================================
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'review_results'
      and policyname = 'review_results_select'
  ) then
    create policy "review_results_select" on public.review_results for select using (
      exists (
        select 1 from public.reviews r
        where r.id = review_results.review_id
          and (
            r.admin_id = auth.uid()
            or exists (select 1 from public.review_reviewers rr where rr.review_id = r.id and rr.reviewer_id = auth.uid())
          )
      )
    );
  end if;
end $$;

-- =============================================================================
-- REVIEW_EVENTS POLICIES (idempotent)
-- =============================================================================
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'review_events'
      and policyname = 'review_events_select'
  ) then
    create policy "review_events_select" on public.review_events for select using (
      exists (
        select 1 from public.reviews r
        where r.id = review_events.review_id
          and (
            r.admin_id = auth.uid()
            or exists (select 1 from public.review_reviewers rr where rr.review_id = r.id and rr.reviewer_id = auth.uid())
          )
      )
    );
  end if;
end $$;

-- =============================================================================
-- WALLET_TRANSACTIONS POLICIES (idempotent)
-- =============================================================================
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'wallet_transactions'
      and policyname = 'wallet_transactions_select_own'
  ) then
    create policy "wallet_transactions_select_own" on public.wallet_transactions for select using (profile_id = auth.uid());
  end if;
end $$;

-- =============================================================================
-- NOTIFICATIONS POLICIES (idempotent)
-- =============================================================================
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_select_own'
  ) then
    create policy "notifications_select_own" on public.notifications for select using (profile_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_update_own'
  ) then
    create policy "notifications_update_own" on public.notifications for update using (profile_id = auth.uid());
  end if;
end $$;

-- =============================================================================
-- set_updated_at triggers for all tables with updated_at column
-- =============================================================================
drop trigger if exists set_candidates_updated_at on public.candidates;
create trigger set_candidates_updated_at
  before update on public.candidates
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at
  before update on public.reviews
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_chain_sync_state_updated_at on public.chain_sync_state;
create trigger set_chain_sync_state_updated_at
  before update on public.chain_sync_state
  for each row execute procedure public.set_updated_at();

-- =============================================================================
-- PROFILES POLICIES (idempotent)
-- =============================================================================
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_own'
  ) then
    create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
  end if;
end $$;
