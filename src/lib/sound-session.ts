import {
  restoreSoundCardSystem,
  restoreSoundDraft,
} from "@/lib/sound-deck-state";
import type { SoundCardSystemState, SoundDraft } from "@/lib/sound-types";
import { isSessionRecord } from "@/lib/share-param";
import { base64UrlToBytes, bytesToBase64Url } from "@/lib/share-param";

type SoundSession = {
  version: 1;
  // Discriminator so a CRAFT or PICTURE payload pasted onto this route (or
  // one of their session files imported here) fails loudly instead of
  // silently coercing to an empty deck.
  tool: "sound-deck";
  exportedAt: string;
  draft: SoundDraft;
  cardSystem: SoundCardSystemState;
};

export function serializeSoundSession(
  draft: SoundDraft,
  cardSystem: SoundCardSystemState,
) {
  const session: SoundSession = {
    version: 1,
    tool: "sound-deck",
    exportedAt: new Date().toISOString(),
    draft,
    cardSystem,
  };

  return `${JSON.stringify(session, null, 2)}\n`;
}

export function restoreSoundSession(value: string) {
  const parsed = JSON.parse(value) as Partial<SoundSession> | null;
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    parsed.tool !== "sound-deck" ||
    parsed.version !== 1 ||
    !isSessionRecord(parsed.draft) ||
    !isSessionRecord(parsed.cardSystem)
  ) {
    throw new Error("Not a SONIC Deck session.");
  }

  const draft = restoreSoundDraft(JSON.stringify(parsed.draft));
  const cardSystem = restoreSoundCardSystem(JSON.stringify(parsed.cardSystem));

  return { draft, cardSystem };
}

export function encodeSoundSessionParam(
  draft: SoundDraft,
  cardSystem: SoundCardSystemState,
): string {
  const json = serializeSoundSession(draft, cardSystem);
  return bytesToBase64Url(new TextEncoder().encode(json));
}

export function decodeSoundSessionParam(value: string) {
  const json = new TextDecoder().decode(base64UrlToBytes(value));
  return restoreSoundSession(json);
}
