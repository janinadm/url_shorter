-- Migration: Enforce single session per user
-- When a user logs in on a new device, all other sessions are terminated

-- Create a function that deletes all sessions for the current user except the most recent one
CREATE OR REPLACE FUNCTION public.enforce_single_session()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  latest_session_id uuid;
BEGIN
  -- Get the most recent session for this user (the one that just logged in)
  SELECT id INTO latest_session_id
  FROM auth.sessions
  WHERE user_id = current_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Delete all other sessions for this user
  DELETE FROM auth.sessions
  WHERE user_id = current_user_id
  AND id != latest_session_id;
  
  -- Also clean up the refresh tokens for those sessions
  -- Note: explicit casting added to handle potential schema differences where session_id might be varchar
  DELETE FROM auth.refresh_tokens
  WHERE user_id::text = current_user_id::text
  AND session_id::text != latest_session_id::text;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.enforce_single_session() TO authenticated;
