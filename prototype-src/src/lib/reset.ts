const PREFIX = 'pmr:';

export function clearStoredState() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // Storage can be blocked (private mode); the app still runs from memory.
  }
}

/** `?reset` clears saved state, then drops the param so a refresh doesn't reset again. */
export function handleResetParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('reset')) return;
  clearStoredState();
  url.searchParams.delete('reset');
  window.history.replaceState(null, '', url);
}

export function startOver() {
  clearStoredState();
  window.location.reload();
}
