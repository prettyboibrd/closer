"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Screen } from "@/components/ui";
import { BrandMark } from "@/components/BrandMark";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <Screen>
      <div className="flex-1 flex flex-col justify-center">
        <BrandMark />

        <motion.div
          className="text-center mb-11"
          initial="initial"
          animate="animate"
          transition={{ staggerChildren: 0.12, delayChildren: 0.9 }}
        >
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-display text-6xl font-700 tracking-[-0.03em] text-violet"
          >
            ThankBrad
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-4 font-display text-lg text-pink font-600"
          >
            Des conversations dont on se souvient.
          </motion.p>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mx-auto mt-4 max-w-xs text-ink/65 leading-relaxed"
          >
            Deux personnes, quelques questions, et tout ce qu&apos;on ne se serait
            jamais dit autrement.
          </motion.p>
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4, ease: "easeOut" }}
        >
          <Link href="/create" className="block">
            <Button full>Créer une session</Button>
          </Link>
          <Link href="/join" className="block">
            <Button variant="secondary" full>
              Rejoindre une session
            </Button>
          </Link>
          <Link href="/demo" className="block">
            <Button variant="ghost" full>
              Voir comment ça marche
            </Button>
          </Link>
        </motion.div>
      </div>

      <motion.footer
        className="pt-8 text-center text-xs text-ink/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.8 }}
      >
        Sur deux téléphones ou un seul · sans inscription
      </motion.footer>
    </Screen>
  );
}
