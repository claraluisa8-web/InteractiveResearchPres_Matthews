import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { copy, t } from '../lib/copy';
import { Icon } from './Icon';

type Tab = 'constellation' | 'code';

interface TitleBarProps {
  activeTab: Tab;
  onTab: (tab: Tab) => void;
  onStartOver: () => void;
  onAbout: () => void;
}

export function TitleBar({ activeTab, onTab, onStartOver, onAbout }: TitleBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const items = [
    { id: 'start-over', label: t(copy.chrome.overflowMenu.startOver), run: onStartOver },
    { id: 'about', label: t(copy.chrome.overflowMenu.about), run: onAbout },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    buttonRef.current?.focus();
  };

  const onMenuKey = (e: KeyboardEvent) => {
    const rows = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const i = rows.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); rows[(i + 1) % rows.length]?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); rows[(i - 1 + rows.length) % rows.length]?.focus(); }
    if (e.key === 'Escape') { e.stopPropagation(); closeMenu(); }
    if (e.key === 'Tab') setMenuOpen(false);
  };

  const tab = (id: Tab, icon: string, iconSize: number, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === id}
      className={`titlebar__tab titlebar__tab--${id}${activeTab === id ? ' is-active' : ''}`}
      onClick={() => onTab(id)}
    >
      <Icon name={icon} size={iconSize} />
      <span>{label}</span>
    </button>
  );

  return (
    <header className="titlebar">
      <div className="titlebar__lights" aria-hidden="true">
        <span /><span /><span />
      </div>
      <div className="titlebar__tabs" role="tablist" aria-label="Views">
        {tab('constellation', 'git-commit', 16.5, copy.tabs.constellation)}
        {tab('code', 'files', 14, copy.tabs.code)}
      </div>
      <span className="titlebar__sep" aria-hidden="true" />
      <p className="titlebar__title">{copy.project.windowTitle}</p>
      <button
        ref={buttonRef}
        type="button"
        className="titlebar__more"
        aria-label={t(copy.chrome.overflowLabel)}
        title={t(copy.chrome.overflowLabel)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <Icon name="ellipsis" />
      </button>
      {menuOpen && (
        <div ref={menuRef} className="pmr-glass menu titlebar__menu" role="menu" aria-label={t(copy.chrome.overflowLabel)} onKeyDown={onMenuKey}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              tabIndex={-1}
              className="menu__row"
              onClick={() => { setMenuOpen(false); item.run(); }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
