import { useEffect, useRef } from 'react';
import { codeFile } from '../lib/code';
import { copy, t } from '../lib/copy';
import { useEscape } from '../lib/escape';
import { useScenario } from '../lib/store';
import { Icon } from './Icon';

/** Read-only spec viewer (the editor pop-up, locked). CodeMirror replaces the plain listing in phase 2. */
export function SpecViewer() {
  const setSpecOpen = useScenario((s) => s.setSpecOpen);
  const ref = useRef<HTMLDivElement>(null);
  const lines = codeFile('recurring-investments.yaml').replace(/\n$/, '').split('\n');
  const close = () => setSpecOpen(false);
  useEscape(close);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('.spec-viewer__close')?.focus();
  }, []);

  return (
    <div className="scrim" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={ref} className="popup spec-viewer" role="dialog" aria-modal="true" aria-labelledby="spec-title">
        <header className="spec-viewer__header">
          <Icon name="files" size={18} />
          <div>
            <h2 id="spec-title" className="spec-viewer__file">{copy.project.spec.file}</h2>
            <p className="spec-viewer__meta">{t(copy.constellation.specViewer.meta)}</p>
          </div>
          <span className="spec-viewer__lock"><Icon name="lock" size={14} />{t(copy.constellation.specViewer.locked)}</span>
          <button type="button" className="icon-button spec-viewer__close" aria-label={t(copy.chrome.about.close)} data-tip={t(copy.chrome.about.close)} onClick={close}>
            <Icon name="close" />
          </button>
        </header>
        <div className="code-panel spec-viewer__code" tabIndex={0} aria-label={copy.project.spec.file}>
          <ol className="code-lines">
            {lines.map((line, i) => (
              <li key={i}><span className="code-lines__n" aria-hidden="true">{i + 1}</span><code>{line || ' '}</code></li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
