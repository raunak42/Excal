"use client";

import type { ExcalidrawProps } from "@excalidraw/excalidraw/types";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/button";
import { ExcalidrawEditor } from "@/components/excalidraw-editor";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  createProject,
  getProjectConflictPayload,
  isProjectConflictError,
  loadProjectById,
  renameProject,
  saveProjectScene,
  touchProject,
} from "@/lib/projects-api";
import { parseSceneJson, serializeSceneSnapshot } from "@/lib/scene";
import { formatRelativeTime } from "@/lib/time";
import { sanitizeProjectName, type ProjectRecord } from "@/types/project";

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error" | "conflict";

type ConflictState = {
  remoteProject: ProjectRecord;
  localSceneJson: string;
};

const statusLabelMap: Record<SaveStatus, string> = {
  idle: "Idle",
  dirty: "Unsaved changes",
  saving: "Syncing...",
  saved: "Synced",
  error: "Sync failed",
  conflict: "Version conflict",
};

type ExcalidrawSerializer = typeof import("@excalidraw/excalidraw")["serializeAsJSON"];

export default function ProjectEditorPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const params = useParams<{ projectId: string }>();

  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sceneJsonDraft, setSceneJsonDraft] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [conflictState, setConflictState] = useState<ConflictState | null>(null);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [runtimeSerializer, setRuntimeSerializer] =
    useState<ExcalidrawSerializer | null>(null);

  const initialData = useMemo(
    () => (project ? parseSceneJson(project.sceneJson) : null),
    [project],
  );

  const canvasTheme: ExcalidrawProps["theme"] =
    resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    let isCancelled = false;

    const loadSerializer = async () => {
      try {
        const mod = await import("@excalidraw/excalidraw");

        if (!isCancelled) {
          setRuntimeSerializer(() => mod.serializeAsJSON);
        }
      } catch {
        if (!isCancelled) {
          setRuntimeSerializer(null);
        }
      }
    };

    void loadSerializer();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projectId) {
      setLoadError("Invalid project id.");
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadProject = async () => {
      try {
        setLoadError(null);
        const record = await loadProjectById(projectId);

        if (!record) {
          setLoadError("Project not found.");
          return;
        }

        if (!isCancelled) {
          setProject(record);
          setNameDraft(record.name);
          setSceneJsonDraft(record.sceneJson);
          setSaveStatus("saved");
        }

        await touchProject(record.id);
      } catch {
        if (!isCancelled) {
          setLoadError("Could not load this project.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProject();

    return () => {
      isCancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!project) {
      return;
    }

    const sanitized = sanitizeProjectName(nameDraft);

    if (sanitized === project.name) {
      return;
    }

    const timerId = window.setTimeout(async () => {
      try {
        const updated = await renameProject(project.id, sanitized);

        if (updated) {
          setProject(updated);
        }
      } catch {
        setSaveStatus("error");
      }
    }, 500);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [nameDraft, project]);

  const persistScene = useCallback(
    async (nextSceneJson: string): Promise<"saved" | "error" | "conflict"> => {
      if (!projectId || !project) {
        return "error";
      }

      setSaveStatus("saving");

      try {
        const updated = await saveProjectScene(projectId, nextSceneJson, project.version);

        if (!updated) {
          setSaveStatus("error");
          return "error";
        }

        setProject(updated);
        setSceneJsonDraft(updated.sceneJson);
        setConflictState(null);
        setSaveStatus("saved");
        return "saved";
      } catch (error) {
        if (isProjectConflictError(error)) {
          const payload = getProjectConflictPayload(error);
          setProject(payload.project);
          setConflictState({
            remoteProject: payload.project,
            localSceneJson: nextSceneJson,
          });
          setSaveStatus("conflict");
          return "conflict";
        }

        setSaveStatus("error");
        return "error";
      }
    },
    [project, projectId],
  );

  useEffect(() => {
    if (
      !sceneJsonDraft ||
      !project ||
      sceneJsonDraft === project.sceneJson ||
      saveStatus === "saving"
    ) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void persistScene(sceneJsonDraft);
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [persistScene, project, saveStatus, sceneJsonDraft]);

  useEffect(() => {
    if (!isCanvasFullscreen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCanvasFullscreen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isCanvasFullscreen]);

  const handleSceneChange: NonNullable<ExcalidrawProps["onChange"]> = (
    elements,
    appState,
    files,
  ) => {
    const nextSceneJson = runtimeSerializer
      ? runtimeSerializer(elements, appState, files, "database")
      : serializeSceneSnapshot(elements, appState, files);
    setSceneJsonDraft((currentDraft) =>
      currentDraft === nextSceneJson ? currentDraft : nextSceneJson,
    );

    if (project && nextSceneJson === project.sceneJson) {
      setSaveStatus((currentStatus) =>
        currentStatus === "saving" ? currentStatus : "saved",
      );
      return;
    }

    setSaveStatus("dirty");
  };

  const handleLoadRemoteVersion = () => {
    if (!conflictState) {
      return;
    }

    window.location.reload();
  };

  const handleSaveAsCopy = async () => {
    if (!conflictState) {
      return;
    }

    const copy = await createProject(`${project?.name ?? "Project"} Copy`);
    const updatedCopy = await saveProjectScene(copy.id, conflictState.localSceneJson, copy.version);

    if (!updatedCopy) {
      setSaveStatus("error");
      return;
    }

    router.push(`/projects/${updatedCopy.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your project...
        </div>
      </div>
    );
  }

  if (loadError || !project || !initialData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 text-center shadow-[0_20px_40px_-24px_rgba(0,0,0,0.7)]">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--danger-bg)] text-[color:var(--danger)]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">
            Unable to open project
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            {loadError ?? "This project is unavailable."}
          </p>
          <Link href="/projects" className="mt-5 inline-flex">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col gap-4 overflow-hidden px-3 py-3 md:px-5 md:py-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_12%,var(--accent-soft),transparent_34%),radial-gradient(circle_at_92%_8%,var(--accent-soft-alt),transparent_28%)]" />

      {!isCanvasFullscreen ? (
        <header className="glass-panel flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 md:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link href="/projects">
              <Button variant="ghost" className="h-10 w-10 p-0">
                <ArrowLeft width={30} size={30} className="h-[32px] w-[32px] size-[32px] stroke-[2.4]" />
              </Button>
            </Link>

            <div className="min-w-0 flex-1">
              <input
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                maxLength={80}
                className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm font-semibold tracking-tight text-[color:var(--foreground)] outline-none transition-colors focus:border-[color:var(--accent)]"
                aria-label="Project name"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden h-10 items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-xs font-medium text-[color:var(--muted-foreground)] lg:inline-flex">
              Updated {formatRelativeTime(project.updatedAt)}
            </div>

            <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-xs font-medium text-[color:var(--muted-foreground)]">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  saveStatus === "saved"
                    ? "bg-emerald-500"
                    : saveStatus === "saving"
                      ? "bg-amber-500"
                      : saveStatus === "error" || saveStatus === "conflict"
                        ? "bg-rose-500"
                        : "bg-sky-500"
                }`}
              />
              {statusLabelMap[saveStatus]}
            </div>

            <Button
              variant="ghost"
              className="h-10"
              onClick={() => setIsCanvasFullscreen(true)}
              title="Expand canvas"
            >
              <Maximize2 className="mr-2 h-4 w-4" />
              Full Page
            </Button>

            <ThemeToggle />
          </div>
        </header>
      ) : (
        <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)]/90 px-2 py-2 shadow-[0_12px_24px_-20px_rgba(0,0,0,0.85)] backdrop-blur">
          <Button
            variant="ghost"
            className="h-9"
            onClick={() => setIsCanvasFullscreen(false)}
            title="Exit full page"
          >
            <Minimize2 className="mr-2 h-4 w-4" />
            Exit
          </Button>

          <div className="inline-flex h-9 items-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-xs font-medium text-[color:var(--muted-foreground)]">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                saveStatus === "saved"
                  ? "bg-emerald-500"
                  : saveStatus === "saving"
                    ? "bg-amber-500"
                    : saveStatus === "error" || saveStatus === "conflict"
                      ? "bg-rose-500"
                      : "bg-sky-500"
              }`}
            />
            {statusLabelMap[saveStatus]}
          </div>

          <ThemeToggle className="h-9 w-9" />
        </div>
      )}

      {conflictState && !isCanvasFullscreen ? (
        <div className="glass-panel border-[color:var(--danger-soft)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[color:var(--danger)]">
              This project was changed on another device. Choose which version to keep.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleLoadRemoteVersion}>
                Load Remote
              </Button>
              <Button onClick={() => void handleSaveAsCopy()}>Save Local as Copy</Button>
            </div>
          </div>
        </div>
      ) : null}

      {isCanvasFullscreen ? (
        <section className="fixed inset-0 z-50 overflow-hidden bg-[color:var(--canvas-shell)] p-3 md:p-4">
          <div className="h-full w-full">
            <ExcalidrawEditor
              key={`${project.id}-fullscreen`}
              initialData={initialData}
              onChange={handleSceneChange}
              theme={canvasTheme}
              className="excalidraw-fullpage"
            />
          </div>
        </section>
      ) : (
        <section className="glass-panel relative flex-1 overflow-hidden p-1.5">
          <div className="h-[calc(100vh-128px)] overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--canvas-shell)]">
            <ExcalidrawEditor
              key={`${project.id}-default`}
              initialData={initialData}
              onChange={handleSceneChange}
              theme={canvasTheme}
            />
          </div>
        </section>
      )}
    </div>
  );
}
