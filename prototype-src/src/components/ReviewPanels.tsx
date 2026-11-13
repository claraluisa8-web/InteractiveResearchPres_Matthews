import { FormEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { copy, t } from '../lib/copy';
import { useEscape } from '../lib/escape';
import { toScreen, useGeometry } from '../lib/geometry';
import { caughtPerLine, footnote, receiptRows, receiptText } from '../lib/receipt';
import { topSections } from '../lib/sections';
import { log } from '../lib/log';
import { usePopupFocus } from '../lib/usePopupFocus';
import { initials } from '../lib/status';
import type { ThreadMessage } from '../lib/types';
import { useScenario } from '../lib/store';
import { Icon } from './Icon';

const ac = copy.allClear;
const pr = copy.pullRequest;
const tr = copy.teammateReview;
const rc = copy.recap;

/** Frame 08: the verification receipt. After the merge it opens again from the recap, read-only. */
export function ReceiptPanel({ onToast }: { onToast: (message: string) => void }) {
  const collaborators = useScenario((s) => s.collaborators);
  const sections = useScenario((s) => s.sections);
  const issues = useScenario((s) => s.issues);
  const merged = useScenario((s) => s.milestones.merged);
  const prCreated = useScenario((s) => s.milestones.prCreated);
  const setRightPanel = useScenario((s) => s.setRightPanel);
  const openPR = useScenario((s) => s.openPR);
  const rows = receiptRows(collaborators, sections, issues);
  const close = () => setRightPanel(merged ? 'recap' : null);
  useEscape(close);

  const copyReceipt = async () => {
    const text = receiptText(collaborators, sections, issues);
    try {
      await navigator.clipboard.writeText(text);
      return onToast(t(ac.copied));
    } catch {
      // Older Safari and unfocused frames refuse the async API; the selection route still works there.
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    onToast(t(ok ? ac.copied : ac.copyFailed));
  };

  return (
    <aside className="pmr-glass right-panel receipt" aria-labelledby="receipt-title">
      <header className="right-panel__header">
        <div>
          <h2 id="receipt-title" className="right-panel__title">{merged ? t(rc.receiptTitleMerged) : ac.receiptTitle}</h2>
          <p className="right-panel__meta">{t(ac.receiptMeta, { total: rows.length })}</p>
        </div>
        <button type="button" className="icon-button" aria-label={t(ac.close)} data-tip={t(ac.close)} onClick={close}>
          <Icon name="close" />
        </button>
      </header>
      <div className="receipt__bar" aria-hidden="true" />
      <table className="receipt__table">
        <colgroup>
          <col style={{ width: 124 }} />
          <col style={{ width: 88 }} />
          <col style={{ width: 84 }} />
          <col />
        </colgroup>
        <thead>
          <tr>{ac.columns.map((c) => <th key={c} scope="col" className="pmr-label">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row" className={r.mono ? 'is-mono' : undefined}>{r.section}</th>
              <td>{r.wrote}</td>
              <td className={r.reviewed === t(ac.rejectedByYou) ? 'is-rejected' : undefined}>{r.reviewed}</td>
              <td>{r.tested}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="receipt__footnote">{footnote(collaborators, sections)}</p>
      <div className="right-panel__actions">
        {!prCreated && <button type="button" className="pmr-button right-panel__primary" data-open-pr onClick={openPR}>{ac.primary}</button>}
        <button type="button" className="pmr-button pmr-button--secondary" onClick={copyReceipt}>{ac.secondary}</button>
      </div>
    </aside>
  );
}

/** Frame 09: the pull request, drafted from the receipt. Every field is real and editable. */
export function PRPanel() {
  const collaborators = useScenario((s) => s.collaborators);
  const form = useScenario((s) => s.pr);
  const setPR = useScenario((s) => s.setPR);
  const closePR = useScenario((s) => s.closePR);
  const createPR = useScenario((s) => s.createPR);
  const addReviewer = useScenario((s) => s.addReviewer);
  const ref = useRef<HTMLFormElement>(null);
  const [warn, setWarn] = useState(false);
  useEscape(closePR);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('input')?.focus();
  }, []);
  const mates = collaborators.filter((c) => c.role === 'teammate' && c.status === 'active');
  // Nobody is picked for the person (feedback round 3).
  const reviewer = mates.find((c) => c.id === form.reviewer);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!reviewer) {
      log('click', { target: 'createPR', noReviewer: true });
      setWarn(true);
      return;
    }
    log('input', { field: 'prTitle', text: form.title });
    createPR();
  };

  return (
    <form ref={ref} className="pmr-glass right-panel pr-panel" aria-labelledby="pr-title" onSubmit={submit}>
      <header className="right-panel__header">
        <div>
          <h2 id="pr-title" className="right-panel__title">{pr.title}</h2>
          <p className="pr-panel__branches">
            <Icon name="git-branch" size={14} />
            <span className="is-mono">{pr.branches[0]}</span>
            <Icon name="arrow-right" size={14} label="into" />
            <span className="is-mono">{pr.branches[1]}</span>
          </p>
        </div>
        <button type="button" className="icon-button" aria-label={t(pr.close)} data-tip={t(pr.close)} onClick={closePR}>
          <Icon name="close" />
        </button>
      </header>
      <label className="field">
        <span className="pmr-label field__label">{pr.titleLabel}</span>
        <input className="input" value={form.title} onChange={(e) => setPR({ title: e.target.value })} />
      </label>
      <label className="field pr-panel__description">
        <span className="pmr-label field__label">{pr.descriptionLabel}</span>
        <textarea className="input textarea" value={form.description} onChange={(e) => setPR({ description: e.target.value })} rows={7} />
        <span className="field__help pr-panel__draft"><Icon name="sparkle" size={12} />{pr.draftNote}</span>
      </label>
      <div className="field">
        <span className="pmr-label field__label" id="pr-reviewers">{pr.reviewersLabel}</span>
        {mates.length > 0 ? (
          <label className="select pr-panel__select">
            <span className="sr-only">{t(pr.reviewerSelect)}</span>
            <select value={reviewer?.id ?? ''} onChange={(e) => setPR({ reviewer: e.target.value || null })} aria-labelledby="pr-reviewers" data-reviewer-select>
              <option value="">{t(pr.reviewerPlaceholder)}</option>
              {mates.map((m) => <option key={m.id} value={m.id}>{m.email ? `${m.name} (${m.email})` : m.name}</option>)}
            </select>
            <Icon name="chevron-down" />
          </label>
        ) : (
          <p className="field__help">{t(pr.noTeammates)}</p>
        )}
        {reviewer && (
          <div className="pr-panel__reviewer">
            <span className="avatar">{initials(reviewer.name)}</span>
            <span className="pr-panel__reviewer-text">
              <span className="pr-panel__reviewer-name">{reviewer.name}</span>
              {reviewer.email && <span className="field__help pr-panel__email">{reviewer.email}</span>}
              <span className="field__help">{copy.roles.teammate.menuBody}</span>
            </span>
          </div>
        )}
        <button type="button" className="pmr-button pmr-button--secondary pr-panel__add" onClick={addReviewer}>
          <Icon name="add" size={14} />{t(pr.addTeammate)}
        </button>
      </div>
      <label className="checkbox pr-panel__attach">
        <input type="checkbox" checked={form.attachReceipt} onChange={(e) => setPR({ attachReceipt: e.target.checked })} />
        <span className="checkbox__box" aria-hidden="true"><Icon name="check" size={12} /></span>
        <span>{pr.attachReceipt}</span>
      </label>
      <button type="submit" className="pmr-button right-panel__wide" data-create-pr>{pr.primary}</button>
      {warn && (
        <NoReviewerDialog
          onProceed={() => { setWarn(false); log('click', { target: 'proceedWithoutReviewer' }); createPR(); }}
          onCancel={() => { setWarn(false); requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[data-reviewer-select], .pr-panel__add')?.focus()); }}
        />
      )}
    </form>
  );
}

/** Feedback round 3: creating a PR with no human reviewer asks first. */
function NoReviewerDialog({ onProceed, onCancel }: { onProceed: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const nr = pr.noReviewer;
  useEscape(onCancel);
  usePopupFocus(ref, '[data-noreviewer-cancel]', { trap: true });
  // Portalled to the stage so the scrim covers everything, not just the PR panel.
  const host = document.querySelector('.stage');
  if (!host) return null;
  return createPortal(
    <div className="scrim" onPointerDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div ref={ref} className="pmr-glass dialog" role="alertdialog" aria-modal="true" aria-labelledby="no-reviewer-title" aria-describedby="no-reviewer-body">
        <h2 id="no-reviewer-title" className="dialog__title">{t(nr.title)}</h2>
        <p id="no-reviewer-body" className="dialog__body">{t(nr.body)}</p>
        <div className="dialog__actions">
          <button type="button" className="pmr-button pmr-button--secondary" onClick={onProceed}>{t(nr.proceed)}</button>
          <button type="button" className="pmr-button" data-noreviewer-cancel onClick={onCancel}>{t(nr.cancel)}</button>
        </div>
      </div>
    </div>,
    host,
  );
}

/** Frame 10: PR #482 with its checks; Merge unlocks when the teammate approves. */
export function PRStatusCard() {
  const collaborators = useScenario((s) => s.collaborators);
  const reviewerId = useScenario((s) => s.pr.reviewer);
  const attach = useScenario((s) => s.pr.attachReceipt);
  const approved = useScenario((s) => s.milestones.teammateApproved);
  const stage = useScenario((s) => s.reviewStage);
  const merge = useScenario((s) => s.merge);
  const addReviewer = useScenario((s) => s.addReviewer);
  const mate = collaborators.find((c) => c.id === reviewerId);
  const name = mate?.name ?? copy.people.teammate.fullName;
  const total = useScenario((s) => s.collaborators.some((c) => c.role === 'tester' && c.status === 'active')) ? 8 : 7;
  const hasTester = total === 8;
  const [receipt, tests, review] = tr.checks;
  return (
    <section className="pmr-glass pr-status" aria-labelledby="pr-status-title">
      <h2 id="pr-status-title" className="right-panel__title">{tr.prTitle}</h2>
      <p className="right-panel__meta">{tr.prMeta}</p>
      <ul className="pr-status__checks">
        {attach && (
          <li>
            <Icon name="pass-filled" className="is-pass" />
            <span><span className="pr-status__title">{receipt.title}</span><span className="pr-status__meta">{t(receipt.meta, { total })}</span></span>
          </li>
        )}
        {hasTester && (
          <li>
            <Icon name="pass-filled" className="is-pass" />
            <span><span className="pr-status__title">{tests.title}</span><span className="pr-status__meta">{tests.meta}</span></span>
          </li>
        )}
        <li>
          <Icon name={approved ? 'pass-filled' : mate ? review.icon : 'circle-large-outline'} className={approved ? 'is-pass' : undefined} />
          <span>
            <span className="pr-status__title">{review.title}</span>
            <span className="pr-status__meta">
              {approved ? t(tr.approvedCheck, { teammate: name }) : mate ? t(review.meta, { teammate: name }) : t(tr.noReviewerCheck)}
            </span>
          </span>
        </li>
      </ul>
      <button
        type="button"
        className={`pmr-button right-panel__wide${approved ? '' : ' pmr-button--locked'}`}
        aria-disabled={!approved}
        data-merge
        onClick={() => approved && merge()}
      >
        {!approved && <Icon name="lock" size={14} />}
        {tr.merge}
      </button>
      {!mate && (
        <button type="button" className="pmr-button pmr-button--secondary right-panel__wide" data-add-reviewer onClick={addReviewer}>
          <Icon name="add" size={14} />{t(tr.addReviewer)}
        </button>
      )}
      {!approved && !mate && <p className="pr-status__help">{t(tr.noReviewerHelp)}</p>}
      {!approved && mate && (
        <p className="pr-status__help">
          {t(stage === 'commented' ? tr.mergeLockedReply : stage === 'reading' ? tr.readingReply : tr.mergeLocked, { teammateFirst: name.split(' ')[0] })}
        </p>
      )}
    </section>
  );
}

/** Frame 10: the teammate's comment on the You line, with a real reply field. */
export function CommentCard() {
  const collaborators = useScenario((s) => s.collaborators);
  const reviewerId = useScenario((s) => s.pr.reviewer);
  const commentWith = useScenario((s) => s.commentWith);
  const allThread = useScenario((s) => s.thread);
  const approved = useScenario((s) => s.milestones.teammateApproved);
  const view = useScenario((s) => s.view);
  const addressTeammate = useScenario((s) => s.addressTeammate);
  const closeComment = useScenario((s) => s.closeComment);
  const threadRef = useRef<HTMLDivElement>(null);
  const showLine = useScenario((s) => s.showLine);
  const g = useGeometry();
  const cardRef = useRef<HTMLElement>(null);
  const stage = useScenario((s) => s.reviewStage);
  const mateId = commentWith ?? reviewerId;
  const mate = collaborators.find((c) => c.id === mateId);
  const isReviewer = !!mate && mate.id === reviewerId;
  // Their PR comment is on the line once the review has reached it.
  const hasComment = isReviewer && (stage === 'commented' || stage === 'reading' || stage === 'approved');
  const commentAt = useScenario((s) => s.commentAt);
  // Messages before the PR comment stay above it; the reply and answer come after.
  const indexed = allThread.map((m, i) => ({ m, i })).filter(({ m }) => !m.with || m.with === mateId);
  const before = hasComment ? indexed.filter(({ i }) => i < commentAt) : indexed;
  const after = hasComment ? indexed.filter(({ i }) => i >= commentAt) : [];
  const replied = stage === 'reading' || stage === 'approved';
  useEscape(closeComment);
  // Feedback round 3: new messages scroll into view on their own.
  const lastCount = indexed.length;
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    const card = cardRef.current;
    if (card) card.scrollTop = card.scrollHeight;
  }, [lastCount, stage, hasComment]);
  // A click anywhere outside the card closes it, except in the composer it's feeding.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element;
      if (cardRef.current?.contains(el)) return;
      if (el.closest?.('.composer, .attachment-row, .attach-menu, [data-comment-node], .toast')) return;
      closeComment();
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [closeComment]);
  // Reply is the one thing to act on: it takes focus so Enter goes straight to writing.
  usePopupFocus(cardRef, '[data-reply]', { trap: true });
  if (!mate) return null;
  const first = mate.name.split(' ')[0];

  // Anchored above the midpoint of the You and teammate line, clear of the team rail.
  const you = toScreen(g.you.point, g, view);
  const node = g.byId(mate.id);
  const them = node ? toScreen(node.point, g, view) : you;
  const mid = { x: (you.x + them.x) / 2, y: (you.y + them.y) / 2 };
  const stageWidth = useScenario.getState().stageWidth;
  const left = Math.min(Math.max(mid.x - 210, 262), stageWidth - 366);
  // Bottom-anchored 45px above the line (frame 10) so a growing thread rises instead of covering You.
  const bottomEdge = Math.max(mid.y - 45, 200);

  const renderMessage = (m: ThreadMessage, i: number) => (
    <div key={i} className={`comment-card__reply comment-card__reply--${m.from}`}>
      <span className="comment-card__who">{m.from === 'you' ? t(tr.you) : mate.name}</span>
      {m.text}
      {m.attachments && (
        <span className="comment-card__attachments">
          {m.attachments.map((f) => (
            <span key={f} className="chip chip--static"><Icon name="file" size={12} />{f}</span>
          ))}
        </span>
      )}
    </div>
  );

  // Feedback round 2: replying happens in the composer below ("To: {name}", with an attach button),
  // not in a field squeezed into this card.
  const reply = () => {
    addressTeammate(mate.id);
    requestAnimationFrame(() => document.querySelector<HTMLElement>('.composer__input')?.focus());
  };

  return (
    <>
      <svg className="stage-overlay" width="100%" height="900" aria-hidden="true">
        <line className="line line--attach" x1={mid.x} y1={bottomEdge} x2={mid.x} y2={mid.y - 14} />
      </svg>
      <section
        ref={cardRef}
        className="pmr-glass comment-card"
        style={{ left, bottom: 900 - bottomEdge, maxHeight: bottomEdge - 48 }}
        aria-labelledby="comment-author"
      >
        <header className="comment-card__header">
          <span className="avatar avatar--small">{initials(mate.name)}</span>
          <span id="comment-author" className="comment-card__author">{hasComment ? mate.name : t(tr.messageLine)}</span>
          <span className="comment-card__meta" />
          <button type="button" className="icon-button comment-card__close" aria-label={t(tr.closeComment)} data-tip={t(tr.closeComment)} onClick={closeComment}>
            <Icon name="close" size={14} />
          </button>
        </header>
        <div ref={threadRef} className="comment-card__thread">
          {before.map(({ m, i }) => renderMessage(m, i))}
          {hasComment && (
            <p className="comment-card__body comment-card__pr-comment">
              <span className="comment-card__who">{mate.name}  ·  {tr.comment.meta}</span>
              {tr.comment.body}
            </p>
          )}
          {after.map(({ m, i }) => renderMessage(m, i))}
          {stage === 'reading' && isReviewer && (
            <p className="comment-card__reply comment-card__reading" aria-live="polite">{t(tr.readingReply, { teammateFirst: first })}</p>
          )}
        </div>
        <div className="comment-card__actions">
          {!(isReviewer && (replied || approved) && hasComment) && (
            <button type="button" className="pmr-button" data-reply onClick={reply}>
              <Icon name="reply" size={14} />
              {hasComment ? tr.comment.actions[0] : t(copy.constellation.popover.message, { first })}
            </button>
          )}
          {hasComment && <button type="button" className="pmr-button pmr-button--secondary" onClick={showLine}>{tr.comment.actions[1]}</button>}
        </div>
      </section>
    </>
  );
}

