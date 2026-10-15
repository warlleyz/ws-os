import { setTheme } from './themeManager';
import { setLocale } from '../shared/i18n/i18n';
import { resetAppearance } from './appearanceManager';
import { setAccessibility } from './effectsManager';
import { setTaskbarAutoHide } from './taskbarPreferences';
import { resetMobilePreferences } from './mobilePreferences';
import { setWallpaper } from './wallpaperManager';
import { resetWidgetPreferences } from './widgetPreferences';

// Explicit allowlist: never clear storage, delete databases, or touch app documents.
export function restoreSystemPreferences() {
  const actions = {
    theme: () => setTheme('dark'),
    locale: () => setLocale('pt-BR'),
    appearance: resetAppearance,
    accessibility: () =>
      setAccessibility({ motion: false, transparency: false, lowEffects: false }),
    taskbar: () => setTaskbarAutoHide(false),
    mobile: resetMobilePreferences,
    desktopWallpaper: () => setWallpaper('original', 'desktop'),
    mobileWallpaper: () => setWallpaper('original', 'mobile'),
    widgets: resetWidgetPreferences,
  };
  const failed = [];
  for (const [key, apply] of Object.entries(actions)) {
    try {
      if (!apply()) failed.push(key);
    } catch {
      failed.push(key);
    }
  }
  return { ok: failed.length === 0, failed };
}
