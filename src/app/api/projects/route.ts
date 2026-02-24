import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionGithubId, unauthorizedResponse } from "@/lib/server/auth-session";
import { createProjectForOwner, listProjectsForOwner } from "@/lib/server/projects-store";

const createProjectSchema = z.object({
  name: z.string().optional(),
});

export async function GET() {
  const githubId = await getSessionGithubId();

  if (!githubId) {
    return unauthorizedResponse();
  }

  const projects = await listProjectsForOwner(githubId);

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const githubId = await getSessionGithubId();

  if (!githubId) {
    return unauthorizedResponse();
  }

  const json: unknown = await request.json().catch(() => ({}));
  const payload = createProjectSchema.safeParse(json);

  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const project = await createProjectForOwner(githubId, payload.data.name);

  return NextResponse.json({ project }, { status: 201 });
}
