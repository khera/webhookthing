-- ensure anonymous user has record limit and regular user does not

\set test_name 'record limits'
\ir ./testing_constants.sql

BEGIN;
SELECT plan(18);

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

-- test anon user limit
CALL auth_login_as_user_id(:'anon_user_id');

INSERT INTO submissions (user_id,body_raw) SELECT :'anon_user_id', g.id::TEXT FROM generate_series(1,:anon_record_limit) AS g(id);
SELECT row_eq('anon_usage_counter', ROW(:anon_record_limit),'anon usage counter is maxed');
SELECT row_eq('anon_submission_count', ROW((:anon_record_limit)::BIGINT),'anon submission count is maxed');
SELECT throws_like('INSERT INTO submissions (user_id,body_raw) VALUES (''' || :'anon_user_id' || ''',''kaboom'')', '%violates check constraint "user_metadata_usage_count_check"%', 'anon insert over limit');
SELECT row_eq('anon_usage_counter', ROW(:anon_record_limit),'anon usage counter is still maxed');

SELECT lives_ok('DELETE FROM submissions WHERE user_id = ''' || :'anon_user_id' || '''', 'delete own submissions to make room again');
SELECT row_eq('anon_submission_count', ROW(0::BIGINT),'deleted own submission');
SELECT row_eq('anon_usage_counter', ROW(0),'usage counter is decremented'); -- make sure trigger worked
SELECT lives_ok('INSERT INTO submissions (user_id,body_raw) VALUES (''' || :'anon_user_id' || ''',''kaboom'')', 'anon can insert again');

CALL auth_logout();

-- test regular user limit (currently none)
CALL auth_login_as_user(:'user_login_email');

INSERT INTO submissions (user_id,body_raw) SELECT :'user_id', g.id::TEXT FROM generate_series(1,:user_record_limit) AS g(id);
SELECT row_eq('user_usage_counter', ROW(:user_record_limit),'user usage counter is maxed');
SELECT row_eq('user_submission_count', ROW((:user_record_limit)::BIGINT),'user submission count is maxed');
--SELECT throws_like('INSERT INTO submissions (user_id,body_raw) VALUES (''' || :'user_id' || ''',''kaboom'')', '%violates check constraint "user_metadata_usage_count_check"%', 'anon insert over limit');
SELECT lives_ok('INSERT INTO submissions (user_id,body_raw) VALUES (''' || :'user_id' || ''',''kaboom'')', 'user has no limit');
SELECT row_eq('user_usage_counter', ROW(:user_record_limit + 1),'user usage counter is correct');

SELECT * FROM finish();
ROLLBACK;
