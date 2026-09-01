create type public.access_role as enum ('brother', 'officer', 'admin');
create type public.account_status as enum ('invited', 'active', 'suspended');
create type public.membership_status as enum (
  'on_yard',
  'alumni',
  'chapter_invisible'
);
create type public.leadership_position as enum (
  'polemarch',
  'vice_polemarch',
  'keeper_of_records',
  'keeper_of_exchequer',
  'strategus'
);
create type public.record_source as enum ('legacy_import', 'officer_created');

create table public.user_accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  access_role public.access_role not null default 'brother',
  account_status public.account_status not null default 'invited',
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table public.brother_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references public.user_accounts (id) on delete set null,
  first_name text not null,
  middle_name text,
  last_name text not null,
  individual_line_name text,
  email text,
  phone text,
  street_address text,
  city text,
  state text,
  postal_code text,
  birthday date,
  graduation_year smallint,
  profession text,
  employer text,
  profile_photo_key text,
  membership_status public.membership_status,
  current_leadership_position public.leadership_position unique,
  last_verified_at timestamptz,
  source public.record_source not null default 'officer_created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_graduation_year check (
    graduation_year is null
    or graduation_year between 1900 and 2200
  ),
  constraint chapter_invisible_has_no_account check (
    membership_status <> 'chapter_invisible'
    or auth_user_id is null
  )
);

create table public.profile_privacy (
  brother_profile_id uuid primary key
    references public.brother_profiles (id) on delete cascade,
  email_visible_to_brothers boolean not null default false,
  phone_visible_to_brothers boolean not null default false,
  city_state_visible_to_brothers boolean not null default true,
  birthday_visible_to_brothers boolean not null default false,
  profession_visible_to_brothers boolean not null default true,
  employer_visible_to_brothers boolean not null default false,
  social_visible_to_brothers boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.lines (
  id uuid primary key default gen_random_uuid(),
  crossing_season text not null,
  crossing_year smallint not null,
  group_line_name text,
  created_at timestamptz not null default now(),
  constraint valid_crossing_season check (
    crossing_season in ('winter', 'spring', 'summer', 'fall')
  ),
  constraint valid_crossing_year check (crossing_year between 1976 and 2200),
  unique (crossing_season, crossing_year)
);

create table public.line_memberships (
  line_id uuid not null references public.lines (id) on delete restrict,
  brother_profile_id uuid primary key
    references public.brother_profiles (id) on delete restrict,
  line_position smallint,
  constraint valid_line_position check (
    line_position is null
    or line_position > 0
  ),
  unique (line_id, line_position)
);

create table public.lineage_relationships (
  big_brother_profile_id uuid not null
    references public.brother_profiles (id) on delete restrict,
  little_brother_profile_id uuid primary key
    references public.brother_profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint brother_cannot_link_to_self check (
    big_brother_profile_id <> little_brother_profile_id
  )
);

create table public.profile_invitations (
  id uuid primary key default gen_random_uuid(),
  brother_profile_id uuid not null
    references public.brother_profiles (id) on delete cascade,
  destination_email text,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_by_user_id uuid not null references public.user_accounts (id),
  created_at timestamptz not null default now(),
  constraint invitation_has_destination check (
    destination_email is not null
    or expires_at <= created_at + interval '24 hours'
  ),
  constraint invitation_state_is_valid check (
    used_at is null
    or revoked_at is null
  )
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.user_accounts (id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  changed_fields text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_brother_profiles_updated_at
before update on public.brother_profiles
for each row execute function public.touch_updated_at();

create trigger touch_profile_privacy_updated_at
before update on public.profile_privacy
for each row execute function public.touch_updated_at();

create or replace function public.is_management()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_accounts
    where id = (select auth.uid())
      and access_role in ('officer', 'admin')
      and account_status = 'active'
  );
$$;

revoke all on function public.is_management() from public;
grant execute on function public.is_management() to authenticated;

alter table public.user_accounts enable row level security;
alter table public.brother_profiles enable row level security;
alter table public.profile_privacy enable row level security;
alter table public.lines enable row level security;
alter table public.line_memberships enable row level security;
alter table public.lineage_relationships enable row level security;
alter table public.profile_invitations enable row level security;
alter table public.audit_logs enable row level security;

create policy owner_read_account
on public.user_accounts
for select
to authenticated
using (id = (select auth.uid()));

create policy management_read_accounts
on public.user_accounts
for select
to authenticated
using ((select public.is_management()));

create policy owner_read_profile
on public.brother_profiles
for select
to authenticated
using (auth_user_id = (select auth.uid()));

create policy management_read_profiles
on public.brother_profiles
for select
to authenticated
using ((select public.is_management()));

create policy owner_update_profile
on public.brother_profiles
for update
to authenticated
using (auth_user_id = (select auth.uid()))
with check (
  auth_user_id = (select auth.uid())
  and membership_status is distinct from 'chapter_invisible'
);

create policy owner_read_privacy
on public.profile_privacy
for select
to authenticated
using (
  brother_profile_id in (
    select id
    from public.brother_profiles
    where auth_user_id = (select auth.uid())
  )
);

create policy owner_update_privacy
on public.profile_privacy
for update
to authenticated
using (
  brother_profile_id in (
    select id
    from public.brother_profiles
    where auth_user_id = (select auth.uid())
  )
)
with check (
  brother_profile_id in (
    select id
    from public.brother_profiles
    where auth_user_id = (select auth.uid())
  )
);

create policy management_read_privacy
on public.profile_privacy
for select
to authenticated
using ((select public.is_management()));

create policy authenticated_read_lines
on public.lines
for select
to authenticated
using (true);

create policy authenticated_read_line_memberships
on public.line_memberships
for select
to authenticated
using (true);

create policy authenticated_read_lineage
on public.lineage_relationships
for select
to authenticated
using (true);

create policy management_read_invitations
on public.profile_invitations
for select
to authenticated
using ((select public.is_management()));

create policy management_read_audit_logs
on public.audit_logs
for select
to authenticated
using ((select public.is_management()));

revoke all on table public.user_accounts from anon, authenticated;
revoke all on table public.brother_profiles from anon, authenticated;
revoke all on table public.profile_privacy from anon, authenticated;
revoke all on table public.lines from anon, authenticated;
revoke all on table public.line_memberships from anon, authenticated;
revoke all on table public.lineage_relationships from anon, authenticated;
revoke all on table public.profile_invitations from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;

grant select on table public.user_accounts to authenticated;
grant select on table public.brother_profiles to authenticated;
grant update (
  first_name,
  middle_name,
  last_name,
  individual_line_name,
  email,
  phone,
  street_address,
  city,
  state,
  postal_code,
  birthday,
  graduation_year,
  profession,
  employer,
  profile_photo_key,
  membership_status,
  last_verified_at
) on public.brother_profiles to authenticated;
grant select, update on table public.profile_privacy to authenticated;
grant select on table public.lines to authenticated;
grant select on table public.line_memberships to authenticated;
grant select on table public.lineage_relationships to authenticated;
grant select on table public.profile_invitations to authenticated;
grant select on table public.audit_logs to authenticated;
