import { FormEvent, useEffect, useRef, useState } from 'react';
import { copy, t } from '../lib/copy';
import { useEscape } from '../lib/escape';
import { toScreen, useGeometry } from '../lib/geometry';
import { caughtPerLine, footnote, receiptRows, receiptText, unopenedCount } from '../lib/receipt';
import { topSections } from '../lib/sections';
import { log } from '../lib/log';
import { usePopupFocus } from '../lib/usePopupFocus';
import { initials, mateTone } from '../lib/status';
import type { Collaborator, ThreadMessage } from '../lib/types';
import { questionFor, reviewersOf, useScenario } from '../lib/store';
import { Icon } from './Icon';
import { Truncate } from './Truncate';

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
              <th scope="row" className={r.mono ? 'is-mono' : undefined}>
                {r.section}
                {r.note && <span className="receipt__note">{r.note}</span>}
              </th>
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
  const ref = useRef<HTMLFormElement>(null);
  useEscape(closePR);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('input')?.focus();
  }, []);
  // Feedback round 4: every human teammate in the constellation reviews. P1/P5 (frame 09): a suggested
  // teammate is pre-filled when there's none, and anyone can be added here without leaving the panel.
  const reviewers = collaborators.filter((c) => c.role === 'teammate' && (c.status === 'active' || c.status === 'suggested'));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    log('input', { field: 'prTitle', text: form.title });
    log('click', { target: 'createPR', reviewers: reviewers.length });
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
      <ReviewerField reviewers={reviewers} />
      <label className="checkbox pr-panel__attach">
        <input type="checkbox" checked={form.attachReceipt} onChange={(e) => setPR({ attachReceipt: e.target.checked })} />
        <span className="checkbox__box" aria-hidden="true"><Icon name="check" size={12} /></span>
        <span>{pr.attachReceipt}</span>
      </label>
      <button type="submit" className="pmr-button right-panel__wide" data-create-pr>{pr.primary}</button>
    </form>
  );
}

const DIRECTORY = copy.people.directory.people;

