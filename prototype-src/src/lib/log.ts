import { affordanceName, expectedStep } from './expected';
import { useScenario } from './store';
import type { Milestones } from './types';

// Session logging for usability tests (docs/logging.md). Off unless the URL has ?test=1 or ?test=P1.
// Nothing leaves the browser: events live in memory and in localStorage under pmr:session:<id>.

export interface LogEvent {
  t: number;
  type: 'session' | 'milestone' | 'click' | 'input' | 'edit' | 'save' | 'hint' | 'offPath' | 'fallback' | 'toast';
  [extra: string]: unknown;
}

const params = new URLSearchParams(window.location.search);
const testParam = params.get('test');
export const LOGGING = testParam !== null;
export const QUIET = params.get('quiet') === '1';
export const PARTICIPANT = testParam && testParam !== '1' && testParam !== '' ? testParam : 'anonymous';

const CURRENT = 'pmr:session:current';

interface SessionMeta { id: string; participant: string; startedAt: number }

let meta: SessionMeta | null = null;
let events: LogEvent[] = [];

const store = {
  read<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  write(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or blocked: the in-memory log still exports.
    }
  },
};

function persist() {
  if (!meta) return;
  store.write(`pmr:session:${meta.id}`, events);
}

function newSession() {
  meta = { id: `${PARTICIPANT}-${Date.now().toString(36)}`, participant: PARTICIPANT, startedAt: Date.now() };
  events = [];
  store.write(CURRENT, meta);
  log('session', {
    participant: PARTICIPANT,
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  });
  log('milestone', { id: 'M0', msSinceStart: 0, msSincePrevMilestone: 0 });
}

/** Continue the same participant's session across refreshes; otherwise start fresh. */
export function startLogging() {
  if (!LOGGING) return;
  const current = store.read<SessionMeta>(CURRENT);
  if (current && current.participant === PARTICIPANT) {
    meta = current;
    events = store.read<LogEvent[]>(`pmr:session:${current.id}`) ?? [];
  } else {
    newSession();
  }
  watchMilestones();
  watchEdits();
  document.addEventListener('click', onClick, true);
}

export function log(type: LogEvent['type'], extra: Record<string, unknown> = {}) {
  if (!LOGGING || !meta) return;
  const s = useScenario.getState();
  const e: LogEvent = { t: Math.round((Date.now() - meta.startedAt) / 10) / 100, type, state: expectedStep(s).key, ...extra };
  events.push(e);
  persist();
}

/** Start over: keep the log (same recording) or clear it (a new session). */
export function resetLog(keep: boolean) {
  if (!LOGGING) return;
  if (!keep) {
    try {
      localStorage.removeItem(CURRENT);
    } catch {
      /* nothing to clear */
    }
  } else {
    log('session', { participant: PARTICIPANT, note: 'Start over (log kept)' });
  }
}

// ---------------------------------------------------------------------------
// Milestones (flow-and-milestones.md numbering)

const MILESTONE_IDS: [keyof Milestones | 'firstAdded' | 'readyVisible', string][] = [
  ['firstAdded', 'M1'],
  ['readyVisible', 'M1b'],
  ['buildStarted', 'M2'],
  ['recommendationShown', 'M3'],
  ['issueRaised', 'M4'],
  ['sectionsOpened', 'M5'],
  ['sectionEdited', 'M6 edited'],
  ['sectionSaved', 'M6 saved'],
  ['allSectionsVerified', 'M7'],
  ['prOpened', 'M8'],
  ['prCreated', 'M9'],
  ['teammateApproved', 'M10'],
  ['merged', 'M11'],
];

function watchMilestones() {
  const fired = new Set(events.filter((e) => e.type === 'milestone').map((e) => e.id as string));
  const check = () => {
    const s = useScenario.getState();
    for (const [key, id] of MILESTONE_IDS) {
      const on = key === 'firstAdded' ? s.firstAdded : key === 'readyVisible' ? s.readyVisible : s.milestones[key];
      if (!on || fired.has(id)) continue;
      fired.add(id);
      const now = Date.now() - meta!.startedAt;
      const prev = [...events].reverse().find((e) => e.type === 'milestone');
      log('milestone', { id, msSinceStart: now, msSincePrevMilestone: prev ? now - Math.round((prev.t as number) * 1000) : now });
    }
  };
  check();
  useScenario.subscribe(check);
}

// ---------------------------------------------------------------------------
// Edits, debounced 1.5 s per file

