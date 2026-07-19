import { NextRequest, NextResponse } from "next/server";
import { ACTIVITIES } from "@/lib/activities";
import { eligibleActivities, type SelectionState } from "@/lib/selection";
import {
  TOPICS,
  categoryForTopic,
  contextGuidance,
  isPromptContextCompatible,
  sexualContextGuidance,
  topicForActivity,
} from "@/lib/topics";
import type {
  Activity,
  ActivityType,
  BradDecision,
  BradFocus,
  BradIntent,
  BradStrategy,
  IntensityLevel,
  SessionMode,
  Topic,
  TopicMode,
} from "@/lib/types";

export const runtime = "edge";

const CUSTOM_TYPES: ActivityType[] = [
  "open_question",
  "complete_sentence",
  "secret_choice",
  "who_of_us",
  "mission",
];
const INTENTS: BradIntent[] = ["auto", "deepen", "pivot", "surprise"];
const STRATEGIES: BradStrategy[] = ["rebound", "pivot", "surprise"];
const FOCUSES: BradFocus[] = ["shared", "individual", "cross", "bridge"];
const MODES: SessionMode[] = [
  "first_date",
  "couple",
  "friends",
  "new_meeting",
  "surprise",
];

interface Turn {
  prompt: string;
  answers: {
    participantId: string;
    displayName: string;
    value: string;
  }[];
  reactions: string[];
  type: ActivityType;
  topic: Topic;
  source: "brad" | "catalog";
  focus: string | null;
  targetParticipantId: string | null;
}

interface ParticipantInput {
  id: string;
  displayName: string;
}

interface Body {
  usedActivityIds: string[];
  recentTypes: ActivityType[];
  recentTopics: Topic[];
  recentStrategies: BradStrategy[];
  recentTargetParticipantIds: string[];
  participants: ParticipantInput[];
  allowedLevel: number;
  sessionMode: SessionMode;
  selectedTopics: Topic[];
  intensityByTopic: Partial<Record<Topic, IntensityLevel>>;
  activeTopic: Topic | null;
  topicMode: TopicMode;
  unlockedTopicIntensities: Partial<Record<Topic, IntensityLevel>>;
  intent: BradIntent;
  lastTurns: Turn[];
}

function isTopic(value: unknown): value is Topic {
  return typeof value === "string" && TOPICS.includes(value as Topic);
}

function isActivityType(value: unknown): value is ActivityType {
  return (
    typeof value === "string" &&
    CUSTOM_TYPES.includes(value as ActivityType)
  );
}

function isIntensity(value: unknown): value is IntensityLevel {
  return [1, 2, 3, 4].includes(Number(value));
}

function isFocus(value: unknown): value is BradFocus {
  return typeof value === "string" && FOCUSES.includes(value as BradFocus);
}

