import { useEffect, useState } from 'react';
import { translate as t, useLocale } from './shared/i18n/i18n';
import { applyAccessibility, useAccessibility } from './core/effectsManager';

import { applyTheme, useTheme, setTheme } from './core/themeManager';
import { applyAppearance, useAppearance } from './core/appearanceManager';
import BootScreen from './features/boot/BootScreen';
import WelcomeDialog from './features/welcome/WelcomeDialog';
import Desktop from './shells/desktop/Desktop';
import Mobile from './shells/mobile/Mobile';

import SystemProvider from './core/SystemProvider';

const WELCOME_STORAGE_KEY = 'ws-os:welcome-seen';
const BOOT_DURATION = 1500;

function shouldShowWelcome() {
  try {
    return localStorage.getItem(WELCOME_STORAGE_KEY) !== 'true';
  } catch {
    return true;
  }
}

export default function App() {
  const locale = useLocale();
  const accessibility = useAccessibility();
  const appearance = useAppearance();

  useEffect(() => {
    applyAppearance(appearance);
  }, [appearance]);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  useEffect(() => {
    applyAccessibility(accessibility);
  }, [accessibility]);
  const [bootComplete, setBootComplete] = useState(false);
  const theme = useTheme();
  const [welcomeOpen, setWelcomeOpen] = useState(shouldShowWelcome);

  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 767px)').matches,
  );

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');

    function updateShell(event) {
      setIsMobile(event.matches);
    }

    media.addEventListener('change', updateShell);

    return () => media.removeEventListener('change', updateShell);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBootComplete(true);
    }, BOOT_DURATION);

    return () => window.clearTimeout(timer);
  }, []);

  function closeWelcome() {
    try {
      localStorage.setItem(WELCOME_STORAGE_KEY, 'true');
    } catch {
      // A apresentação funciona mesmo sem armazenamento.
    }

    setWelcomeOpen(false);
  }

  if (!bootComplete) {
    return <BootScreen />;
  }

  return (
    <>
      <div inert={welcomeOpen} aria-hidden={welcomeOpen || undefined}>
        <a
          className="ws-skip-link"
          href="#ws-desktop"
          onClick={(event) => {
            event.preventDefault();
            document.getElementById(isMobile ? 'ws-mobile' : 'ws-desktop')?.focus();
          }}
        >
          {t('Ir para a área de trabalho')}
        </a>
        <SystemProvider>
          {isMobile ? (
            <Mobile theme={theme} onThemeChange={setTheme} />
          ) : (
            <Desktop theme={theme} onThemeChange={setTheme} />
          )}
        </SystemProvider>
      </div>

      {welcomeOpen && <WelcomeDialog onClose={closeWelcome} />}
    </>
  );
}
