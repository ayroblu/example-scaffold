CREATE USER regular_user WITH PASSWORD 'regular_password';
CREATE USER admin_user WITH PASSWORD 'admin_password';

--CREATE EXTENSION pgcrypto;
--SELECT gen_random_uuid()
CREATE EXTENSION "uuid-ossp";
--SELECT uuid_generate_v1mc()
CREATE EXTENSION citext;

CREATE FUNCTION set_updated_timestamp()
  RETURNS TRIGGER
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW.when_updated := now();
  RETURN NEW;
END;
$$;

CREATE TABLE log (
  seq SERIAL PRIMARY KEY
, key TEXT NOT NULL -- some kind of identifier - perhaps just the app that's using it
, log_level TEXT
, log TEXT NOT NULL
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
);
-- https://blog.codeship.com/unleash-the-power-of-storing-json-in-postgres/
CREATE TABLE config ( -- probably better to use one row, many columns?
  seq SERIAL PRIMARY KEY
, key TEXT NOT NULL
, value TEXT NOT NULL
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
, when_updated TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE person (
  username CITEXT PRIMARY KEY
, name TEXT -- do we even fill this in?
, email TEXT --nonunique
, password_hash TEXT NOT NULL -- salts are stored with the password
, is_admin BOOL NOT NULL DEFAULT FALSE
, is_active BOOL NOT NULL DEFAULT TRUE
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
, when_updated TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE person_photo (
  person_photo_id UUID PRIMARY KEY DEFAULT uuid_generate_v1mc()
, seq SERIAL
, username CITEXT NOT NULL
, image_id UUID NOT NULL
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
, when_updated TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE image (
  image_id UUID PRIMARY KEY DEFAULT uuid_generate_v1mc()
, seq SERIAL
, image BYTEA NOT NULL -- get size with octet_length(string)
, name TEXT
, mimetype TEXT -- don't know how to do these, could be null for now
, width INT
, height INT
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
, when_updated TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE session (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v1mc()
, username CITEXT NOT NULL
, ipaddress TEXT NOT NULL -- need something, plus location?, device identifier?
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
, when_updated TIMESTAMP NOT NULL DEFAULT NOW()
, when_expire TIMESTAMP -- null means it never expires
);


-- Trigger for each table that should have its timestamp updated whenever an update is called
DO $$ BEGIN
  EXECUTE (
  SELECT string_agg('
    CREATE TRIGGER update_timestamp
      BEFORE UPDATE ON ' || quote_ident(t) || '
      FOR EACH ROW EXECUTE PROCEDURE set_updated_timestamp();
  ', E'\n')
FROM unnest('{person, person_photo, image, session}'::text[]) t -- list your tables here
  );
END $$;
-- http://dba.stackexchange.com/questions/62033/how-to-reuse-an-update-trigger-for-multiple-tables-in-postgresql

CREATE INDEX log__key ON log (key);
CREATE INDEX log__log_level ON log (log_level);
CREATE INDEX log__when_added ON log (when_added);

CREATE INDEX person__email ON person (email);

CREATE INDEX person_photo__username ON person_photo (username);
CREATE INDEX person_photo__image_id ON person_photo (image_id);

CREATE INDEX session__username ON session (username);

CREATE INDEX person__when_added ON person (when_added);
CREATE INDEX person__when_updated ON person (when_updated);
CREATE INDEX person_photo__when_added ON person_photo (when_added);
CREATE INDEX person_photo__when_updated ON person_photo (when_updated);
CREATE INDEX image__when_added ON image (when_added);
CREATE INDEX image__when_updated ON image (when_updated);
CREATE INDEX session__when_added ON session (when_added);
CREATE INDEX session__when_updated ON session (when_updated);
CREATE INDEX session__when_expire ON session (when_expire);


GRANT INSERT ON log TO regular_user;
GRANT SELECT, INSERT, UPDATE ON person TO regular_user;
GRANT SELECT, INSERT ON person_photo TO regular_user;
GRANT SELECT, INSERT ON image TO regular_user;
GRANT SELECT, INSERT, DELETE ON session TO regular_user;

GRANT SELECT, INSERT, UPDATE ON poi TO regular_user;
GRANT SELECT, INSERT ON poi_schedule TO regular_user;
GRANT SELECT, INSERT, UPDATE ON schedule TO regular_user;

GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_user;

-- How to do permissions properly, if you care enough to get around to this
----ACCESS BD
--REVOKE CONNECT ON DATABASE toast FROM PUBLIC;
--GRANT  CONNECT ON DATABASE toast  TO regular_user;
--
----ACCESS SCHEMA
--REVOKE ALL     ON SCHEMA public FROM PUBLIC;
--GRANT  USAGE   ON SCHEMA public  TO user;
--
----ACCESS TABLES
--REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC ;
--GRANT SELECT                         ON ALL TABLES IN SCHEMA public TO read_only ;
--GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO read_write ;
--GRANT ALL                            ON ALL TABLES IN SCHEMA public TO admin ;

