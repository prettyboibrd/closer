import type {
  Activity,
  ActivityType,
  IntensityLevel,
  SessionMode,
  Topic,
  TopicMode,
} from "./types";
import { isPromptContextCompatible, topicForActivity } from "./topics";

export const RECOMMENDED_ORDER: ActivityType[] = [
  "open_question",
  "who_of_us",
  "guess_my_answer",
  "mission",
  "secret_choice",
  "estimation",
  "ranking",
  "complete_sentence",
];

export interface SelectionState {
  usedActivityIds: string[];
  recentTypes: ActivityType[];
  recentTopics?: Topic[];
  /** Ancien nom accepté dans les tests/sessions V2. */
  recentCategories?: Topic[];
  allowedLevel: number;
  sessionMode?: SessionMode;
  selectedTopics?: Topic[];
  intensityByTopic?: Partial<Record<Topic, IntensityLevel>>;
  activeTopic?: Topic | null;
  topicMode?: TopicMode;
  unlockedTopicIntensities?: Partial<Record<Topic, IntensityLevel>>;
}

function allowedIntensity(state: SelectionState, topic: Topic): number {
  const configured = state.intensityByTopic?.[topic] ?? state.allowedLevel;
  if (topic !== "sexualite") return configured;
  const unlocked = state.unlockedTopicIntensities?.sexualite;
  if (!unlocked) return 0;
  return Math.min(configured, unlocked);
}

function contextCompatible(activity: Activity, state: SelectionState): boolean {
  if (!state.sessionMode) return true;
  if (activity.contexts?.length && !activity.contexts.includes(state.sessionMode)) {
    return false;
  }
  return isPromptContextCompatible(
    activity.prompt,
    state.sessionMode,
    topicForActivity(activity),
    activity.depthLevel
  );
}

function baseEligibleActivities(
  activities: Activity[],
  state: SelectionState
): Activity[] {
  const used = new Set(state.usedActivityIds);
  const lastTwo = state.recentTypes.slice(-2);
  const twoOpenInARow =
    lastTwo.length === 2 && lastTwo.every((t) => t === "open_question");
  const selected = state.selectedTopics?.length
    ? new Set(state.selectedTopics)
    : null;
  const focusedTopic =
    state.topicMode === "focused" ? state.activeTopic ?? null : null;

  return activities.filter((activity) => {
    if (!activity.active) return false;
    if (used.has(activity.id)) return false;
    if (!contextCompatible(activity, state)) return false;

    const topic = topicForActivity(activity);
    if (selected && !selected.has(topic)) return false;
    if (focusedTopic && topic !== focusedTopic) return false;
    if (activity.depthLevel > allowedIntensity(state, topic)) return false;
    if (twoOpenInARow && activity.type === "open_question") return false;
    return true;
  });
}

/**
 * En mode mix, évite de rester dans le même sujet ou de surexploiter un sujet.
 * En mode ciblé, le choix explicite des joueurs prime sur la rotation.
 */
export function diversifyByTopic(
  pool: Activity[],
  recentTopics: Topic[] = [],
  focused = false
): Activity[] {
  if (focused || pool.length === 0 || recentTopics.length === 0) return pool;

  let diversified = pool;
  const lastTopic = recentTopics.at(-1);

  if (lastTopic) {
    const withoutImmediateRepeat = diversified.filter(
      (activity) => topicForActivity(activity) !== lastTopic
    );
    if (withoutImmediateRepeat.length > 0) diversified = withoutImmediateRepeat;
  }

  const counts = new Map<Topic, number>();
  for (const topic of recentTopics.slice(-6)) {
    counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }
  const overused = new Set(
    [...counts.entries()]
      .filter(([, count]) => count >= 2)
      .map(([topic]) => topic)
  );

  if (overused.size > 0) {
    const withoutOverused = diversified.filter(
      (activity) => !overused.has(topicForActivity(activity))
    );
    if (withoutOverused.length > 0) diversified = withoutOverused;
  }

  return diversified;
}

export function eligibleActivities(
  activities: Activity[],
  state: SelectionState
): Activity[] {
  const recent = state.recentTopics ?? state.recentCategories ?? [];
  return diversifyByTopic(
    baseEligibleActivities(activities, state),
    recent,
    state.topicMode === "focused" && Boolean(state.activeTopic)
  );
}

export function selectNextActivity(
  activities: Activity[],
  state: SelectionState,
  rand: () => number = Math.random
): Activity | null {
  const pool = eligibleActivities(activities, state);
  if (pool.length === 0) return null;

  const lastType = state.recentTypes.at(-1);
  let order = RECOMMENDED_ORDER;
  if (lastType) {
    const index = RECOMMENDED_ORDER.indexOf(lastType);
    if (index >= 0) {
      order = [
        ...RECOMMENDED_ORDER.slice(index + 1),
        ...RECOMMENDED_ORDER.slice(0, index + 1),
      ];
    }
  }

  for (const type of order) {
    if (type === lastType) continue;
    const candidates = pool.filter((activity) => activity.type === type);
    if (candidates.length > 0) {
      return candidates[Math.floor(rand() * candidates.length)];
    }
  }

  const differing = pool.filter((activity) => activity.type !== lastType);
  const finalPool = differing.length > 0 ? differing : pool;
  return finalPool[Math.floor(rand() * finalPool.length)];
}
