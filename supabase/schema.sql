-- Supabase Database Schema for LinkSnip URL Shortener
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  plan text default 'free' check (plan in ('free', 'pro', 'enterprise')),
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- URLs table
create table public.urls (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  short_code text unique not null,
  original_url text not null,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Clicks table (analytics)
create table public.clicks (
  id uuid primary key default uuid_generate_v4(),
  url_id uuid references public.urls(id) on delete cascade,
  clicked_at timestamptz default now(),
  device_type text check (device_type in ('mobile', 'desktop', 'tablet')),
  browser text,
  country text,
  referer text,
  user_agent text,
  ip_hash text
);

-- Indexes for performance
create index urls_user_id_idx on public.urls(user_id);
create index urls_short_code_idx on public.urls(short_code);
create index clicks_url_id_idx on public.clicks(url_id);
create index clicks_clicked_at_idx on public.clicks(clicked_at);

-- Row Level Security Policies

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.urls enable row level security;
alter table public.clicks enable row level security;

-- Profiles: Users can only access their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- URLs: Public read for redirects, users manage their own
create policy "Anyone can read URLs for redirect"
  on public.urls for select
  using (true);

create policy "Users can create own URLs"
  on public.urls for insert
  with check (auth.uid() = user_id);

create policy "Users can update own URLs"
  on public.urls for update
  using (auth.uid() = user_id);

create policy "Users can delete own URLs"
  on public.urls for delete
  using (auth.uid() = user_id);

-- Clicks: Anyone can insert (for redirects), only owners can read
create policy "Anyone can insert clicks"
  on public.clicks for insert
  with check (true);

create policy "URL owners can view clicks"
  on public.clicks for select
  using (
    url_id in (
      select id from public.urls where user_id = auth.uid()
    )
  );

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user profile creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to check URL limit before insert
create or replace function public.check_url_limit()
returns trigger as $$
declare
  current_count integer;
  max_limit integer;
  user_plan text;
begin
  -- Get user's plan
  select plan into user_plan from public.profiles where id = new.user_id;
  
  -- Set limit based on plan
  if user_plan = 'free' then
    max_limit := 10;
  elsif user_plan = 'pro' then
    max_limit := 500;
  else
    max_limit := 999999; -- Enterprise = effectively unlimited
  end if;
  
  -- Count existing URLs
  select count(*) into current_count from public.urls where user_id = new.user_id;
  
  if current_count >= max_limit then
    raise exception 'URL limit reached for your plan. Please upgrade.';
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to enforce URL limits
create trigger check_url_limit_before_insert
  before insert on public.urls
  for each row execute procedure public.check_url_limit();
