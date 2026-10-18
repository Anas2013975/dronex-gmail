-- 0001: guilds, login codes, dashboard sessions, rate limits.
CREATE TABLE IF NOT EXISTS guilds (
  guild_id   text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Only HMAC hashes are stored; plaintext codes never touch the database.
CREATE TABLE IF NOT EXISTS login_codes (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code_hash  text NOT NULL UNIQUE,
  user_id    text NOT NULL,
  guild_id   text NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_codes_user_guild_idx ON login_codes (user_id, guild_id);
CREATE INDEX IF NOT EXISTS login_codes_expires_idx ON login_codes (expires_at);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id    text NOT NULL,
  guild_id   text NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS rate_limits (
  key          text PRIMARY KEY,
  count        integer NOT NULL,
  window_start timestamptz NOT NULL
);
