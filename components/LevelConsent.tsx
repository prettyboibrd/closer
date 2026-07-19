"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui";
import { LEVEL_LABELS, type Session } from "@/lib/types";

interface Props {
  session: Session;
  myId: string | null;
  onConsent: (accepted: boolean) => void;
}

export function LevelConsent({ session, myId, onConsent }: Props) {
  const level = session.pendingLevelUp;
  if (level == null) return null;

  const myConsent = session.levelConsents.find(
    (c) => c.participantId === myId && c.requestedLevel === level
  );
  const others = session.levelConsents.filter(
    (c) => c.requestedLevel === level && c.participantId !== myId
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 grid place-items-center bg-night/40 backdrop-blur-sm px-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-title"
      >
        <motion.div
          className="w-full max-w-sm rounded-[1.75rem] bg-white p-6 text-center shadow-2xl"
          initial={{ scale: 0.92, y: 10 }}
          animate={{ scale: 1, y: 0 }}
        >
          <div className="text-3xl mb-2">🔓</div>
          <h2 id="level-title" className="font-display text-2xl font-700 text-violet">
            Passer au niveau {level}
          </h2>
          <p className="mt-1 font-semibold text-pink">{LEVEL_LABELS[level]}</p>
          <p className="mt-3 text-ink/70 text-sm">
            Les questions deviennent plus personnelles. Ce niveau ne s&apos;ouvre
            que si vous êtes d&apos;accord tous les deux.
          </p>

          {myConsent ? (
            <div className="mt-5 rounded-xl bg-cream-deep px-4 py-3 text-sm text-ink/70">
              {myConsent.accepted
                ? "Tu as accepté. "
                : "Tu as préféré rester à ce niveau. "}
              {others.length === 0
                ? "En attente de l'autre…"
                : others[0].accepted
                  ? "L'autre a accepté aussi."
                  : "L'autre préfère rester ici."}
            </div>
          ) : (
            <div className="mt-6 space-y-2">
              <Button full onClick={() => onConsent(true)}>
                J&apos;accepte
              </Button>
              <Button variant="ghost" full onClick={() => onConsent(false)}>
                Pas maintenant
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
