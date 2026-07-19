"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "soft";

const variants: Record<Variant, string> = {
  primary:
    "aurora text-white shadow-[0_18px_48px_-20px_rgba(58,29,110,0.6)] hover:brightness-105",
  secondary:
    "bg-white text-violet border border-violet/15 shadow-[0_10px_30px_-18px_rgba(58,29,110,0.4)] hover:border-violet/30",
  ghost: "bg-transparent text-violet/70 hover:text-violet hover:bg-white/50",
  soft: "bg-white/70 text-ink border border-white/60 hover:bg-white",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", full, className = "", children, ...rest }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${
        variants[variant]
      } ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.75rem] bg-white/85 backdrop-blur-sm border border-white/70 shadow-[0_18px_48px_-24px_rgba(58,29,110,0.35)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-pink">
      {children}
    </span>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 w-full max-w-md mx-auto px-5 py-8 flex flex-col">
      {children}
    </main>
  );
}

export function Avatar({ emoji, name }: { emoji: string; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="grid place-items-center w-10 h-10 rounded-2xl bg-cream-deep text-xl shadow-inner"
      >
        {emoji}
      </span>
      <span className="font-medium text-ink">{name}</span>
    </div>
  );
}
