import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";

import { createEmptyScene, type SceneSnapshot } from "@/types/project";

export const stringifyScene = (scene: SceneSnapshot): string =>
  JSON.stringify(scene);

const normalizeMigratedAppState = (
  appState: ExcalidrawInitialDataState["appState"] | undefined,
) => ({
  ...(appState ?? {}),
  // Migrate previous default palette to the new white/black defaults.
  viewBackgroundColor:
    appState?.viewBackgroundColor === "#0b1022"
      ? "#ffffff"
      : appState?.viewBackgroundColor,
  currentItemStrokeColor:
    appState?.currentItemStrokeColor === "#172554"
      ? "#000000"
      : appState?.currentItemStrokeColor,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const parseSceneJson = (sceneJson: string): ExcalidrawInitialDataState => {
  try {
    const parsed: unknown = JSON.parse(sceneJson);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "elements" in parsed &&
      Array.isArray(parsed.elements)
    ) {
      const normalized = parsed as ExcalidrawInitialDataState;

      return {
        ...normalized,
        appState: normalizeMigratedAppState(normalized.appState),
      };
    }
  } catch {
    return createEmptyScene();
  }

  return createEmptyScene();
};

export const parseImportedSceneJson = (sceneJson: string): SceneSnapshot => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(sceneJson);
  } catch {
    throw new Error("This is not valid JSON.");
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.elements)) {
    throw new Error("Invalid Excalidraw file. Missing elements array.");
  }

  const appState = normalizeMigratedAppState(
    isRecord(parsed.appState)
      ? (parsed.appState as ExcalidrawInitialDataState["appState"])
      : {},
  );

  const files = isRecord(parsed.files)
    ? (parsed.files as SceneSnapshot["files"])
    : {};

  return {
    type: "excalidraw",
    version: 2,
    source: "solo-draw-app",
    elements: parsed.elements as SceneSnapshot["elements"],
    appState,
    files,
  };
};

export const serializeSceneSnapshot = (
  elements: unknown,
  appState: unknown,
  files: unknown,
) =>
  stringifyScene({
    type: "excalidraw",
    version: 2,
    source: "solo-draw-app",
    elements: Array.isArray(elements) ? elements : [],
    appState:
      typeof appState === "object" && appState !== null
        ? (appState as SceneSnapshot["appState"])
        : {},
    files:
      typeof files === "object" && files !== null
        ? (files as SceneSnapshot["files"])
        : {},
  });
