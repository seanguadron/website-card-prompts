"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePortalTarget } from "@/hooks/use-portal-target";
import {
  formatSaveStatusLabel,
  isSaveStateUnavailable,
  type SaveStatus,
} from "@/lib/save-status";

// Compact windows move the same controls into Workspace. Both portal targets
// live in the top header, keeping tool state intact when the menu closes.
export function ToolSubbar({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const compact = useMediaQuery("(max-width: 1250px)");
  const target = usePortalTarget(compact ? "compact-tool-header" : "app-subbar-slot");

  if (!target) {
    return null;
  }

  return createPortal(
    <div
      className={className ? `prompt-subbar ${className}` : "prompt-subbar"}
      data-component="Header:Tool"
    >
      {children}
    </div>,
    target,
  );
}

export function ToolSubbarTitle({
  kicker,
  heading,
  headingHidden,
  children,
}: {
  kicker: string;
  heading: ReactNode;
  // Keeps the page's h1 for the accessibility tree while the bar shows only
  // the kicker — the compact-subbar layouts have no room for a display title.
  headingHidden?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="prompt-flow-title">
      <span className="tool-kicker">{kicker}</span>
      <h1 className={headingHidden ? "sr-only" : undefined}>{heading}</h1>
      {children}
    </div>
  );
}

export function ToolSaveStateChip({
  status,
  lastSavedAt,
  restoringLabel,
}: {
  status: SaveStatus;
  lastSavedAt: Date | null;
  restoringLabel?: string;
}) {
  return (
    <span
      className={
        isSaveStateUnavailable(status)
          ? "builder-save-state is-unavailable"
          : "builder-save-state"
      }
      role="status"
    >
      {formatSaveStatusLabel(
        status,
        lastSavedAt,
        restoringLabel ? { restoring: restoringLabel } : undefined,
      )}
    </span>
  );
}

export function ToolSubbarActions({ children }: { children: ReactNode }) {
  return <div className="prompt-flow-header-actions">{children}</div>;
}