function watchEdits() {
  const timers = new Map<string, number>();
  let prev = useScenario.getState().fileDrafts;
  useScenario.subscribe((s) => {
    if (s.fileDrafts === prev) return;
    for (const [file, text] of Object.entries(s.fileDrafts)) {
      if (prev[file] === text) continue;
      window.clearTimeout(timers.get(file));
      timers.set(
        file,
        window.setTimeout(() => {
          const now = useScenario.getState();
          const saved = (now.files[file] ?? '').split('\n');
          const draft = (now.fileDrafts[file] ?? '').split('\n');
          const linesChanged = draft.filter((l, i) => l !== saved[i]).length;
          log('edit', { file, section: now.editor?.section ?? null, linesChanged });
        }, 1500),
      );
    }
    prev = s.fileDrafts;
  });
}

// ---------------------------------------------------------------------------
// Clicks, with on-path / off-path against the expected next affordance

const PANELS = '.configure, .section-editor, .sections-panel, .right-panel, .comment-card, .rec-card, .add-menu';
const INTERACTIVE = 'button, a, select, input[type="checkbox"], [role="menuitem"], [role="tab"], .line-group';

function targetId(el: Element): string {
  const s = useScenario.getState();
  const orb = el.getAttribute('data-orb');
  if (orb) {
    if (orb === 'you') return 'orb:you';
    const c = s.collaborators.find((x) => x.id === orb);
    const sameRole = s.collaborators.filter((x) => x.role === c?.role);
    return c ? `orb:${c.role}#${sameRole.indexOf(c) + 1}` : `orb:${orb}`;
  }
  const label = el.getAttribute('aria-label') ?? (el as HTMLElement).innerText ?? '';
  const kind = el.classList.contains('line-group') ? 'line' : el.tagName.toLowerCase();
  return `${kind}:${label.replace(/\s+/g, ' ').trim().slice(0, 48).toLowerCase()}`;
}

function onClick(e: MouseEvent) {
  const el = (e.target as Element).closest?.(INTERACTIVE);
  if (!el || !el.closest('.stage')) return;
  const expected = expectedStep(useScenario.getState());
  const onPath = !!expected.selector && !!el.closest(expected.selector);
  const target = targetId(el);
  log('click', { target, onPath });
  // Working inside the panel the next step lives in (a field, a checkbox) isn't wandering off.
  const expectedEl = expected.selector ? document.querySelector(expected.selector) : null;
  const panel = expectedEl?.closest(PANELS);
  const samePanel = !!panel && panel.contains(el);
  if (!onPath && expected.selector && !samePanel) log('offPath', { expected: affordanceName(expected.selector), actual: target });
}

// ---------------------------------------------------------------------------
// Export: a .json with every event and a readable .md summary

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

export function summary(): string {
  if (!meta) return '';
  const ms = events.filter((e) => e.type === 'milestone');
  const off = events.filter((e) => e.type === 'offPath');
  const fallbacks = events.filter((e) => e.type === 'fallback');
  const inputs = events.filter((e) => e.type === 'input');
  const hints = events.filter((e) => e.type === 'hint');
  const clicks = events.filter((e) => e.type === 'click');
  const onPath = clicks.filter((e) => e.onPath).length;
  const date = new Date(meta.startedAt).toISOString().replace('T', ' ').slice(0, 16);
  return [
    `# Session ${meta.participant}`,
    '',
    `Started ${date} UTC. ${events.length} events, ${clicks.length} clicks (${onPath} on the designed path).`,
    '',
    '## Milestones',
    '',
    '| Milestone | At | Since previous |',
    '|---|---|---|',
    ...ms.map((e) => `| ${e.id} | ${secs(e.msSinceStart as number)} | ${secs(e.msSincePrevMilestone as number)} |`),
    '',
    `## Off-path moments (${off.length})`,
    '',
    ...(off.length ? off.map((e) => `- ${e.t} s, in ${e.state}: expected ${e.expected}, clicked ${e.actual}`) : ['None.']),
    '',
    `## Hints shown (${hints.length})`,
    '',
    ...(hints.length ? hints.map((e) => `- ${e.t} s, in ${e.state}: ${e.affordance}`) : ['None.']),
    '',
    `## Fallback replies (${fallbacks.length})`,
    '',
    ...(fallbacks.length ? fallbacks.map((e) => `- ${e.t} s: "${e.text}"`) : ['None.']),
    '',
    `## Free-text inputs (${inputs.length})`,
    '',
    ...(inputs.length ? inputs.map((e) => `- ${e.t} s, ${e.field}: "${e.text}"${e.intent ? ` (intent ${e.intent}, score ${e.score})` : ''}`) : ['None.']),
    '',
  ].join('\n');
}

export function exportLog() {
  if (!meta) return false;
  const date = new Date().toISOString().slice(0, 10);
  const base = `pmr-session-${meta.participant}-${date}`;
  download(`${base}.json`, JSON.stringify({ ...meta, events }, null, 2), 'application/json');
  // A beat apart so the browser doesn't drop the second download.
  window.setTimeout(() => download(`${base}.md`, summary(), 'text/markdown'), 400);
  return true;
}
