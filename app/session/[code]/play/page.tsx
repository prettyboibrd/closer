"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Card, Screen } from "@/components/ui";
import { ConnectionGauge } from "@/components/ConnectionGauge";
import { ActivityInput } from "@/components/ActivityInput";
import { Reveal } from "@/components/Reveal";
import { Waiting } from "@/components/Waiting";
import { PresenceBanner } from "@/components/PresenceBanner";
import { TopicPicker } from "@/components/TopicPicker";
import { SexualConsent } from "@/components/SexualConsent";
import {
  GUIDE_MODE_LABELS,
  type BradIntent,
  type IntensityLevel,
  type ReactionType,
  type Topic,
} from "@/lib/types";
import { activityForSessionActivity } from "@/lib/activities";
import {
  appendBradDecision,
  currentActivity,
  endSession,
  guideModeFor,
  hasAnswered,
  nextAfterReveal,
  requestTopicChange,
  shouldParticipantAnswer,
  skipActivity,
  submitReaction,
  submitResponse,
  submitTopicConsent,
} from "@/lib/session-logic";
import { askBradNextActivity } from "@/lib/brad";
import { useSession } from "@/lib/useSession";
import {
  TOPIC_ICONS,
  TOPIC_LABELS,
  activeTopicFor,
  intensityLabel,
  topicForActivity,
  topicModeFor,
} from "@/lib/topics";

