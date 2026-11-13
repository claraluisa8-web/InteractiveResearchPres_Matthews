import { copy, t } from '../lib/copy';
import { sectionById, topSections } from '../lib/sections';
import { useScenario } from '../lib/store';
import type { Collaborator, IssueState, SectionState } from '../lib/types';

const ed = copy.editor;

export type SegmentKind = 'error' | 'fixed' | 'overview' | 'done';

/**
 * Feedback round 8: the progress bar shows urgency. Each section (or subsection) is a segment:
 * red for a real error still open, faded red once fixed but not yet verified, lavender for sections
 * that only need an overview, mint once verified. Errors come first, as they're worked first.
 */
export function segments(cs: Collaborator[], sections: Record<string, SectionState>, issues: Record<number, IssueState>) {
  const units = topSections(cs).flatMap((s) => (s.children ? s.children.map(sectionById) : [s]));
  const ordered = [...units.filter((u) => u.issue), ...units.filter((u) => !u.issue)];
  return ordered.map((u) => {
    const verified = sections[u.id]?.status === 'verified';
    const issue = u.issue ? issues[u.issue] : undefined;
    const open = !!issue && issue.status !== 'resolved' && issue.status !== 'rejected';
    const kind: SegmentKind = verified ? 'done' : u.issue ? (open ? 'error' : 'fixed') : 'overview';
    return { id: u.id, label: u.label, kind, isError: !!u.issue };
  });
}

/** Overview sections left once every error section is verified: these can be verified together. */
export function remainingOverview(cs: Collaborator[], sections: Record<string, SectionState>, issues: Record<number, IssueState>) {
  const segs = segments(cs, sections, issues);
  const errorsDone = segs.filter((s) => s.isError).every((s) => s.kind === 'done');
  return errorsDone ? segs.filter((s) => s.kind === 'overview') : [];
}

export function UrgencyProgress({ label }: { label: string }) {
  const collaborators = useScenario((s) => s.collaborators);
  const sections = useScenario((s) => s.sections);
  const issues = useScenario((s) => s.issues);
  const segs = segments(collaborators, sections, issues);
  const done = segs.filter((s) => s.kind === 'done').length;
  const kinds = new Set(segs.map((s) => s.kind));
  return (
    <div className="urgency">
      <div className="urgency__track" role="progressbar" aria-valuemin={0} aria-valuemax={segs.length} aria-valuenow={done} aria-label={label}>
        {segs.map((s) => <span key={s.id} className={`urgency__seg urgency__seg--${s.kind}`} title={s.label} />)}
      </div>
      <ul className="urgency__legend" aria-hidden="true">
        {(kinds.has('error') || kinds.has('fixed')) && <li><span className="urgency__swatch urgency__seg--error" />{t(ed.legendErrors)}</li>}
        {kinds.has('overview') && <li><span className="urgency__swatch urgency__seg--overview" />{t(ed.legendOverview)}</li>}
        {kinds.has('done') && <li><span className="urgency__swatch urgency__seg--done" />{t(ed.legendDone)}</li>}
      </ul>
    </div>
  );
}
