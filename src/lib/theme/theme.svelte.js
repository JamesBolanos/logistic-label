import { browser } from '$app/environment';

/** localStorage key shared with the pre-paint script in src/app.html. */
export const THEME_STORAGE_KEY = 'sscc-labels-theme';

/** Supported explicit theme choices. */
export const THEMES = Object.freeze({
  light: 'light',
  dark: 'dark'
});

// Module-level rune so every ThemeToggle and future theme-aware control reads
// the same state. The value is seeded on the client by initTheme().
let currentTheme = $state(THEMES.light);
let initialized = false;

/**
 * Reads the stored preference (or the operating-system preference), applies it
 * to <html>, and follows later system changes while no explicit choice exists.
 * Safe to call more than once; intended for onMount in the root layout.
 */
export function initTheme() {
  if (!browser || initialized) return;

  const theme = readStoredTheme() ?? getSystemTheme();
  applyTheme(theme);

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', (event) => {
    if (!readStoredTheme()) {
      applyTheme(event.matches ? THEMES.dark : THEMES.light);
    }
  });

  initialized = true;
}

/** Returns the active theme. Reactive when read from a component. */
export function getTheme() {
  return currentTheme;
}

/**
 * Applies and persists an explicit theme choice. Invalid values fall back to
 * the light theme rather than writing an unknown value to storage.
 */
export function setTheme(theme) {
  const nextTheme = theme === THEMES.dark ? THEMES.dark : THEMES.light;
  applyTheme(nextTheme);

  if (!browser) return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    // Persistence is optional; the current page still switches correctly.
  }
}

/** Switches between light and dark. */
export function toggleTheme() {
  setTheme(currentTheme === THEMES.dark ? THEMES.light : THEMES.dark);
}

function applyTheme(theme) {
  currentTheme = theme;

  if (!browser) return;

  const root = document.documentElement;
  root.classList.toggle('dark', theme === THEMES.dark);
  root.style.colorScheme = theme;
}

function readStoredTheme() {
  if (!browser) return null;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === THEMES.dark || stored === THEMES.light ? stored : null;
  } catch {
    return null;
  }
}

function getSystemTheme() {
  if (!browser) return THEMES.light;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.dark : THEMES.light;
}
