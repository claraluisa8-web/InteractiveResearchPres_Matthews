import { FormEvent, useEffect, useRef, useState } from 'react';
import { copy, t } from '../lib/copy';
import { startReplyFor } from '../lib/flow';
import { countOpen } from '../lib/geometry';
import { contextFor, match } from '../lib/intents';
import { topSections } from '../lib/sections';
import { active, firstOf, useScenario } from '../lib/store';
import { log } from '../lib/log';
import { thinkingDelay } from '../lib/timing';
import { PromptChip } from './BuildCards';
import { Icon } from './Icon';

// While the builder waits, these keep their own replies and don't start the build (anyMessageStartsBuild).
const KEEP_OWN_REPLY = new Set(['addAgent', 'rename', 'spec']);

/** A paperclip, drawn: Codicons has no attachment glyph. */
function PaperclipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M10.5 4.5 5.4 9.6a1.6 1.6 0 0 0 2.3 2.3l5.4-5.4a2.9 2.9 0 0 0-4.1-4.1L3.4 8a4.2 4.2 0 0 0 6 6l4.1-4.1" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Composer({ onToast }: { onToast: (message: string) => void }) {
  const [text, setText] = useState('');
  // Who the composer addresses lives in the store, so Reply and the teammate popover can set it.
  const target = useScenario((s) => s.composerTarget);
  const setStoreTarget = useScenario((s) => s.setComposerTarget);
  const setTarget = (next: string | ((cur: string) => string)) =>
    setStoreTarget(typeof next === 'function' ? next(useScenario.getState().composerTarget) : next);
  const attachments = useScenario((s) => s.attachments);
  const setAttachments = useScenario((s) => s.setAttachments);
  const allClear = useScenario((s) => s.milestones.allSectionsVerified);
  const reviewStage = useScenario((s) => s.reviewStage);
  const [attachOpen, setAttachOpen] = useState(false);
  const collaborators = useScenario((s) => s.collaborators);
  const buildStarted = useScenario((s) => s.milestones.buildStarted);
  const readyVisible = useScenario((s) => s.readyVisible);
  const addMenu = useScenario((s) => s.addMenu);
  const openAddMenu = useScenario((s) => s.openAddMenu);
  const closeAddMenu = useScenario((s) => s.closeAddMenu);
  const editorOpen = useScenario((s) => !!s.editor);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const agents = active(collaborators).filter((c) => c.role !== 'teammate');
  // Feedback round 2: human teammates are addressable too; messages go on their line.
  const mates = active(collaborators).filter((c) => c.role === 'teammate');
  const targetMate = mates.find((c) => c.id === target);
  const builder = firstOf(collaborators, 'builder');
  const reviewer = firstOf(collaborators, 'reviewer');
  // A removed agent can't stay the target; "Both agents" exists only while the editor is open.
  const both = target === 'both' && editorOpen && !!builder && !!reviewer;
  const targetAgent = both ? undefined : agents.find((c) => c.id === target);
  const effectiveTarget = both ? 'both' : targetAgent || targetMate ? target : 'team';
  const hasTeam = active(collaborators).length > 0;
  const ready = !!builder && !buildStarted;

  // Frame 04: once a builder joins, the composer addresses it ("To: Builder").
  useEffect(() => {
    if (builder) setTarget(builder.id);
  }, [builder?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Frame 07: in the editor the composer talks to both agents on the line.
  useEffect(() => {
    if (editorOpen && builder && reviewer) setTarget('both');
    else setTarget((cur) => (cur === 'both' ? builder?.id ?? 'team' : cur));
  }, [editorOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const mateFirst = targetMate?.name.split(' ')[0];
  const placeholder = targetMate
    ? t(reviewStage === 'commented' && targetMate.id === useScenario.getState().pr.reviewer ? copy.teammateReview.replyPlaceholder : copy.teammateReview.messagePlaceholder, { teammateFirst: mateFirst })
    : both
    ? copy.editor.composerPlaceholder
    : targetAgent
    ? targetAgent.role === 'builder' && ready
      ? t(copy.build.composerPlaceholderReady, { builder: targetAgent.name })
      : t(copy.build.composerPlaceholder, { builder: targetAgent.name })
    : hasTeam ? t(copy.constellation.composerPlaceholderTeam) : copy.emptyState.composerPlaceholder;

  const send = (input: string) => {
    const state = useScenario.getState();
    const ctx = contextFor(state.collaborators, state.milestones, !!state.editor);
    // To a human teammate: a message on your line with them. During the review it's the reply
    // to their comment, which is what unlocks the approval.
    if (targetMate) {
      const isReply = state.reviewStage === 'commented' && targetMate.id === state.pr.reviewer;
      log('input', { field: isReply ? 'commentReply' : 'teammateMessage', text: input, attachments: state.attachments });
      if (isReply) state.replyToTeammate(input);
      else state.messageTeammate(targetMate.id, input);
      return;
    }
    // Frame 10: while the review is open, anything sent To: Team is a reply to the teammate's comment.
    if (ctx === 'review' && state.reviewStage === 'commented') {
      log('input', { field: 'composer', text: input, intent: 'replyToTeammate', score: 0 });
      state.replyToTeammate(input);
      state.setCommentOpen(true);
      return;
    }
    const tops = topSections(state.collaborators);
    const m = match(input, state.collaborators, ctx, {
      recommendation: state.recommendation,
      verified: tops.filter((sec) => state.sections[sec.id]?.status === 'verified').length,
      total: tops.length,
      issues: countOpen(state.issues),
    });
    log('input', { field: 'composer', text: input, intent: m.intent, score: m.score });
    if (!m.intent) log('fallback', { text: input });
    const first = firstOf(state.collaborators, 'builder');
    const toBuilderOrTeam = !targetAgent || targetAgent.id === first?.id;
    // M2: while the builder is ready, any message to it or the team is the go.
    const startsBuild = ctx === 'ready' && toBuilderOrTeam && !(m.intent && KEEP_OWN_REPLY.has(m.intent));

    // Speaker: the addressed agent, else the most relevant one for the intent, else IBM Bob.
    // A reply that names its own speaker ("Builder is working…") reads wrong in that agent's voice,
    // so IBM Bob, the platform they all run on, says it instead.
    const roleAgent = m.speakerRole !== 'bob' ? firstOf(state.collaborators, m.speakerRole) : undefined;
    // Replies written as "{reviewer}: …" come from that agent, without the prefix.
    const prefixed = active(state.collaborators).find((c) => m.reply.startsWith(`${c.name}: `));
    if (prefixed) m.reply = m.reply.slice(prefixed.name.length + 2);
    const candidate = startsBuild ? first : prefixed ?? targetAgent ?? roleAgent;
    const speaker = startsBuild || prefixed || !candidate || !m.reply.includes(candidate.name) ? candidate : undefined;
    if (startsBuild) state.startBuild();
    const id = state.pushReply({
      speaker: speaker?.name ?? t(copy.constellation.bobName),
      role: speaker?.role ?? 'bob',
      text: startsBuild ? startReplyFor(input) : m.reply,
      thinking: true,
    });
    timers.current.push(
      window.setTimeout(() => {
        const s = useScenario.getState();
        s.updateReply(id, { thinking: false });
        if (startsBuild) return;
        // In the editor, an agent's reply also becomes the latest line on its card.
        if (s.editor && (speaker?.role === 'builder' || speaker?.role === 'reviewer')) s.setCardNote(speaker.role, m.reply);
        // "just fix it": preview the reviewer's fix; applying still needs the user's click.
        if (m.intent === 'fix') {
          const openIssue = copy.issues.find((i) => s.issues[i.id] && !['resolved', 'rejected'].includes(s.issues[i.id].status));
          if (openIssue) {
            const inIssue = s.editor && copy.issues.find((i) => i.section === s.editor!.section && i.id === openIssue.id);
            if (!inIssue) s.openSection(openIssue.section);
            useScenario.getState().setEditorMode('diff');
          }
        }
        // Effects only open UI; nothing is added until the user confirms in the panel.
        if (m.intent === 'addAgent') {
          if (m.role) s.startDraft(m.role, m.otherType);
          else s.openAddMenu('composer');
        }
        if (m.intent === 'build' && ctx === 'empty') s.openAddMenu('composer', 'builder');
        // M8 also fires when the user asks to merge or ship once every line is clear.
        if (m.intent === 'merge' && ctx === 'allClear' && !s.milestones.prOpened) s.openPR();
        if (m.intent === 'rename' && m.targetId) s.editCollaborator(m.targetId, { focusName: true, prefillName: m.newName });
      }, thinkingDelay()),
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = text.trim();
    if (!input) return;
    setText('');
    send(input);
  };

  return (
    <>
      {ready && readyVisible && (
        <div className="prompt-chip-row">
          <PromptChip onSend={send} />
        </div>
      )}
      {targetMate && attachments.length > 0 && (
        <div className="prompt-chip-row attachment-row">
          {attachments.map((f) => (
            <button
              key={f}
              type="button"
              className="chip chip--prompt chip--attachment"
              aria-label={t(copy.teammateReview.removeAttachment, { file: f })}
              data-tip={t(copy.teammateReview.removeAttachment, { file: f })}
              onClick={() => setAttachments(attachments.filter((x) => x !== f))}
            >
              <Icon name="file" size={14} />
              <span className="is-mono">{f}</span>
              <Icon name="close" size={12} />
            </button>
          ))}
        </div>
      )}
      <form className="pmr-glass composer" onSubmit={submit}>
        {targetMate ? (
          // Writing to a person: Add node becomes "attach a file" (feedback round 2).
          <div className="composer__attach-wrap">
            <button
              type="button"
              className={`composer__pill composer__attach${attachOpen ? ' is-open' : ''}`}
              aria-label={t(copy.teammateReview.attach)}
              data-tip={t(copy.teammateReview.attach)}
              aria-haspopup="menu"
              aria-expanded={attachOpen}
              onClick={() => setAttachOpen((o) => !o)}
            >
              <PaperclipIcon />
            </button>
            {attachOpen && (
              <div className="pmr-glass menu attach-menu" role="menu" onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), setAttachOpen(false))}>
                {[
                  ...(allClear ? ['verification-receipt.md'] : []),
                  'PlanController.java',
                  'recurring-investments.yaml',
                ].map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="menuitem"
                    className="menu__row"
                    autoFocus={f === (allClear ? 'verification-receipt.md' : 'PlanController.java')}
                    onClick={() => {
                      if (!attachments.includes(f)) setAttachments([...attachments, f]);
                      setAttachOpen(false);
                      document.querySelector<HTMLElement>('.composer__input')?.focus();
                    }}
                  >
                    {f === 'verification-receipt.md' ? t(copy.teammateReview.attachReceipt) : <span className="is-mono">{f}</span>}
                  </button>
                ))}
                <button
                  type="button"
                  role="menuitem"
                  className="menu__row"
                  onClick={() => {
                    setAttachOpen(false);
                    onToast(t(copy.chrome.notInPrototypeToast));
                  }}
                >
                  {t(copy.teammateReview.attachComputer)}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className={`composer__pill composer__add${addMenu?.anchor === 'composer' ? ' is-open' : ''}`}
            data-add-node
            aria-haspopup="menu"
            aria-expanded={addMenu?.anchor === 'composer'}
            onClick={() => (addMenu?.anchor === 'composer' ? closeAddMenu() : openAddMenu('composer'))}
          >
            <Icon name="add" />
            <span>{t(copy.chrome.composerAddNode)}</span>
          </button>
        )}
        <label className="composer__pill composer__target">
          <select value={effectiveTarget} onChange={(e) => setTarget(e.target.value)} aria-label={t(copy.chrome.composerTargetLabel)}>
            <option value="team">{copy.emptyState.composerTarget}</option>
            {editorOpen && builder && reviewer && (
              <option value="both">{t(copy.editor.bothAgents)}</option>
            )}
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{t(copy.constellation.composerTargetAgent, { name: a.name })}</option>
            ))}
            {mates.map((m) => (
              <option key={m.id} value={m.id}>{t(copy.constellation.composerTargetAgent, { name: m.name })}</option>
            ))}
          </select>
          <span className="composer__target-text" aria-hidden="true">
            {both
              ? t(copy.editor.composerTarget, { builder: builder!.name, reviewer: reviewer!.name })
              : targetAgent || targetMate
                ? t(copy.constellation.composerTargetAgent, { name: (targetAgent ?? targetMate)!.name })
                : copy.emptyState.composerTarget}
          </span>
          <Icon name="chevron-down" />
        </label>
        <input
          className="composer__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          aria-label={t(copy.chrome.composerInputLabel)}
        />
        <button type="submit" className="composer__send" aria-label={t(copy.chrome.sendLabel)} data-tip={t(copy.chrome.sendLabel)}>
          <Icon name="arrow-up" />
        </button>
      </form>
    </>
  );
}
