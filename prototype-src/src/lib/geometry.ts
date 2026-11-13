import { useMemo } from 'react';
import { ORB_SIZE, deriveLines, isNear, lineId, pickSlot, slotPoint, youPoint, type Point } from './layout';
import { firstOf, useScenario } from './store';
import { isGhost, type Collaborator, type IssueState, type Line, type View } from './types';

export interface Node {
  id: string;
  point: Point;
  size: number;
  far: boolean;
  c?: Collaborator;
  /** The reviewer's suggested tester (frame 05): a dashed ghost, not a collaborator. */
  suggested?: boolean;
}

export const SUGGESTED_ID = 'suggested-tester';

export interface FlowState {
  buildStarted: boolean;
  /** Open issues on the first builder and reviewer line (M4 onward). */
  openIssues?: number;
  /** The sections panel is docked on the right (frame 06b moves the team 40px left). */
  sectionsOpen?: boolean;
  /** M7 onward: lines settle to mint and the team sits 140px left of the right-hand panels (frames 08–11). */
  allClear?: boolean;
  /** Recommendation shown or dismissed but not yet acted on. */
  suggestion: boolean;
}

export interface Geometry {
  you: Node;
  nodes: Node[];
  lines: Line[];
  /** Layout offset while the configure panel is open, so the ghost sits clear of the panel (frame 03). */
  shift: Point;
  plus: Point;
  /** Extra stage width split either side: layout x is designed for 1440 and centred in the stage. */
  dx: number;
  byId: (id: string) => Node | undefined;
}

// Configure panel's left edge in the 1440 design (frame 03); it's anchored to the right edge.
const PANEL_LEFT = 880;

export function computeGeometry(
  collaborators: Collaborator[],
  configureId: string | null,
  flow: FlowState = { buildStarted: false, suggestion: false },
  stageWidth = 1440,
): Geometry {
  const dx = (stageWidth - 1440) / 2;
  // Work flows You to builder and builder to reviewer once the build starts (frame 04).
  const working = new Set<string>();
  const builder = firstOf(collaborators, 'builder');
  const reviewer = firstOf(collaborators, 'reviewer');
  if (flow.buildStarted && builder) {
    working.add(lineId('you', builder.id));
    if (reviewer) working.add(lineId(builder.id, reviewer.id));
  }
  const lines = deriveLines(collaborators, working);
  // Feedback round 2: a teammate's line isn't verified until they approve the pull request.
  const unapprovedMate = (id: string) => collaborators.some((c) => c.id === id && c.role === 'teammate' && c.review !== 'approved');
  if (flow.allClear) {
    for (const l of lines) {
      if ((l.kind === 'connected' || l.kind === 'working') && !unapprovedMate(l.a) && !unapprovedMate(l.b)) l.kind = 'cleared';
    }
  }
  // M4: with the multiples rule, the issue sits on the first builder and first reviewer line.
  if (builder && reviewer && flow.openIssues) {
    const issueId = lineId(builder.id, reviewer.id);
    const l = lines.find((x) => x.id === issueId);
    if (l) { l.kind = 'issue'; l.count = flow.openIssues; }
  }
  const youP = youPoint(collaborators);
  const you: Node = { id: 'you', point: youP, size: ORB_SIZE.you, far: false };
  const nodes: Node[] = collaborators.map((c) => {
    const far = !isGhost(c) && !isNear(c, lines);
    return { id: c.id, point: slotPoint(c.slot), size: far ? ORB_SIZE.far : ORB_SIZE.near, far, c };
  });
  if (flow.suggestion && reviewer) {
    const slot = pickSlot('tester', collaborators.map((c) => c.slot));
    nodes.push({ id: SUGGESTED_ID, point: slotPoint(slot), size: ORB_SIZE.far, far: true, suggested: true });
    lines.push({ id: lineId(reviewer.id, SUGGESTED_ID), a: reviewer.id, b: SUGGESTED_ID, kind: 'suggested' });
  }
  let shift = { x: 0, y: 0 };
  const target = configureId ? nodes.find((n) => n.id === configureId) : undefined;
  if (target) {
    // Frame 03 moves the team 200px left and 60px down for a new collaborator, further if the ghost
    // would still sit under the panel. Editing only moves as far as needed to keep the orb in view.
    // In a wider stage the right-anchored panels sit further right, so the team needs to move less.
    const needed = Math.min(0, PANEL_LEFT + dx - 80 - target.point.x);
    shift = target.c?.status === 'draft' ? { x: Math.min(0, -200 + dx, needed), y: 60 } : { x: needed, y: 0 };
  } else if (flow.sectionsOpen) {
    shift = { x: Math.min(0, -40 + dx), y: 0 };
  } else if (flow.allClear) {
    shift = { x: Math.min(0, -140 + dx), y: 0 };
  }
  // Alone, the + sits right of You (frame 01). With a team, You's label takes that side and lines
  // leave You downward, so the + moves to the upper left where nothing is drawn.
  const plus = collaborators.length > 0 ? { x: youP.x - 50, y: youP.y - 44 } : { x: youP.x + 64, y: youP.y };
  const all = [you, ...nodes];
  return { you, nodes, lines, shift, plus, dx, byId: (id) => all.find((n) => n.id === id) };
}

export function useGeometry(): Geometry {
  const collaborators = useScenario((s) => s.collaborators);
  const configureId = useScenario((s) => s.configure?.id ?? null);
  const buildStarted = useScenario((s) => s.milestones.buildStarted);
  const recommendation = useScenario((s) => s.recommendation);
  const issueRaised = useScenario((s) => s.milestones.issueRaised);
  const issues = useScenario((s) => s.issues);
  const sectionsOpen = useScenario((s) => !!s.sectionsLine);
  const allClear = useScenario((s) => s.milestones.allSectionsVerified);
  const stageWidth = useScenario((s) => s.stageWidth);
  const suggestion = recommendation === 'shown' || recommendation === 'dismissed';
  const openIssues = issueRaised ? countOpen(issues) : 0;
  return useMemo(
    () => computeGeometry(collaborators, configureId, { buildStarted, suggestion, openIssues, sectionsOpen, allClear }, stageWidth),
    [collaborators, configureId, buildStarted, suggestion, openIssues, sectionsOpen, allClear, stageWidth],
  );
}

/** Layout point to stage pixels, through the panel shift and the user's pan/zoom. */
export function toScreen(p: Point, g: Geometry, v: View): Point {
  return { x: v.x + (p.x + g.shift.x + g.dx) * v.k, y: v.y + (p.y + g.shift.y) * v.k };
}

export const countOpen = (issues: Record<number, IssueState>) =>
  Object.values(issues).filter((i) => i.status !== 'resolved' && i.status !== 'rejected').length;
