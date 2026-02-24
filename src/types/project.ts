import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";

export type SceneSnapshot = Required<
  Pick<ExcalidrawInitialDataState, "elements" | "appState" | "files">
> & {
  type: "excalidraw";
  version: number;
  source: string;
};

export type ProjectRecord = {
  id: string;
  name: string;
  sceneJson: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
};

export type ProjectConflictErrorPayload = {
  error: "VERSION_CONFLICT";
  currentVersion: number;
  project: ProjectRecord;
};

export const MAX_PROJECT_NAME_LENGTH = 80;
export const FALLBACK_PROJECT_NAME = "Untitled Project";

export const sanitizeProjectName = (input: string) => {
  const normalized = input.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return FALLBACK_PROJECT_NAME;
  }

  return normalized.slice(0, MAX_PROJECT_NAME_LENGTH);
};

export const createEmptyScene = (): SceneSnapshot => ({
  type: "excalidraw",
  version: 2,
  source: "solo-draw-app",
  elements: [],
  appState: {
    viewBackgroundColor: "#ffffff",
    currentItemStrokeColor: "#000000",
    currentItemBackgroundColor: "transparent",
  },
  files: {},
});

export const createDefaultProjectName = () => {
  const stamp = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date());

  return `Project ${stamp}`;
};

export type ProjectRow = {
  id: string;
  owner_github_id: number;
  name: string;
  scene_json: string;
  version: number;
  created_at: string;
  updated_at: string;
  last_opened_at: string;
  deleted_at: string | null;
};

export const mapProjectRowToRecord = (row: ProjectRow): ProjectRecord => ({
  id: row.id,
  name: row.name,
  sceneJson: row.scene_json,
  version: row.version,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastOpenedAt: row.last_opened_at,
});
