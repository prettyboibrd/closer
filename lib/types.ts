// Core domain types for ThankBrad

export type ActivityType =
  | "open_question"
  | "secret_choice"
  | "who_of_us"
  | "guess_my_answer"
  | "ranking"
  | "mission"
  | "complete_sentence"
  | "estimation";

/**
 * Catégories historiques du catalogue + nouvelles catégories V3.
 * `topic` est désormais la source de vérité pour le choix utilisateur ;
 * `category` reste présent pour la compatibilité des 223 cartes existantes.
 */
export type Category =
  | "leger"
  | "drole"
  | "humour"
  | "voyages"
  | "souvenirs"
  | "personnalite"
  | "valeurs"
  | "philosophie"
  | "emotions"
  | "reves"
  | "relations"
  | "intimite"
  | "sexualite"
  | "profond";

export type Topic =
  | "leger"
  | "humour"
  | "voyages"
  | "souvenirs"
  | "personnalite"
  | "valeurs"
  | "philosophie"
  | "emotions"
  | "reves"
  | "relations"
  | "intimite"
  | "sexualite";

export type IntensityLevel = 1 | 2 | 3 | 4;
export type TopicMode = "mix" | "focused";

export type SessionMode =
  | "first_date"
  | "couple"
  | "friends"
  | "new_meeting"
  | "surprise";

export type GuideMode = "brad" | "classic";

export type BradIntent = "auto" | "deepen" | "pivot" | "surprise";
export type BradStrategy = "rebound" | "pivot" | "surprise";
export type BradFocus = "shared" | "individual" | "cross" | "bridge";

export type SessionStatus = "lobby" | "playing" | "ended";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  prompt: string;
  category: Category;
  /** Sujet V3 explicite. Les anciennes cartes sont mappées automatiquement. */
  topic?: Topic;
  depthLevel: IntensityLevel;
  durationSeconds: number | null;
  options: string[] | null;
  tags: string[];
  active: boolean;
  /** Contextes pour lesquels la formulation est réellement adaptée. */
  contexts?: SessionMode[];
}

export interface BradDecision {
  kind: "catalog" | "custom";
  strategy: BradStrategy;
  /** Manière dont Brad distribue la parole. */
  focus: BradFocus;
  /** Participant qui répond en premier ou seul pour individual/cross. */
  targetParticipantId: string | null;
  intro: string | null;
  activityId: string | null;
  customActivity: Activity | null;
}

export interface Participant {
  id: string;
  displayName: string;
  avatar: string;
  isHost: boolean;
  joinedAt: number;
  lastSeenAt: number;
  connected: boolean;
}

export type ReactionType =
  | "unexpected"
  | "me_too"
  | "tell_more"
  | "touching"
  | "funny"
  | "understand";

export interface Reaction {
  id: string;
  participantId: string;
  reactionType: ReactionType;
  createdAt: number;
}

export interface Response {
  participantId: string;
  textResponse: string | null;
  optionResponse: string | number | number[] | null;
  submittedAt: number;
}

export type ActivityStatus = "active" | "revealed" | "completed" | "skipped";

export interface SessionActivity {
  id: string;
  activityId: string;
  /** Activité créée par Brad pour cette session uniquement. */
  customActivity?: Activity;
  /** Petite transition affichée avant la question. */
  bradIntro?: string;
  bradStrategy?: BradStrategy;
  bradFocus?: BradFocus;
  bradTargetParticipantId?: string;
  position: number;
  status: ActivityStatus;
  skipped: boolean;
  startedAt: number;
  completedAt: number | null;
  responses: Response[];
  reactions: Reaction[];
}

export interface LevelConsent {
  participantId: string;
  requestedLevel: number;
  accepted: boolean;
  createdAt: number;
}

export interface TopicConsent {
  participantId: string;
  topic: "sexualite";
  accepted: boolean;
  adultConfirmed: boolean;
  maxIntensity: IntensityLevel;
  createdAt: number;
}

export interface PendingTopicConsent {
  topic: "sexualite";
  requestedBy: string;
  requestedIntensity: IntensityLevel;
  createdAt: number;
}

export interface Session {
  id: string;
  code: string;
  status: SessionStatus;
  mode: SessionMode;
  guideMode?: GuideMode;
  durationMinutes: number | null;

  /** V3 : sujets autorisés par les joueurs. */
  selectedTopics?: Topic[];
  /** Intensité maximale voulue pour chaque sujet. */
  intensityByTopic?: Partial<Record<Topic, IntensityLevel>>;
  /** Mix = rotation ; focused = le sujet choisi reste prioritaire. */
  topicMode?: TopicMode;
  activeTopic?: Topic | null;
  /** Niveaux sensibles réellement déverrouillés en commun. */
  unlockedTopicIntensities?: Partial<Record<Topic, IntensityLevel>>;
  pendingTopicConsent?: PendingTopicConsent | null;
  topicConsents?: TopicConsent[];

  /** Champ historique conservé pour les anciennes sessions et la migration. */
  currentLevel: number;
  connectionPoints: number;
  currentSessionActivityId: string | null;
  hostId: string;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  participants: Participant[];
  history: SessionActivity[];
  usedActivityIds: string[];
  recentTypes: ActivityType[];
  pendingLevelUp: number | null;
  levelConsents: LevelConsent[];
}

export const MODE_LABELS: Record<SessionMode, string> = {
  first_date: "Premier rendez-vous",
  couple: "Couple",
  friends: "Amis",
  new_meeting: "Nouvelle rencontre",
  surprise: "Surprise",
};

export const GUIDE_MODE_LABELS: Record<GuideMode, string> = {
  brad: "Avec Brad",
  classic: "Mode classique",
};

export const GUIDE_MODE_DESCRIPTIONS: Record<GuideMode, string> = {
  brad:
    "Brad comprend les notes écrites, adapte la prochaine question et respecte vos sujets et intensités.",
  classic:
    "Aucun appel à l’IA : le catalogue suit les mêmes sujets, niveaux et règles de variété.",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  leger: "Léger",
  drole: "Humour",
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
  profond: "Philosophie",
};

export const LEVEL_LABELS: Record<number, string> = {
  1: "Léger",
  2: "Personnel",
  3: "Profond",
  4: "Sans filtre",
};

export const REACTION_LABELS: Record<ReactionType, string> = {
  unexpected: "Je ne m'y attendais pas",
  me_too: "Moi aussi",
  tell_more: "Raconte-moi davantage",
  touching: "C'est touchant",
  funny: "Ça me fait rire",
  understand: "Je comprends",
};

export const REACTION_EMOJI: Record<ReactionType, string> = {
  unexpected: "😮",
  me_too: "🙌",
  tell_more: "👀",
  touching: "🥹",
  funny: "😄",
  understand: "🤝",
};

export const CONNECTION_STAGES = [
  { threshold: 0, label: "Premier contact" },
  { threshold: 40, label: "Bonne énergie" },
  { threshold: 90, label: "Vraie découverte" },
  { threshold: 160, label: "Connexion" },
  { threshold: 250, label: "Moment mémorable" },
] as const;

export const POINTS = {
  activityCompleted: 5,
  commonPoint: 10,
  closePrediction: 15,
  missionSuccess: 20,
  levelUnlocked: 30,
} as const;
