import { Fragment, useEffect, useMemo, useRef } from 'react';
import { sectionExtensions, type LineInfo } from '../lib/cmSection';
import { copy, t } from '../lib/copy';
import { useEscape } from '../lib/escape';
import { scheduleRecheck } from '../lib/flow';
import {
  ISSUE_SECTION_IDS, applyFix, changedLines, diffLines, issueById, originalFile, safeRange, sectionById, specLines, type SectionRole,
} from '../lib/sections';
import { firstOf, useScenario } from '../lib/store';
import type { Collaborator } from '../lib/types';
import { CodeEditor } from './CodeEditor';
import { Icon } from './Icon';
import { Orb } from './Orb';
import { issueOpen, lineIds, walkOrder } from './SectionsPanel';

const ed = copy.editor;
const SPEC = 'recurring-investments.yaml';
const CODE_SIZE = { font: 13, line: 23 };

/** "{builder} ↔ {reviewer}" with the Codicon instead of the glyph (scenario.json $description). */
function WithLinkIcon({ text }: { text: string }) {
  const parts = text.split('↔');
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <Icon name="arrow-both" size={14} label="and" />}
          {p}
        </Fragment>
      ))}
    </>
  );
}

/** Frame 07: just one section's code, with the agents' positions beside it. */
export function SectionEditor({ onToast }: { onToast: (message: string) => void }) {
  const editor = useScenario((s) => s.editor)!;
  const collaborators = useScenario((s) => s.collaborators);
  const sections = useScenario((s) => s.sections);
  const issues = useScenario((s) => s.issues);
  const files = useScenario((s) => s.files);
  const drafts = useScenario((s) => s.fileDrafts);
  const cardNotes = useScenario((s) => s.cardNotes);
  const st = useScenario.getState;
  const closeEditor = useScenario((s) => s.closeEditor);
  const openSection = useScenario((s) => s.openSection);
  const setEditorMode = useScenario((s) => s.setEditorMode);
  const setEditorTab = useScenario((s) => s.setEditorTab);
  const setFileDraft = useScenario((s) => s.setFileDraft);
  const verifySection = useScenario((s) => s.verifySection);
  const acceptFix = useScenario((s) => s.acceptFix);
  const rejectIssue = useScenario((s) => s.rejectIssue);
  const setCardNote = useScenario((s) => s.setCardNote);
  const ref = useRef<HTMLDivElement>(null);

  const def = sectionById(editor.section);
  const builder = firstOf(collaborators, 'builder');
  const reviewer = firstOf(collaborators, 'reviewer');
  const names = { builder: builder?.name ?? copy.roles.builder.defaultName, reviewer: reviewer?.name ?? copy.roles.reviewer.defaultName };
  const issue = def.issue ? issues[def.issue] : undefined;
  const issueData = def.issue ? issueById(def.issue) : undefined;
  const open = issueOpen(issue);
  const verified = sections[def.id]?.status === 'verified';
  const canVerify = !verified && (!def.issue || !open);
  const tab = editor.tab;
  // "Show line" from the teammate's comment opens the merged-ready code read-only.
  const isSpec = tab === SPEC;
  const locked = isSpec || !!editor.readOnly;
  const saved = files[tab] ?? '';
  const current = drafts[tab] ?? saved;
  const dirty = !isSpec && drafts[tab] !== undefined && drafts[tab] !== saved;
  const original = useMemo(() => originalFile(tab, builder?.name ?? 'Builder'), [tab, builder?.name]);
  const fixCount = Object.values(issues).filter((i) => i.how === 'accepted').length;

  // Esc closes the topmost layer: the diff or reject confirm first, then the editor.
  useEscape(() => (editor.mode !== 'edit' ? setEditorMode('edit') : close()));
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('.cm-content, .diff-preview button')?.focus();
  }, [def.id]);
  useEffect(() => {
    if (editor.mode === 'reject') ref.current?.querySelector<HTMLElement>('[data-reject-cancel]')?.focus();
    if (editor.mode === 'diff') ref.current?.querySelector<HTMLElement>('[data-diff-apply]')?.focus();
  }, [editor.mode]);

  function close() {
    closeEditor();
    document.querySelector<HTMLElement>('.sections-panel .section-row')?.focus();
  }

  const save = () => {
    if (isSpec) return;
    const waiting = st().saveSectionFile(tab);
    if (waiting.length) {
      onToast(t(ed.afterSaveToast, names));
      scheduleRecheck(waiting);
    } else {
      onToast(t(ed.savedToast));
    }
  };

  // ---- Prev / next and Next section ------------------------------------------------
  const order = walkOrder(collaborators, issues);
  const anyOpenIssue = ISSUE_SECTION_IDS.some((id) => issueOpen(issues[sectionById(id).issue!]));
  const arrowList = anyOpenIssue ? ISSUE_SECTION_IDS : order.map((u) => u.id);
  const go = (delta: number) => {
    const i = arrowList.indexOf(def.id);
    const next = arrowList[(i + delta + arrowList.length) % arrowList.length] ?? arrowList[0];
    if (next) openSection(next);
  };
  const nextSection = () => {
    const next = order.find((u) => u.id !== def.id && sections[u.id]?.status !== 'verified');
    if (next) openSection(next.id);
    else {
      close();
      onToast(t(ed.allVerifiedToast));
    }
  };

  // ---- Code decorations --------------------------------------------------------------
  const ext = useMemo(() => {
    if (isSpec) return null;
    const annotate = (text: string) => {
      const map = new Map<number, LineInfo>();
      const lines = text.split('\n');
      const r = def.files.length > 1 || ['contractTests', 'changelog'].includes(def.id)
        ? { start: 1, end: lines.length - (lines[lines.length - 1] === '' ? 1 : 0) }
        : safeRange(def.id, text);
      const mine = changedLines(original, text);
      const unsaved = changedLines(saved, text);
      const yoursAlways = def.wrote.includes('you');
      for (let n = r.start; n <= r.end; n++) {
        map.set(n, { inSection: true, author: yoursAlways || mine.has(n) ? 'you' : 'builder' });
      }
      map.set(r.start, { ...map.get(r.start), marker: t(ed.sectionMarker, { SECTION: def.label.toUpperCase(), start: r.start, end: r.end }) });
      // Flagged rows and notes for this section's open issue.
      if (issueData && open) {
        const scope = safeRange('createPlan', text);
        for (let n = scope.start; n <= scope.end; n++) {
          const line = lines[n - 1] ?? '';
          if (issueData.flaggedLines.some((f) => line.includes(f.trim()))) map.set(n, { ...map.get(n), issue: true });
          for (const [key, note] of Object.entries((issueData as { lineNotes?: Record<string, string> }).lineNotes ?? {})) {
            if (line.includes(key)) map.set(n, { ...map.get(n), note: t(note, names), noteKind: note.startsWith('{reviewer}') ? 'issue' : 'plain' });
          }
        }
      }
      const firstUnsaved = [...unsaved].sort((a, b) => a - b)[0];
      if (firstUnsaved) map.set(firstUnsaved, { ...map.get(firstUnsaved), note: t(ed.yourLineNote), noteKind: 'you' });
      return map;
    };
    return sectionExtensions(annotate);
    // Recompute when the section, its issue state, the saved text or the names change.
  }, [isSpec, def.id, open, saved, original, names.builder, names.reviewer]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollLine = isSpec
    ? (issueData?.specExcerpt.lines[0] ?? def.specLines?.[0] ?? 1)
    : def.files.length > 1 ? 1 : safeRange(def.id, current).start;

  // ---- Header --------------------------------------------------------------------------
  const nIssue = def.issue ? ISSUE_SECTION_IDS.indexOf(def.id) + 1 : 0;
  const lineNames = lineIds(def, collaborators).map((id) => (id === 'you' ? copy.people.you.displayName : collaborators.find((c) => c.id === id)?.name ?? ''));
  const crumb = def.issue
    ? t(ed.breadcrumb, { ...names, section: def.label, n: nIssue, total: ISSUE_SECTION_IDS.length })
    : [lineNames.join(' ↔ '), def.parent ? sectionById(def.parent).label : null, def.label].filter(Boolean).join('  ·  ');
  const writtenBy = changedLines(original, current).size > 0 ? t(ed.meta, names) : t(ed.meta, names).split('·')[0].trim();
  const tabs = [...def.files, SPEC];

  const help = verified
    ? t(ed.verifyHelpVerified)
    : !def.issue ? t(ed.verifyHelpOpen)
      : issue?.status === 'savedAwaitingAgents' ? t(ed.rechecking)
        : open ? ed.verifyHelpLocked
          : issue?.status === 'rejected' ? t(ed.afterResolve.reviewerRejected)
            : t(ed.agentsAgree, names);

  return (
    <div className="scrim scrim--editor">
      <div ref={ref} className="popup section-editor" role="dialog" aria-modal="true" aria-labelledby="section-editor-title">
        <header className="section-editor__top">
          {def.issue && open && <span className="issue-dot" aria-hidden="true" />}
          <h2 id="section-editor-title" className="section-editor__title">{issueData && open ? issueData.title : def.label}</h2>
          <span className="section-editor__sep" aria-hidden="true">·</span>
          <p className="section-editor__crumb"><WithLinkIcon text={crumb} /></p>
          <div className="section-editor__nav">
            <button type="button" className="pmr-glass nav-button" aria-label={t(ed.prev)} title={t(ed.prev)} onClick={() => go(-1)}>
              <Icon name="arrow-left" />
            </button>
            <button type="button" className="pmr-glass nav-button" aria-label={t(ed.nextIssue)} title={t(ed.nextIssue)} onClick={() => go(1)}>
              <Icon name="arrow-right" />
            </button>
            <button type="button" className="icon-button" aria-label={t(ed.close)} title={t(ed.close)} onClick={close}>
              <Icon name="close" />
            </button>
          </div>
        </header>

        <div className="section-editor__left">
          {issueData ? (
            <>
              <AgentCard role="builder" label={t(ed.builderSays, names)} text={issueData.builderSays} note={cardNotes.builder} />
              <SpecCard from={issueData.specExcerpt.lines[0]} to={issueData.specExcerpt.lines[1]} highlight={2} />
              <AgentCard
                role="reviewer"
                label={t(ed.reviewerSays, names)}
                text={issueData.reviewerSays}
                note={issue?.status === 'savedAwaitingAgents' ? t(ed.rechecking) : cardNotes.reviewer ?? issue?.note}
              />
            </>
          ) : (
            <>
              <AboutCard sectionId={def.id} cs={collaborators} />
              {def.specLines && <SpecCard from={def.specLines[0]} to={def.specLines[1]} highlight={0} />}
            </>
          )}

          <div className="section-editor__actions">
            <p className="pmr-label">{ed.thisSection}</p>
            <div className="section-editor__row">
              <button
                type="button"
                className={`pmr-button${canVerify ? '' : ' pmr-button--locked'}${verified ? ' is-verified' : ''}`}
                aria-disabled={!canVerify}
                data-verify
                onClick={() => canVerify && verifySection(def.id)}
              >
                {verified ? <Icon name="check" size={14} /> : !canVerify && <Icon name="lock" size={14} />}
                {verified ? t(ed.verified) : ed.verify}
              </button>
              <button type="button" className="pmr-button pmr-button--secondary" onClick={nextSection}>{ed.next}</button>
            </div>
            <p className="section-editor__help" aria-live="polite">{help}</p>

            {def.issue && open && editor.mode !== 'reject' && (
              <>
                <p className="pmr-label section-editor__resolve-label">{ed.resolveWithout}</p>
                <div className="section-editor__row section-editor__row--tight">
                  <button type="button" className="pmr-button pmr-button--secondary" data-accept onClick={() => setEditorMode('diff')}>
                    {t(ed.accept, names)}
                  </button>
                  <button type="button" className="pmr-button pmr-button--secondary" onClick={() => setEditorMode('reject')}>{ed.reject}</button>
                </div>
              </>
            )}
            {def.issue && open && editor.mode === 'reject' && (
              <div className="reject-confirm" role="alertdialog" aria-labelledby="reject-text">
                <p id="reject-text" className="reject-confirm__text">{t(ed.rejectConfirm, names)}</p>
                <div className="section-editor__row section-editor__row--tight">
                  <button
                    type="button"
                    className="pmr-button pmr-button--secondary"
                    onClick={() => {
                      rejectIssue(def.issue!);
                      setCardNote('builder', t(ed.afterResolve.builderRejected));
                      setCardNote('reviewer', t(ed.afterResolve.reviewerRejected));
                    }}
                  >
                    {t(ed.rejectConfirmAction)}
                  </button>
                  <button type="button" className="pmr-button pmr-button--secondary" data-reject-cancel onClick={() => setEditorMode('edit')}>{t(ed.cancel)}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="code-panel section-editor__code" aria-label={tab}>
          <div className="code-panel__header">
            <div className="file-tabs" role="tablist">
              {tabs.map((f) => (
                <button key={f} type="button" role="tab" aria-selected={f === tab} className={`file-tab${f === tab ? ' is-active' : ''}`} onClick={() => setEditorTab(f)}>
                  {f}
                </button>
              ))}
            </div>
            <span className="code-panel__meta">{locked ? t(ed.readOnly) : writtenBy}</span>
            {dirty && (
              <span className="unsaved">
                <span className="unsaved__dot" aria-hidden="true" />
                {ed.unsaved}
              </span>
            )}
            {!locked && <button type="button" className="pmr-button code-panel__save" onClick={save}>{ed.save}</button>}
          </div>
          <div className="code-panel__body">
            {editor.mode === 'diff' && issueData ? (
              <DiffPreview
                before={current}
                after={applyFix(issueData.id, current)}
                title={t(ed.diffTitle, names)}
                onApply={() => {
                  acceptFix(issueData.id);
                  setCardNote('builder', t(ed.afterResolve.builder));
                  setCardNote('reviewer', t(ed.afterResolve.reviewer));
                }}
                onCancel={() => setEditorMode('edit')}
              />
            ) : (
              <CodeEditor
                key={`${tab}:${fixCount}`}
                file={tab}
                doc={isSpec ? specText() : current}
                readOnly={locked}
                size={CODE_SIZE}
                label={tab}
                extensions={ext?.main}
                gutterBefore={ext?.before}
                gutterAfter={ext?.after}
                scrollToLine={scrollLine}
                onChange={(text) => {
                  setFileDraft(tab, text);
                  useScenario.setState((s) => ({ milestones: { ...s.milestones, sectionEdited: true } }));
                }}
                onSave={save}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const specText = () => specLines(1, 999).map((l) => l.text).join('\n');

function AgentCard({ role, label, text, note }: { role: 'builder' | 'reviewer'; label: string; text: string; note?: string }) {
  return (
    <div className={`pmr-glass agent-card agent-card--${role}`}>
      <p className="agent-card__label"><Orb role={role} size={18} /><span className="pmr-label">{label}</span></p>
      <p className="agent-card__text">{text}</p>
      {note && <p className="agent-card__note" aria-live="polite">{note}</p>}
    </div>
  );
}

function SpecCard({ from, to, highlight }: { from: number; to: number; highlight: number }) {
  const rows = specLines(from, to);
  return (
    <div className="pmr-glass spec-excerpt">
      <p className="agent-card__label"><Icon name="files" size={14} /><span className="pmr-label">{t(ed.theSpec)}</span></p>
      <p className="spec-excerpt__file">{`${SPEC}  ·  L${from}–${to}`}</p>
      <ol className="spec-excerpt__lines">
        {rows.map((r, i) => (
          <li key={r.n} className={i >= rows.length - highlight ? 'is-highlight' : undefined}>
            <span className="spec-excerpt__n" aria-hidden="true">{r.n}</span>
            <code>{r.text.trimStart()}</code>
          </li>
        ))}
      </ol>
    </div>
  );
}

function AboutCard({ sectionId, cs }: { sectionId: string; cs: Collaborator[] }) {
  const def = sectionById(sectionId);
  const edited = useScenario((s) => s.sections[sectionId]?.editedByYou);
  const name = (r: string) => (r === 'you' ? copy.people.you.displayName : firstOf(cs, r as Exclude<SectionRole, 'you'>)?.name);
  const wrote = [...def.wrote.map(name), ...(edited && !def.wrote.includes('you') ? [copy.people.you.displayName] : [])].filter(Boolean).join(' + ');
  const other = (v: string) => (['builder', 'reviewer', 'tester', 'you'].includes(v) ? name(v) ?? '—' : v);
  return (
    <div className="pmr-glass agent-card">
      <p className="agent-card__label"><Icon name="info" size={14} /><span className="pmr-label">{t(ed.aboutSection)}</span></p>
      {def.summary && <p className="agent-card__text">{def.summary}</p>}
      <dl className="about-facts">
        <dt>{t(ed.aboutWrote)}</dt><dd>{wrote}</dd>
        <dt>{t(ed.aboutReviewed)}</dt><dd>{other(def.reviewed)}</dd>
        <dt>{t(ed.aboutTested)}</dt><dd>{other(def.tested)}</dd>
      </dl>
    </div>
  );
}

/** Inline preview of the reviewer's fix: added rows mint, removed rows red, three lines of context. */
function DiffPreview({ before, after, title, onApply, onCancel }: { before: string; after: string; title: string; onApply: () => void; onCancel: () => void }) {
  const rows = diffLines(before, after);
  const keep = new Set<number>();
  rows.forEach((r, i) => {
    if (r.kind !== 'same') for (let k = Math.max(0, i - 3); k <= Math.min(rows.length - 1, i + 3); k++) keep.add(k);
  });
  let lastShown = -1;
  return (
    <div className="diff-preview">
      <div className="diff-preview__head">
        <p className="diff-preview__title">{title}</p>
        <p className="diff-preview__meta">{t(ed.diffMeta)}</p>
      </div>
      <ol className="diff-preview__rows">
        {rows.map((r, i) => {
          if (!keep.has(i)) return null;
          const gap = lastShown >= 0 && i - lastShown > 1;
          lastShown = i;
          return (
            <Fragment key={i}>
              {gap && <li className="diff-row diff-row--gap" aria-hidden="true" />}
              <li className={`diff-row diff-row--${r.kind}`}>
                <span className="diff-row__n" aria-hidden="true">{r.kind === 'del' ? '' : r.newLine}</span>
                {r.kind !== 'same' && <span className="sr-only">{r.kind === 'add' ? t(ed.diffAdded) : t(ed.diffRemoved)}</span>}
                <code>{r.text || ' '}</code>
              </li>
            </Fragment>
          );
        })}
      </ol>
      <div className="diff-preview__actions">
        <button type="button" className="pmr-button" data-diff-apply onClick={onApply}>{t(ed.diffApply)}</button>
        <button type="button" className="pmr-button pmr-button--secondary" onClick={onCancel}>{t(ed.cancel)}</button>
      </div>
    </div>
  );
}
