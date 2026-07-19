-- ThankBrad — schéma Supabase de référence
-- (La build de démo n'en a PAS besoin : elle simule le temps réel côté client.
--  Ce fichier documente le modèle de données décrit dans le cahier des charges
--  pour un branchement Supabase ultérieur.)

-- ------- ENUMS -------
create type session_status as enum ('lobby', 'playing', 'ended');

-- ------- TABLES -------
create table sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status session_status not null default 'lobby',
  mode text not null,
  duration_minutes integer,
  current_level integer not null default 2,
  connection_points integer not null default 0,
  current_activity_id uuid,
  host_id uuid not null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  anonymous_user_id uuid not null,
  display_name text not null,
  avatar text not null default '🙂',
  is_host boolean not null default false,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  prompt text not null,
  category text not null,
  depth_level integer not null,
  duration_seconds integer,
  options jsonb,
  tags jsonb not null default '[]'::jsonb,
  active boolean not null default true
);

create table session_activities (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  activity_id uuid not null references activities(id),
  position integer not null,
  status text not null default 'active',
  skipped boolean not null default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table responses (
  id uuid primary key default gen_random_uuid(),
  session_activity_id uuid not null references session_activities(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  text_response text,
  option_response jsonb,
  submitted_at timestamptz not null default now(),
  unique (session_activity_id, participant_id)
);

create table reactions (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references responses(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now()
);

create table level_consents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  requested_level integer not null,
  accepted boolean not null,
  created_at timestamptz not null default now()
);

-- ------- INDICES -------
create index on participants (session_id);
create index on session_activities (session_id);
create index on responses (session_activity_id);

-- ------- MAX 2 PARTICIPANTS -------
-- Empêche une 3ᵉ personne de rejoindre une session.
create or replace function enforce_two_participants()
returns trigger as $$
begin
  if (select count(*) from participants where session_id = new.session_id) >= 2 then
    raise exception 'La session est déjà complète (2 participants maximum).';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_two_participants
before insert on participants
for each row execute function enforce_two_participants();

-- ------- HELPERS RLS -------
-- Un participant "appartient" à une session si son anonymous_user_id
-- correspond à l'utilisateur authentifié (auth anonyme Supabase).
create or replace function is_member_of(sess uuid)
returns boolean as $$
  select exists (
    select 1 from participants p
    where p.session_id = sess
      and p.anonymous_user_id = auth.uid()
  );
$$ language sql stable security definer;

-- ------- ROW LEVEL SECURITY -------
alter table sessions enable row level security;
alter table participants enable row level security;
alter table session_activities enable row level security;
alter table responses enable row level security;
alter table reactions enable row level security;
alter table level_consents enable row level security;
alter table activities enable row level security;

-- Le catalogue d'activités est lisible par tous (public).
create policy "activities readable" on activities
  for select using (active = true);

-- On peut lire une session par code (nécessaire pour rejoindre)…
create policy "sessions readable by code" on sessions
  for select using (true);

-- …mais seul un membre peut la modifier.
create policy "sessions writable by member" on sessions
  for update using (is_member_of(id));

-- Participants : visibles uniquement aux membres de la même session.
create policy "participants visible to members" on participants
  for select using (is_member_of(session_id));
create policy "participants self insert" on participants
  for insert with check (anonymous_user_id = auth.uid());

-- Session activities : réservées aux membres.
create policy "session_activities members" on session_activities
  for all using (is_member_of(session_id)) with check (is_member_of(session_id));

-- Réponses : un membre peut insérer la sienne ; la LECTURE des réponses
-- de l'autre n'est autorisée qu'une fois que les DEUX ont répondu.
create policy "responses insert own" on responses
  for insert with check (
    participant_id in (
      select id from participants
      where anonymous_user_id = auth.uid()
    )
  );

create policy "responses read after both answered" on responses
  for select using (
    -- ma propre réponse est toujours lisible
    participant_id in (
      select id from participants where anonymous_user_id = auth.uid()
    )
    or
    -- la réponse de l'autre uniquement si le nombre de réponses
    -- atteint le nombre de participants de la session
    (
      select count(*) from responses r2
      where r2.session_activity_id = responses.session_activity_id
    ) >= (
      select count(*) from participants p
      join session_activities sa on sa.session_id = p.session_id
      where sa.id = responses.session_activity_id
    )
  );

-- Réactions & consentements : réservés aux membres.
create policy "reactions members" on reactions
  for all using (
    exists (
      select 1 from responses r
      join session_activities sa on sa.id = r.session_activity_id
      where r.id = reactions.response_id and is_member_of(sa.session_id)
    )
  ) with check (true);

create policy "level_consents members" on level_consents
  for all using (is_member_of(session_id)) with check (is_member_of(session_id));
