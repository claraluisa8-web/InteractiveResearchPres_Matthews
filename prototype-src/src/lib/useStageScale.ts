import { useEffect, useState } from 'react';

export const STAGE_W = 1440;
export const STAGE_H = 900;

/** Uniform scale that fits the 1440×900 stage in the window (letterboxed, never reflowed). */
export function useStageScale() {
  const compute = () => Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  const [scale, setScale] = useState(compute);
  useEffect(() => {
    const onResize = () => setScale(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scale;
}
