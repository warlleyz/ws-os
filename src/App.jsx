
import { useState } from 'react';
import Desktop from './shells/Desktop';
import './App.css';

const WELCOME_STORAGE_KEY = 'ws-os:welcome-seen';

function shouldShowWelcome() {
  try {
    return localStorage.getItem(WELCOME_STORAGE_KEY) !== 'true';
  } catch {
    return true;
  }
}

export default function App() {
  const [welcomeOpen, setWelcomeOpen] = useState(shouldShowWelcome);

  function closeWelcome() {
    try {
      localStorage.setItem(WELCOME_STORAGE_KEY, 'true');
    } catch {
      // A apresentação continua funcionando sem armazenamento.
    }

    setWelcomeOpen(false);
  }

  return (
    <>
      <Desktop />

      {welcomeOpen && (
        <div className="ws-welcome-backdrop">
          <section
            className="ws-welcome"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ws-welcome-title"
          >
            <span className="ws-welcome__label">
              WS OS
            </span>

            <h1 id="ws-welcome-title">
              Bem-vindo à WS OS
            </h1>

            <p>
              Olá! Eu sou o Wally, seu assistente.
            </p>

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
