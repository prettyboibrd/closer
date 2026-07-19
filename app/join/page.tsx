"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Eyebrow, Screen } from "@/components/ui";
import { readSession } from "@/lib/store";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  async function handleContinue() {
    const clean = code.trim().toUpperCase();
    if (clean.length !== 6) {
      setError("Le code contient 6 caractères.");
      return;
    }
    setBusy(true);
    const session = await readSession(clean);
    setBusy(false);
    if (!session) {
      setError("Aucune session avec ce code. Vérifie et réessaie.");
      return;
    }
    if (session.participants.length >= 2) {
      setError("Cette session est déjà complète.");
      return;
    }
    router.push(`/join/${clean}`);
  }

  return (
    <Screen>
      <Link href="/" className="text-sm text-violet/60 hover:text-violet mb-4">
        ← Retour
      </Link>
      <Eyebrow>Rejoindre</Eyebrow>
      <h1 className="font-display text-3xl font-700 text-violet mt-1 mb-6">
        Entre le code
      </h1>

      <Card className="p-6">
        <label htmlFor="code" className="block text-sm font-semibold text-ink mb-2">
          Code à 6 caractères
        </label>
        <input
          id="code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().slice(0, 6));
            setError(null);
          }}
          placeholder="ABC123"
          autoCapitalize="characters"
          className="w-full rounded-xl border border-violet/15 bg-cream px-4 py-4 text-center text-2xl font-display font-700 tracking-[0.4em] text-violet placeholder:text-ink/25 focus:border-violet/40 focus:outline-none"
        />
        {error && (
          <p className="mt-3 text-sm text-pink" role="alert">
            {error}
          </p>
        )}
        <Button full className="mt-5" onClick={handleContinue} disabled={busy}>
          {busy ? "Vérification…" : "Continuer"}
        </Button>
      </Card>
    </Screen>
  );
}
