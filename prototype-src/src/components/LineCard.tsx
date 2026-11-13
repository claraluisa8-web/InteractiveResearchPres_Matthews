import { useRef } from 'react';
import { copy, t } from '../lib/copy';
import { useEscape } from '../lib/escape';
import { SUGGESTED_ID, toScreen, useGeometry } from '../lib/geometry';
import { topSections } from '../lib/sections';
import { firstOf, useScenario } from '../lib/store';
import { useOutside } from '../lib/useOutside';
import type { LineHover } from './Constellation';
import { Icon } from './Icon';

const W = 280;

/** Line hover card: who the line connects and what's on it. */
interface LineCardProps {
  hover: LineHover;
  onClose: () => void;
  /** Keep the card while the pointer is on it, so its link can be clicked. */
  onStay: () => void;
  onLeave: () => void;
}

export function LineCard({ hover, onClose, onStay, onLeave }: LineCardProps) {
  const collaborators = useScenario((s) => s.collaborators);
  const issueRaised = useScenario((s) => s.milestones.issueRaised);
  const openSections = useScenario((s) => s.openSections);
  const view = useScenario((s) => s.view);
  const g = useGeometry();
  const ref = useRef<HTMLDivElement>(null);
  useEscape(onClose, hover.pinned);
  useOutside(ref, onClose, hover.pinned, '.line-group');

  const reviewer = firstOf(collaborators, 'reviewer');
  const nameOf = (id: string) =>
    id === 'you' ? copy.people.you.displayName
      : id === SUGGESTED_ID ? copy.roles.tester.defaultName
        : collaborators.find((c) => c.id === id)?.name ?? '';
  const lc = copy.constellation.lineCard;
  const kind = hover.line.kind;
  const reviewing = collaborators.find((c) => (c.id === hover.line.a || c.id === hover.line.b) && c.review === 'pending');
  const body =
    kind === 'issue' ? copy.issueLine.hoverBody
      : kind === 'cleared' ? t(lc.cleared)
        : kind === 'pending' && reviewing ? t(lc.review, { teammate: reviewing.name })
      : kind === 'working' ? t(lc.working)
        : kind === 'suggested' ? t(lc.suggested, { reviewer: reviewer?.name })
          : t(lc.connected);
  // Every real line can show its sections once the agents have raised something (off-path table).
  const seeSections = kind !== 'suggested' && kind !== 'pending' && (kind === 'issue' || issueRaised);
  // Off-path table: a non-issue line's card also says how many sections it carries.
  const roleOf = (id: string) => (id === 'you' ? 'you' : collaborators.find((c) => c.id === id)?.role);
  const ends = [roleOf(hover.line.a), roleOf(hover.line.b)];
  const onLine = issueRaised
    ? topSections(collaborators).filter((d) => d.line.length === 2 && d.line.every((r) => ends.includes(r))).length
    : 0;
  const countText = onLine === 1 ? t(lc.sectionCountOne) : onLine > 1 ? t(lc.sectionCount, { n: onLine }) : '';
  const at = toScreen(hover.at, g, view);
  const left = Math.min(Math.max(at.x - W / 2, 16), 1440 - W - 16);
  const top = Math.min(at.y + 18, 740);

  return (
    <div
      ref={ref}
      className={`pmr-glass line-card${kind === 'issue' ? ' line-card--issue' : ''}`}
      style={{ left, top, width: W }}
      role={hover.pinned ? 'dialog' : 'tooltip'}
      onPointerEnter={onStay}
      onPointerLeave={onLeave}
    >
      <p className="line-card__title">
        <span>{nameOf(hover.line.a)}</span>
        <Icon name="arrow-both" label="and" />
        <span>{nameOf(hover.line.b)}</span>
      </p>
      <p className="line-card__body">{kind !== 'issue' && countText ? `${body}  ·  ${countText}` : body}</p>
      {seeSections && (
        <button
          type="button"
          className="link-button"
          onClick={() => {
            openSections([hover.line.a, hover.line.b]);
            onClose();
          }}
        >
          {copy.issueLine.hoverAction}
          <Icon name="arrow-right" size={14} />
        </button>
      )}
    </div>
  );
}
