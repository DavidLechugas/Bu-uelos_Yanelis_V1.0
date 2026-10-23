/** Tema y animaciones de este dispositivo (localStorage); index.html aplica el tema antes de pintar. */
const KEY = 'by-preferences';
export const DEFAULT_PREFERENCES = { theme: 'system', motion: 'normal' };
const THEME_COLORS = { light: '#a5631a', dark: '#2a1a0e' };

export function loadPreferences() {
  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function resolveTheme(theme) {
  if (theme === 'light' || theme === 'dark') return theme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyPreferences(preferences) {
  const root = document.documentElement;
  const theme = resolveTheme(preferences.theme);
  root.dataset.theme = theme;
  root.dataset.motion = preferences.motion;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
}

export function savePreferences(preferences) {
  try {
    localStorage.setItem(KEY, JSON.stringify(preferences));
  } catch {
    // Sin almacenamiento (modo privado): la preferencia solo vale en esta visita.
  }
  applyPreferences(preferences);
}