/** Frame 11: the recap after the merge. */
export function RecapPanel() {
  const collaborators = useScenario((s) => s.collaborators);
  const reviewerId = useScenario((s) => s.pr.reviewer);
  const setRightPanel = useScenario((s) => s.setRightPanel);
  const mate = collaborators.find((c) => c.id === reviewerId);
  const lines = caughtPerLine(collaborators, reviewerId);
  const max = Math.max(...lines.map((l) => l.n), 1);
  const nameOf = (id: string) => (id === 'you' ? copy.people.you.displayName : collaborators.find((c) => c.id === id)?.name ?? '');
  const done = () => setRightPanel(null);
  useEscape(done);
  const spark = [16, 28, 22, 38];
  return (
    <aside className="pmr-glass right-panel recap" aria-labelledby="recap-title">
      <header className="right-panel__header recap__header">
        <Icon name="git-merge" size={18} />
        <div>
          <h2 id="recap-title" className="right-panel__title">{rc.title}</h2>
          <p className="right-panel__meta">{t(rc.meta, { teammate: mate?.name ?? copy.people.teammate.fullName })}</p>
        </div>
        <button type="button" className="icon-button" aria-label={t(rc.close)} data-tip={t(rc.close)} onClick={done}>
          <Icon name="close" />
        </button>
      </header>
      <div className="recap__stats">
        {rc.stats.map((st) => (
          <p key={st.label} className="recap__stat">
            <span className="recap__value">{st.value}</span>
            <span className="recap__label">{st.label}</span>
          </p>
        ))}
      </div>
      <p className="pmr-label recap__group">{rc.perLineLabel}</p>
      <ul className="recap__lines">
        {lines.map((l) => (
          <li key={l.id}>
            <span className="recap__pair">{nameOf(l.a)}<Icon name="arrow-both" size={14} label="and" />{nameOf(l.b)}</span>
            <span className="recap__bar" style={{ width: (l.n / max) * 156 }} aria-hidden="true" />
            <span className="recap__n">{l.n}</span>
          </li>
        ))}
      </ul>
      <p className="pmr-label recap__group">{rc.monthLabel}</p>
      <div className="recap__month">
        <div>
          <div className="recap__spark" aria-hidden="true">
            {spark.map((h, i) => <span key={i} style={{ height: h }} className={i === spark.length - 1 ? 'is-now' : undefined} />)}
          </div>
          <p className="recap__spark-label">{rc.monthSpark}</p>
        </div>
        <ul className="recap__month-lines">
          {rc.month.map((m, i) => <li key={m} className={i === 0 ? 'is-lead' : undefined}>{m}</li>)}
        </ul>
      </div>
      <div className="right-panel__actions recap__actions">
        <button type="button" className="pmr-button pmr-button--secondary" onClick={() => setRightPanel('receipt')}>{rc.actions[0]}</button>
        <button type="button" className="pmr-button" data-done onClick={done}>{rc.actions[1]}</button>
      </div>
    </aside>
  );
}

