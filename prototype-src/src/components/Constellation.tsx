import { useEffect, useRef, useState } from 'react';
import { copy, t } from '../lib/copy';
import { FLOOR_Y, type Point } from '../lib/layout';
import { useGeometry, type Node } from '../lib/geometry';
import { subtitleFor } from '../lib/status';
import { useScenario } from '../lib/store';
import type { Line } from '../lib/types';
import { usePanZoom } from '../lib/useView';
import { Icon } from './Icon';
import { Orb } from './Orb';

const LINE_GAP = 9; // Clara's rule: lines stop 8–10px short of orbs.

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

  const linked = (id: string) => hoverId === id || popover === id;

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
        <div className="world__layout" style={{ transform: `translate(${g.shift.x}px, ${g.shift.y}px)` }}>
          {/* Floor reflections sit on the grid floor under each orb. */}
          {[g.you, ...g.nodes].map((n) => (
            <span
              key={`floor-${n.id}`}
              className={`floor floor--${n.c?.role ?? 'you'}${n.c?.status === 'draft' ? ' is-draft' : ''}`}
              style={{ left: n.point.x - n.size * 0.45, top: FLOOR_Y - 5, width: n.size * 0.9 }}
            />
          ))}

          <svg className="lines" width="1440" height="900">
            {alone && !configure && <line className="line line--attach" x1={642} y1={500} x2={692} y2={452} />}
            {showCoach && <line className="line line--attach" x1={g.plus.x + 15} y1={g.plus.y - 9} x2={834} y2={392} />}
            {g.lines.map((line) => {
              const a = g.byId(line.a);
              const b = g.byId(line.b);
              if (!a || !b) return null;
              const p = trimmed(a, b);
              const dim = hoverId && line.a !== hoverId && line.b !== hoverId;
              return (
                <g
                  key={line.id}
                  className={`line-group${lineHover === line.id ? ' is-hover' : ''}${dim ? ' is-dim' : ''}`}
                  onPointerEnter={() => line.kind !== 'pending' && lineHoverStart(line, a, b)}
                  onPointerLeave={lineHoverEnd}
                  onClick={() => line.kind !== 'pending' && onLineHover({ line, at: { x: p.mx, y: p.my }, pinned: true })}
                >
                  <line className="line__hit" x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />
                  <line className={`line line--${line.kind}`} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />
                </g>
              );
            })}
          </svg>

          {/* You */}
          <div className="node node--you" style={{ left: g.you.point.x, top: g.you.point.y }}>
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
            title={t(copy.constellation.plusLabel)}
            aria-haspopup="menu"
            aria-expanded={addMenu?.anchor === 'plus'}
            data-plus
            onClick={() => (addMenu?.anchor === 'plus' ? closeAddMenu() : openAddMenu('plus'))}
          >
            <Icon name="add" />
          </button>

          {/* Collaborators */}
          {g.nodes.map((n) => <CollaboratorNode key={n.id} n={n} linked={linked(n.id)} dim={!!hoverId && hoverId !== n.id} />)}

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

function CollaboratorNode({ n, linked, dim }: { n: Node; linked: boolean; dim: boolean }) {
  const collaborators = useScenario((s) => s.collaborators);
  const popover = useScenario((s) => s.popover);
  const openPopover = useScenario((s) => s.openPopover);
  const c = n.c!;
  const draft = c.status === 'draft';
  const sub = subtitleFor(c, collaborators);
  return (
    <div
      className={`node node--${c.role}${n.far ? ' is-far' : ''}${draft ? ' is-draft' : ''}${dim ? ' is-dim' : ''}`}
      style={{ left: n.point.x, top: n.point.y }}
    >
      {draft && <span className="ghost-ring" aria-hidden="true" />}
      {draft ? (
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
          onClick={() => openPopover(popover === c.id ? null : c.id)}
        >
          <Orb role={c.role} size={n.size} name={c.name} otherType={c.otherType} />
        </button>
      )}
      <div className={`node__label${n.far ? ' node__label--right' : ''}`} style={labelStyle(n.size, n.far)}>
        <span className="node__name">{c.name}</span>
        <span className="node__sub">{sub}</span>
      </div>
    </div>
  );
}
