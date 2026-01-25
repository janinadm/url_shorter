-- Migration: Add expires_at to urls table for Free plan link expiration
-- Run this in Supabase SQL Editor

ALTER TABLE public.urls 
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Index for efficient expiration queries
CREATE INDEX IF NOT EXISTS urls_expires_at_idx ON public.urls(expires_at);

-- Comment: null = permanent (Pro), date = expires (Free)
COMMENT ON COLUMN public.urls.expires_at IS 'Null means permanent (Pro). Date means link expires (Free users get 7 days).';
