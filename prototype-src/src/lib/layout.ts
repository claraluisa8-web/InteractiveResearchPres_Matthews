import type { AgentRole, Collaborator, Line } from './types';

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
  { x: 190, y: 330 },  // 3 teammate
  { x: 380, y: 410 },  // clear of the You–teammate line
  { x: 1050, y: 640 },
  { x: 300, y: 640 },
  { x: 1180, y: 470 },
  { x: 500, y: 690 },
  { x: 1270, y: 230 },
  { x: 160, y: 520 },
  { x: 820, y: 690 },
  { x: 280, y: 170 },
  { x: 1300, y: 660 },
  { x: 470, y: 160 },
  { x: 960, y: 160 },
];

const ROLE_SLOT: Partial<Record<AgentRole, number>> = { builder: 0, reviewer: 1, tester: 2, teammate: 3 };
const SHARED_START = 4;

export function pickSlot(role: AgentRole, taken: number[]): number {
  const own = ROLE_SLOT[role];
  if (own !== undefined && !taken.includes(own)) return own;
  // "Other" agents start from the first shared slot; a second builder looks near the builder slot.
  const anchor = own !== undefined ? SLOTS[own] : SLOTS[SHARED_START];
  let best = -1;
  let bestD = Infinity;
  for (let i = SHARED_START; i < SLOTS.length; i++) {
    if (taken.includes(i)) continue;
    const d = Math.hypot(SLOTS[i].x - anchor.x, SLOTS[i].y - anchor.y);
    if (d < bestD) { bestD = d; best = i; }
  }
  if (best >= 0) return best;
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

/** Undirected lines from each collaborator's connectsTo. Drafts get a dashed pending line. */
export function deriveLines(collaborators: Collaborator[]): Line[] {
  const ids = new Set(['you', ...collaborators.map((c) => c.id)]);
  const lines = new Map<string, Line>();
  for (const c of collaborators) {
    for (const other of c.connectsTo) {
      if (!ids.has(other) || other === c.id) continue;
      const [a, b] = [c.id, other].sort((x, y) => (x === 'you' ? -1 : y === 'you' ? 1 : x.localeCompare(y)));
      const id = `${a}~${b}`;
      const otherC = collaborators.find((o) => o.id === other);
      const kind = c.status === 'draft' || otherC?.status === 'draft' ? 'pending' : 'connected';
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
