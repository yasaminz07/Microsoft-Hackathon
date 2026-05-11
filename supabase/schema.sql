-- Intern Buddy — Supabase schema
-- Run this in the Supabase SQL editor.
-- Requires Supabase Auth to be enabled (it is on by default).

create table if not exists profile (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null unique,
  name        text        not null,
  company     text        not null,
  role        text        not null,
  start_date  date        not null,
  end_date    date        not null,
  roadmap     jsonb,
  created_at  timestamptz default now()
);

create table if not exists logs (
  id          uuid        default gen_random_uuid() primary key,
  profile_id  uuid        references profile(id) on delete cascade,
  content     text        not null,
  tags        text[]      default '{}',
  week_number int         not null,
  created_at  timestamptz default now()
);

create table if not exists digests (
  id             uuid        default gen_random_uuid() primary key,
  profile_id     uuid        references profile(id) on delete cascade,
  week_number    int         not null,
  pattern        text        not null,
  blind_spot     text        not null,
  action         text        not null,
  return_signal  text        not null,
  created_at     timestamptz default now()
);

create table if not exists milestones (
  id          uuid        default gen_random_uuid() primary key,
  profile_id  uuid        references profile(id) on delete cascade,
  week_number int         not null,
  title       text        not null,
  description text        not null,
  status      text        not null default 'pending',
  created_at  timestamptz default now()
);

-- Row Level Security
-- Each authenticated user can only access their own data.

alter table profile    enable row level security;
alter table logs       enable row level security;
alter table digests    enable row level security;
alter table milestones enable row level security;

-- Profile: owned by the matching auth user
create policy "profile_owner" on profile
  for all using (auth.uid() = user_id);

-- Child tables: owned by whoever owns the parent profile
create policy "logs_owner" on logs
  for all using (
    exists (select 1 from profile where profile.id = logs.profile_id and profile.user_id = auth.uid())
  );

create policy "digests_owner" on digests
  for all using (
    exists (select 1 from profile where profile.id = digests.profile_id and profile.user_id = auth.uid())
  );

create policy "milestones_owner" on milestones
  for all using (
    exists (select 1 from profile where profile.id = milestones.profile_id and profile.user_id = auth.uid())
  );
