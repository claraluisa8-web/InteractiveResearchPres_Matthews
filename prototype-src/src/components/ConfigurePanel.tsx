import { FormEvent, useEffect, useRef, useState } from 'react';
import { copy, t } from '../lib/copy';
import { useEscape } from '../lib/escape';
import { active, defaultName, useScenario } from '../lib/store';
import type { Collaborator } from '../lib/types';
import { log } from '../lib/log';
import { useOutside } from '../lib/useOutside';
import { Icon } from './Icon';
import { Orb } from './Orb';

const f = copy.configurePanel.fields;

/** Frame 03: set up a new collaborator (ghost orb in its slot) or edit an existing one. */
export function ConfigurePanel() {
  const configure = useScenario((s) => s.configure)!;
  const collaborators = useScenario((s) => s.collaborators);
  const updateDraft = useScenario((s) => s.updateDraft);
  const commit = useScenario((s) => s.commitConfigure);
  const cancel = useScenario((s) => s.cancelConfigure);
  const c = collaborators.find((x) => x.id === configure.id)!;
  const isNew = configure.mode === 'new';
  const others = active(collaborators).filter((x) => x.id !== c.id);
  const linkedIds = [...new Set([...c.connectsTo, ...others.filter((o) => o.connectsTo.includes(c.id)).map((o) => o.id)])];

  const [form, setForm] = useState({
    name: configure.prefillName ?? c.name,
    otherType: c.otherType,
    configuration: c.configuration,
    crossTeamRequests: c.crossTeamRequests,
    allowedToEdit: c.allowedToEdit,
    connectsTo: linkedIds,
  });
  const [connectOpen, setConnectOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const connectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, [configure.id]);

  useEscape(() => (connectOpen ? setConnectOpen(false) : cancelAndReturn()));
  useOutside(connectRef, () => setConnectOpen(false), connectOpen);

  const patch = (p: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...p }));
    // The ghost orb's label follows the NAME field live.
    if (isNew && (p.name !== undefined || p.otherType !== undefined)) updateDraft(p as Partial<Collaborator>);
  };

  const onType = (type: string) => {
    // Keep a custom name; swap the default one to match the new type.
    const untouched = !form.name.trim() || form.name === defaultName('other', form.otherType);
    patch({ otherType: type, ...(untouched ? { name: defaultName('other', type) } : {}) });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    log('input', { field: 'name', text: form.name, role: c.role });
    commit(form);
    // Keyboard path: focus lands on the orb that just joined (or was edited).
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-orb="${c.id}"]`)?.focus());
  };
  const cancelAndReturn = () => {
    cancel();
    requestAnimationFrame(() =>
      (document.querySelector<HTMLElement>(isNew ? '[data-plus]' : `[data-orb="${c.id}"]`) ?? document.querySelector<HTMLElement>('[data-plus]'))?.focus(),
    );
  };

  const shownName = form.name.trim() || defaultName(c.role, form.otherType);
  const nameOf = (id: string) => (id === 'you' ? copy.people.you.displayName : collaborators.find((x) => x.id === id)?.name ?? id);
  const connectable = ['you', ...others.map((o) => o.id)].filter((id) => !form.connectsTo.includes(id));
  const toggleEdit = (opt: string, on: boolean) =>
    patch({ allowedToEdit: on ? [...form.allowedToEdit, opt] : form.allowedToEdit.filter((x) => x !== opt) });

  const isTeammate = c.role === 'teammate';

  return (
    <form className="pmr-glass configure" onSubmit={submit} aria-labelledby="configure-title">
      <header className="configure__header">
        {isTeammate ? (
          <span className="configure__teammate-icon"><Icon name="person-add" /></span>
        ) : (
          <Orb role={c.role} size={32} otherType={form.otherType} />
        )}
        <div className="configure__heading">
          <h2 id="configure-title" className="configure__title">{shownName}</h2>
          <p className="configure__subtitle">{copy.configurePanel.subtitle}</p>
        </div>
        <button type="button" className="icon-button configure__close" aria-label={copy.configurePanel.secondary} data-tip={copy.configurePanel.secondary} onClick={cancelAndReturn}>
          <Icon name="close" />
        </button>
      </header>

      <div className="configure__body">
        <label className="field">
          <span className="pmr-label field__label">{f.name}</span>
          <input ref={nameRef} className="input" value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder={defaultName(c.role, form.otherType)} />
        </label>

        {c.role === 'other' && (
          <label className="field">
            <span className="pmr-label field__label">{t(copy.constellation.otherTypeLabel)}</span>
            <span className="select">
              <select value={form.otherType} onChange={(e) => onType(e.target.value)}>
                {copy.roles.other.subtypes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <Icon name="chevron-down" />
            </span>
          </label>
        )}

        {isTeammate ? (
          <>
            <div className="field">
              <span className="pmr-label field__label">{t(copy.constellation.teammateRoleLabel)}</span>
              <div className="input input--locked">{copy.roles.teammate.menuBody}</div>
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <span className="pmr-label field__label">{f.model}</span>
              <div className="input input--locked">
                <Icon name="lock" size={14} />
                <span className="input__value">{copy.project.model.name}</span>
                <span className="input__note">{copy.project.model.lockedNote}</span>
              </div>
            </div>

            <label className="field">
              <span className="pmr-label field__label">{f.configuration}</span>
              <span className="select">
                <select value={form.configuration} onChange={(e) => patch({ configuration: e.target.value })}>
                  {f.configurationOptions.map((o) => <option key={o} value={o}>{o.replace(/\s+·\s+/g, ' · ')}</option>)}
                </select>
                <Icon name="chevron-down" />
              </span>
            </label>

            <label className="checkbox configure__crossteam">
              <input type="checkbox" checked={form.crossTeamRequests} onChange={(e) => patch({ crossTeamRequests: e.target.checked })} />
              <span className="checkbox__box" aria-hidden="true"><Icon name="check" size={12} /></span>
              <span>{f.crossTeamCheckbox}</span>
            </label>

            <label className="field">
              <span className="pmr-label field__label">{f.checksAgainst}</span>
              <span className="select select--mono">
                <select defaultValue={f.checksAgainstValue}>
                  <option value={f.checksAgainstValue}>{f.checksAgainstValue}</option>
                </select>
                <span className="chip chip--small select__chip">{f.checksAgainstChip}</span>
                <Icon name="chevron-down" />
              </span>
            </label>

            <div className="field">
              <span className="pmr-label field__label">{f.strictness}</span>
              <div className="input input--locked">
                <Icon name="lock" size={14} />
                <span className="input__value">{copy.project.strictness.value}</span>
                <span className="input__note">{copy.project.strictness.lockedNote}</span>
              </div>
              <p className="field__help">{copy.project.strictness.help}</p>
            </div>

            <fieldset className="field">
              <legend className="pmr-label field__label">{f.allowedToEdit}</legend>
              <p className="field__help field__help--top">{f.allowedToEditHelp}</p>
              <div className="checkbox-row">
                {f.allowedOptions.filter((o) => o !== f.lockedOption).map((o) => (
                  <label key={o} className="checkbox">
                    <input type="checkbox" checked={form.allowedToEdit.includes(o)} onChange={(e) => toggleEdit(o, e.target.checked)} />
                    <span className="checkbox__box" aria-hidden="true"><Icon name="check" size={12} /></span>
                    <span>{o}</span>
                  </label>
                ))}
                <span className="checkbox is-locked" data-tip={f.lockedHelp}>
                  <span className="checkbox__lock" aria-hidden="true"><Icon name="lock" size={14} /></span>
                  <span>{f.lockedOption}</span>
                </span>
              </div>
              <p className="field__help">{f.lockedHelp}</p>
            </fieldset>
          </>
        )}

        <div className="field field--connects">
          <span className="pmr-label field__label" id="connects-label">{f.connectsTo}</span>
          <div className="chips" role="group" aria-labelledby="connects-label">
            {form.connectsTo.map((id) => (
              <button
                key={id}
                type="button"
                className="chip chip--toggle"
                aria-label={t(copy.constellation.connectRemove, { name: nameOf(id) })}
                data-tip={t(copy.constellation.connectRemove, { name: nameOf(id) })}
                onClick={() => patch({ connectsTo: form.connectsTo.filter((x) => x !== id) })}
              >
                {nameOf(id)}
                <Icon name="close" size={12} />
              </button>
            ))}
            <div className="connect" ref={connectRef}>
              <button type="button" className="chip" aria-haspopup="menu" aria-expanded={connectOpen} onClick={() => setConnectOpen((o) => !o)}>
                {f.connectAction}
              </button>
              {connectOpen && (
                <div className="pmr-glass menu connect__menu" role="menu">
                  {connectable.length === 0 && <p className="connect__empty">{t(copy.constellation.connectNone)}</p>}
                  {connectable.map((id) => (
                    <button
                      key={id}
                      type="button"
                      role="menuitem"
                      className="menu__row"
                      onClick={() => {
                        patch({ connectsTo: [...form.connectsTo, id] });
                        setConnectOpen(false);
                      }}
                    >
                      {nameOf(id)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isTeammate && <p className="field__help configure__invite">{t(copy.constellation.teammateInvite, { name: shownName })}</p>}
      </div>

      <footer className="configure__footer">
        <button type="submit" className="pmr-button configure__primary">
          {isNew ? copy.configurePanel.primary : t(copy.constellation.editPrimary)}
        </button>
        <button type="button" className="pmr-button pmr-button--secondary configure__secondary" onClick={cancelAndReturn}>
          {copy.configurePanel.secondary}
        </button>
      </footer>
    </form>
  );
}
