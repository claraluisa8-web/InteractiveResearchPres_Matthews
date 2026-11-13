import { copy, t } from './copy';
import { active, firstOf } from './store';
import type { Collaborator, Milestones, Recommendation } from './types';
import type { PillTone } from '../components/StatusPill';

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

export interface Pill { text: string; tone: PillTone; target?: 'add' | 'ready' | 'build' | 'suggestion' }

/** Status pill by milestone: suggestion > building > ready > team size > empty. */
export function statusPill(all: Collaborator[], m: Milestones, rec: Recommendation): Pill {
  const builder = firstOf(all, 'builder');
  if (rec === 'shown' || rec === 'dismissed') return { text: copy.recommendation.statusPill, tone: 'lavender', target: 'suggestion' };
  if (m.buildStarted && builder) return { text: copy.build.statusPill, tone: 'neutral', target: 'build' };
  if (builder) return { text: t(copy.build.statusPillReady, { builder: builder.name }), tone: 'neutral', target: 'ready' };
  if (active(all).length === 0) return { text: copy.emptyState.statusPill, tone: 'neutral', target: 'add' };
  return { text: orbitText(all), tone: 'neutral' };
}

function orbitText(all: Collaborator[]): string {
  const list = active(all);
  const agents = list.filter((c) => c.role !== 'teammate').length;
  if (agents === 0) return t(copy.constellation.statusTeammatesOnly, { n: list.length });
  if (agents === 1) return t(copy.constellation.statusOrbitOne);
  return t(copy.constellation.statusOrbit, { n: agents });
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2)).toUpperCase();
}
