import Dexie, { type Table } from "dexie";

import type { ProjectRecord } from "@/types/project";

class SoloDrawDatabase extends Dexie {
  projects!: Table<ProjectRecord, string>;

  constructor() {
    super("solo-draw-db");
    this.version(2).stores({
      projects: "id, name, version, updatedAt, lastOpenedAt",
    });
  }
}

let db: SoloDrawDatabase | null = null;

const getDb = () => {
  if (!db) {
    db = new SoloDrawDatabase();
  }

  return db;
};

const now = () => new Date().toISOString();

const normalizeProject = (project: ProjectRecord): ProjectRecord => ({
  ...project,
  version: Number.isFinite(project.version) ? project.version : 1,
});

export const listLocalProjects = async (): Promise<ProjectRecord[]> => {
  const projects = await getDb().projects.orderBy("updatedAt").reverse().toArray();
  return projects.map(normalizeProject);
};

export const getLocalProjectById = async (projectId: string) => {
  const project = await getDb().projects.get(projectId);
  return project ? normalizeProject(project) : null;
};

export const upsertLocalProject = async (project: ProjectRecord) => {
  await getDb().projects.put(normalizeProject(project));
};

export const upsertLocalProjects = async (projects: ProjectRecord[]) => {
  if (projects.length === 0) {
    return;
  }

  await getDb().projects.bulkPut(projects.map(normalizeProject));
};

export const saveLocalProjectScene = async (projectId: string, sceneJson: string) => {
  const updatedAt = now();

  await getDb().projects.update(projectId, {
    sceneJson,
    updatedAt,
    lastOpenedAt: updatedAt,
  });

  return getLocalProjectById(projectId);
};

export const touchLocalProject = async (projectId: string) => {
  await getDb().projects.update(projectId, {
    lastOpenedAt: now(),
  });
};

export const deleteLocalProject = async (projectId: string) => {
  await getDb().projects.delete(projectId);
};
