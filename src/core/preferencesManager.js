import { resetCursorMode } from './cursorManager';
import { setDoNotDisturb } from './notificationPreferences';

import { createPreferenceResetPlan } from './preferenceContract';
import { setTheme } from './themeManager';
import { setLocale } from '../shared/i18n/i18n';
import { resetAppearance } from './appearanceManager';
import { setAccessibility } from './effectsManager';
import { setTaskbarAutoHide } from './taskbarPreferences';
import { resetMobilePreferences } from './mobilePreferences';
import { setWallpaper } from './wallpaperManager';
import { getDefaultWallpaper } from './wallpaperCatalog';
import { resetWidgetPreferences } from './widgetPreferences';

/* === Restauração de wallpapers === */
/* ----- Restaurar os dois temas de uma plataforma ----- */
function resetShellWallpapers(shell) {
  const dark = setWallpaper(getDefaultWallpaper('dark'), shell, 'dark');

  const light = setWallpaper(getDefaultWallpaper('light'), shell, 'light');

  return dark && light;
}

/* === Restauração do sistema === */
/* ----- Preferências autorizadas ----- */
export function restoreSystemPreferences(categories) {
  const plan = createPreferenceResetPlan(categories);

  if (!plan.ok) {
    return {
      ok: false,
      failed: [],
      code: plan.code,
    };
  }

  const actions = {
    theme: () => setTheme('dark'),
    cursor: resetCursorMode,
    notifications: () => setDoNotDisturb(false),
    locale: () => setLocale('pt-BR'),
    appearance: resetAppearance,

    accessibility: () =>
      setAccessibility({
        motion: false,
        transparency: false,
        lowEffects: false,
      }),

    taskbar: () => setTaskbarAutoHide(false),
    mobile: resetMobilePreferences,

    desktopWallpaper: () => resetShellWallpapers('desktop'),
    mobileWallpaper: () => resetShellWallpapers('mobile'),

    widgets: resetWidgetPreferences,
  };

  /* ----- Executar todas as ações solicitadas ----- */
  const failed = [];

  for (const key of plan.actions) {
    const apply = actions[key];

    try {
      if (!apply()) {
        failed.push(key);
      }
    } catch {
      failed.push(key);
    }
  }

  return {
    ok: failed.length === 0,
    failed,
  };
}
