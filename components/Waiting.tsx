"use client";

import { motion } from "framer-motion";

export function Waiting({
  name,
  message,
}: {
  name: string;
  message?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl bg-cream-deep px-5 py-6 text-center"
    >
      <div className="flex justify-center gap-1.5 mb-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2.5 w-2.5 rounded-full aurora"
            animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.18,
            }}
          />
        ))}
      </div>
      <p className="text-ink/70">
        {message ?? `Ta réponse est bien cachée. On attend ${name}…`}
      </p>
    </motion.div>
  );
}
