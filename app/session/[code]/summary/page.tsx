"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Card, Eyebrow, Screen } from "@/components/ui";
import { GUIDE_MODE_LABELS, LEVEL_LABELS } from "@/lib/types";
import { TOPIC_ICONS, TOPIC_LABELS } from "@/lib/topics";
import { createSummary, guideModeFor } from "@/lib/session-logic";
import { useSession } from "@/lib/useSession";

export default function SummaryPage() {
  const params = useParams<{ code: string }>();
  const code = params.code?.toUpperCase() ?? "";
  const router = useRouter();
  const { session, loading } = useSession(code);

  const summary = useMemo(
    () => (session ? createSummary(session) : null),
    [session]
  );

  if (loading) {
    return (
      <Screen>
        <p className="mt-16 text-center text-ink/50">Chargement…</p>
      </Screen>
    );
  }

  if (!session || !summary) {
    return (
      <Screen>
        <Card className="p-8 text-center mt-16">
          <h1 className="font-display text-2xl font-700 text-violet mb-4">
            Résumé indisponible
          </h1>
          <Button variant="secondary" full onClick={() => router.push("/")}>
            Accueil
          </Button>
        </Card>
      </Screen>
    );
  }

  const { compatibility } = summary;
  const stats: { label: string; value: string }[] = [
    { label: "Durée", value: summary.durationLabel },
    { label: "Activités", value: String(summary.activitiesCompleted) },
    { label: "Points de connexion", value: String(summary.connectionPoints) },
    { label: "Prédictions proches", value: String(summary.closePredictions) },
    { label: "Mode", value: GUIDE_MODE_LABELS[guideModeFor(session)] },
    {
      label: "Intensité explorée",
      value: `${summary.levelReached} · ${LEVEL_LABELS[summary.levelReached]}`,
    },
  ];

  return (
    <Screen>
      <div className="text-center mb-6">
        <Eyebrow>Votre session</Eyebrow>
        <h1 className="font-display text-3xl font-700 text-violet mt-1">
          {compatibility.archetype}
        </h1>
        <p className="mt-2 text-ink/60">
          {session.participants.map((p) => p.displayName).join(" & ")}
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-br from-violet/10 via-pink/10 to-coral/10 p-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-pink">
                Compatibilité de cette session
              </div>
              <h2 className="mt-2 font-display text-2xl font-700 text-violet">
                {compatibility.label}
              </h2>
              <p className="mt-1 text-xs text-ink/50">
                {compatibility.confidence}
              </p>
            </div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-8 border-white bg-violet text-white shadow-lg"
            >
              <span className="font-display text-3xl font-700">
                {compatibility.overallScore}
              </span>
              <span className="text-[10px] font-semibold opacity-75">/ 100</span>
            </motion.div>
          </div>
          <p className="mt-5 rounded-2xl bg-white/65 px-4 py-3 text-sm leading-relaxed text-ink/75">
            {compatibility.narrative}
          </p>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-violet/55">
              Votre dynamique
            </h3>
            <div className="space-y-4">
              {compatibility.axes.map((axis, index) => (
                <motion.div
                  key={axis.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">{axis.label}</span>
                    <span className="font-display font-700 text-violet">
                      {axis.score}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-cream-deep">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${axis.score}%` }}
                      transition={{ duration: 0.65, delay: 0.15 + index * 0.08 }}
                      className="h-full rounded-full bg-gradient-to-r from-violet to-pink"
                    />
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink/55">
                    {axis.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {(compatibility.agreements.length > 0 ||
            compatibility.contrasts.length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {compatibility.agreements.length > 0 && (
                <div className="rounded-2xl bg-pink/5 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-pink">
                    ✨ Vos convergences
                  </div>
                  <div className="space-y-1.5 text-sm text-ink/75">
                    {compatibility.agreements.map((item) => (
                      <p key={item}>• {item}</p>
                    ))}
                  </div>
                </div>
              )}
              {compatibility.contrasts.length > 0 && (
                <div className="rounded-2xl bg-violet/5 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet">
                    ↔ Vos contrastes intéressants
                  </div>
                  <div className="space-y-1.5 text-sm text-ink/75">
                    {compatibility.contrasts.map((item) => (
                      <p key={item}>• {item}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {compatibility.nextTopic && (
            <div className="rounded-2xl border border-violet/10 bg-cream px-4 py-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-violet/55">
                Pour une prochaine session
              </div>
              <p className="mt-1 text-sm text-ink/75">
                Brad vous suggère d&apos;explorer davantage :{" "}
                <strong className="text-violet">
                  {TOPIC_ICONS[compatibility.nextTopic]}{" "}
                  {TOPIC_LABELS[compatibility.nextTopic]}
                </strong>
                .
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="mt-5 p-6">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <div className="font-display text-xl font-700 text-violet">
                {stat.value}
              </div>
              <div className="text-xs text-ink/60">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {summary.favoriteActivity && (
          <div className="mt-5 rounded-2xl bg-cream-deep px-4 py-3">
            <div className="text-xs font-semibold text-ink/60">
              Activité favorite
            </div>
            <div className="font-medium text-ink">
              {summary.favoriteActivity}
            </div>
          </div>
        )}

        {summary.categories.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-semibold text-ink/60 mb-2">
              Sujets explorés
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-violet/10 px-3 py-1 text-xs font-medium text-violet"
                >
                  {TOPIC_ICONS[category as keyof typeof TOPIC_ICONS] ?? "💬"}{" "}
                  {TOPIC_LABELS[category as keyof typeof TOPIC_LABELS] ??
                    category}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <p className="mt-5 text-center text-xs leading-relaxed text-ink/40">
        Cet indice est ludique et repose uniquement sur vos choix, réactions et
        activités pendant cette partie. Ce n&apos;est ni un test psychologique ni une
        mesure scientifique de votre relation.
      </p>

      <div className="mt-6 space-y-3">
        <Link href="/create" className="block">
          <Button full>Rejouer une nouvelle session</Button>
        </Link>
        <Link href="/" className="block">
          <Button variant="ghost" full>
            Retour à l&apos;accueil
          </Button>
        </Link>
      </div>
    </Screen>
  );
}
