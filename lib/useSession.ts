"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Session } from "./types";
import { subscribe, updateSession, getMyParticipant } from "./store";
import { heartbeat } from "./session-logic";

export function useSession(code: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const statusRef = useRef<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribe(code, (s) => {
      setSession(s);
      statusRef.current = s?.status ?? null;
      setLoading(false);
    });
    const t = setTimeout(() => setLoading(false), 2500);
    return () => {
      clearTimeout(t);
      unsub();
    };
  }, [code]);

  const mutate = useCallback(
    (updater: (s: Session) => Session) => updateSession(code, updater),
    [code]
  );

  const myId = getMyParticipant(code);

  // Battement de cœur : signale régulièrement "je suis là" tant que la
  // session est en cours, pour que le partenaire voie notre présence.
  useEffect(() => {
    if (!myId) return;
    let stopped = false;

    const beat = () => {
      if (stopped) return;
      if (statusRef.current === "ended") return;
      updateSession(code, (s) => heartbeat(s, myId));
    };

    beat();
    const iv = setInterval(beat, 5000);

    // Détecte la perte/retour de réseau du navigateur.
    const onOnline = () => {
      setOnline(true);
      beat();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Battement immédiat quand l'onglet redevient visible.
    const onVisible = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      clearInterval(iv);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [code, myId]);

  return { session, loading, mutate, myId, online };
}
