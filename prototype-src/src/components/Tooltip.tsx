import { useEffect, useRef, useState } from 'react';

const DELAY = 400;

/**
 * Tooltips for Codicon-only buttons (screens.md): glass, 12/400, after 400 ms, on hover or keyboard focus.
 * Reads `data-tip`; the button's aria-label carries the same words for screen readers.
 */
export function Tooltip({ scale }: { scale: number }) {
  const [tip, setTip] = useState<{ text: string; x: number; y: number; below: boolean } | null>(null);
  const timer = useRef<number>();

  useEffect(() => {
    const stage = () => document.querySelector('.stage')!.getBoundingClientRect();
    const show = (el: HTMLElement) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        if (!el.isConnected) return;
        const r = el.getBoundingClientRect();
        const s = stage();
        const x = (r.left + r.width / 2 - s.left) / scale;
        const top = (r.top - s.top) / scale;
        const bottom = (r.bottom - s.top) / scale;
        // Prefer below; flip above near the bottom of the stage.
        const below = bottom < 820;
        setTip({ text: el.dataset.tip ?? '', x, y: below ? bottom + 8 : top - 8, below });
      }, DELAY);
    };
    const hide = () => {
      window.clearTimeout(timer.current);
      setTip(null);
    };
    const over = (e: Event) => {
      const el = (e.target as Element).closest?.<HTMLElement>('[data-tip]');
      if (el) show(el);
    };
    const out = (e: Event) => {
      const el = (e.target as Element).closest?.('[data-tip]');
      if (el) hide();
    };
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerout', out);
    document.addEventListener('focusin', over);
    document.addEventListener('focusout', out);
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('keydown', hide, true);
    return () => {
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerout', out);
      document.removeEventListener('focusin', over);
      document.removeEventListener('focusout', out);
      document.removeEventListener('pointerdown', hide, true);
      document.removeEventListener('keydown', hide, true);
      window.clearTimeout(timer.current);
    };
  }, [scale]);

  if (!tip) return null;
  return (
    <div
      className={`pmr-glass tooltip${tip.below ? '' : ' is-above'}`}
      style={{ left: Math.max(tip.x, 80), top: tip.y }}
      role="presentation"
      aria-hidden="true"
    >
      {tip.text}
    </div>
  );
}
