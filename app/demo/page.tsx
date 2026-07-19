"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Eyebrow, Screen } from "@/components/ui";
import { ConnectionGauge } from "@/components/ConnectionGauge";
import { ActivityInput } from "@/components/ActivityInput";
import { Reveal } from "@/components/Reveal";
import { TopicPicker } from "@/components/TopicPicker";
import {
  type ReactionType,
  type Session,
} from "@/lib/types";
import {
  TOPIC_ICONS,
  TOPIC_LABELS,
  intensityLabel,
  topicForActivity,
} from "@/lib/topics";
import { activityForSessionActivity } from "@/lib/activities";
import {
  createSession,
  joinSession,
  startSession,
  currentActivity,
  submitResponse,
  skipActivity,
  nextAfterReveal,
  submitReaction,
  changeTopicNow,
  endSession,
  createSummary,
  hasAnswered,
} from "@/lib/session-logic";

function buildDemo(): { session: Session; alex: string; sam: string } {
  let s = createSession("new_meeting", null, {
    anonymousUserId: "demo-alex",
    displayName: "Alex",
    avatar: "🦊",
  }, "classic");
  const alex = s.hostId;
  const joined = joinSession(s, { displayName: "Sam", avatar: "🐬" });
  if ("error" in joined) throw new Error(joined.error);
  s = joined.session;
  const sam = joined.participantId;
  s = startSession(s);
  return { session: s, alex, sam };
}

