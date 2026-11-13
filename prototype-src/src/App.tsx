import { useCallback, useEffect, useRef, useState } from 'react';
import { AddMenu } from './components/AddMenu';
import { AgentPopover } from './components/AgentPopover';
import { BuildCard, Legend, RecommendationCard } from './components/BuildCards';
import { Canvas } from './components/Canvas';
import { ConfigurePanel } from './components/ConfigurePanel';
import { Constellation, type LineHover } from './components/Constellation';
import { Composer } from './components/Composer';
import { Dialog } from './components/Dialog';
import { FloatingEditor } from './components/FloatingEditor';
import { LineCard } from './components/LineCard';
import { Replies } from './components/Replies';
import { SpecViewer } from './components/SpecViewer';
import { StatusPill } from './components/StatusPill';
import { TeamRail } from './components/TeamRail';
import { TitleBar } from './components/TitleBar';
import { Toast } from './components/Toast';
import { copy, t } from './lib/copy';
import { useFlow } from './lib/flow';
import { computeGeometry } from './lib/geometry';
import { startOver } from './lib/reset';
import { statusPill } from './lib/status';
import { useScenario } from './lib/store';
import { STAGE_H, STAGE_W, useStageScale } from './lib/useStageScale';
import { fitView, isIdentity } from './lib/useView';

const TOAST_MS = 3000;

export function App() {
  const scale = useStageScale();
  const [activeTab, setActiveTab] = useState<'constellation' | 'code'>('constellation');
  const [dialog, setDialog] = useState<'startOver' | 'about' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [lineHover, setLineHover] = useState<LineHover | null>(null);
  const [fitting, setFitting] = useState(false);
  const toastTimer = useRef<number>();

  const collaborators = useScenario((s) => s.collaborators);
  const addMenu = useScenario((s) => s.addMenu);
  const configure = useScenario((s) => s.configure);
  const popover = useScenario((s) => s.popover);
  const specOpen = useScenario((s) => s.specOpen);
  const view = useScenario((s) => s.view);
  const setView = useScenario((s) => s.setView);
  const openAddMenu = useScenario((s) => s.openAddMenu);
  const milestones = useScenario((s) => s.milestones);
  const recommendation = useScenario((s) => s.recommendation);
  const recCardOpen = useScenario((s) => s.recCardOpen);
  const floatingFile = useScenario((s) => s.floatingFile);
  const readyVisible = useScenario((s) => s.readyVisible);
  const setRecCardOpen = useScenario((s) => s.setRecCardOpen);
  const setUpdateCardOpen = useScenario((s) => s.setUpdateCardOpen);
  useFlow();

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

  // A line card for a line that no longer exists (agent removed) closes itself.
  useEffect(() => {
    if (!lineHover) return;
    const ids = new Set(['you', ...collaborators.map((c) => c.id)]);
    if (!ids.has(lineHover.line.a) || !ids.has(lineHover.line.b)) setLineHover(null);
  }, [collaborators, lineHover]);

  const onTab = (tab: 'constellation' | 'code') => {
    // The Code tab opens the section editor from phase 3 on.
    if (tab === 'code') return notInPrototype();
    setActiveTab(tab);
  };

  // "Show whole team": the only camera move, and only on request; eases over 200 ms.
  const fitTeam = () => {
    const g = computeGeometry(collaborators, null);
    setFitting(true);
    setView(fitView([g.you.point, ...g.nodes.map((n) => n.point)]));
    window.setTimeout(() => setFitting(false), 220);
  };

  const sc = copy.chrome.startOverConfirm;
  const suggestion = recommendation === 'shown' || recommendation === 'dismissed';
  const pill = statusPill(collaborators, milestones, recommendation);
  // Clicking the pill goes to the thing it describes.
  const onPill = (() => {
    switch (pill.target) {
      case 'add': return addMenu ? undefined : () => openAddMenu('plus');
      case 'ready': return () => document.querySelector<HTMLElement>('[data-start-build]')?.focus();
      case 'build': return () => setUpdateCardOpen(true);
      case 'suggestion': return () => setRecCardOpen(true);
      default: return undefined;
    }
  })();

  return (
    <div className="viewport">
      <div
        className={`stage${fitting ? ' is-fitting' : ''}`}
        style={{ width: STAGE_W, height: STAGE_H, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <Canvas />
        <Constellation scale={scale} onLineHover={(h) => setLineHover((cur) => (cur?.pinned && !h ? cur : h))} />
        <TeamRail showFit={!isIdentity(view)} onFit={fitTeam} />
        <BuildCard />
        {suggestion && recCardOpen && <RecommendationCard />}
        {floatingFile && <FloatingEditor onToast={showToast} />}
        {lineHover && <LineCard hover={lineHover} onClose={() => setLineHover(null)} />}
        {popover && <AgentPopover />}
        {addMenu && <AddMenu />}
        {configure && <ConfigurePanel key={`${configure.id}-${configure.mode}`} />}
        <TitleBar
          activeTab={activeTab}
          onTab={onTab}
          onStartOver={() => setDialog('startOver')}
          onAbout={() => setDialog('about')}
        />
        <Replies raised={pill.target === 'ready' && readyVisible} />
        <Toast message={toast} />
        <Composer />
        <Legend items={suggestion ? [{ kind: 'ring', text: copy.recommendation.legend }] : []} />
        <StatusPill text={pill.text} tone={pill.tone} onClick={onPill} />
        {specOpen && <SpecViewer />}
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
