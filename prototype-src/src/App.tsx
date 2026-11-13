import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from './components/Canvas';
import { Composer } from './components/Composer';
import { Dialog } from './components/Dialog';
import { StatusPill } from './components/StatusPill';
import { TitleBar } from './components/TitleBar';
import { Toast } from './components/Toast';
import { copy, t } from './lib/copy';
import { startOver } from './lib/reset';
import { STAGE_H, STAGE_W, useStageScale } from './lib/useStageScale';

const TOAST_MS = 3000;

export function App() {
  const scale = useStageScale();
  const [activeTab, setActiveTab] = useState<'constellation' | 'code'>('constellation');
  const [dialog, setDialog] = useState<'startOver' | 'about' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS);
  }, []);
  const notInPrototype = () => showToast(t(copy.chrome.notInPrototypeToast));
  const closeDialog = useCallback(() => setDialog(null), []);

  // Hidden reset: Ctrl/Cmd+Shift+R handled in-app so it clears pmr: state, not just reloads.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        startOver();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onTab = (tab: 'constellation' | 'code') => {
    // The Code tab opens the section editor from phase 3 on.
    if (tab === 'code') return notInPrototype();
    setActiveTab(tab);
  };

  const sc = copy.chrome.startOverConfirm;

  return (
    <div className="viewport">
      <div
        className="stage"
        style={{ width: STAGE_W, height: STAGE_H, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <Canvas />
        <TitleBar
          activeTab={activeTab}
          onTab={onTab}
          onStartOver={() => setDialog('startOver')}
          onAbout={() => setDialog('about')}
        />
        <main className="world" aria-label="Constellation" />
        <Toast message={toast} />
        <Composer onAddNode={notInPrototype} onSend={notInPrototype} />
        <StatusPill text={copy.emptyState.statusPill} />
        {dialog === 'startOver' && (
          <Dialog
            title={t(sc.title)}
            onClose={closeDialog}
            actions={
              <>
                <button type="button" className="pmr-button pmr-button--secondary" onClick={closeDialog}>{t(sc.cancel)}</button>
                <button type="button" className="pmr-button" onClick={startOver}>{t(sc.confirm)}</button>
              </>
            }
          >
            {t(sc.body)}
          </Dialog>
        )}
        {dialog === 'about' && (
          <Dialog
            title={t(copy.chrome.about.title)}
            onClose={closeDialog}
            actions={<button type="button" className="pmr-button" onClick={closeDialog}>{t(copy.chrome.about.close)}</button>}
          >
            {t(copy.chrome.about.body)}
          </Dialog>
        )}
      </div>
    </div>
  );
}
