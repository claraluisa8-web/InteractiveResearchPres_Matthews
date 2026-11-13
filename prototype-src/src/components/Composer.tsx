import { FormEvent, useEffect, useRef, useState } from 'react';
import { copy, t } from '../lib/copy';
import { startReplyFor } from '../lib/flow';
import { contextFor, match } from '../lib/intents';
import { active, firstOf, useScenario } from '../lib/store';
import { thinkingDelay } from '../lib/timing';
import { PromptChip } from './BuildCards';
import { Icon } from './Icon';

// While the builder waits, these keep their own replies and don't start the build (anyMessageStartsBuild).
const KEEP_OWN_REPLY = new Set(['addAgent', 'rename', 'spec']);

export function Composer() {
  const [text, setText] = useState('');
  const [target, setTarget] = useState('team');
  const collaborators = useScenario((s) => s.collaborators);
  const buildStarted = useScenario((s) => s.milestones.buildStarted);
  const readyVisible = useScenario((s) => s.readyVisible);
  const addMenu = useScenario((s) => s.addMenu);
  const openAddMenu = useScenario((s) => s.openAddMenu);
  const closeAddMenu = useScenario((s) => s.closeAddMenu);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const agents = active(collaborators).filter((c) => c.role !== 'teammate');
  const builder = firstOf(collaborators, 'builder');
  // A removed agent can't stay the target.
  const targetAgent = agents.find((c) => c.id === target);
  const effectiveTarget = targetAgent ? target : 'team';
  const hasTeam = active(collaborators).length > 0;
  const ready = !!builder && !buildStarted;

  // Frame 04: once a builder joins, the composer addresses it ("To: Builder").
  useEffect(() => {
    if (builder) setTarget(builder.id);
  }, [builder?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const placeholder = targetAgent
    ? targetAgent.role === 'builder' && ready
      ? t(copy.build.composerPlaceholderReady, { builder: targetAgent.name })
      : t(copy.build.composerPlaceholder, { builder: targetAgent.name })
    : hasTeam ? t(copy.constellation.composerPlaceholderTeam) : copy.emptyState.composerPlaceholder;

  const send = (input: string) => {
    const state = useScenario.getState();
    const ctx = contextFor(state.collaborators, state.milestones);
    const m = match(input, state.collaborators, ctx, state);
    const first = firstOf(state.collaborators, 'builder');
    const toBuilderOrTeam = !targetAgent || targetAgent.id === first?.id;
    // M2: while the builder is ready, any message to it or the team is the go.
    const startsBuild = ctx === 'ready' && toBuilderOrTeam && !(m.intent && KEEP_OWN_REPLY.has(m.intent));

    // Speaker: the addressed agent, else the most relevant one for the intent, else IBM Bob.
    // A reply that names its own speaker ("Builder is working…") reads wrong in that agent's voice,
    // so IBM Bob, the platform they all run on, says it instead.
    const roleAgent = m.speakerRole !== 'bob' ? firstOf(state.collaborators, m.speakerRole) : undefined;
    const candidate = startsBuild ? first : targetAgent ?? roleAgent;
    const speaker = startsBuild || !candidate || !m.reply.includes(candidate.name) ? candidate : undefined;
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
        // Effects only open UI; nothing is added until the user confirms in the panel.
        if (m.intent === 'addAgent') {
          if (m.role) s.startDraft(m.role, m.otherType);
          else s.openAddMenu('composer');
        }
        if (m.intent === 'build' && ctx === 'empty') s.openAddMenu('composer', 'builder');
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
      <form className="pmr-glass composer" onSubmit={submit}>
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
        <label className="composer__pill composer__target">
          <select value={effectiveTarget} onChange={(e) => setTarget(e.target.value)} aria-label={t(copy.chrome.composerTargetLabel)}>
            <option value="team">{copy.emptyState.composerTarget}</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{t(copy.constellation.composerTargetAgent, { name: a.name })}</option>
            ))}
          </select>
          <span className="composer__target-text" aria-hidden="true">
            {targetAgent ? t(copy.constellation.composerTargetAgent, { name: targetAgent.name }) : copy.emptyState.composerTarget}
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
        <button type="submit" className="composer__send" aria-label={t(copy.chrome.sendLabel)} title={t(copy.chrome.sendLabel)}>
          <Icon name="arrow-up" />
        </button>
      </form>
    </>
  );
}