export default function DemoPage() {
  const initial = useMemo(buildDemo, []);
  const [session, setSession] = useState<Session>(initial.session);
  const alex = initial.alex;
  const sam = initial.sam;
  const [activePlayer, setActivePlayer] = useState<string>(alex);
  const [skipToast, setSkipToast] = useState(false);
  const [topicPickerOpen, setTopicPickerOpen] = useState(false);

  const sa = currentActivity(session);
  const activity = sa ? activityForSessionActivity(sa) : null;
  const revealed = sa?.status === "revealed";
  const topic = activity ? topicForActivity(activity) : null;

  const alexAnswered = hasAnswered(session, alex);
  const samAnswered = hasAnswered(session, sam);

  if (session.status === "ended") {
    const summary = createSummary(session);
    return (
      <Screen>
        <div className="text-center mb-6">
          <Eyebrow>Démo terminée</Eyebrow>
          <h1 className="font-display text-3xl font-700 text-violet mt-1">
            {summary.stage}
          </h1>
          <p className="mt-2 text-ink/60">Alex &amp; Sam</p>
        </div>
        <Card className="p-6 grid grid-cols-2 gap-4">
          <Stat label="Durée" value={summary.durationLabel} />
          <Stat label="Activités" value={String(summary.activitiesCompleted)} />
          <Stat label="Points" value={String(summary.connectionPoints)} />
          <Stat
            label="Prédictions proches"
            value={String(summary.closePredictions)}
          />
          <Stat
            label="Intensité max"
            value={`Niveau ${summary.levelReached}`}
          />
          {summary.favoriteActivity && (
            <Stat label="Favorite" value={summary.favoriteActivity} />
          )}
        </Card>
        <div className="mt-6 space-y-3">
          <Button
            full
            onClick={() => {
              const fresh = buildDemo();
              setSession(fresh.session);
              setActivePlayer(fresh.alex);
            }}
          >
            Relancer la démo
          </Button>
          <Link href="/" className="block">
            <Button variant="ghost" full>
              Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      </Screen>
    );
  }

  const currentPlayerAnswered =
    activePlayer === alex ? alexAnswered : samAnswered;
  const player = session.participants.find((p) => p.id === activePlayer)!;

  function submit(payload: {
    textResponse: string | null;
    optionResponse: string | number | number[] | null;
  }) {
    setSession((s) => submitResponse(s, activePlayer, payload));
    // Auto-hand to the other player if they haven't answered.
    setActivePlayer((cur) => (cur === alex ? sam : alex));
  }

  return (
    <Screen>
      <TopicPicker
        open={topicPickerOpen}
        session={session}
        onClose={() => setTopicPickerOpen(false)}
        onSelect={(selectedTopic) => {
          setSession((current) => changeTopicNow(current, selectedTopic));
          setActivePlayer(alex);
          setTopicPickerOpen(false);
        }}
      />

      <div className="flex items-center justify-between mb-3">
        <Link href="/" className="text-sm text-violet/60 hover:text-violet">
          ← Quitter
        </Link>
        <button
          onClick={() => setSession((s) => endSession(s))}
          className="text-xs font-semibold text-ink/40 hover:text-pink"
        >
          Terminer
        </button>
      </div>

      {/* Player toggle — the demo's single-device switch */}
      <div className="mb-4 flex gap-2 rounded-2xl bg-cream-deep p-1">
        {session.participants.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePlayer(p.id)}
            aria-pressed={activePlayer === p.id}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
              activePlayer === p.id
                ? "aurora text-white"
                : "text-ink/60 hover:text-ink"
            }`}
          >
            {p.avatar} {p.displayName}
            {(p.id === alex ? alexAnswered : samAnswered) && !revealed && (
              <span aria-hidden> ✓</span>
            )}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-violet/60">
            {topic ? `${TOPIC_ICONS[topic]} ${TOPIC_LABELS[topic]}` : "Mix automatique"}
          </span>
          <button
            type="button"
            onClick={() => setTopicPickerOpen(true)}
            className="text-xs font-semibold text-violet hover:text-pink"
          >
            Changer de sujet
          </button>
        </div>
        <ConnectionGauge points={session.connectionPoints} />
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {activity && sa && (
            <motion.div
              key={sa.id + sa.status + activePlayer}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  {topic && (
                    <>
                      <span className="rounded-full bg-pink/10 px-3 py-1 text-xs font-semibold text-pink">
                        {TOPIC_ICONS[topic]} {TOPIC_LABELS[topic]}
                      </span>
                      <span className="rounded-full bg-violet/10 px-3 py-1 text-xs font-semibold text-violet">
                        Niveau {activity.depthLevel} · {intensityLabel(topic, activity.depthLevel)}
                      </span>
                    </>
                  )}
                </div>
                <h2 className="font-display text-2xl font-700 text-ink leading-snug mb-5">
                  {activity.prompt}
                </h2>

                {revealed ? (
                  <Reveal
                    activity={activity}
                    sessionActivity={sa}
                    participants={session.participants}
                    myId={activePlayer}
                    onReact={(r: ReactionType) =>
                      setSession((s) => submitReaction(s, activePlayer, r))
                    }
                    onNext={() => setSession((s) => nextAfterReveal(s))}
                    onChooseTopic={() => setTopicPickerOpen(true)}
                    withBrad={false}
                  />
                ) : currentPlayerAnswered ? (
                  <div className="rounded-2xl bg-cream-deep px-5 py-6 text-center text-ink/70">
                    {player.displayName} a répondu. Passe à l&apos;autre
                    joueur pour révéler.
                  </div>
                ) : (
                  <ActivityInput activity={activity} onSubmit={submit} />
                )}
              </Card>

              {!revealed && (
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    full
                    onClick={() => {
                      setSession((s) => skipActivity(s));
                      setActivePlayer(alex);
                      setSkipToast(true);
                      setTimeout(() => setSkipToast(false), 2200);
                    }}
                  >
                    Passer cette activité
                  </Button>
                </div>
              )}
            </motion.div>
          )}
          {!activity && (
            <Card className="p-8 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="font-display text-2xl font-700 text-violet mb-2">
                Tout exploré !
              </h2>
              <Button full onClick={() => setSession((s) => endSession(s))}>
                Voir le résumé
              </Button>
            </Card>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {skipToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-violet px-5 py-3 text-sm font-medium text-white shadow-lg"
            role="status"
          >
            Aucun problème. En voici une autre.
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-display font-700 text-violet">{value}</div>
      <div className="text-xs text-ink/60">{label}</div>
    </div>
  );
}
