"use client";

// Small, SSR-safe wrappers around localStorage used by the save/reuse features
// (named library, custom presets, favorites). All failures are non-fatal so the
// builder keeps working when storage is unavailable.

export function readStored(key: string, fallback: unknown): unknown {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// For list-shaped keys (favorites, id lists): localStorage is user-editable,
// so the parsed value must be filtered to a real string array — a tampered
// value like `null` or `{}` degrades to the sound subset instead of putting
// non-array state into a component.
export function readStoredStringArray(key: string): string[] {
  const entries = readStored(key, []);
  return Array.isArray(entries)
    ? entries.filter((entry): entry is string => typeof entry === "string")
    : [];
}

export function writeStored(key: string, value: unknown): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
