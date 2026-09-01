/**
 * The deck's half of the Card Studio generation queue.
 *
 * The studio at /studio/cards can already queue "more images" for a card, but
 * finding the card there means knowing which one you want before you look. The
 * deck is where you actually SEE the art in context — scrolling the role grid
 * in the fantasy world, noticing three portraits that missed. This module lets
 * the deck put those cards in the same queue, so the browsing and the judging
 * happen in one place and the generating happens later.
 *
 * Nothing here generates anything. A queued card is a note in
 * `.ai/notes/art-queue.json` that `npm run art:queue` reads back as prompts.
 *
 * Development only, twice over: this flag compiles the mode out of a
 * production bundle, and the endpoint it talks to 404s there and off-loopback
 * regardless. The flag is the affordance; the endpoint is the boundary.
 */

/** Next inlines NODE_ENV into the client bundle, so this is a build-time
 *  constant and the branches behind it are dead code in production. */
export const ART_AUTHORING = process.env.NODE_ENV !== "production";

/** What the deck needs from a queued card. The stored item carries more
 *  (sequence, fileName, queuedAt); the deck reads only these. */
export type ArtQueueItem = {
  deck: string;
  theme: string;
  key: string;
  name: string;
  count: number;
};

function isQueueItem(value: unknown): value is ArtQueueItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.deck === "string" &&
    typeof item.theme === "string" &&
    typeof item.key === "string" &&
    typeof item.name === "string" &&
    typeof item.count === "number"
  );
}

/**
 * The queued count per entry key, for one deck in one world.
 *
 * Pure, and separate from the fetching, because the filtering is the part
 * worth being sure about: the queue file holds every deck and every world at
 * once, and a sci-fi count shown on a fantasy card would be a quiet lie about
 * what is about to be generated.
 */
export function queueCountsFor(
  items: readonly ArtQueueItem[],
  deck: string,
  theme: string,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.deck !== deck || item.theme !== theme) continue;
    counts.set(item.key, (counts.get(item.key) ?? 0) + item.count);
  }
  return counts;
}

/** Every image queued for one deck, across all of its worlds. */
export function queueTotalFor(
  items: readonly ArtQueueItem[],
  deck: string,
): number {
  return items
    .filter((item) => item.deck === deck)
    .reduce((total, item) => total + item.count, 0);
}

const ENDPOINT = "/api/card-art";

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string") return body.error;
  } catch {
    // A 404 from the production build is HTML, not JSON. Fall through.
  }
  return `Request failed (${response.status})`;
}

/**
 * Read the queue. Doubles as the availability probe: the endpoint 404s in a
 * production build and off-loopback, so a caller that gets a list back has
 * proven the writer is reachable rather than assumed it.
 */
export async function fetchArtQueue(deck: string): Promise<ArtQueueItem[]> {
  const response = await fetch(
    `${ENDPOINT}?view=queue&deck=${encodeURIComponent(deck)}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const body = (await response.json()) as { queue?: unknown };
  return Array.isArray(body.queue) ? body.queue.filter(isQueueItem) : [];
}

/**
 * Ask for `count` more candidates for one card, and get that card's new total
 * back. Asking twice adds up — the store's rule, not this module's.
 */
export async function addToArtQueue(
  deck: string,
  theme: string,
  key: string,
  count: number,
): Promise<number> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    // The write-intent header is outside the CORS safelist, so a cross-origin
    // forgery is forced into a preflight the endpoint never approves.
    headers: { "content-type": "application/json", "x-card-art-intent": "write" },
    body: JSON.stringify({ op: "queue-add", deck, theme, key, count }),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const body = (await response.json()) as { count?: unknown };
  return typeof body.count === "number" ? body.count : count;
}

/** Drop one card's request entirely (not a decrement — the whole entry). */
export async function removeFromArtQueue(
  deck: string,
  theme: string,
  key: string,
): Promise<void> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    // The write-intent header is outside the CORS safelist, so a cross-origin
    // forgery is forced into a preflight the endpoint never approves.
    headers: { "content-type": "application/json", "x-card-art-intent": "write" },
    body: JSON.stringify({ op: "queue-remove", deck, theme, key }),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}

/** Throw away this deck's whole queue. The other deck's is not ours. */
export async function clearArtQueue(deck: string): Promise<void> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    // The write-intent header is outside the CORS safelist, so a cross-origin
    // forgery is forced into a preflight the endpoint never approves.
    headers: { "content-type": "application/json", "x-card-art-intent": "write" },
    body: JSON.stringify({ op: "queue-clear", deck }),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}
