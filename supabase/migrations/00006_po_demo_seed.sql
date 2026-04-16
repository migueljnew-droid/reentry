-- Demo seed: 1 case manager + 5 citizens on their caseload, with a
-- couple of sample notes. Safe to re-run — ON CONFLICT DO NOTHING.
--
-- NOTE: auth_id values match the demo Supabase auth user you create
-- with supabase/scripts/seed-po-auth.sh. Citizens have no auth_ids —
-- they are shadow rows for the demo.

INSERT INTO users (id, auth_id, full_name, state_of_release, conviction_type, role)
VALUES
  ('11111111-1111-1111-1111-111111111101', '99999999-9999-9999-9999-999999999901', 'Sgt. Alicia Reyes', 'GA', 'n/a', 'case_manager'),
  ('22222222-2222-2222-2222-222222222201', null, 'Marcus Williams',  'GA', 'felony',       'citizen'),
  ('22222222-2222-2222-2222-222222222202', null, 'Darnell Johnson',  'GA', 'felony',       'citizen'),
  ('22222222-2222-2222-2222-222222222203', null, 'Tanya Brooks',     'GA', 'misdemeanor',  'citizen'),
  ('22222222-2222-2222-2222-222222222204', null, 'Jerome Carter',    'GA', 'misdemeanor',  'citizen'),
  ('22222222-2222-2222-2222-222222222205', null, 'Latoya Davis',     'GA', 'felony',       'citizen')
ON CONFLICT (id) DO NOTHING;

INSERT INTO case_assignments (id, case_manager_id, citizen_id, status, assigned_at)
VALUES
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 'active', now() - interval '30 days'),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222202', 'active', now() - interval '20 days'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222203', 'active', now() - interval '15 days'),
  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222204', 'active', now() - interval '10 days'),
  ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222205', 'active', now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;
