import { useEffect, useRef, useState } from 'react';
import type { Geometry, Node } from './geometry';

// Feedback round 5: adding an agent used to snap orbs to their new slots (You jumping up, orbs
// changing size) while the team slid on a CSS transition and the lines snapped. Now orb positions
// and sizes ease together, and the lines are drawn from the eased positions, so everything moves
// as one. Same duration and curve as the layout slide (--pmr-t-layout).
export const LAYOUT_MS = 420;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // ease-in-out cubic

interface Pose { x: number; y: number; size: number }

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useTweenedGeometry(target: Geometry): { g: Geometry; moving: boolean } {
  const shown = useRef(new Map<string, Pose>());
  const [frame, setFrame] = useState(0);
  const [moving, setMoving] = useState(false);
  const raf = useRef<number>();

  useEffect(() => {
    const all = [target.you, ...target.nodes];
    const from = new Map<string, Pose>();
    let changed = false;
    for (const n of all) {
      const cur = shown.current.get(n.id);
      // New orbs start at their slot (they fade and scale in with CSS) — nothing flies in from 0,0.
      const start = cur ?? { x: n.point.x, y: n.point.y, size: n.size };
      from.set(n.id, start);
      if (start.x !== n.point.x || start.y !== n.point.y || start.size !== n.size) changed = true;
    }
    if (!changed || reduced()) {
      shown.current = new Map(all.map((n) => [n.id, { x: n.point.x, y: n.point.y, size: n.size }]));
      setMoving(false);
      setFrame((f) => f + 1);
      return;
    }
    const t0 = performance.now();
    setMoving(true);
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / LAYOUT_MS);
      const k = ease(p);
      const next = new Map<string, Pose>();
      for (const n of all) {
        const a = from.get(n.id)!;
        next.set(n.id, { x: a.x + (n.point.x - a.x) * k, y: a.y + (n.point.y - a.y) * k, size: a.size + (n.size - a.size) * k });
      }
      shown.current = next;
      setFrame((f) => f + 1);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else setMoving(false);
    };
    cancelAnimationFrame(raf.current!);
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current!);
  }, [target]);

  void frame;
  const pose = (n: Node): Node => {
    const p = shown.current.get(n.id);
    return p ? { ...n, point: { x: p.x, y: p.y }, size: p.size } : n;
  };
  const you = pose(target.you);
  const nodes = target.nodes.map(pose);
  const all = [you, ...nodes];
  // The + rides along with You.
  const plus = { x: target.plus.x + you.point.x - target.you.point.x, y: target.plus.y + you.point.y - target.you.point.y };
  return { g: { ...target, you, nodes, plus, byId: (id) => all.find((n) => n.id === id) }, moving };
}
