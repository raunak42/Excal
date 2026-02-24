"use client";

import dynamic from "next/dynamic";

import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawProps } from "@excalidraw/excalidraw/types";
import { cn } from "@/lib/utils";

const Excalidraw = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");

    return mod.Excalidraw;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[420px] w-full items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] text-sm text-[color:var(--muted-foreground)]">
        Loading editor...
      </div>
    ),
  },
);

type ExcalidrawEditorProps = {
  initialData: ExcalidrawProps["initialData"];
  onChange: NonNullable<ExcalidrawProps["onChange"]>;
  theme: ExcalidrawProps["theme"];
  className?: string;
};

export const ExcalidrawEditor = ({
  initialData,
  onChange,
  theme,
  className,
}: ExcalidrawEditorProps) => {
  return (
    <div className={cn("h-full w-full", className)}>
      <Excalidraw
        initialData={initialData}
        onChange={onChange}
        theme={theme}
        autoFocus
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveAsImage: true,
            saveToActiveFile: false,
            export: {},
            clearCanvas: true,
            toggleTheme: false,
          },
        }}
      />
    </div>
  );
};
