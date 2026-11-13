import { FormEvent, useState } from 'react';
import { copy, t } from '../lib/copy';
import { Icon } from './Icon';

interface ComposerProps {
  onAddNode: () => void;
  onSend: (text: string) => void;
}

export function Composer({ onAddNode, onSend }: ComposerProps) {
  const [text, setText] = useState('');
  const [target, setTarget] = useState('team');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form className="pmr-glass composer" onSubmit={submit}>
      <button type="button" className="composer__pill composer__add" onClick={onAddNode}>
        <Icon name="add" />
        <span>{t(copy.chrome.composerAddNode)}</span>
      </button>
      <label className="composer__pill composer__target">
        <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label={t(copy.chrome.composerTargetLabel)}>
          <option value="team">{copy.emptyState.composerTarget}</option>
        </select>
        <Icon name="chevron-down" />
      </label>
      <input
        className="composer__input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={copy.emptyState.composerPlaceholder}
        aria-label={t(copy.chrome.composerInputLabel)}
      />
      <button type="submit" className="composer__send" aria-label={t(copy.chrome.sendLabel)} title={t(copy.chrome.sendLabel)}>
        <Icon name="arrow-up" />
      </button>
    </form>
  );
}
