import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { copy } from '../lib/copy';
import { useEscape } from '../lib/escape';
import { toScreen, useGeometry } from '../lib/geometry';
import { useScenario } from '../lib/store';
import type { AgentRole } from '../lib/types';
import { useOutside } from '../lib/useOutside';
import { Icon } from './Icon';
import { Orb } from './Orb';

const ROLES: AgentRole[] = ['builder', 'reviewer', 'tester', 'teammate', 'other'];
const MENU_W = 320;
const MENU_H = 354;
const SUB_W = 200;

/** Frame 02: the add menu, anchored to the + beside You or to the composer's Add node pill. */
export function AddMenu() {
  const addMenu = useScenario((s) => s.addMenu)!;
  const view = useScenario((s) => s.view);
  const closeAddMenu = useScenario((s) => s.closeAddMenu);
  const startDraft = useScenario((s) => s.startDraft);
  const g = useGeometry();
  const stageWidth = useScenario((s) => s.stageWidth);
  const ref = useRef<HTMLDivElement>(null);
  const [subOpen, setSubOpen] = useState(false);

  let left: number;
  let top: number;
  if (addMenu.anchor === 'plus') {
    const p = toScreen(g.plus, g, view);
    // Opens toward the side with room: right of the + when alone (frame 02), left once the + sits left of You.
    left = g.plus.x > g.you.point.x ? p.x + 16 * view.k : p.x - 16 * view.k - MENU_W;
    top = p.y - 120;
  } else {
    // Above the composer's Add node pill; the composer is centred in the stage.
    left = (stageWidth - 640) / 2 + 8;
    top = 816 - MENU_H;
  }
  left = Math.min(Math.max(left, 16), stageWidth - MENU_W - 16);
  top = Math.min(Math.max(top, 48), 812 - MENU_H);
  const subLeft = left + MENU_W + SUB_W + 8 > stageWidth ? -SUB_W - 6 : MENU_W + 6;

  const close = () => {
    closeAddMenu();
    const opener = document.querySelector<HTMLElement>(addMenu.anchor === 'plus' ? '[data-plus]' : '[data-add-node]');
    opener?.focus();
  };

  useEscape(() => (subOpen ? (setSubOpen(false), focusRow(4)) : close()));
  useOutside(ref, closeAddMenu, true, '[data-plus], [data-add-node]');

  const focusRow = (i: number) => ref.current?.querySelectorAll<HTMLElement>('.add-menu__main [role="menuitem"]')[i]?.focus();

  useEffect(() => {
    focusRow(addMenu.highlight ? ROLES.indexOf(addMenu.highlight) : 0);
  }, [addMenu.highlight]);

  useEffect(() => {
    if (subOpen) ref.current?.querySelector<HTMLElement>('.add-menu__sub [role="menuitem"]')?.focus();
  }, [subOpen]);

  const onKey = (e: KeyboardEvent) => {
    const scope = (e.target as Element).closest('[role="menu"]');
    const rows = Array.from(scope?.querySelectorAll<HTMLElement>(':scope > [role="menuitem"], :scope > * > [role="menuitem"]') ?? []);
    const i = rows.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); rows[(i + 1) % rows.length]?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); rows[(i - 1 + rows.length) % rows.length]?.focus(); }
    if (e.key === 'Home') { e.preventDefault(); rows[0]?.focus(); }
    if (e.key === 'End') { e.preventDefault(); rows[rows.length - 1]?.focus(); }
    if (e.key === 'ArrowRight' && (document.activeElement as HTMLElement)?.dataset.role === 'other') { e.preventDefault(); setSubOpen(true); }
    if (e.key === 'ArrowLeft' && subOpen) { e.preventDefault(); setSubOpen(false); focusRow(4); }
    if (e.key === 'Tab') closeAddMenu();
  };

  return (
    <div ref={ref} className="add-menu" style={{ left, top }} onKeyDown={onKey}>
      <div className="pmr-glass menu add-menu__main" role="menu" aria-label={copy.addMenu.label}>
        <p className="pmr-label add-menu__label" aria-hidden="true">{copy.addMenu.label}</p>
        {ROLES.map((role) => {
          const r = copy.roles[role];
          const isOther = role === 'other';
          return (
            <button
              key={role}
              type="button"
              role="menuitem"
              tabIndex={-1}
              data-role={role}
              className={`menu__row add-menu__row${addMenu.highlight === role ? ' is-highlight' : ''}${isOther && subOpen ? ' is-open' : ''}`}
              aria-haspopup={isOther ? 'menu' : undefined}
              aria-expanded={isOther ? subOpen : undefined}
              onClick={() => (isOther ? setSubOpen((o) => !o) : startDraft(role))}
              onPointerEnter={() => isOther || setSubOpen(false)}
            >
              {role === 'teammate' ? (
                <span className="add-menu__icon"><Icon name="person-add" /></span>
              ) : isOther ? (
                <span className="add-menu__icon"><Icon name="add" /></span>
              ) : (
                <Orb role={role} size={32} />
              )}
              <span className="add-menu__text">
                <span className="add-menu__title">{r.menuTitle}</span>
                <span className="add-menu__body">{r.menuBody}</span>
              </span>
              {isOther && <Icon name="chevron-right" className="add-menu__chevron" />}
            </button>
          );
        })}
        <div className="add-menu__footer">{copy.addMenu.footer}</div>
      </div>
      {subOpen && (
        <div className="pmr-glass menu add-menu__sub" role="menu" aria-label={copy.roles.other.menuTitle} style={{ left: subLeft, top: 52 * 4 + 40 }}>
          {copy.roles.other.subtypes.map((type) => (
            <button key={type} type="button" role="menuitem" tabIndex={-1} className="menu__row" onClick={() => startDraft('other', type)}>
              {type}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
