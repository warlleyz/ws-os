
import { useEffect, useState } from 'react';
import {
  applyTheme,
  loadTheme,
  saveTheme,
} from './core/themeManager';
import Desktop from './shells/Desktop';
import './App.css';

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

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);
  const [welcomeOpen, setWelcomeOpen] = useState(shouldShowWelcome);

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
    return (
      <main className="ws-boot" aria-label="Inicializando WS OS">
        <div className="ws-boot__content" role="status">
          <strong>WS OS</strong>
          <p>Inicializando sistema...</p>
          <div className="ws-boot__progress" aria-hidden="true">
            <span />
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <Desktop
        theme={theme}
        onThemeChange={setTheme}
      />

      {welcomeOpen && (
        <div className="ws-welcome-backdrop">
          <section
            className="ws-welcome"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ws-welcome-title"
          >
            <span className="ws-welcome__label">WS OS</span>

            <h1 id="ws-welcome-title">
              Bem-vindo à WS OS
            </h1>

            <p>Olá! Eu sou o Wally, seu assistente.</p>

            <p>
              Explore os projetos, conheça o desenvolvedor
              e descubra as funcionalidades deste portfólio.
            </p>

            <button
              type="button"
              onClick={closeWelcome}
              autoFocus
            >
              Começar
            </button>
          </section>
        </div>
      )}
    </>
  );
}
