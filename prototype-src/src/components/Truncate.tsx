import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';

/**
 * P1/P5 fixes: a user-entered name that doesn't fit is cut with an ellipsis, and the full text shows
 * on hover and keyboard focus (the shared data-tip tooltip). Inside a button the button carries the
 * tip, so there's never a focus stop nested in another control.
 */
export function Truncate({ text, children, className }: { text: string; children?: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setCut(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);
  const host = ref.current?.parentElement?.closest('button, [role="button"], a');
  useLayoutEffect(() => {
    if (!host) return;
    if (cut) host.setAttribute('data-tip', text);
    else if (host.getAttribute('data-tip') === text) host.removeAttribute('data-tip');
  }, [host, cut, text]);
  const own = cut && !host;
  return (
    <span
      ref={ref}
      className={`truncate${className ? ` ${className}` : ''}`}
      data-tip={own ? text : undefined}
      tabIndex={own ? 0 : undefined}
    >
      {children ?? text}
    </span>
  );
}
