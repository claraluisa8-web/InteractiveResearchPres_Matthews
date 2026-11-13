import { useEffect, useRef, useState } from 'react';
import { copy, t } from '../lib/copy';
import { useEscape } from '../lib/escape';
import { toScreen, useGeometry } from '../lib/geometry';
import { subtitleFor } from '../lib/status';
import { firstOf, useScenario } from '../lib/store';
import { useOutside } from '../lib/useOutside';
import { Orb } from './Orb';

const W = 280;
const p = copy.constellation.popover;

/** Off-path: clicking any orb shows who it is and what you can do with it. */
export function AgentPopover() {
  const id = useScenario((s) => s.popover)!;
  const collaborators = useScenario((s) => s.collaborators);
  const view = useScenario((s) => s.view);
  const openPopover = useScenario((s) => s.openPopover);
  const editCollaborator = useScenario((s) => s.editCollaborator);
  const removeCollaborator = useScenario((s) => s.removeCollaborator);
  const setSpecOpen = useScenario((s) => s.setSpecOpen);
  const buildStarted = useScenario((s) => s.milestones.buildStarted);
  const openFile = useScenario((s) => s.openFile);
  const [confirming, setConfirming] = useState(false);
  const g = useGeometry();
  const ref = useRef<HTMLDivElement>(null);
  const node = g.byId(id);
  const c = collaborators.find((x) => x.id === id);

  const close = () => {
    if (confirming) return setConfirming(false);
    openPopover(null);
    document.querySelector<HTMLElement>(`[data-orb="${id}"]`)?.focus();
  };
  useEscape(close);
  useOutside(ref, () => openPopover(null), true, '.orb-button, .rail__row');
  useEffect(() => {
    setConfirming(false);
    ref.current?.querySelector<HTMLElement>('button')?.focus();
  }, [id]);
  useEffect(() => {
    // Cancel is the default in the remove confirm.
    if (confirming) ref.current?.querySelector<HTMLElement>('[data-cancel]')?.focus();
  }, [confirming]);

  if (!node) return null;
  const at = toScreen(node.point, g, view);
  const r = (node.size / 2) * view.k;
  let left = at.x + r + 18;
  if (left + W > 1424) left = at.x - r - 18 - W;
  const top = Math.min(Math.max(at.y - 40, 48), 600);

  const youView = !c;
  // Removing the builder or reviewer mid-build takes the line's open work with it, so ask first.
  const isLineAgent = !!c && (firstOf(collaborators, 'builder')?.id === c.id || firstOf(collaborators, 'reviewer')?.id === c.id);
  const remove = () => (c && buildStarted && isLineAgent && !confirming ? setConfirming(true) : c && removeCollaborator(c.id));
  const rc = copy.constellation.removeConfirm;
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
      {confirming && c ? (
        <div className="popover__confirm" role="alertdialog" aria-labelledby="remove-title">
          <p className="popover__name" id="remove-title">{t(rc.title, { name: c.name })}</p>
          <p className="popover__meta popover__meta--wrap">{t(rc.body, { name: c.name })}</p>
          <div className="popover__actions">
            <button type="button" className="pmr-button pmr-button--secondary" data-cancel onClick={() => setConfirming(false)}>{t(rc.cancel)}</button>
            <button type="button" className="pmr-button pmr-button--secondary" onClick={() => removeCollaborator(c.id)}>{t(rc.confirm)}</button>
          </div>
        </div>
      ) : (
      <div className="popover__actions">
        {youView ? (
          <button type="button" className="pmr-button pmr-button--secondary" onClick={() => setSpecOpen(true)}>{t(p.openSpec)}</button>
        ) : (
          <>
            <button type="button" className="pmr-button pmr-button--secondary" onClick={() => editCollaborator(c.id)}>{t(p.edit)}</button>
            {c.role === 'builder' && buildStarted && (
              <button type="button" className="pmr-button pmr-button--secondary" onClick={() => openFile(copy.build.floatingFile.file)}>
                {t(p.openFile, { file: copy.build.floatingFile.file })}
              </button>
            )}
            <button type="button" className="pmr-button pmr-button--secondary" onClick={remove}>{t(p.remove)}</button>
          </>
        )}
      </div>
      )}
    </div>
  );
}
