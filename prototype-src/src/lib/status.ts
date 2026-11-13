import { copy, t } from './copy';
import { active, firstOf, useScenario } from './store';
import type { Collaborator, Milestones, Recommendation } from './types';
import type { PillTone } from '../components/StatusPill';

/** The orb's second label line: its configuration, or a believable quiet status. */
export function subtitleFor(c: Collaborator, all: Collaborator[]): string {
  if (c.status === 'draft') return copy.configurePanel.ghostLabel;
  if (c.status === 'suggested') return copy.pullRequest.teammateAddingSubtitle;
  if (c.review === 'pending') return copy.teammateReview.teammateSubtitle;
  if (c.review === 'approved') return t(copy.teammateReview.approvedSubtitle);
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

export interface Pill { text: string; tone: PillTone; target?: 'add' | 'ready' | 'build' | 'suggestion' | 'sections' | 'receipt' | 'comment' | 'merge' | 'recap' }

export interface IssueCounts { open: number; verified: number; total: number; editorIssue?: { n: number; total: number } }

/** Status pill by milestone: suggestion > building > ready > team size > empty. */
export function statusPill(all: Collaborator[], m: Milestones, rec: Recommendation, counts?: IssueCounts): Pill {
  const builder = firstOf(all, 'builder');
  if (m.merged) return { text: copy.recap.statusPill, tone: 'neutral', target: 'recap' };
  if (m.prCreated && !m.teammateApproved) {
    const s = useScenario.getState();
    // Once a comment is in, the wait is on the user, and the pill says so.
    const waiting = all.find((c) => c.role === 'teammate' && c.reviewStage === 'commented');
    if (waiting) {
      return { text: t(copy.teammateReview.waitingReplyCheck, { teammateFirst: waiting.name.split(' ')[0] }), tone: 'lavender', target: 'comment' };
    }
    const n = all.filter((c) => c.role === 'teammate' && c.review === 'pending').length;
    const text = n > 1 ? t(copy.teammateReview.reviewsPill, { n }) : copy.teammateReview.statusPill;
    return { text, tone: 'lavender', target: s.reviewStage === 'reviewing' || n === 0 ? undefined : 'comment' };
  }
  if (m.prCreated) return { text: t(copy.teammateReview.statusApproved), tone: 'neutral' };
  if (m.issueRaised && counts) {
    if (counts.editorIssue) return { text: t(copy.editor.statusPill, counts.editorIssue), tone: 'issue', target: 'sections' };
    if (counts.open > 0) {
      const text = counts.open === 1 ? t(copy.issueLine.statusPillOne) : copy.issueLine.statusPill.replace('2', String(counts.open));
      return { text, tone: 'issue', target: 'sections' };
    }
    if (m.allSectionsVerified) return { text: copy.allClear.statusPill, tone: 'neutral', target: 'receipt' };
    return { text: t(copy.sectionsPanel.progress, { verified: counts.verified, total: counts.total }), tone: 'neutral', target: 'sections' };
  }
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

/** Teammates in the order they joined get ring tones 1–4 (feedback round 4). */
export function mateTone(id: string, all: Collaborator[]): number | undefined {
  const mates = all.filter((c) => c.role === 'teammate');
  const i = mates.findIndex((c) => c.id === id);
  return i < 0 ? undefined : (i % 4) + 1;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase();
}

/** A teammate draft has no name until the user types one; show the role meanwhile. */
export const displayName = (c: { name: string; role: string }) => c.name || (c.role === 'teammate' ? copy.roles.teammate.menuTitle : c.name);
