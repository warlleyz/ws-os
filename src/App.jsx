import { useEffect, useState } from 'react';

import { applyTheme, loadTheme, saveTheme } from './core/themeManager';
import BootScreen from './features/boot/BootScreen';
import WelcomeDialog from './features/welcome/WelcomeDialog';
import Desktop from './shells/desktop/Desktop';

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
  const [bootComplete, setBootComplete] = useState(false);
  const [theme, setTheme] = useState(loadTheme);
  const [welcomeOpen, setWelcomeOpen] = useState(shouldShowWelcome);

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
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
      <SystemProvider>
        <Desktop theme={theme} onThemeChange={setTheme} />
      </SystemProvider>

      {welcomeOpen && <WelcomeDialog onClose={closeWelcome} />}
    </>
  );
}
