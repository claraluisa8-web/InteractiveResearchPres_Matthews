import { copy, t } from '../lib/copy';
import { displayName, mateTone, subtitleFor } from '../lib/status';
import { SUGGESTED_ID, countOpen } from '../lib/geometry';
import { firstOf, useScenario } from '../lib/store';
import { Icon } from './Icon';
import { Orb } from './Orb';
import { RailFooter } from './SessionHistory';

/** Team rail (from frame 05 on): appears once three or more are in the constellation, You included. */
export function TeamRail({ showFit, onFit, onToast }: { showFit: boolean; onFit: () => void; onToast: (message: string) => void }) {
  const collaborators = useScenario((s) => s.collaborators);
  const popover = useScenario((s) => s.popover);
  const openPopover = useScenario((s) => s.openPopover);
  const setHoverId = useScenario((s) => s.setHoverId);
  const recommendation = useScenario((s) => s.recommendation);
  const setRecCardOpen = useScenario((s) => s.setRecCardOpen);
  const suggestion = recommendation === 'shown' || recommendation === 'dismissed';
  const issueRaised = useScenario((s) => s.milestones.issueRaised);
  const issues = useScenario((s) => s.issues);
  const reviewer = firstOf(collaborators, 'reviewer');
  const builder = firstOf(collaborators, 'builder');
  // Red "!" flags on both ends of the issue line while it has open issues (frame 06).
  const flagged = issueRaised && countOpen(issues) > 0 ? new Set([builder?.id, reviewer?.id]) : new Set<string | undefined>();
  const allClear = useScenario((s) => s.milestones.allSectionsVerified);
  // Frame 08: mint checks on every agent; the teammate's comes with the approval.
  const checkedRow = (id: string) => {
    const c = collaborators.find((x) => x.id === id);
    if (!c) return false;
    return c.role === 'teammate' ? c.review === 'approved' : allClear && c.status === 'active';
  };
  const rows = [
    { id: 'you', role: 'you' as const, name: copy.people.you.displayName, sub: copy.people.you.fullName, draft: false, otherType: undefined },
    ...collaborators.map((c) => ({ id: c.id, role: c.role, name: displayName(c), sub: subtitleFor(c, collaborators), draft: c.status === 'draft' || c.status === 'suggested', otherType: c.otherType })),
    // Frame 05 lists the suggested tester with a dashed icon.
    ...(suggestion && reviewer
      ? [{ id: SUGGESTED_ID, role: 'tester' as const, name: copy.roles.tester.defaultName, sub: t(copy.recommendation.suggestedSubtitle, { reviewer: reviewer.name }), draft: true, otherType: undefined }]
      : []),
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
              disabled={r.draft && r.id !== SUGGESTED_ID}
              onPointerEnter={() => setHoverId(r.id)}
              onPointerLeave={() => setHoverId(null)}
              onFocus={() => setHoverId(r.id)}
              onBlur={() => setHoverId(null)}
              onClick={() =>
                r.id === SUGGESTED_ID || (suggestion && r.id === reviewer?.id) ? setRecCardOpen(true) : openPopover(popover === r.id ? null : r.id)
              }
            >
              <span className={r.draft ? 'rail__ghost' : undefined}>
                <Orb role={r.role} size={24} name={r.name} otherType={r.otherType} outline={r.draft} tone={mateTone(r.id, collaborators)} />
              </span>
              <span className="rail__text">
                <span className="rail__name">{r.name}</span>
                <span className="rail__sub">{r.sub}</span>
              </span>
              {checkedRow(r.id) ? (
                <span className="rail__marker rail__marker--check" aria-hidden="true"><Icon name="check" size={12} /></span>
              ) : flagged.has(r.id) ? (
                <span className="rail__marker rail__marker--issue" aria-hidden="true">{copy.issueLine.teamRailFlag}</span>
              ) : suggestion && r.id === reviewer?.id && <span className="rail__marker rail__marker--suggestion" aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ul>
      <RailFooter onToast={onToast} />
    </nav>
  );
}

function FitButton({ onFit, standalone }: { onFit: () => void; standalone?: boolean }) {
  const label = t(copy.constellation.showWholeTeam);
  return (
    <button type="button" className={standalone ? 'pmr-glass fit-button fit-button--standalone' : 'fit-button'} onClick={onFit}>
      <Icon name="screen-full" size={14} />
      <span>{label}</span>
    </button>
  );
}
