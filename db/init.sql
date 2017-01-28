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
CREATE TABLE person (
  username CITEXT PRIMARY KEY
, display_name TEXT -- do we even fill this in?
, email CITEXT UNIQUE
, gender TEXT
, age INT
, country TEXT --id to lookup table? - only 200, can use this name as key anyways if you need more information
, password_hash TEXT NOT NULL -- salts are stored with the password
, is_private BOOL NOT NULL DEFAULT FALSE
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
CREATE TABLE facebook_detail (
  facebook_id TEXT PRIMARY KEY
, username CITEXT NOT NULL
, access_token TEXT NOT NULL
, facebook_data TEXT NOT NULL
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
CREATE TABLE reset_code (
  seq SERIAL PRIMARY KEY
, username CITEXT NOT NULL
, reset_code TEXT NOT NULL
, used BOOLEAN NOT NULL DEFAULT FALSE
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
, when_updated TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE wishlist (
  seq SERIAL PRIMARY KEY
, username CITEXT NOT NULL
, post_id UUID NOT NULL
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
, when_updated TIMESTAMP NOT NULL DEFAULT NOW()
);
-- https://blog.codeship.com/unleash-the-power-of-storing-json-in-postgres/
--CREATE TABLE external_auth (
--  auth_id UUID PRIMARY KEY DEFAULT uuid_generate_v1mc()
--, person_id UUID UNIQUE
--, profile TEXT NOT NULL
--, id TEXT NOT NULL
--, displayName TEXT
--, familyName TEXT
--, givenName TEXT
--, middleName TEXT
--, emails JSONB -- array of {value, type}
--, photos JSONB -- array of string links
--, extras JSONB -- anything else that isnt well defined
--, when_added TIMESTAMP NOT NULL DEFAULT NOW()
--, when_updated TIMESTAMP NOT NULL DEFAULT NOW()
--);
CREATE TABLE following (
  seq SERIAL PRIMARY KEY
, username CITEXT NOT NULL
, follow_username CITEXT NOT NULL
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE post (
  post_id UUID PRIMARY KEY DEFAULT uuid_generate_v1mc()
, seq SERIAL
, username CITEXT NOT NULL
, rating INT -- note null means no rating
, wine_type TEXT
, grape_variety TEXT
, country_of_origin TEXT
, region TEXT
, vintage INT -- null means NV or no vintage
, vineyard TEXT
, description TEXT
, visibility TEXT NOT NULL DEFAULT 'public' -- enum public, private
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
, when_updated TIMESTAMP NOT NULL DEFAULT NOW() --not sure if I should give them update permission for now...
);
CREATE TABLE post_image (
  seq SERIAL PRIMARY KEY
, post_id UUID NOT NULL
, image_id UUID NOT NULL
, info TEXT --first second third? - thumbnail size?
, show_order INT NOT NULL -- 1-4
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
, when_updated TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE post_like (
  seq SERIAL PRIMARY KEY
, post_id UUID NOT NULL
, username CITEXT NOT NULL
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
, when_updated TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE post_comment (
  seq SERIAL PRIMARY KEY
, post_id UUID NOT NULL
, username CITEXT NOT NULL
, comment_text TEXT NOT NULL
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
, when_updated TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE post_share (
  seq SERIAL PRIMARY KEY
, post_id UUID NOT NULL
, username CITEXT NOT NULL
, shared_post_id UUID NOT NULL
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
, when_updated TIMESTAMP NOT NULL DEFAULT NOW()
);
--CREATE TABLE config ( -- probably better to use one row, many columns?
--  seq SERIAL PRIMARY KEY
--, key TEXT NOT NULL
--, value TEXT NOT NULL
--);
CREATE TABLE session (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v1mc()
, username CITEXT NOT NULL
, ipaddress TEXT NOT NULL -- need something, plus location?, device identifier?
, os TEXT NOT NULL -- ios, android, maybe web?
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
, when_updated TIMESTAMP NOT NULL DEFAULT NOW()
, when_expire TIMESTAMP -- null means it never expires
);

CREATE TABLE push_notification (
  push_id TEXT PRIMARY KEY
, username CITEXT NOT NULL -- you can only have push notifications if you're signed in
, session_id UUID NOT NULL
, when_added TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Trigger for each table that should have its timestamp updated whenever an update is called
--CREATE TRIGGER person_update_timestamp
--  BEFORE UPDATE ON person
--  FOR EACH ROW EXECUTE PROCEDURE set_updated_timestamp();
DO $$ BEGIN
  EXECUTE (
  SELECT string_agg('
    CREATE TRIGGER update_timestamp
      BEFORE UPDATE ON ' || quote_ident(t) || '
      FOR EACH ROW EXECUTE PROCEDURE set_updated_timestamp();
  ', E'\n')
FROM unnest('{person, person_photo, facebook_detail, image, reset_code, post, post_image, post_like, post_comment, post_share, session, wishlist}'::text[]) t -- list your tables here
  );
END $$;
-- http://dba.stackexchange.com/questions/62033/how-to-reuse-an-update-trigger-for-multiple-tables-in-postgresql

CREATE INDEX log__key ON log (key);
CREATE INDEX log__log_level ON log (log_level);
CREATE INDEX log__when_added ON log (when_added);

CREATE INDEX person__email ON person (email);
CREATE INDEX person__gender ON person (gender);
CREATE INDEX person__age ON person (age);
CREATE INDEX person__country ON person (country);
CREATE INDEX person__is_private ON person (is_private);

CREATE INDEX facebook_detail__username ON facebook_detail (username);

CREATE INDEX wishlist_username ON wishlist (username);
CREATE INDEX wishlist_post_id ON wishlist (post_id);

CREATE INDEX reset_code__username__reset_code__used__when_added ON reset_code (username, reset_code, used, when_added);

CREATE INDEX following__username ON following (username);
CREATE INDEX following__follow_username ON following (follow_username);

CREATE INDEX person_photo__username ON person_photo (username);
CREATE INDEX person_photo__image_id ON person_photo (image_id);

CREATE INDEX post__username ON post (username);
CREATE INDEX post__rating ON post (rating);
CREATE INDEX post__wine_type ON post (wine_type);
CREATE INDEX post__grape_variety ON post (grape_variety);
CREATE INDEX post__country_of_origin ON post (country_of_origin);
CREATE INDEX post__region ON post (region);
CREATE INDEX post__vintage ON post (vintage);
CREATE INDEX post__vineyard ON post (vineyard);
CREATE INDEX post__visibility ON post (visibility);
CREATE INDEX post_image__post_id ON post_image (post_id);
CREATE INDEX post_image__image_id ON post_image (image_id);
CREATE INDEX post_image__info ON post_image (info);
CREATE INDEX post_image__show_order ON post_image (show_order);
CREATE INDEX post_like__post_id ON post_like (post_id);
CREATE INDEX post_like__username ON post_like (username);
CREATE INDEX post_comment__post_id ON post_comment (post_id);
CREATE INDEX post_comment__username ON post_comment (username);
CREATE INDEX post_share__post_id ON post_share (post_id);
CREATE INDEX post_share__username ON post_share (username);
CREATE INDEX post_share__shared_post_id ON post_share (shared_post_id);

CREATE INDEX push_notification__username ON push_notification (username);
CREATE INDEX push_notification__session_id ON push_notification (session_id);

CREATE INDEX session__username ON session (username);

CREATE INDEX person__when_added ON person (when_added);
CREATE INDEX person__when_updated ON person (when_updated);
CREATE INDEX person_photo__when_added ON person_photo (when_added);
CREATE INDEX person_photo__when_updated ON person_photo (when_updated);
CREATE INDEX following__when_added ON following (when_added);
CREATE INDEX facebook_detail__when_added ON facebook_detail (when_added);
CREATE INDEX facebook_detail__when_updated ON facebook_detail (when_updated);
CREATE INDEX image__when_added ON image (when_added);
CREATE INDEX image__when_updated ON image (when_updated);
CREATE INDEX wishlist__when_added ON wishlist (when_added);
CREATE INDEX wishlist__when_updated ON wishlist (when_updated);
CREATE INDEX reset_code__when_added ON reset_code (when_added);
CREATE INDEX reset_code__when_updated ON reset_code (when_updated);
CREATE INDEX post__when_added ON post (when_added);
CREATE INDEX post__when_updated ON post (when_updated);
CREATE INDEX post_image__when_added ON post_image (when_added);
CREATE INDEX post_image__when_updated ON post_image (when_updated);
CREATE INDEX post_like__when_added ON post_like (when_added);
CREATE INDEX post_like__when_updated ON post_like (when_updated);
CREATE INDEX post_comment__when_added ON post_comment (when_added);
CREATE INDEX post_comment__when_updated ON post_comment (when_updated);
CREATE INDEX post_share__when_added ON post_share (when_added);
CREATE INDEX post_share__when_updated ON post_share (when_updated);
CREATE INDEX session__when_added ON session (when_added);
CREATE INDEX session__when_updated ON session (when_updated);
CREATE INDEX session__when_expire ON session (when_expire);
CREATE INDEX push_notification__when_added ON push_notification (when_added);
--CREATE INDEX external_auth__when_added ON external_auth (when_added);
--CREATE INDEX external_auth__when_updated ON external_auth (when_updated);


GRANT INSERT ON log TO regular_user;
GRANT SELECT, INSERT, UPDATE ON person TO regular_user;
GRANT SELECT, INSERT ON person_photo TO regular_user;
GRANT SELECT, INSERT ON facebook_detail TO regular_user;
GRANT SELECT, INSERT ON image TO regular_user;
GRANT SELECT, INSERT, DELETE ON wishlist TO regular_user;
GRANT SELECT, INSERT, UPDATE ON reset_code TO regular_user;
GRANT SELECT, INSERT, DELETE ON following TO regular_user;
GRANT SELECT, INSERT ON post TO regular_user;
GRANT SELECT, INSERT ON post_image TO regular_user;
GRANT SELECT, INSERT, DELETE ON post_like TO regular_user;
GRANT SELECT, INSERT ON post_comment TO regular_user;
GRANT SELECT, INSERT ON post_share TO regular_user;
GRANT SELECT, INSERT ON post_share TO regular_user;
--GRANT SELECT, INSERT ON external_auth TO regular_user;
GRANT SELECT, INSERT, DELETE ON session TO regular_user;
GRANT SELECT, INSERT, DELETE ON push_notification TO regular_user;
-- When you don't want to worry about sequences
GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA public TO regular_user;

GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin_user;

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
