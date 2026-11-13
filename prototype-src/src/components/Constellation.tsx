import { useEffect, useRef, useState } from 'react';
import { copy, t } from '../lib/copy';
import { type Point } from '../lib/layout';
import { SUGGESTED_ID, useGeometry, type Node } from '../lib/geometry';
import { subtitleFor } from '../lib/status';
import { firstOf, useScenario } from '../lib/store';
import { caughtPerLine } from '../lib/receipt';
import { displayName, initials, mateTone } from '../lib/status';
import type { Line } from '../lib/types';
import { usePanZoom } from '../lib/useView';
import { Icon } from './Icon';
import { Orb } from './Orb';

const LINE_GAP = 9; // Clara's rule: lines stop 8–10px short of orbs.
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Two or three small dots travelling along a working line; static when motion is reduced. */
function FlowDots({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const count = len > 220 ? 3 : 2;
  const dur = Math.max(1.6, len / 90);
  const path = `M ${x1} ${y1} L ${x2} ${y2}`;
  if (reducedMotion()) {
    return (
      <>
        {Array.from({ length: count }, (_, i) => {
          const f = (i + 1) / (count + 1);
          return <circle key={i} className="flow-dot" r={3.5} cx={x1 + (x2 - x1) * f} cy={y1 + (y2 - y1) * f} />;
        })}
      </>
    );
  }
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} className="flow-dot" r={3.5}>
          <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={path} begin={`${(-dur * i) / count}s`} />
        </circle>
      ))}
    </>
  );
}

function trimmed(a: Node, b: Node) {
  const dx = b.point.x - a.point.x;
  const dy = b.point.y - a.point.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const ra = a.size / 2 + LINE_GAP + (a.id === 'you' ? 8 : 0); // clear You's inner halo ring
  const rb = b.size / 2 + LINE_GAP + (b.id === 'you' ? 8 : 0);
  return {
    x1: a.point.x + ux * ra, y1: a.point.y + uy * ra,
    x2: b.point.x - ux * rb, y2: b.point.y - uy * rb,
    mx: (a.point.x + b.point.x) / 2, my: (a.point.y + b.point.y) / 2,
  };
}

export interface LineHover { line: Line; at: Point; pinned: boolean }

interface ConstellationProps {
  scale: number;
  onLineHover: (h: LineHover | null) => void;
}

