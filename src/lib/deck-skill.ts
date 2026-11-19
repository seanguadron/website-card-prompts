export type SkillDeck = "craft" | "picture" | "sonic";

const workflows = {
  craft: {
    trigger: "apply this writing and reasoning workflow to a new task",
    steps: [
      "Identify the requested deliverable, source material, and intended reader. Ask for missing information needed to proceed.",
      "Use the roles and tactics below to work through the new task. Apply the format and audience choices unless the user specifies others.",
      "Return the requested deliverable. Check that it answers the current brief and meets its constraints.",
    ],
  },
  picture: {
    trigger: "create an image prompt using this visual direction",
    steps: [
      "Take the new subject, action, and scene from the current brief. Ask for the subject if it is missing.",
      "Describe the subject first, then apply the lighting, medium, and composition choices below. Resolve conflicts in favor of the current brief.",
      "Return one image prompt. Append the saved parameters only when the chosen image model supports them.",
    ],
  },
  sonic: {
    trigger: "write sound-effect prompts using this acoustic direction",
    steps: [
      "Identify the new sound source and what it does. Ask for the event or environment if it is missing.",
      "Apply the sound descriptors below to that source. Keep the audible details that fit the current brief. For ambience, establish the setting early.",
      "Return a concise comma-separated prompt for each requested sound. Put separate layers on separate lines.",
    ],
  },
} as const;

export function skillFolder(deck: SkillDeck, hand: string) {
  const slug = hand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${deck}-${slug || "hand"}`.slice(0, 64).replace(/-+$/, "");
}

export function buildDeckSkill(
  deck: SkillDeck,
  hand: string,
  choices: readonly { label: string; body: string }[],
) {
  const name = skillFolder(deck, hand);
  const { trigger, steps } = workflows[deck];
  const directions = choices.filter((choice) => choice.body.trim())
    .map(({ label, body }) => `### ${label}\n\n${body.trim().split(/\r\n|[\r\n]/).map((line) => `    ${line}`).join("\n")}`);
  return [
    "---",
    `name: ${name}`,
    `description: Use the ${name} hand when asked to ${trigger}.`,
    "---", "",
    "## Workflow", "",
    ...steps.map((step, i) => `${i + 1}. ${step}`),
    ...(directions.length ? ["", "## Hand", "", directions.join("\n\n")] : []),
    "",
  ].join("\n");
}
