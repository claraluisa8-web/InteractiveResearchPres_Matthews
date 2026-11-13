import { STAGE_H, STAGE_W } from '../lib/useStageScale';

// Perspective box: the outer box sits past the frame edge and narrows to an inner box
// around (720, 400). Nested boxes are spaced by depth so the grid reads as a room.
const OUTER = { x0: -240, y0: -150, x1: STAGE_W + 240, y1: STAGE_H + 150 };
const INNER = { x0: 440, y0: 250, x1: 1000, y1: 550 };
const DEPTHS = [0.22, 0.42, 0.6, 0.76, 0.89, 1];
const DIVISIONS = 8;

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
const boxAt = (f: number) => ({
  x0: lerp(OUTER.x0, INNER.x0, f),
  y0: lerp(OUTER.y0, INNER.y0, f),
  x1: lerp(OUTER.x1, INNER.x1, f),
  y1: lerp(OUTER.y1, INNER.y1, f),
});

function rays() {
  const out: { x1: number; y1: number; x2: number; y2: number; center: boolean }[] = [];
  for (let i = 0; i <= DIVISIONS; i++) {
    const f = i / DIVISIONS;
    const center = i === DIVISIONS / 2;
    const ix = lerp(INNER.x0, INNER.x1, f);
    const ox = lerp(OUTER.x0, OUTER.x1, f);
    const iy = lerp(INNER.y0, INNER.y1, f);
    const oy = lerp(OUTER.y0, OUTER.y1, f);
    out.push({ x1: ix, y1: INNER.y0, x2: ox, y2: OUTER.y0, center }); // ceiling
    out.push({ x1: ix, y1: INNER.y1, x2: ox, y2: OUTER.y1, center }); // floor
    out.push({ x1: INNER.x0, y1: iy, x2: OUTER.x0, y2: oy, center }); // left wall
    out.push({ x1: INNER.x1, y1: iy, x2: OUTER.x1, y2: oy, center }); // right wall
  }
  return out;
}

/** Decorative space background: gradient, floor glow, perspective grid, vignette. */
export function Canvas() {
  return (
    <div className="canvas" aria-hidden="true">
      <div className="canvas__glow" />
      {/* Drawn for 1440×900 and scaled to cover a wider stage, centred. */}
      <svg className="canvas__grid" width="100%" height="100%" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} preserveAspectRatio="xMidYMid slice">
        {DEPTHS.map((f) => {
          const b = boxAt(f);
          return <rect key={f} x={b.x0} y={b.y0} width={b.x1 - b.x0} height={b.y1 - b.y0} />;
        })}
        {rays().map((r, i) => (
          <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} className={r.center ? 'is-center' : undefined} />
        ))}
      </svg>
      <div className="canvas__vignette" />
    </div>
  );
}
