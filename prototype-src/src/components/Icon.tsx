/** Codicon glyph. Decorative by default; pass `label` when the icon carries meaning on its own. */
export function Icon({ name, size = 16, label, className = '' }: { name: string; size?: number; label?: string; className?: string }) {
  return (
    <i
      className={`codicon codicon-${name} ${className}`}
      style={{ fontSize: size }}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    />
  );
}
