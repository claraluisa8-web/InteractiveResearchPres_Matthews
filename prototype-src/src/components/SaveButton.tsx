import { Icon } from './Icon';

/** Save that confirms itself: "Saved" with a check once the file is saved, back to "Save" on the next edit. */
export function SaveButton({ saved, label, savedLabel, className, onClick }: {
  saved: boolean;
  label: string;
  savedLabel: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`pmr-button ${className}${saved ? ' is-saved' : ''}`} onClick={onClick} aria-live="polite">
      {saved && <Icon name="check" size={14} />}
      {saved ? savedLabel : label}
    </button>
  );
}
