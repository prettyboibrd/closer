"use client";

import type { Session } from "./types";
import { getSupabase, supabaseEnabled } from "./supabase";

// Store multi-appareils.
// - Si Supabase est configuré : la source de vérité est la table live_sessions,
//   et la synchro temps réel passe par les canaux Realtime de Supabase.
// - Sinon : repli local (BroadcastChannel + localStorage) pour la démo hors-ligne.

const PREFIX = "thankbrad:session:";
const LEGACY_PREFIX = "closer:session:";
const channelName = "thankbrad-sync";

type Listener = (session: Session | null) => void;

// -------- Cache local (lecture instantanée) --------
const cache = new Map<string, Session>();

// ============================================================
//  MODE SUPABASE
// ============================================================

// Version courante connue par ligne (concurrence optimiste).
const versions = new Map<string, number>();

async function sbRead(code: string): Promise<Session | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("live_sessions")
    .select("data, version")
    .eq("code", code)
    .maybeSingle();
  if (error || !data) return null;
  const session = data.data as Session;
  cache.set(code, session);
  if (typeof data.version === "number") versions.set(code, data.version);
  return session;
}

async function sbInsert(session: Session): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  cache.set(session.code, session);
  versions.set(session.code, 1);
  await sb
    .from("live_sessions")
    .upsert(
      { code: session.code, data: session, version: 1 },
      { onConflict: "code" }
    );
}

// ============================================================
//  MODE LOCAL (repli)
// ============================================================

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined")
    return null;
  return new BroadcastChannel(channelName);
}

function localRead(code: string): Session | null {
  if (typeof window === "undefined") return null;
  const raw =
    window.localStorage.getItem(PREFIX + code) ??
    window.localStorage.getItem(LEGACY_PREFIX + code);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    // Migration douce des anciennes sessions locales Closer.
    if (!window.localStorage.getItem(PREFIX + code)) {
      window.localStorage.setItem(PREFIX + code, raw);
    }
    return session;
  } catch {
    return null;
  }
}

function localWrite(session: Session): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFIX + session.code, JSON.stringify(session));
  cache.set(session.code, session);
  const ch = getChannel();
  ch?.postMessage({ code: session.code });
  ch?.close();
  emitLocal(session.code);
}

const localListeners = new Map<string, Set<Listener>>();
function emitLocal(code: string): void {
  const set = localListeners.get(code);
  if (!set) return;
  const s = cache.get(code) ?? localRead(code);
  set.forEach((l) => l(s));
}

// ============================================================
//  API PUBLIQUE (identique pour les deux modes)
// ============================================================

/** Lecture synchrone depuis le cache (peut être null au tout premier accès). */
export function peekSession(code: string): Session | null {
  return cache.get(code) ?? (supabaseEnabled ? null : localRead(code));
}

/** Lecture asynchrone fiable (Supabase) ou synchrone (local). */
export async function readSession(code: string): Promise<Session | null> {
  if (supabaseEnabled) return sbRead(code);
  return localRead(code);
}

export async function writeSession(session: Session): Promise<void> {
  if (supabaseEnabled) {
    await sbInsert(session);
    return;
  }
  localWrite(session);
}

/**
 * Lit, applique l'updater, réécrit — de façon SÛRE face aux actions simultanées.
 * On utilise la concurrence optimiste : l'écriture n'aboutit que si personne
 * n'a modifié la ligne entre-temps (version inchangée). Sinon on relit la
 * version fraîche et on rejoue l'updater dessus, jusqu'à 5 tentatives. Ainsi
 * deux clics au même instant ne s'écrasent jamais : ils s'enchaînent.
 */
export async function updateSession(
  code: string,
  updater: (s: Session) => Session
): Promise<Session | null> {
  if (!supabaseEnabled) {
    const current = localRead(code);
    if (!current) return null;
    const next = updater(current);
    localWrite(next);
    return next;
  }

  const sb = getSupabase()!;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const current = await sbRead(code); // rafraîchit cache + version
    if (!current) return null;
    const expected = versions.get(code) ?? 0;
    const next = updater(current);

    const { data, error } = await sb
      .from("live_sessions")
      .update({ data: next, version: expected + 1 })
      .eq("code", code)
      .eq("version", expected) // n'écrit QUE si personne n'a modifié depuis
      .select("version")
      .maybeSingle();

    if (!error && data) {
      cache.set(code, next);
      versions.set(code, data.version as number);
      return next;
    }
    // Conflit (quelqu'un a écrit avant nous) : petite pause et on rejoue.
    await new Promise((r) => setTimeout(r, 60 + Math.random() * 90));
  }
  // Échec après plusieurs tentatives : on renvoie l'état serveur courant.
  return sbRead(code);
}

