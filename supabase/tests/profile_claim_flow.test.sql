begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'officer@example.com'),
  ('20000000-0000-0000-0000-000000000002', 'brother@example.com');

insert into public.user_accounts (id, access_role, account_status)
values (
  '10000000-0000-0000-0000-000000000001',
  'officer',
  'active'
);

insert into public.brother_profiles (
  id,
  first_name,
  last_name,
  email,
  source
)
values (
  '30000000-0000-0000-0000-000000000003',
  'John',
  'Doe',
  'old-address@example.com',
  'legacy_import'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","email":"officer@example.com"}',
  true
);

select lives_ok(
  $$
    select public.create_profile_invitation(
      '30000000-0000-0000-0000-000000000003',
      'brother@example.com',
      encode(
        extensions.digest(
          'a-secure-profile-token-with-more-than-32-characters',
          'sha256'
        ),
        'hex'
      ),
      now() + interval '48 hours'
    )
  $$,
  'an active officer can create an invitation'
);

reset role;
set local role anon;

select results_eq(
  $$
    select first_name
    from public.get_invitation_preview(
      'a-secure-profile-token-with-more-than-32-characters'
    )
  $$,
  array['John'::text],
  'the secret token reveals only its matching profile preview'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000002","email":"brother@example.com"}',
  true
);

select lives_ok(
  $$
    select public.claim_profile(
      'a-secure-profile-token-with-more-than-32-characters'
    )
  $$,
  'the intended authenticated brother can claim the profile'
);

select results_eq(
  $$
    select auth_user_id
    from public.brother_profiles
    where id = '30000000-0000-0000-0000-000000000003'
  $$,
  array['20000000-0000-0000-0000-000000000002'::uuid],
  'claiming connects exactly that account and profile'
);

select lives_ok(
  $$
    select public.complete_own_onboarding(
      '{
        "first_name": "John",
        "middle_name": "",
        "last_name": "Doe",
        "individual_line_name": "Achievement",
        "email": "brother@example.com",
        "phone": "334-555-1911",
        "street_address": "",
        "city": "Troy",
        "state": "AL",
        "postal_code": "36081",
        "profession": "Engineer",
        "employer": "",
        "membership_status": "alumni",
        "privacy": {
          "email": false,
          "phone": false,
          "city_state": true,
          "birthday": false,
          "profession": true,
          "employer": false
        }
      }'::jsonb
    )
  $$,
  'the profile owner can complete onboarding'
);

select throws_ok(
  $$
    select public.complete_own_onboarding(
      '{
        "first_name": "John",
        "last_name": "Doe",
        "membership_status": "chapter_invisible"
      }'::jsonb
    )
  $$,
  '22023',
  'Brothers may choose only On Yard or Alumni',
  'a brother cannot mark himself Chapter Invisible'
);

select * from finish();
rollback;
