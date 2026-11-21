export type TraceCard = { id: string; section: string; name: string; text: string };
type Section = { key: string; heading: string; body: string };
type Span = { card: TraceCard; at: number; text: string };

/** Trace the composer's own section bodies so a repeated phrase in user input
 * or a Midjourney parameter cannot acquire a card link. */
export function promptTraces(prompt: string, cards: TraceCard[], sections: Section[] | null, mergeOrder?: readonly string[]) {
  const spans: Span[] = [];
  if (!sections) return spans;
  if (mergeOrder) {
    const subject = sections.find(s => s.key === "subject")?.body;
    if (!subject || !prompt.startsWith(subject)) return spans;
    let offset = subject.length;
    for (const key of mergeOrder) {
      const section = sections.find(s => s.key === key);
      if (!section) continue;
      offset += 2; // separator after the preceding section or subject
      if (!prompt.startsWith(section.body, offset)) return [];
      let cursor = 0;
      for (const card of cards.filter(c => c.section === key)) {
        const text = card.text.replace(/\s+/g, " ").trim().replace(/,+$/, "").trim();
        if (!text || !section.body.startsWith(text, cursor)) continue;
        const end = cursor + text.length;
        if (end < section.body.length && !section.body.startsWith(", ", end)) continue;
        spans.push({ card, at: offset + cursor, text });
        cursor = end + 2;
      }
      offset += section.body.length;
    }
  } else {
    let offset = 0;
    for (const section of sections) {
      offset += section.heading.length + 1;
      if (!prompt.startsWith(section.body, offset)) return [];
      const terms = cards.filter(c => c.section === section.key && c.text);
      // The Context and Target composers append cards after the typed brief.
      const reverse = section.key === "context" || section.key === "target";
      let cursor = reverse ? section.body.length : section.key === "format" ? section.body.indexOf("\n") + 1 : 0;
      for (const card of reverse ? terms.reverse() : terms) {
        const at = reverse
          ? section.body.lastIndexOf(card.text, cursor - card.text.length)
          : section.body.indexOf(card.text, cursor);
        if (at < 0) continue;
        spans.push({card, at: offset + at, text: card.text});
        cursor = reverse ? at : at + card.text.length;
      }
      offset += section.body.length + 2;
    }
  }
  return spans.sort((a,b) => a.at - b.at);
}
