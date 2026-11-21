export function RailToggle({ side, title, expanded, controls, count, onToggle }: {
  side: "left" | "right";
  title: string;
  expanded: boolean;
  controls: string;
  count?: string | number;
  onToggle: () => void;
}) {
  const chevron = expanded ? "m2 4 4 4 4-4" : side === "left" ? "m4 2 4 4-4 4" : "m8 2-4 4 4 4";
  return <button type="button" className="output-dock-toggle" onClick={onToggle}
    aria-expanded={expanded} aria-controls={controls}
    aria-label={`${expanded ? "Collapse" : "Expand"} ${title}`}>
    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={chevron} />
    </svg>
    <strong>{title}</strong>
    {count !== undefined && <small>{count}</small>}
  </button>;
}
