import { useEffect, useRef } from 'react';
import { copy, t } from '../lib/copy';
import { useEscape } from '../lib/escape';
import { safeRange, sectionById, topSections, type SectionDef, type SectionRole } from '../lib/sections';
import { firstOf, useScenario } from '../lib/store';
import type { Collaborator, IssueState, SectionState } from '../lib/types';
import { Icon } from './Icon';

const sp = copy.sectionsPanel;

/** Ids of the orbs at each end of a section's line, for hover linking. */
export function lineIds(def: SectionDef, cs: Collaborator[]): string[] {
  return def.line.map((r) => (r === 'you' ? 'you' : firstOf(cs, r)?.id)).filter(Boolean) as string[];
}

export const issueOpen = (i?: IssueState) => !!i && i.status !== 'resolved' && i.status !== 'rejected';

/** Openable units in the order Next section walks them: open issues, then this line, then elsewhere. */
export function walkOrder(cs: Collaborator[], issues: Record<number, IssueState>): SectionDef[] {
  const units = topSections(cs).flatMap((s) => (s.children ? s.children.map(sectionById) : [s]));
  const issueUnits = units.filter((u) => u.issue && issueOpen(issues[u.issue]));
  const onLine = units.filter((u) => !issueUnits.includes(u) && u.line.includes('builder') && u.line.includes('reviewer'));
  const elsewhere = units.filter((u) => !issueUnits.includes(u) && !onLine.includes(u));
  return [...issueUnits, ...onLine, ...elsewhere];
}

