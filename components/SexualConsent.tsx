"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui";
import type { IntensityLevel, Session } from "@/lib/types";
import { SEXUAL_INTENSITY_LABELS } from "@/lib/topics";

interface Props {
  session: Session;
  myId: string | null;
  onSubmit: (
    accepted: boolean,
    adultConfirmed: boolean,
    maxIntensity: IntensityLevel
  ) => void;
}

const LEVELS: IntensityLevel[] = [1, 2, 3, 4];

export function SexualConsent({ session, myId, onSubmit }: Props) {
  const pending = session.pendingTopicConsent;
  const requested = pending?.requestedIntensity ?? 1;
  const [level, setLevel] = useState<IntensityLevel>(requested);
  const [adult, setAdult] = useState(false);
  if (!pending || pending.topic !== "sexualite") return null;

  const myConsent = (session.topicConsents ?? []).find(
    (consent) =>
      consent.topic === "sexualite" && consent.participantId === myId
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] grid place-items-center bg-night/55 px-5 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sexual-consent-title"
      >
        <motion.div
          className="w-full max-w-sm rounded-[1.75rem] bg-white p-6 shadow-2xl"
          initial={{ scale: 0.92, y: 12 }}
          animate={{ scale: 1, y: 0 }}
        >
          <div className="text-center">
            <div className="text-4xl" aria-hidden>🌶️</div>
            <h2 id="sexual-consent-title" className="mt-2 font-display text-2xl font-700 text-violet">
              Sexualité — adultes uniquement
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/65">
              Chacun choisit secrètement son niveau maximal. ThankBrad utilisera uniquement le niveau le plus bas accepté, sans révéler qui l’a choisi.
            </p>
          </div>

          {myConsent ? (
            <div className="mt-5 rounded-2xl bg-cream-deep px-4 py-4 text-center text-sm text-ink/65">
              Ton choix est enregistré. En attente de l’autre personne…
            </div>
          ) : (
            <>
              <div className="mt-5 space-y-2">
                {LEVELS.map((candidate) => (
                  <button
                    key={candidate}
                    type="button"
                    onClick={() => setLevel(candidate)}
                    aria-pressed={level === candidate}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
                      level === candidate
                        ? "aurora text-white"
                        : "bg-cream-deep text-ink"
                    }`}
                  >
                    <span className="font-semibold">
                      Niveau {candidate} · {SEXUAL_INTENSITY_LABELS[candidate]}
                    </span>
                    {candidate === 4 && (
                      <span className="text-[10px] opacity-75">très direct</span>
                    )}
                  </button>
                ))}
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-violet/15 p-3 text-sm text-ink/70">
                <input
                  type="checkbox"
                  checked={adult}
                  onChange={(event) => setAdult(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-violet"
                />
                <span>
                  Je confirme avoir au moins 18 ans et je consens à recevoir des questions sexuelles jusqu’au niveau choisi.
                </span>
              </label>

              <p className="mt-3 text-center text-[11px] leading-relaxed text-ink/45">
                Pas de défi sexuel à réaliser. Vous pouvez passer ou changer de sujet à tout moment.
              </p>

              <div className="mt-5 space-y-2">
                <Button
                  full
                  disabled={!adult}
                  onClick={() => onSubmit(true, adult, level)}
                >
                  J’accepte ce niveau
                </Button>
                <Button
                  variant="ghost"
                  full
                  onClick={() => onSubmit(false, false, 1)}
                >
                  Je préfère un autre sujet
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
