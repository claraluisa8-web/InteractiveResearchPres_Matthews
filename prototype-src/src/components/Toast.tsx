/** Calm, short-lived confirmation above the composer. Announced politely to screen readers. */
export function Toast({ message }: { message: string | null }) {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {message && <div className="pmr-glass toast">{message}</div>}
    </div>
  );
}
