import { describe, expect, it } from "vitest";
import { ACTIVITIES } from "@/lib/activities";
import {
  eligibleActivities,
  selectNextActivity,
  type SelectionState,
} from "@/lib/selection";
import { isPromptContextCompatible, topicForActivity } from "@/lib/topics";
import type { Activity, IntensityLevel, Topic } from "@/lib/types";

const rand0 = () => 0;
const NON_SEXUAL_TOPICS: Topic[] = [
  "leger",
  "humour",
  "voyages",
  "souvenirs",
  "personnalite",
  "valeurs",
  "philosophie",
  "emotions",
  "reves",
  "relations",
  "intimite",
];

function baseState(overrides: Partial<SelectionState> = {}): SelectionState {
  const intensityByTopic = Object.fromEntries(
    NON_SEXUAL_TOPICS.map((topic) => [topic, 4 as IntensityLevel])
  ) as Partial<Record<Topic, IntensityLevel>>;
  return {
    usedActivityIds: [],
    recentTypes: [],
    recentTopics: [],
    allowedLevel: 4,
    sessionMode: "surprise",
    selectedTopics: NON_SEXUAL_TOPICS,
    intensityByTopic,
    topicMode: "mix",
    activeTopic: null,
    unlockedTopicIntensities: {},
    ...overrides,
  };
}

describe("eligibleActivities V3", () => {
  it("excludes activities already used", () => {
    const used = ACTIVITIES[0].id;
    const pool = eligibleActivities(
      ACTIVITIES,
      baseState({ usedActivityIds: [used] })
    );
    expect(pool.some((activity) => activity.id === used)).toBe(false);
  });

  it("respects intensity per topic", () => {
    const pool = eligibleActivities(
      ACTIVITIES,
      baseState({
        selectedTopics: ["philosophie"],
        intensityByTopic: { philosophie: 2 },
        topicMode: "focused",
        activeTopic: "philosophie",
      })
    );
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((activity) => topicForActivity(activity) === "philosophie")).toBe(true);
    expect(pool.every((activity) => activity.depthLevel <= 2)).toBe(true);
  });

  it("blocks a third open question in a row", () => {
    const pool = eligibleActivities(
      ACTIVITIES,
      baseState({ recentTypes: ["open_question", "open_question"] })
    );
    expect(pool.some((activity) => activity.type === "open_question")).toBe(false);
  });

  it("keeps a focused topic until players change it", () => {
    const pool = eligibleActivities(
      ACTIVITIES,
      baseState({
        selectedTopics: ["humour", "valeurs"],
        intensityByTopic: { humour: 4, valeurs: 4 },
        topicMode: "focused",
        activeTopic: "valeurs",
      })
    );
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((activity) => topicForActivity(activity) === "valeurs")).toBe(true);
  });

  it("never exposes sexuality before common adult consent", () => {
    const pool = eligibleActivities(
      ACTIVITIES,
      baseState({
        selectedTopics: ["sexualite"],
        intensityByTopic: { sexualite: 4 },
        topicMode: "focused",
        activeTopic: "sexualite",
        unlockedTopicIntensities: {},
      })
    );
    expect(pool).toHaveLength(0);
  });

  it("limits sexuality to the common unlocked level", () => {
    const pool = eligibleActivities(
      ACTIVITIES,
      baseState({
        selectedTopics: ["sexualite"],
        intensityByTopic: { sexualite: 4 },
        topicMode: "focused",
        activeTopic: "sexualite",
        unlockedTopicIntensities: { sexualite: 2 },
      })
    );
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((activity) => topicForActivity(activity) === "sexualite")).toBe(true);
    expect(pool.every((activity) => activity.depthLevel <= 2)).toBe(true);
  });

  it("keeps first-date sexuality level 1 genuinely suggestive", () => {
    const pool = eligibleActivities(
      ACTIVITIES,
      baseState({
        sessionMode: "first_date",
        selectedTopics: ["sexualite"],
        intensityByTopic: { sexualite: 1 },
        topicMode: "focused",
        activeTopic: "sexualite",
        unlockedTopicIntensities: { sexualite: 1 },
      })
    );
    expect(pool.length).toBeGreaterThanOrEqual(5);
    expect(pool.every((activity) => activity.depthLevel === 1)).toBe(true);
    expect(
      pool.every((activity) =>
        isPromptContextCompatible(
          activity.prompt,
          "first_date",
          "sexualite",
          1
        )
      )
    ).toBe(true);
    expect(
      pool.some((activity) => /faire l'amour|rapport sexuel|position sexuelle/i.test(activity.prompt))
    ).toBe(false);
  });

  it("rejects a shared physical-history assumption on a first date", () => {
    expect(
      isPromptContextCompatible(
        "Décris un moment où une caresse a complètement basculé l'attirance entre vous deux.",
        "first_date",
        "sexualite",
        1
      )
    ).toBe(false);
    expect(
      isPromptContextCompatible(
        "Quel détail peut te faire sentir qu'une attirance devient réciproque ?",
        "first_date",
        "sexualite",
        1
      )
    ).toBe(true);
  });

  it("applies context-specific formulations", () => {
    const firstDatePool = eligibleActivities(
      ACTIVITIES,
      baseState({ sessionMode: "first_date" })
    );
    const coupleOnly = ACTIVITIES.find((activity) =>
      activity.tags.includes("context:couple")
    );
    expect(coupleOnly).toBeDefined();
    expect(firstDatePool.some((activity) => activity.id === coupleOnly!.id)).toBe(false);

    const couplePool = eligibleActivities(
      ACTIVITIES,
      baseState({ sessionMode: "couple" })
    );
    expect(couplePool.some((activity) => activity.id === coupleOnly!.id)).toBe(true);
  });

  it("avoids repeating the same topic immediately in mix mode", () => {
    const pool = eligibleActivities(
      ACTIVITIES,
      baseState({ recentTopics: ["voyages"] })
    );
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((activity) => topicForActivity(activity) !== "voyages")).toBe(true);
  });
});