/**
 * Rejoint une session de façon ATOMIQUE et sûre.
 * Re-vérifie la limite de 2 personnes contre l'état serveur frais à chaque
 * tentative, pour qu'une 3ᵉ personne ne puisse jamais se faufiler même si
 * deux personnes tentent de rejoindre au même instant.
 */
export async function joinSessionAtomic(
  code: string,
  guest: { displayName: string; avatar: string },
  makeParticipant: (g: { displayName: string; avatar: string }) => {
    id: string;
    displayName: string;
    avatar: string;
    isHost: boolean;
    joinedAt: number;
    lastSeenAt: number;
    connected: boolean;
  }
): Promise<{ ok: true; participantId: string } | { ok: false; reason: "full" | "missing" }> {
  if (!supabaseEnabled) {
    const current = localRead(code);
    if (!current) return { ok: false, reason: "missing" };
    if (current.participants.length >= 2) return { ok: false, reason: "full" };
    const p = makeParticipant(guest);
    localWrite({ ...current, participants: [...current.participants, p] });
    return { ok: true, participantId: p.id };
  }

  const sb = getSupabase()!;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const current = await sbRead(code);
    if (!current) return { ok: false, reason: "missing" };
    if (current.participants.length >= 2) return { ok: false, reason: "full" };
    const expected = versions.get(code) ?? 0;
    const p = makeParticipant(guest);
    const next = { ...current, participants: [...current.participants, p] };

    const { data, error } = await sb
      .from("live_sessions")
      .update({ data: next, version: expected + 1 })
      .eq("code", code)
      .eq("version", expected)
      .select("version")
      .maybeSingle();

    if (!error && data) {
      cache.set(code, next);
      versions.set(code, data.version as number);
      return { ok: true, participantId: p.id };
    }
    await new Promise((r) => setTimeout(r, 60 + Math.random() * 90));
  }
  return { ok: false, reason: "full" };
}

export function subscribe(code: string, listener: Listener): () => void {
  if (supabaseEnabled) {
    const sb = getSupabase()!;
    // Émission initiale depuis le serveur.
    sbRead(code).then((s) => listener(s));

    const channel = sb
      .channel(`session:${code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_sessions",
          filter: `code=eq.${code}`,
        },
        (payload) => {
          const row = payload.new as { data?: Session; version?: number } | null;
          if (row?.data) {
            cache.set(code, row.data);
            if (typeof row.version === "number") versions.set(code, row.version);
            listener(row.data);
          }
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }

  // ---- Repli local ----
  if (!localListeners.has(code)) localListeners.set(code, new Set());
  localListeners.get(code)!.add(listener);

  const ch = getChannel();
  const onMessage = (ev: MessageEvent) => {
    if (ev.data?.code === code) listener(localRead(code));
  };
  ch?.addEventListener("message", onMessage);

  const onStorage = (ev: StorageEvent) => {
    if (ev.key === PREFIX + code || ev.key === LEGACY_PREFIX + code) {
      listener(localRead(code));
    }
  };
  if (typeof window !== "undefined")
    window.addEventListener("storage", onStorage);

  listener(localRead(code));

  return () => {
    localListeners.get(code)?.delete(listener);
    ch?.removeEventListener("message", onMessage);
    ch?.close();
    if (typeof window !== "undefined")
      window.removeEventListener("storage", onStorage);
  };
}

// -------- Identité anonyme du navigateur --------
const IDENTITY_KEY = "thankbrad:identity";
const LEGACY_IDENTITY_KEY = "closer:identity";
export function getIdentity(): string {
  if (typeof window === "undefined") return "server";
  let id =
    window.localStorage.getItem(IDENTITY_KEY) ??
    window.localStorage.getItem(LEGACY_IDENTITY_KEY);
  if (!id) {
    id = "anon_" + Math.random().toString(36).slice(2, 12);
  }
  window.localStorage.setItem(IDENTITY_KEY, id);
  return id;
}

// -------- Quel participant ce navigateur contrôle (par code) --------
export function setMyParticipant(code: string, participantId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`thankbrad:me:${code}`, participantId);
}
export function getMyParticipant(code: string): string | null {
  if (typeof window === "undefined") return null;
  const participantId =
    window.localStorage.getItem(`thankbrad:me:${code}`) ??
    window.localStorage.getItem(`closer:me:${code}`);
  if (participantId) {
    window.localStorage.setItem(`thankbrad:me:${code}`, participantId);
  }
  return participantId;
}
