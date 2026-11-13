export type PillTone = 'neutral' | 'lavender' | 'issue';

/** Bottom-right status pill. Not interactive until there's something for it to point at (phase 1+). */
export function StatusPill({ text, tone = 'neutral' }: { text: string; tone?: PillTone }) {
  return (
    <div className={`pmr-glass status-pill status-pill--${tone}`} role="status">
      <span className="status-pill__dot" aria-hidden="true" />
      <span className="status-pill__text">{text}</span>
    </div>
  );
}
