import { isGhost, type AgentRole, type Collaborator, type Line } from './types';

export interface Point { x: number; y: number }

// Orb centers in stage pixels (Figma frames 01 and 05).
export const YOU_ALONE: Point = { x: 720, y: 420 };
export const YOU_TEAM: Point = { x: 720, y: 260 };
export const FLOOR_Y = 794;

/** Slots 0–3 belong to a role's first collaborator; the rest are shared, nearest-free. */
export const SLOTS: Point[] = [
  { x: 600, y: 500 },  // 0 builder
  { x: 900, y: 520 },  // 1 reviewer
  { x: 1110, y: 320 }, // 2 tester
  { x: 340, y: 320 },  // 3 teammate (frames 09–11, before their 140px team shift)
  { x: 380, y: 410 },  // clear of the You–teammate line
  { x: 1050, y: 640 },
  { x: 300, y: 640 },
  { x: 1180, y: 470 },
  { x: 500, y: 690 },
  { x: 1270, y: 230 },
  { x: 180, y: 610 },
  { x: 820, y: 690 },
  { x: 240, y: 470 },
  { x: 1300, y: 660 },
  { x: 470, y: 160 },
  { x: 960, y: 160 },
];

const ROLE_SLOT: Partial<Record<AgentRole, number>> = { builder: 0, reviewer: 1, tester: 2, teammate: 3 };
const SHARED_START = 4;

/** Distance from p to the segment a–b. */
function segDist(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  const u = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + u * dx), p.y - (a.y + u * dy));
}

// Feedback round 4: a new orb keeps its distance from the others, and neither its line to You nor
// anyone else's line to You runs through an orb (a second builder used to sit behind the first).
const MIN_GAP = 150;
const LINE_CLEAR = 60;

export function pickSlot(role: AgentRole, taken: number[], links: Point[] = [YOU_TEAM]): number {
  const own = ROLE_SLOT[role];
  if (own !== undefined && !taken.includes(own)) return own;
  // "Other" agents start from the first shared slot; a second builder looks near the builder slot.
  const anchor = own !== undefined ? SLOTS[own] : SLOTS[SHARED_START];
  const placed = taken.map(slotPoint);
  const clear = (p: Point) =>
    placed.every((q) => Math.hypot(q.x - p.x, q.y - p.y) >= MIN_GAP) &&
    links.every((l) => placed.every((q) => (q.x === l.x && q.y === l.y) || segDist(q, p, l) >= LINE_CLEAR)) &&
    placed.every((q) => segDist(p, q, YOU_TEAM) >= LINE_CLEAR);
  let best = -1;
  let bestD = Infinity;
  // First pass: slots that are clear of everything; second pass: any free slot.
  for (const strict of [true, false]) {
    for (let i = SHARED_START; i < SLOTS.length; i++) {
      if (taken.includes(i) || (strict && !clear(SLOTS[i]))) continue;
      const d = Math.hypot(SLOTS[i].x - anchor.x, SLOTS[i].y - anchor.y);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best >= 0) return best;
  }
  // Out of slots: spiral outward so nothing ever stacks exactly.
  return SLOTS.length + taken.filter((t) => t >= SLOTS.length).length;
}

export function slotPoint(slot: number): Point {
  if (slot < SLOTS.length) return SLOTS[slot];
  const n = slot - SLOTS.length;
  const angle = n * 0.9;
  return { x: 720 + Math.cos(angle) * (560 + n * 20), y: 440 + Math.sin(angle) * 260 };
}

export function youPoint(collaborators: Collaborator[]): Point {
  return collaborators.length > 0 ? YOU_TEAM : YOU_ALONE;
}

export function lineId(a: string, b: string) {
  const [x, y] = [a, b].sort((p, q) => (p === 'you' ? -1 : q === 'you' ? 1 : p.localeCompare(q)));
  return `${x}~${y}`;
}

/** Undirected lines from each collaborator's connectsTo. Drafts get a dashed pending line; `working` ids flow. */
export function deriveLines(collaborators: Collaborator[], working: Set<string> = new Set()): Line[] {
  const ids = new Set(['you', ...collaborators.map((c) => c.id)]);
  const lines = new Map<string, Line>();
  for (const c of collaborators) {
    for (const other of c.connectsTo) {
      if (!ids.has(other) || other === c.id) continue;
      const id = lineId(c.id, other);
      const [a, b] = id.split('~');
      const otherC = collaborators.find((o) => o.id === other);
      const kind = isGhost(c) || (otherC && isGhost(otherC)) || c.review === 'pending' || otherC?.review === 'pending' ? 'pending' : working.has(id) ? 'working' : 'connected';
      lines.set(id, { id, a, b, kind });
    }
  }
  return [...lines.values()];
}

/** Near orbs link straight to You (48px); far ones only link through another agent (36px). */
export function isNear(c: Collaborator, lines: Line[]): boolean {
  return lines.some((l) => (l.a === 'you' && l.b === c.id) || (l.b === 'you' && l.a === c.id));
}

export const ORB_SIZE = { you: 64, near: 48, far: 36, rail: 24, menu: 32 } as const;
