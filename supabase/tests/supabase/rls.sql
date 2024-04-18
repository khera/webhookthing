-- make sure RLS is working on our tables. also tests counter tracking triggers

\set test_name 'RLS is working'
\ir ./testing_constants.sql

BEGIN;
SELECT plan(29);

PREPARE anon_submission_count AS SELECT COUNT(*) FROM submissions WHERE user_id = :'anon_user_id';
PREPARE anon_usage_counter AS SELECT usage_count FROM user_metadata WHERE user_id = :'anon_user_id';

PREPARE user_submission_count AS SELECT COUNT(*) FROM submissions WHERE user_id = :'user_id';
PREPARE user_usage_counter AS SELECT usage_count FROM user_metadata WHERE user_id = :'user_id';

-- clear out any existing test records
SELECT lives_ok($$DELETE FROM submissions WHERE user_id='$$ || :'anon_user_id' || $$'::UUID$$, 'clear table anon');
SELECT row_eq('anon_usage_counter', ROW(0),'anon usage counter is zero');
SELECT row_eq('anon_submission_count', ROW(0::BIGINT),'anon submission count is zero');

SELECT lives_ok($$DELETE FROM submissions WHERE user_id='$$ || :'user_id' || $$'::UUID$$, 'clear table user');
SELECT row_eq('user_usage_counter', ROW(0),'user usage counter is zero');
SELECT row_eq('user_submission_count', ROW(0::BIGINT),'user submission count is zero');

SET client_min_messages=ERROR; -- hush the NOTICE from the login_as_user() call

-- test regular user
CALL auth_login_as_user(:'user_login_email');

-- test operations on user_metadata table

SELECT throws_like('INSERT INTO user_metadata (user_id, is_anonymous) VALUES (gen_random_uuid(), false)', '%violates row-level security policy%', 'insert to metadata fails');

SELECT results_eq('SELECT user_id FROM user_metadata','VALUES (''' || :'user_id' || '''::UUID)', 'only see own metadata');
SELECT is_empty('anon_usage_counter', 'cannot see other user metadata');

SELECT lives_ok('UPDATE user_metadata SET usage_count=42 WHERE user_id = ''' || :'user_id' || '''', 'disallow modify own user metadata row');
SELECT row_eq('user_usage_counter', ROW(0),'user usage counter is unchanged');

SELECT lives_ok('DELETE FROM user_metadata WHERE user_id = ''' || :'user_id' || '''', 'disallow delete own metadata row');
SELECT isnt_empty('user_usage_counter', 'user record still exists');

-- test operations on submissions table

SELECT lives_ok('INSERT INTO submissions (user_id,body_raw) VALUES (''' || :'user_id' || ''',''foo'')', 'user insert as self');
SELECT throws_like('INSERT INTO submissions (user_id,body_raw) VALUES (''' || :'anon_user_id' || ''',''foo'')', '%violates row-level security policy%', 'user insert anon ID should fail');
SELECT throws_like('INSERT INTO submissions (user_id,body_raw) VALUES (gen_random_uuid(),''foo'')', '%violates row-level security policy%', 'user insert random ID should fail');

SELECT row_eq('user_submission_count', ROW(1::BIGINT),'can see own submissions');
SELECT row_eq('user_usage_counter', ROW(1),'user usage counter is incremented'); -- make sure trigger worked

SELECT lives_ok('UPDATE submissions SET body_raw=''bar'' WHERE user_id = ''' || :'user_id' || '''', 'disallow modify own user submission row');
SELECT row_eq('SELECT body_raw FROM submissions WHERE user_id = ''' || :'user_id' || ''' LIMIT 1', ROW('foo'::text), 'submission data is unchanged');

SELECT lives_ok('DELETE FROM submissions WHERE user_id = ''' || :'user_id' || '''', 'delete own submissions');
SELECT row_eq('user_submission_count', ROW(0::BIGINT),'deleted own submission');
SELECT row_eq('user_usage_counter', ROW(0),'user usage counter is decremented'); -- make sure trigger worked

-- restore one record to check if other user can see it
SELECT lives_ok('INSERT INTO submissions (user_id,body_raw) VALUES (''' || :'user_id' || ''',''bar'')', 'user insert as self 2');
SELECT row_eq('user_submission_count', ROW(1::BIGINT),'can see own submissions 2');

CALL auth_logout();

CALL auth_login_as_user_id(:'anon_user_id');
SELECT row_eq('user_submission_count', ROW(0::BIGINT),'cannot see other user records');

SELECT lives_ok('INSERT INTO submissions (user_id,body_raw) VALUES (''' || :'anon_user_id' || ''',''bar'')', 'anon insert as self');
SELECT row_eq('anon_submission_count', ROW(1::BIGINT),'anon can see own submissions');
SELECT row_eq('anon_usage_counter', ROW(1),'anon usege counter is incremented');

SELECT * FROM finish();
ROLLBACK;
