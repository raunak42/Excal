"use client";

import Link from "next/link";
import { ArrowUpRight, PencilLine, Trash2 } from "lucide-react";

import { Button } from "@/components/button";
import { formatRelativeTime } from "@/lib/time";
import type { ProjectRecord } from "@/types/project";

type ProjectCardProps = {
  project: ProjectRecord;
  onRename: (project: ProjectRecord) => void;
  onDelete: (project: ProjectRecord) => void;
};

export const ProjectCard = ({ project, onRename, onDelete }: ProjectCardProps) => {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[0_20px_45px_-28px_rgba(10,24,48,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--border-strong)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,var(--accent-soft),transparent_42%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <h3 className="line-clamp-1 text-lg font-semibold tracking-tight text-[color:var(--foreground)]">
            {project.name}
          </h3>
          <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
            Updated {formatRelativeTime(project.updatedAt)}
          </p>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--card-muted)] text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--card)]"
          title="Open project"
          aria-label={`Open ${project.name}`}
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="relative mt-5 flex gap-2">
        <Button variant="ghost" className="h-9 px-3 text-xs" onClick={() => onRename(project)}>
          <PencilLine className="mr-2 h-3.5 w-3.5" />
          Rename
        </Button>
        <Button variant="danger" className="h-9 px-3 text-xs" onClick={() => onDelete(project)}>
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </article>
  );
};
