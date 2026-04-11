-- Fix infinite recursion on profiles RLS policy
-- The old policy: profiles SELECT checks profiles → infinite loop

-- Step 1: Create a helper function that bypasses RLS to get user's family_id
create or replace function get_my_family_id()
returns uuid as $$
  select family_id from public.profiles where id = auth.uid()
$$ language sql security definer stable;

-- Step 2: Drop the old recursive policy
drop policy if exists "Users can view family profiles" on profiles;

-- Step 3: Create fixed policies — users can read own profile + family members
create policy "Users can read own profile"
  on profiles for select
  using (id = auth.uid());

create policy "Users can read family profiles"
  on profiles for select
  using (family_id = get_my_family_id());

-- Step 4: Also fix todos and events policies (same issue)
drop policy if exists "Family members can view todos" on todos;
create policy "Family members can view todos"
  on todos for select
  using (family_id = get_my_family_id());

drop policy if exists "Family members can create todos" on todos;
create policy "Family members can create todos"
  on todos for insert
  with check (family_id = get_my_family_id());

drop policy if exists "Family members can update todos" on todos;
create policy "Family members can update todos"
  on todos for update
  using (family_id = get_my_family_id());

drop policy if exists "Family members can delete todos" on todos;
create policy "Family members can delete todos"
  on todos for delete
  using (family_id = get_my_family_id());

drop policy if exists "Family members can view events" on events;
create policy "Family members can view events"
  on events for select
  using (family_id = get_my_family_id());

drop policy if exists "Family members can create events" on events;
create policy "Family members can create events"
  on events for insert
  with check (family_id = get_my_family_id());

drop policy if exists "Family members can update events" on events;
create policy "Family members can update events"
  on events for update
  using (family_id = get_my_family_id());

drop policy if exists "Family members can delete events" on events;
create policy "Family members can delete events"
  on events for delete
  using (family_id = get_my_family_id());
