import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { getSessionGithubId, unauthorizedResponse } from "@/lib/server/auth-session";
import {
  deleteProjectForOwner,
  getProjectForOwner,
  parsePatchProjectInput,
  updateProjectForOwner,
} from "@/lib/server/projects-store";

const projectIdParamsSchema = z.object({
  projectId: z.string().uuid(),
});

const invalidProjectIdResponse = () =>
  NextResponse.json({ error: "INVALID_PROJECT_ID" }, { status: 400 });

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const githubId = await getSessionGithubId();

  if (!githubId) {
    return unauthorizedResponse();
  }

  const params = projectIdParamsSchema.safeParse(await context.params);

  if (!params.success) {
    return invalidProjectIdResponse();
  }

  const project = await getProjectForOwner(params.data.projectId, githubId);

  if (!project) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const githubId = await getSessionGithubId();

  if (!githubId) {
    return unauthorizedResponse();
  }

  const params = projectIdParamsSchema.safeParse(await context.params);

  if (!params.success) {
    return invalidProjectIdResponse();
  }

  const body: unknown = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  let patchInput: ReturnType<typeof parsePatchProjectInput>;

  try {
    patchInput = parsePatchProjectInput(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
    }

    throw error;
  }

  const result = await updateProjectForOwner(params.data.projectId, githubId, patchInput);

  if (result.status === "not_found") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (result.status === "conflict") {
    return NextResponse.json(
      {
        error: "VERSION_CONFLICT",
        currentVersion: result.currentVersion,
        project: result.project,
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ project: result.project });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const githubId = await getSessionGithubId();

  if (!githubId) {
    return unauthorizedResponse();
  }

  const params = projectIdParamsSchema.safeParse(await context.params);

  if (!params.success) {
    return invalidProjectIdResponse();
  }

  const deleted = await deleteProjectForOwner(params.data.projectId, githubId);

  if (!deleted) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
