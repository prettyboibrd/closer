"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Button, Card, Eyebrow, Screen } from "@/components/ui";
import {
  GUIDE_MODE_DESCRIPTIONS,
  GUIDE_MODE_LABELS,
  MODE_LABELS,
  type GuideMode,
  type IntensityLevel,
  type SessionMode,
  type Topic,
} from "@/lib/types";
import { createSession } from "@/lib/session-logic";
import { getIdentity, setMyParticipant, writeSession } from "@/lib/store";
import {
  TopicConfigurator,
  recommendedTopicConfiguration,
} from "@/components/TopicConfigurator";

const AVATARS = ["🦊", "🐬", "🦉", "🌿", "🎈", "🪐", "🍯", "🦩"];
const DURATIONS: { label: string; value: number | null }[] = [
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "Sans limite", value: null },
];
const schema = z.object({
  displayName: z.string().trim().min(1, "Choisis un prénom").max(24),
});

export default function CreatePage() {
  const router = useRouter();
  const initialConfig = recommendedTopicConfiguration("first_date");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [mode, setMode] = useState<SessionMode>("first_date");
  const [duration, setDuration] = useState<number | null>(15);
  const [guideMode, setGuideMode] = useState<GuideMode>("brad");
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>(
    initialConfig.selectedTopics
  );
  const [intensityByTopic, setIntensityByTopic] = useState<
    Partial<Record<Topic, IntensityLevel>>
  >(initialConfig.intensityByTopic);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function applyRecommended(nextMode: SessionMode = mode) {
    const recommended = recommendedTopicConfiguration(nextMode);
    setSelectedTopics(recommended.selectedTopics);
    setIntensityByTopic(recommended.intensityByTopic);
  }

  function selectMode(nextMode: SessionMode) {
    setMode(nextMode);
    applyRecommended(nextMode);
  }

  async function handleCreate() {
    const parsed = schema.safeParse({ displayName: name });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (selectedTopics.length === 0) {
      setError("Choisis au moins un sujet.");
      return;
    }

    setBusy(true);
    const session = createSession(
      mode,
      duration,
      {
        anonymousUserId: getIdentity(),
        displayName: parsed.data.displayName,
        avatar,
      },
      guideMode,
      { selectedTopics, intensityByTopic }
    );
    try {
      await writeSession(session);
      setMyParticipant(session.code, session.hostId);
      router.push(`/session/${session.code}/lobby`);
    } catch {
      setBusy(false);
      setError("Connexion au serveur impossible. Réessaie.");
    }
  }

  return (
    <Screen>
      <Link href="/" className="mb-4 text-sm text-violet/60 hover:text-violet">
        ← Retour
      </Link>
      <Eyebrow>Nouvelle session</Eyebrow>
      <h1 className="mb-6 mt-1 font-display text-3xl font-700 text-violet">
        Préparons votre conversation
      </h1>

      <div className="space-y-5">
        <Card className="p-5">
          <label htmlFor="name" className="mb-2 block text-sm font-semibold text-ink">
            Ton prénom ou pseudo
          </label>
          <input
            id="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            maxLength={24}
            placeholder="Comment veux-tu apparaître ?"
            className="w-full rounded-xl border border-violet/15 bg-cream px-4 py-3 text-ink placeholder:text-ink/40 focus:border-violet/40 focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Avatar">
            {AVATARS.map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="radio"
                aria-checked={avatar === candidate}
                aria-label={`Avatar ${candidate}`}
                onClick={() => setAvatar(candidate)}
                className={`grid h-10 w-10 place-items-center rounded-xl text-xl transition ${
                  avatar === candidate
                    ? "scale-110 bg-violet text-white"
                    : "bg-cream-deep hover:bg-violet/10"
                }`}
              >
                {candidate}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <span className="mb-3 block text-sm font-semibold text-ink">
            Quel est le contexte ?
          </span>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Contexte">
            {(Object.keys(MODE_LABELS) as SessionMode[]).map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="radio"
                aria-checked={mode === candidate}
                onClick={() => selectMode(candidate)}
                className={`rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  mode === candidate
                    ? "aurora text-white"
                    : "bg-cream-deep text-ink hover:bg-violet/10"
                }`}
              >
                {MODE_LABELS[candidate]}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink/50">
            Le contexte influence réellement les formulations : Brad ne parlera pas à des amis comme à un couple, ni à un premier rendez-vous comme à une relation installée.
          </p>
        </Card>

        <Card className="p-5">
          <TopicConfigurator
            mode={mode}
            selectedTopics={selectedTopics}
            intensityByTopic={intensityByTopic}
            onSelectedTopicsChange={setSelectedTopics}
            onIntensityChange={(topic, level) =>
              setIntensityByTopic((current) => ({ ...current, [topic]: level }))
            }
            onUseRecommended={() => applyRecommended()}
          />
        </Card>

        <Card className="p-5">
          <span className="mb-1 block text-sm font-semibold text-ink">
            Qui choisit la suite ?
          </span>
          <p className="mb-3 text-sm text-ink/55">
            Les deux modes respectent le contexte, les sujets et les intensités.
          </p>
          <div className="grid gap-2" role="radiogroup" aria-label="Mode de sélection">
            {(["brad", "classic"] as GuideMode[]).map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="radio"
                aria-checked={guideMode === candidate}
                onClick={() => setGuideMode(candidate)}
                className={`rounded-2xl px-4 py-4 text-left transition ${
                  guideMode === candidate
                    ? "aurora text-white"
                    : "bg-cream-deep text-ink hover:bg-violet/10"
                }`}
              >
                <span className="block font-semibold">
                  {candidate === "brad" ? "✨ " : "🎲 "}
                  {GUIDE_MODE_LABELS[candidate]}
                </span>
                <span
                  className={`mt-1 block text-xs leading-relaxed ${
                    guideMode === candidate ? "text-white/80" : "text-ink/55"
                  }`}
                >
                  {GUIDE_MODE_DESCRIPTIONS[candidate]}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <span className="mb-3 block text-sm font-semibold text-ink">
            Combien de temps ?
          </span>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Durée">
            {DURATIONS.map((candidate) => (
              <button
                key={candidate.label}
                type="button"
                role="radio"
                aria-checked={duration === candidate.value}
                onClick={() => setDuration(candidate.value)}
                className={`rounded-xl px-3 py-3 text-sm font-medium transition ${
                  duration === candidate.value
                    ? "aurora text-white"
                    : "bg-cream-deep text-ink hover:bg-violet/10"
                }`}
              >
                {candidate.label}
              </button>
            ))}
          </div>
        </Card>

        {error && (
          <p className="text-center text-sm text-pink" role="alert">
            {error}
          </p>
        )}
        <Button full onClick={handleCreate} disabled={busy}>
          {busy ? "Création…" : "Créer la session"}
        </Button>
      </div>
    </Screen>
  );
}
