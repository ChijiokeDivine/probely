-- Adds missing 'company' and 'role' columns to profiles table
-- All statements are idempotent so this is safe to re-run

alter table public.profiles
  add column if not exists company text;

alter table public.profiles
  add column if not exists role text default 'admin';

-- Also ensure we have an updated_at trigger on profiles (already in 0001 but just in case)
do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_profiles_updated_at'
  ) then
    create trigger set_profiles_updated_at
      before update on public.profiles
      for each row execute procedure public.set_updated_at();
  end if;
end $$;

-- RLS policy to allow users to update their own profile (company/role/full_name)
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
