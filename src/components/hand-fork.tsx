"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

type Lane = "A" | "B";
type SavedHand = { session: string; title: string | null; archetype: string | null };
type Comparison = { editing: Lane; alternate: SavedHand; alternatePrompt: string };

function isHand(value: unknown): value is SavedHand {
  if (!value || typeof value !== "object") return false;
  const hand = value as Partial<SavedHand>;
  return typeof hand.session === "string" &&
    (hand.title === null || typeof hand.title === "string") &&
    (hand.archetype === null || typeof hand.archetype === "string");
}

function readComparison(key: string): (Comparison & { active: SavedHand }) | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? "null");
    if ((value?.editing === "A" || value?.editing === "B") &&
        typeof value.alternatePrompt === "string" && isHand(value.alternate) && isHand(value.active)) {
      return value;
    }
  } catch {
    // The user can start a fresh comparison if storage is unavailable.
  }
  return null;
}

export function HandFork({ deck, prompt, ready, capture, restore }: {
  deck: string;
  prompt: string;
  ready: boolean;
  capture: () => SavedHand;
  restore: (snapshot: SavedHand, recordHistory: boolean) => void;
}) {
  const key = "cardprompts.comparison." + deck;
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [error, setError] = useState("");
  const skipSaved = useRef(false);
  // Explicitly opened shared briefs take precedence over the last tab session.
  useEffect(() => {
    skipSaved.current = new URLSearchParams(window.location.search).has("p");
    if (skipSaved.current) {
      try { sessionStorage.removeItem(key); } catch { /* In-memory mode. */ }
    }
  }, [key]);

  const recover = useEffectEvent((stored: Comparison & { active: SavedHand }) => {
    try {
      restore(stored.active, false);
      setComparison({ editing: stored.editing, alternate: stored.alternate, alternatePrompt: stored.alternatePrompt });
    } catch {
      setError("The previous comparison could not be restored.");
    }
  });
  useEffect(() => {
    if (!ready || skipSaved.current) return;
    const stored = readComparison(key);
    if (!stored) return;
    const timer = window.setTimeout(() => recover(stored), 0);
    return () => window.clearTimeout(timer);
  }, [ready, key]);

  // The ordinary draft is shared between tabs. Save BOTH branches per tab
  // so a different tab's autosave cannot replace this comparison on reload.
  useEffect(() => {
    if (!comparison) return;
    try {
      sessionStorage.setItem(key, JSON.stringify({ ...comparison, active: capture() }));
    } catch { /* The comparison continues in memory. */ }
  }, [capture, comparison, key]);

  function save(next: Comparison | null) {
    setComparison(next);
    setError("");
    if (!next) {
      try { sessionStorage.removeItem(key); } catch { /* In-memory mode. */ }
    }
  }

  if (!comparison) {
    return (
      <button type="button" className="button button-secondary" disabled={!ready}
        onClick={() => save({ editing: "B", alternate: capture(), alternatePrompt: prompt })}>
        Fork hand A / B
      </button>
    );
  }
  const editing = comparison.editing;
  const alternate = editing === "A" ? "B" : "A";

  function activateOther(finish: boolean) {
    if (!comparison) return;
    const current = capture();
    try {
      restore(comparison.alternate, true);
    } catch {
      setError("This saved hand could not be opened. You can still keep the current hand.");
      return;
    }
    save(finish ? null : { editing: alternate, alternate: current, alternatePrompt: prompt });
  }

  return <section className="fork-comparison" aria-label="Compare hands">
    <strong>Compare hands</strong>
    <div className="fork-columns">{(["A","B"] as const).map(lane =>
      <section key={lane} aria-label={`Hand ${lane}`}>
        <header><b>Hand {lane}</b> {lane === editing ? <small>Editing</small> :
          <button type="button" onClick={() => activateOther(false)}>Edit {lane}</button>}</header>
        <pre>{lane === editing ? prompt : comparison.alternatePrompt}</pre>
        <button type="button" onClick={() => lane === editing ? save(null) : activateOther(true)}>Keep {lane}</button>
      </section>
    )}</div>
    {error && <p role="alert">{error}</p>}
  </section>;
}
