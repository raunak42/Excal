import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { createAuthOptions } from "@/lib/auth-options";

export const getSessionGithubId = async () => {
  const session = await getServerSession(createAuthOptions());
  const githubId = session?.user?.githubId;

  if (typeof githubId !== "number") {
    return null;
  }

  return githubId;
};

export const unauthorizedResponse = () =>
  NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
