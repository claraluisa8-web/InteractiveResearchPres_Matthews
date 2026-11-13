import { FormEvent, useEffect, useRef, useState } from 'react';
import { copy, t } from '../lib/copy';
import { useEscape } from '../lib/escape';
import { active, defaultName, useScenario } from '../lib/store';
import type { Collaborator } from '../lib/types';
import { log } from '../lib/log';
import { initials } from '../lib/status';

const DIRECTORY = copy.people.directory.people;
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
    email: c.email ?? '',
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  // Teammate NAME suggests people from the org directory (feedback round 2); picking one fills the email.
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [connectOpen, setConnectOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const connectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, [configure.id]);

  useEscape(() => (suggestOpen ? setSuggestOpen(false) : connectOpen ? setConnectOpen(false) : cancelAndReturn()));
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
    // A human teammate needs a real name and a work email (for the invite); agents don't.
    let submitted = form;
    if (c.role === 'teammate') {
      // A full name that matches someone in the directory brings their email with it.
      const known = DIRECTORY.find((p) => p.name.toLowerCase() === form.name.trim().toLowerCase());
      if (known && !form.email.trim()) {
        submitted = { ...form, email: known.email };
        setForm(submitted);
      }
      const next: { name?: string; email?: string } = {};
      if (!submitted.name.trim()) next.name = t(copy.constellation.teammateNameRequired);
      if (!submitted.email.trim()) next.email = t(copy.constellation.teammateEmailRequired);
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitted.email.trim())) next.email = t(copy.constellation.teammateEmailInvalid);
      setErrors(next);
      if (next.name || next.email) {
        document.getElementById(next.name ? 'configure-name' : 'configure-email')?.focus();
        return;
      }
    }
    log('input', { field: 'name', text: submitted.name, role: c.role });
    commit(submitted);
    // Keyboard path: focus lands on the orb that just joined (or was edited).
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-orb="${c.id}"]`)?.focus());
  };
  const cancelAndReturn = () => {
    cancel();
    requestAnimationFrame(() =>
      (document.querySelector<HTMLElement>(isNew ? '[data-plus]' : `[data-orb="${c.id}"]`) ?? document.querySelector<HTMLElement>('[data-plus]'))?.focus(),
    );
  };

  const shownName = form.name.trim() || defaultName(c.role, form.otherType) || copy.roles.teammate.menuTitle;
  const nameOf = (id: string) => (id === 'you' ? copy.people.you.displayName : collaborators.find((x) => x.id === id)?.name ?? id);
  const connectable = ['you', ...others.map((o) => o.id)].filter((id) => !form.connectsTo.includes(id));
  const toggleEdit = (opt: string, on: boolean) =>
    patch({ allowedToEdit: on ? [...form.allowedToEdit, opt] : form.allowedToEdit.filter((x) => x !== opt) });

  const isTeammate = c.role === 'teammate';

  // People whose first or last name starts with what's typed (every letter has someone).
  const query = form.name.trim().toLowerCase();
  const suggestions = isTeammate && query
    ? DIRECTORY.filter((p) => p.name.toLowerCase().split(/\s+/).some((part) => part.startsWith(query)) || p.name.toLowerCase().startsWith(query))
        .slice(0, 6)
    : [];
  const showSuggestions = suggestOpen && suggestions.length > 0;
  const pick = (person: { name: string; email: string }) => {
    patch({ name: person.name });
    setForm((prev) => ({ ...prev, name: person.name, email: person.email }));
    setErrors({});
    setSuggestOpen(false);
    requestAnimationFrame(() => document.querySelector<HTMLElement>('.configure__primary')?.focus());
  };

  return (
    <form className="pmr-glass configure" onSubmit={submit} aria-labelledby="configure-title" noValidate>
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
          <input
            ref={nameRef}
            id="configure-name"
            className={`input${errors.name ? ' is-invalid' : ''}`}
            value={form.name}
            onChange={(e) => {
              patch({ name: e.target.value });
              if (errors.name) setErrors((x) => ({ ...x, name: undefined }));
              setSuggestOpen(true);
              setActiveSuggestion(0);
            }}
            onKeyDown={(e) => {
              if (!showSuggestions) return;
              if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSuggestion((i) => (i + 1) % suggestions.length); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSuggestion((i) => (i - 1 + suggestions.length) % suggestions.length); }
              if (e.key === 'Enter') { e.preventDefault(); pick(suggestions[activeSuggestion]); }
            }}
            onBlur={() => window.setTimeout(() => setSuggestOpen(false), 120)}
            placeholder={isTeammate ? t(copy.constellation.teammateNamePlaceholder) : defaultName(c.role, form.otherType)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'configure-name-error' : undefined}
            autoComplete="off"
            {...(isTeammate
              ? {
                  role: 'combobox',
                  'aria-autocomplete': 'list' as const,
                  'aria-expanded': showSuggestions,
                  'aria-controls': 'teammate-suggestions',
                  'aria-activedescendant': showSuggestions ? `teammate-option-${activeSuggestion}` : undefined,
                }
              : {})}
          />
          {showSuggestions && (
            <ul id="teammate-suggestions" className="pmr-glass suggestions" role="listbox" aria-label={t(copy.constellation.teammateSuggestions)}>
              {suggestions.map((p, i) => (
                <li
                  key={p.email}
                  id={`teammate-option-${i}`}
                  role="option"
                  aria-selected={i === activeSuggestion}
                  className={`suggestions__item${i === activeSuggestion ? ' is-active' : ''}`}
                  onPointerDown={(e) => {
                    e.preventDefault(); // keep focus in the field until the pick is made
                    pick(p);
                  }}
                  onPointerEnter={() => setActiveSuggestion(i)}
                >
                  <span className="avatar avatar--small" aria-hidden="true">{initials(p.name)}</span>
                  <span className="suggestions__text">
                    <span className="suggestions__name">{p.name}</span>
                    <span className="suggestions__email">{p.email}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {errors.name && <span id="configure-name-error" className="field__error">{errors.name}</span>}
        </label>

        {isTeammate && (
          <label className="field">
            <span className="pmr-label field__label">{t(copy.constellation.teammateEmailLabel)}</span>
            <input
              id="configure-email"
              type="email"
              className={`input${errors.email ? ' is-invalid' : ''}`}
              value={form.email}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, email: e.target.value }));
                if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
              }}
              placeholder={t(copy.constellation.teammateEmailPlaceholder)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'configure-email-error' : 'configure-email-help'}
              autoComplete="off"
            />
            {errors.email
              ? <span id="configure-email-error" className="field__error">{errors.email}</span>
              : <span id="configure-email-help" className="field__help">{t(copy.constellation.teammateEmailHelp)}</span>}
          </label>
        )}

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
