import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

import { getServerEnv } from "@/lib/server/env";

const getGithubProfileId = (profile: unknown): number | null => {
  if (!profile || typeof profile !== "object" || !("id" in profile)) {
    return null;
  }

  const profileId = (profile as { id: unknown }).id;

  if (typeof profileId !== "number") {
    if (typeof profileId !== "string") {
      return null;
    }

    const parsed = Number(profileId);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return profileId;
};

export const createAuthOptions = (): NextAuthOptions => {
  const serverEnv = getServerEnv();
  const allowedGithubId = Number(serverEnv.allowedGithubId);

  if (!Number.isFinite(allowedGithubId)) {
    throw new Error("ALLOWED_GITHUB_ID must be a numeric GitHub account id.");
  }

  return {
    secret: serverEnv.authSecret,
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: "/login",
    },
    providers: [
      GitHubProvider({
        clientId: serverEnv.githubClientId,
        clientSecret: serverEnv.githubClientSecret,
      }),
    ],
    callbacks: {
      async signIn({ account, profile }) {
        if (account?.provider !== "github") {
          return false;
        }

        const profileId = getGithubProfileId(profile);

        if (profileId === null) {
          return false;
        }

        return profileId === allowedGithubId;
      },
      async jwt({ token, profile, account }) {
        if (account?.provider === "github") {
          const profileId = getGithubProfileId(profile);

          if (profileId !== null) {
            token.githubId = profileId;
          }
        }

        return token;
      },
      async session({ session, token }) {
        if (!session.user) {
          return session;
        }

        const githubIdFromToken =
          typeof token.githubId === "number"
            ? token.githubId
            : typeof token.sub === "string"
              ? Number(token.sub)
              : NaN;

        if (Number.isFinite(githubIdFromToken)) {
          session.user.githubId = githubIdFromToken;
        }

        return session;
      },
    },
  };
};
