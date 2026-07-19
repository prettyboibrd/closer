"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Button, Card, Eyebrow, Screen } from "@/components/ui";
import { MODE_LABELS, type Session } from "@/lib/types";
import { uid } from "@/lib/session-logic";
import {
  readSession,
  joinSessionAtomic,
  setMyParticipant,
  getMyParticipant,
} from "@/lib/store";

const AVATARS = ["🐢", "🦋", "🌊", "🔥", "🌙", "🍃", "🎧", "🫐"];
const schema = z.object({
  displayName: z.string().trim().min(1, "Choisis un prénom").max(24),
});

export default function JoinByCodePage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code?.toUpperCase() ?? "";
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"ok" | "missing" | "full">("ok");

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let alive = true;
    readSession(code).then((s) => {
      if (!alive) return;
      setSession(s);
      if (!s) setStatus("missing");
      else if (s.participants.length >= 2 && !getMyParticipant(code))
        setStatus("full");
      else setStatus("ok");
    });
    return () => {
      alive = false;
    };
  }, [code]);

  const [busy, setBusy] = useState(false);

  async function handleJoin() {
    const parsed = schema.safeParse({ displayName: name });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const s = await readSession(code);
    if (!s) {
      setBusy(false);
      setStatus("missing");
      return;
    }
    // Si on a déjà une place dans cette session (ex. l'hôte), on va au salon.
    const existing = getMyParticipant(code);
    if (existing && s.participants.some((p) => p.id === existing)) {
      router.push(`/session/${code}/lobby`);
      return;
    }
    const result = await joinSessionAtomic(
      code,
      { displayName: parsed.data.displayName, avatar },
      (g) => ({
        id: uid("p"),
        displayName: g.displayName,
        avatar: g.avatar,
        isHost: false,
        joinedAt: Date.now(),
        lastSeenAt: Date.now(),
        connected: true,
      })
    );
    if (!result.ok) {
      setBusy(false);
      setStatus(result.reason === "missing" ? "missing" : "full");
      return;
    }
    setMyParticipant(code, result.participantId);
    router.push(`/session/${code}/lobby`);
  }

  if (status === "missing") {
    return (
      <Screen>
        <Card className="p-8 text-center mt-16">
          <div className="text-4xl mb-3">🧭</div>
          <h1 className="font-display text-2xl font-700 text-violet mb-2">
            Code introuvable
          </h1>
          <p className="text-ink/70 mb-5">
            Aucune session ne correspond à « {code} ».
          </p>
          <Link href="/join">
            <Button variant="secondary" full>
              Réessayer
            </Button>
          </Link>
        </Card>
      </Screen>
    );
  }

  if (status === "full") {
    return (
      <Screen>
        <Card className="p-8 text-center mt-16">
          <div className="text-4xl mb-3">🚪</div>
          <h1 className="font-display text-2xl font-700 text-violet mb-2">
            Session complète
          </h1>
          <p className="text-ink/70 mb-5">
            Cette session accueille déjà deux personnes.
          </p>
          <Link href="/">
            <Button variant="secondary" full>
              Retour à l&apos;accueil
            </Button>
          </Link>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Link href="/join" className="text-sm text-violet/60 hover:text-violet mb-4">
        ← Retour
      </Link>
      <Eyebrow>Session {code}</Eyebrow>
      <h1 className="font-display text-3xl font-700 text-violet mt-1 mb-1">
        Tu y es presque
      </h1>
      {session && (
        <p className="text-ink/60 mb-6">
          Contexte : {MODE_LABELS[session.mode]}
        </p>
      )}

      <Card className="p-5">
        <label htmlFor="name" className="block text-sm font-semibold text-ink mb-2">
          Ton prénom ou pseudo
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          maxLength={24}
          placeholder="Comment veux-tu apparaître ?"
          className="w-full rounded-xl border border-violet/15 bg-cream px-4 py-3 text-ink placeholder:text-ink/40 focus:border-violet/40 focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Avatar">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={avatar === a}
              aria-label={`Avatar ${a}`}
              onClick={() => setAvatar(a)}
              className={`h-10 w-10 rounded-xl text-xl grid place-items-center transition ${
                avatar === a
                  ? "bg-violet text-white scale-110"
                  : "bg-cream-deep hover:bg-violet/10"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        {error && (
          <p className="mt-2 text-sm text-pink" role="alert">
            {error}
          </p>
        )}
        <Button full className="mt-5" onClick={handleJoin} disabled={busy}>
          {busy ? "Connexion…" : "Rejoindre"}
        </Button>
      </Card>
    </Screen>
  );
}
