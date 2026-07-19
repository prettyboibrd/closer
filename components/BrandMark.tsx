"use client";

import { motion } from "framer-motion";

/**
 * Signature de la marque : deux présences qui se rejoignent doucement,
 * laissant naître une lueur commune au centre. Élégant par la retenue,
 * chaleureux par le mouvement lent et les teintes.
 */
export function BrandMark() {
  return (
    <div
      aria-hidden
      className="relative mx-auto mb-9 h-28 w-40"
    >
      {/* lueur centrale née de la rencontre */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,138,107,0.9), rgba(232,93,138,0.5), transparent 70%)",
        }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.9, 0.7], scale: [0.4, 1.1, 1] }}
        transition={{ duration: 1.6, ease: "easeOut", delay: 0.5 }}
      />
      {/* présence gauche (violet) */}
      <motion.span
        className="absolute top-1/2 h-16 w-16 -translate-y-1/2 rounded-full"
        style={{
          background: "linear-gradient(135deg, #3a1d6e, #6b4bb0)",
          boxShadow: "0 12px 30px -10px rgba(58,29,110,0.6)",
        }}
        initial={{ left: "6%", opacity: 0 }}
        animate={{ left: "24%", opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* présence droite (corail) */}
      <motion.span
        className="absolute top-1/2 h-16 w-16 -translate-y-1/2 rounded-full"
        style={{
          background: "linear-gradient(135deg, #ff8a6b, #e85d8a)",
          boxShadow: "0 12px 30px -10px rgba(232,93,138,0.55)",
        }}
        initial={{ right: "6%", opacity: 0 }}
        animate={{ right: "24%", opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
