"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Button, Card, Eyebrow, Screen, Avatar } from "@/components/ui";
import { GUIDE_MODE_LABELS, MODE_LABELS } from "@/lib/types";
import { TOPIC_ICONS, TOPIC_LABELS, configuredIntensityFor, intensityLabel, selectedTopicsFor } from "@/lib/topics";
import { guideModeFor, startSession } from "@/lib/session-logic";
import { useSession } from "@/lib/useSession";

export default function LobbyPage() {
  const params = useParams<{ code: string }>();
  const code = params.code?.toUpperCase() ?? "";
  const router = useRouter();
  const { session, loading, mutate, myId } = useSession(code);
  const [joinUrl, setJoinUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setJoinUrl(`${window.location.origin}/join/${code}`);
    }
  }, [code]);

  // Auto-navigate to play once the session starts.
  useEffect(() => {
    if (session?.status === "playing") {
      router.push(`/session/${code}/play`);
    }
  }, [session?.status, code, router]);

  if (loading) {
    return (
      <Screen>
        <p className="mt-16 text-center text-ink/50">Chargement…</p>
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <Card className="p-8 text-center mt-16">
          <div className="text-4xl mb-3">🧭</div>
          <h1 className="font-display text-2xl font-700 text-violet mb-2">
            Session introuvable
          </h1>
          <Button variant="secondary" full onClick={() => router.push("/")}>
            Retour à l&apos;accueil
          </Button>
        </Card>
      </Screen>
    );
  }

  const isHost = myId === session.hostId;
  const both = session.participants.length === 2;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Screen>
      <Eyebrow>Salon d&apos;attente</Eyebrow>
      <h1 className="font-display text-3xl font-700 text-violet mt-1 mb-1">
        Invite ton binôme
      </h1>
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-ink/60">
        <span>Contexte : {MODE_LABELS[session.mode]}</span>
        <span aria-hidden>·</span>
        <span className="rounded-full bg-violet/10 px-2.5 py-1 font-semibold text-violet">
          {guideModeFor(session) === "brad" ? "✨ " : "🎲 "}
          {GUIDE_MODE_LABELS[guideModeFor(session)]}
        </span>
      </div>

      <Card className="p-5 mb-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-ink">Sujets choisis</span>
          <span className="text-[11px] text-ink/45">Modifiables pendant la partie</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedTopicsFor(session).map((topic) => {
            const level = configuredIntensityFor(session, topic);
            return (
              <span
                key={topic}
                className="rounded-full bg-violet/10 px-3 py-1.5 text-xs font-medium text-violet"
                title={`Niveau ${level} · ${intensityLabel(topic, level)}`}
              >
                {TOPIC_ICONS[topic]} {TOPIC_LABELS[topic]} · {level}
                {topic === "sexualite" ? " 🔒" : ""}
              </span>
            );
          })}
        </div>
        {selectedTopicsFor(session).includes("sexualite") && (
          <p className="mt-3 text-[11px] leading-relaxed text-ink/50">
            La sexualité reste verrouillée jusqu’à l’accord séparé des deux adultes pendant la partie.
          </p>
        )}
      </Card>

      <Card className="p-6 text-center">
        <span className="text-sm font-semibold text-ink/60">Code de session</span>
        <div className="my-2 font-display text-4xl font-700 tracking-[0.3em] text-violet">
          {session.code}
        </div>
        <div className="mx-auto my-4 w-fit rounded-2xl bg-white p-3 shadow-inner">
          {joinUrl && (
            <QRCodeSVG
              value={joinUrl}
              size={148}
              bgColor="#ffffff"
              fgColor="#3a1d6e"
              aria-label="QR code pour rejoindre la session"
            />
          )}
        </div>
        <Button variant="soft" full onClick={copyLink}>
          {copied ? "Lien copié ✓" : "Copier le lien d'invitation"}
        </Button>
      </Card>

      <Card className="p-5 mt-5">
        <span className="block text-sm font-semibold text-ink mb-3">
          Participants ({session.participants.length}/2)
        </span>
        <div className="space-y-3">
          {session.participants.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <Avatar emoji={p.avatar} name={p.displayName} />
              {p.isHost && (
                <span className="text-xs font-semibold text-pink">Hôte</span>
              )}
            </motion.div>
          ))}
          {!both && (
            <div className="flex items-center gap-2 text-ink/40">
              <span className="grid place-items-center w-10 h-10 rounded-2xl border-2 border-dashed border-violet/20">
                <span className="wait-dot text-lg">·</span>
              </span>
              <span className="text-sm">En attente de la 2ᵉ personne…</span>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-6">
        {isHost ? (
          <Button
            full
            disabled={!both}
            onClick={() => mutate((s) => startSession(s))}
          >
            {both ? "Démarrer la partie" : "En attente du binôme…"}
          </Button>
        ) : (
          <p className="text-center text-ink/60 py-3">
            {both
              ? "C'est l'hôte qui lance la partie. Prépare-toi !"
              : "En attente…"}
          </p>
        )}
      </div>
    </Screen>
  );
}
