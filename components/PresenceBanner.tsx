"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Session } from "@/lib/types";
import { isPresent } from "@/lib/session-logic";

/** Re-render régulier pour réévaluer la présence dans le temps. */
function useTick(ms: number) {
  const [, setN] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(iv);
  }, [ms]);
}

export function PresenceBanner({
  session,
  myId,
  online,
}: {
  session: Session;
  myId: string | null;
  online: boolean;
}) {
  useTick(3000);

  const partner = session.participants.find((p) => p.id !== myId);
  const partnerHere = partner ? isPresent(session, partner.id) : true;

  let message: string | null = null;
  let tone: "warn" | "info" = "warn";

  if (!online) {
    message = "Tu es hors ligne. On te reconnecte dès que possible…";
    tone = "warn";
  } else if (partner && !partnerHere) {
    message = `${partner.displayName} s'est éloigné·e un instant. On l'attend…`;
    tone = "warn";
  }

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          className={`mb-3 overflow-hidden rounded-2xl px-4 py-2.5 text-sm font-medium ${
            tone === "warn"
              ? "bg-coral/15 text-[#b3421f]"
              : "bg-violet/10 text-violet"
          }`}
          role="status"
        >
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-coral wait-dot" aria-hidden />
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
