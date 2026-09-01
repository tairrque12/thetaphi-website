begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

select enum_has_labels(
  'public',
  'access_role',
  array['brother', 'officer', 'admin'],
  'access roles match the approved platform roles'
);

select enum_has_labels(
  'public',
  'membership_status',
  array['on_yard', 'alumni', 'chapter_invisible'],
  'membership statuses match the approved lifecycle'
);

select enum_has_labels(
  'public',
  'leadership_position',
  array[
    'polemarch',
    'vice_polemarch',
    'keeper_of_records',
    'keeper_of_exchequer',
    'strategus'
  ],
  'leadership positions match the five current campus offices'
);

select has_table('public', 'user_accounts', 'user accounts table exists');
select has_table('public', 'brother_profiles', 'brother profiles table exists');
select has_table('public', 'profile_invitations', 'profile invitations table exists');
select has_table('public', 'audit_logs', 'audit log table exists');

select col_is_null(
  'public',
  'brother_profiles',
  'auth_user_id',
  'an imported profile can remain unclaimed'
);

select col_is_null(
  'public',
  'brother_profiles',
  'membership_status',
  'unverified legacy membership status can remain unset'
);

select policies_are(
  'public',
  'brother_profiles',
  array['management_read_profiles', 'owner_read_profile', 'owner_update_profile'],
  'profile access is protected by explicit row policies'
);

select policies_are(
  'public',
  'profile_invitations',
  array['management_read_invitations'],
  'only management can read profile invitations'
);

select * from finish();
rollback;
