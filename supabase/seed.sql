-- some authentication helpers for running the permissions tests

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

INSERT INTO auth.users (id, role, email, encrypted_password, created_at, updated_at, is_anonymous)
 VALUES ('a2dc5f10-5123-45ec-bf8c-1076c47681ff', 'authenticated', 'user@spammerdomain.com', crypt('nebula-aid-harry', gen_salt('bf')), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false);
INSERT INTO auth.users (id, role, email, encrypted_password, created_at, updated_at, is_anonymous)
 VALUES ('787981c8-040c-4085-8bda-7be6ac34ba42', 'authenticated', DEFAULT, DEFAULT, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true);
