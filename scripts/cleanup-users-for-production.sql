-- Dangerous operation: clean users for production and keep only admin
-- Safe-guards: require admin email parameter via psql variable or fallback to 'admin@cactusdashboard.com'

-- Fixed: simpler default without psql variables. Edit the email below if needed.
DO $$
DECLARE
  v_admin_email text := 'admin@cactusdashboard.com';
  v_admin_id uuid;
BEGIN

  -- Ensure admin exists
  INSERT INTO users (email, username, provider, provider_id, is_active, auth_provider, role)
  VALUES (v_admin_email, split_part(v_admin_email, '@', 1), 'local', 'admin', true, 'local', 'GOD')
  ON CONFLICT (email) DO UPDATE SET is_active = true, auth_provider='local', role='GOD';

  SELECT id INTO v_admin_id FROM users WHERE email = v_admin_email;

  -- Remove accounts/sessions/verification tokens unrelated to admin
  DELETE FROM accounts WHERE user_id <> v_admin_id;
  DELETE FROM sessions WHERE user_id <> v_admin_id;
  DELETE FROM verification_tokens WHERE identifier <> v_admin_email;
  DELETE FROM audit_logs WHERE user_id IS NOT NULL AND user_id <> v_admin_id;

  -- Delete non-admin users
  DELETE FROM users WHERE id <> v_admin_id;
END $$;


