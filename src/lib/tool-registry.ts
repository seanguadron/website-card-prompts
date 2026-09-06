export type ToolId = "prompt-builder" | "picture-deck" | "sound-deck";

// The one "this is a phone" threshold. Kept byte-identical to the media query
// that drives the mobile gate in globals.css ("Mobile tool gate" section):
// when the two disagree, a width can be gated while a tool's own layout still
// thinks it is on a desktop.
export const PHONE_MEDIA_QUERY = "(max-width: 767.98px)";

export interface ToolDescriptor {
  id: ToolId;
  name: string;
  shortName: string;
  tagline: string;
  href: string;
  // When true, the tool renders full-bleed (escapes the centered page-stage).
  fullBleed?: boolean;
  // "gated": below 768px the shell swaps the tool for an explainer with a
  // session-scoped "Preview anyway" override (docs/ARCHITECTURE.md §2).
  // Omitted means the tool is fully usable at phone widths.
  mobileSupport?: "full" | "gated";
  // Gate-screen copy: 2-3 concrete lines on what the tool does and where the
  // data lives. Required when mobileSupport is "gated".
  mobileGateNotes?: string[];
  // "alpha": the tool ships but is early — its top-bar tab carries a flag.
  stage?: "alpha";
}

// Object-literal order IS the top-bar tab order. Since the 2026-09-05 split
// (docs/adr/0003-split-into-two-projects.md) this project is the three card
// decks; the Architect Wizard, Image Editor, Vector Editor, and Skills wiki
// live in the sibling Digi Editors project.
export const TOOL_REGISTRY: Record<ToolId, ToolDescriptor> = {
  "prompt-builder": {
    id: "prompt-builder",
    name: "CRAFT Deck",
    shortName: "CRAFT",
    tagline: "Turn a rough request into a clear, reusable language-model prompt.",
    href: "/tools/prompt-builder",
    fullBleed: true,
    mobileSupport: "gated",
    mobileGateNotes: [
      "Builds C.R.A.F.T. prompts from explicit card choices — roles, tactics, modifiers, and tuning tracks.",
      "35 roles, 32 card lineages, and 25 archetype presets to start from.",
      "Drafts autosave in this browser; sessions export and import as local JSON.",
    ],
  },
  "picture-deck": {
    id: "picture-deck",
    name: "PICTURE Deck",
    shortName: "PICTURE",
    tagline:
      "Compose image-generation prompts from P.I.C.T.U.R.E. cards — subject, light, medium, palette, world, references, finish.",
    href: "/tools/picture-deck",
    fullBleed: true,
    mobileSupport: "gated",
    mobileGateNotes: [
      "Builds image-model prompts from P.I.C.T.U.R.E. card choices — lighting, medium, palette, world, references, and framing.",
      "100 card lineages and 18 archetype presets; one Intensity dial tunes every card from subtle to extreme.",
      "Optional Midjourney tail (--ar, --stylize, --no). Drafts autosave in this browser; prompts download as local files.",
    ],
  },
  "sound-deck": {
    id: "sound-deck",
    name: "SONIC Deck",
    shortName: "SONIC",
    tagline:
      "Compose sound-effect prompts from S.O.N.I.C. cards — source, onset, nature, intensity, context.",
    href: "/tools/sound-deck",
    fullBleed: true,
    mobileSupport: "gated",
    mobileGateNotes: [
      "Builds Firefly sound-effect prompts from S.O.N.I.C. card choices — source, attack, texture, dynamics, and world.",
      "38 descriptor lineages and 12 archetype presets; one Emphasis dial tunes every card from a hint to dominant.",
      "One sound per prompt with a layer rack for soundscapes. Drafts autosave in this browser; prompts download as local files.",
    ],
  },
};

export const TOOLS = Object.values(TOOL_REGISTRY);
