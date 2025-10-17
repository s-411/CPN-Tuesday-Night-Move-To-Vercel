-- Migration: Sync email changes from auth.users to public.users (v2 - simplified)
-- Created: 2025-10-13
-- Purpose: When a user changes their email via Supabase Auth, automatically update public.users.email

-- Function to handle email changes in auth.users
CREATE OR REPLACE FUNCTION handle_user_email_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if the email actually changed
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.users
    SET
      email = NEW.email,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;

-- Create trigger that fires after email update in auth.users
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION handle_user_email_change();
