import { copy, t } from './copy';
import { active, firstOf } from './store';
import type { Collaborator } from './types';

/** The orb's second label line: its configuration, or a believable quiet status. */
export function subtitleFor(c: Collaborator, all: Collaborator[]): string {
  if (c.status === 'draft') return copy.configurePanel.ghostLabel;
  if (c.role === 'teammate') return copy.roles.teammate.subtitle;
  if (c.role === 'other') {
    const statuses = copy.constellation.otherStatuses as Record<string, { text: string }>;
    return t(statuses[c.otherType ?? 'Custom…'] ?? statuses['Custom…']);
  }
  if (c.role === 'reviewer' && !firstOf(all, 'builder')) return t(copy.constellation.waitingForBuilder);
  if (c.role === 'builder' || c.role === 'reviewer') {
    const first = firstOf(all, c.role);
    if (first && first.id !== c.id) return t(copy.constellation.helping, { name: first.name });
  }
  return `${copy.project.model.name}  ·  ${c.configuration.split('·')[0].trim()}`;
}

export function statusPillText(all: Collaborator[]): string {
  const list = active(all);
  if (list.length === 0) return copy.emptyState.statusPill;
  const agents = list.filter((c) => c.role !== 'teammate').length;
  if (agents === 0) return t(copy.constellation.statusTeammatesOnly, { n: list.length });
  if (agents === 1) return t(copy.constellation.statusOrbitOne);
  return t(copy.constellation.statusOrbit, { n: agents });
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2)).toUpperCase();
}
