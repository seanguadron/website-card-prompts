"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileToolGate } from "@/components/mobile-tool-gate";
import { useMobilePreviewOverride } from "@/hooks/use-mobile-preview";
import { TOOLS, type ToolId } from "@/lib/tool-registry";

// One 20-viewBox line glyph per tool, same drawing rules as the image editor's
// toolbar icons (bare fragments, currentColor stroke). Kept beside the nav that
// renders them rather than in the registry - they are shell chrome, not tool
// metadata.
const TOOL_TAB_ICONS: Record<ToolId, React.ReactNode> = {
  "prompt-builder": (
    <>
      <rect x="4.5" y="3" width="11" height="14" rx="1.8" />
      <path d="M7.5 6.5h5M7.5 9.5h5M7.5 12.5h3" />
    </>
  ),
  "picture-deck": (
    <>
      <rect x="4.5" y="3" width="11" height="14" rx="1.8" />
      <circle cx="8" cy="7.2" r="1.1" />
      <path d="M4.8 13.6l2.9-2.9 2.1 2.1 1.7-1.7 3.6 3.6" />
    </>
  ),
  "sound-deck": (
    <>
      <rect x="4.5" y="3" width="11" height="14" rx="1.8" />
      <path d="M6.5 10.5h1.1l1-2.8 1.4 5 1.3-3.6.9 1.4h1.3" />
    </>
  ),
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const workspaceMenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      const menu = workspaceMenu.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
    }
    function dismissOnEscape(event: KeyboardEvent) {
      const menu = workspaceMenu.current;
      if (event.key !== "Escape" || !menu?.open) return;
      menu.open = false;
      menu.querySelector("summary")?.focus();
    }
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, []);

  const activeTool = TOOLS.find((tool) => pathname === tool.href);
  const isHome = pathname === "/";
  const fullBleed = Boolean(activeTool?.fullBleed);
  const mobileGated = activeTool?.mobileSupport === "gated";

  // SSR renders every gated route in the gated state (the override lives in
  // sessionStorage, which the server cannot read); a previously-overridden
  // phone flips back before paint via the store's client snapshot. Desktop
  // never shows either state — the .is-mobile-* classes only act under the
  // 768px media query in globals.css.
  const { overridden: mobilePreview, override: previewAnyway } =
    useMobilePreviewOverride(mobileGated && activeTool ? activeTool.id : null);

  function toggleTheme() {
    const currentTheme =
      document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("digitools.theme", nextTheme);
  }

  const shellClassName = mobileGated
    ? mobilePreview
      ? "app-shell is-mobile-preview"
      : "app-shell is-mobile-gated"
    : "app-shell";

  return (
    <div data-app-shell className={shellClassName}>
      <header className="top-bar" data-component="Bar:Top">
        {/* The brand links to the default CRAFT workspace. */}
        <Link
          className={isHome ? "brand is-active" : "brand"}
          href="/"
          aria-label="Card Prompts home"
          aria-current={isHome ? "page" : undefined}
        >
          <svg
            className="brand-mark"
            viewBox="0 0 64 64"
            width="24"
            height="24"
            aria-hidden="true"
          >
            <rect
              x="13"
              y="20"
              width="20"
              height="28"
              rx="5"
              transform="rotate(-16 23 34)"
              className="brand-mark-back"
            />
            <rect
              x="31"
              y="16"
              width="21"
              height="30"
              rx="5"
              className="brand-mark-front"
            />
          </svg>
          <span>Card Prompts</span>
        </Link>

        <nav className="tool-tabs" aria-label="Decks">
          {TOOLS.map((tool) => (
            <Link
              className={
                pathname === tool.href ? "tool-tab is-active" : "tool-tab"
              }
              aria-current={pathname === tool.href ? "page" : undefined}
              href={tool.href}
              key={tool.id}
            >
              <svg
                className="tool-tab-icon"
                viewBox="0 0 20 20"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {TOOL_TAB_ICONS[tool.id]}
              </svg>
              {tool.shortName}
              {tool.stage === "alpha" ? (
                <span className="tool-tab-flag">Alpha</span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="app-subbar-slot" id="app-subbar-slot" />
        <details className="workspace-menu" ref={workspaceMenu}>
          <summary className="button button-quiet">Workspace</summary>
          <div className="workspace-menu-panel">
            <div id="compact-tool-header" />
            <div id="workspace-view-tools" />
            <div id="workspace-camera-tools" />
            <button type="button" className="theme-toggle" onClick={toggleTheme}>
              Switch color theme
            </button>
          </div>
        </details>
      </header>

      <main className={fullBleed ? "page-stage is-fluid" : "page-stage"}>
        {mobileGated && activeTool ? (
          <MobileToolGate
            tool={activeTool}
            overridden={mobilePreview}
            onOverride={previewAnyway}
          />
        ) : null}
        {children}
      </main>
    </div>
  );
}
