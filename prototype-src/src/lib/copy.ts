import scenario from '../../../handoff/data/scenario.json';

// All UI copy comes from handoff/data/scenario.json (BRIEF §9).
export const copy = scenario;

type Vars = Record<string, string | number | undefined>;

/** New strings are stored as { text, new: true } so Clara can review them. Fills {placeholders}. */
export function t(s: string | { text: string }, vars: Vars = {}) {
  const raw = typeof s === 'string' ? s : s.text;
  return raw.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
}
