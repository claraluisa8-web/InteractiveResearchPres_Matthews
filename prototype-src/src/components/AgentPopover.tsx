import { useEffect, useRef } from 'react';
import { copy, t } from '../lib/copy';
import { useEscape } from '../lib/escape';
import { toScreen, useGeometry } from '../lib/geometry';
import { subtitleFor } from '../lib/status';
import { useScenario } from '../lib/store';
import { useOutside } from '../lib/useOutside';
import { Orb } from './Orb';

const W = 280;
const p = copy.constellation.popover;

/** Off-path: clicking any orb shows who it is and what you can do with it. */
export function AgentPopover({ onNotYet }: { onNotYet: () => void }) {
  const id = useScenario((s) => s.popover)!;
  const collaborators = useScenario((s) => s.collaborators);
  const view = useScenario((s) => s.view);
  const openPopover = useScenario((s) => s.openPopover);
  const editCollaborator = useScenario((s) => s.editCollaborator);
  const removeCollaborator = useScenario((s) => s.removeCollaborator);
  const setSpecOpen = useScenario((s) => s.setSpecOpen);
  const g = useGeometry();
  const ref = useRef<HTMLDivElement>(null);
  const node = g.byId(id);
  const c = collaborators.find((x) => x.id === id);

  const close = () => {
    openPopover(null);
    document.querySelector<HTMLElement>(`[data-orb="${id}"]`)?.focus();
  };
  useEscape(close);
  useOutside(ref, () => openPopover(null), true, '.orb-button, .rail__row');
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button')?.focus();
  }, [id]);

  if (!node) return null;
  const at = toScreen(node.point, g, view);
  const r = (node.size / 2) * view.k;
  let left = at.x + r + 18;
  if (left + W > 1424) left = at.x - r - 18 - W;
  const top = Math.min(Math.max(at.y - 40, 48), 600);

  const youView = !c;
  const name = c ? c.name : copy.people.you.fullName;
  const roleLabel = c ? copy.roles[c.role].menuTitle + (c.otherType ? `  ·  ${c.otherType}` : '') : t(p.youRole);

  return (
    <div ref={ref} className="pmr-glass popover" style={{ left, top, width: W }} role="dialog" aria-label={name}>
      <header className="popover__header">
        <Orb role={c?.role ?? 'you'} size={28} name={name} otherType={c?.otherType} />
        <div>
          <p className="popover__name">{name}</p>
          <p className="popover__meta">{roleLabel}</p>
        </div>
      </header>
      {c && (
        <dl className="popover__facts">
          {c.role !== 'teammate' && (
            <>
              <dt>{t(p.configuration)}</dt>
              <dd>{c.configuration}</dd>
            </>
          )}
          <dt>{t(p.status)}</dt>
          <dd>{subtitleFor(c, collaborators)}</dd>
          {c.role !== 'teammate' && <dd className="popover__note">{t(c.crossTeamRequests ? p.crossTeamOn : p.crossTeamOff)}</dd>}
        </dl>
      )}
      <div className="popover__actions">
        {youView ? (
          <button type="button" className="pmr-button pmr-button--secondary" onClick={() => setSpecOpen(true)}>{t(p.openSpec)}</button>
        ) : (
          <>
            <button type="button" className="pmr-button pmr-button--secondary" onClick={() => editCollaborator(c.id)}>{t(p.edit)}</button>
            {c.role === 'builder' && (
              // The builder's files exist once the build starts (phase 2).
              <button type="button" className="pmr-button pmr-button--secondary" onClick={onNotYet}>
                {t(p.openFile, { file: copy.build.floatingFile.file })}
              </button>
            )}
            <button type="button" className="pmr-button pmr-button--secondary" onClick={() => removeCollaborator(c.id)}>{t(p.remove)}</button>
          </>
        )}
      </div>
    </div>
  );
}
