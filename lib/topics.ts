import type {
  Activity,
  Category,
  IntensityLevel,
  Session,
  SessionMode,
  Topic,
} from "./types";

export const TOPICS: Topic[] = [
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
  "sexualite",
];

export const TOPIC_LABELS: Record<Topic, string> = {
  leger: "Léger",
  humour: "Humour",
  voyages: "Voyages",
  souvenirs: "Souvenirs",
  personnalite: "Personnalité",
  valeurs: "Valeurs",
  philosophie: "Philosophie",
  emotions: "Émotions",
  reves: "Rêves & avenir",
  relations: "Relations",
  intimite: "Intimité",
  sexualite: "Sexualité 18+",
};

export const TOPIC_ICONS: Record<Topic, string> = {
  leger: "☀️",
  humour: "😄",
  voyages: "🌍",
  souvenirs: "📸",
  personnalite: "🧠",
  valeurs: "🧭",
  philosophie: "💭",
  emotions: "❤️",
  reves: "🌙",
  relations: "🤝",
  intimite: "🔥",
  sexualite: "🌶️",
};

export const TOPIC_DESCRIPTIONS: Record<Topic, string> = {
  leger: "Préférences, quotidien et petites découvertes.",
  humour: "Questions absurdes, anecdotes et complicité.",
  voyages: "Ailleurs, aventures et cultures.",
  souvenirs: "Enfance, moments marquants et nostalgie.",
  personnalite: "Habitudes, réactions et manière d’être.",
  valeurs: "Ce qui compte vraiment dans vos décisions.",
  philosophie: "Vie, liberté, bonheur, temps et sens.",
  emotions: "Ressentis, vulnérabilité et besoins affectifs.",
  reves: "Ambitions, projets et futur imaginé.",
  relations: "Confiance, communication et liens humains.",
  intimite: "Attirance, affection, proximité et limites.",
  sexualite: "Questions sexuelles adultes, du suggestif au très explicite.",
};

export const GENERAL_INTENSITY_LABELS: Record<IntensityLevel, string> = {
  1: "Léger",
  2: "Personnel",
  3: "Profond",
  4: "Sans filtre",
};

export const SEXUAL_INTENSITY_LABELS: Record<IntensityLevel, string> = {
  1: "Suggestif",
  2: "Intime",
  3: "Explicite",
  4: "Très explicite",
};

export function intensityLabel(topic: Topic, level: IntensityLevel): string {
  return topic === "sexualite"
    ? SEXUAL_INTENSITY_LABELS[level]
    : GENERAL_INTENSITY_LABELS[level];
}

export const DEFAULT_TOPICS_BY_MODE: Record<SessionMode, Topic[]> = {
  first_date: [
    "humour",
    "personnalite",
    "valeurs",
    "emotions",
    "reves",
    "voyages",
    "intimite",
  ],
  couple: [
    "humour",
    "souvenirs",
    "valeurs",
    "emotions",
    "relations",
    "intimite",
    "reves",
  ],
  friends: [
    "humour",
    "souvenirs",
    "personnalite",
    "valeurs",
    "philosophie",
    "reves",
  ],
  new_meeting: ["leger", "humour", "voyages", "personnalite"],
  surprise: [
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
  ],
};

const BASE_INTENSITY: Record<Topic, IntensityLevel> = {
  leger: 1,
  humour: 1,
  voyages: 2,
  souvenirs: 2,
  personnalite: 2,
  valeurs: 2,
  philosophie: 2,
  emotions: 2,
  reves: 2,
  relations: 2,
  intimite: 1,
  sexualite: 1,
};

export function defaultIntensityByMode(
  mode: SessionMode
): Partial<Record<Topic, IntensityLevel>> {
  const result: Partial<Record<Topic, IntensityLevel>> = { ...BASE_INTENSITY };
  if (mode === "couple") {
    result.souvenirs = 3;
    result.emotions = 3;
    result.relations = 3;
    result.intimite = 2;
  }
  if (mode === "first_date") {
    result.valeurs = 3;
    result.emotions = 2;
    result.intimite = 1;
  }
  if (mode === "friends") {
    result.souvenirs = 3;
    result.philosophie = 3;
  }
  if (mode === "new_meeting") {
    result.voyages = 1;
    result.personnalite = 1;
  }
  if (mode === "surprise") {
    result.philosophie = 3;
    result.emotions = 3;
    result.relations = 3;
  }
  return result;
}

