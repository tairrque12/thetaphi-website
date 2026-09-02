begin;

create extension if not exists pgtap with schema extensions;
select plan(5);

select has_table(
  'public',
  'roster_import_batches',
  'private roster import batches table exists'
);

select has_table(
  'public',
  'roster_import_records',
  'private roster staging records table exists'
);

select policies_are(
  'public',
  'roster_import_batches',
  array['management_manage_import_batches'],
  'only management can access import batches'
);

select policies_are(
  'public',
  'roster_import_records',
  array['management_manage_import_records'],
  'only management can access staged roster records'
);

select col_is_null(
  'public',
  'roster_import_records',
  'imported_profile_id',
  'a staged record is not treated as imported before approval'
);

select * from finish();
rollback;
