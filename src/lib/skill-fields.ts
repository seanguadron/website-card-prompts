export type SkillField = { name: string; phrase: string };
type Direction = { label: string; body: string };

export function fieldConflict(fields: readonly SkillField[], candidate: SkillField) {
  return fields.some(field =>
    field.name.toLowerCase() === candidate.name.toLowerCase() ||
    field.phrase.includes(candidate.phrase) || candidate.phrase.includes(field.phrase)
  );
}

export function restoreSkillFields(value: unknown): SkillField[] {
  if (!Array.isArray(value)) return [];
  const fields: SkillField[] = [];
  for (const entry of value) {
    if (!entry || typeof entry.name !== "string" || typeof entry.phrase !== "string") continue;
    const name = entry.name.trim();
    const phrase = entry.phrase.trim();
    if (name && !/[\r\n\[\]]/.test(name) && phrase && !fieldConflict(fields, { name, phrase })) {
      fields.push({ name, phrase });
    }
  }
  return fields;
}

// Replace literal source spans once. Field names can themselves contain source words.
function template(text: string, fields: readonly SkillField[]) {
  let remaining = text;
  let out = "";
  while (remaining) {
    let next: SkillField | undefined;
    let start = remaining.length;
    for (const field of fields) {
      const index = remaining.indexOf(field.phrase);
      if (index >= 0 && index < start) {
        next = field;
        start = index;
      }
    }
    if (!next) break;
    out += remaining.slice(0, start) + "[" + next.name + "]";
    remaining = remaining.slice(start + next.phrase.length);
  }
  return out + remaining;
}

export function buildFieldDirections(prompt: string, choices: Direction[], saved: readonly SkillField[]) {
  const fields = saved.filter(field => prompt.includes(field.phrase));
  if (!fields.length) return choices;
  const directions = choices.map(choice => ({ ...choice, body: template(choice.body, fields) }));
  const excerpts = new Set<string>();
  for (const field of fields) {
    let offset = 0;
    while (offset < prompt.length) {
      const index = prompt.indexOf(field.phrase, offset);
      if (index < 0) break;
      offset = index + field.phrase.length;
      const start = prompt.lastIndexOf("\n", index - 1) + 1;
      const end = prompt.indexOf("\n", offset);
      excerpts.add(template(prompt.slice(start, end < 0 ? undefined : end), fields));
    }
  }
  return [...directions, {
    label: "Reusable inputs",
    body: [
      ...fields.map(field => "Ask for " + field.name + " when the current brief omits it."),
      ...excerpts,
    ].join("\n"),
  }];
}
