import type {
  ActivityType,
  BradDecision,
  BradFocus,
  BradStrategy,
  GuideMode,
  IntensityLevel,
  Participant,
  Reaction,
  ReactionType,
  Response,
  Session,
  SessionActivity,
  Topic,
} from "./types";
import { CONNECTION_STAGES, POINTS } from "./types";
import {
  ACTIVITIES,
  activityForSessionActivity,
  getActivityById,
} from "./activities";
import {
  eligibleActivities,
  selectNextActivity,
  type SelectionState,
} from "./selection";
import {
  DEFAULT_TOPICS_BY_MODE,
  activeTopicFor,
  configuredIntensityFor,
  defaultIntensityByMode,
  effectiveIntensityFor,
  selectedTopicsFor,
  topicForActivity,
  topicModeFor,
  unlockedIntensityFor,
} from "./topics";

export function makeCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let output = "";
  for (let index = 0; index < 6; index += 1) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return output;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function stageFor(points: number): string {
  let label: string = CONNECTION_STAGES[0].label;
  for (const stage of CONNECTION_STAGES) {
    if (points >= stage.threshold) label = stage.label;
  }
  return label;
}

function recentTypes(session: Session): ActivityType[] {
  return session.history
    .map((historyItem) => activityForSessionActivity(historyItem)?.type)
    .filter((type): type is ActivityType => Boolean(type));
}

function recentTopics(session: Session): Topic[] {
  return session.history
    .map((historyItem) => activityForSessionActivity(historyItem))
    .filter((activity): activity is NonNullable<typeof activity> => Boolean(activity))
    .map(topicForActivity);
}

function selectionStateFor(session: Session): SelectionState {
  const selectedTopics = selectedTopicsFor(session);
  const intensityByTopic: Partial<Record<Topic, IntensityLevel>> = {};
  for (const topic of selectedTopics) {
    intensityByTopic[topic] = configuredIntensityFor(session, topic);
  }

  return {
    usedActivityIds: session.usedActivityIds,
    recentTypes: recentTypes(session),
    recentTopics: recentTopics(session),
    allowedLevel: Math.min(4, Math.max(1, session.currentLevel || 2)),
    sessionMode: session.mode,
    selectedTopics,
    intensityByTopic,
    activeTopic: activeTopicFor(session),
    topicMode: topicModeFor(session),
    unlockedTopicIntensities: session.unlockedTopicIntensities,
  };
}

export function guideModeFor(session: Session): GuideMode {
  return session.guideMode ?? "brad";
}

export function currentActivity(session: Session): SessionActivity | null {
  if (!session.currentSessionActivityId) return null;
  return (
    session.history.find(
      (historyItem) => historyItem.id === session.currentSessionActivityId
    ) ?? null
  );
}

export interface TopicConfiguration {
  selectedTopics: Topic[];
  intensityByTopic: Partial<Record<Topic, IntensityLevel>>;
}

export function createSession(
  mode: Session["mode"],
  durationMinutes: number | null,
  host: { anonymousUserId: string; displayName: string; avatar: string },
  guideMode: GuideMode = "brad",
  topicConfiguration?: TopicConfiguration
): Session {
  const hostParticipant: Participant = {
    id: uid("p"),
    displayName: host.displayName,
    avatar: host.avatar,
    isHost: true,
    joinedAt: Date.now(),
    lastSeenAt: Date.now(),
    connected: true,
  };

  const defaults = DEFAULT_TOPICS_BY_MODE[mode];
  const selectedTopics = (
    topicConfiguration?.selectedTopics?.length
      ? topicConfiguration.selectedTopics
      : defaults
  ).filter((topic, index, array) => array.indexOf(topic) === index);
  const defaultIntensities = defaultIntensityByMode(mode);
  const intensityByTopic: Partial<Record<Topic, IntensityLevel>> = {};
  for (const topic of selectedTopics) {
    intensityByTopic[topic] =
      topicConfiguration?.intensityByTopic?.[topic] ??
      defaultIntensities[topic] ??
      2;
  }
  const maxConfigured = Math.max(
    1,
    ...Object.values(intensityByTopic).filter(
      (value): value is IntensityLevel => Boolean(value)
    )
  );

  return {
    id: uid("s"),
    code: makeCode(),
    status: "lobby",
    mode,
    guideMode,
    durationMinutes,
    selectedTopics,
    intensityByTopic,
    topicMode: "mix",
    activeTopic: null,
    unlockedTopicIntensities: {},
    pendingTopicConsent: null,
    topicConsents: [],
    currentLevel: maxConfigured,
    connectionPoints: 0,
    currentSessionActivityId: null,
    hostId: hostParticipant.id,
    createdAt: Date.now(),
    startedAt: null,
    endedAt: null,
    participants: [hostParticipant],
    history: [],
    usedActivityIds: [],
    recentTypes: [],
    pendingLevelUp: null,
    levelConsents: [],
  };
}

