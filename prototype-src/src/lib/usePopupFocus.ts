import { RefObject, useEffect } from 'react';

const TYPING = 'input, textarea, select, [contenteditable="true"], .cm-content';
const CONTROLS = 'button:not([disabled]), [href], input, textarea, select';

/**
 * Pop-up cards with a purple primary button (Start from the spec, Add tester, Open pull request…):
 * the primary takes focus when the card appears, so Enter selects it, unless the user is typing
 * somewhere. With `trap`, Tab and Shift+Tab cycle through the card's own controls.
 */
export function usePopupFocus(ref: RefObject<HTMLElement>, primary: string, { trap = false, when = true } = {}) {
  useEffect(() => {
    if (!when) return;
    const active = document.activeElement as HTMLElement | null;
    const typing = !!active?.closest(TYPING) && !ref.current?.contains(active);
    if (!typing) ref.current?.querySelector<HTMLElement>(primary)?.focus();
  }, [primary, when, ref]);

  useEffect(() => {
    if (!trap) return;
    const el = ref.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = [...el.querySelectorAll<HTMLElement>(CONTROLS)].filter((x) => x.offsetParent !== null);
      if (items.length === 0) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i + 1) % items.length;
      items[next].focus();
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [trap, ref]);
}
