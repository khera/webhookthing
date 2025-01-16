-- hide the auto-generated API schema at the /rest/v1/ endpoint
CREATE OR REPLACE FUNCTION pg_rest_root() RETURNS JSON AS $_$
DECLARE
    openapi JSON = $${"swagger": "2.0","info":{"title":"Private API","description":"This is not a public API. Stop snooping."}}$$;
BEGIN
  RETURN openapi;
END
$_$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE SET search_path = '';

COMMENT ON FUNCTION pg_rest_root() IS 'Hide the OpenAPI schema for the /rest/v1/ endpoint.';

ALTER ROLE authenticator SET pgrst.db_root_spec = 'public.pg_rest_root';
NOTIFY pgrst, 'reload config';

-- remove the graphql extension since we don't use it and it exposes more API details
DROP EXTENSION IF EXISTS pg_graphql;
