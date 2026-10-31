import { resetCursorMode } from './cursorManager';
import { setDoNotDisturb } from './notificationPreferences';
import { createPreferenceResetPlan } from './preferenceContract';
import { setTheme } from './themeManager';
import { setLocale } from '../shared/i18n/i18n';
import { resetAppearance } from './appearanceManager';
import { setAccessibility } from './effectsManager';
import { setTaskbarAutoHide } from './taskbarPreferences';
import { resetMobilePreferences } from './mobilePreferences';
import { setWallpaper, setWallpaperFit } from './wallpaperManager';
import { getDefaultWallpaper } from './wallpaperCatalog';
import { resetWidgetPreferences } from './widgetPreferences';

/* === RESTAURAÇÃO DOS WALLPAPERS === */
/* ----- RESTAURAÇÃO POR PLATAFORMA ----- */
function resetShellWallpapers(shell) {
  const dark = setWallpaper(getDefaultWallpaper('dark'), shell, 'dark');
  const light = setWallpaper(getDefaultWallpaper('light'), shell, 'light');

  const darkFit = setWallpaperFit('cover', shell, 'dark');
  const lightFit = setWallpaperFit('cover', shell, 'light');

  return dark && light && darkFit && lightFit;
}

/* === RESTAURAÇÃO DO SISTEMA === */
/* ----- VALIDAÇÃO DAS CATEGORIAS ----- */
export function restoreSystemPreferences(categories) {
  const plan = createPreferenceResetPlan(categories);

  if (!plan.ok) {
    return {
      ok: false,
      failed: [],
      code: plan.code,
    };
  }

  /* ----- AÇÕES DE RESTAURAÇÃO ----- */
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

  /* ----- EXECUÇÃO DAS AÇÕES ----- */
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