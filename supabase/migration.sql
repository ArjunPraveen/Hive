-- Hive Database Schema
-- Run this in Supabase SQL Editor (supabase.com > SQL Editor > New Query)

-- 1. Families
create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now()
);

alter table families enable row level security;

-- 2. Profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  family_id uuid references families on delete set null,
  display_name text not null,
  avatar_url text,
  role_label text,
  phone text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- 3. Todos
create table todos (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families on delete cascade,
  title text not null,
  description text,
  deadline timestamptz,
  priority int not null default 2,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  created_by uuid not null references profiles on delete cascade,
  assigned_to uuid not null references profiles on delete cascade,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table todos enable row level security;

-- 4. Calendar Events
create table events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families on delete cascade,
  title text not null,
  description text,
  event_date timestamptz not null,
  location text,
  created_by uuid not null references profiles on delete cascade,
  created_at timestamptz not null default now()
);

alter table events enable row level security;

-- ============================================
-- RLS Policies
-- ============================================

-- Profiles: users can read all profiles in their family, update only their own
create policy "Users can view family profiles"
  on profiles for select
  using (family_id in (select family_id from profiles where id = auth.uid()));

create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid());

create policy "Users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

-- Families: members can read their own family, anyone can read (for join flow)
create policy "Anyone can read families"
  on families for select
  using (true);

create policy "Authenticated users can create families"
  on families for insert
  with check (auth.uid() is not null);

-- Todos: family members can CRUD todos in their family
create policy "Family members can view todos"
  on todos for select
  using (family_id in (select family_id from profiles where id = auth.uid()));

create policy "Family members can create todos"
  on todos for insert
  with check (family_id in (select family_id from profiles where id = auth.uid()));

create policy "Family members can update todos"
  on todos for update
  using (family_id in (select family_id from profiles where id = auth.uid()));

create policy "Family members can delete todos"
  on todos for delete
  using (family_id in (select family_id from profiles where id = auth.uid()));

-- Events: family members can CRUD events in their family
create policy "Family members can view events"
  on events for select
  using (family_id in (select family_id from profiles where id = auth.uid()));

create policy "Family members can create events"
  on events for insert
  with check (family_id in (select family_id from profiles where id = auth.uid()));

create policy "Family members can update events"
  on events for update
  using (family_id in (select family_id from profiles where id = auth.uid()));

create policy "Family members can delete events"
  on events for delete
  using (family_id in (select family_id from profiles where id = auth.uid()));

-- ============================================
-- Auto-create profile on signup
-- ============================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'New User'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
