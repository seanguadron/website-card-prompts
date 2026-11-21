export function RailToggle({ side, title, expanded, controls, count, onToggle }: {
  side: "left" | "right";
  title: string;
  expanded: boolean;
  controls: string;
  count?: string | number;
  onToggle: () => void;
}) {
  const pointsRight = side === "right" ? expanded : !expanded;
  return <button type="button" className="output-dock-toggle" onClick={onToggle}
    aria-expanded={expanded} aria-controls={controls}
    aria-label={`${expanded ? "Collapse" : "Expand"} ${title}`}>
    <span aria-hidden="true">{pointsRight ? "›" : "‹"}</span>
    <strong>{title}</strong>
    {count !== undefined && <small>{count}</small>}
  </button>;
}
