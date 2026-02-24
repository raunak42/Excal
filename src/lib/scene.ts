import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";

import { createEmptyScene, type SceneSnapshot } from "@/types/project";

export const stringifyScene = (scene: SceneSnapshot): string =>
  JSON.stringify(scene);

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
      const appState = normalized.appState ?? {};

      return {
        ...normalized,
        appState: {
          ...appState,
          // Migrate previous default palette to the new white/black defaults.
          viewBackgroundColor:
            appState.viewBackgroundColor === "#0b1022"
              ? "#ffffff"
              : appState.viewBackgroundColor,
          currentItemStrokeColor:
            appState.currentItemStrokeColor === "#172554"
              ? "#000000"
              : appState.currentItemStrokeColor,
        },
      };
    }
  } catch {
    return createEmptyScene();
  }

  return createEmptyScene();
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
