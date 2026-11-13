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
import { CommentCard, PRPanel, PRStatusCard, ReceiptPanel, RecapPanel } from './components/ReviewPanels';
import { SectionEditor } from './components/SectionEditor';
import { SectionsPanel, issueOpen, walkOrder } from './components/SectionsPanel';
import { LineCard } from './components/LineCard';
import { Replies } from './components/Replies';
import { SpecViewer } from './components/SpecViewer';
import { StatusPill } from './components/StatusPill';
import { TeamRail } from './components/TeamRail';
import { TitleBar } from './components/TitleBar';
import { Toast } from './components/Toast';
import { Tooltip } from './components/Tooltip';
import { copy, t } from './lib/copy';
import { useFlow, useIssueFlow, useReviewFlow } from './lib/flow';
import { computeGeometry, countOpen } from './lib/geometry';
import { ISSUE_SECTION_IDS, sectionById, topSections } from './lib/sections';
import { useFocusRescue, useIdleHints } from './lib/hints';
import { LOGGING, exportLog, log, resetLog } from './lib/log';
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
  const lineLeaveTimer = useRef<number>();
  const onLineHover = (h: LineHover | null) => {
    window.clearTimeout(lineLeaveTimer.current);
    if (h) return setLineHover((cur) => (cur?.pinned && !h.pinned && cur.line.id !== h.line.id ? cur : h));
    // Leaving the line: give the pointer a moment to reach the card.
    lineLeaveTimer.current = window.setTimeout(() => setLineHover((cur) => (cur?.pinned ? cur : null)), 250);
  };

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
  const sectionsLine = useScenario((s) => s.sectionsLine);
  const editor = useScenario((s) => s.editor);
  const sections = useScenario((s) => s.sections);
  const issues = useScenario((s) => s.issues);
  const openSections = useScenario((s) => s.openSections);
  const openSection = useScenario((s) => s.openSection);
  const closeEditor = useScenario((s) => s.closeEditor);
  const openFile = useScenario((s) => s.openFile);
  const rightPanel = useScenario((s) => s.rightPanel);
  const commentOpen = useScenario((s) => s.commentOpen);
  const setRightPanel = useScenario((s) => s.setRightPanel);
  const setCommentOpen = useScenario((s) => s.setCommentOpen);
  const collaboratorsAll = collaborators;
  useIdleHints();
  useFocusRescue();
  useFlow();
  useIssueFlow();
  useReviewFlow();

  const showToast = useCallback((message: string) => {
    log('toast', { target: message });
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS);
  }, []);
  const closeDialog = useCallback(() => setDialog(null), []);

  // Hidden reset: Ctrl/Cmd+Shift+R handled in-app so it clears pmr: state, not just reloads.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        startOver();
      }
      // Ctrl/Cmd+Shift+E: export the session log (docs/logging.md).
      if (LOGGING && (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (exportLog()) showToast(t(copy.chrome.exported));
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

  // The Code tab opens the section editor; Constellation closes it (flow-and-milestones: Code tab).
  const onTab = (tab: 'constellation' | 'code') => {
    if (tab === 'constellation') {
      if (editor) closeEditor();
      return;
    }
    if (editor) return;
    if (milestones.issueRaised) {
      const next = walkOrder(collaborators, issues).find((u) => sections[u.id]?.status !== 'verified');
      return openSection(next?.id ?? 'idempotencyKey');
    }
    if (milestones.buildStarted) return openFile('PlanController.java');
    showToast(t(copy.editor.codeTabEmpty));
  };
  useEffect(() => setActiveTab(editor ? 'code' : 'constellation'), [editor]);

  // The section editor is modal (frame 07's scrim): everything behind it leaves the tab order,
  // except the title bar, composer, replies and status pill, which frame 07 keeps live.
  useEffect(() => {
    if (!editor) return;
    const keep = '.titlebar, .composer, .replies, .toast-region, .status-pill-wrap, .scrim, .tooltip, .prompt-chip-row';
    const stage = document.querySelector('.stage');
    const hidden = [...(stage?.children ?? [])].filter((el) => !el.matches(keep)) as HTMLElement[];
    hidden.forEach((el) => el.setAttribute('inert', ''));
    return () => hidden.forEach((el) => el.removeAttribute('inert'));
  }, [editor]);

  // "Show whole team": the only camera move, and only on request; eases over 200 ms.
  const fitTeam = () => {
    const g = computeGeometry(collaborators, null);
    setFitting(true);
    setView(fitView([g.you.point, ...g.nodes.map((n) => n.point)]));
    window.setTimeout(() => setFitting(false), 220);
  };

  const sc = copy.chrome.startOverConfirm;
  const suggestion = recommendation === 'shown' || recommendation === 'dismissed';
  const tops = topSections(collaborators);
  const editorIssue = editor && sectionById(editor.section).issue && issueOpen(issues[sectionById(editor.section).issue!])
    ? { n: ISSUE_SECTION_IDS.indexOf(editor.section) + 1, total: ISSUE_SECTION_IDS.length }
    : undefined;
  const pill = statusPill(collaborators, milestones, recommendation, {
    open: countOpen(issues),
    verified: tops.filter((d) => sections[d.id]?.status === 'verified').length,
    total: tops.length,
    editorIssue,
  });
  const issueLineVisible = milestones.issueRaised && countOpen(issues) > 0;
  const tr = copy.teammateReview;
  const reviewPending = milestones.prCreated && !milestones.teammateApproved && collaboratorsAll.some((c) => c.review === 'pending');
  // Clicking the pill goes to the thing it describes.
  const onPill = (() => {
    switch (pill.target) {
      case 'add': return addMenu ? undefined : () => openAddMenu('plus');
      case 'ready': return () => document.querySelector<HTMLElement>('[data-start-build]')?.focus();
      case 'build': return () => setUpdateCardOpen(true);
      case 'suggestion': return () => setRecCardOpen(true);
      case 'sections': return () => (editor ? undefined : openSections());
      case 'receipt': return () => setRightPanel('receipt');
      case 'recap': return () => setRightPanel('recap');
      case 'comment': return () => setCommentOpen(true);
      case 'merge': return () => document.querySelector<HTMLElement>('[data-merge]')?.focus();
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
        <Constellation scale={scale} onLineHover={onLineHover} />
        <TeamRail showFit={!isIdentity(view)} onFit={fitTeam} />
        <BuildCard />
        {suggestion && recCardOpen && <RecommendationCard />}
        {sectionsLine && <SectionsPanel />}
        {rightPanel === 'receipt' && <ReceiptPanel onToast={showToast} />}
        {rightPanel === 'pr' && <PRPanel />}
        {rightPanel === 'recap' && <RecapPanel />}
        {milestones.prCreated && !milestones.merged && !rightPanel && <PRStatusCard />}
        {milestones.prCreated && !milestones.merged && commentOpen && <CommentCard />}
        {floatingFile && <FloatingEditor onToast={showToast} />}
        {lineHover && (
          <LineCard
            hover={lineHover}
            onClose={() => setLineHover(null)}
            onStay={() => window.clearTimeout(lineLeaveTimer.current)}
            onLeave={() => onLineHover(null)}
          />
        )}
        {popover && <AgentPopover />}
        {addMenu && <AddMenu />}
        {configure && <ConfigurePanel key={`${configure.id}-${configure.mode}`} />}
        <TitleBar
          activeTab={activeTab}
          onTab={onTab}
          onStartOver={() => setDialog('startOver')}
          onExport={() => exportLog() && showToast(t(copy.chrome.exported))}
          onAbout={() => setDialog('about')}
        />
        <Replies raised={pill.target === 'ready' && readyVisible} />
        <Toast message={toast} />
        <Composer />
        <Legend
          items={[
            ...(suggestion ? [{ kind: 'ring' as const, text: copy.recommendation.legend }] : []),
            ...(issueLineVisible ? [{ kind: 'issue' as const, text: copy.issueLine.legend }] : []),
            ...(reviewPending ? [{ kind: 'ring' as const, text: tr.legends[0] }, { kind: 'dashed' as const, text: tr.legends[1] }] : []),
          ]}
        />
        <StatusPill text={pill.text} tone={pill.tone} onClick={onPill} />
        {editor && <SectionEditor onToast={showToast} />}
        {specOpen && <SpecViewer />}
        <Tooltip scale={scale} />
        {dialog === 'startOver' && (
          <Dialog
            title={t(sc.title)}
            onClose={closeDialog}
            actions={
              LOGGING ? (
                <>
                  <button type="button" className="pmr-button pmr-button--secondary" onClick={closeDialog}>{t(sc.cancel)}</button>
                  <button type="button" className="pmr-button pmr-button--secondary" onClick={() => { resetLog(false); startOver(true); }}>{t(sc.clearLog)}</button>
                  <button type="button" className="pmr-button" onClick={() => { resetLog(true); startOver(true); }}>{t(sc.keepLog)}</button>
                </>
              ) : (
                <>
                  <button type="button" className="pmr-button pmr-button--secondary" onClick={closeDialog}>{t(sc.cancel)}</button>
                  <button type="button" className="pmr-button" onClick={() => startOver()}>{t(sc.confirm)}</button>
                </>
              )
            }
          >
            {LOGGING ? t(sc.bodyLogging) : t(sc.body)}
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
