import { useRef } from 'react';
import { copy, t } from '../lib/copy';
import { useEscape } from '../lib/escape';
import { toScreen, useGeometry } from '../lib/geometry';
import { useScenario } from '../lib/store';
import { useOutside } from '../lib/useOutside';
import type { LineHover } from './Constellation';
import { Icon } from './Icon';

const W = 260;

/** Line hover card: who the line connects and what's on it. */
export function LineCard({ hover, onClose }: { hover: LineHover; onClose: () => void }) {
  const collaborators = useScenario((s) => s.collaborators);
  const view = useScenario((s) => s.view);
  const g = useGeometry();
  const ref = useRef<HTMLDivElement>(null);
  useEscape(onClose, hover.pinned);
  useOutside(ref, onClose, hover.pinned, '.line-group');

  const nameOf = (id: string) => (id === 'you' ? copy.people.you.displayName : collaborators.find((c) => c.id === id)?.name ?? '');
  const at = toScreen(hover.at, g, view);
  const left = Math.min(Math.max(at.x - W / 2, 16), 1440 - W - 16);
  const top = Math.min(at.y + 18, 740);

  return (
    <div ref={ref} className={`pmr-glass line-card${hover.pinned ? '' : ' is-passive'}`} style={{ left, top, width: W }} role={hover.pinned ? 'dialog' : 'tooltip'}>
      <p className="line-card__title">
        <span>{nameOf(hover.line.a)}</span>
        <Icon name="arrow-both" label="and" />
        <span>{nameOf(hover.line.b)}</span>
      </p>
      <p className="line-card__body">{t(copy.constellation.lineCard.connected)}</p>
    </div>
  );
}
