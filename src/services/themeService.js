const THEME_KEY_PREFIX = "amiste_erp_theme";
const THEMES = {
  DARK: "dark",
  LIGHT: "light",
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function buildThemeKey(user) {
  return `${THEME_KEY_PREFIX}_${user?.id || "public"}`;
}

export function getStoredTheme(user) {
  if (!canUseLocalStorage()) {
    return THEMES.LIGHT;
  }

  return window.localStorage.getItem(buildThemeKey(user)) || window.localStorage.getItem(`${THEME_KEY_PREFIX}_global`) || THEMES.LIGHT;
}

export function saveStoredTheme(user, theme) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(buildThemeKey(user), theme);

  if (!user?.id) {
    window.localStorage.setItem(`${THEME_KEY_PREFIX}_global`, theme);
  }
}

export function applyTheme(theme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
}

export function toggleTheme(theme) {
  return theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
}

export { THEMES };