export function selectedTopicsFor(session: Session): Topic[] {
  const selected = session.selectedTopics?.filter((topic) => TOPICS.includes(topic));
  return selected && selected.length > 0
    ? selected
    : DEFAULT_TOPICS_BY_MODE[session.mode];
}

export function topicModeFor(session: Session): "mix" | "focused" {
  return session.topicMode === "focused" ? "focused" : "mix";
}

export function activeTopicFor(session: Session): Topic | null {
  const selected = selectedTopicsFor(session);
  return session.activeTopic && selected.includes(session.activeTopic)
    ? session.activeTopic
    : null;
}

export function configuredIntensityFor(
  session: Session,
  topic: Topic
): IntensityLevel {
  const configured = session.intensityByTopic?.[topic];
  if (configured && [1, 2, 3, 4].includes(configured)) return configured;
  const legacyLevel = Math.min(4, Math.max(1, session.currentLevel || 2));
  return (defaultIntensityByMode(session.mode)[topic] ?? legacyLevel) as IntensityLevel;
}

export function unlockedIntensityFor(
  session: Session,
  topic: Topic
): IntensityLevel | null {
  if (topic !== "sexualite") return configuredIntensityFor(session, topic);
  const unlocked = session.unlockedTopicIntensities?.sexualite;
  if (!unlocked) return null;
  return Math.min(unlocked, configuredIntensityFor(session, topic)) as IntensityLevel;
}

export function effectiveIntensityFor(
  session: Session,
  topic: Topic
): IntensityLevel {
  return unlockedIntensityFor(session, topic) ?? configuredIntensityFor(session, topic);
}

export function topicForActivity(activity: Activity): Topic {
  if (activity.topic) return activity.topic;
  const direct: Partial<Record<Category, Topic>> = {
    leger: "leger",
    drole: "humour",
    humour: "humour",
    voyages: "voyages",
    souvenirs: "souvenirs",
    personnalite: "personnalite",
    valeurs: "valeurs",
    philosophie: "philosophie",
    emotions: "emotions",
    reves: "reves",
    relations: "relations",
    intimite: "intimite",
    sexualite: "sexualite",
  };
  if (direct[activity.category]) return direct[activity.category]!;

  // Les anciennes cartes « profond » sont réparties selon leur formulation.
  const text = `${activity.title} ${activity.prompt}`.toLowerCase();
  if (
    /(pardonner|besoin|vivant|ressens|paix|vulnér|peur|émotion|coeur|cœur)/.test(text)
  ) {
    return "emotions";
  }
  if (/(relation|proches|autre|confiance|affection|aimes)/.test(text)) {
    return "relations";
  }
  if (/(rêve|avenir|devenir|dix ans|transmettre)/.test(text)) {
    return "reves";
  }
  return "philosophie";
}

export function categoryForTopic(topic: Topic): Category {
  if (topic === "humour") return "humour";
  return topic;
}


/**
 * Garde-fou déterministe appliqué au catalogue comme aux questions créées par Brad.
 * Le but n’est pas de censurer un sujet choisi par les adultes, mais d’empêcher
 * qu’une formulation suppose une histoire ou une intimité qui n’existe pas encore.
 */
