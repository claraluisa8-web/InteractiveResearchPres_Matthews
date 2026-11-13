import { useEffect, useRef, useState } from 'react';
import { copy, t } from '../lib/copy';
import { useEscape } from '../lib/escape';
import { toScreen, useGeometry } from '../lib/geometry';
import { log } from '../lib/log';
import { firstOf, useScenario } from '../lib/store';
import { CodeEditor } from './CodeEditor';
import { Icon } from './Icon';
import { Orb } from './Orb';
import { SaveButton } from './SaveButton';

const BOX = { left: 40, top: 72, width: 460, height: 470 };

/** Frame 04: a builder file floating over the constellation, editable, with a dashed tie to the builder. */
export function FloatingEditor({ onToast }: { onToast: (message: string) => void }) {
  const file = useScenario((s) => s.floatingFile)!;
  const saved = useScenario((s) => s.files[file] ?? '');
  const draft = useScenario((s) => s.fileDrafts[file]);
  const collaborators = useScenario((s) => s.collaborators);
  const view = useScenario((s) => s.view);
  const openFile = useScenario((s) => s.openFile);
  const setFileDraft = useScenario((s) => s.setFileDraft);
  const saveFile = useScenario((s) => s.saveFile);
  const g = useGeometry();
  const builder = firstOf(collaborators, 'builder');
  const [line, setLine] = useState(1);
  // After Save the button reads "Saved" with a check until the next edit.
  const [justSaved, setJustSaved] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dirty = draft !== undefined && draft !== saved;
  const ff = copy.build.floatingFile;

  const close = () => {
    openFile(null);
    document.querySelector<HTMLElement>(`[data-file-chip="${file}"]`)?.focus();
  };
  useEscape(close);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('.cm-content')?.focus();
  }, [file]);

  const save = () => {
    log('save', { file, section: null, resolved: null });
    saveFile(file);
    setJustSaved(true);
    onToast(t(ff.saveToast, { builder: builder?.name }));
  };

  // Dashed tie from the panel's right edge to the builder orb (stage space, so it survives pan and zoom).
  const node = builder ? g.byId(builder.id) : undefined;
  const target = node ? toScreen(node.point, g, view) : null;
  const from = { x: BOX.left + BOX.width, y: BOX.top + 368 };
  let tie: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (target && node) {
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const len = Math.hypot(dx, dy);
    const r = (node.size / 2 + 8 + 9) * view.k;
    if (len > r + 10) tie = { x1: from.x, y1: from.y, x2: target.x - (dx / len) * r, y2: target.y - (dy / len) * r };
  }

  return (
    <>
      {tie && (
        <svg className="stage-overlay" width="100%" height="900" aria-hidden="true">
          <line className="line line--attach" {...tie} />
        </svg>
      )}
      <section ref={ref} className="pmr-glass floating-editor" style={BOX} aria-label={file}>
        <header className="floating-editor__header">
          <Icon name="files" />
          <div className="floating-editor__titles">
            <h2 className="floating-editor__file">{file}</h2>
            <p className="floating-editor__meta">{t(ff.meta, { builder: builder?.name })}</p>
          </div>
          {dirty && (
            <span className="unsaved">
              <span className="unsaved__dot" aria-hidden="true" />
              {t(ff.unsaved)}
            </span>
          )}
          <button type="button" className="icon-button" aria-label={t(copy.chrome.about.close)} data-tip={t(copy.chrome.about.close)} onClick={close}>
            <Icon name="close" />
          </button>
        </header>
        <div className="floating-editor__code">
          <CodeEditor file={file} doc={draft ?? saved} label={file} onChange={(text) => {
              setFileDraft(file, text);
              setJustSaved(false);
            }} onCursorLine={setLine} onSave={save} />
        </div>
        <footer className="floating-editor__footer">
          <Orb role="you" size={20} />
          <span className="floating-editor__typing" aria-live="polite">{t(ff.typingNote, { line })}</span>
          <SaveButton saved={justSaved && !dirty} label={ff.save} savedLabel={t(ff.savedLabel)} className="floating-editor__save" onClick={save} />
        </footer>
      </section>
    </>
  );
}
