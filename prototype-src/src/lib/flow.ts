import { useEffect, useRef } from 'react';
import { copy, t } from './copy';
import { log } from './log';
import { topSections } from './sections';
import { firstOf, useScenario } from './store';
import { TIMING, thinkingDelay } from './timing';

/** Builder's reply to the go, echoing an operation the user named ("Starting with createPlan. "). */
export function startReplyFor(input?: string) {
  const op = input && copy.build.operations.find((o) => input.toLowerCase().includes(o.toLowerCase()));
  return (op ? t(copy.build.startEcho, { operation: op }) : '') + t(copy.build.startReply);
}

/** M2 from the ready card or the chip: the build starts now, the builder answers after a beat. */
export function giveTheGo(input?: string) {
  const s = useScenario.getState();
  const builder = firstOf(s.collaborators, 'builder');
  if (!builder || s.milestones.buildStarted) return;
  s.startBuild();
  const id = s.pushReply({ speaker: builder.name, role: 'builder', text: startReplyFor(input), thinking: true });
  window.setTimeout(() => useScenario.getState().updateReply(id, { thinking: false }), thinkingDelay());
}

/**
 * Milestones fire on conditions, not click sequences (flow-and-milestones.md).
 * M1b ready card, M3 recommendation (or skip), and the suggestion settling once a tester exists.
 */
export function useFlow() {
  const collaborators = useScenario((s) => s.collaborators);
  const buildStarted = useScenario((s) => s.milestones.buildStarted);
  const readyVisible = useScenario((s) => s.readyVisible);
  const recommendation = useScenario((s) => s.recommendation);
  const floatingSettled = useScenario((s) => s.floatingSettled);
  const setReadyVisible = useScenario((s) => s.setReadyVisible);
  const setRecommendation = useScenario((s) => s.setRecommendation);

  const builder = firstOf(collaborators, 'builder');
  const reviewer = firstOf(collaborators, 'reviewer');
  const tester = firstOf(collaborators, 'tester');

  // M1b: the builder waits for the user's go.
  useEffect(() => {
    if (!builder || buildStarted) {
      if (readyVisible) setReadyVisible(false);
      return;
    }
    if (readyVisible) return;
    const id = window.setTimeout(() => setReadyVisible(true), TIMING.readyCardDelay);
    return () => window.clearTimeout(id);
  }, [builder, buildStarted, readyVisible, setReadyVisible]);

  // M3: a reviewer spots the missing tester, 4 s into the build or as soon as the floating file settles.
  useEffect(() => {
    if (!buildStarted || !reviewer || recommendation !== 'none') return;
    if (tester) {
      setRecommendation('skipped');
      return;
    }
    const id = window.setTimeout(() => setRecommendation('shown', true), TIMING.recommendationDelay);
    return () => window.clearTimeout(id);
  }, [buildStarted, reviewer, tester, recommendation, setRecommendation]);

  useEffect(() => {
    const s = useScenario.getState();
    if (floatingSettled > 0 && s.milestones.buildStarted && firstOf(s.collaborators, 'reviewer') && s.recommendation === 'none' && !firstOf(s.collaborators, 'tester')) {
      setRecommendation('shown', true);
    }
  }, [floatingSettled, setRecommendation]);

  // A tester arriving any way (Add tester, Adjust first, the + menu) settles the suggestion.
  // A removed reviewer takes its pending suggestion with it.
  useEffect(() => {
    const pending = recommendation === 'shown' || recommendation === 'dismissed';
    if (pending && tester) setRecommendation('accepted', false);
    else if (pending && !reviewer) setRecommendation('none', false);
  }, [recommendation, tester, reviewer, setRecommendation]);
}

/** After a save: both agents recheck for recheckDelay, then the issue resolves or the reviewer says why not. */
export function scheduleRecheck(ids: number[], section?: string) {
  if (ids.length === 0) return;
  window.setTimeout(() => {
    const s = useScenario.getState();
    s.recheck(ids);
    const after = useScenario.getState();
    // docs/logging.md: save events carry whether the recheck resolved the issue.
    for (const id of ids) log('save', { file: 'PlanController.java', section: section ?? null, issue: id, resolved: after.issues[id]?.status === 'resolved' });
    const ar = copy.editor.afterResolve;
    // The cards speak for the issue on screen; others keep their result on the issue itself.
    const onScreen = after.editor ? copy.issues.find((i) => i.section === after.editor!.section)?.id : undefined;
    for (const id of ids.filter((x) => x === onScreen)) {
      const i = after.issues[id];
      if (i?.status === 'resolved') {
        after.setCardNote('builder', t(ar.builder));
        after.setCardNote('reviewer', t(ar.reviewer));
      } else if (i?.note) {
        after.setCardNote('reviewer', i.note);
      }
    }
  }, TIMING.recheckDelay);
}