describe("selectNextActivity V3", () => {
  it("never returns an already used activity", () => {
    const pick = selectNextActivity(
      ACTIVITIES,
      baseState({ usedActivityIds: ACTIVITIES.map((activity) => activity.id) }),
      rand0
    );
    expect(pick).toBeNull();
  });

  it("alternates formats", () => {
    const pick = selectNextActivity(
      ACTIVITIES,
      baseState({ recentTypes: ["secret_choice"] }),
      rand0
    );
    expect(pick).not.toBeNull();
    expect(pick!.type).not.toBe("secret_choice");
  });

  it("never repeats an activity during a long run", () => {
    let state = baseState();
    const seen = new Set<string>();
    let pick: Activity | null;
    let guard = 0;
    while ((pick = selectNextActivity(ACTIVITIES, state, () => 0.5)) && guard < 500) {
      expect(seen.has(pick.id)).toBe(false);
      seen.add(pick.id);
      state = {
        ...state,
        usedActivityIds: [...state.usedActivityIds, pick.id],
        recentTypes: [...state.recentTypes, pick.type],
        recentTopics: [...(state.recentTopics ?? []), topicForActivity(pick)],
      };
      guard += 1;
    }
    expect(seen.size).toBeGreaterThan(80);
  });

  it("does not repeat a topic consecutively in mix mode while alternatives exist", () => {
    let state = baseState();
    const topics: Topic[] = [];
    let pick: Activity | null;
    let guard = 0;
    while ((pick = selectNextActivity(ACTIVITIES, state, Math.random)) && guard < 150) {
      const topic = topicForActivity(pick);
      topics.push(topic);
      state = {
        ...state,
        usedActivityIds: [...state.usedActivityIds, pick.id],
        recentTypes: [...state.recentTypes, pick.type],
        recentTopics: [...(state.recentTopics ?? []), topic],
      };
      guard += 1;
    }
    for (let index = 1; index < topics.length; index += 1) {
      expect(topics[index]).not.toBe(topics[index - 1]);
    }
  });
});

describe("catalogue V3", () => {
  it("contains at least 250 active activities", () => {
    expect(ACTIVITIES.filter((activity) => activity.active).length).toBeGreaterThanOrEqual(250);
  });

  it("contains all four sexuality intensity levels", () => {
    const levels = new Set(
      ACTIVITIES.filter((activity) => topicForActivity(activity) === "sexualite").map(
        (activity) => activity.depthLevel
      )
    );
    expect([...levels].sort()).toEqual([1, 2, 3, 4]);
  });

  it("never contains a sexual mission", () => {
    expect(
      ACTIVITIES.some(
        (activity) =>
          topicForActivity(activity) === "sexualite" && activity.type === "mission"
      )
    ).toBe(false);
  });

  it("gives every structured activity its options", () => {
    const optionTypes = ["secret_choice", "who_of_us", "ranking"];
    for (const activity of ACTIVITIES) {
      if (optionTypes.includes(activity.type)) {
        expect(Array.isArray(activity.options)).toBe(true);
        expect(activity.options!.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