export function isPromptContextCompatible(
  prompt: string,
  mode: SessionMode,
  topic: Topic,
  intensity: IntensityLevel
): boolean {
  const text = prompt.toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, " ").trim();

  if (mode === "couple" || mode === "surprise") return true;

  // En premier rendez-vous / nouvelle rencontre, ne jamais inventer un passé commun.
  if (mode === "first_date" || mode === "new_meeting") {
    const assumesEstablishedRelationship = [
      /dans votre couple/,
      /dans votre relation/,
      /depuis que vous (?:êtes|sortez|vous connaissez)/,
      /votre vie de couple/,
      /votre intimité (?:commune|partagée)/,
      /souvenir(?:s)? (?:commun|ensemble)/,
      /la dernière fois que vous/,
      /quand vous avez (?:fait|eu|passé|partagé)/,
    ].some((pattern) => pattern.test(text));
    if (assumesEstablishedRelationship) return false;
  }

  // Entre amis, ne jamais présumer que les deux personnes se désirent ou sont en couple.
  if (mode === "friends") {
    const assumesMutualRomance = [
      /attirance entre vous/,
      /désir entre vous/,
      /votre couple/,
      /votre relation amoureuse/,
      /votre intimité sexuelle/,
    ].some((pattern) => pattern.test(text));
    if (assumesMutualRomance) return false;
  }

  if (topic !== "sexualite") return true;

  // Niveau 1 = flirt, attirance et signaux. Pas de récit d’acte sexuel ni de pratique précise.
  if (intensity === 1) {
    const tooExplicitForSuggestive = [
      /faire l'amour/,
      /rapport sexuel/,
      /pendant le sexe/,
      /sexe oral/,
      /pénétration/,
      /orgasme/,
      /position sexuelle/,
      /gorge profonde/,
      /pratique sexuelle/,
      /fantasme (?:cru|explicite)/,
      /où tu as déjà (?:fait|eu)/,
      /décris un moment où/,
      /raconte(?:-moi)? un moment où/,
    ].some((pattern) => pattern.test(text));
    if (tooExplicitForSuggestive) return false;

    if (mode === "first_date" || mode === "new_meeting") {
      const assumesSharedPhysicalHistory = [
        /a (?:complètement )?basculé l'attirance entre vous/,
        /entre vous deux.*(?:caresse|toucher|baiser|désir)/,
        /(?:caresse|toucher|baiser|désir).*entre vous deux/,
        /un moment où ça s'est vraiment joué/,
      ].some((pattern) => pattern.test(text));
      if (assumesSharedPhysicalHistory) return false;
    }
  }

  return true;
}

export function sexualContextGuidance(
  mode: SessionMode,
  level: IntensityLevel
): string {
  if (level === 1) {
    if (mode === "first_date" || mode === "new_meeting") {
      return "Niveau 1 dans une rencontre récente : parler uniquement de flirt, attirance, regards, tension, signaux, confort et préférences générales. Formuler au présent, au conditionnel ou en hypothèse. Ne jamais supposer qu'ils se sont déjà touchés, embrassés ou ont une histoire sexuelle commune.";
    }
    if (mode === "friends") {
      return "Niveau 1 entre amis : question personnelle ou hypothétique sur l'attirance et le flirt, sans supposer une attirance sexuelle entre eux.";
    }
    return "Niveau 1 : suggestif et léger — attirance, regards, flirt, tension, signaux et ambiance. Aucun récit d'acte sexuel ni pratique précise.";
  }
  if (level === 2) {
    return "Niveau 2 : intimité, communication, limites, confort et préférences générales. Ne pas supposer une expérience commune sauf en mode couple.";
  }
  if (level === 3) {
    return "Niveau 3 : préférences et pratiques explicites, toujours comme choix personnel ou hypothétique si les personnes ne sont pas en couple.";
  }
  return "Niveau 4 : très explicite et direct, mais toujours consenti et formulé comme préférence personnelle ou hypothétique hors mode couple.";
}

export function contextGuidance(mode: SessionMode): string {
  const guidance: Record<SessionMode, string> = {
    first_date:
      "Deux personnes en premier rendez-vous : créer de l’attirance et de la découverte sans supposer une histoire commune ni une relation déjà engagée.",
    couple:
      "Un couple : tu peux exploiter les souvenirs communs, les habitudes, les besoins, les projets et l’intimité partagée.",
    friends:
      "Deux amis : privilégier la complicité, les anecdotes, la loyauté, les valeurs et les projets sans supposer une attirance romantique.",
    new_meeting:
      "Une nouvelle rencontre : formulations accessibles, aucune connaissance préalable supposée et progression douce.",
    surprise:
      "Contexte libre : varier fortement les univers sans imposer de relation romantique.",
  };
  return guidance[mode];
}
