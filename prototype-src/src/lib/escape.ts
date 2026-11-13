import { useEffect, useRef } from 'react';

// One Esc stack for the whole app: Esc closes the topmost layer only
// (popover → confirm → menu → panel → pop-up, in the order they opened).
const stack: { current: () => void }[] = [];

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || stack.length === 0) return;
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
