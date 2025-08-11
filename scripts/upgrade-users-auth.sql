-- Upgrade users table to support traditional auth (idempotent)
-- Adds: username, hashed_password, role, manager_id, auth_provider, email_verified
-- Keeps existing data and indexes

DO $$
BEGIN
  -- username
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='username'
  ) THEN
    ALTER TABLE public.users ADD COLUMN username VARCHAR(50);
  END IF;

  -- hashed_password
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='hashed_password'
  ) THEN
    ALTER TABLE public.users ADD COLUMN hashed_password VARCHAR(255);
  END IF;

  -- role
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='role'
  ) THEN
    ALTER TABLE public.users ADD COLUMN role VARCHAR(50) DEFAULT 'ADVISOR';
  END IF;

  -- manager_id (UUID to match existing PK type)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='manager_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN manager_id UUID NULL REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- auth_provider
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='auth_provider'
  ) THEN
    ALTER TABLE public.users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local';
  END IF;

  -- google_id (optional for hybrid auth)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='google_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN google_id VARCHAR(255);
  END IF;

  -- email_verified
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='email_verified'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;

  -- Fill username from email local-part when NULL
  UPDATE public.users SET username = split_part(email, '@', 1)
  WHERE username IS NULL;

  -- Deduplicate usernames by appending numeric suffixes
  CREATE TEMP TABLE _tmp_usernames AS
    SELECT id, username,
           ROW_NUMBER() OVER (PARTITION BY username ORDER BY id) AS rn
    FROM public.users;
  UPDATE public.users u
  SET username = concat(u.username, '_', t.rn-1)
  FROM _tmp_usernames t
  WHERE u.id = t.id AND t.rn > 1;
  DROP TABLE IF EXISTS _tmp_usernames;

  -- Create unique index if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='users_username_key'
  ) THEN
    CREATE UNIQUE INDEX users_username_key ON public.users(username);
  END IF;

  -- Helpful indexes
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_users_role'
  ) THEN
    CREATE INDEX idx_users_role ON public.users(role);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_users_is_active'
  ) THEN
    CREATE INDEX idx_users_is_active ON public.users(is_active);
  END IF;
END $$;


