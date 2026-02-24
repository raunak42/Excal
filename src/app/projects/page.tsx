"use client";

import { ClipboardPaste, FileUp, FolderOpen, LogOut, Plus, Sparkles } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/button";
import { ProjectCard } from "@/components/project-card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  createProject,
  deleteProject,
  getApiErrorMessage,
  loadProjects,
  renameProject,
  saveProjectScene,
} from "@/lib/projects-api";
import { parseImportedSceneJson, stringifyScene } from "@/lib/scene";
import { createDefaultProjectName, type ProjectRecord } from "@/types/project";

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState(createDefaultProjectName());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importProjectName, setImportProjectName] = useState(createDefaultProjectName());
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [renameTarget, setRenameTarget] = useState<ProjectRecord | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<ProjectRecord | null>(null);

  const projectCountLabel = useMemo(() => {
    if (projects.length === 0) {
      return "No projects yet";
    }

    return `${projects.length} ${projects.length === 1 ? "project" : "projects"}`;
  }, [projects.length]);

  const refreshProjects = async () => {
    try {
      setError(null);
      const nextProjects = await loadProjects();
      setProjects(nextProjects);
    } catch {
      setError("Could not load projects.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshProjects();
  }, []);

  const handleCreateProject = async () => {
    if (isCreating) {
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      const project = await createProject(newProjectName);
      setNewProjectName(createDefaultProjectName());
      router.push(`/projects/${project.id}`);
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenImportModal = () => {
    setImportProjectName(createDefaultProjectName());
    setImportText("");
    setImportError(null);
    setIsImportModalOpen(true);
  };

  const resolveImportError = (error: unknown): string => {
    if (error instanceof Error) {
      const trimmed = error.message.trim();

      if (
        trimmed === "This is not valid JSON." ||
        trimmed === "Invalid Excalidraw file. Missing elements array."
      ) {
        return trimmed;
      }
    }

    return getApiErrorMessage(error);
  };

  const importIntoNewProject = async (rawSceneJson: string) => {
    if (isImporting) {
      return;
    }

    setIsImporting(true);
    setImportError(null);

    let createdProject: ProjectRecord | null = null;

    try {
      const importedScene = parseImportedSceneJson(rawSceneJson);
      const sceneJson = stringifyScene(importedScene);
      const projectName = importProjectName.trim() || createDefaultProjectName();

      createdProject = await createProject(projectName);
      await saveProjectScene(createdProject.id, sceneJson, createdProject.version);

      setIsImportModalOpen(false);
      setImportText("");
      setImportProjectName(createDefaultProjectName());
      router.push(`/projects/${createdProject.id}`);
    } catch (error) {
      if (createdProject) {
        setImportError(
          "Project was created, but import sync failed. Open it from the list and save once to retry.",
        );
        await refreshProjects();
      } else {
        setImportError(resolveImportError(error));
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromTextarea = async () => {
    const trimmed = importText.trim();

    if (!trimmed) {
      setImportError("Paste Excalidraw JSON before importing.");
      return;
    }

    await importIntoNewProject(trimmed);
  };

  const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const text = await file.text();
    setImportText(text);
    await importIntoNewProject(text);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();

      if (!clipboardText.trim()) {
        setImportError("Clipboard is empty.");
        return;
      }

      setImportText(clipboardText);
      setImportError(null);
    } catch {
      setImportError("Clipboard access was blocked. Paste manually in the textbox.");
    }
  };

  const openRenameModal = (project: ProjectRecord) => {
    setRenameTarget(project);
    setRenameValue(project.name);
  };

  const handleRename = async () => {
    if (!renameTarget) {
      return;
    }

    try {
      await renameProject(renameTarget.id, renameValue);
      setRenameTarget(null);
      await refreshProjects();
    } catch (error) {
      setError(getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
      await refreshProjects();
    } catch (error) {
      setError(getApiErrorMessage(error));
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 py-8 md:px-8 md:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_18%,var(--accent-soft),transparent_35%),radial-gradient(circle_at_85%_10%,var(--accent-soft-alt),transparent_30%)]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="glass-panel p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--card-muted)] px-3 py-1 text-xs font-medium text-[color:var(--muted-foreground)]">
                <Sparkles className="h-3.5 w-3.5" />
                Single-user synced workspace
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--foreground)] md:text-4xl">
                Solo Draw Projects
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--muted-foreground)] md:text-base">
                Projects sync through Supabase and are cached locally for resilience.
                No server files are written on Vercel.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" className="h-10" onClick={() => void signOut({ callbackUrl: "/login" })}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-3 md:grid-cols-[1fr_auto_auto] md:p-4">
            <input
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              placeholder="Project name"
              maxLength={80}
              className="h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--card-muted)] px-4 text-sm font-medium text-[color:var(--foreground)] outline-none ring-0 transition-all focus:border-[color:var(--accent)]"
            />
            <Button
              className="h-11 w-full px-5 md:w-auto"
              onClick={handleCreateProject}
              disabled={isCreating}
            >
              <Plus className="mr-2 h-4 w-4" />
              {isCreating ? "Creating..." : "Create Project"}
            </Button>
            <Button
              variant="ghost"
              className="h-11 w-full px-5 md:w-auto"
              onClick={handleOpenImportModal}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Import File
            </Button>
          </div>
        </header>

        <section className="glass-panel p-5 md:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
              {projectCountLabel}
            </h2>
          </div>

          {error ? (
            <div className="rounded-xl border border-[color:var(--danger-soft)] bg-[color:var(--danger-bg)] px-4 py-3 text-sm text-[color:var(--danger)]">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`placeholder-${index}`}
                  className="h-44 animate-pulse rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-muted)]"
                />
              ))}
            </div>
          ) : null}

          {!isLoading && projects.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--border-strong)] bg-[color:var(--card)] p-8 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--card-muted)]">
                <FolderOpen className="h-5 w-5 text-[color:var(--muted-foreground)]" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">
                Start your first canvas project
              </h3>
              <p className="mt-2 max-w-md text-sm text-[color:var(--muted-foreground)]">
                Name a project above, create it, and your drawings will autosave locally and sync to cloud.
              </p>
            </div>
          ) : null}

          {!isLoading && projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onRename={openRenameModal}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          ) : null}
        </section>
      </div>

      {renameTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[0_24px_55px_-32px_rgba(0,0,0,0.75)]">
            <h3 className="text-lg font-semibold text-[color:var(--foreground)]">Rename project</h3>
            <input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              className="mt-4 h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card-muted)] px-4 text-sm text-[color:var(--foreground)] outline-none focus:border-[color:var(--accent)]"
              maxLength={80}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRenameTarget(null)}>
                Cancel
              </Button>
              <Button onClick={handleRename}>
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[0_24px_55px_-32px_rgba(0,0,0,0.75)]">
            <h3 className="text-lg font-semibold text-[color:var(--foreground)]">Delete project?</h3>
            <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
              This permanently removes <span className="font-medium">{deleteTarget.name}</span>
              .
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isImportModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[0_24px_55px_-32px_rgba(0,0,0,0.75)]">
            <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
              Import Excalidraw as New Project
            </h3>
            <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
              Paste Excalidraw JSON or upload a <code>.excalidraw</code> file.
            </p>

            {importError ? (
              <div className="mt-4 rounded-xl border border-[color:var(--danger-soft)] bg-[color:var(--danger-bg)] px-4 py-3 text-sm text-[color:var(--danger)]">
                {importError}
              </div>
            ) : null}

            <input
              value={importProjectName}
              onChange={(event) => setImportProjectName(event.target.value)}
              placeholder="New project name"
              maxLength={80}
              className="mt-4 h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card-muted)] px-4 text-sm font-medium text-[color:var(--foreground)] outline-none focus:border-[color:var(--accent)]"
            />

            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="Paste Excalidraw JSON here..."
              className="mt-3 min-h-56 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card-muted)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none focus:border-[color:var(--accent)]"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 text-sm font-semibold tracking-tight text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--card-muted)]">
                <FileUp className="mr-2 h-4 w-4" />
                Choose .excalidraw
                <input
                  type="file"
                  accept=".excalidraw,.json,application/json"
                  className="hidden"
                  onChange={(event) => void handleImportFileChange(event)}
                />
              </label>

              <Button variant="ghost" className="h-10" onClick={() => void handlePasteFromClipboard()}>
                <ClipboardPaste className="mr-2 h-4 w-4" />
                Paste Clipboard
              </Button>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  if (isImporting) {
                    return;
                  }

                  setIsImportModalOpen(false);
                  setImportError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleImportFromTextarea()}
                disabled={isImporting || !importText.trim()}
              >
                {isImporting ? "Importing..." : "Create from Import"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