export default function PlayPage() {
  const params = useParams<{ code: string }>();
  const code = params.code?.toUpperCase() ?? "";
  const router = useRouter();
  const { session, loading, mutate, myId, online } = useSession(code);
  const [skipToast, setSkipToast] = useState(false);
  const [bradThinking, setBradThinking] = useState(false);
  const [topicPickerOpen, setTopicPickerOpen] = useState(false);

  useEffect(() => {
    if (session?.status === "ended") {
      router.push(`/session/${code}/summary`);
    }
  }, [session?.status, code, router]);

  const sessionActivity = useMemo(
    () => (session ? currentActivity(session) : null),
    [session]
  );
  const activity = sessionActivity
    ? activityForSessionActivity(sessionActivity)
    : null;

  if (loading) {
    return (
      <Screen>
        <p className="mt-16 text-center text-ink/50">Chargement…</p>
      </Screen>
    );
  }

  if (!session || !myId) {
    return (
      <Screen>
        <Card className="mt-16 p-8 text-center">
          <div className="mb-3 text-4xl">🔌</div>
          <h1 className="mb-2 font-display text-2xl font-700 text-violet">
            Session indisponible
          </h1>
          <p className="mb-5 text-ink/70">
            La connexion à cette session a été perdue.
          </p>
          <Button variant="secondary" full onClick={() => router.push("/")}>
            Accueil
          </Button>
        </Card>
      </Screen>
    );
  }

  const guideMode = guideModeFor(session);
  const partner = session.participants.find(
    (participant) => participant.id !== myId
  );
  const iAnswered = hasAnswered(session, myId);
  const shouldAnswer = shouldParticipantAnswer(session, myId);
  const revealed = sessionActivity?.status === "revealed";
  const activeTopic = activeTopicFor(session);
  const currentTopic = activity ? topicForActivity(activity) : activeTopic;
  const targetParticipant = sessionActivity?.bradTargetParticipantId
    ? session.participants.find(
        (participant) =>
          participant.id === sessionActivity.bradTargetParticipantId
      )
    : null;

  function handleSubmit(payload: {
    textResponse: string | null;
    optionResponse: string | number | number[] | null;
  }) {
    mutate((current) => submitResponse(current, myId!, payload));
  }

  function handleSkip() {
    const expectedActivityId = sessionActivity?.id;
    mutate((current) =>
      currentActivity(current)?.id === expectedActivityId
        ? skipActivity(current)
        : current
    );
    setSkipToast(true);
    setTimeout(() => setSkipToast(false), 2200);
  }

  function handleReact(reaction: ReactionType) {
    mutate((current) => submitReaction(current, myId!, reaction));
  }

  async function handleNext(intent: BradIntent = "auto") {
    if (bradThinking) return;
    const expectedActivityId = sessionActivity?.id;
    if (!expectedActivityId) return;

    if (guideMode === "classic") {
      await mutate((current) =>
        currentActivity(current)?.id === expectedActivityId
          ? nextAfterReveal(current)
          : current
      );
      return;
    }

    setBradThinking(true);
    try {
      const completed = await mutate((current) => {
        const currentSessionActivity = currentActivity(current);
        if (currentSessionActivity?.id !== expectedActivityId) return current;
        return {
          ...current,
          history: current.history.map((historyItem) =>
            historyItem.id === currentSessionActivity.id
              ? { ...historyItem, status: "completed" as const }
              : historyItem
          ),
        };
      });

      const decision = completed
        ? await askBradNextActivity(completed, intent)
        : null;
      await mutate((current) => {
        if (currentActivity(current)?.id !== expectedActivityId) return current;
        return decision
          ? appendBradDecision(current, decision)
          : nextAfterReveal(current);
      });
    } finally {
      setBradThinking(false);
    }
  }

  function handleTopicSelect(topic: Topic | null) {
    setTopicPickerOpen(false);
    mutate((current) => requestTopicChange(current, myId!, topic));
  }

  function handleSexualConsent(
    accepted: boolean,
    adultConfirmed: boolean,
    maxIntensity: IntensityLevel
  ) {
    mutate((current) =>
      submitTopicConsent(
        current,
        myId!,
        accepted,
        adultConfirmed,
        maxIntensity
      )
    );
  }

  return (
    <Screen>
      <SexualConsent
        session={session}
        myId={myId}
        onSubmit={handleSexualConsent}
      />
      <TopicPicker
        open={topicPickerOpen}
        session={session}
        onClose={() => setTopicPickerOpen(false)}
        onSelect={handleTopicSelect}
      />
      <PresenceBanner session={session} myId={myId} online={online} />

      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTopicPickerOpen(true)}
              className="rounded-full bg-pink/10 px-3 py-1.5 text-xs font-semibold text-pink transition hover:bg-pink/15"
            >
              {topicModeFor(session) === "focused" && activeTopic
                ? `${TOPIC_ICONS[activeTopic]} ${TOPIC_LABELS[activeTopic]}`
                : "✨ Mix de sujets"}
              <span className="ml-1 opacity-65">· changer</span>
            </button>
            <span className="rounded-full bg-violet/10 px-2.5 py-1.5 text-[10px] font-semibold text-violet">
              {guideMode === "brad" ? "✨ " : "🎲 "}
              {GUIDE_MODE_LABELS[guideMode]}
            </span>
          </div>
          <button
            onClick={() => mutate((current) => endSession(current))}
            className="text-xs font-semibold text-ink/40 hover:text-pink"
          >
            Terminer
          </button>
        </div>
        <ConnectionGauge points={session.connectionPoints} />
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <AnimatePresence mode="wait">
          {activity && sessionActivity && (
            <motion.div
              key={sessionActivity.id + sessionActivity.status}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <Card className="p-6">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-pink/10 px-3 py-1 text-xs font-semibold text-pink">
                    {TOPIC_ICONS[topicForActivity(activity)]}{" "}
                    {TOPIC_LABELS[topicForActivity(activity)]}
                  </span>
                  <span className="rounded-full bg-violet/10 px-3 py-1 text-xs font-semibold text-violet">
                    Intensité {activity.depthLevel} ·{" "}
                    {intensityLabel(
                      topicForActivity(activity),
                      activity.depthLevel
                    )}
                  </span>
                  <span className="rounded-full bg-cream-deep px-3 py-1 text-xs font-semibold text-ink/55">
                    {activityLabel(activity.type)}
                  </span>
                </div>

                {sessionActivity.bradIntro && (
                  <div className="mb-4 rounded-2xl bg-violet/5 px-4 py-3 text-sm text-violet">
                    <span className="font-semibold">Brad :</span>{" "}
                    {sessionActivity.bradIntro}
                  </div>
                )}

                {sessionActivity.bradFocus === "individual" &&
                  targetParticipant && (
                    <div className="mb-4 rounded-2xl border border-pink/15 bg-pink/5 px-4 py-3 text-sm font-semibold text-pink">
                      🎙️ À toi, {targetParticipant.displayName}. Brad te donne la
                      parole pour ce tour.
                    </div>
                  )}

                {sessionActivity.bradFocus === "cross" &&
                  targetParticipant && (
                    <div className="mb-4 rounded-2xl border border-violet/15 bg-violet/5 px-4 py-3 text-sm font-semibold text-violet">
                      🔁 {targetParticipant.displayName}, réagis au point de vue
                      de l&apos;autre.
                    </div>
                  )}

                {sessionActivity.bradFocus === "bridge" && (
                  <div className="mb-4 rounded-2xl border border-coral/15 bg-coral/5 px-4 py-3 text-sm font-semibold text-ink">
                    🤝 À vous deux : cherchez ce qui relie vos réponses, même si
                    elles sont différentes.
                  </div>
                )}

                {sessionActivity.customActivity && (
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-pink/70">
                    Question créée pour votre conversation
                  </div>
                )}

                <h2 className="mb-5 font-display text-2xl font-700 leading-snug text-ink">
                  {activity.prompt}
                </h2>

                {revealed ? (
                  <Reveal
                    activity={activity}
                    sessionActivity={sessionActivity}
                    participants={session.participants}
                    myId={myId}
                    onReact={handleReact}
                    onNext={handleNext}
                    onChooseTopic={() => setTopicPickerOpen(true)}
                    withBrad={guideMode === "brad"}
                  />
                ) : !shouldAnswer && targetParticipant ? (
                  <Waiting
                    name={targetParticipant.displayName}
                    message={`Brad donne la parole à ${targetParticipant.displayName}. Écoute sa réponse : la prochaine question pourra revenir vers toi.`}
                  />
                ) : iAnswered ? (
                  <Waiting name={partner?.displayName ?? "l'autre"} />
                ) : (
                  <ActivityInput activity={activity} onSubmit={handleSubmit} />
                )}
              </Card>

              {!revealed && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    full
                    onClick={() => setTopicPickerOpen(true)}
                  >
                    Changer de sujet
                  </Button>
                  <Button variant="ghost" full onClick={handleSkip}>
                    Passer la question
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {!activity && (
            <Card className="p-8 text-center">
              <div className="mb-3 text-4xl">🎉</div>
              <h2 className="mb-2 font-display text-2xl font-700 text-violet">
                Vous avez tout exploré !
              </h2>
              <p className="mb-5 text-ink/70">
                Changez de sujet ou terminez cette session.
              </p>
              <div className="space-y-2">
                <Button full onClick={() => setTopicPickerOpen(true)}>
                  Choisir un autre sujet
                </Button>
                <Button
                  variant="ghost"
                  full
                  onClick={() => mutate((current) => endSession(current))}
                >
                  Voir le résumé
                </Button>
              </div>
            </Card>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {bradThinking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-violet shadow-lg"
            role="status"
          >
            <span className="flex gap-1" aria-hidden>
              <span className="wait-dot h-1.5 w-1.5 rounded-full bg-pink" />
              <span
                className="wait-dot h-1.5 w-1.5 rounded-full bg-coral"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="wait-dot h-1.5 w-1.5 rounded-full bg-violet-soft"
                style={{ animationDelay: "0.4s" }}
              />
            </span>
            Brad prépare la suite…
          </motion.div>
        )}
      </AnimatePresence>

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

function activityLabel(type: string): string {
  const labels: Record<string, string> = {
    open_question: "Question ouverte",
    secret_choice: "Choix secret",
    who_of_us: "Qui de nous deux",
    guess_my_answer: "Devine ma réponse",
    ranking: "Classement",
    mission: "Mission",
    complete_sentence: "Complète la phrase",
    estimation: "Estimation",
  };
  return labels[type] ?? type;
}
