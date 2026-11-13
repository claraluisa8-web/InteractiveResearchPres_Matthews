import { useEffect } from 'react';
import { copy, t } from './copy';
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
