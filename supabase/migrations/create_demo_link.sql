-- Migration: Allow anonymous demo links with 30-min expiration
-- Run this in Supabase SQL Editor

-- 1. Allow URLs without a user (anonymous/demo links)
ALTER TABLE public.urls ALTER COLUMN user_id DROP NOT NULL;

-- 2. Function to create a demo link
create or replace function public.create_demo_link(
  target_url text
)
returns text
language plpgsql
security definer
as $$
declare
  new_code text;
  done bool := false;
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
begin
  -- Simple random code generation loop (max 5 retries to avoid infinite loops)
  for counter in 1..5 loop
    -- Generate 6-char code
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    
    begin
      -- Try insertion (30 min expiration, no user_id)
      insert into public.urls (original_url, short_code, expires_at)
      values (target_url, new_code, now() + interval '30 minutes');
      
      -- If successful, exit loop
      done := true;
      exit;
    exception when unique_violation then
      -- Code taken, retry
    end;
  end loop;

  if not done then
    raise exception 'Failed to generate unique code for demo link';
  end if;
  
  return new_code;
end;
$$;