/** M7 (feedback): a pop-up so Open pull request isn't hidden behind the "All lines clear" pill. */
export function AllClearPopup() {
  const collaborators = useScenario((s) => s.collaborators);
  const setAllClearOpen = useScenario((s) => s.setAllClearOpen);
  const setRightPanel = useScenario((s) => s.setRightPanel);
  const openPR = useScenario((s) => s.openPR);
  const ref = useRef<HTMLDivElement>(null);
  const total = topSections(collaborators).length;
  // Close leaves the receipt on screen, so Open pull request is still one click away.
  const close = () => {
    setAllClearOpen(false);
    setRightPanel('receipt');
  };
  useEscape(close);
  usePopupFocus(ref, '[data-allclear-primary]', { trap: true });
  return (
    <div className="scrim" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={ref} className="pmr-glass dialog all-clear" role="dialog" aria-modal="true" aria-labelledby="all-clear-title">
        <span className="all-clear__check" aria-hidden="true"><Icon name="check" size={20} /></span>
        <h2 id="all-clear-title" className="dialog__title">{t(ac.popupTitle)}</h2>
        <p className="dialog__body">{t(ac.popupBody, { total })}</p>
        <div className="dialog__actions">
          <button type="button" className="pmr-button pmr-button--secondary" onClick={() => { setAllClearOpen(false); setRightPanel('receipt'); }}>
            {t(ac.popupSecondary)}
          </button>
          <button type="button" className="pmr-button" data-allclear-primary onClick={() => { setAllClearOpen(false); openPR(); }}>
            {ac.primary}
          </button>
        </div>
      </div>
    </div>
  );
}
