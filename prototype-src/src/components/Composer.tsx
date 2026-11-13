import { FormEvent, useEffect, useRef, useState } from 'react';
import { copy, t } from '../lib/copy';
import { contextFor, match } from '../lib/intents';
import { active, firstOf, useScenario } from '../lib/store';
import { Icon } from './Icon';

const think = () => 700 + Math.random() * 500;

export function Composer() {
  const [text, setText] = useState('');
  const [target, setTarget] = useState('team');
  const collaborators = useScenario((s) => s.collaborators);
  const addMenu = useScenario((s) => s.addMenu);
  const openAddMenu = useScenario((s) => s.openAddMenu);
  const closeAddMenu = useScenario((s) => s.closeAddMenu);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const agents = active(collaborators).filter((c) => c.role !== 'teammate');
  // A removed agent can't stay the target.
  const targetAgent = agents.find((c) => c.id === target);
  const effectiveTarget = targetAgent ? target : 'team';
  const hasTeam = active(collaborators).length > 0;
  const placeholder = targetAgent
    ? t(copy.build.composerPlaceholder, { builder: targetAgent.name })
    : hasTeam ? t(copy.constellation.composerPlaceholderTeam) : copy.emptyState.composerPlaceholder;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = text.trim();
    if (!input) return;
    setText('');
    const state = useScenario.getState();
    const ctx = contextFor(state.collaborators, state.milestones);
    const m = match(input, state.collaborators, ctx);
    // Speaker: the addressed agent, else the most relevant one for the intent, else IBM Bob.
    const roleAgent = m.speakerRole !== 'bob' ? firstOf(state.collaborators, m.speakerRole) : undefined;
    const speaker = targetAgent ?? roleAgent;
    const id = state.pushReply({
      speaker: speaker?.name ?? t(copy.constellation.bobName),
      role: speaker?.role ?? 'bob',
      text: m.reply,
      thinking: true,
    });
    timers.current.push(
      window.setTimeout(() => {
        const s = useScenario.getState();
        s.updateReply(id, { thinking: false });
        // Effects only open UI; nothing is added until the user confirms in the panel.
        if (m.intent === 'addAgent') {
          if (m.role) s.startDraft(m.role, m.otherType);
          else s.openAddMenu('composer');
        }
        if (m.intent === 'build' && ctx === 'empty') s.openAddMenu('composer', 'builder');
        if (m.intent === 'rename') {
          if (m.targetId) s.editCollaborator(m.targetId, { focusName: true, prefillName: m.newName });
        }
      }, think()),
    );
  };

  return (
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
  );
}
