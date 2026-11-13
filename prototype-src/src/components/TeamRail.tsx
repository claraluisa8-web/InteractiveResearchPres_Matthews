import { copy, t } from '../lib/copy';
import { subtitleFor } from '../lib/status';
import { useScenario } from '../lib/store';
import { Icon } from './Icon';
import { Orb } from './Orb';

/** Team rail (from frame 05 on): appears once three or more are in the constellation, You included. */
export function TeamRail({ showFit, onFit }: { showFit: boolean; onFit: () => void }) {
  const collaborators = useScenario((s) => s.collaborators);
  const popover = useScenario((s) => s.popover);
  const openPopover = useScenario((s) => s.openPopover);
  const setHoverId = useScenario((s) => s.setHoverId);
  const rows = [
    { id: 'you', role: 'you' as const, name: copy.people.you.displayName, sub: copy.people.you.fullName, draft: false, otherType: undefined },
    ...collaborators.map((c) => ({ id: c.id, role: c.role, name: c.name, sub: subtitleFor(c, collaborators), draft: c.status === 'draft', otherType: c.otherType })),
  ];

  if (rows.length < 3) {
    return showFit ? <FitButton onFit={onFit} standalone /> : null;
  }

  return (
    <nav className="pmr-glass rail" aria-label={t(copy.constellation.teamLabel, { n: rows.length })}>
      <div className="rail__header">
        <span className="pmr-label">{t(copy.constellation.teamLabel, { n: rows.length })}</span>
        {showFit && <FitButton onFit={onFit} />}
      </div>
      <ul className="rail__list">
        {rows.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className={`rail__row${popover === r.id ? ' is-open' : ''}`}
              disabled={r.draft}
              onPointerEnter={() => setHoverId(r.id)}
              onPointerLeave={() => setHoverId(null)}
              onFocus={() => setHoverId(r.id)}
              onBlur={() => setHoverId(null)}
              onClick={() => openPopover(popover === r.id ? null : r.id)}
            >
              <span className={r.draft ? 'rail__ghost' : undefined}>
                <Orb role={r.role} size={24} name={r.name} otherType={r.otherType} outline={r.draft} />
              </span>
              <span className="rail__text">
                <span className="rail__name">{r.name}</span>
                <span className="rail__sub">{r.sub}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function FitButton({ onFit, standalone }: { onFit: () => void; standalone?: boolean }) {
  const label = t(copy.constellation.showWholeTeam);
  return (
    <button type="button" className={standalone ? 'pmr-glass fit-button fit-button--standalone' : 'fit-button'} onClick={onFit} title={label}>
      <Icon name="screen-full" size={14} />
      <span>{label}</span>
    </button>
  );
}
