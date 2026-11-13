import { FormEvent, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { copy, t } from '../lib/copy';
import { useEscape } from '../lib/escape';
import { log } from '../lib/log';
import { saveTeam, startNewSession, useSavedTeams, type SavedTeam } from '../lib/savedTeams';
import { useScenario } from '../lib/store';
import { usePopupFocus } from '../lib/usePopupFocus';
import { useOutside } from '../lib/useOutside';
import { Icon } from './Icon';

const sh = copy.sessionHistory;
const st = copy.saveTeam;

/**
 * Feedback round 4: the team rail's footer. "Session history" drops down the receipt and recap for
 * this session and the saved constellations; "Save constellation" keeps the team for other work.
 */
export function RailFooter({ onToast }: { onToast: (message: string) => void }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const saveRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="rail__footer">
      <div className="rail__history-wrap">
        <button
          type="button"
          className={`rail__footer-button${historyOpen ? ' is-open' : ''}`}
          aria-haspopup="menu"
          aria-expanded={historyOpen}
          data-history-button
          onClick={() => setHistoryOpen((o) => !o)}
        >
          <Icon name="history" size={14} />
          <span>{t(sh.button)}</span>
          <Icon name="chevron-down" size={12} />
        </button>
        {historyOpen && <HistoryMenu onClose={() => setHistoryOpen(false)} />}
      </div>
      <button
        ref={saveRef}
        type="button"
        className="rail__footer-button rail__footer-button--icon"
        aria-label={t(st.button)}
        data-tip={t(st.button)}
        data-save-team
        onClick={() => setSaveOpen(true)}
      >
        <Icon name="save" size={14} />
      </button>
      {saveOpen && (
        <SaveTeamDialog
          onClose={() => { setSaveOpen(false); requestAnimationFrame(() => saveRef.current?.focus()); }}
          onSaved={(msg) => { setSaveOpen(false); onToast(msg); }}
        />
      )}
    </div>
  );
}

