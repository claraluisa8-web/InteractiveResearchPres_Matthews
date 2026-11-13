import scenario from '../../../handoff/data/scenario.json';

// All UI copy comes from handoff/data/scenario.json (BRIEF §9).
export const copy = scenario;

/** New strings are stored as { text, new: true } so Clara can review them. */
export const t = (s: { text: string }) => s.text;
