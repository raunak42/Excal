import { z } from "zod";

import { stringifyScene } from "@/lib/scene";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import {
  createDefaultProjectName,
  createEmptyScene,
  mapProjectRowToRecord,
  sanitizeProjectName,
  type ProjectRecord,
  type ProjectRow,
} from "@/types/project";

const PROJECT_SELECT =
  "id, owner_github_id, name, scene_json, version, created_at, updated_at, last_opened_at, deleted_at";

const patchSchema = z
  .object({
    name: z.string().optional(),
    sceneJson: z.string().optional(),
    baseVersion: z.number().int().min(1).optional(),
    touch: z.boolean().optional(),
  })
  .refine(
    (payload) =>
      Boolean(payload.name ?? payload.sceneJson ?? payload.touch),
    "Patch body is empty",
  );

export type PatchProjectInput = z.infer<typeof patchSchema>;

const nowIso = () => new Date().toISOString();

const mapRows = (rows: ProjectRow[] | null) =>
  (rows ?? []).map((row) => mapProjectRowToRecord(row));

export const parsePatchProjectInput = (body: unknown): PatchProjectInput =>
  patchSchema.parse(body);

export const listProjectsForOwner = async (ownerGithubId: number): Promise<ProjectRecord[]> => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("owner_github_id", ownerGithubId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return mapRows(data as ProjectRow[]);
};

export const createProjectForOwner = async (
  ownerGithubId: number,
  nameInput?: string,
): Promise<ProjectRecord> => {
  const supabaseAdmin = getSupabaseAdmin();
  const timestamp = nowIso();

  const { data, error } = await supabaseAdmin
    .from("projects")
    .insert({
      owner_github_id: ownerGithubId,
      name: sanitizeProjectName(nameInput ?? createDefaultProjectName()),
      scene_json: stringifyScene(createEmptyScene()),
      version: 1,
      created_at: timestamp,
      updated_at: timestamp,
      last_opened_at: timestamp,
      deleted_at: null,
    })
    .select(PROJECT_SELECT)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create project.");
  }

  return mapProjectRowToRecord(data as ProjectRow);
};

export const getProjectForOwner = async (
  projectId: string,
  ownerGithubId: number,
): Promise<ProjectRecord | null> => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("id", projectId)
    .eq("owner_github_id", ownerGithubId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapProjectRowToRecord(data as ProjectRow);
};

export const deleteProjectForOwner = async (
  projectId: string,
  ownerGithubId: number,
): Promise<boolean> => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("projects")
    .update({ deleted_at: nowIso() })
    .eq("id", projectId)
    .eq("owner_github_id", ownerGithubId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.id);
};

const updateSimpleProjectFields = async (
  projectId: string,
  ownerGithubId: number,
  payload: PatchProjectInput,
) => {
  const supabaseAdmin = getSupabaseAdmin();
  const updates: Record<string, unknown> = {
    updated_at: nowIso(),
  };

  if (payload.name) {
    updates.name = sanitizeProjectName(payload.name);
  }

  if (payload.touch) {
    updates.last_opened_at = nowIso();
  }

  const { data, error } = await supabaseAdmin
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .eq("owner_github_id", ownerGithubId)
    .is("deleted_at", null)
    .select(PROJECT_SELECT)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapProjectRowToRecord(data as ProjectRow);
};

export const updateProjectForOwner = async (
  projectId: string,
  ownerGithubId: number,
  payload: PatchProjectInput,
): Promise<
  | { status: "updated"; project: ProjectRecord }
  | { status: "not_found" }
  | { status: "conflict"; project: ProjectRecord; currentVersion: number }
> => {
  const supabaseAdmin = getSupabaseAdmin();
  const hasSceneUpdate = typeof payload.sceneJson === "string";

  if (!hasSceneUpdate) {
    const updated = await updateSimpleProjectFields(projectId, ownerGithubId, payload);

    if (!updated) {
      return { status: "not_found" };
    }

    return { status: "updated", project: updated };
  }

  if (typeof payload.baseVersion !== "number") {
    throw new Error("baseVersion is required when sceneJson is provided");
  }

  const timestamp = nowIso();

  const { data, error } = await supabaseAdmin
    .from("projects")
    .update({
      scene_json: payload.sceneJson,
      version: payload.baseVersion + 1,
      updated_at: timestamp,
      last_opened_at: timestamp,
      ...(payload.name ? { name: sanitizeProjectName(payload.name) } : {}),
    })
    .eq("id", projectId)
    .eq("owner_github_id", ownerGithubId)
    .eq("version", payload.baseVersion)
    .is("deleted_at", null)
    .select(PROJECT_SELECT)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return {
      status: "updated",
      project: mapProjectRowToRecord(data as ProjectRow),
    };
  }

  const current = await getProjectForOwner(projectId, ownerGithubId);

  if (!current) {
    return { status: "not_found" };
  }

  return {
    status: "conflict",
    project: current,
    currentVersion: current.version,
  };
};
