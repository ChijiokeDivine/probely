-- Add invite token column to team_invites for secure invites
alter table public.team_invites add column if not exists invite_token text;

-- Create index for invite_token
create index if not exists team_invites_invite_token_idx on public.team_invites(invite_token);

-- Generate tokens for existing invites (if any)
update public.team_invites set invite_token = gen_random_uuid()::text where invite_token is null;

-- Make invite_token not null and unique
alter table public.team_invites alter column invite_token set not null;
alter table public.team_invites add constraint team_invites_invite_token_key unique (invite_token);

-- Allow invite recipients to view their invite (so they can accept it)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'team_invites'
      and policyname = 'team_invites_select_recipient'
  ) then
    create policy "team_invites_select_recipient" on public.team_invites for select using (email = auth.email());
  end if;
end $$;
