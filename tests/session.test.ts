import { describe, expect, it } from "vitest";
import {
  appendBradDecision,
  changeTopicNow,
  createSession,
  createSummary,
  currentActivity,
  endSession,
  joinSession,
  requestTopicChange,
  skipActivity,
  startSession,
  submitResponse,
  submitTopicConsent,
} from "@/lib/session-logic";
import { topicForActivity } from "@/lib/topics";
import { activityForSessionActivity } from "@/lib/activities";
import type { BradDecision, Session } from "@/lib/types";

function twoPlayerSession(options?: {
  sexual?: boolean;
  sexualLevel?: 1 | 2 | 3 | 4;
}): { session: Session; host: string; guest: string } {
  const selectedTopics = options?.sexual
    ? (["humour", "sexualite"] as const)
    : (["humour", "valeurs", "philosophie"] as const);
  let session = createSession(
    "first_date",
    15,
    {
      anonymousUserId: "u1",
      displayName: "Alex",
      avatar: "🦊",
    },
    "brad",
    {
      selectedTopics: [...selectedTopics],
      intensityByTopic: {
        humour: 1,
        valeurs: 3,
        philosophie: 3,
        sexualite: options?.sexualLevel ?? 1,
      },
    }
  );
  const host = session.hostId;
  const joined = joinSession(session, { displayName: "Sam", avatar: "🐬" });
  if ("error" in joined) throw new Error("join failed");
  session = joined.session;
  return { session, host, guest: joined.participantId };
}

describe("createSession V3", () => {
  it("stores context, topics and per-topic intensities", () => {
    const session = createSession(
      "couple",
      5,
      {
        anonymousUserId: "u1",
        displayName: "Alex",
        avatar: "🦊",
      },
      "classic",
      {
        selectedTopics: ["emotions", "intimite"],
        intensityByTopic: { emotions: 3, intimite: 2 },
      }
    );
    expect(session.code).toHaveLength(6);
    expect(session.guideMode).toBe("classic");
    expect(session.selectedTopics).toEqual(["emotions", "intimite"]);
    expect(session.intensityByTopic?.emotions).toBe(3);
    expect(session.topicMode).toBe("mix");
  });
});

describe("session basics", () => {
  it("refuses a third participant", () => {
    const { session } = twoPlayerSession();
    const result = joinSession(session, { displayName: "Robin", avatar: "🦉" });
    expect("error" in result).toBe(true);
  });

  it("starts with an eligible activity", () => {
    const { session } = twoPlayerSession();
    const started = startSession(session);
    expect(started.status).toBe("playing");
    expect(currentActivity(started)).not.toBeNull();
  });

  it("reveals only after both answer", () => {
    const { session, host, guest } = twoPlayerSession();
    let current = startSession(session);
    current = submitResponse(current, host, {
      textResponse: "Ma réponse",
      optionResponse: null,
    });
    expect(currentActivity(current)!.status).toBe("active");
    current = submitResponse(current, guest, {
      textResponse: "Une autre réponse",
      optionResponse: null,
    });
    expect(currentActivity(current)!.status).toBe("revealed");
  });

  it("skips and advances", () => {
    const { session } = twoPlayerSession();
    let current = startSession(session);
    const first = current.currentSessionActivityId;
    current = skipActivity(current);
    expect(current.currentSessionActivityId).not.toBe(first);
  });
});

describe("topic control", () => {
  it("changes immediately to an explicitly selected non-sexual topic", () => {
    const { session } = twoPlayerSession();
    let current = startSession(session);
    current = changeTopicNow(current, "philosophie");
    const activity = activityForSessionActivity(currentActivity(current)!);
    expect(current.topicMode).toBe("focused");
    expect(current.activeTopic).toBe("philosophie");
    expect(topicForActivity(activity!)).toBe("philosophie");
  });

  it("can return to automatic mix", () => {
    const { session } = twoPlayerSession();
    let current = startSession(session);
    current = changeTopicNow(current, "valeurs");
    current = changeTopicNow(current, null);
    expect(current.topicMode).toBe("mix");
    expect(current.activeTopic).toBeNull();
  });
});

describe("sexuality adult consent", () => {
  it("does not change topic before both adults consent", () => {
    const { session, host } = twoPlayerSession({ sexual: true, sexualLevel: 4 });
    let current = startSession(session);
    const activityBefore = current.currentSessionActivityId;
    current = requestTopicChange(current, host, "sexualite");
    expect(current.pendingTopicConsent?.topic).toBe("sexualite");
    expect(current.currentSessionActivityId).toBe(activityBefore);
    expect(current.unlockedTopicIntensities?.sexualite).toBeUndefined();
  });

  it("uses the lowest secretly accepted level", () => {
    const { session, host, guest } = twoPlayerSession({
      sexual: true,
      sexualLevel: 4,
    });
    let current = startSession(session);
    current = requestTopicChange(current, host, "sexualite");
    current = submitTopicConsent(current, host, true, true, 4);
    expect(current.pendingTopicConsent).not.toBeNull();
    current = submitTopicConsent(current, guest, true, true, 2);
    expect(current.pendingTopicConsent).toBeNull();
    expect(current.unlockedTopicIntensities?.sexualite).toBe(2);
    expect(current.activeTopic).toBe("sexualite");
    const activity = activityForSessionActivity(currentActivity(current)!);
    expect(topicForActivity(activity!)).toBe("sexualite");
    expect(activity!.depthLevel).toBeLessThanOrEqual(2);
  });

  it("cancels sexuality when one person refuses", () => {
    const { session, host, guest } = twoPlayerSession({ sexual: true, sexualLevel: 4 });
    let current = startSession(session);
    current = requestTopicChange(current, host, "sexualite");
    current = submitTopicConsent(current, host, true, true, 4);
    current = submitTopicConsent(current, guest, false, false, 1);
    expect(current.pendingTopicConsent).toBeNull();
    expect(current.unlockedTopicIntensities?.sexualite).toBeUndefined();
    expect(current.activeTopic).not.toBe("sexualite");
  });
});

