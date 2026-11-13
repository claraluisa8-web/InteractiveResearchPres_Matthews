import { useCallback, useEffect, useRef } from 'react';
import { IDENTITY_VIEW, useScenario } from './store';
import type { View } from './types';
import type { Point } from './layout';

export const MIN_K = 0.6;
export const MAX_K = 2;
const PAN_LIMIT = 900;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function clampView(v: View): View {
  const k = clamp(v.k, MIN_K, MAX_K);
  const lim = PAN_LIMIT * k;
  return { k, x: clamp(v.x, -lim, lim), y: clamp(v.y, -lim, lim) };
}

/** Zoom by `factor` keeping the stage point `p` fixed under the pointer. */
export function zoomAt(v: View, p: Point, factor: number): View {
  const k = clamp(v.k * factor, MIN_K, MAX_K);
  const f = k / v.k;
  return clampView({ k, x: p.x - (p.x - v.x) * f, y: p.y - (p.y - v.y) * f });
}

export const isIdentity = (v: View) => Math.abs(v.x) < 0.5 && Math.abs(v.y) < 0.5 && Math.abs(v.k - 1) < 0.001;

// Area the team should fit in: below the title bar, above the composer, clear of the rail.
const FIT = { x0: 270, y0: 60, right: 40, y1: 800 };

/** "Show whole team": fit every orb (plus label room); never zooms past the designed 1:1. */
/** Points are in stage pixels (layout x plus the centring offset); `width` is the stage width. */
export function fitView(points: Point[], width = 1440): View {
  const FITX1 = width - FIT.right;
  if (points.length === 0) return IDENTITY_VIEW;
  const pad = { x: 110, top: 70, bottom: 70 };
  const x0 = Math.min(...points.map((p) => p.x)) - pad.x;
  const x1 = Math.max(...points.map((p) => p.x)) + pad.x;
  const y0 = Math.min(...points.map((p) => p.y)) - pad.top;
  const y1 = Math.max(...points.map((p) => p.y)) + pad.bottom;
  const inDesign = x0 >= 0 && x1 <= width && y0 >= 36 && y1 <= 810;
  if (inDesign) return IDENTITY_VIEW;
  const k = clamp(Math.min((FITX1 - FIT.x0) / (x1 - x0), (FIT.y1 - FIT.y0) / (y1 - y0), 1), MIN_K, 1);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return clampView({ k, x: (FIT.x0 + FITX1) / 2 - cx * k, y: (FIT.y0 + FIT.y1) / 2 - cy * k });
}

/** Pointer drag on empty canvas pans; wheel / pinch zooms around the pointer. Never moves on its own. */
export function usePanZoom(scale: number) {
  const setView = useScenario((s) => s.setView);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const surface = useRef<HTMLDivElement>(null);

  const toStage = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = surface.current!.getBoundingClientRect();
      return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
    },
    [scale],
  );

  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = useScenario.getState().view;
      // Wheel, trackpad scroll and pinch (ctrlKey) all zoom around the pointer.
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      setView(zoomAt(v, toStage(e.clientX, e.clientY), factor));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [scale, setView, toStage]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as Element).closest('button, a, input, select, textarea, .line-group, .pmr-glass')) return;
    const v = useScenario.getState().view;
    drag.current = { x: e.clientX, y: e.clientY, vx: v.x, vy: v.y, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.x) / scale;
    const dy = (e.clientY - d.y) / scale;
    if (!d.moved && Math.hypot(dx, dy) < 3) return;
    d.moved = true;
    const v = useScenario.getState().view;
    setView(clampView({ k: v.k, x: d.vx + dx, y: d.vy + dy }));
  };
  const onPointerUp = () => {
    const moved = drag.current?.moved ?? false;
    drag.current = null;
    return moved;
  };

  return { surface, onPointerDown, onPointerMove, onPointerUp };
}
