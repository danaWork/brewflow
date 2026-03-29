-- INSTRUCTIONS (do not paste this line alone into Neon):
-- Open this file in your editor, select ONLY the SQL from CREATE SCHEMA through the INSERT,
-- copy that block, and paste it into Neon SQL Editor. Do NOT paste the file path
-- "scripts/sql/..." into Neon - that causes: syntax error at or near "scripts".

CREATE SCHEMA IF NOT EXISTS drizzle;

CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint NOT NULL
);

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT
  '8a1deef9c7a01ba3f3dbee6091f87cacd041d46ad1e956c3e5372707807defab',
  1774199073410
WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations);