export function joinSession(
  session: Session,
  guest: { displayName: string; avatar: string }
): { session: Session; participantId: string } | { error: string } {
  if (session.participants.length >= 2) {
    return { error: "Cette session est déjà complète." };
  }
  const participant: Participant = {
    id: uid("p"),
    displayName: guest.displayName,
    avatar: guest.avatar,
    isHost: false,
    joinedAt: Date.now(),
    lastSeenAt: Date.now(),
    connected: true,
  };
  return {
    session: {
      ...session,
      participants: [...session.participants, participant],
    },
    participantId: participant.id,
  };
}

export function startSession(session: Session): Session {
  if (session.participants.length < 2) return session;
  return pickAndAppend({
    ...session,
    status: "playing",
    startedAt: Date.now(),
  });
}

function pickAndAppend(session: Session): Session {
  let workingSession = session;
  let chosen = selectNextActivity(ACTIVITIES, selectionStateFor(workingSession));

  // Un sujet ciblé peut finir par épuiser ses cartes. On repasse alors en mix
  // plutôt que de bloquer la partie.
  if (!chosen && topicModeFor(workingSession) === "focused") {
    workingSession = {
      ...workingSession,
      topicMode: "mix",
      activeTopic: null,
    };
    chosen = selectNextActivity(ACTIVITIES, selectionStateFor(workingSession));
  }
  if (!chosen) return workingSession;

  const sessionActivity: SessionActivity = {
    id: uid("sa"),
    activityId: chosen.id,
    position: workingSession.history.length,
    status: "active",
    skipped: false,
    startedAt: Date.now(),
    completedAt: null,
    responses: [],
    reactions: [],
  };
  return {
    ...workingSession,
    history: [...workingSession.history, sessionActivity],
    currentSessionActivityId: sessionActivity.id,
    usedActivityIds: [...workingSession.usedActivityIds, chosen.id],
  };
}

export function selectNext(session: Session): Session {
  return pickAndAppend(session);
}

function closeCurrentForTopicChange(session: Session): Session {
  const current = currentActivity(session);
  if (!current) return session;
  const status = current.status === "active" ? "skipped" : "completed";
  const updated: SessionActivity = {
    ...current,
    status,
    skipped: current.status === "active" ? true : current.skipped,
    completedAt: current.completedAt ?? Date.now(),
  };
  return replaceActivity(session, updated);
}

/** Change immédiatement la prochaine carte. Le sujet sexualité doit être déverrouillé. */
export function changeTopicNow(
  session: Session,
  topic: Topic | null
): Session {
  const selected = selectedTopicsFor(session);
  if (topic && !selected.includes(topic)) return session;
  if (topic === "sexualite" && !unlockedIntensityFor(session, "sexualite")) {
    return session;
  }

  const closed = closeCurrentForTopicChange(session);
  return pickAndAppend({
    ...closed,
    topicMode: topic ? "focused" : "mix",
    activeTopic: topic,
  });
}

export function requestTopicChange(
  session: Session,
  participantId: string,
  topic: Topic | null
): Session {
  if (topic !== "sexualite") return changeTopicNow(session, topic);
  if (!selectedTopicsFor(session).includes("sexualite")) return session;
  if (unlockedIntensityFor(session, "sexualite")) {
    return changeTopicNow(session, "sexualite");
  }
  if (!session.participants.some((participant) => participant.id === participantId)) {
    return session;
  }

  return {
    ...session,
    pendingTopicConsent: {
      topic: "sexualite",
      requestedBy: participantId,
      requestedIntensity: configuredIntensityFor(session, "sexualite"),
      createdAt: Date.now(),
    },
    topicConsents: (session.topicConsents ?? []).filter(
      (consent) => consent.topic !== "sexualite"
    ),
  };
}

