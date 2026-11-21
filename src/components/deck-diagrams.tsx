import { useState } from "react";
import { framingZones, readFraming } from "@/lib/framing-board";
import { sketchEnvelope } from "@/lib/sound-envelope";

export function FramingBoard({ ratio, ratios, onRatio, framing, onChange }: {
  ratio: string;
  ratios: readonly { value: string }[];
  onRatio: (ratio: string) => void;
  framing: string;
  onChange: (framing: string) => void;
}) {
  const [brush, setBrush] = useState<"subject" | "title">("subject");
  const [subject, title] = readFraming(framing);
  function place(zone: string) {
    const next = brush === "subject"
      ? [zone, title === zone ? "" : title]
      : [subject === zone ? "" : subject, zone];
    onChange(next.join("|"));
  }
  return <fieldset className="diagram-tool">
    <legend>Framing board</legend>
    <label>Frame proportions <select value={ratio} onChange={e => onRatio(e.target.value)}>
      {ratios.map(({ value }) => <option key={value}>{value}</option>)}
    </select></label>
    <div role="group" aria-label="Place on frame">
      {(["subject", "title"] as const).map(mode => <button key={mode} type="button"
        aria-pressed={brush === mode} onClick={() => setBrush(mode)}>
        {mode === "subject" ? "Subject marker" : "Title-safe area"}
      </button>)}
    </div>
    <div className="framing-grid" style={{ aspectRatio: ratio.replace(":", " / ") }}>
      {framingZones.map(zone => <button key={zone} type="button"
        aria-label={`Place ${brush} at ${zone}`} aria-pressed={(brush === "subject" ? subject : title) === zone}
        data-safe={title === zone} onClick={() => place(zone)}>
        {subject === zone ? "●" : title === zone ? "Title" : ""}
      </button>)}
    </div>
    {(subject || title) && <button type="button" onClick={() => onChange("")}>Clear framing</button>}
  </fieldset>;
}

export function SoundEnvelope({ onset, emphasis }: { onset: readonly string[]; emphasis: number }) {
  const sketch = sketchEnvelope(onset, emphasis);
  const description = sketch.cues.join(", ");
  return <figure className="diagram-tool"><figcaption>Envelope sketch</figcaption>
    {description ? <>
      <svg viewBox="0 0 300 45" role="img" aria-label={description} preserveAspectRatio="none">
        <path d="M0 40 H300" stroke="currentColor" opacity=".3" />
        {sketch.level && Array.from({ length: sketch.cycles }, (_, index) => <path key={index}
          transform={`translate(${index * 300 / sketch.cycles} 0) scale(${3 / sketch.cycles} 1)`}
          d={sketch.path} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />)}
        {sketch.pitchPath && <path d={sketch.pitchPath} fill="none" stroke="currentColor" strokeDasharray="5 3" />}
      </svg>
      <small>{description}{sketch.pitchPath && " · Dashed line shows pitch"}</small>
    </> : <small>Choose an onset card to sketch its envelope.</small>}
  </figure>;
}
