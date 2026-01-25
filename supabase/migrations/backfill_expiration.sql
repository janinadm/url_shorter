-- FORCE Update existing links for Free users to expire after 3 days
-- Run this in Supabase SQL Editor

-- Updates ALL Free user links to 3-day expiration (even if they already have 7 days)
UPDATE public.urls
SET expires_at = created_at + interval '3 days'
WHERE user_id IN (
    SELECT id FROM public.profiles WHERE plan = 'free'
);
