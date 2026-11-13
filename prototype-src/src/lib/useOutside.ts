import { RefObject, useEffect, useRef } from 'react';

/** Calls `onOutside` on a pointerdown outside `ref` (and outside any element matching `ignore`). */
export function useOutside(ref: RefObject<HTMLElement>, onOutside: () => void, enabled = true, ignore?: string) {
  const cb = useRef(onOutside);
  cb.current = onOutside;
  useEffect(() => {
    if (!enabled) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element;
      if (ref.current?.contains(target)) return;
      if (ignore && target.closest(ignore)) return;
      cb.current();
    };
    // Defer so the click that opened the layer doesn't close it.
    const id = window.setTimeout(() => document.addEventListener('pointerdown', onDown), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [enabled, ref, ignore]);
}
