"use client";

import { motion } from "framer-motion";
import { CONNECTION_STAGES } from "@/lib/types";
import { stageFor } from "@/lib/session-logic";

export function ConnectionGauge({ points }: { points: number }) {
  const max = CONNECTION_STAGES[CONNECTION_STAGES.length - 1].threshold + 60;
  const pct = Math.min(100, (points / max) * 100);
  const stage = stageFor(points);

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-violet/60">
          Points de connexion
        </span>
        <span className="text-sm font-semibold text-violet">{points}</span>
      </div>
      <div
        className="h-3 rounded-full bg-cream-deep overflow-hidden"
        role="progressbar"
        aria-valuenow={points}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Progression : ${stage}`}
      >
        <motion.div
          className="h-full aurora rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
      </div>
      <p className="mt-1.5 text-sm text-ink/70">
        <span aria-hidden>✨ </span>
        {stage}
        <span className="text-ink/40"> · progression de jeu</span>
      </p>
    </div>
  );
}
