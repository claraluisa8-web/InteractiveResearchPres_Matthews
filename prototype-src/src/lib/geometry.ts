import { useMemo } from 'react';
import { ORB_SIZE, deriveLines, isNear, slotPoint, youPoint, type Point } from './layout';
import { useScenario } from './store';
import type { Collaborator, Line, View } from './types';

export interface Node {
  id: string;
  point: Point;
  size: number;
  far: boolean;
  c?: Collaborator;
}

export interface Geometry {
  you: Node;
  nodes: Node[];
  lines: Line[];
  /** Layout offset while the configure panel is open, so the ghost sits clear of the panel (frame 03). */
  shift: Point;
  plus: Point;
  byId: (id: string) => Node | undefined;
}

const PANEL_LEFT = 880;

export function computeGeometry(collaborators: Collaborator[], configureId: string | null): Geometry {
  const lines = deriveLines(collaborators);
  const youP = youPoint(collaborators);
  const you: Node = { id: 'you', point: youP, size: ORB_SIZE.you, far: false };
  const nodes: Node[] = collaborators.map((c) => {
    const far = c.status !== 'draft' && !isNear(c, lines);
    return { id: c.id, point: slotPoint(c.slot), size: far ? ORB_SIZE.far : ORB_SIZE.near, far, c };
  });
  let shift = { x: 0, y: 0 };
  const target = configureId ? nodes.find((n) => n.id === configureId) : undefined;
  if (target) {
    // Frame 03 moves the team 200px left and 60px down for a new collaborator, further if the ghost
    // would still sit under the panel. Editing only moves as far as needed to keep the orb in view.
    const needed = Math.min(0, PANEL_LEFT - 80 - target.point.x);
    shift = target.c?.status === 'draft' ? { x: Math.min(-200, needed), y: 60 } : { x: needed, y: 0 };
  }
  // Alone, the + sits right of You (frame 01). With a team, You's label takes that side and lines
  // leave You downward, so the + moves to the upper left where nothing is drawn.
  const plus = collaborators.length > 0 ? { x: youP.x - 50, y: youP.y - 44 } : { x: youP.x + 64, y: youP.y };
  const all = [you, ...nodes];
  return { you, nodes, lines, shift, plus, byId: (id) => all.find((n) => n.id === id) };
}

export function useGeometry(): Geometry {
  const collaborators = useScenario((s) => s.collaborators);
  const configureId = useScenario((s) => s.configure?.id ?? null);
  return useMemo(() => computeGeometry(collaborators, configureId), [collaborators, configureId]);
}

/** Layout point → stage pixels, through the panel shift and the user's pan/zoom. */
export function toScreen(p: Point, g: Geometry, v: View): Point {
  return { x: v.x + (p.x + g.shift.x) * v.k, y: v.y + (p.y + g.shift.y) * v.k };
}
