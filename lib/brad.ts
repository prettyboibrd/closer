"use client";

import type {
  ActivityType,
  BradDecision,
  BradIntent,
  BradStrategy,
  ReactionType,
  Session,
  Topic,
} from "./types";
import { activityForSessionActivity } from "./activities";
import {
  activeTopicFor,
  configuredIntensityFor,
  selectedTopicsFor,
  topicForActivity,
  topicModeFor,
  unlockedIntensityFor,
} from "./topics";

function readableAnswer(
  activityOptions: string[] | null,
  value: string | number | number[] | null,
  text: string | null
): string {
  if (activityOptions && typeof value === "number") {
    return activityOptions[value] ?? "";
  }
  if (Array.isArray(value) && activityOptions) {
    return value.map((index) => activityOptions[index]).join(" > ");
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (text && text !== "mission") return text;
  return "";
}

interface BradTurn {
  prompt: string;
  type: ActivityType;
  topic: Topic;
  source: "brad" | "catalog";
  focus: string | null;
  targetParticipantId: string | null;
  answers: {
    participantId: string;
    displayName: string;
    value: string;
  }[];
  reactions: ReactionType[];
}

export async function askBradNextActivity(
  session: Session,
  intent: BradIntent = "auto"
): Promise<BradDecision | null> {
  const recentTypes: ActivityType[] = session.history
    .map((historyItem) => activityForSessionActivity(historyItem)?.type)
    .filter((type): type is ActivityType => Boolean(type));

  const recentTopics: Topic[] = session.history
    .slice(-6)
    .map((historyItem) => activityForSessionActivity(historyItem))
    .filter((activity): activity is NonNullable<typeof activity> => Boolean(activity))
    .map(topicForActivity);

  const recentStrategies: BradStrategy[] = session.history
    .slice(-4)
    .map((historyItem) => historyItem.bradStrategy)
    .filter((strategy): strategy is BradStrategy => Boolean(strategy));

  const recentTargetParticipantIds = session.history
    .slice(-6)
    .map((historyItem) => historyItem.bradTargetParticipantId)
    .filter((participantId): participantId is string => Boolean(participantId));

  const lastTurns: BradTurn[] = session.history
    .filter((historyItem) => !historyItem.skipped)
    .slice(-5)
    .flatMap((historyItem) => {
      const activity = activityForSessionActivity(historyItem);
      if (!activity) return [];
      const answers = historyItem.responses
        .map((response) => {
          const participant = session.participants.find(
            (item) => item.id === response.participantId
          );
          const value = readableAnswer(
            activity.options,
            response.optionResponse,
            response.textResponse
          );
          if (!participant || !value) return null;
          return {
            participantId: participant.id,
            displayName: participant.displayName,
            value,
          };
        })
        .filter(
          (
            answer
          ): answer is {
            participantId: string;
            displayName: string;
            value: string;
          } => Boolean(answer)
        );
      return [
        {
          prompt: activity.prompt,
          type: activity.type,
          topic: topicForActivity(activity),
          source: historyItem.customActivity ? "brad" : "catalog",
          focus: historyItem.bradFocus ?? null,
          targetParticipantId: historyItem.bradTargetParticipantId ?? null,
          answers,
          reactions: historyItem.reactions.map(
            (reaction) => reaction.reactionType
          ),
        },
      ];
    });

  const selectedTopics = selectedTopicsFor(session);
  const intensityByTopic = Object.fromEntries(
    selectedTopics.map((topic) => [topic, configuredIntensityFor(session, topic)])
  );

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const response = await fetch("/api/next-question", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        usedActivityIds: session.usedActivityIds,
        recentTypes,
        recentTopics,
        recentStrategies,
        recentTargetParticipantIds,
        participants: session.participants.map((participant) => ({
          id: participant.id,
          displayName: participant.displayName,
        })),
        allowedLevel: session.currentLevel,
        sessionMode: session.mode,
        selectedTopics,
        intensityByTopic,
        activeTopic: activeTopicFor(session),
        topicMode: topicModeFor(session),
        unlockedTopicIntensities: {
          sexualite: unlockedIntensityFor(session, "sexualite") ?? undefined,
        },
        intent,
        lastTurns,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const data = (await response.json()) as BradDecision;
    if (!data || !data.strategy || !data.kind || !data.focus) return null;
    return data;
  } catch {
    return null;
  }
}
