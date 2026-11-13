export type PillTone = 'neutral' | 'lavender' | 'issue';

/** Bottom-right status pill. Clicking goes to the thing it describes, when there is one. */
export function StatusPill({ text, tone = 'neutral', onClick }: { text: string; tone?: PillTone; onClick?: () => void }) {
  const inner = (
    <>
      <span className="status-pill__dot" aria-hidden="true" />
      <span className="status-pill__text">{text}</span>
    </>
  );
  return (
    <div className="status-pill-wrap" role="status">
      {onClick ? (
        <button type="button" className={`pmr-glass status-pill status-pill--${tone} is-button`} onClick={onClick}>{inner}</button>
      ) : (
        <div className={`pmr-glass status-pill status-pill--${tone}`}>{inner}</div>
      )}
    </div>
  );
}
