// An illustrative contour in relative units. No duration, pitch or gain is measured.
export function sketchEnvelope(onset: readonly string[], emphasis: number) {
  const grade = Math.max(0, Math.min(2, Math.round(emphasis)));
  const has = (id: string) => onset.includes(id);
  const cues: string[] = [];
  const peak = has("slow-swell") ? [24, 35, 46][grade] : has("sharp-attack") ? [8, 4, 1][grade] : 10;
  const release = has("decay-tail") ? [32, 56, 76][grade] : 24;
  const cycle = has("looping");
  const stutter = has("stutter");
  const pitch = has("rising");
  if (has("sharp-attack")) cues.push("Sharp attack");
  if (has("slow-swell")) cues.push("Gradual swell");
  if (stutter) cues.push("Interrupted rhythm");
  if (cycle) cues.push("Repeating cycle");
  if (has("single-hit")) cues.push(cycle ? "One strike per cycle" : "One strike");
  if (has("decay-tail")) cues.push(["Short decay", "Long decay", "Sustained release"][grade]);
  if (pitch) cues.push("Rising pitch");

  const hold = peak + (has("single-hit") ? 2 : 8);
  const end = Math.min(100, hold + release);
  // A sharp transient can lead into a slower body when both onset cards are equipped.
  const transient = has("sharp-attack") && has("slow-swell") ? " L2 5 L5 29" : "";
  const interrupt = stutter ? ` L${peak / 2} 20 L${peak / 2 + 1} 40` : "";
  const path = `M0 40${transient}${interrupt} L${peak} 5 L${hold} 9 Q${hold + (end-hold)*0.45} 34 ${end} 40 H100`;
  return {
    path, cycles: cycle ? 3 : 1, cues,
    level: onset.some(id => id && id !== "rising"),
    pitchPath: pitch ? `M0 35 Q150 30 300 ${[22, 14, 3][grade]}` : "",
  };
}