describe("Brad dynamic activities", () => {
  function completedFocusedSession(): Session {
    const { session, host, guest } = twoPlayerSession();
    let current = startSession(session);
    current = changeTopicNow(current, "philosophie");
    current = submitResponse(current, host, {
      textResponse: "La liberté compte plus que la sécurité",
      optionResponse: null,
    });
    current = submitResponse(current, guest, {
      textResponse: "Je choisis plutôt la stabilité",
      optionResponse: null,
    });
    const active = currentActivity(current)!;
    return {
      ...current,
      history: current.history.map((item) =>
        item.id === active.id ? { ...item, status: "completed" as const } : item
      ),
    };
  }

  it("accepts a custom question in the focused topic and intensity", () => {
    let session = completedFocusedSession();
    const decision: BradDecision = {
      kind: "custom",
      strategy: "rebound",
      focus: "individual",
      targetParticipantId: session.participants[1].id,
      intro: "Vous n'accordez pas le même prix à la liberté.",
      activityId: null,
      customActivity: {
        id: "brad_philo_test",
        type: "open_question",
        title: "Prix de la liberté",
        prompt: "Quelle sécurité serais-tu réellement prêt·e à perdre pour te sentir plus libre ?",
        category: "philosophie",
        topic: "philosophie",
        depthLevel: 3,
        durationSeconds: null,
        options: null,
        tags: ["brad"],
        active: true,
        contexts: ["first_date"],
      },
    };
    session = appendBradDecision(session, decision);
    expect(currentActivity(session)!.customActivity?.topic).toBe("philosophie");
  });

  it("lets Brad give the floor to one person without waiting for both", () => {
    let session = completedFocusedSession();
    const target = session.participants[1].id;
    const other = session.participants[0].id;
    const decision: BradDecision = {
      kind: "custom",
      strategy: "rebound",
      focus: "individual",
      targetParticipantId: target,
      intro: "Vos réponses montrent deux priorités différentes.",
      activityId: null,
      customActivity: {
        id: "brad_individual_test",
        type: "open_question",
        title: "Zoom individuel",
        prompt: "Quel prix serais-tu réellement prêt à payer pour préserver ce choix ?",
        category: "philosophie",
        topic: "philosophie",
        depthLevel: 3,
        durationSeconds: null,
        options: null,
        tags: ["brad"],
        active: true,
        contexts: ["first_date"],
      },
    };
    session = appendBradDecision(session, decision);
    const before = currentActivity(session)!;
    expect(before.bradTargetParticipantId).toBe(target);
    session = submitResponse(session, other, {
      textResponse: "Je ne devrais pas répondre",
      optionResponse: null,
    });
    expect(currentActivity(session)!.responses).toHaveLength(0);
    session = submitResponse(session, target, {
      textResponse: "Je renoncerais au statut, pas à ma paix",
      optionResponse: null,
    });
    expect(currentActivity(session)!.status).toBe("revealed");
    expect(currentActivity(session)!.responses).toHaveLength(1);
  });

  it("rejects a custom question outside the focused topic", () => {
    let session = completedFocusedSession();
    const decision: BradDecision = {
      kind: "custom",
      strategy: "pivot",
      focus: "shared",
      targetParticipantId: null,
      intro: null,
      activityId: null,
      customActivity: {
        id: "brad_wrong_topic",
        type: "open_question",
        title: "Voyage",
        prompt: "Dans quel pays partirais-tu demain ?",
        category: "voyages",
        topic: "voyages",
        depthLevel: 2,
        durationSeconds: null,
        options: null,
        tags: ["brad"],
        active: true,
      },
    };
    session = appendBradDecision(session, decision);
    const activity = activityForSessionActivity(currentActivity(session)!);
    expect(topicForActivity(activity!)).toBe("philosophie");
    expect(currentActivity(session)!.customActivity?.id).not.toBe("brad_wrong_topic");
  });
});

describe("summary", () => {
  it("summarises explored topics and maximum intensity", () => {
    const { session, host, guest } = twoPlayerSession();
    let current = startSession(session);
    current = submitResponse(current, host, { textResponse: "A", optionResponse: null });
    current = submitResponse(current, guest, { textResponse: "B", optionResponse: null });
    current = endSession(current);
    const summary = createSummary(current);
    expect(summary.activitiesCompleted).toBeGreaterThanOrEqual(1);
    expect(summary.categories.length).toBeGreaterThanOrEqual(1);
    expect(summary.levelReached).toBeGreaterThanOrEqual(1);
    expect(summary.compatibility.overallScore).toBeGreaterThanOrEqual(0);
    expect(summary.compatibility.overallScore).toBeLessThanOrEqual(100);
    expect(summary.compatibility.axes).toHaveLength(4);
  });
});
