"use client";

import { Github } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/button";

export const LoginCard = () => {
  return (
    <div className="mt-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
      <Button
        className="h-11 w-full"
        onClick={() =>
          void signIn("github", {
            callbackUrl: "/projects",
          })
        }
      >
        <Github className="mr-2 h-4 w-4" />
        Continue with GitHub
      </Button>
    </div>
  );
};
