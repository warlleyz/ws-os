/* === CICLO VISUAL DAS JANELAS === */
export const WINDOW_MOTION_DURATION = 180;

/* ----- DURAÇÃO DAS ANIMAÇÕES ----- */
export function getWindowMotionDuration() {
  if (typeof document === 'undefined') return 0;

  const data = document.documentElement?.dataset ?? {};
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (
    reduced ||
    data.reducedMotion === 'true' ||
    data.lowEffects === 'true' ||
    data.motionIntensity === 'off'
  ) {
    return 0;
  }

  return data.motionIntensity === 'subtle' ? WINDOW_MOTION_DURATION / 2 : WINDOW_MOTION_DURATION;
}