-- Function to safely claim/delete an expired alias
-- Run this in Supabase SQL Editor

create or replace function public.claim_expired_alias(target_short_code text)
returns boolean
language plpgsql
security definer -- Runs with admin privileges to delete others' expired links
as $$
declare
  target_id uuid;
  target_expires_at timestamptz;
begin
  -- Find the link
  select id, expires_at into target_id, target_expires_at
  from public.urls
  where short_code = target_short_code;

  -- If not found, nothing to do (return true -> safe to proceed)
  if target_id is null then
    return true;
  end if;

  -- Check if expired
  if target_expires_at is null or target_expires_at > now() then
    -- It is NOT expired (or permanent) -> Cannot claim
    return false;
  end if;

  -- It IS expired -> Delete it to free up the alias
  delete from public.urls where id = target_id;
  return true;
end;
$$;
