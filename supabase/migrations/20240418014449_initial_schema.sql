CREATE TABLE user_metadata (
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_anonymous BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_metadata_usage_count_positive" CHECK (usage_count >= 0), -- never < 0
    -- limit use of anonymous users. regular users can have unlimited use
    CONSTRAINT "user_metadata_usage_count_limits" CHECK (CASE WHEN is_anonymous THEN usage_count <= 10 ELSE usage_count <= 1000 END),
    PRIMARY KEY (user_id)
);
COMMENT ON TABLE user_metadata IS 'Tracks and enforces usage count of submissions';

ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- only grant we need is to view; all insert/updates/deletes are done by the system triggers
CREATE POLICY "view own metadata" ON user_metadata
    FOR SELECT TO authenticated USING ( (SELECT auth.uid()) = user_id );

CREATE FUNCTION create_metadata_for_new_user() RETURNS TRIGGER AS
    $$
    BEGIN
        INSERT INTO user_metadata (user_id, is_anonymous) VALUES (NEW.id, NEW.is_anonymous);
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_profile_on_signup AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_metadata_for_new_user();

--
-- where we store the data
--

CREATE EXTENSION pg_hashids WITH SCHEMA extensions;

-- Store the request data with some basic info pulled out into the table itself for convenience in searching
-- SELECT id_encode(1028, '6c444d3a-d760-4111-81ce-801b6d9ca19a', 10) -> 'Wj2p12zNG6'
-- SELECT id_decode('Wj2p12zNG6','6c444d3a-d760-4111-81ce-801b6d9ca19a',10) -> 1028

CREATE TABLE submissions (
    -- submission identifying information
    submission_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id TEXT GENERATED ALWAYS AS (extensions.id_encode(submission_id,'6c444d3a-d760-4111-81ce-801b6d9ca19a',10)) STORED UNIQUE NOT NULL,  -- randomly generated UUID as salt
    user_id UUID NOT NULL REFERENCES user_metadata (user_id) ON DELETE CASCADE,
    -- request data
    http_method TEXT NOT NULL DEFAULT 'GET',
    query_string TEXT,
    headers JSONB NOT NULL DEFAULT '{}',
    body_raw TEXT,
    remote_ip INET NOT NULL DEFAULT '0.0.0.0',
    submission_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE submissions IS 'Web hook submissions data';

CREATE INDEX submissions_user_id ON submissions USING btree (user_id);

-- enable realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;

CREATE FUNCTION increment_submission_count() RETURNS TRIGGER AS $$
    BEGIN
        UPDATE user_metadata SET usage_count = usage_count + 1 WHERE user_id=NEW.user_id;
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE FUNCTION decrement_submission_count() RETURNS TRIGGER AS $$
    BEGIN
        UPDATE user_metadata SET usage_count = usage_count - 1 WHERE user_id=OLD.user_id;
        RETURN NULL;
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER submission_insert BEFORE INSERT ON submissions
    FOR EACH ROW EXECUTE FUNCTION increment_submission_count();

CREATE TRIGGER submission_delete AFTER DELETE ON submissions
    FOR EACH ROW EXECUTE FUNCTION decrement_submission_count();

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY
  "view own data"
  ON submissions
  FOR SELECT TO authenticated
  USING ( (SELECT auth.uid()) = user_id );

CREATE POLICY
  "delete own data"
  ON submissions
  FOR DELETE TO authenticated
  USING ( (SELECT auth.uid()) = user_id );

CREATE POLICY
  "insert own data"
  ON submissions
  FOR INSERT TO authenticated
  WITH CHECK ( auth.uid() = user_id );
