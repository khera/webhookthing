-- To avoid errors of running too many tests, each test must set the variable
-- named `test_name` before including this file so this file doesn't run actual tests.
-- this file cannot just exist with no tests, so we do these gymnastics.

\set user_login_email 'user@spammerdomain.com'
SELECT id FROM auth.users WHERE email = :'user_login_email' \gset user_

\set anon_user_id '787981c8-040c-4085-8bda-7be6ac34ba42'

-- table constraint limits the max number of records
\set anon_record_limit 10
\set user_record_limit 1000

\if :{?test_name}
-- nothing. cannot figure out how to negate a test. :shrug:
\else
-- this is running stand-alone, so make sure the ID's line up.
BEGIN;
SELECT plan(1);
SELECT isnt (:'user_id', NULL::UUID, 'user_id is not empty'); -- this is always true because the \gset will fail the whole script if it is missing
SELECT * from finish();
ROLLBACK;
\endif