export function submitTopicConsent(
  session: Session,
  participantId: string,
  accepted: boolean,
  adultConfirmed: boolean,
  maxIntensity: IntensityLevel
): Session {
  const pending = session.pendingTopicConsent;
  if (!pending || pending.topic !== "sexualite") return session;
  if (!session.participants.some((participant) => participant.id === participantId)) {
    return session;
  }

  const safeIntensity = Math.min(4, Math.max(1, maxIntensity)) as IntensityLevel;
  const consent = {
    participantId,
    topic: "sexualite" as const,
    accepted: accepted && adultConfirmed,
    adultConfirmed,
    maxIntensity: safeIntensity,
    createdAt: Date.now(),
  };
  const consents = [
    ...(session.topicConsents ?? []).filter(
      (existing) =>
        !(
          existing.topic === "sexualite" &&
          existing.participantId === participantId
        )
    ),
    consent,
  ];
  const sexualConsents = consents.filter(
    (existing) => existing.topic === "sexualite"
  );

  if (sexualConsents.some((existing) => !existing.accepted)) {
    return {
      ...session,
      pendingTopicConsent: null,
      topicConsents: consents,
    };
  }

  const allAccepted =
    sexualConsents.length >= session.participants.length &&
    sexualConsents.every(
      (existing) => existing.accepted && existing.adultConfirmed
    );
  if (!allAccepted) {
    return { ...session, topicConsents: consents };
  }

  const commonIntensity = Math.min(
    pending.requestedIntensity,
    configuredIntensityFor(session, "sexualite"),
    ...sexualConsents.map((existing) => existing.maxIntensity)
  ) as IntensityLevel;
  const unlockedSession: Session = {
    ...session,
    topicConsents: consents,
    pendingTopicConsent: null,
    unlockedTopicIntensities: {
      ...(session.unlockedTopicIntensities ?? {}),
      sexualite: commonIntensity,
    },
  };
  return changeTopicNow(unlockedSession, "sexualite");
}

export function appendSpecificActivity(
  session: Session,
  activityId: string,
  metadata?: {
    intro?: string | null;
    strategy?: BradStrategy;
    focus?: BradFocus;
    targetParticipantId?: string | null;
  }
): Session {
  const current = currentActivity(session);
  if (!current || current.status !== "completed") return session;

  const eligibleIds = new Set(
    eligibleActivities(ACTIVITIES, selectionStateFor(session)).map(
      (activity) => activity.id
    )
  );
  const activity = getActivityById(activityId);
  if (!activity || !eligibleIds.has(activityId)) {
    return pickAndAppend(session);
  }
  const sessionActivity: SessionActivity = {
    id: uid("sa"),
    activityId,
    bradIntro: metadata?.intro?.trim() || undefined,
    bradStrategy: metadata?.strategy,
    bradFocus: metadata?.focus,
    bradTargetParticipantId:
      metadata?.targetParticipantId &&
      session.participants.some(
        (participant) => participant.id === metadata.targetParticipantId
      )
        ? metadata.targetParticipantId
        : undefined,
    position: session.history.length,
    status: "active",
    skipped: false,
    startedAt: Date.now(),
    completedAt: null,
    responses: [],
    reactions: [],
  };
  return {
    ...session,
    history: [...session.history, sessionActivity],
    currentSessionActivityId: sessionActivity.id,
    usedActivityIds: [...session.usedActivityIds, activityId],
  };
}

const CUSTOM_BRAD_TYPES: ActivityType[] = [
  "open_question",
  "complete_sentence",
  "secret_choice",
  "who_of_us",
  "mission",
];

