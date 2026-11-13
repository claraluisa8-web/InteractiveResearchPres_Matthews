import { useEffect, useRef } from 'react';
import { affordanceName, expectedStep } from './expected';
import { log } from './log';
import { useScenario } from './store';
import { TIMING } from './timing';

/**
 * Idle hints (flow-and-milestones.md): after 25 s in a state with no progress, the next affordance
 * gets a lavender ring that pulses twice. Once per state, never modal.
 */
export function useIdleHints() {
  const key = useScenario((s) => expectedStep(s).key);
  const shown = useRef(new Set<string>());

  useEffect(() => {
    if (shown.current.has(key)) return;
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(fire, TIMING.idleHint);
    };
    const fire = () => {
      const { selector } = expectedStep(useScenario.getState());
      const el = selector ? document.querySelector<HTMLElement>(selector) : null;
      if (!el) return arm();
      shown.current.add(key);
      el.classList.remove('hint-pulse');
      void el.offsetWidth; // restart the animation if it ran before
      el.classList.add('hint-pulse');
      window.setTimeout(() => el.classList.remove('hint-pulse'), 2600);
      log('hint', { affordance: affordanceName(selector) });
    };
    // Typing counts as progress inside a state (an edit in progress isn't "idle").
    const onKey = () => arm();
    window.addEventListener('keydown', onKey, true);
    arm();
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [key]);
}

const PANELS = '.section-editor, .sections-panel, .right-panel, .pr-status, .comment-card, .rec-card, .configure, .build-card';

/**
 * Keyboard path: when Enter or Space removes the focused control (Start from the spec, Apply fix,
 * Create pull request…), focus would fall to the page. Put it on the next expected step instead,
 * else the first control in the newest panel, else the + beside You.
 */
export function useFocusRescue() {
  useEffect(() => {
    let usingKeyboard = false;
    // `force`: the approval unlocks Merge, which is the only thing left to do, so focus goes there.
    const rescue = (force = false) =>
      window.setTimeout(() => {
        const active = document.activeElement;
        if (!usingKeyboard || (!force && active && active !== document.body && active.isConnected)) return;
        const { selector } = expectedStep(useScenario.getState());
        const next =
          (selector && document.querySelector<HTMLElement>(selector)) ||
          [...document.querySelectorAll<HTMLElement>(PANELS)].pop()?.querySelector<HTMLElement>('button, input, textarea, select, .cm-content') ||
          document.querySelector<HTMLElement>('[data-plus]');
        next?.focus();
      }, 150);
    const onKey = (e: KeyboardEvent) => {
      usingKeyboard = true;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') rescue(false);
    };
    // Mouse users never get focus moved for them.
    const onPointer = () => {
      usingKeyboard = false;
    };
    // A step can also end by itself (M7's receipt replacing the sections panel, an approval).
    let key = expectedStep(useScenario.getState()).key;
    const unsubscribe = useScenario.subscribe((s) => {
      const next = expectedStep(s).key;
      if (next !== key) {
        key = next;
        rescue(next === 'approved');
      }
    });
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onPointer, true);
    return () => {
      unsubscribe();
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointerdown', onPointer, true);
    };
  }, []);
}
