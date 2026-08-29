"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ART_AUTHORING,
  addToArtQueue,
  clearArtQueue,
  fetchArtQueue,
  queueCountsFor,
  queueTotalFor,
  type ArtQueueItem,
} from "@/lib/art-queue";

/** What a card face needs to draw and drive the queue. */
export type ArtQueueApi = {
  /** Dev build AND the writer answered. Everything else stays hidden. */
  available: boolean;
  editing: boolean;
  toggleEditing: () => void;
  /** Images queued for this deck, across every world. */
  total: number;
  /** Images queued for one entry in the CURRENT world. */
  countFor: (key: string | undefined) => number;
  /** Ask for one more image of this card. */
  queueOne: (key: string | undefined, name: string) => void;
  clear: () => void;
  /** Last thing that happened, for the status line. Never an fs path. */
  status: string | null;
};

/**
 * Art-queue state for one deck, in whichever world it is currently showing.
 *
 * Availability is PROBED, not assumed: a dev server binds every interface, so
 * the deck can be open on a phone on the LAN while the writer — which requires
 * a loopback Host — refuses it. Asking for the queue answers "can this browser
 * actually author?" with the same authority that will decide the writes, so
 * the mode never appears somewhere it cannot work.
 */
export function useArtQueue(deck: string, theme: string): ArtQueueApi {
  const [available, setAvailable] = useState(false);
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<ArtQueueItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  // Clicks land faster than round trips, so each one bumps the badge before
  // the server answers. This counts the answers still owed per card: only the
  // LAST one may overwrite the optimistic count, or a slow first response
  // would stomp a fourth click back down to 1.
  const pending = useRef(new Map<string, number>());

  useEffect(() => {
    if (!ART_AUTHORING) return;
    let cancelled = false;
    fetchArtQueue(deck)
      .then((queue) => {
        if (cancelled) return;
        setAvailable(true);
        setItems(queue);
      })
      .catch(() => {
        // Not an error worth showing: "no authoring here" is the expected
        // answer for every browser but the one on this machine.
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deck]);

  const counts = useMemo(
    () => queueCountsFor(items, deck, theme),
    [items, deck, theme],
  );

  const countFor = useCallback(
    (key: string | undefined) => (key ? (counts.get(key) ?? 0) : 0),
    [counts],
  );

  const queueOne = useCallback(
    (key: string | undefined, name: string) => {
      if (!key || !available) return;

      setItems((prev) => {
        const index = prev.findIndex(
          (item) => item.deck === deck && item.theme === theme && item.key === key,
        );
        if (index === -1) {
          return [...prev, { deck, theme, key, name, count: 1 }];
        }
        const next = [...prev];
        next[index] = { ...next[index], count: next[index].count + 1 };
        return next;
      });

      pending.current.set(key, (pending.current.get(key) ?? 0) + 1);
      setStatus(`Queued ${name}`);

      addToArtQueue(deck, theme, key, 1)
        .then((serverCount) => {
          const owed = (pending.current.get(key) ?? 1) - 1;
          pending.current.set(key, owed);
          // Only the last answer is authoritative; earlier ones describe a
          // count that has already been added to.
          if (owed > 0) return;
          setItems((prev) =>
            prev.map((item) =>
              item.deck === deck && item.theme === theme && item.key === key
                ? { ...item, count: serverCount }
                : item,
            ),
          );
        })
        .catch((error: unknown) => {
          pending.current.set(key, Math.max(0, (pending.current.get(key) ?? 1) - 1));
          setStatus(error instanceof Error ? error.message : "Could not queue that card");
          // The optimistic count is now a guess about a write that failed.
          // Re-read rather than try to undo it.
          fetchArtQueue(deck).then(setItems).catch(() => setAvailable(false));
        });
    },
    [available, deck, theme],
  );

  const clear = useCallback(() => {
    if (!available) return;
    const previous = items;
    setItems([]);
    setStatus("Cleared the queue");
    clearArtQueue(deck).catch((error: unknown) => {
      setItems(previous);
      setStatus(error instanceof Error ? error.message : "Could not clear the queue");
    });
  }, [available, deck, items]);

  const toggleEditing = useCallback(() => {
    setEditing((value) => !value);
    setStatus(null);
  }, []);

  return {
    available,
    editing: available && editing,
    toggleEditing,
    total: useMemo(() => queueTotalFor(items, deck), [items, deck]),
    countFor,
    queueOne,
    clear,
    status,
  };
}