function validCustomBradActivity(
  session: Session,
  decision: BradDecision
): boolean {
  const activity = decision.customActivity;
  if (!activity || decision.kind !== "custom") return false;
  if (!CUSTOM_BRAD_TYPES.includes(activity.type)) return false;
  if (!activity.prompt.trim() || activity.prompt.length > 240) return false;
  if (!activity.title.trim() || activity.title.length > 70) return false;
  if (!activity.id.startsWith("brad_")) return false;

  const targeted =
    decision.focus === "individual" || decision.focus === "cross";
  if (targeted) {
    if (
      !decision.targetParticipantId ||
      !session.participants.some(
        (participant) => participant.id === decision.targetParticipantId
      )
    ) {
      return false;
    }
    if (!["open_question", "complete_sentence"].includes(activity.type)) {
      return false;
    }
    const previousTarget = [...session.history]
      .reverse()
      .find((item) => item.bradTargetParticipantId)?.bradTargetParticipantId;
    if (previousTarget === decision.targetParticipantId) return false;
  }

  const topic = topicForActivity(activity);
  if (!selectedTopicsFor(session).includes(topic)) return false;
  if (activity.depthLevel > effectiveIntensityFor(session, topic)) return false;
  if (topic === "sexualite" && !unlockedIntensityFor(session, topic)) return false;
  if (activity.contexts?.length && !activity.contexts.includes(session.mode)) {
    return false;
  }
  if (
    topicModeFor(session) === "focused" &&
    activeTopicFor(session) &&
    activeTopicFor(session) !== topic
  ) {
    return false;
  }

  if (
    activity.type === "secret_choice" &&
    (!activity.options ||
      activity.options.length < 2 ||
      activity.options.length > 4)
  ) {
    return false;
  }
  if (
    activity.type === "who_of_us" &&
    JSON.stringify(activity.options) !== JSON.stringify(["Moi", "L'autre"])
  ) {
    return false;
  }
  if (
    (activity.type === "open_question" ||
      activity.type === "complete_sentence" ||
      activity.type === "mission") &&
    activity.options !== null
  ) {
    return false;
  }

  const prompts = new Set(
    session.history
      .map((item) =>
        activityForSessionActivity(item)?.prompt.toLowerCase().trim()
      )
      .filter((prompt): prompt is string => Boolean(prompt))
  );
  if (prompts.has(activity.prompt.toLowerCase().trim())) return false;

  const previous = session.history.at(-1);
  const previousActivity = previous
    ? activityForSessionActivity(previous)
    : undefined;
  const previousTopic = previousActivity
    ? topicForActivity(previousActivity)
    : null;

  if (decision.strategy === "rebound" && previous?.bradStrategy === "rebound") {
    return false;
  }

  const focused = topicModeFor(session) === "focused" && activeTopicFor(session);
  if (!focused && decision.strategy !== "rebound" && previousTopic === topic) {
    return false;
  }

  if (!focused && decision.strategy !== "rebound") {
    const counts = new Map<Topic, number>();
    for (const recentTopic of recentTopics(session).slice(-6)) {
      counts.set(recentTopic, (counts.get(recentTopic) ?? 0) + 1);
    }
    if ((counts.get(topic) ?? 0) >= 2) return false;
  }

  return true;
}

export function appendBradDecision(
  session: Session,
  decision: BradDecision | null
): Session {
  const current = currentActivity(session);
  if (!current || current.status !== "completed") return session;
  if (!decision) return pickAndAppend(session);

  if (decision.kind === "catalog" && decision.activityId) {
    return appendSpecificActivity(session, decision.activityId, {
      intro: decision.intro,
      strategy: decision.strategy,
      focus: decision.focus,
      targetParticipantId: decision.targetParticipantId,
    });
  }

  if (!validCustomBradActivity(session, decision) || !decision.customActivity) {
    return pickAndAppend(session);
  }

  const customActivity = decision.customActivity;
  const sessionActivity: SessionActivity = {
    id: uid("sa"),
    activityId: customActivity.id,
    customActivity,
    bradIntro: decision.intro?.trim() || undefined,
    bradStrategy: decision.strategy,
    bradFocus: decision.focus,
    bradTargetParticipantId:
      decision.targetParticipantId &&
      session.participants.some(
        (participant) => participant.id === decision.targetParticipantId
      )
        ? decision.targetParticipantId
        : undefined,
    position: session.history.length,
    status: "active",
    skipped: false,
    startedAt: Date.now(),
    completedAt: null,
    responses: [],
    reactions: [],
  };

  return {
    ...session,
    history: [...session.history, sessionActivity],
    currentSessionActivityId: sessionActivity.id,
    usedActivityIds: [...session.usedActivityIds, customActivity.id],
  };
}

export function submitResponse(
  session: Session,
  participantId: string,
  response: Omit<Response, "participantId" | "submittedAt">
): Session {
  const sessionActivity = currentActivity(session);
  if (!sessionActivity || sessionActivity.status !== "active") return session;
  const requiredIds = respondentIdsFor(session, sessionActivity);
  if (!requiredIds.includes(participantId)) return session;
  if (
    sessionActivity.responses.some(
      (existing) => existing.participantId === participantId
    )
  ) {
    return session;
  }
  const newResponse: Response = {
    participantId,
    submittedAt: Date.now(),
    textResponse: response.textResponse,
    optionResponse: response.optionResponse,
  };
  const responses = [...sessionActivity.responses, newResponse];
  const updated: SessionActivity = { ...sessionActivity, responses };
  const allRequiredAnswered = requiredIds.every((requiredId) =>
    responses.some((item) => item.participantId === requiredId)
  );
  return allRequiredAnswered
    ? awardAndReveal(replaceActivity(session, updated))
    : replaceActivity(session, updated);
}

