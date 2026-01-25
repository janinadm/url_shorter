-- Migration: Add device_type column to clicks table
-- Run this in Supabase SQL Editor

ALTER TABLE public.clicks 
ADD COLUMN IF NOT EXISTS device_type text 
CHECK (device_type IN ('mobile', 'desktop', 'tablet'));

-- Create index for device_type queries (Pro analytics)
CREATE INDEX IF NOT EXISTS clicks_device_type_idx ON public.clicks(device_type);
