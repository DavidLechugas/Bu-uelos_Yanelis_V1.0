/** Pausas de confirmación (chulito): más cortas con animaciones reducidas y nulas en pruebas. */
export const BOOT_DONE_MS = 1000;
export const SAVE_DONE_MS = 1200;
const REDUCED_MAX_MS = 500;

function prefersReducedMotion() {
  return (
    document.documentElement.dataset.motion === 'reduce'
    || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  );
}

export function pause(ms) {
  if (import.meta.env.MODE === 'test') return Promise.resolve();
  const wait = prefersReducedMotion() ? Math.min(ms, REDUCED_MAX_MS) : ms;
  return new Promise((resolve) => { setTimeout(resolve, wait); });
}
