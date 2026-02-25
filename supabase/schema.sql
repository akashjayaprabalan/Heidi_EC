-- Demo-only snapshot table for the Kinetic prototype.
-- This stores the entire UI state as JSON so the app can persist across reloads.

create table if not exists public.app_snapshots (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_snapshots enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_snapshots'
      and policyname = 'Public read app snapshots'
  ) then
    create policy "Public read app snapshots"
      on public.app_snapshots
      for select
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_snapshots'
      and policyname = 'Public insert app snapshots'
  ) then
    create policy "Public insert app snapshots"
      on public.app_snapshots
      for insert
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_snapshots'
      and policyname = 'Public update app snapshots'
  ) then
    create policy "Public update app snapshots"
      on public.app_snapshots
      for update
      using (true)
      with check (true);
  end if;
end $$;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.app_snapshots to anon, authenticated;
