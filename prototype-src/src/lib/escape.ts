import { useEffect, useRef } from 'react';

// One Esc stack for the whole app: Esc closes the topmost layer only
// (popover to confirm to menu to panel to pop-up, in the order they opened).
const stack: { current: () => void }[] = [];

// Embedded in the tree map's overlay (?embed=1): with nothing left to close, Esc asks the
// tree map to close the overlay, since key events inside an iframe never reach the parent.
const EMBEDDED = new URLSearchParams(window.location.search).get('embed') === '1' && window.parent !== window;

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (stack.length === 0) {
    if (EMBEDDED) window.parent.postMessage({ type: 'pmr:close' }, '*');
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  stack[stack.length - 1].current();
});

export function useEscape(onEscape: () => void, enabled = true) {
  const ref = useRef(onEscape);
  ref.current = onEscape;
  useEffect(() => {
    if (!enabled) return;
    const entry = { current: () => ref.current() };
    stack.push(entry);
    return () => {
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [enabled]);
}
