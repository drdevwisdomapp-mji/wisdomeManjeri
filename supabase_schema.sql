-- =========================================================================
-- WISDOM WEB APPLICATION - SUPABASE SCHEMA & SECURITY POLICIES
-- =========================================================================
-- Copy and run this script in your Supabase SQL Editor (https://supabase.com)
-- =========================================================================

-- Enable uuid-ossp extension
create extension if not exists "uuid-ossp";

-- 1. Create Allowed Admins List Table
create table public.allowed_admins (
  email text primary key check (email = lower(email)),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add initial allowed emails (Replace these with your actual admin emails!)
insert into public.allowed_admins (email) values 
('admin@wisdommanjeri.org'),
('risha@wisdommanjeri.org'), -- Example user email
('wisdommanjeri@gmail.com')
on conflict (email) do nothing;

-- 2. Create Profiles Table (Linked to Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique check (email = lower(email)),
  role text default 'admin' check (role in ('admin', 'superadmin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- 3. Create Events Table
create table public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  description text not null,
  category text not null, -- e.g., 'Class', 'Youth Event', 'Lecture', 'Community'
  image_url text, -- Supabase Storage flyer path (public link or storage bucket key)
  start_date timestamp with time zone not null,
  end_date timestamp with time zone,
  location text not null, -- e.g., 'Wisdom Center', 'Online (Zoom)'
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  form_config jsonb not null, -- custom fields configuration (e.g., [{"id":"q1","label":"Full Name","type":"text","required":true}])
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users
);

-- Enable RLS on Events
alter table public.events enable row level security;

-- 4. Create Registrations Table
create table public.registrations (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events on delete cascade not null,
  form_responses jsonb not null, -- custom responses mapped to question IDs (e.g., {"q1":"Zaid","q2":"Male"})
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Registrations
alter table public.registrations enable row level security;


-- =========================================================================
-- DATABASE TRIGGERS FOR SECURE SIGNUP (ALLOWED ADMINS ONLY)
-- =========================================================================

-- Trigger function that runs after user sign-up in Supabase Auth
create or replace function public.handle_new_user_signup()
returns trigger as $$
begin
  -- Only insert profile record if the lowercased email exists in allowed_admins
  if exists (
    select 1 from public.allowed_admins 
    where email = lower(new.email)
  ) then
    -- Email is approved: create their admin profile record
    insert into public.profiles (id, email, role)
    values (new.id, lower(new.email), 'admin');
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Bind trigger to auth.users AFTER insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_signup();


-- Handle User deletion: Clean up profile if auth user is deleted
create or replace function public.handle_user_deleted()
returns trigger as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$ language plpgsql security definer;

-- Bind deletion trigger AFTER delete
drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.handle_user_deleted();


-- =========================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- 1. Profiles Policies
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Admins can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- 2. Events Policies
create policy "Anyone can view published events"
  on public.events for select
  to public
  using (status = 'published');

create policy "Admins can perform all actions on events"
  on public.events for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'superadmin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'superadmin')
    )
  );

-- 3. Registrations Policies
create policy "Anyone can submit a registration"
  on public.registrations for insert
  to public
  with check (true);

create policy "Admins can view and delete registrations"
  on public.registrations for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'superadmin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'superadmin')
    )
  );


-- =========================================================================
-- SUPABASE STORAGE CONFIGURATION SUGGESTIONS
-- =========================================================================
-- Please create a public storage bucket named 'event-flyers' in Supabase.
-- Configure it with these access rules (or SQL policies):
-- 1. Read: Public access (anyone can view flyers).
-- 2. Write/Delete/Update: Authenticated users only (admins can manage flyers).
-- =========================================================================
