/*
  # Add Database Webhook for Kit User Signup

  1. Purpose
    - Triggers Kit API when a new user is created
    - Sends user email to Kit with "signed up" tag
    - Stores Kit subscriber ID back in the users table

  2. How it works
    - When a new row is inserted into public.users
    - Supabase sends a webhook to the kit-user-signup Edge Function
    - The function adds the user to Kit and updates the users table

  3. Setup (Manual Step Required)
    - This SQL creates the webhook configuration
    - You must also configure the webhook in Supabase Dashboard:
      Database ’ Webhooks ’ Create a new hook

  4. Webhook Configuration
    - Name: kit-user-signup
    - Table: public.users
    - Events: INSERT
    - Type: supabase_functions.http_request
    - Endpoint: https://[your-project-ref].supabase.co/functions/v1/kit-user-signup

  5. Notes
    - For local development, webhook won't trigger automatically
    - Test manually by calling the Edge Function directly
    - In production, webhook triggers automatically on user signup
*/

-- Note: Database webhooks need to be configured via Supabase Dashboard
-- This file documents the webhook configuration for reference

-- You can also use pg_net extension if available (Supabase Pro)
-- Example using pg_net:
/*
CREATE OR REPLACE FUNCTION notify_kit_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/kit-user-signup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', row_to_json(NEW),
        'old_record', NULL
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS kit_user_signup_webhook ON public.users;
CREATE TRIGGER kit_user_signup_webhook
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_kit_user_signup();
*/

-- For now, we'll document this and set it up via Dashboard
-- The trigger above is commented out because pg_net may not be available

SELECT 'Webhook configuration documented - configure via Supabase Dashboard' AS status;
