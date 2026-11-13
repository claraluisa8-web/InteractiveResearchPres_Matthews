import { useEffect, useState } from 'react';
import { useScenario } from './store';

/** Design frame: 1440×900 (Figma). The stage keeps the 900px height and widens to fill the window. */
export const STAGE_W = 1440;
export const STAGE_H = 900;

/**
 * Scale so the 900px design height fills the window, then widen the stage to the window's shape.
 * Windows narrower than 16:10 keep the 1440 width and letterbox top and bottom instead, so nothing
 * designed for 1440 ever overlaps.
 */
function measure() {
  const scale = Math.min(window.innerHeight / STAGE_H, window.innerWidth / STAGE_W);
  const width = Math.max(STAGE_W, Math.round(window.innerWidth / scale));
  return { scale, width };
}

export function useStageScale() {
  const [size, setSize] = useState(measure);
  const setStageWidth = useScenario((s) => s.setStageWidth);
  useEffect(() => {
    setStageWidth(size.width);
  }, [size.width, setStageWidth]);
  useEffect(() => {
    const onResize = () => setSize(measure());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}
