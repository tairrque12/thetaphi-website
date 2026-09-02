create extension if not exists pgcrypto with schema extensions;

create or replace function public.add_default_profile_privacy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile_privacy (brother_profile_id)
  values (new.id)
  on conflict (brother_profile_id) do nothing;
  return new;
end;
$$;

create trigger create_default_profile_privacy
after insert on public.brother_profiles
for each row execute function public.add_default_profile_privacy();

insert into public.profile_privacy (brother_profile_id)
select id
from public.brother_profiles
on conflict (brother_profile_id) do nothing;

create or replace function public.get_invitation_preview(invitation_token text)
returns table (
  profile_id uuid,
  first_name text,
  last_name text,
  individual_line_name text,
  crossing_season text,
  crossing_year smallint,
  group_line_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.id,
    profile.first_name,
    profile.last_name,
    profile.individual_line_name,
    line.crossing_season,
    line.crossing_year,
    line.group_line_name
  from public.profile_invitations invitation
  join public.brother_profiles profile
    on profile.id = invitation.brother_profile_id
  left join public.line_memberships membership
    on membership.brother_profile_id = profile.id
  left join public.lines line
    on line.id = membership.line_id
  where invitation.token_hash = encode(
    extensions.digest(invitation_token, 'sha256'),
    'hex'
  )
    and invitation.used_at is null
    and invitation.revoked_at is null
    and invitation.expires_at > now()
    and profile.auth_user_id is null
    and profile.membership_status is distinct from 'chapter_invisible'
  limit 1;
$$;

create or replace function public.claim_profile(invitation_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_email text := auth.jwt() ->> 'email';
  invitation_record public.profile_invitations%rowtype;
  claimed_profile_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication is required'
      using errcode = '42501';
  end if;

  select *
  into invitation_record
  from public.profile_invitations
  where token_hash = encode(
    extensions.digest(invitation_token, 'sha256'),
    'hex'
  )
  for update;

  if not found
    or invitation_record.used_at is not null
    or invitation_record.revoked_at is not null
    or invitation_record.expires_at <= now()
  then
    raise exception 'Invitation is invalid or expired'
      using errcode = '22023';
  end if;

  if invitation_record.destination_email is not null
    and lower(invitation_record.destination_email) is distinct from lower(caller_email)
  then
    raise exception 'Invitation belongs to another account'
      using errcode = '42501';
  end if;

  insert into public.user_accounts (id, account_status)
  values (caller_id, 'active')
  on conflict (id) do update
  set account_status = 'active';

  update public.brother_profiles
  set auth_user_id = caller_id
  where id = invitation_record.brother_profile_id
    and auth_user_id is null
    and membership_status is distinct from 'chapter_invisible'
  returning id into claimed_profile_id;

  if claimed_profile_id is null then
    raise exception 'Profile cannot be claimed'
      using errcode = '23505';
  end if;

  update public.profile_invitations
  set used_at = now()
  where id = invitation_record.id;

  insert into public.audit_logs (
    actor_user_id,
    action,
    target_table,
    target_id,
    changed_fields
  )
  values (
    caller_id,
    'profile.claimed',
    'brother_profiles',
    claimed_profile_id,
    array['auth_user_id']
  );

  return claimed_profile_id;
end;
$$;

create or replace function public.complete_own_onboarding(profile_data jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  selected_status public.membership_status;
  owned_profile_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication is required'
      using errcode = '42501';
  end if;

  selected_status := (profile_data ->> 'membership_status')::public.membership_status;

  if selected_status not in ('on_yard', 'alumni') then
    raise exception 'Brothers may choose only On Yard or Alumni'
      using errcode = '22023';
  end if;

  if nullif(trim(profile_data ->> 'first_name'), '') is null
    or nullif(trim(profile_data ->> 'last_name'), '') is null
  then
    raise exception 'First and last name are required'
      using errcode = '23502';
  end if;

  update public.brother_profiles
  set
    first_name = trim(profile_data ->> 'first_name'),
    middle_name = nullif(trim(profile_data ->> 'middle_name'), ''),
    last_name = trim(profile_data ->> 'last_name'),
    individual_line_name = nullif(trim(profile_data ->> 'individual_line_name'), ''),
    email = nullif(trim(profile_data ->> 'email'), ''),
    phone = nullif(trim(profile_data ->> 'phone'), ''),
    street_address = nullif(trim(profile_data ->> 'street_address'), ''),
    city = nullif(trim(profile_data ->> 'city'), ''),
    state = nullif(trim(profile_data ->> 'state'), ''),
    postal_code = nullif(trim(profile_data ->> 'postal_code'), ''),
    profession = nullif(trim(profile_data ->> 'profession'), ''),
    employer = nullif(trim(profile_data ->> 'employer'), ''),
    membership_status = selected_status,
    last_verified_at = now()
  where auth_user_id = caller_id
    and membership_status is distinct from 'chapter_invisible'
  returning id into owned_profile_id;

  if owned_profile_id is null then
    raise exception 'No claimed profile was found'
      using errcode = '42501';
  end if;

  update public.profile_privacy
  set
    email_visible_to_brothers = coalesce(
      (profile_data #>> '{privacy,email}')::boolean,
      false
    ),
    phone_visible_to_brothers = coalesce(
      (profile_data #>> '{privacy,phone}')::boolean,
      false
    ),
    city_state_visible_to_brothers = coalesce(
      (profile_data #>> '{privacy,city_state}')::boolean,
      true
    ),
    birthday_visible_to_brothers = coalesce(
      (profile_data #>> '{privacy,birthday}')::boolean,
      false
    ),
    profession_visible_to_brothers = coalesce(
      (profile_data #>> '{privacy,profession}')::boolean,
      true
    ),
    employer_visible_to_brothers = coalesce(
      (profile_data #>> '{privacy,employer}')::boolean,
      false
    )
  where brother_profile_id = owned_profile_id;

  insert into public.audit_logs (
    actor_user_id,
    action,
    target_table,
    target_id,
    changed_fields
  )
  values (
    caller_id,
    'profile.onboarding_completed',
    'brother_profiles',
    owned_profile_id,
    array[
      'contact_information',
      'membership_status',
      'privacy',
      'last_verified_at'
    ]
  );

  return owned_profile_id;
end;
$$;

create or replace function public.create_profile_invitation(
  target_profile_id uuid,
  target_email text,
  hashed_token text,
  expiration timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_id uuid;
begin
  if not public.is_management() then
    raise exception 'Member management access is required'
      using errcode = '42501';
  end if;

  if expiration <= now() or expiration > now() + interval '7 days' then
    raise exception 'Invitation expiration is invalid'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.brother_profiles
    where id = target_profile_id
      and auth_user_id is null
      and membership_status is distinct from 'chapter_invisible'
  ) then
    raise exception 'Profile cannot receive an invitation'
      using errcode = '22023';
  end if;

  update public.profile_invitations
  set revoked_at = now()
  where brother_profile_id = target_profile_id
    and used_at is null
    and revoked_at is null;

  insert into public.profile_invitations (
    brother_profile_id,
    destination_email,
    token_hash,
    expires_at,
    created_by_user_id
  )
  values (
    target_profile_id,
    lower(nullif(trim(target_email), '')),
    hashed_token,
    expiration,
    auth.uid()
  )
  returning id into invitation_id;

  insert into public.audit_logs (
    actor_user_id,
    action,
    target_table,
    target_id,
    changed_fields
  )
  values (
    auth.uid(),
    'profile.invitation_created',
    'brother_profiles',
    target_profile_id,
    array['invitation']
  );

  return invitation_id;
end;
$$;

create or replace function public.revoke_profile_invitation(
  target_invitation_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_management() then
    raise exception 'Member management access is required'
      using errcode = '42501';
  end if;

  update public.profile_invitations
  set revoked_at = now()
  where id = target_invitation_id
    and used_at is null
    and revoked_at is null;
end;
$$;

revoke all on function public.get_invitation_preview(text) from public;
revoke all on function public.claim_profile(text) from public;
revoke all on function public.complete_own_onboarding(jsonb) from public;
revoke all on function public.create_profile_invitation(
  uuid,
  text,
  text,
  timestamptz
) from public;
revoke all on function public.revoke_profile_invitation(uuid) from public;

grant execute on function public.get_invitation_preview(text)
to anon, authenticated;
grant execute on function public.claim_profile(text)
to authenticated;
grant execute on function public.complete_own_onboarding(jsonb)
to authenticated;
grant execute on function public.create_profile_invitation(
  uuid,
  text,
  text,
  timestamptz
) to authenticated;
grant execute on function public.revoke_profile_invitation(uuid)
to authenticated;