function HistoryMenu({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const allClear = useScenario((s) => s.milestones.allSectionsVerified);
  const merged = useScenario((s) => s.milestones.merged);
  const setRightPanel = useScenario((s) => s.setRightPanel);
  const teams = useSavedTeams();
  const [openTeam, setOpenTeam] = useState<string | null>(null);
  useEscape(() => { onClose(); document.querySelector<HTMLElement>('[data-history-button]')?.focus(); });
  useOutside(ref, onClose, true, '[data-history-button]');
  usePopupFocus(ref, '[role="menuitem"]:not([aria-disabled="true"])');
  const open = (panel: 'receipt' | 'recap') => {
    log('click', { target: `history:${panel}` });
    setRightPanel(panel);
    onClose();
  };
  // Portalled to the stage: a glass layer nested in the rail's glass loses its blur, and orbs drew over it.
  const host = document.querySelector('.stage');
  if (!host) return null;
  return createPortal(
    <div ref={ref} className="pmr-glass menu history-menu" role="menu" aria-label={t(sh.button)}>
      <p className="pmr-label history-menu__label">{t(sh.thisSession)}</p>
      <p className="history-menu__session">{t(sh.sessionTitle)}</p>
      <button type="button" role="menuitem" className="menu__row history-menu__row" aria-disabled={!allClear} onClick={() => allClear && open('receipt')}>
        <Icon name="checklist" size={14} />{t(sh.receipt)}
      </button>
      {merged && (
        <button type="button" role="menuitem" className="menu__row history-menu__row" onClick={() => open('recap')}>
          <Icon name="git-merge" size={14} />{t(sh.recap)}
        </button>
      )}
      {merged && (
        <button type="button" role="menuitem" className="menu__row history-menu__row" onClick={() => open('recap')}>
          <Icon name="comment-discussion" size={14} />{t(sh.conversations)}
        </button>
      )}
      {!allClear && <p className="history-menu__empty">{t(sh.nothingYet)}</p>}
      {merged && (
        <button type="button" role="menuitem" className="menu__row history-menu__row" data-new-session-menu onClick={() => { log('click', { target: 'newSession:history' }); startNewSession(t(sh.sessionTitle)); }}>
          <Icon name="refresh" size={14} />{t(sh.newSession)}
        </button>
      )}
      {teams.length > 0 && (
        <>
          <p className="pmr-label history-menu__label history-menu__label--saved">{t(sh.savedTeams)}</p>
          {teams.map((team) => (
            <div key={team.id}>
              <button
                type="button"
                role="menuitem"
                className="menu__row history-menu__row history-menu__team"
                aria-expanded={openTeam === team.id}
                onClick={() => setOpenTeam((o) => (o === team.id ? null : team.id))}
              >
                <Icon name="organization" size={14} />
                <span className="history-menu__team-text">
                  <span>{team.name}</span>
                  <span className="history-menu__meta">{teamMeta(team)}</span>
                </span>
                <Icon name={openTeam === team.id ? 'chevron-up' : 'chevron-down'} size={12} />
              </button>
              {openTeam === team.id && <TeamDetail team={team} />}
            </div>
          ))}
        </>
      )}
    </div>,
    host,
  );
}

function teamMeta(team: SavedTeam) {
  const n = team.sessions.length;
  const sessions = n === 0 ? t(sh.sessionsNone) : n === 1 ? t(sh.sessionsOne) : t(sh.sessionsMany, { n });
  return t(sh.savedMeta, { n: team.members.length, sessions });
}

function TeamDetail({ team }: { team: SavedTeam }) {
  return (
    <div className="history-menu__detail">
      <p className="pmr-label">{t(st.membersLabel)}</p>
      <ul className="history-menu__members">
        {team.members.map((m) => <li key={m.id}>{m.name}</li>)}
      </ul>
      {team.sessions.map((s) => (
        <details key={s.title} className="history-menu__saved-session">
          <summary>{t(sh.savedSession, { title: s.title, status: t(s.merged ? sh.statusMerged : sh.statusOpen) })}</summary>
          {s.conversations.map((c) => (
            <div key={c.name} className="history-menu__conversation">
              <p className="history-menu__who">{c.name}</p>
              {c.messages.map((m, i) => (
                <p key={i} className="history-menu__message"><span className="history-menu__from">{m.from === 'you' ? t(copy.teammateReview.you) : c.name.split(' ')[0]}</span>{m.text}</p>
              ))}
            </div>
          ))}
        </details>
      ))}
    </div>
  );
}

function SaveTeamDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (message: string) => void }) {
  const ref = useRef<HTMLFormElement>(null);
  const savedTeamId = useScenario((s) => s.savedTeamId);
  const setSavedTeamId = useScenario((s) => s.setSavedTeamId);
  const teams = useSavedTeams();
  const existing = teams.find((x) => x.id === savedTeamId);
  const [name, setName] = useState(existing?.name ?? t(st.nameDefault));
  const [opts, setOpts] = useState(existing?.options ?? { agents: true, teammates: true, history: true, isDefault: false });
  const [error, setError] = useState(false);
  useEscape(onClose);
  usePopupFocus(ref, 'input[type="text"]', { trap: true });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError(true); ref.current?.querySelector<HTMLElement>('input[type="text"]')?.focus(); return; }
    const team = saveTeam({ id: savedTeamId, name: name.trim(), options: opts, sessionTitle: t(sh.sessionTitle) });
    setSavedTeamId(team.id);
    log('click', { target: 'saveTeam', options: opts });
    onSaved(t(existing ? st.updatedToast : st.savedToast, { name: team.name }));
  };
  const toggle = (k: keyof typeof opts) => setOpts((o) => ({ ...o, [k]: !o[k] }));
  const rows: [keyof typeof opts, { text: string }][] = [
    ['agents', st.optAgents], ['teammates', st.optTeammates], ['history', st.optHistory], ['isDefault', st.optDefault],
  ];
  const host = document.querySelector('.stage');
  if (!host) return null;
  return createPortal(
    <div className="scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <form ref={ref} className="pmr-glass dialog save-team" role="dialog" aria-modal="true" aria-labelledby="save-team-title" onSubmit={submit} noValidate>
        <h2 id="save-team-title" className="dialog__title">{t(st.title)}</h2>
        <p className="dialog__body">{t(st.body)}</p>
        <label className="field">
          <span className="pmr-label field__label">{t(st.nameLabel)}</span>
          <input
            type="text"
            className={`input${error ? ' is-invalid' : ''}`}
            value={name}
            aria-invalid={error}
            aria-describedby={error ? 'save-team-error' : undefined}
            onChange={(e) => { setName(e.target.value); setError(false); }}
          />
          {error && <span id="save-team-error" className="field__error">{t(st.nameError)}</span>}
        </label>
        <fieldset className="field save-team__options">
          <legend className="pmr-label field__label">{t(st.include)}</legend>
          {rows.map(([k, label]) => (
            <label key={k} className="checkbox">
              <input type="checkbox" checked={opts[k]} onChange={() => toggle(k)} />
              <span className="checkbox__box" aria-hidden="true"><Icon name="check" size={12} /></span>
              <span>{t(label)}</span>
            </label>
          ))}
        </fieldset>
        <div className="dialog__actions">
          <button type="button" className="pmr-button pmr-button--secondary" onClick={onClose}>{t(st.cancel)}</button>
          <button type="submit" className="pmr-button" data-save-team-confirm>{t(st.save)}</button>
        </div>
      </form>
    </div>,
    host,
  );
}