function normalizeAnswer(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function balancedTarget(
  participants: ParticipantInput[],
  recentTargets: string[],
  preferred: string | null
): string | null {
  if (participants.length === 0) return null;
  const ids = new Set(participants.map((participant) => participant.id));
  const previous = recentTargets.at(-1) ?? null;
  if (preferred && ids.has(preferred) && preferred !== previous) return preferred;
  const counts = new Map<string, number>();
  for (const participant of participants) counts.set(participant.id, 0);
  for (const target of recentTargets) {
    if (ids.has(target)) counts.set(target, (counts.get(target) ?? 0) + 1);
  }
  return [...participants]
    .sort((a, b) => {
      const sameAsPreviousA = a.id === previous ? 1 : 0;
      const sameAsPreviousB = b.id === previous ? 1 : 0;
      if (sameAsPreviousA !== sameAsPreviousB) {
        return sameAsPreviousA - sameAsPreviousB;
      }
      return (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0);
    })[0]?.id ?? null;
}

function shuffled<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function balancedCandidates(items: Activity[], limit: number): Activity[] {
  const groups = new Map<Topic, Activity[]>();
  for (const item of shuffled(items)) {
    const topic = topicForActivity(item);
    const group = groups.get(topic) ?? [];
    group.push(item);
    groups.set(topic, group);
  }
  const output: Activity[] = [];
  const topics = shuffled([...groups.keys()]);
  while (output.length < limit) {
    let added = false;
    for (const topic of topics) {
      const item = groups.get(topic)?.shift();
      if (!item) continue;
      output.push(item);
      added = true;
      if (output.length >= limit) break;
    }
    if (!added) break;
  }
  return output;
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function cleanText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  if (!text || text.length > maximum) return null;
  return text;
}

function cleanIntro(value: unknown): string | null {
  const intro = cleanText(value, 120);
  if (!intro) return null;
  // Une intro est une transition, pas une deuxième consigne ou question.
  if (/\?/.test(intro)) return null;
  if (/^(raconte|explique|décris|dis(?:-nous|-moi)?|réponds|parle)/i.test(intro)) {
    return null;
  }
  return intro;
}

function allowedIntensityFor(
  topic: Topic,
  intensityByTopic: Partial<Record<Topic, IntensityLevel>>,
  unlocked: Partial<Record<Topic, IntensityLevel>>,
  fallback: number
): IntensityLevel {
  const configured = intensityByTopic[topic] ??
    (Math.min(4, Math.max(1, fallback)) as IntensityLevel);
  if (topic !== "sexualite") return configured;
  const common = unlocked.sexualite ?? 0;
  return Math.min(configured, common) as IntensityLevel;
}

function parseCustomActivity(
  value: unknown,
  selectedTopics: Topic[],
  intensityByTopic: Partial<Record<Topic, IntensityLevel>>,
  unlocked: Partial<Record<Topic, IntensityLevel>>,
  fallbackLevel: number,
  activeTopic: Topic | null,
  topicMode: TopicMode,
  sessionMode: SessionMode
): Activity | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (!isActivityType(raw.type) || !isTopic(raw.topic)) return null;
  const topic = raw.topic;
  if (!selectedTopics.includes(topic)) return null;
  if (topicMode === "focused" && activeTopic && topic !== activeTopic) return null;

  const prompt = cleanText(raw.prompt, 240);
  const title = cleanText(raw.title, 70);
  if (!prompt || !title) return null;

  const depth = Number(raw.depthLevel);
  const maximum = allowedIntensityFor(
    topic,
    intensityByTopic,
    unlocked,
    fallbackLevel
  );
  if (!isIntensity(depth) || depth > maximum || maximum < 1) return null;
  if (
    !isPromptContextCompatible(
      prompt,
      sessionMode,
      topic,
      depth as IntensityLevel
    )
  ) {
    return null;
  }
  if (topic === "sexualite" && raw.type === "mission") return null;

  let options: string[] | null = null;
  if (raw.type === "secret_choice") {
    if (!Array.isArray(raw.options)) return null;
    options = raw.options
      .map((item) => cleanText(item, 60))
      .filter((item): item is string => Boolean(item));
    if (options.length < 2 || options.length > 4) return null;
  } else if (raw.type === "who_of_us") {
    options = ["Moi", "L'autre"];
  }

  let durationSeconds: number | null = null;
  if (raw.type === "mission") {
    const duration = Number(raw.durationSeconds ?? 60);
    durationSeconds = Math.min(
      90,
      Math.max(30, Number.isFinite(duration) ? duration : 60)
    );
  }

  return {
    id: `brad_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    type: raw.type,
    title,
    prompt,
    category: categoryForTopic(topic),
    topic,
    depthLevel: depth as IntensityLevel,
    durationSeconds,
    options,
    tags:
      topic === "sexualite"
        ? ["brad", "dynamic", "adult", "consent"]
        : ["brad", "dynamic"],
    active: true,
    contexts: [sessionMode],
  };
}

function fallbackDecision(): BradDecision {
  return {
    kind: "catalog",
    strategy: "pivot",
    focus: "shared",
    targetParticipantId: null,
    intro: null,
    activityId: null,
    customActivity: null,
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(fallbackDecision(), { status: 400 });
  }

  const sessionMode = MODES.includes(body.sessionMode)
    ? body.sessionMode
    : "surprise";
  const selectedTopics = (body.selectedTopics ?? []).filter(isTopic);
  if (selectedTopics.length === 0) {
    return NextResponse.json(fallbackDecision(), { status: 400 });
  }
  const recentTopics = (body.recentTopics ?? []).filter(isTopic);
  const recentTypes = Array.isArray(body.recentTypes) ? body.recentTypes : [];
  const recentStrategies = (body.recentStrategies ?? []).filter((strategy) =>
    STRATEGIES.includes(strategy)
  );
  const participants = (Array.isArray(body.participants) ? body.participants : [])
    .filter(
      (participant): participant is ParticipantInput =>
        Boolean(
          participant &&
            typeof participant.id === "string" &&
            participant.id &&
            typeof participant.displayName === "string" &&
            participant.displayName.trim()
        )
    )
    .slice(0, 2)
    .map((participant) => ({
      id: participant.id,
      displayName: participant.displayName.trim().slice(0, 40),
    }));
  const participantIds = new Set(participants.map((participant) => participant.id));
  const recentTargetParticipantIds = (
    Array.isArray(body.recentTargetParticipantIds)
      ? body.recentTargetParticipantIds
      : []
  ).filter(
    (participantId): participantId is string =>
      typeof participantId === "string" && participantIds.has(participantId)
  );
  const intent = INTENTS.includes(body.intent) ? body.intent : "auto";
  const topicMode: TopicMode = body.topicMode === "focused" ? "focused" : "mix";
  const activeTopic = isTopic(body.activeTopic) ? body.activeTopic : null;
  const intensityByTopic: Partial<Record<Topic, IntensityLevel>> = {};
  for (const topic of selectedTopics) {
    const value = body.intensityByTopic?.[topic];
    if (isIntensity(value)) intensityByTopic[topic] = value;
  }
  const unlockedTopicIntensities: Partial<Record<Topic, IntensityLevel>> = {};
  if (isIntensity(body.unlockedTopicIntensities?.sexualite)) {
    unlockedTopicIntensities.sexualite =
      body.unlockedTopicIntensities.sexualite;
  }
  const allowedLevel = Math.min(4, Math.max(1, body.allowedLevel || 2));

  const state: SelectionState = {
    usedActivityIds: Array.isArray(body.usedActivityIds)
      ? body.usedActivityIds
      : [],
    recentTypes,
    recentTopics,
    allowedLevel,
    sessionMode,
    selectedTopics,
    intensityByTopic,
    activeTopic,
    topicMode,
    unlockedTopicIntensities,
  };
  const pool = eligibleActivities(ACTIVITIES, state);
  if (pool.length === 0 || !apiKey) {
    return NextResponse.json(fallbackDecision());
  }

  const candidates = balancedCandidates(pool, 42).map((activity) => ({
    id: activity.id,
    type: activity.type,
    topic: topicForActivity(activity),
    depthLevel: activity.depthLevel,
    prompt: activity.prompt,
  }));

  const turns = Array.isArray(body.lastTurns) ? body.lastTurns.slice(-5) : [];
  const writtenContext = turns
    .map((turn, index) => {
      const answers = Array.isArray(turn.answers)
        ? turn.answers
            .filter(
              (answer) =>
                answer &&
                typeof answer.displayName === "string" &&
                typeof answer.value === "string"
            )
            .map((answer) => `${answer.displayName}: ${answer.value}`)
            .join(" | ")
        : "";
      const reactions = Array.isArray(turn.reactions)
        ? turn.reactions.filter(Boolean).join(", ")
        : "";
      return `Tour ${index + 1} [${turn.topic} · ${turn.type} · ${turn.source} · focus ${turn.focus ?? "shared"}]\nQuestion : ${turn.prompt}\nRéponses notées : ${answers || "aucune"}\nRéactions : ${reactions || "aucune"}`;
    })
    .join("\n\n");
  const hasMeaningfulContext = turns.some(
    (turn) =>
      Array.isArray(turn.answers) &&
      turn.answers.some(
        (answer) =>
          answer &&
          typeof answer.value === "string" &&
          answer.value.trim().length >= 2
      )
  );
  const lastTurn = turns.at(-1);
  const lastAnswerValues = (lastTurn?.answers ?? [])
    .map((answer) => normalizeAnswer(answer.value))
    .filter(Boolean);
  const lastAnswersDiffer =
    lastAnswerValues.length >= 2 && new Set(lastAnswerValues).size > 1;
  const lastStrategy = recentStrategies.at(-1) ?? "aucune";
  const lastTopic = recentTopics.at(-1) ?? "aucun";
  const lastType = recentTypes.at(-1) ?? "aucun";
  const focusInstruction =
    topicMode === "focused" && activeTopic
      ? `SUJET IMPOSÉ PAR LES JOUEURS : ${activeTopic}. Tu dois rester dans ce sujet jusqu'à ce qu'ils le changent.`
      : `MODE MIX : choisis uniquement parmi ${selectedTopics.join(", ")} et varie réellement.`;

  const sexualLevel = allowedIntensityFor(
    "sexualite",
    intensityByTopic,
    unlockedTopicIntensities,
    allowedLevel
  );

  const system = `Tu es Brad, animateur subtil de ThankBrad, un jeu de conversation à deux.
Ta prochaine question doit être intéressante, naturelle et parfaitement compatible avec le contexte et les réglages des joueurs.

CONTEXTE HUMAIN OBLIGATOIRE :
${contextGuidance(sessionMode)}
Ne formule jamais une question de couple pour un premier rendez-vous, ni une question romantique pour des amis, sauf si le sujet choisi l'exige explicitement.

SUJETS ET INTENSITÉS :
${selectedTopics
  .map(
    (topic) =>
      `- ${topic}: niveau maximum ${allowedIntensityFor(
        topic,
        intensityByTopic,
        unlockedTopicIntensities,
        allowedLevel
      )}`
  )
  .join("\n")}
${focusInstruction}
Le niveau est une limite absolue : tu ne dois jamais la dépasser.

RYTHME :
- REBOND : creuse un détail précis d'une réponse écrite, au maximum une fois de suite.
- PIVOT : change clairement de sujet en mode mix, tout en gardant une transition naturelle.
- SURPRISE : question imagée, inattendue ou ludique.
- Sans réponse écrite exploitable, ne prétends jamais avoir entendu la conversation orale.

DISTRIBUTION DE LA PAROLE :
- shared : les deux répondent.
- individual : une seule personne répond à une question centrée sur sa propre réponse.
- cross : une seule personne réagit à la réponse ou au choix de l'autre.
- bridge : les deux cherchent un lien, un compromis ou expliquent leur différence.
- Quand les deux dernières réponses sont différentes et que l'intention est deepen, privilégie individual, cross ou bridge plutôt qu'une nouvelle question générale.
- Ne cible jamais la même personne deux zooms de suite. Répartis la parole équitablement.
- individual et cross exigent une question custom de type open_question ou complete_sentence.
- Pour individual ou cross, targetParticipantId est obligatoire. Pour shared ou bridge, il doit être null.
- Ne juge jamais une réponse et ne présente jamais une différence comme un défaut.

QUALITÉ :
- intro est uniquement une transition courte : aucune question, aucun impératif, aucune demande de raconter ou d'expliquer ;
- une question concrète, facile à comprendre et qui provoque une anecdote, un choix, une révélation ou un débat ;
- 12 à 32 mots idéalement, une seule idée ;
- évite les questions plates du type « quel est ton préféré ? » ;
- pas de diagnostic, pas de pression, pas de traumatisme exigé.

SEXUALITÉ 18+ :
- Elle n'est autorisée que si le sujet sexualite figure dans le pool et au niveau commun ${sexualLevel}.
- RÈGLE CONTEXTUELLE PRIORITAIRE : ${sexualContextGuidance(sessionMode, sexualLevel)}
- Niveau 1 : flirt et attirance, sans acte sexuel raconté ; 2 : intime ; 3 : explicite ; 4 : très explicite et direct.
- Tu peux employer un vocabulaire sexuel explicite au niveau 3 ou 4.
- Toujours une question à discuter, jamais un défi sexuel à réaliser.
- Interdits : mineurs, absence de consentement, coercition, inceste, actes illégaux ou dangereux, humiliation imposée.
- Les limites, le consentement et la possibilité de passer restent centraux.

FORMATS DYNAMIQUES : open_question, complete_sentence, secret_choice, who_of_us, mission.
Aucune mission si le sujet est sexualite.

Réponds STRICTEMENT en JSON valide :
{
  "strategy": "rebound|pivot|surprise",
  "focus": "shared|individual|cross|bridge",
  "targetParticipantId": "id exact d'un joueur ou null",
  "intro": "transition de 4 à 16 mots ou null",
  "kind": "custom|catalog",
  "activityId": "act_000 ou null",
  "customActivity": {
    "type": "open_question|complete_sentence|secret_choice|who_of_us|mission",
    "topic": "leger|humour|voyages|souvenirs|personnalite|valeurs|philosophie|emotions|reves|relations|intimite|sexualite",
    "depthLevel": 1,
    "title": "titre court",
    "prompt": "question forte",
    "options": null,
    "durationSeconds": null
  }
}
Pour catalog, focus=shared, targetParticipantId=null et customActivity=null. Pour custom, activityId=null.`;

  const user = `CONTEXTE : ${sessionMode}
INTENTION DES JOUEURS : ${intent}
RÉPONSES ÉCRITES EXPLOITABLES : ${hasMeaningfulContext ? "oui" : "non"}
DERNIÈRES RÉPONSES DIFFÉRENTES : ${lastAnswersDiffer ? "oui" : "non"}
DERNIÈRE STRATÉGIE : ${lastStrategy}
DERNIER SUJET : ${lastTopic}
DERNIER FORMAT : ${lastType}
JOUEURS : ${participants
  .map((participant) => `${participant.displayName} (${participant.id})`)
  .join(" ; ") || "inconnus"}
DERNIÈRES PERSONNES CIBLÉES : ${recentTargetParticipantIds.join(", ") || "aucune"}
${focusInstruction}

DERNIERS TOURS :
${writtenContext || "Début de partie : aucun échange exploitable."}

ACTIVITÉS ÉDITORIALES AUTORISÉES :
${candidates
  .map(
    (candidate) =>
      `${candidate.id} — [${candidate.topic} · ${candidate.type} · niveau ${candidate.depthLevel}] ${candidate.prompt}`
  )
  .join("\n")}

Décide maintenant. En deepen, rebondis uniquement si une réponse écrite le permet. Si les réponses diffèrent, exploite cette différence avec un zoom individuel, une réaction croisée ou une question de rapprochement. En pivot, change de sujet seulement en mode mix. En focused, reste dans le sujet imposé mais change d'angle. En surprise, crée un contraste mémorable.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 460,
        temperature: 0.88,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!response.ok) return NextResponse.json(fallbackDecision());

    const data = await response.json();
    const text: string =
      data?.content
        ?.map((block: { text?: string }) => block.text ?? "")
        .join("") ?? "";
    const parsed = extractJson(text);
    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json(fallbackDecision());
    }

    const raw = parsed as Record<string, unknown>;
    const strategy = STRATEGIES.includes(raw.strategy as BradStrategy)
      ? (raw.strategy as BradStrategy)
      : intent === "surprise"
        ? "surprise"
        : intent === "deepen" &&
            hasMeaningfulContext &&
            lastStrategy !== "rebound"
          ? "rebound"
          : "pivot";
    const intro = cleanIntro(raw.intro);
    const kind = raw.kind === "custom" ? "custom" : "catalog";

    let focus: BradFocus = isFocus(raw.focus)
      ? raw.focus
      : intent === "deepen" && hasMeaningfulContext && lastAnswersDiffer
        ? "individual"
        : "shared";
    let targetParticipantId: string | null = null;
    if (focus === "individual" || focus === "cross") {
      const requestedTarget =
        typeof raw.targetParticipantId === "string"
          ? raw.targetParticipantId
          : null;
      targetParticipantId = balancedTarget(
        participants,
        recentTargetParticipantIds,
        requestedTarget
      );
      if (!targetParticipantId || !hasMeaningfulContext) {
        focus = "shared";
        targetParticipantId = null;
      }
    }

    if (kind === "catalog") {
      const activityId =
        typeof raw.activityId === "string" ? raw.activityId : null;
      if (activityId && pool.some((activity) => activity.id === activityId)) {
        return NextResponse.json({
          kind: "catalog",
          strategy,
          focus: "shared",
          targetParticipantId: null,
          intro,
          activityId,
          customActivity: null,
        } satisfies BradDecision);
      }
      return NextResponse.json(fallbackDecision());
    }

    const customActivity = parseCustomActivity(
      raw.customActivity,
      selectedTopics,
      intensityByTopic,
      unlockedTopicIntensities,
      allowedLevel,
      activeTopic,
      topicMode,
      sessionMode
    );
    if (!customActivity) return NextResponse.json(fallbackDecision());

    if (
      (focus === "individual" || focus === "cross") &&
      !["open_question", "complete_sentence"].includes(customActivity.type)
    ) {
      focus = "shared";
      targetParticipantId = null;
    }

    return NextResponse.json({
      kind: "custom",
      strategy,
      focus,
      targetParticipantId,
      intro,
      activityId: null,
      customActivity,
    } satisfies BradDecision);
  } catch {
    return NextResponse.json(fallbackDecision());
  }
}
