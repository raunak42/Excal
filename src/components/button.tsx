"use client";

import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "solid" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantStyles: Record<ButtonVariant, string> = {
  solid:
    "border-transparent bg-[color:var(--accent)] text-[color:var(--accent-foreground)] shadow-[0_12px_26px_-18px_rgba(14,165,233,0.95)] hover:brightness-110",
  ghost:
    "border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--foreground)] hover:bg-[color:var(--card-muted)]",
  danger:
    "border-transparent bg-[color:var(--danger)] text-white shadow-[0_10px_20px_-14px_rgba(239,68,68,0.75)] hover:brightness-110",
};

export const Button = ({
  className,
  variant = "solid",
  type = "button",
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold tracking-tight transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
};
