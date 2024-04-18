-- test cascade delete from auth.users

\set test_name 'cascade delete'
\ir ./testing_constants.sql

\set insert_count 5

BEGIN;
SELECT plan(8);

SELECT lives_ok($$DELETE FROM submissions WHERE user_id='$$ || :'anon_user_id' || $$'::UUID$$, 'clear table');
SELECT row_eq($$SELECT usage_count FROM user_metadata WHERE user_id='$$ || :'anon_user_id' || $$'::UUID$$, ROW(0), 'usage count is zero');

INSERT INTO submissions (user_id,body_raw) SELECT :'anon_user_id', g.id::TEXT FROM generate_series(1,:insert_count) AS g(id);

SELECT row_eq($$SELECT usage_count FROM user_metadata WHERE user_id='$$ || :'anon_user_id' || $$'::UUID$$, ROW(:insert_count), 'usage count is correct');
SELECT row_eq($$SELECT count(*) FROM submissions WHERE user_id='$$ || :'anon_user_id' || $$'::UUID$$, ROW(:insert_count::bigint), 'row count is correct');

SELECT lives_ok($$DELETE FROM auth.users where id='$$ || :'anon_user_id' || $$'::UUID$$,'delete them');
SELECT is_empty($$SELECT * FROM auth.users where id='$$ || :'anon_user_id' || $$'::UUID$$,'auth.users record deleted');

SELECT row_eq($$SELECT count(*) FROM submissions WHERE user_id='$$ || :'anon_user_id' || $$'::UUID$$, ROW(0::bigint), 'row count is zero');
SELECT is_empty($$SELECT * FROM user_metadata WHERE user_id='$$ || :'anon_user_id' || $$'::UUID$$, 'metadata record is gone');

SELECT * FROM finish();
ROLLBACK;
