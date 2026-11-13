import intentsData from '../../../handoff/data/intents.json';
import { copy, t } from './copy';
import { active, defaultName, firstOf } from './store';
import type { AgentRole, Collaborator, Recommendation } from './types';

// Scripted replies (docs/agent-replies.md): score intents allowed in the current context,
// the highest wins, nothing scores → a fallback that ends with the next-step hint.

export type Context = 'empty' | 'ready' | 'build' | 'issue' | 'editor' | 'review' | 'done';

interface Intent {
  id: string;
  contexts: string[];
  keywords: string[];
  phrases?: string[];
  roleWords?: Record<string, string[]>;
  replies: Record<string, string>;
}

const intents = intentsData.intents as unknown as Intent[];

const CONTRACTIONS: [RegExp, string][] = [
  [/\bwhat's\b/g, 'what is'], [/\bwhats\b/g, 'what is'], [/\bdon't\b/g, 'do not'], [/\bdoesn't\b/g, 'does not'],
  [/\bcan't\b/g, 'can not'], [/\bit's\b/g, 'it is'], [/\bi'm\b/g, 'i am'], [/\bisn't\b/g, 'is not'],
  [/\bwon't\b/g, 'will not'], [/\bhow's\b/g, 'how is'], [/\bwhere's\b/g, 'where is'], [/\blet's\b/g, 'let us'],
];

export function normalize(input: string) {
  let s = input.toLowerCase().replace(/[’‘]/g, "'");
  for (const [re, to] of CONTRACTIONS) s = s.replace(re, to);
  return s.replace(/[^a-z0-9' ]+/g, ' ').replace(/'/g, '').replace(/\s+/g, ' ').trim();
}

/** Optimal string alignment distance (Damerau-Levenshtein with adjacent swaps). */
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

function hasTerm(text: string, words: string[], term: string) {
  if (term.includes(' ')) return ` ${text} `.includes(` ${term} `);
  return words.some((w) => w === term || (term.length >= 5 && w.length >= 4 && distance(w, term) <= 1));
}

export function contextFor(
  cs: Collaborator[],
  milestones: { buildStarted: boolean; issueRaised?: boolean; allSectionsVerified?: boolean },
  editorOpen = false,
): Context {
  if (editorOpen) return 'editor';
  if (milestones.issueRaised && !milestones.allSectionsVerified) return 'issue';
  if (!firstOf(cs, 'builder')) return 'empty';
  return milestones.buildStarted ? 'build' : 'ready';
}

/** Which affordance comes next; shared with the idle hints. */
const EXPECTED: Record<Context, string> = {
  empty: 'addAgent', ready: 'build', build: 'addAgent', issue: 'why', editor: 'fix', review: 'replyToTeammate', done: 'thanks',
};

export interface Match {
  intent: string | null;
  score: number;
  reply: string;
  speakerRole: AgentRole | 'bob';
  role?: AgentRole;
  otherType?: string;
  /** For rename: the agent mentioned and the new name, if the user gave one. */
  targetId?: string;
  newName?: string;
}

function detectRole(text: string, words: string[]): { role?: AgentRole; otherType?: string } {
  const roleWords = intents.find((i) => i.id === 'addAgent')?.roleWords ?? {};
  for (const [role, terms] of Object.entries(roleWords)) {
    const hit = terms.find((term) => hasTerm(text, words, term));
    if (!hit) continue;
    if (role !== 'other') return { role: role as AgentRole };
    const types: Record<string, string> = {
      security: 'Security', accessibility: 'Accessibility', a11y: 'Accessibility',
      docs: 'Docs', documentation: 'Docs', performance: 'Performance',
    };
    return { role: 'other', otherType: types[hit] ?? 'Custom…' };
  }
  return {};
}

function findMentioned(text: string, words: string[], cs: Collaborator[]): Collaborator | undefined {
  const list = active(cs);
  const byName = list.find((c) => ` ${text} `.includes(` ${normalize(c.name)} `));
  if (byName) return byName;
  const { role } = detectRole(text, words);
  return role ? firstOf(cs, role) : undefined;
}

export interface FlowInfo {
  recommendation?: Recommendation;
  verified?: number;
  total?: number;
  issues?: number;
}

/** The next step can be more specific than the context (a reviewer already checking, a pending suggestion). */
function stepKey(cs: Collaborator[], ctx: Context, flow: FlowInfo): string {
  if (ctx !== 'build') return ctx;
  if (flow.recommendation === 'shown' || flow.recommendation === 'dismissed') return 'recommendation';
  return firstOf(cs, 'reviewer') ? 'buildReviewing' : 'build';
}

export function vars(cs: Collaborator[], ctx: Context, flow: FlowInfo = {}) {
  const name = (role: AgentRole) => firstOf(cs, role)?.name;
  const v: Record<string, string | number | undefined> = {
    builder: name('builder') ?? copy.roles.builder.defaultName,
    reviewer: name('reviewer') ?? copy.roles.reviewer.defaultName,
    tester: name('tester') ?? copy.roles.tester.defaultName,
    teammate: name('teammate') ?? copy.people.teammate.fullName,
    verified: flow.verified ?? 0,
    total: flow.total ?? (firstOf(cs, 'tester') ? 8 : 7),
    issues: flow.issues ?? 0,
  };
  v.teammateFirst = String(v.teammate).split(' ')[0];
  const key = stepKey(cs, ctx, flow);
  const steps = copy.constellation.nextSteps as Record<string, { text: string }>;
  v.nextStep = t(steps[key] ?? steps[ctx], v);
  const hints = intentsData.fallback.nextStepHints as Record<string, string>;
  const hintOverrides = copy.constellation.nextStepHints as Record<string, { text: string } | string>;
  const override = hintOverrides[key];
  v.nextStepHint = override && typeof override !== 'string' ? t(override, v) : t(hints[ctx], v);
  return v;
}

export function match(input: string, cs: Collaborator[], ctx: Context, flow: FlowInfo = {}): Match {
  const text = normalize(input);
  const words = text.split(' ');
  const v = vars(cs, ctx, flow);
  let best: { intent: Intent; score: number } | null = null;

  for (const intent of intents) {
    if (!intent.contexts.includes('*') && !intent.contexts.includes(ctx)) continue;
    if (intent.keywords.includes('*')) continue; // reply-anything intents are handled by their own UI
    let score = 0;
    for (const k of intent.keywords) if (hasTerm(text, words, k)) score += 2;
    for (const p of intent.phrases ?? []) if (` ${text} `.includes(` ${p} `)) score += 3;
    if (score === 0) continue;
    if (EXPECTED[ctx] === intent.id) score += 1;
    if (!best || score > best.score || (score === best.score && EXPECTED[ctx] === intent.id)) best = { intent, score };
  }

  // A role word with no stronger intent ("a security agent please") still means add.
  const detected = detectRole(text, words);
  if (detected.role && (!best || ['help', 'thanks'].includes(best.intent.id))) {
    best = { intent: intents.find((i) => i.id === 'addAgent')!, score: 2 };
  }

  if (!best) {
    const pool = intentsData.fallback.replies;
    return { intent: null, score: 0, reply: t(pool[Math.floor(Math.random() * pool.length)], v), speakerRole: 'bob' };
  }

  const { intent } = best;
  const noTester = intent.id === 'tests' && !firstOf(cs, 'tester') && intent.replies.noTester;
  const key = stepKey(cs, ctx, flow);
  const raw = noTester || (intent.replies[key] ?? intent.replies[ctx] ?? intent.replies['*'] ?? Object.values(intent.replies)[0]);
  const result: Match = { intent: intent.id, score: best.score, reply: '', speakerRole: 'bob' };

  if (intent.id === 'addAgent') {
    result.role = detected.role;
    result.otherType = detected.otherType;
    const roleLabel = !detected.role
      ? 'collaborator'
      : detected.role === 'other'
        ? defaultName('other', detected.otherType).toLowerCase()
        : copy.roles[detected.role].menuTitle.toLowerCase();
    // "a {role}" → "an accessibility agent"
    const template = /^[aeiou]/.test(roleLabel) ? raw.replace(/\ba \{role\}/, 'an {role}') : raw;
    result.reply = t(template, { ...v, role: roleLabel });
    return result;
  }
  if (intent.id === 'rename') {
    const target = findMentioned(text, words, cs);
    result.targetId = target?.id;
    if (!target) {
      // "rename the builder" before there is one: say so instead of opening nothing.
      const role = detected.role ? copy.roles[detected.role].menuTitle.toLowerCase() : 'collaborator';
      result.reply = t(intent.replies.noTarget, { ...v, role });
      return result;
    }
    // "rename the builder to Codey": keep the user's own casing for the new name.
    const m = input.match(/\b(?:to|as)\s+["“']?([^"”']+?)["”']?\s*[.!]?$/i);
    result.newName = m?.[1]?.trim();
  }
  if (intent.id === 'why' || intent.id === 'spec') result.speakerRole = firstOf(cs, 'reviewer') ? 'reviewer' : 'bob';
  if (intent.id === 'build' || intent.id === 'fix') result.speakerRole = firstOf(cs, 'builder') ? 'builder' : 'bob';
  if (intent.id === 'tests') result.speakerRole = firstOf(cs, 'tester') ? 'tester' : 'bob';
  result.reply = t(raw, v);
  return result;
}
