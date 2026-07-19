"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui";
import type { IntensityLevel, Topic } from "@/lib/types";
import {
  TOPIC_ICONS,
  TOPIC_LABELS,
  configuredIntensityFor,
  intensityLabel,
  selectedTopicsFor,
  unlockedIntensityFor,
} from "@/lib/topics";
import type { Session } from "@/lib/types";

interface Props {
  open: boolean;
  session: Session;
  onClose: () => void;
  onSelect: (topic: Topic | null) => void;
}

export function TopicPicker({ open, session, onClose, onSelect }: Props) {
  const topics = selectedTopicsFor(session);
  const sexualUnlocked = unlockedIntensityFor(session, "sexualite");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-night/45 px-4 pb-4 pt-16 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="topic-picker-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            className="max-h-[82vh] w-full max-w-md overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-2xl"
            initial={{ y: 30, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 30, scale: 0.96 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="topic-picker-title" className="font-display text-2xl font-700 text-violet">
                  Changer de sujet
                </h2>
                <p className="mt-1 text-sm text-ink/60">
                  La question actuelle sera remplacée pour les deux personnes.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full bg-cream-deep text-ink/60"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <button
              type="button"
              onClick={() => onSelect(null)}
              className="mt-5 w-full rounded-2xl bg-violet/10 p-4 text-left text-violet transition hover:bg-violet/15"
            >
              <span className="font-semibold">✨ Mix automatique</span>
              <span className="mt-1 block text-xs opacity-70">
                Brad ou le moteur classique alterne parmi tous vos sujets.
              </span>
            </button>

            <div className="mt-3 grid gap-2">
              {topics.map((topic) => {
                const configured = configuredIntensityFor(session, topic);
                const locked = topic === "sexualite" && !sexualUnlocked;
                const shownLevel = (topic === "sexualite"
                  ? sexualUnlocked ?? configured
                  : configured) as IntensityLevel;
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => onSelect(topic)}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-cream-deep px-4 py-3 text-left text-ink transition hover:bg-violet/10"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xl" aria-hidden>
                        {TOPIC_ICONS[topic]}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">
                          {TOPIC_LABELS[topic]}
                        </span>
                        <span className="block text-[11px] text-ink/50">
                          Niveau {shownLevel} · {intensityLabel(topic, shownLevel)}
                        </span>
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-violet">
                      {locked ? "Déverrouiller" : "Choisir"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <Button variant="ghost" full onClick={onClose}>
                Garder la question actuelle
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
