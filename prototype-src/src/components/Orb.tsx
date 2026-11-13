import { initials } from '../lib/status';
import type { Role } from '../lib/types';
import { Icon } from './Icon';

const OTHER_ICON: Record<string, string> = {
  Accessibility: 'person',
  Security: 'shield',
  Docs: 'book',
  Performance: 'dashboard',
};

const ROLE_ICON: Partial<Record<Role, string>> = { builder: 'sparkle', reviewer: 'eye', tester: 'beaker' };

interface OrbProps {
  role: Role | 'bob';
  size: number;
  name?: string;
  otherType?: string;
  /** Dashed outline only: suggested agents and the "add" rows in the menu. */
  outline?: boolean;
  /** Teammates: 1–4, so two people never share a ring colour. */
  tone?: number;
}

/** Iridescent orb: CSS gradient body, blurred swirls, glow and a glyph (tokens.orb). Always decorative. */
export function Orb({ role, size, name = '', otherType, outline, tone }: OrbProps) {
  const icon = role === 'other' ? OTHER_ICON[otherType ?? ''] ?? 'gear' : ROLE_ICON[role as Role];
  const glyph = Math.round(size * 0.42);
  return (
    <span className={`orb orb--${role}${outline ? ' orb--outline' : ''}${tone && tone > 1 ? ` orb--tone-${tone}` : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      {!outline && role !== 'teammate' && (
        <>
          <span className="orb__swirl orb__swirl--a" />
          <span className="orb__swirl orb__swirl--b" />
          {role === 'you' && <span className="orb__swirl orb__swirl--c" />}
          <span className="orb__highlight" />
        </>
      )}
      {role === 'teammate' && !outline && (
        initials(name)
          ? <span className="orb__initials" style={{ fontSize: Math.max(9, Math.round(size * 0.3)) }}>{initials(name)}</span>
          : <Icon name="person" size={Math.round(size * 0.42)} className="orb__glyph" />
      )}
      {icon && size >= 20 && <Icon name={icon} size={glyph} className="orb__glyph" />}
    </span>
  );
}
