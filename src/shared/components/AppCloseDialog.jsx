
import { useEffect, useRef } from 'react';

import {
  cancelCloseConfirmation,
  confirmAppClose,
} from '../../core/appCloseGuards';
import { translate as t, useLocale } from '../i18n/i18n';

import './AppCloseDialog.css';

export default function AppCloseDialog({ request }) {
  /* === Idioma e referências === */
  useLocale();

  const panelRef = useRef(null);

  /* === Configuração da confirmação === */
  /* ----- Tipo de operação ----- */
  const isNavigation = request?.action === 'navigate';

  const message = isNavigation
    ? 'Há alterações não salvas. Deseja descartá-las e continuar?'
    : 'Há alterações não salvas. Deseja descartá-las e fechar?';

  const confirmLabel = isNavigation
    ? 'Descartar e continuar'
    : 'Descartar e fechar';

  /* === Acessibilidade === */
  /* ----- Foco inicial e restauração ----- */
  useEffect(() => {
    if (!request) return;

    const previousFocus = document.activeElement;

    panelRef.current?.querySelector('button')?.focus();

    return () => {
      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [request]);

  /* ----- Navegação por teclado ----- */
  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();

      cancelCloseConfirmation();
      return;
    }

    if (event.key !== 'Tab') return;

    const controls = Array.from(
      panelRef.current?.querySelectorAll('button:not(:disabled)') ?? [],
    );

    if (controls.length === 0) {
      event.preventDefault();
      return;
    }

    const first = controls[0];
    const last = controls[controls.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* === Renderização === */
  if (!request) return null;

  return (
    <div className="ws-close-overlay">
      {/* === Diálogo de confirmação === */}
      <section
        ref={panelRef}
        className="ws-close-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ws-close-title"
        aria-describedby="ws-close-message"
        onKeyDown={handleKeyDown}
      >
        {/* ----- Título e descrição ----- */}
        <h2 id="ws-close-title">
          {t('Alterações não salvas')}
        </h2>

        <p id="ws-close-message">
          {t(message)}
        </p>

        {/* ----- Ações disponíveis ----- */}
        <button
          type="button"
          onClick={cancelCloseConfirmation}
        >
          {t('Continuar editando')}
        </button>

        <button
          type="button"
          onClick={confirmAppClose}
        >
          {t(confirmLabel)}
        </button>
      </section>
    </div>
  );
}
