import { requestGuardedTransition } from './core/appCloseGuards';
import { useEffect, useState } from 'react';

import { translate as t, useLocale } from './shared/i18n/i18n';

import { applyTheme, useTheme, setTheme } from './core/themeManager';
import { updateAppearanceContext, useAppearance } from './core/appearanceManager';
import { applyAccessibility, useAccessibility } from './core/effectsManager';
import { getWallpaper, getWallpaperDefinition, subscribeWallpapers } from './core/wallpaperManager';
import { useCursorMode } from './core/cursorManager';
import { CURSOR_VARIANTS, getCursorCssValue } from './core/cursorCatalog';

import SystemProvider from './core/SystemProvider';
import WallyConversationProvider from './features/wally/WallyConversationProvider';

import { applyBrandingFavicon } from './core/branding';

import BootScreen from './features/boot/BootScreen';
import WelcomeDialog from './features/welcome/WelcomeDialog';

import Desktop from './shells/desktop/Desktop';
import Mobile from './shells/mobile/Mobile';

/* === Configurações iniciais === */
/* ----- Constantes do sistema ----- */
const WELCOME_STORAGE_KEY = 'ws-os:welcome-seen';
const BOOT_DURATION = 1500;
const MOBILE_BREAKPOINT = '(max-width: 767px)';

/* === Preferências iniciais === */
/* ----- Verificar apresentação de boas-vindas ----- */
function shouldShowWelcome() {
  try {
    return localStorage.getItem(WELCOME_STORAGE_KEY) !== 'true';
  } catch {
    return true;
  }
}

/* ----- Identificar shell inicial ----- */
function isMobileViewport() {
  return window.matchMedia(MOBILE_BREAKPOINT).matches;
}

/* === Aplicativo principal === */
export default function App() {
  /* ----- Preferências globais ----- */
  const locale = useLocale();
  const theme = useTheme();
  const appearance = useAppearance();
  const accessibility = useAccessibility();
  const cursorMode = useCursorMode();

  /* ----- Estados da aplicação ----- */
  const [bootComplete, setBootComplete] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(shouldShowWelcome);
  const [isMobile, setIsMobile] = useState(isMobileViewport);

  /* === Aplicação das preferências === */
  /* ----- Idioma ----- */
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  /* ----- Tema ----- */
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  /* ----- Aparência ----- */
  useEffect(() => {
    function refreshAppearance() {
      const shell = isMobile ? 'mobile' : 'desktop';
      updateAppearanceContext(
        theme,
        getWallpaperDefinition(getWallpaper(shell, theme), shell, theme),
      );
    }
    refreshAppearance();
    return subscribeWallpapers(refreshAppearance);
  }, [theme, isMobile]);

  /* ----- Ícone oficial conforme tema e cor de destaque ----- */
  useEffect(() => {
    applyBrandingFavicon(theme, appearance.accent, import.meta.env.BASE_URL);
  }, [theme, appearance.accent]);

  /* ----- Acessibilidade e efeitos ----- */
  useEffect(() => {
    applyAccessibility(accessibility);
  }, [accessibility]);

  /* ----- Cursores personalizados ----- */
  useEffect(() => {
    const root = document.documentElement;

    root.dataset.cursorMode = cursorMode;

    for (const variant of CURSOR_VARIANTS) {
      const property = `--ws-cursor-${variant}`;

      const value = getCursorCssValue(variant, theme, cursorMode, import.meta.env.BASE_URL);

      root.style.setProperty(property, value);
    }

    return () => {
      for (const variant of CURSOR_VARIANTS) {
        root.style.removeProperty(`--ws-cursor-${variant}`);
      }
    };
  }, [cursorMode, theme]);

  /* === Responsividade === */
  /* ----- Alternância entre Desktop e Mobile ----- */
  useEffect(() => {
    const media = window.matchMedia(MOBILE_BREAKPOINT);

    function updateShell(event) {
      const requested = event.matches;
      if (requested === isMobile) return;
      requestGuardedTransition(() => {
        if (media.matches === requested) setIsMobile(requested);
      });
    }

    media.addEventListener('change', updateShell);

    return () => {
      media.removeEventListener('change', updateShell);
    };
  }, [isMobile]);

  /* === Inicialização do sistema === */
  /* ----- Temporização do boot ----- */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBootComplete(true);
    }, BOOT_DURATION);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  /* === Boas-vindas === */
  /* ----- Encerrar apresentação inicial ----- */
  function closeWelcome() {
    try {
      localStorage.setItem(WELCOME_STORAGE_KEY, 'true');
    } catch {
      /* ----- A apresentação funciona sem armazenamento ----- */
    }

    setWelcomeOpen(false);
  }

  /* === Navegação acessível === */
  /* ----- Ir diretamente para o shell ativo ----- */
  function focusActiveShell(event) {
    event.preventDefault();

    const shellId = isMobile ? 'ws-mobile' : 'ws-desktop';

    document.getElementById(shellId)?.focus();
  }

  /* === Renderização === */
  /* ----- Tela de inicialização ----- */
  if (!bootComplete) {
    return <BootScreen />;
  }

  /* ----- Sistema principal ----- */
  return (
    <>
      <div inert={welcomeOpen} aria-hidden={welcomeOpen || undefined}>
        <a
          className="ws-skip-link"
          href={isMobile ? '#ws-mobile' : '#ws-desktop'}
          onClick={focusActiveShell}
        >
          {t('Ir para a área de trabalho')}
        </a>

        <SystemProvider>
          <WallyConversationProvider>
            {isMobile ? (
              <Mobile theme={theme} onThemeChange={setTheme} />
            ) : (
              <Desktop theme={theme} onThemeChange={setTheme} />
            )}
          </WallyConversationProvider>
        </SystemProvider>
      </div>

      {/* ----- Janela de boas-vindas ----- */}
      {welcomeOpen && <WelcomeDialog onClose={closeWelcome} />}
    </>
  );
}
