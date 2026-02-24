"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--foreground)] shadow-[0_8px_30px_-15px_rgba(24,39,75,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-18px_rgba(24,39,75,0.6)]",
        className,
      )}
      aria-label="Toggle theme"
      title="Toggle light and dark mode"
    >
      <MoonStar className="h-[18px] w-[18px] dark:hidden" />
      <SunMedium className="hidden h-[18px] w-[18px] dark:block" />
    </button>
  );
};
