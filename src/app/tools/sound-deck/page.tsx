import type { Metadata } from "next";
import { SoundDeck } from "@/components/sound-deck";

export const metadata: Metadata = {
  title: "SONIC Deck",
  description:
    "Build a structured sound-effect prompt for Adobe Firefly's sound generator.",
};

export default function SoundDeckPage() {
  return <SoundDeck />;
}
