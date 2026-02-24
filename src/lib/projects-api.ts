import {
  deleteLocalProject,
  getLocalProjectById,
  listLocalProjects,
  saveLocalProjectScene,
  touchLocalProject,
  upsertLocalProject,
  upsertLocalProjects,
} from "@/lib/projects-db";
import {
  createDefaultProjectName,
  type ProjectConflictErrorPayload,
  type ProjectRecord,
} from "@/types/project";

class ApiError extends Error {
  readonly status: number;

  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const isApiErrorPayload = (value: unknown): value is { error?: string } => {
  return typeof value === "object" && value !== null;
};

const requestJson = async <T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    throw new ApiError("API request failed", response.status, payload);
  }

  if (!payload) {
    throw new ApiError("API returned empty payload", response.status, payload);
  }

  return payload;
};

export const isProjectConflictError = (error: unknown): error is ApiError => {
  if (!(error instanceof ApiError)) {
    return false;
  }

  const payload = error.payload as ProjectConflictErrorPayload | null;

  return error.status === 409 && payload?.error === "VERSION_CONFLICT";
};

export const getProjectConflictPayload = (
  error: ApiError,
): ProjectConflictErrorPayload => {
  return error.payload as ProjectConflictErrorPayload;
};

export const getApiErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    return "Request failed. Please try again.";
  }

  if (error.status === 401) {
    return "Your session is invalid. Sign out and sign in again.";
  }

  if (error.status === 403) {
    return "You do not have access to this resource.";
  }

  if (isApiErrorPayload(error.payload) && typeof error.payload.error === "string") {
    return `${error.payload.error} (${error.status})`;
  }

  return `Request failed (${error.status}).`;
};

export const loadProjects = async (): Promise<ProjectRecord[]> => {
  try {
    const response = await requestJson<{ projects: ProjectRecord[] }>("/api/projects");
    await upsertLocalProjects(response.projects);
    return response.projects;
  } catch {
    return listLocalProjects();
  }
};

export const loadProjectById = async (projectId: string): Promise<ProjectRecord | null> => {
  try {
    const response = await requestJson<{ project: ProjectRecord }>(
      `/api/projects/${projectId}`,
    );

    await upsertLocalProject(response.project);

    return response.project;
  } catch {
    return getLocalProjectById(projectId);
  }
};

export const createProject = async (name?: string): Promise<ProjectRecord> => {
  const response = await requestJson<{ project: ProjectRecord }>("/api/projects", {
    method: "POST",
    body: JSON.stringify({
      name: name ?? createDefaultProjectName(),
    }),
  });

  await upsertLocalProject(response.project);

  return response.project;
};

export const renameProject = async (
  projectId: string,
  name: string,
): Promise<ProjectRecord | null> => {
  const response = await requestJson<{ project: ProjectRecord }>(
    `/api/projects/${projectId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ name }),
    },
  );

  await upsertLocalProject(response.project);

  return response.project;
};

export const touchProject = async (projectId: string) => {
  try {
    await requestJson<{ project: ProjectRecord }>(`/api/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ touch: true }),
    });
  } catch {
    await touchLocalProject(projectId);
  }
};

export const saveProjectScene = async (
  projectId: string,
  sceneJson: string,
  baseVersion: number,
): Promise<ProjectRecord | null> => {
  await saveLocalProjectScene(projectId, sceneJson);

  const response = await requestJson<{ project: ProjectRecord }>(
    `/api/projects/${projectId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        sceneJson,
        baseVersion,
      }),
    },
  );

  await upsertLocalProject(response.project);

  return response.project;
};

export const deleteProject = async (projectId: string) => {
  await requestJson<{ ok: true }>(`/api/projects/${projectId}`, {
    method: "DELETE",
  });

  await deleteLocalProject(projectId);
};
