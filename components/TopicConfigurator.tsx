"use client";

import type { IntensityLevel, SessionMode, Topic } from "@/lib/types";
import {
  DEFAULT_TOPICS_BY_MODE,
  TOPICS,
  TOPIC_DESCRIPTIONS,
  TOPIC_ICONS,
  TOPIC_LABELS,
  defaultIntensityByMode,
  intensityLabel,
} from "@/lib/topics";

interface Props {
  mode: SessionMode;
  selectedTopics: Topic[];
  intensityByTopic: Partial<Record<Topic, IntensityLevel>>;
  onSelectedTopicsChange: (topics: Topic[]) => void;
  onIntensityChange: (topic: Topic, level: IntensityLevel) => void;
  onUseRecommended: () => void;
}

const LEVELS: IntensityLevel[] = [1, 2, 3, 4];

export function recommendedTopicConfiguration(mode: SessionMode): {
  selectedTopics: Topic[];
  intensityByTopic: Partial<Record<Topic, IntensityLevel>>;
} {
  return {
    selectedTopics: [...DEFAULT_TOPICS_BY_MODE[mode]],
    intensityByTopic: defaultIntensityByMode(mode),
  };
}

export function TopicConfigurator({
  mode,
  selectedTopics,
  intensityByTopic,
  onSelectedTopicsChange,
  onIntensityChange,
  onUseRecommended,
}: Props) {
  function toggle(topic: Topic) {
    if (selectedTopics.includes(topic)) {
      if (selectedTopics.length === 1) return;
      onSelectedTopicsChange(selectedTopics.filter((item) => item !== topic));
      return;
    }
    onSelectedTopicsChange([...selectedTopics, topic]);
  }

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <span className="block text-sm font-semibold text-ink">
            De quoi voulez-vous parler ?
          </span>
          <p className="mt-1 text-xs leading-relaxed text-ink/55">
            Le contexte propose une sélection, mais tu peux tout personnaliser.
          </p>
        </div>
        <button
          type="button"
          onClick={onUseRecommended}
          className="shrink-0 rounded-full bg-violet/10 px-3 py-1.5 text-xs font-semibold text-violet hover:bg-violet/15"
        >
          Recommandé
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {TOPICS.map((topic) => {
          const selected = selectedTopics.includes(topic);
          return (
            <button
              key={topic}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(topic)}
              className={`rounded-2xl border px-3 py-3 text-left transition ${
                selected
                  ? "border-violet/30 bg-violet/10 text-violet"
                  : "border-transparent bg-cream-deep text-ink hover:border-violet/15"
              }`}
            >
              <span className="block text-lg" aria-hidden>
                {TOPIC_ICONS[topic]}
              </span>
              <span className="mt-1 block text-sm font-semibold">
                {TOPIC_LABELS[topic]}
              </span>
              <span className="mt-1 block text-[11px] leading-snug opacity-65">
                {TOPIC_DESCRIPTIONS[topic]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">
            Intensité maximale par sujet
          </span>
          <span className="text-[11px] text-ink/45">Passer reste toujours possible</span>
        </div>
        {selectedTopics.map((topic) => {
          const current = intensityByTopic[topic] ??
            defaultIntensityByMode(mode)[topic] ??
            2;
          return (
            <div key={topic} className="rounded-2xl bg-cream-deep p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">
                  {TOPIC_ICONS[topic]} {TOPIC_LABELS[topic]}
                </span>
                {topic === "sexualite" && (
                  <span className="rounded-full bg-pink/10 px-2 py-1 text-[10px] font-semibold text-pink">
                    Accord séparé des deux adultes
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1" role="radiogroup" aria-label={`Intensité ${TOPIC_LABELS[topic]}`}>
                {LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={current === level}
                    onClick={() => onIntensityChange(topic, level)}
                    className={`rounded-xl px-1 py-2 text-center transition ${
                      current === level
                        ? "aurora text-white"
                        : "bg-white text-ink/65 hover:bg-violet/10"
                    }`}
                  >
                    <span className="block text-xs font-bold">{level}</span>
                    <span className="mt-0.5 block text-[9px] leading-tight">
                      {intensityLabel(topic, level)}
                    </span>
                  </button>
                ))}
              </div>
              {topic === "sexualite" && (
                <p className="mt-2 text-[11px] leading-relaxed text-ink/50">
                  Le niveau choisi est seulement un plafond. Le niveau commun sera le plus bas accepté séparément par les deux personnes. Aucune question sexuelle n’apparaît avant cet accord.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