/**
 * Les cartes ordinaires demandent une réponse aux deux personnes.
 * Pour un zoom individuel ou une réaction croisée créée par Brad, une seule
 * personne répond afin d'éviter de transformer chaque relance en double tour.
 */
export function respondentIdsFor(
  session: Session,
  sessionActivity: SessionActivity
): string[] {
  const target = sessionActivity.bradTargetParticipantId;
  if (
    target &&
    (sessionActivity.bradFocus === "individual" ||
      sessionActivity.bradFocus === "cross") &&
    session.participants.some((participant) => participant.id === target)
  ) {
    return [target];
  }
  return session.participants.map((participant) => participant.id);
}

export function shouldParticipantAnswer(
  session: Session,
  participantId: string
): boolean {
  const sessionActivity = currentActivity(session);
  if (!sessionActivity) return false;
  return respondentIdsFor(session, sessionActivity).includes(participantId);
}

function replaceActivity(
  session: Session,
  sessionActivity: SessionActivity
): Session {
  return {
    ...session,
    history: session.history.map((historyItem) =>
      historyItem.id === sessionActivity.id ? sessionActivity : historyItem
    ),
  };
}

function awardAndReveal(session: Session): Session {
  const sessionActivity = currentActivity(session);
  if (!sessionActivity) return session;
  const activity = activityForSessionActivity(sessionActivity);
  let gained = POINTS.activityCompleted;

  if (activity) {
    const [firstResponse, secondResponse] = sessionActivity.responses;
    if (firstResponse && secondResponse) {
      if (
        activity.type === "secret_choice" ||
        activity.type === "who_of_us"
      ) {
        if (
          JSON.stringify(firstResponse.optionResponse) ===
          JSON.stringify(secondResponse.optionResponse)
        ) {
          gained += POINTS.commonPoint;
        }
      }
      if (
        activity.type === "guess_my_answer" &&
        firstResponse.optionResponse != null &&
        JSON.stringify(firstResponse.optionResponse) ===
          JSON.stringify(secondResponse.optionResponse)
      ) {
        gained += POINTS.closePrediction;
      }
    }
    if (activity.type === "mission") {
      gained += POINTS.missionSuccess - POINTS.activityCompleted;
    }
  }

  const revealed: SessionActivity = {
    ...sessionActivity,
    status: "revealed",
    completedAt: Date.now(),
  };
  return {
    ...replaceActivity(session, revealed),
    connectionPoints: session.connectionPoints + gained,
  };
}

export function skipActivity(session: Session): Session {
  const sessionActivity = currentActivity(session);
  if (!sessionActivity) return session;
  const skipped: SessionActivity = {
    ...sessionActivity,
    status: "skipped",
    skipped: true,
    completedAt: Date.now(),
  };
  return selectNext(replaceActivity(session, skipped));
}

export function nextAfterReveal(session: Session): Session {
  const sessionActivity = currentActivity(session);
  if (
    !sessionActivity ||
    (sessionActivity.status !== "revealed" &&
      sessionActivity.status !== "completed")
  ) {
    return session;
  }
  const done: SessionActivity = { ...sessionActivity, status: "completed" };
  return selectNext(replaceActivity(session, done));
}

export function submitReaction(
  session: Session,
  participantId: string,
  reactionType: ReactionType
): Session {
  const sessionActivity = currentActivity(session);
  if (!sessionActivity) return session;
  const reaction: Reaction = {
    id: uid("r"),
    participantId,
    reactionType,
    createdAt: Date.now(),
  };
  const updated: SessionActivity = {
    ...sessionActivity,
    reactions: [
      ...sessionActivity.reactions.filter(
        (existing) =>
          existing.participantId !== participantId ||
          existing.reactionType !== reactionType
      ),
      reaction,
    ],
  };
  return replaceActivity(session, updated);
}

