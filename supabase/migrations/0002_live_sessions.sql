-- ThankBrad — schéma "live" pour la synchro multi-appareils.
--
-- Approche : une session = une ligne JSON. Toute la logique de jeu tourne
-- côté client (fonctions pures), et Supabase sert de source de vérité
-- partagée + canal temps réel entre les deux téléphones.
--
-- À COLLER dans Supabase → SQL Editor → New query → Run.

create table if not exists live_sessions (
  code text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Realtime : diffuse chaque changement de ligne aux clients abonnés.
alter publication supabase_realtime add table live_sessions;

-- RLS : on garde simple et sûr pour un MVP.
-- Lecture/écriture d'une session par son code (le code à 6 caractères fait
-- office de secret partagé, comme un lien d'invitation). Personne ne peut
-- lister toutes les sessions sans connaître les codes.
alter table live_sessions enable row level security;

create policy "read by code"
  on live_sessions for select
  using (true);

create policy "insert sessions"
  on live_sessions for insert
  with check (true);

create policy "update sessions"
  on live_sessions for update
  using (true)
  with check (true);

-- Met à jour updated_at automatiquement.
create or replace function touch_live_session()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_live_session on live_sessions;
create trigger trg_touch_live_session
before update on live_sessions
for each row execute function touch_live_session();
