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

/**
 * `?reset` clears saved state, then drops the param so a refresh doesn't reset again.
 * Runs when this module is first imported, so main.tsx imports it before the store hydrates.
 */
function handleResetParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('reset')) return;
  clearStoredState();
  url.searchParams.delete('reset');
  window.history.replaceState(null, '', url);
}

export function startOver(keepLog = false) {
  // Session logs (pmr:session:*) and saved constellations survive a Start over; clearing drops them too.
  if (keepLog) {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX) && !k.startsWith('pmr:session:') && k !== 'pmr:saved-teams')
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // Storage blocked: the reload still resets the in-memory state.
    }
    window.location.reload();
    return;
  }
  clearStoredState();
  window.location.reload();
}

handleResetParam();
