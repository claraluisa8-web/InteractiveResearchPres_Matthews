import { useRef } from 'react';
import { copy, t } from '../lib/copy';
import { usePopupFocus } from '../lib/usePopupFocus';
import { useEscape } from '../lib/escape';
import { giveTheGo } from '../lib/flow';
import { log } from '../lib/log';
import { subtitleFor } from '../lib/status';
import { firstOf, useScenario } from '../lib/store';
import { Icon } from './Icon';
import { Orb } from './Orb';

const CHIP_FILES: Record<string, string> = {
  'PlanController.java': 'PlanController.java',
  'CreatePlanRequest.java  +3': 'CreatePlanRequest.java',
  'PlanService.java': 'PlanService.java',
};

/** "CreatePlanRequest.java  +3" reads as three pages to step through (P3); say they're more files. */
function chipLabel(chip: string) {
  const m = chip.match(/^(.*?)\s+\+(\d+)$/);
  return m ? `${m[1]}  ${t(copy.build.builderUpdate.moreFiles, { n: m[2] })}` : chip;
}

/** Top-right card: the builder's ready state (M1b) cross-fading into its update card (M2, frame 04). */
export function BuildCard() {
  const collaborators = useScenario((s) => s.collaborators);
  const buildStarted = useScenario((s) => s.milestones.buildStarted);
  const readyVisible = useScenario((s) => s.readyVisible);
  const updateCardOpen = useScenario((s) => s.updateCardOpen);
  const floatingFile = useScenario((s) => s.floatingFile);
  const openFile = useScenario((s) => s.openFile);
  const setUpdateCardOpen = useScenario((s) => s.setUpdateCardOpen);
  const startDraft = useScenario((s) => s.startDraft);
  const builder = firstOf(collaborators, 'builder');
  const reviewer = collaborators.some((c) => c.role === 'reviewer' && c.status === 'active');
  const readyRef = useRef<HTMLElement>(null);
  // The ready card's purple "Start from the spec" takes focus when it appears, so Enter starts the build.
  usePopupFocus(readyRef, '[data-start-build]', { when: !!builder && !buildStarted && readyVisible });
  if (!builder) return null;
  const model = subtitleFor(builder, collaborators);

  if (!buildStarted) {
    if (!readyVisible) return null;
    const rc = copy.build.readyCard;
    return (
      <section key="ready" ref={readyRef} className="pmr-glass build-card" aria-label={builder.name}>
        <header className="build-card__header">
          <Orb role="builder" size={28} />
          <div>
            <p className="build-card__name">{builder.name}</p>
            <p className="build-card__meta">{`${model}  ·  ${t(rc.metaSuffix)}`}</p>
          </div>
        </header>
        <p className="build-card__body">{t(rc.body)}</p>
        <button type="button" className="pmr-button build-card__start" data-start-build onClick={() => giveTheGo()}>{rc.primary}</button>
      </section>
    );
  }

  if (!updateCardOpen) return null;
  const bu = copy.build.builderUpdate;
  return (
    <section key="update" className="pmr-glass build-card" aria-label={builder.name}>
      <header className="build-card__header">
        <Orb role="builder" size={28} />
        <div>
          <p className="build-card__name">{builder.name}</p>
          <p className="build-card__meta">{`${model}  ·  ${t(bu.metaSuffix)}`}</p>
        </div>
        <button
          type="button"
          className="icon-button build-card__close"
          aria-label={t(copy.build.updateCardClose)}
          data-tip={t(copy.build.updateCardClose)}
          onClick={() => setUpdateCardOpen(false)}
        >
          <Icon name="close" />
        </button>
      </header>
      <p className="build-card__body">{bu.body}</p>
      {/* P3 testing: the file chips read as the task. Until there's a reviewer, the card names the next step. */}
      {!reviewer && (
        <div className="build-card__next">
          <p className="pmr-label">{t(bu.nextLabel)}</p>
          <p className="build-card__next-body">{t(bu.nextBody)}</p>
          <button type="button" className="pmr-button" data-add-reviewer-next onClick={() => { log('click', { target: 'buildCardAddReviewer' }); startDraft('reviewer'); }}>
            <Icon name="add" size={14} />{t(bu.nextButton)}
          </button>
        </div>
      )}
      <p className="pmr-label build-card__files-label">{t(bu.filesLabel)}</p>
      <div className="chips build-card__chips">
        {bu.chips.map((chip) => {
          const file = CHIP_FILES[chip];
          const open = floatingFile === file;
          return (
            <button
              key={chip}
              type="button"
              className={`chip chip--file${open ? ' is-active' : ''}`}
              data-file-chip={file}
              aria-pressed={open}
              onClick={() => openFile(open ? null : file)}
            >
              {chipLabel(chip)}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Suggestion chip above the composer while the builder waits for the go. */
export function PromptChip({ onSend }: { onSend: (text: string) => void }) {
  const chip = copy.build.promptChip;
  return (
    <button type="button" className="chip chip--prompt" onClick={() => onSend(t(chip))}>
      <Icon name="sparkle" size={14} />
      {t(chip)}
    </button>
  );
}

/** Frame 05: the reviewer's tester suggestion. Add tester / Adjust first / Not now. */
export function RecommendationCard() {
  const collaborators = useScenario((s) => s.collaborators);
  const setRecommendation = useScenario((s) => s.setRecommendation);
  const addDirect = useScenario((s) => s.addDirect);
  const startDraft = useScenario((s) => s.startDraft);
  const reviewer = firstOf(collaborators, 'reviewer');
  const ref = useRef<HTMLElement>(null);
  // Enter adds the tester; Tab cycles Add tester, Adjust first, Not now.
  usePopupFocus(ref, '[data-rec-primary]', { trap: true });
  // Esc is "Not now": the ring and the pill stay so the suggestion can be reopened.
  useEscape(() => setRecommendation('dismissed', false));
  if (!reviewer) return null;
  const r = copy.recommendation;
  const [add, adjust, notNow] = r.actions;
  return (
    <section ref={ref} className="pmr-glass rec-card" aria-labelledby="rec-title" role="dialog">
      <header className="build-card__header">
        <Orb role="reviewer" size={28} />
        <div>
          <p className="build-card__name" id="rec-title">{t(r.title, { reviewer: reviewer.name })}</p>
          <p className="build-card__meta">{`${subtitleFor(reviewer, collaborators)}  ·  ${t(copy.build.builderUpdate.metaSuffix)}`}</p>
        </div>
      </header>
      <p className="build-card__body">{r.body}</p>
      <div className="chips rec-card__chips">
        {r.chips.map((c) => <span key={c} className="chip chip--small chip--static">{c}</span>)}
      </div>
      <div className="rec-card__actions">
        <button type="button" className="pmr-button" data-rec-primary onClick={() => addDirect('tester')}>{add}</button>
        <button type="button" className="pmr-button pmr-button--secondary" onClick={() => { setRecommendation('dismissed', false); startDraft('tester'); }}>{adjust}</button>
        <button type="button" className="pmr-button pmr-button--secondary" onClick={() => setRecommendation('dismissed', false)}>{notNow}</button>
      </div>
    </section>
  );
}

/** Bottom-left legend, shown only once its encoding is on screen. */
export function Legend({ items }: { items: { kind: 'ring' | 'issue' | 'dashed'; text: string }[] }) {
  // The suggestion and the review can both explain the lavender ring; say it once.
  const unique = items.filter((i, n) => items.findIndex((x) => x.text === i.text) === n);
  if (unique.length === 0) return null;
  return (
    <ul className="legend" aria-label={t(copy.recommendation.legendLabel)}>
      {unique.map((i) => (
        <li key={i.text}>
          <span className={`legend__sample legend__sample--${i.kind}`} aria-hidden="true" />
          {i.text}
        </li>
      ))}
    </ul>
  );
}
