const rows = ["upper", "middle", "lower"];
const columns = ["left", "center", "right"];
export const framingZones = rows.flatMap(row => columns.map(column => row + " " + column));

export function readFraming(value: unknown): [string, string] {
  if (typeof value !== "string") return ["", ""];
  const parts = value.split("|");
  if (parts.length !== 2 || parts.some(zone => zone && !framingZones.includes(zone))) return ["", ""];
  return [parts[0], parts[0] === parts[1] ? "" : parts[1]];
}

export function framingDirections(value: unknown, aspectRatio?: string) {
  const [subject, title] = readFraming(value);
  const lines: string[] = [];
  if ((subject || title) && aspectRatio && /^[1-9]\d*:[1-9]\d*$/.test(aspectRatio)) {
    lines.push(aspectRatio + " composition");
  }
  if (subject) lines.push("subject positioned in the " + subject + " of the frame");
  if (title) lines.push("keep the " + title + " of the frame clear for lettering");
  return lines;
}
