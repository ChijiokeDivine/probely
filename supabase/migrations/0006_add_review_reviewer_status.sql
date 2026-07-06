-- Add review reviewer status enum and status column to review_reviewers
-- Run after 0002_blind_review_schema.sql

-- =============================================================================
-- review_reviewer_status enum
-- =============================================================================
do $$ begin
  create type public.review_reviewer_status as enum (
    'invited',
    'active',
    'declined',
    'replaced',
    'submitted'
  );
exception
  when duplicate_object then null;
end $$;

-- =============================================================================
-- Add status column to review_reviewers
-- =============================================================================
alter table public.review_reviewers
  add column if not exists status public.review_reviewer_status not null default 'invited',
  add column if not exists declined_at timestamptz,
  add column if not exists decline_reason text;

-- =============================================================================
-- Backfill existing rows based on is_active, has_submitted, replaced_by_reviewer_id
-- =============================================================================
update public.review_reviewers
set
  status = case
    when replaced_by_reviewer_id is not null then 'replaced'::public.review_reviewer_status
    when has_submitted then 'submitted'::public.review_reviewer_status
    when is_active then 'active'::public.review_reviewer_status
    else 'invited'::public.review_reviewer_status
  end
where status is null or status = 'invited';

-- =============================================================================
-- Update RLS policies to use status instead of is_active
-- =============================================================================
do $$ begin
  drop policy if exists "reviews_select_reviewer" on public.reviews;
  create policy "reviews_select_reviewer" on public.reviews for select using (
    exists (
      select 1 from public.review_reviewers rr
      where rr.review_id = reviews.id and rr.reviewer_id = auth.uid() and rr.status in ('active', 'submitted')
    )
  );
exception
  when others then null;
end $$;

do $$ begin
  drop policy if exists "review_reviewers_select" on public.review_reviewers;
  create policy "review_reviewers_select" on public.review_reviewers for select using (
    reviewer_id = auth.uid()
    or exists (select 1 from public.reviews r where r.id = review_reviewers.review_id and r.admin_id = auth.uid())
  );
exception
  when others then null;
end $$;

-- =============================================================================
-- Add updated_at column and trigger to review_reviewers
-- =============================================================================
alter table public.review_reviewers
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_review_reviewers_updated_at on public.review_reviewers;
create trigger set_review_reviewers_updated_at
  before update on public.review_reviewers
  for each row execute procedure public.set_updated_at();