/** Frame 06b: sections a line touched, with live line ranges and hover linking to the orbs. */
export function SectionsPanel() {
  const line = useScenario((s) => s.sectionsLine)!;
  const collaborators = useScenario((s) => s.collaborators);
  const sections = useScenario((s) => s.sections);
  const issues = useScenario((s) => s.issues);
  const files = useScenario((s) => s.files);
  const drafts = useScenario((s) => s.fileDrafts);
  const editorOpen = useScenario((s) => !!s.editor);
  const closeSections = useScenario((s) => s.closeSections);
  const openSection = useScenario((s) => s.openSection);
  const verifySection = useScenario((s) => s.verifySection);
  const setLinkIds = useScenario((s) => s.setLinkIds);
  const ref = useRef<HTMLElement>(null);

  useEscape(closeSections, !editorOpen);
  useEffect(() => {
    // Hint target: the first open issue row takes focus when the panel opens.
    ref.current?.querySelector<HTMLElement>('.section-row--issue, .section-row')?.focus();
  }, []);

  const nameOf = (id: string) => (id === 'you' ? copy.people.you.displayName : collaborators.find((c) => c.id === id)?.name ?? '');
  const roleOf = (id: string): SectionRole | undefined =>
    id === 'you' ? 'you' : (collaborators.find((c) => c.id === id)?.role as SectionRole | undefined);
  const lineRoles = line.map(roleOf);

  const tops = topSections(collaborators);
  const onThisLine = (d: SectionDef) => d.line.length === lineRoles.length && d.line.every((r) => lineRoles.includes(r));
  let here = tops.filter(onThisLine);
  let elsewhere = tops.filter((d) => !onThisLine(d));
  if (here.length === 0) [here, elsewhere] = [elsewhere, []];

  const total = tops.length;
  const verified = tops.filter((d) => sections[d.id]?.status === 'verified').length;
  const openIssues = Object.values(issues).filter(issueOpen).length;
  const order = walkOrder(collaborators, issues);
  const firstIssue = order.find((u) => u.issue && issueOpen(issues[u.issue]));
  const firstOpen = firstIssue ?? order.find((u) => sections[u.id]?.status !== 'verified');

  const text = (file: string) => drafts[file] ?? files[file] ?? '';
  const rangeLabel = (d: SectionDef) => {
    if (d.id === 'generatedDtos') return `model/  ·  ${t(sp.filesNote, { n: d.files.length })}`;
    if (d.id === 'contractTests') return `${d.file}  ·  ${d.line.map((r) => nameFor(r)).join(', ')}`;
    if (d.id === 'changelog') return `${d.file}  ·  ${copy.people.you.displayName}`;
    const r = safeRange(d.id, text(d.file));
    return `${d.file}  ·  L${r.start}–${r.end}`;
  };
  const nameFor = (r: SectionRole) => (r === 'you' ? copy.people.you.displayName : firstOf(collaborators, r)?.name ?? '');

  // The quick-verify button disappears once used; keep keyboard focus on its row.
  const quickVerify = (button: HTMLElement, id: string) => {
    const row = button.previousElementSibling as HTMLElement | null;
    verifySection(id);
    requestAnimationFrame(() => row?.isConnected && row.focus());
  };

  const link = (d: SectionDef) => ({
    onPointerEnter: () => setLinkIds(lineIds(d, collaborators)),
    onPointerLeave: () => setLinkIds(null),
    onFocus: () => setLinkIds(lineIds(d, collaborators)),
    onBlur: () => setLinkIds(null),
  });

  const authorDots = (d: SectionDef, edited: boolean) => (
    <span className="author-dots" aria-hidden="true">
      {[...new Set([...d.line, ...(edited ? (['you'] as SectionRole[]) : [])])].map((r) => (
        <span key={r} className={`author-dot author-dot--${r}`} />
      ))}
    </span>
  );

  const rowFor = (d: SectionDef) => {
    const st = sections[d.id] as SectionState;
    if (d.children) {
      const kids = d.children.map(sectionById);
      const kidIssues = kids.filter((k) => k.issue && issueOpen(issues[k.issue])).length;
      const open = kids.find((k) => k.issue && issueOpen(issues[k.issue!])) ?? kids.find((k) => sections[k.id]?.status !== 'verified') ?? kids[0];
      return (
        <li key={d.id} className="section-group">
          <button type="button" className={`section-row${kidIssues ? ' section-row--issue' : ''}`} onClick={() => openSection(open.id)} {...link(d)}>
            <StatusIcon status={st.status} count={kidIssues} />
            <span className="section-row__text">
              <span className={`section-row__name${d.mono ? ' is-mono' : ''}`}>{d.label}</span>
              <span className="section-row__sub">{rangeLabel(d)}{authorDots(d, st.editedByYou)}</span>
            </span>
            {kidIssues > 0 ? (
              <span className="issue-pill">{kidIssues === 1 ? t(sp.issuePillOne) : t(sp.issuePill, { n: kidIssues })}</span>
            ) : st.status === 'verified' ? (
              <span className="verified-tag">{sp.statusLabels.verified}</span>
            ) : null}
          </button>
          <ul className="subsections">
            {kids.map((k) => {
              const ks = sections[k.id];
              const issue = k.issue ? issues[k.issue] : undefined;
              const isOpen = issueOpen(issue);
              const tag = ks.status === 'verified'
                ? sp.statusLabels.verified
                : issue?.status === 'rejected' ? t(sp.rejectedTag)
                  : issue?.status === 'resolved' ? t(sp.resolvedTag)
                    : k.tag;
              return (
                <li key={k.id} className="subsection-wrap">
                  <button type="button" className={`subsection-row${isOpen ? ' is-issue' : ''}`} onClick={() => openSection(k.id)} {...link(k)}>
                    <span className={`sub-status${isOpen ? ' is-issue' : ks.status === 'verified' ? ' is-verified' : ''}`} aria-hidden="true" />
                    <span className="subsection-row__name">{k.label}</span>
                    <span className={`subsection-row__tag${isOpen ? ' is-issue' : ks.status === 'verified' ? ' is-verified' : ''}`}>{tag}</span>
                    <Icon name="chevron-right" className="row-chevron" />
                  </button>
                  {!isOpen && ks.status !== 'verified' && (
                    <button type="button" className="quick-verify" onClick={(e) => quickVerify(e.currentTarget, k.id)} aria-label={`${t(sp.quickVerify)} ${k.label}`}>
                      {t(sp.quickVerify)}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </li>
      );
    }
    return (
      <li key={d.id} className="section-wrap">
        <button type="button" className="section-row" onClick={() => openSection(d.id)} {...link(d)}>
          <StatusIcon status={st.status} count={0} />
          <span className="section-row__text">
            <span className={`section-row__name${d.mono ? ' is-mono' : ''}`}>{d.label}</span>
            <span className="section-row__sub">{rangeLabel(d)}{authorDots(d, st.editedByYou)}</span>
          </span>
          {st.status === 'verified' ? <span className="verified-tag">{sp.statusLabels.verified}</span> : <Icon name="chevron-right" className="row-chevron" />}
        </button>
        {st.status !== 'verified' && (
          // Quick verify: no need to open every non-issue section.
          <button type="button" className="quick-verify" onClick={(e) => quickVerify(e.currentTarget, d.id)} aria-label={`${t(sp.quickVerify)} ${d.label}`}>
            {t(sp.quickVerify)}
          </button>
        )}
      </li>
    );
  };

  return (
    <aside ref={ref} className="pmr-glass sections-panel" aria-labelledby="sections-title">
      <header className="sections-panel__header">
        <h2 id="sections-title" className="sections-panel__title">
          <span>{nameOf(line[0])}</span>
          <Icon name="arrow-both" />
          <span>{nameOf(line[1])}</span>
        </h2>
        <p className="sections-panel__subtitle">{t(sp.subtitle, { issueCount: openIssues })}</p>
        <button type="button" className="icon-button sections-panel__close" aria-label={t(sp.close)} data-tip={t(sp.close)} onClick={closeSections}>
          <Icon name="close" />
        </button>
      </header>
      <div className="sections-panel__progress">
        <div className="sections-panel__progress-text">
          <span>{t(sp.progress, { verified, total })}</span>
          <span className="sections-panel__against">{sp.progressRight}</span>
        </div>
        <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={verified} aria-label={t(sp.progress, { verified, total })}>
          <div className="progress-fill" style={{ width: `${(verified / total) * 100}%` }} />
        </div>
      </div>
      <div className="sections-panel__body">
        <p className="pmr-label sections-panel__group">{sp.groupOnLine}</p>
        <ul className="section-list">{here.map(rowFor)}</ul>
        {elsewhere.length > 0 && (
          <>
            <p className="pmr-label sections-panel__group">{sp.groupElsewhere}</p>
            <ul className="section-list">{elsewhere.map(rowFor)}</ul>
          </>
        )}
      </div>
      <footer className="sections-panel__footer">
        {firstOpen ? (
          <button type="button" className="pmr-button sections-panel__primary" data-open-first onClick={() => openSection(firstOpen.id)}>
            {t(sp.primary, { firstIssueSection: firstOpen.label })}
          </button>
        ) : (
          <button type="button" className="pmr-button pmr-button--secondary sections-panel__primary" onClick={closeSections}>
            {t(sp.primaryAllVerified)}
          </button>
        )}
      </footer>
    </aside>
  );
}

function StatusIcon({ status, count }: { status: SectionState['status']; count: number }) {
  if (count > 0) return <span className="status-icon status-icon--issue" aria-hidden="true">{count}</span>;
  if (status === 'verified') return <span className="status-icon status-icon--verified" aria-hidden="true"><Icon name="check" size={12} /></span>;
  return <span className="status-icon status-icon--open" aria-hidden="true" />;
}

