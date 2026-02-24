import { Sparkles } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { LoginCard } from "@/components/login-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { createAuthOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getServerSession(createAuthOptions());

  if (session) {
    redirect("/projects");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_16%,var(--accent-soft),transparent_35%),radial-gradient(circle_at_82%_10%,var(--accent-soft-alt),transparent_30%)]" />

      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <section className="glass-panel w-full max-w-md p-7 md:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--card-muted)] px-3 py-1 text-xs font-medium text-[color:var(--muted-foreground)]">
          <Sparkles className="h-3.5 w-3.5" />
          Private workspace
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
          Sign in to Solo Draw
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-foreground)]">
          Access is restricted to your single GitHub account. Once signed in, projects
          sync through Supabase with local browser caching.
        </p>

        <LoginCard />
      </section>
    </main>
  );
}
