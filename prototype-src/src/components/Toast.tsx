export interface ToastAction { label: string; run: () => void }
export interface ToastState { text: string; action?: ToastAction }

/** Calm, short-lived confirmation above the composer. Announced politely to screen readers. */
export function Toast({ toast, onAction }: { toast: ToastState | null; onAction: () => void }) {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div className={`pmr-glass toast${toast.action ? ' toast--action' : ''}`}>
          <span>{toast.text}</span>
          {/* P1/P5: a toast can carry the one next step (e.g. "See sections"). */}
          {toast.action && (
            <button type="button" className="toast__action" data-toast-action onClick={() => { toast.action!.run(); onAction(); }}>
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
