create or replace function public.review_roster_record(
  target_record_id uuid,
  review_decision public.roster_record_state,
  corrected_data jsonb
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

  if review_decision not in ('approved', 'rejected') then
    raise exception 'Review decision must be approved or rejected'
      using errcode = '22023';
  end if;

  if review_decision = 'approved'
    and (
      nullif(trim(corrected_data ->> 'first_name'), '') is null
      or nullif(trim(corrected_data ->> 'last_name'), '') is null
    )
  then
    raise exception 'Approved records require first and last name'
      using errcode = '23502';
  end if;

  update public.roster_import_records
  set
    state = review_decision,
    normalized_data = corrected_data,
    reviewed_by_user_id = auth.uid(),
    reviewed_at = now()
  where id = target_record_id
    and imported_profile_id is null;

  if not found then
    raise exception 'Staged record is unavailable'
      using errcode = '22023';
  end if;

  insert into public.audit_logs (
    actor_user_id,
    action,
    target_table,
    target_id,
    changed_fields
  )
  values (
    auth.uid(),
    'roster_record.' || review_decision::text,
    'roster_import_records',
    target_record_id,
    array['state', 'normalized_data']
  );
end;
$$;

create or replace function public.promote_roster_record(target_record_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  staged public.roster_import_records%rowtype;
  profile_id uuid;
  line_id uuid;
  profile_status public.membership_status;
begin
  if not public.is_management() then
    raise exception 'Member management access is required'
      using errcode = '42501';
  end if;

  select *
  into staged
  from public.roster_import_records
  where id = target_record_id
  for update;

  if not found
    or staged.state <> 'approved'
    or staged.imported_profile_id is not null
  then
    raise exception 'Only an approved, unimported record can be promoted'
      using errcode = '22023';
  end if;

  profile_status := case
    when staged.normalized_data ->> 'membership_status' = 'chapter_invisible'
      then 'chapter_invisible'::public.membership_status
    else null
  end;

  insert into public.brother_profiles (
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
    profession,
    employer,
    membership_status,
    source
  )
  values (
    trim(staged.normalized_data ->> 'first_name'),
    nullif(trim(staged.normalized_data ->> 'middle_name'), ''),
    trim(staged.normalized_data ->> 'last_name'),
    nullif(trim(staged.normalized_data ->> 'individual_line_name'), ''),
    case when profile_status = 'chapter_invisible' then null
      else nullif(lower(trim(staged.normalized_data ->> 'email')), '') end,
    case when profile_status = 'chapter_invisible' then null
      else nullif(trim(staged.normalized_data ->> 'phone'), '') end,
    case when profile_status = 'chapter_invisible' then null
      else nullif(trim(staged.normalized_data ->> 'street_address'), '') end,
    nullif(trim(staged.normalized_data ->> 'city'), ''),
    nullif(trim(staged.normalized_data ->> 'state'), ''),
    nullif(trim(staged.normalized_data ->> 'postal_code'), ''),
    nullif(trim(staged.normalized_data ->> 'profession'), ''),
    nullif(trim(staged.normalized_data ->> 'employer'), ''),
    profile_status,
    'legacy_import'
  )
  returning id into profile_id;

  if staged.normalized_data ->> 'crossing_season' is not null
    and staged.normalized_data ->> 'crossing_year' is not null
  then
    insert into public.lines (
      crossing_season,
      crossing_year,
      group_line_name
    )
    values (
      lower(staged.normalized_data ->> 'crossing_season'),
      (staged.normalized_data ->> 'crossing_year')::smallint,
      nullif(trim(staged.normalized_data ->> 'group_line_name'), '')
    )
    on conflict (crossing_season, crossing_year) do update
    set group_line_name = coalesce(
      public.lines.group_line_name,
      excluded.group_line_name
    )
    returning id into line_id;

    insert into public.line_memberships (
      line_id,
      brother_profile_id,
      line_position
    )
    values (
      line_id,
      profile_id,
      nullif(staged.normalized_data ->> 'line_position', '')::smallint
    );
  end if;

  update public.roster_import_records
  set
    state = 'imported',
    imported_profile_id = profile_id
  where id = target_record_id;

  insert into public.audit_logs (
    actor_user_id,
    action,
    target_table,
    target_id,
    changed_fields,
    metadata
  )
  values (
    auth.uid(),
    'roster_record.promoted',
    'brother_profiles',
    profile_id,
    array['legacy_import'],
    jsonb_build_object('roster_import_record_id', target_record_id)
  );

  return profile_id;
end;
$$;

revoke all on function public.review_roster_record(
  uuid,
  public.roster_record_state,
  jsonb
) from public;
revoke all on function public.promote_roster_record(uuid) from public;

grant execute on function public.review_roster_record(
  uuid,
  public.roster_record_state,
  jsonb
) to authenticated;
grant execute on function public.promote_roster_record(uuid)
to authenticated;