export function Constellation({ scale, onLineHover }: ConstellationProps) {
  const g = useGeometry();
  const view = useScenario((s) => s.view);
  const collaborators = useScenario((s) => s.collaborators);
  const firstAdded = useScenario((s) => s.firstAdded);
  const addMenu = useScenario((s) => s.addMenu);
  const configure = useScenario((s) => s.configure);
  const hoverId = useScenario((s) => s.hoverId);
  const linkIds = useScenario((s) => s.linkIds);
  const allClear = useScenario((s) => s.milestones.allSectionsVerified);
  const merged = useScenario((s) => s.milestones.merged);
  const thread = useScenario((s) => s.thread);
  const openThread = useScenario((s) => s.openThread);
  const caught = merged ? caughtPerLine(collaborators, collaborators.find((c) => c.role === 'teammate' && c.review === 'approved')?.id ?? null) : [];
  const openSections = useScenario((s) => s.openSections);
  // Orbs ringed from elsewhere: a section row rings its line's two ends; a rail row rings one orb.
  const linkSet = linkIds ? new Set(linkIds) : hoverId ? new Set([hoverId]) : null;
  const popover = useScenario((s) => s.popover);
  const openAddMenu = useScenario((s) => s.openAddMenu);
  const closeAddMenu = useScenario((s) => s.closeAddMenu);
  const openPopover = useScenario((s) => s.openPopover);
  const setSpecOpen = useScenario((s) => s.setSpecOpen);
  const { surface, onPointerDown, onPointerMove, onPointerUp } = usePanZoom(scale);
  const [lineHover, setLineHover] = useState<string | null>(null);
  const hoverTimer = useRef<number>();

  const alone = collaborators.length === 0;
  const showCoach = !firstAdded && !addMenu && !configure;
  const youLabelRight = !alone;

  const lineHoverStart = (line: Line, a: Node, b: Node) => {
    window.clearTimeout(hoverTimer.current);
    setLineHover(line.id);
    hoverTimer.current = window.setTimeout(
      () => onLineHover({ line, at: { x: (a.point.x + b.point.x) / 2, y: (a.point.y + b.point.y) / 2 }, pinned: false }),
      150,
    );
  };
  const lineHoverEnd = () => {
    window.clearTimeout(hoverTimer.current);
    setLineHover(null);
    onLineHover(null);
  };
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  const linked = (id: string) => !!linkSet?.has(id) || popover === id;
  const isDim = (id: string) => !!linkSet && !linkSet.has(id);
  const lineDim = (a: string, b: string) => !!linkSet && (linkSet.size > 1 ? !(linkSet.has(a) && linkSet.has(b)) : !linkSet.has(a) && !linkSet.has(b));

  return (
    <div
      ref={surface}
      className="world-surface"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="world" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
        <div className="world__layout" style={{ transform: `translate(${g.shift.x + g.dx}px, ${g.shift.y}px)` }}>
          <svg className="lines" width="1440" height="900">
            {alone && !configure && <line className="line line--attach" x1={642} y1={500} x2={692} y2={452} />}
            {showCoach && <line className="line line--attach" x1={g.plus.x + 15} y1={g.plus.y - 9} x2={834} y2={392} />}
            {g.lines.map((line) => {
              const a = g.byId(line.a);
              const b = g.byId(line.b);
              if (!a || !b) return null;
              const p = trimmed(a, b);
              const dim = lineDim(line.a, line.b);
              return (
                <g
                  key={line.id}
                  className={`line-group${lineHover === line.id ? ' is-hover' : ''}${dim ? ' is-dim' : ''}`}
                  onPointerEnter={() => (line.kind !== 'pending' || a.c?.review === 'pending' || b.c?.review === 'pending') && lineHoverStart(line, a, b)}
                  onPointerLeave={lineHoverEnd}
                  onClick={() =>
                    line.kind === 'issue' ? openSections() : line.kind !== 'pending' && onLineHover({ line, at: { x: p.mx, y: p.my }, pinned: true })
                  }
                >
                  <line className="line__hit" x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />
                  {line.kind === 'issue' && <line className="line line--issue-glow" x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />}
                  <line className={`line line--${line.kind}`} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />
                  {line.kind === 'working' && <FlowDots x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />}
                </g>
              );
            })}
          </svg>

          {/* Issue badges sit on the line's midpoint (frame 06): focusable, open the sections panel. */}
          {g.lines.filter((l) => l.kind === 'issue').map((line) => {
            const a = g.byId(line.a);
            const b = g.byId(line.b);
            if (!a || !b) return null;
            const mx = (a.point.x + b.point.x) / 2;
            const my = (a.point.y + b.point.y) / 2;
            const label = t(copy.issueLine.badgeLabel, { n: line.count, builder: a.c?.name, reviewer: b.c?.name });
            return (
              <button
                key={`badge-${line.id}`}
                type="button"
                className={`issue-badge${lineDim(line.a, line.b) ? ' is-dim' : ''}`}
                style={{ left: mx - 16, top: my - 16 }}
                aria-label={label}
                data-tip={label}
                data-issue-badge
                onPointerEnter={() => lineHoverStart(line, a, b)}
                onPointerLeave={lineHoverEnd}
                onFocus={() => onLineHover({ line, at: { x: mx, y: my }, pinned: false })}
                onBlur={() => onLineHover(null)}
                onClick={() => openSections()}
              >
                {line.count}
              </button>
            );
          })}

          {/* Frame 08: a check on each settled line; frame 11: "n caught" tags instead. */}
          {allClear && g.lines.filter((l) => l.kind === 'cleared').map((line) => {
            const a = g.byId(line.a);
            const b = g.byId(line.b);
            if (!a || !b) return null;
            const mx = (a.point.x + b.point.x) / 2;
            const my = (a.point.y + b.point.y) / 2;
            if (merged) {
              const c = caught.find((x) => x.id === line.id);
              return c ? (
                <span key={`tag-${line.id}`} className="caught-tag" style={{ left: mx, top: my }}>
                  {t(copy.recap.lineTag, { n: c.n })}
                </span>
              ) : null;
            }
            return (
              <span key={`check-${line.id}`} className="line-check" style={{ left: mx - 10, top: my - 10 }} aria-hidden="true">
                <Icon name="check" size={12} />
              </span>
            );
          })}

          {/* Frame 10: a comment node on the dashed line to the reviewing teammate. */}
          {g.lines.filter((l) => l.a === 'you').map((line) => {
            const b = g.byId(line.b);
            if (!b?.c || b.c.role !== 'teammate') return null;
            // A comment node marks an open conversation on this line: a PR comment waiting on you or
            // being read, or messages before the review. Resolved (approved) or merged, it goes; the
            // history stays in the recap (feedback round 4).
            const openComment = b.c.reviewStage === 'commented' || b.c.reviewStage === 'reading';
            const chatting = !b.c.review && !merged && thread.some((m) => m.with === b.c!.id);
            if (!openComment && !chatting) return null;
            const mx = (g.you.point.x + b.point.x) / 2;
            const my = (g.you.point.y + b.point.y) / 2;
            const label = t(copy.teammateReview.commentNode, { teammateFirst: b.c.name.split(' ')[0] });
            return (
              <button
                key={`comment-${line.id}`}
                type="button"
                className="comment-node pmr-glass"
                style={{ left: mx - 12, top: my - 12 }}
                aria-label={label}
                data-tip={label}
                data-comment-node
                onClick={() => openThread(b.c!.id)}
              >
                <Icon name="comment" size={14} />
              </button>
            );
          })}

          {/* You */}
          <div className={`node node--you${isDim('you') ? ' is-dim' : ''}`} style={{ left: g.you.point.x, top: g.you.point.y }}>
            <span className="halo halo--inner" aria-hidden="true" />
            <span className="halo halo--outer" aria-hidden="true" />
            <button
              type="button"
              className={`orb-button${linked('you') ? ' is-linked' : ''}`}
              data-orb="you"
              aria-label={`${copy.people.you.displayName}, ${copy.people.you.fullName}`}
              aria-haspopup="dialog"
              onClick={() => openPopover(popover === 'you' ? null : 'you')}
            >
              <Orb role="you" size={64} />
            </button>
            <div className={`node__label${youLabelRight ? ' node__label--right' : ''}`} style={labelStyle(64, youLabelRight)}>
              <span className="node__name">{copy.people.you.displayName}</span>
              <span className="node__sub">{copy.people.you.fullName}</span>
            </div>
          </div>

          {/* + beside You */}
          <button
            type="button"
            className={`plus pmr-glass${addMenu?.anchor === 'plus' ? ' is-open' : ''}`}
            style={{ left: g.plus.x - 16, top: g.plus.y - 16 }}
            aria-label={t(copy.constellation.plusLabel)}
            data-tip={t(copy.constellation.plusLabel)}
            aria-haspopup="menu"
            aria-expanded={addMenu?.anchor === 'plus'}
            data-plus
            onClick={() => (addMenu?.anchor === 'plus' ? closeAddMenu() : openAddMenu('plus'))}
          >
            <Icon name="add" />
          </button>

          {/* Collaborators */}
          {g.nodes.map((n) => n.suggested ? <SuggestedNode key={n.id} n={n} /> : <CollaboratorNode key={n.id} n={n} linked={linked(n.id)} dim={isDim(n.id)} />)}

          {/* Empty start: spec card and coach card */}
          {alone && !configure && (
            <button type="button" className="pmr-glass spec-card" onClick={() => setSpecOpen(true)}>
              <Icon name="files" size={24} />
              <span className="spec-card__text">
                <span className="spec-card__file">{copy.project.spec.shortName}</span>
                <span className="spec-card__meta">{copy.project.spec.status}</span>
              </span>
            </button>
          )}
          {showCoach && (
            <div className="pmr-glass coach" role="note">
              <p className="coach__title">{copy.emptyState.coachTitle}</p>
              <p className="coach__body">{copy.emptyState.coachBody}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function labelStyle(size: number, right: boolean) {
  return right ? { left: size / 2 + 22, top: -17 } : { top: size / 2 + 18 };
}

function SuggestedNode({ n }: { n: Node }) {
  const collaborators = useScenario((s) => s.collaborators);
  const setRecCardOpen = useScenario((s) => s.setRecCardOpen);
  const reviewer = firstOf(collaborators, 'reviewer');
  const name = copy.roles.tester.defaultName;
  const sub = t(copy.recommendation.suggestedSubtitle, { reviewer: reviewer?.name });
  return (
    <div className="node node--tester is-far is-suggested" style={{ left: n.point.x, top: n.point.y }}>
      <button type="button" className="orb-button" data-orb={SUGGESTED_ID} aria-label={`${name}, ${sub}`} onClick={() => setRecCardOpen(true)}>
        <Orb role="tester" size={n.size} outline />
      </button>
      <div className="node__label node__label--right" style={{ left: n.size / 2 + 14, top: -17 }}>
        <span className="node__name">{name}</span>
        <span className="node__sub">{sub}</span>
      </div>
    </div>
  );
}

function CollaboratorNode({ n, linked, dim }: { n: Node; linked: boolean; dim: boolean }) {
  const collaborators = useScenario((s) => s.collaborators);
  const popover = useScenario((s) => s.popover);
  const openPopover = useScenario((s) => s.openPopover);
  const recommendation = useScenario((s) => s.recommendation);
  const floatingFile = useScenario((s) => s.floatingFile);
  const setRecCardOpen = useScenario((s) => s.setRecCardOpen);
  const c = n.c!;
  const draft = c.status === 'draft' || c.status === 'suggested';
  const sub = subtitleFor(c, collaborators);
  // Lavender non-urgent ring on the reviewer while its suggestion is open; clicking it reopens the card.
  const suggesting = (recommendation === 'shown' || recommendation === 'dismissed') && firstOf(collaborators, 'reviewer')?.id === c.id;
  // The builder wears a ring while its file is open in the floating editor (frame 04).
  const sourceOpen = !!floatingFile && firstOf(collaborators, 'builder')?.id === c.id;
  const allClear = useScenario((s) => s.milestones.allSectionsVerified);
  // Frame 08: every agent gets a mint check; the teammate gets theirs once they approve (frame 11).
  const checked = c.role === 'teammate' ? c.review === 'approved' : allClear && !draft;
  const reviewing = c.review === 'pending';
  const adding = c.status === 'suggested';
  return (
    <div
      className={`node node--${c.role}${n.far ? ' is-far' : ''}${draft ? ' is-draft' : ''}${dim ? ' is-dim' : ''}`}
      style={{ left: n.point.x, top: n.point.y }}
    >
      {c.status === 'draft' && <span className="ghost-ring" aria-hidden="true" />}
      {sourceOpen && <span className="source-ring" aria-hidden="true" />}
      {checked && (
        <span className="orb-check" style={{ left: n.size * 0.35 - 9, top: -n.size * 0.35 - 9 }} aria-hidden="true">
          <Icon name="check" size={12} />
        </span>
      )}
      {(suggesting || reviewing) && (
        <>
          <span className="attention-ring" aria-hidden="true" />
          <span className="attention-dot" aria-hidden="true" />
        </>
      )}
      {adding ? (
        <span className="orb-ghost orb-ghost--teammate" style={{ width: n.size, height: n.size }} aria-hidden="true">
          {initials(c.name)}
        </span>
      ) : draft ? (
        <span className="orb-ghost">
          <Orb role={c.role} size={n.size} name={c.name} otherType={c.otherType} />
        </span>
      ) : (
        <button
          type="button"
          className={`orb-button${linked ? ' is-linked' : ''}`}
          data-orb={c.id}
          aria-label={`${c.name}, ${sub}`}
          aria-haspopup="dialog"
          aria-expanded={popover === c.id}
          onClick={() => (suggesting ? setRecCardOpen(true) : openPopover(popover === c.id ? null : c.id))}
        >
          <Orb role={c.role} size={n.size} name={c.name} otherType={c.otherType} tone={mateTone(c.id, collaborators)} />
        </button>
      )}
      <div
        className={`node__label${n.far && !allClear ? ' node__label--right' : ''}${n.far && allClear ? ' node__label--above' : ''}`}
        style={n.far && allClear ? { top: -n.size / 2 - 50 } : labelStyle(n.size, n.far)}
      >
        <span className="node__name">{displayName(c)}</span>
        <span className="node__sub">{sub}</span>
      </div>
    </div>
  );
}
