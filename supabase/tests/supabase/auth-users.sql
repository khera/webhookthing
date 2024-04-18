-- validate our debugging and testing authentication functions

\set test_name 'debugging authentication functions'
\ir ./testing_constants.sql

BEGIN;
SELECT plan(32);

SELECT has_column('auth','users','id','id should exist');

SELECT is (current_user, 'postgres', 'role for testing is correct');

SET client_min_messages=ERROR; -- hush the NOTICE from the login_as_user() call

-- make sure we can simulate a user
SELECT lives_ok($$CALL auth_login_as_user('$$ || :'user_login_email' || $$')$$, 'login as user');
SELECT is (:'user_id', auth.uid(), 'logged in as a user');
SELECT is (:'user_login_email', auth.email(), 'logged in user email old function');
SELECT is (:'user_login_email', auth.jwt()->>'email', 'logged in user email');
SELECT is ((auth.jwt()->>'is_anonymous')::BOOLEAN, false, 'logged in user anonymous flag is false');
SELECT is (current_user, 'authenticated', 'verify user role');
SELECT lives_ok('CALL auth_logout()', 'user logout');

-- simulate an anon user
SELECT lives_ok($$CALL auth_login_as_user_id('$$ || :'anon_user_id' || $$'::UUID)$$, 'login as anon user');
SELECT is (:'anon_user_id', auth.uid(), 'logged in as anon user');
SELECT is (NULL, auth.email(), 'anon user email is empty');
SELECT is ((auth.jwt()->>'is_anonymous')::BOOLEAN, true, 'anon user anonymous flag is true');
SELECT is (current_user, 'authenticated', 'anon user verify user role');
SELECT lives_ok('CALL auth_logout()', 'anon user logout');

-- make sure our RLS rules' assumptions of user and access ID are correct

SELECT lives_ok('CALL auth_login_as_anon()', 'login as anon'); -- the API starts as this user
SELECT is (current_user, 'anon');
SELECT is (NULL, auth.uid(), 'anon uid is empty');
SELECT is (NULL, auth.email(), 'anon email is empty');
SELECT is ((auth.jwt()->>'is_anonymous')::BOOLEAN, NULL, 'anon anonymous flag is null');
SELECT lives_ok('CALL auth_logout()', 'anon logout');

SELECT lives_ok('CALL auth_login_as_service_role()', 'login as service_role');
SELECT is (current_user, 'service_role');
SELECT is (NULL, auth.uid(), 'uid is empty for service_role');
SELECT is (NULL, auth.email(), 'service_role email is empty');
SELECT is ((auth.jwt()->>'is_anonymous')::BOOLEAN, NULL, 'service role anonymous flag is null');
SELECT lives_ok('CALL auth_logout()', 'service role logout');

SELECT lives_ok('CALL auth_logout()', 'logout');
SELECT is (current_user, 'postgres', 'verify system role');
SELECT is (NULL, auth.uid(), 'access uuid is empty after logout');
SELECT is (NULL, auth.email(), 'logout email is empty');
SELECT lives_ok('CALL auth_logout()', 'logout');

SELECT * FROM finish();
ROLLBACK;