/** Frame 09's REVIEWERS: chips for each reviewer, and a typeahead over the (dummy) people directory. */
function ReviewerField({ reviewers }: { reviewers: Collaborator[] }) {
  const collaborators = useScenario((s) => s.collaborators);
  const addTeammateDirect = useScenario((s) => s.addTeammateDirect);
  const removeSuggested = useScenario((s) => s.removeSuggested);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const q = query.trim().toLowerCase();
  const taken = new Set(reviewers.filter((r) => r.status === 'active').map((r) => r.name));
  const matches = DIRECTORY.filter((p) => !taken.has(p.name) && (!q || p.name.toLowerCase().split(/\s+/).some((w) => w.startsWith(q)) || p.name.toLowerCase().startsWith(q))).slice(0, 6);
  const show = open && matches.length > 0;
  const pick = (p: { name: string; email: string }) => {
    log('click', { target: 'prReviewerPick', name: p.name });
    addTeammateDirect(p);
    setQuery('');
    setOpen(false);
  };
  return (
    <div className="field pr-panel__reviewer-field">
      <span className="pmr-label field__label" id="pr-reviewers">{pr.reviewersLabel}</span>
      {reviewers.length > 0 && (
        <ul className="pr-panel__reviewers" aria-labelledby="pr-reviewers">
          {reviewers.map((m) => (
            <li key={m.id} className={`pr-panel__reviewer${m.status === 'suggested' ? ' is-suggested' : ''}`}>
              <span className={`avatar avatar--tone-${mateTone(m.id, collaborators) ?? 1}`}>{initials(m.name)}</span>
              <span className="pr-panel__reviewer-text">
                <Truncate text={m.name} className="pr-panel__reviewer-name" />
                <span className="field__help pr-panel__email">{m.status === 'suggested' ? `${t(pr.suggested)}  ·  ${pr.reviewerHint}` : m.email}</span>
              </span>
              {m.status === 'suggested' && (
                <button type="button" className="icon-button" aria-label={t(pr.removeReviewer, { name: m.name })} data-tip={t(pr.removeReviewer, { name: m.name })} onClick={() => removeSuggested(m.id)}>
                  <Icon name="close" size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="pr-panel__search">
        <Icon name="person-add" size={14} />
        <input
          className="input"
          value={query}
          placeholder={t(pr.reviewerSearch)}
          aria-label={t(pr.reviewerSearchLabel)}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={show}
          aria-controls="pr-reviewer-options"
          aria-activedescendant={show ? `pr-reviewer-${active}` : undefined}
          data-pr-reviewer-search
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && show) { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setOpen(false); return; }
            if (!show) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % matches.length); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + matches.length) % matches.length); }
            if (e.key === 'Enter') { e.preventDefault(); pick(matches[active]); }
          }}
        />
        {show && (
          <ul id="pr-reviewer-options" className="pmr-glass suggestions pr-panel__options" role="listbox" aria-label={t(pr.reviewerSearchLabel)}>
            {matches.map((p, i) => (
              <li
                key={p.email}
                id={`pr-reviewer-${i}`}
                role="option"
                aria-selected={i === active}
                className={`suggestions__item${i === active ? ' is-active' : ''}`}
                onPointerDown={(e) => { e.preventDefault(); pick(p); }}
                onPointerEnter={() => setActive(i)}
              >
                <span className="avatar avatar--small" aria-hidden="true">{initials(p.name)}</span>
                <span className="suggestions__text">
                  <span className="suggestions__name">{p.name}</span>
                  <span className="suggestions__email">{p.email}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="field__help">{t(pr.reviewersHelp)}</p>
    </div>
  );
}

/** Frame 10: PR #482 with its checks, one review row per teammate. It merges itself once all approve (round 4). */
export function PRStatusCard() {
  const collaborators = useScenario((s) => s.collaborators);
  const attach = useScenario((s) => s.pr.attachReceipt);
  const approved = useScenario((s) => s.milestones.teammateApproved);
  const addReviewer = useScenario((s) => s.addReviewer);
  const merge = useScenario((s) => s.merge);
  const mates = reviewersOf(collaborators);
  const total = collaborators.some((c) => c.role === 'tester' && c.status === 'active') ? 8 : 7;
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
        {mates.map((m) => {
          const first = m.name.split(' ')[0];
          const done = m.review === 'approved';
          return (
            <li key={m.id}>
              <Icon name={done ? 'pass-filled' : review.icon} className={done ? 'is-pass' : undefined} />
              <span>
                <span className="pr-status__title">{t(tr.reviewRow, { teammate: m.name })}</span>
                <span className="pr-status__meta">
                  {done ? t(tr.approvedCheck, { teammate: m.name })
                    : m.reviewStage === 'commented' ? t(tr.waitingReply)
                    : m.reviewStage === 'reading' ? t(tr.readingReply, { teammateFirst: first })
                    : t(tr.waitingOn, { teammateFirst: first })}
                </span>
              </span>
            </li>
          );
        })}
        {!mates.length && (
          <li>
            <Icon name="circle-large-outline" />
            <span><span className="pr-status__title">{review.title}</span><span className="pr-status__meta">{t(tr.noReviewerCheck)}</span></span>
          </li>
        )}
      </ul>
      {/* P1/P5: never auto-merge. Approval unlocks Merge, and the user clicks it. */}
      {approved ? (
        <>
          <p className="pr-status__success" role="status">
            <Icon name="pass-filled" className="is-pass" />{t(tr.merging)}
          </p>
          <button type="button" className="pmr-button right-panel__wide" data-merge onClick={() => { log('click', { target: 'merge' }); merge(); }}>
            <Icon name="git-merge" size={14} />{t(tr.mergeButton)}
          </button>
        </>
      ) : mates.length ? (
        <>
          <button type="button" className="pmr-button pmr-button--locked right-panel__wide" aria-disabled="true" data-merge>
            <Icon name="lock" size={14} />{t(tr.mergeButton)}
          </button>
          <p className="pr-status__help">{t(tr.mergeLocked)}</p>
        </>
      ) : (
        <>
          <button type="button" className="pmr-button pmr-button--secondary right-panel__wide" data-add-reviewer onClick={addReviewer}>
            <Icon name="add" size={14} />{t(tr.addReviewer)}
          </button>
          <p className="pr-status__help">{t(tr.noReviewerHelp)}</p>
        </>
      )}
    </section>
  );
}

/** A teammate's conversation: messages before their PR comment, the comment, then the reply and answer. */
function MateThread({ mate, thread, render }: { mate: Collaborator; thread: ThreadMessage[]; render: (m: ThreadMessage, i: number) => JSX.Element }) {
  const hasComment = !!mate.reviewStage && mate.reviewStage !== 'reviewing';
  const indexed = thread.map((m, i) => ({ m, i })).filter(({ m }) => m.with === mate.id);
  const at = mate.commentAt ?? 0;
  const before = hasComment ? indexed.filter(({ i }) => i < at) : indexed;
  const after = hasComment ? indexed.filter(({ i }) => i >= at) : [];
  return (
    <>
      {before.map(({ m, i }) => render(m, i))}
      {hasComment && (
        <p className="comment-card__body comment-card__pr-comment">
          <span className="comment-card__who">{mate.name}  ·  {tr.comment.meta}</span>
          {questionFor(mate).body}
        </p>
      )}
      {after.map(({ m, i }) => render(m, i))}
    </>
  );
}

const messageRenderer = (mate: Collaborator) => (m: ThreadMessage, i: number) => (
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

/** Frame 10: the teammate's comment on the You line, with a real reply field. */
export function CommentCard() {
  const collaborators = useScenario((s) => s.collaborators);
  const commentWith = useScenario((s) => s.commentWith);
  const allThread = useScenario((s) => s.thread);
  const view = useScenario((s) => s.view);
  const addressTeammate = useScenario((s) => s.addressTeammate);
  const closeComment = useScenario((s) => s.closeComment);
  const threadRef = useRef<HTMLDivElement>(null);
  const showLine = useScenario((s) => s.showLine);
  const g = useGeometry();
  const cardRef = useRef<HTMLElement>(null);
  const mate = collaborators.find((c) => c.id === commentWith);
  const stage = mate?.reviewStage;
  // Their PR comment is on the line once their review has reached it.
  const hasComment = !!stage && stage !== 'reviewing';
  const replied = stage === 'reading' || stage === 'approved';
  const lastCount = allThread.filter((m) => m.with === commentWith).length;
  const openThread = useScenario((s) => s.openThread);
  // Other reviewers whose comment is waiting on a reply.
  const others = collaborators.filter((c) => c.role === 'teammate' && c.id !== commentWith && c.reviewStage === 'commented');
  useEscape(closeComment);
  // Feedback round 3: new messages scroll into view on their own.
  useEffect(() => {
    // Only the conversation scrolls; the header with the reviewer's name stays put (round 7).
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
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
  // Round 7: when the line sits high and there's little room above, the card opens below it instead.
  const roomAbove = mid.y - 45 - 48;
  const below = roomAbove < 260;
  const bottomEdge = Math.max(mid.y - 45, 200);
  const topEdge = mid.y + 45;

  // Feedback round 2: replying happens in the composer below ("To: {name}", with an attach button),
  // not in a field squeezed into this card.
  const reply = () => {
    addressTeammate(mate.id);
    requestAnimationFrame(() => document.querySelector<HTMLElement>('.composer__input')?.focus());
  };

  return (
    <>
      <svg className="stage-overlay" width="100%" height="900" aria-hidden="true">
        {below
          ? <line className="line line--attach" x1={mid.x} y1={mid.y + 14} x2={mid.x} y2={topEdge} />
          : <line className="line line--attach" x1={mid.x} y1={bottomEdge} x2={mid.x} y2={mid.y - 14} />}
      </svg>
      <section
        ref={cardRef}
        className="pmr-glass comment-card"
        style={below ? { left, top: topEdge, maxHeight: 900 - 110 - topEdge } : { left, bottom: 900 - bottomEdge, maxHeight: bottomEdge - 48 }}
        aria-labelledby="comment-author"
      >
        <header className="comment-card__header">
          <span className={`avatar avatar--small avatar--tone-${mateTone(mate.id, collaborators) ?? 1}`}>{initials(mate.name)}</span>
          <span id="comment-author" className="comment-card__author">{hasComment ? mate.name : t(tr.messageLine)}</span>
          <span className="comment-card__meta" />
          <button type="button" className="icon-button comment-card__close" aria-label={t(tr.closeComment)} data-tip={t(tr.closeComment)} onClick={closeComment}>
            <Icon name="close" size={14} />
          </button>
        </header>
        {/* Round 9: this card can cover other reviewers' comment icons, so it says when more are waiting. */}
        {others.length > 0 && (
          <div className="comment-card__others" role="status" aria-label={t(tr.otherWaitingLabel)}>
            {others.map((o) => (
              <button
                key={o.id}
                type="button"
                className="comment-card__other"
                aria-label={t(tr.otherWaitingOpen, { teammateFirst: o.name.split(' ')[0] })}
                onClick={() => { log('click', { target: 'otherComment', teammate: o.id }); openThread(o.id); }}
              >
                <span className="comment-card__other-dot" aria-hidden="true" />
                <span className={`avatar avatar--small avatar--tone-${mateTone(o.id, collaborators) ?? 1}`} aria-hidden="true">{initials(o.name)}</span>
                <span>{t(tr.otherWaiting, { teammateFirst: o.name.split(' ')[0] })}</span>
                <Icon name="arrow-right" size={14} />
              </button>
            ))}
          </div>
        )}
        <div ref={threadRef} className="comment-card__thread">
          <MateThread mate={mate} thread={allThread} render={messageRenderer(mate)} />
          {stage === 'reading' && (
            <p className="comment-card__reply comment-card__reading" aria-live="polite">{t(tr.readingReply, { teammateFirst: first })}</p>
          )}
        </div>
        <div className="comment-card__actions">
          {!(replied && hasComment) && (
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
  const thread = useScenario((s) => s.thread);
  const sections = useScenario((s) => s.sections);
  const setRightPanel = useScenario((s) => s.setRightPanel);
  const openSaveDialog = useScenario((s) => s.openSaveDialog);
  const mates = reviewersOf(collaborators).filter((c) => c.review === 'approved');
  const unopened = unopenedCount(sections);
  const followUps = mates.filter((m) => m.followUp);
  const lines = caughtPerLine(collaborators, mates[0]?.id ?? null);
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
          <p className="right-panel__meta">{t(rc.metaMany, { teammates: listNames(mates.map((m) => m.name)) || copy.people.teammate.fullName })}</p>
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
      {/* P1/P5: bulk verify is honest. A neutral count, not a warning. */}
      {unopened > 0 && <p className="recap__unopened">{unopened === 1 ? t(rc.unopenedStatOne) : t(rc.unopenedStat, { n: unopened })}</p>}
      {followUps.length > 0 && (
        <>
          <p className="pmr-label recap__group">{t(rc.followUpsLabel)}</p>
          <ul className="recap__followups">
            {followUps.map((m) => (
              <li key={m.id}>
                <Icon name="tasklist" size={14} />
                <span>{m.followUp}<span className="recap__followup-who">{m.name}</span></span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="pmr-label recap__group">{rc.perLineLabel}</p>
      {/* P1/P5: the label column is as wide as the longest pair (capped at 55%), so bars never touch names. */}
      <ul className="recap__lines">
        {lines.map((l) => (
          <li key={l.id}>
            <Truncate text={`${nameOf(l.a)} and ${nameOf(l.b)}`} className="recap__pair">
              {nameOf(l.a)}<Icon name="arrow-both" size={14} label="and" />{nameOf(l.b)}
            </Truncate>
            <span className="recap__track" aria-hidden="true"><span className="recap__bar" style={{ width: `${(l.n / max) * 100}%` }} /></span>
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
      {/* Feedback round 4: resolved comments leave the canvas; their history lives here. */}
      <p className="pmr-label recap__group">{t(rc.historyLabel)}</p>
      {mates.some((m) => m.reviewStage) ? (
        <div className="recap__history">
          {mates.filter((m) => m.reviewStage).map((m) => (
            <details key={m.id} className="recap__thread">
              <summary>
                <span className={`avatar avatar--small avatar--tone-${mateTone(m.id, collaborators) ?? 1}`}>{initials(m.name)}</span>
                <span>{m.name}</span>
                <Icon name="chevron-down" size={14} />
              </summary>
              <div className="comment-card__thread recap__thread-body">
                <MateThread mate={m} thread={thread} render={messageRenderer(m)} />
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className="field__help">{t(rc.historyEmpty)}</p>
      )}
      <div className="right-panel__actions recap__actions">
        <button type="button" className="pmr-button pmr-button--secondary" onClick={() => setRightPanel('receipt')}>{rc.actions[0]}</button>
        <button type="button" className="pmr-button pmr-button--secondary recap__save" data-save-team-recap onClick={() => openSaveDialog('recap')}>
          <Icon name="save" size={14} />{t(rc.saveTeam)}
        </button>
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

/** "A", "A and B", "A, B and C". */
function listNames(names: string[]) {
  return names.length <= 1 ? names[0] ?? '' : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
