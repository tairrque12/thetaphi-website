create type public.roster_batch_state as enum (
  'needs_review',
  'approved',
  'imported',
  'cancelled'
);

create type public.roster_record_state as enum (
  'ready_for_review',
  'needs_review',
  'chapter_invisible',
  'approved',
  'rejected',
  'imported'
);

create table public.roster_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_label text not null,
  source_sha256 text not null unique,
  state public.roster_batch_state not null default 'needs_review',
  summary jsonb not null default '{}'::jsonb,
  created_by_user_id uuid not null references public.user_accounts (id),
  created_at timestamptz not null default now(),
  imported_at timestamptz
);

create table public.roster_import_records (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null
    references public.roster_import_batches (id) on delete cascade,
  source_row integer not null,
  state public.roster_record_state not null,
  review_flags text[] not null default '{}',
  normalized_data jsonb not null,
  imported_profile_id uuid
    references public.brother_profiles (id) on delete restrict,
  reviewed_by_user_id uuid references public.user_accounts (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (batch_id, source_row),
  constraint imported_record_has_profile check (
    state <> 'imported'
    or imported_profile_id is not null
  )
);

create index roster_import_records_batch_state_idx
on public.roster_import_records (batch_id, state);

alter table public.roster_import_batches enable row level security;
alter table public.roster_import_records enable row level security;

create policy management_manage_import_batches
on public.roster_import_batches
for all
to authenticated
using ((select public.is_management()))
with check ((select public.is_management()));

create policy management_manage_import_records
on public.roster_import_records
for all
to authenticated
using ((select public.is_management()))
with check ((select public.is_management()));

revoke all on table public.roster_import_batches from anon, authenticated;
revoke all on table public.roster_import_records from anon, authenticated;

grant select, insert, update on table public.roster_import_batches
to authenticated;
grant select, insert, update on table public.roster_import_records
to authenticated;
