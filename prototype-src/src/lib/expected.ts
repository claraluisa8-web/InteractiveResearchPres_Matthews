import { copy } from './copy';
import { countOpen } from './geometry';
import { sectionById } from './sections';
import { firstOf, reviewersOf, useScenario } from './store';

type State = ReturnType<typeof useScenario.getState>;

export interface Expected {
  /** Stable name of the state, used for "once per state" hints and for the log. */
  key: string;
  /** The next affordance (flow-and-milestones.md, Hints by state). Null when nothing needs doing. */
  selector: string | null;
}

/** The step the designed path expects next, worked out from state alone. */
export function expectedStep(s: State): Expected {
  const m = s.milestones;
  const builder = firstOf(s.collaborators, 'builder');
  const reviewer = firstOf(s.collaborators, 'reviewer');

  if (m.merged) return { key: 'done', selector: s.rightPanel === 'recap' ? '[data-done]' : null };
  if (m.prCreated && m.teammateApproved) return { key: 'approved', selector: null };
  if (m.prCreated) {
    if (!reviewersOf(s.collaborators).length) return { key: 'review:noReviewer', selector: '[data-add-reviewer]' };
    if (s.reviewStage !== 'commented') return { key: `review:${s.reviewStage}`, selector: null };
    return { key: 'review:commented', selector: s.commentOpen ? '[data-reply]' : '[data-comment-node]' };
  }
  if (s.rightPanel === 'pr') return { key: 'pr', selector: '[data-create-pr]' };
  if (m.allSectionsVerified) {
    return { key: 'allClear', selector: s.allClearOpen ? '[data-allclear-primary]' : s.rightPanel === 'receipt' ? '[data-open-pr]' : '.status-pill.is-button' };
  }

  if (s.editor) {
    const def = sectionById(s.editor.section);
    const issue = def.issue ? s.issues[def.issue] : undefined;
    const open = !!issue && issue.status !== 'resolved' && issue.status !== 'rejected';
    const tab = s.editor.tab;
    const dirty = s.fileDrafts[tab] !== undefined && s.fileDrafts[tab] !== s.files[tab];
    if (s.sections[def.id]?.status === 'verified') return { key: `editor:${def.id}:verified`, selector: '[data-next]' };
    if (dirty) return { key: `editor:${def.id}:unsaved`, selector: '.code-panel__save' };
    if (open) return { key: `editor:${def.id}:issue`, selector: null };
    return { key: `editor:${def.id}:verify`, selector: '[data-verify]' };
  }
  if (s.sectionsLine) return { key: 'sections', selector: countOpen(s.issues) ? '.subsection-row.is-issue' : '[data-open-first]' };
  if (m.issueRaised) return { key: 'issue', selector: countOpen(s.issues) ? '[data-issue-badge]' : '.status-pill.is-button' };
  if (s.configure) return { key: `draft:${s.configure.id}`, selector: '.configure__primary' };
  if (s.addMenu) return { key: 'addMenu', selector: '.add-menu [role="menuitem"]' };
  if (s.recommendation === 'shown' || s.recommendation === 'dismissed') {
    return { key: 'recommendation', selector: s.recCardOpen ? '[data-rec-primary]' : '.status-pill.is-button' };
  }
  if (m.buildStarted) return reviewer ? { key: 'building', selector: null } : { key: 'buildNoReviewer', selector: '[data-plus]' };
  if (builder) return { key: 'ready', selector: s.readyVisible ? '[data-start-build]' : null };
  if (s.collaborators.length === 0) return { key: 'empty', selector: '[data-plus]' };
  return { key: 'noBuilder', selector: '[data-plus]' };
}

/** Plain name for a hint target, for the log and its summary. */
export const affordanceName = (selector: string | null) =>
  ({
    '[data-plus]': copy.constellation.plusLabel.text,
    '.configure__primary': copy.configurePanel.primary,
    '[data-start-build]': copy.build.readyCard.primary,
    '[data-rec-primary]': copy.recommendation.actions[0],
    '[data-issue-badge]': 'Issue badge',
    '.subsection-row.is-issue': 'First issue row',
    '[data-open-first]': 'Open first section',
    '.code-panel__save': copy.editor.save,
    '[data-verify]': copy.editor.verify,
    '[data-next]': copy.editor.next,
    '[data-open-pr]': copy.allClear.primary,
    '[data-create-pr]': copy.pullRequest.primary,
    '[data-reply]': copy.teammateReview.comment.actions[0],
    '[data-comment-node]': 'Comment node',
    '[data-merge]': copy.teammateReview.merge,
    '.status-pill.is-button': 'Status pill',
    '.add-menu [role="menuitem"]': 'A role in the add menu',
  } as Record<string, string>)[selector ?? ''] ?? selector ?? '';
