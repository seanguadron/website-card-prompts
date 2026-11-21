"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePortalTarget } from "@/hooks/use-portal-target";

export function FlowNavDock({ children, onBack, onNext, nextLabel }: {
  children?: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
}) {
  const target = usePortalTarget("workspace-view-tools");
  return target && createPortal(<>
    {children}
    <div className="workspace-step-actions">
      <button type="button" disabled={!onBack} onClick={onBack}>Back</button>
      <button type="button" onClick={onNext}>{nextLabel}</button>
    </div>
  </>, target);
}