// Compatibilité V2 : ces fonctions restent utilisables par les anciennes sessions,
// mais la V3 pilote l'intensité sujet par sujet dès la création.
export function requestLevelUp(session: Session, level: number): Session {
  if (level <= session.currentLevel) return session;
  return {
    ...session,
    pendingLevelUp: level,
    levelConsents: session.levelConsents.filter(
      (consent) => consent.requestedLevel !== level
    ),
  };
}

export function submitLevelConsent(
  session: Session,
  participantId: string,
  level: number,
  accepted: boolean
): Session {
  const consents = [
    ...session.levelConsents.filter(
      (consent) =>
        !(
          consent.participantId === participantId &&
          consent.requestedLevel === level
        )
    ),
    { participantId, requestedLevel: level, accepted, createdAt: Date.now() },
  ];
  let next: Session = { ...session, levelConsents: consents };
  const forLevel = consents.filter(
    (consent) => consent.requestedLevel === level
  );
  const anyRefused = forLevel.some((consent) => !consent.accepted);
  const allAccepted =
    forLevel.length >= session.participants.length &&
    forLevel.every((consent) => consent.accepted);
  if (anyRefused) {
    next = { ...next, pendingLevelUp: null };
  } else if (allAccepted) {
    next = {
      ...next,
      currentLevel: level,
      pendingLevelUp: null,
      connectionPoints: next.connectionPoints + POINTS.levelUnlocked,
    };
  }
  return next;
}

export function endSession(session: Session): Session {
  return { ...session, status: "ended", endedAt: Date.now() };
}

export function heartbeat(session: Session, participantId: string): Session {
  const now = Date.now();
  let changed = false;
  const participants = session.participants.map((participant) => {
    if (participant.id !== participantId) return participant;
    changed = true;
    return { ...participant, lastSeenAt: now, connected: true };
  });
  return changed ? { ...session, participants } : session;
}

export const PRESENCE_TIMEOUT = 12000;

export function isPresent(session: Session, participantId: string): boolean {
  const participant = session.participants.find(
    (item) => item.id === participantId
  );
  return Boolean(
    participant && Date.now() - participant.lastSeenAt < PRESENCE_TIMEOUT
  );
}

export interface CompatibilityAxis {
  key: "curiosity" | "openness" | "energy" | "alignment";
  label: string;
  score: number;
  description: string;
}

export interface CompatibilitySnapshot {
  /** Indicateur ludique basé uniquement sur la session. */
  overallScore: number;
  label: string;
  confidence: string;
  archetype: string;
  narrative: string;
  axes: CompatibilityAxis[];
  agreements: string[];
  contrasts: string[];
  nextTopic: Topic | null;
}

