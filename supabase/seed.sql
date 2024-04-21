-- some authentication helpers for running the permissions tests
-- these only work within a transaction.

CREATE OR REPLACE PROCEDURE auth_login_as_user_id(user_id UUID)
    LANGUAGE plpgsql
    AS $$
DECLARE
    auth_user auth.users;
BEGIN
    SELECT * INTO auth_user FROM auth.users WHERE id = user_id;
    PERFORM set_config('request.jwt.claims', json_build_object(
                'sub', (auth_user).id::text,
                'role', (auth_user).ROLE,
                'email', (auth_user).email,
                'is_anonymous', (auth_user).is_anonymous,
                'user_metadata', (auth_user).raw_user_meta_data,
                'app_metadata', (auth_user).raw_app_meta_data
            )::text, true);
    PERFORM set_config('role', (auth_user).ROLE, true);
    RAISE NOTICE '%', format( 'Set role %I and logging in as %L (%L)', (auth_user).ROLE, (auth_user).id, (auth_user).email);
END;
$$;

CREATE OR REPLACE PROCEDURE auth_login_as_user(user_email text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    CALL auth_login_as_user_id(user_id);
END;
$$;

CREATE OR REPLACE PROCEDURE auth_login_as_anon()
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', null, true);
    PERFORM set_config('role', 'anon', true);
END;
$$;

CREATE OR REPLACE PROCEDURE auth_login_as_service_role()
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', null, true);
    PERFORM set_config('role', 'service_role', true);
END;
$$;

CREATE OR REPLACE PROCEDURE auth_logout ()
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', null, true);
    PERFORM set_config('role', 'postgres', true);
END;
$$;

---

-- seed a regular user and an anonymous user for tests

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) 
 VALUES ('00000000-0000-0000-0000-000000000000', 'a2dc5f10-5123-45ec-bf8c-1076c47681ff', 'authenticated', 'authenticated', 'user@spammerdomain.com', crypt('nebula-aid-harry', gen_salt('bf')), CURRENT_TIMESTAMP, NULL, '', NULL, '', NULL, '', '', NULL, CURRENT_TIMESTAMP, '{"provider": "email", "providers": ["email"]}', '{}', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);

INSERT INTO auth.users (id, role, email, encrypted_password, created_at, updated_at, is_anonymous)
 VALUES ('787981c8-040c-4085-8bda-7be6ac34ba42', 'authenticated', DEFAULT, DEFAULT, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true);