/** M4 (issue raised once the suggestion is handled) and M7 (every section verified). */
export function useIssueFlow() {
  const collaborators = useScenario((s) => s.collaborators);
  const m = useScenario((s) => s.milestones);
  const recommendation = useScenario((s) => s.recommendation);
  const sections = useScenario((s) => s.sections);
  const raiseIssue = useScenario((s) => s.raiseIssue);
  const builder = firstOf(collaborators, 'builder');
  const reviewer = firstOf(collaborators, 'reviewer');
  const handled = recommendation === 'accepted' || recommendation === 'dismissed' || recommendation === 'skipped';

  useEffect(() => {
    if (m.issueRaised || !m.buildStarted || !builder || !reviewer || !handled) return;
    const id = window.setTimeout(raiseIssue, TIMING.issueDelay);
    return () => window.clearTimeout(id);
  }, [m.issueRaised, m.buildStarted, builder, reviewer, handled, raiseIssue]);

  useEffect(() => {
    if (!m.issueRaised || m.allSectionsVerified) return;
    const tops = topSections(collaborators);
    if (tops.every((sec) => sections[sec.id]?.status === 'verified')) {
      // M7: lines settle and the receipt replaces the sections panel (frame 08).
      useScenario.setState((s) => ({
        milestones: { ...s.milestones, allSectionsVerified: true },
        sectionsLine: null,
        linkIds: null,
        // Feedback: the next step shouldn't hide behind the status pill, so a pop-up says it.
        editor: null,
        allClearOpen: true,
        rightPanel: null,
        updateCardOpen: false,
        floatingFile: null,
      }));
    }
  }, [m.issueRaised, m.allSectionsVerified, sections, collaborators]);
}

/**
 * M9 to M10: the teammate reviews the PR for a few seconds, then comments. Approval needs a reply
 * (any text); the teammate reads it for a beat before approving. The idle hint points at Reply.
 */
export function useReviewFlow() {
  const thread = useScenario((s) => s.thread);
  const collaborators = useScenario((s) => s.collaborators);
  const approved = useScenario((s) => s.milestones.teammateApproved);
  const merged = useScenario((s) => s.milestones.merged);

  // A message outside the review (before the PR, or after approval) gets a short answer.
  useEffect(() => {
    const last = thread[thread.length - 1];
    if (!last || last.from !== 'you') return;
    const s = useScenario.getState();
    const mate = s.collaborators.find((c) => c.id === last.with);
    if (mate?.reviewStage === 'commented' || mate?.reviewStage === 'reading') return;
    const answer = mate?.review === 'approved' ? copy.teammateReview.afterApprovalAnswer : copy.teammateReview.preReviewAnswer;
    const id = window.setTimeout(() => {
      useScenario.setState((x) => ({ thread: [...x.thread, { from: 'teammate', text: t(answer), with: last.with }] }));
    }, 1600);
    return () => window.clearTimeout(id);
  }, [thread]);

  // Feedback round 4: each reviewer runs their own clock. Timers are keyed by teammate and stage so
  // one teammate moving on never restarts another's wait. Comments arrive a little apart.
  const timers = useRef(new Map<string, number>());
  const pending = collaborators
    .filter((c) => c.role === 'teammate' && (c.reviewStage === 'reviewing' || c.reviewStage === 'reading'))
    .map((c) => `${c.id}:${c.reviewStage}`);
  const key = pending.join('|');
  useEffect(() => {
    const map = timers.current;
    for (const [k, id] of map) if (!pending.includes(k)) { window.clearTimeout(id); map.delete(k); }
    pending.forEach((k, i) => {
      if (map.has(k)) return;
      const [mateId, stage] = k.split(':');
      const s = useScenario.getState();
      const delay = stage === 'reviewing' ? TIMING.teammateReview + i * TIMING.reviewStagger : TIMING.teammateReadReply;
      map.set(k, window.setTimeout(() => {
        map.delete(k);
        if (stage === 'reviewing') s.setMateStage(mateId, 'commented');
        else useScenario.getState().approve(mateId);
      }, delay));
    });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { for (const id of timers.current.values()) window.clearTimeout(id); }, []);

  // Feedback round 4: approval merges the pull request; no Merge button. A beat of success first.
  useEffect(() => {
    if (!approved || merged) return;
    const id = window.setTimeout(() => useScenario.getState().merge(), TIMING.autoMerge);
    return () => window.clearTimeout(id);
  }, [approved, merged]);
}
