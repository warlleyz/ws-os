import { translate as t, useLocale } from '../../shared/i18n/i18n';
import './WelcomeDialog.css';
import { useEffect, useRef } from 'react';

export default function WelcomeDialog({ onClose }) {
  useLocale();
  const dialogRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current?.querySelector('button')?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous !== document.body && previous.isConnected)
        previous.focus();
      else document.querySelector('.taskbar__menu-button')?.focus();
    };
  }, []);
  return (
    <div className="ws-welcome-backdrop">
      <section
        className="ws-welcome"
        ref={dialogRef}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
          }
          if (event.key === 'Tab') {
            const items = Array.from(
              dialogRef.current.querySelectorAll(
                'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]',
              ),
            );
            const first = items[0],
              last = items.at(-1);
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ws-welcome-title"
      >
        <span className="ws-welcome__label">WS OS</span>

        <h1 id="ws-welcome-title">{t('Bem-vindo à WS OS')}</h1>

        <p>{t('Olá! Eu sou o Wally, seu assistente.')}</p>

        <p>
          {t(
            'Explore os projetos, conheça o desenvolvedor e descubra as funcionalidades deste portfólio.',
          )}
        </p>

        <button type="button" onClick={onClose}>
          {t('Começar')}
        </button>
      </section>
    </div>
  );
}
