"use client";

import { useState } from "react";
import { Button } from "./ui";
import type { Activity } from "@/lib/types";

interface Props {
  activity: Activity;
  onSubmit: (payload: {
    textResponse: string | null;
    optionResponse: string | number | number[] | null;
  }) => void;
  disabled?: boolean;
}

export function ActivityInput({ activity, onSubmit, disabled }: Props) {
  switch (activity.type) {
    case "open_question":
      return <OpenQuestion onSubmit={onSubmit} disabled={disabled} />;
    case "complete_sentence":
      return (
        <TextInput
          placeholder="Complète librement…"
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case "secret_choice":
    case "who_of_us":
    case "guess_my_answer":
      return (
        <OptionChoice
          activity={activity}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case "estimation":
      return <Estimation onSubmit={onSubmit} disabled={disabled} />;
    case "ranking":
      return <Ranking activity={activity} onSubmit={onSubmit} disabled={disabled} />;
    case "mission":
      return <Mission activity={activity} onSubmit={onSubmit} disabled={disabled} />;
    default:
      return null;
  }
}

function OpenQuestion({
  onSubmit,
  disabled,
}: Pick<Props, "onSubmit" | "disabled">) {
  const [note, setNote] = useState("");
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/60">
        Répondez à voix haute, puis notez une phrase ou 2-3 mots. En mode
        Brad, cette note l’aide à personnaliser la suite. Cela reste facultatif.
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Ex. Japon, liberté, changer de métier…"
        className="w-full rounded-xl border border-violet/15 bg-cream px-4 py-3 text-ink placeholder:text-ink/40 focus:border-violet/40 focus:outline-none resize-none"
      />
      <Button
        full
        disabled={disabled}
        onClick={() => onSubmit({ textResponse: note.trim() || null, optionResponse: null })}
      >
        J&apos;ai répondu
      </Button>
    </div>
  );
}

function TextInput({
  placeholder,
  onSubmit,
  disabled,
}: Pick<Props, "onSubmit" | "disabled"> & { placeholder: string }) {
  const [text, setText] = useState("");
  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full rounded-xl border border-violet/15 bg-cream px-4 py-3 text-ink placeholder:text-ink/40 focus:border-violet/40 focus:outline-none resize-none"
      />
      <Button
        full
        disabled={disabled || text.trim().length === 0}
        onClick={() => onSubmit({ textResponse: text.trim(), optionResponse: null })}
      >
        Valider ma réponse
      </Button>
    </div>
  );
}

function OptionChoice({
  activity,
  onSubmit,
  disabled,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const options = activity.options ?? [];
  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        {options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            aria-pressed={selected === i}
            disabled={disabled}
            onClick={() => setSelected(i)}
            className={`rounded-2xl px-4 py-4 text-left font-medium transition ${
              selected === i
                ? "aurora text-white"
                : "bg-cream-deep text-ink hover:bg-violet/10"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <Button
        full
        disabled={disabled || selected === null}
        onClick={() =>
          selected !== null &&
          onSubmit({ textResponse: null, optionResponse: selected })
        }
      >
        Valider secrètement
      </Button>
    </div>
  );
}

function Estimation({
  onSubmit,
  disabled,
}: Pick<Props, "onSubmit" | "disabled">) {
  const [value, setValue] = useState("");
  return (
    <div className="space-y-3">
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ton estimation"
        className="w-full rounded-xl border border-violet/15 bg-cream px-4 py-4 text-center text-2xl font-display font-700 text-violet placeholder:text-ink/30 focus:border-violet/40 focus:outline-none"
      />
      <Button
        full
        disabled={disabled || value.trim() === ""}
        onClick={() =>
          onSubmit({ textResponse: null, optionResponse: Number(value) })
        }
      >
        Valider mon estimation
      </Button>
    </div>
  );
}

function Ranking({ activity, onSubmit, disabled }: Props) {
  const [order, setOrder] = useState<number[]>(
    (activity.options ?? []).map((_, i) => i)
  );
  const options = activity.options ?? [];

  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/60">
        Classe du plus important (haut) au moins important.
      </p>
      <ul className="space-y-2">
        {order.map((optIdx, pos) => (
          <li
            key={options[optIdx]}
            className="flex items-center justify-between rounded-2xl bg-cream-deep px-4 py-3"
          >
            <span className="flex items-center gap-3">
              <span className="grid place-items-center h-7 w-7 rounded-full aurora text-white text-sm font-700">
                {pos + 1}
              </span>
              <span className="font-medium text-ink">{options[optIdx]}</span>
            </span>
            <span className="flex gap-1">
              <button
                type="button"
                aria-label={`Monter ${options[optIdx]}`}
                disabled={disabled || pos === 0}
                onClick={() => move(pos, -1)}
                className="h-8 w-8 rounded-lg bg-white text-violet disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Descendre ${options[optIdx]}`}
                disabled={disabled || pos === order.length - 1}
                onClick={() => move(pos, 1)}
                className="h-8 w-8 rounded-lg bg-white text-violet disabled:opacity-30"
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ul>
      <Button
        full
        disabled={disabled}
        onClick={() => onSubmit({ textResponse: null, optionResponse: order })}
      >
        Valider mon classement
      </Button>
    </div>
  );
}

function Mission({ activity, onSubmit, disabled }: Props) {
  const total = activity.durationSeconds ?? 60;
  const [left, setLeft] = useState<number | null>(null);

  function start() {
    setLeft(total);
    const iv = setInterval(() => {
      setLeft((v) => {
        if (v === null) return null;
        if (v <= 1) {
          clearInterval(iv);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  return (
    <div className="space-y-3 text-center">
      {left === null ? (
        <Button full variant="soft" disabled={disabled} onClick={start}>
          Lancer le chrono ({total}s)
        </Button>
      ) : (
        <div className="font-display text-5xl font-700 text-violet tabular-nums">
          {left}s
        </div>
      )}
      <Button
        full
        disabled={disabled}
        onClick={() =>
          onSubmit({ textResponse: "mission", optionResponse: null })
        }
      >
        Mission accomplie
      </Button>
    </div>
  );
}
