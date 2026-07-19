"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui";
import type {
  Activity,
  SessionActivity,
  Participant,
  ReactionType,
  BradIntent,
} from "@/lib/types";
import { REACTION_LABELS, REACTION_EMOJI } from "@/lib/types";

function formatResponse(
  activity: Activity,
  value: string | number | number[] | null,
  text: string | null
): string {
  if (activity.options && typeof value === "number") {
    return activity.options[value] ?? "—";
  }
  if (Array.isArray(value) && activity.options) {
    return value.map((i) => activity.options![i]).join(" › ");
  }
  if (typeof value === "number") return String(value);
  if (text) return text;
  return "Répondu à voix haute";
}

interface Props {
  activity: Activity;
  sessionActivity: SessionActivity;
  participants: Participant[];
  myId: string | null;
  onReact: (r: ReactionType) => void;
  onNext: (intent?: BradIntent) => void;
  onChooseTopic?: () => void;
  withBrad?: boolean;
}

const REACTIONS: ReactionType[] = [
  "unexpected",
  "me_too",
  "tell_more",
  "touching",
  "funny",
  "understand",
];

export function Reveal({
  activity,
  sessionActivity,
  participants,
  myId,
  onReact,
  onNext,
  onChooseTopic,
  withBrad = false,
}: Props) {
  const [intent, setIntent] = useState<BradIntent>("auto");
  const myReactions = new Set(
    sessionActivity.reactions
      .filter((r) => r.participantId === myId)
      .map((r) => r.reactionType)
  );

  // Les deux ont-ils fait le même choix structuré ? (moment fort à célébrer)
  const responses = sessionActivity.responses;
  const structured =
    activity.type === "secret_choice" ||
    activity.type === "who_of_us" ||
    activity.type === "guess_my_answer";
  const isMatch =
    structured &&
    responses.length === 2 &&
    responses[0].optionResponse != null &&
    JSON.stringify(responses[0].optionResponse) ===
      JSON.stringify(responses[1].optionResponse);
  const soloTarget =
    sessionActivity.bradTargetParticipantId &&
    (sessionActivity.bradFocus === "individual" ||
      sessionActivity.bradFocus === "cross")
      ? participants.find(
          (participant) =>
            participant.id === sessionActivity.bradTargetParticipantId
        )
      : null;
  const displayedParticipants = soloTarget ? [soloTarget] : participants;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative space-y-4"
    >
      {/* Lueur douce derrière les réponses quand elles s'accordent */}
      {isMatch && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] blur-2xl"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 40%, rgba(255,138,107,0.35), rgba(232,93,138,0.18), transparent 75%)",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.35 }}
        />
      )}

      {isMatch && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex items-center justify-center gap-2 rounded-full bg-white/70 py-2 text-sm font-semibold text-pink"
        >
          <span aria-hidden>✨</span>
          Vous êtes sur la même longueur d&apos;onde
        </motion.div>
      )}

      <div className="grid gap-3">
        {displayedParticipants.map((p, idx) => {
          const resp = sessionActivity.responses.find(
            (r) => r.participantId === p.id
          );
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 18, rotateX: -8 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                delay: 0.12 + 0.14 * idx,
                type: "spring",
                stiffness: 120,
                damping: 15,
              }}
              className={`rounded-2xl px-4 py-3 ${
                isMatch
                  ? "bg-white shadow-[0_10px_30px_-14px_rgba(232,93,138,0.5)]"
                  : "bg-cream-deep"
              }`}
            >
              <span className="text-xs font-semibold text-violet/60">
                {p.avatar} {p.displayName}
              </span>
              <p className="mt-1 font-medium text-ink">
                {resp
                  ? formatResponse(
                      activity,
                      resp.optionResponse,
                      resp.textResponse
                    )
                  : "—"}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-violet/50 mb-2">
          Réagir
        </p>
        <div className="flex flex-wrap gap-2">
          {REACTIONS.map((r) => {
            const count = sessionActivity.reactions.filter(
              (x) => x.reactionType === r
            ).length;
            return (
              <button
                key={r}
                type="button"
                aria-pressed={myReactions.has(r)}
                onClick={() => onReact(r)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition ${
                  myReactions.has(r)
                    ? "bg-violet text-white"
                    : "bg-white text-ink hover:bg-violet/10"
                }`}
              >
                <span aria-hidden>{REACTION_EMOJI[r]}</span>
                {REACTION_LABELS[r]}
                {count > 0 && (
                  <span className="ml-0.5 text-xs opacity-70">·{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {withBrad && (
        <div className="rounded-2xl bg-violet/5 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet/55">
            Quelle direction pour la suite ?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["deepen", "🔎 Creuser"],
              ["pivot", "↗ Changer"],
              ["surprise", "✨ Surprise"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={intent === value}
                onClick={() => setIntent(intent === value ? "auto" : value)}
                className={`rounded-xl px-2 py-2 text-xs font-semibold transition ${
                  intent === value
                    ? "bg-violet text-white"
                    : "bg-white text-violet hover:bg-violet/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {onChooseTopic && (
            <button
              type="button"
              onClick={onChooseTopic}
              className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-xs font-semibold text-pink hover:bg-pink/10"
            >
              🎯 Choisir exactement le sujet
            </button>
          )}
          <p className="mt-2 text-center text-[11px] text-ink/45">
            Sans choix, Brad décide selon le rythme et vos réglages.
          </p>
        </div>
      )}

      {!withBrad && onChooseTopic && (
        <Button variant="soft" full onClick={onChooseTopic}>
          Changer de sujet
        </Button>
      )}
      <Button full onClick={() => onNext(withBrad ? intent : "auto")}>
        {withBrad ? "Brad choisit la suite" : "Activité suivante"}
      </Button>
    </motion.div>
  );
}