export interface Summary {
  durationLabel: string;
  activitiesCompleted: number;
  connectionPoints: number;
  categories: string[];
  closePredictions: number;
  favoriteActivity: string | null;
  levelReached: number;
  stage: string;
  compatibility: CompatibilitySnapshot;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function responseComparableValue(
  activity: NonNullable<ReturnType<typeof activityForSessionActivity>>,
  response: Response
): string | null {
  const value = response.optionResponse;
  if (activity.options && typeof value === "number") {
    return activity.options[value]?.trim().toLowerCase() ?? null;
  }
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.trim().toLowerCase() || null;
  const text = response.textResponse?.trim().toLowerCase();
  return text && text !== "mission" ? text : null;
}

function structuredComparison(
  historyItem: SessionActivity
): "match" | "contrast" | null {
  const activity = activityForSessionActivity(historyItem);
  if (!activity || historyItem.responses.length < 2) return null;
  if (
    ![
      "secret_choice",
      "who_of_us",
      "guess_my_answer",
      "ranking",
      "estimation",
    ].includes(activity.type)
  ) {
    return null;
  }
  const [first, second] = historyItem.responses;
  const firstValue = responseComparableValue(activity, first);
  const secondValue = responseComparableValue(activity, second);
  if (!firstValue || !secondValue) return null;
  return firstValue === secondValue ? "match" : "contrast";
}

function compatibilityLabel(score: number): string {
  if (score >= 82) return "Très belle dynamique";
  if (score >= 68) return "Connexion prometteuse";
  if (score >= 54) return "Bonne curiosité mutuelle";
  return "Découverte en construction";
}

function axisDescription(
  key: CompatibilityAxis["key"],
  score: number
): string {
  const high = score >= 72;
  const low = score < 45;
  if (key === "curiosity") {
    return high
      ? "Vous avez souvent montré l’envie d’en savoir davantage."
      : low
        ? "Vous avez surtout répondu sans encore beaucoup relancer."
        : "La curiosité était présente, avec encore de la place pour creuser.";
  }
  if (key === "openness") {
    return high
      ? "Vous avez accepté d’explorer des sujets personnels et variés."
      : low
        ? "La session est restée légère, ce qui peut être parfaitement adapté au moment."
        : "Vous avez mélangé légèreté et quelques réponses plus personnelles.";
  }
  if (key === "energy") {
    return high
      ? "La partie a avancé avec de nombreuses réactions et peu de coupures."
      : low
        ? "Le rythme était calme ou la session encore trop courte pour conclure."
        : "Le rythme était régulier, sans chercher à forcer la conversation.";
  }
  return high
    ? "Plusieurs choix ont révélé des préférences proches."
    : low
      ? "Vos différences ont créé davantage de contraste que d’accord immédiat."
      : "Vous avez trouvé certains accords tout en gardant vos différences.";
}

function buildCompatibility(
  session: Session,
  completed: SessionActivity[],
  exploredTopics: Topic[]
): CompatibilitySnapshot {
  const skippedCount = session.history.filter((item) => item.skipped).length;
  const totalPlayed = completed.length + skippedCount;
  let matches = 0;
  let contrasts = 0;
  let reactionWeight = 0;
  let writtenResponses = 0;
  let totalResponses = 0;
  let intensityTotal = 0;
  let playfulActivities = 0;
  const agreements: string[] = [];
  const contrastItems: string[] = [];

  for (const historyItem of completed) {
    const activity = activityForSessionActivity(historyItem);
    if (!activity) continue;
    intensityTotal += activity.depthLevel;
    if (
      activity.type === "mission" ||
      activity.type === "estimation" ||
      topicForActivity(activity) === "humour"
    ) {
      playfulActivities += 1;
    }

    for (const response of historyItem.responses) {
      totalResponses += 1;
      if (
        response.textResponse &&
        response.textResponse.trim().length >= 3 &&
        response.textResponse !== "mission"
      ) {
        writtenResponses += 1;
      }
    }

    for (const reaction of historyItem.reactions) {
      reactionWeight +=
        reaction.reactionType === "tell_more"
          ? 1.5
          : reaction.reactionType === "understand" ||
              reaction.reactionType === "touching"
            ? 1.2
            : reaction.reactionType === "me_too" ||
                reaction.reactionType === "unexpected"
              ? 0.9
              : 0.7;
    }

    const comparison = structuredComparison(historyItem);
    if (comparison === "match") {
      matches += 1;
      if (agreements.length < 3) agreements.push(activity.title);
    } else if (comparison === "contrast") {
      contrasts += 1;
      if (contrastItems.length < 3) contrastItems.push(activity.title);
    }
  }

  const comparisonCount = matches + contrasts;
  const curiosity = clampScore(
    34 + (completed.length ? (reactionWeight / completed.length) * 32 : 0)
  );
  const averageIntensity = completed.length
    ? intensityTotal / completed.length
    : 1;
  const noteCoverage = totalResponses ? writtenResponses / totalResponses : 0;
  const openness = clampScore(
    20 + ((averageIntensity - 1) / 3) * 58 + noteCoverage * 22
  );
  const completionRatio = totalPlayed ? completed.length / totalPlayed : 0;
  const playfulness = completed.length
    ? playfulActivities / completed.length
    : 0;
  const energy = clampScore(
    28 + completionRatio * 48 + playfulness * 14 + Math.min(10, reactionWeight * 2)
  );
  const alignment = clampScore(
    comparisonCount ? 28 + (matches / comparisonCount) * 66 : 52
  );
  const diversity = clampScore(
    completed.length
      ? Math.min(1, exploredTopics.length / Math.min(5, completed.length)) * 100
      : 0
  );
  const overallScore = clampScore(
    curiosity * 0.29 +
      openness * 0.25 +
      energy * 0.22 +
      alignment * 0.14 +
      diversity * 0.1
  );

  let archetype = "Découverte en cours";
  if (curiosity >= 72 && alignment < 52) archetype = "Contrastes stimulants";
  else if (alignment >= 74 && energy >= 68) archetype = "Complices naturels";
  else if (openness >= 72) archetype = "Duo en profondeur";
  else if (energy >= 74) archetype = "Énergie spontanée";
  else if (diversity >= 72) archetype = "Explorateurs curieux";

  const selected = selectedTopicsFor(session);
  const topicCounts = new Map<Topic, number>();
  for (const item of completed) {
    const activity = activityForSessionActivity(item);
    if (!activity) continue;
    const topic = topicForActivity(activity);
    topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
  }
  const nextTopic = [...selected]
    .filter((topic) => topic !== "sexualite" || unlockedIntensityFor(session, topic))
    .sort((a, b) => (topicCounts.get(a) ?? 0) - (topicCounts.get(b) ?? 0))[0] ?? null;

  const differenceSentence = comparisonCount
    ? `${matches} accord${matches > 1 ? "s" : ""} et ${contrasts} contraste${contrasts > 1 ? "s" : ""} visibles dans vos choix.`
    : "La session contient encore peu de choix directement comparables.";
  const narrative = `${differenceSentence} Votre force principale aujourd’hui : ${
    curiosity >= openness && curiosity >= energy
      ? "la curiosité mutuelle"
      : openness >= energy
        ? "la capacité à vous dévoiler"
        : "l’énergie de l’échange"
  }.`;

  return {
    overallScore,
    label: compatibilityLabel(overallScore),
    confidence:
      completed.length >= 10
        ? "Tendance solide sur cette session"
        : completed.length >= 5
          ? "Tendance intermédiaire"
          : "Premier aperçu",
    archetype,
    narrative,
    axes: [
      {
        key: "curiosity",
        label: "Curiosité mutuelle",
        score: curiosity,
        description: axisDescription("curiosity", curiosity),
      },
      {
        key: "openness",
        label: "Ouverture",
        score: openness,
        description: axisDescription("openness", openness),
      },
      {
        key: "energy",
        label: "Énergie de l’échange",
        score: energy,
        description: axisDescription("energy", energy),
      },
      {
        key: "alignment",
        label: "Convergences",
        score: alignment,
        description: axisDescription("alignment", alignment),
      },
    ],
    agreements,
    contrasts: contrastItems,
    nextTopic,
  };
}

export function createSummary(session: Session): Summary {
  const completed = session.history.filter(
    (historyItem) =>
      historyItem.status === "completed" || historyItem.status === "revealed"
  );
  const topics = new Set<Topic>();
  let closePredictions = 0;
  let favoriteActivity: string | null = null;
  let mostReactions = -1;
  let maxIntensity = 1;

  for (const historyItem of completed) {
    const activity = activityForSessionActivity(historyItem);
    if (!activity) continue;
    topics.add(topicForActivity(activity));
    maxIntensity = Math.max(maxIntensity, activity.depthLevel);
    if (activity.type === "guess_my_answer") {
      const [firstResponse, secondResponse] = historyItem.responses;
      if (
        firstResponse?.optionResponse != null &&
        JSON.stringify(firstResponse.optionResponse) ===
          JSON.stringify(secondResponse?.optionResponse)
      ) {
        closePredictions += 1;
      }
    }
    if (historyItem.reactions.length > mostReactions) {
      mostReactions = historyItem.reactions.length;
      favoriteActivity = activity.title;
    }
  }

  const milliseconds =
    (session.endedAt ?? Date.now()) -
    (session.startedAt ?? session.createdAt);
  const minutes = Math.max(1, Math.round(milliseconds / 60000));
  const exploredTopics = [...topics];

  return {
    durationLabel: `${minutes} min`,
    activitiesCompleted: completed.length,
    connectionPoints: session.connectionPoints,
    categories: exploredTopics,
    closePredictions,
    favoriteActivity,
    levelReached: maxIntensity,
    stage: stageFor(session.connectionPoints),
    compatibility: buildCompatibility(session, completed, exploredTopics),
  };
}

export function bothAnswered(session: Session): boolean {
  const sessionActivity = currentActivity(session);
  if (!sessionActivity) return false;
  const requiredIds = respondentIdsFor(session, sessionActivity);
  return requiredIds.every((participantId) =>
    sessionActivity.responses.some(
      (response) => response.participantId === participantId
    )
  );
}

export function hasAnswered(
  session: Session,
  participantId: string
): boolean {
  const sessionActivity = currentActivity(session);
  if (!sessionActivity) return false;
  if (!respondentIdsFor(session, sessionActivity).includes(participantId)) {
    return true;
  }
  return sessionActivity.responses.some(
    (response) => response.participantId === participantId
  );
}
