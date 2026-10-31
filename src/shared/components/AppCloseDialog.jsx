import { useEffect, useRef } from 'react';

import { cancelCloseConfirmation, confirmAppClose } from '../../core/appCloseGuards';
import { translate as t, useLocale } from '../i18n/i18n';

import './AppCloseDialog.css';

/* === DIÁLOGO DE ALTERAÇÕES NÃO SALVAS === */
export default function AppCloseDialog({ request }) {
  /* ----- IDIOMA E REFERÊNCIAS ----- */
  useLocale();

  const panelRef = useRef(null);

  /* === CONFIGURAÇÃO DA CONFIRMAÇÃO === */
  /* ----- TIPO DE OPERAÇÃO ----- */
  const isNavigation = request?.action === 'navigate';

  const message = isNavigation
    ? 'Há alterações não salvas. Deseja descartá-las e continuar?'
    : 'Há alterações não salvas. Deseja descartá-las e fechar?';

  const confirmLabel = isNavigation ? 'Descartar e continuar' : 'Descartar e fechar';

  /* === ACESSIBILIDADE === */
  /* ----- FOCO INICIAL E RESTAURAÇÃO ----- */
  useEffect(() => {
    if (!request) return undefined;

    const previousFocus = request.returnFocus ?? document.activeElement;

    panelRef.current?.querySelector('button')?.focus();

    return () => {
      if (previousFocus?.isConnected && !previousFocus.closest?.('[inert]')) {
        previousFocus.focus();
      } else {
        const fallback =
          document.querySelector(
            '.desktop-window--active:not([inert]) .desktop-window__drag-area',
          ) ??
          document.querySelector('.taskbar__menu-button') ??
          document.querySelector('#ws-mobile');

        fallback?.focus();
      }
    };
  }, [request]);

  /* ----- NAVEGAÇÃO POR TECLADO ----- */
  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();

      cancelCloseConfirmation();
      return;
    }

    if (event.key !== 'Tab') return;

    const controls = Array.from(panelRef.current?.querySelectorAll('button:not(:disabled)') ?? []);

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

  /* === RENDERIZAÇÃO === */
  if (!request) return null;

  return (
    <div className="ws-close-overlay">
      <section
        ref={panelRef}
        className="ws-close-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ws-close-title"
        aria-describedby="ws-close-message"
        onKeyDown={handleKeyDown}
      >
        {/* ----- CABEÇALHO ----- */}
        <h2 id="ws-close-title">{t('Alterações não salvas')}</h2>

        {/* ----- DESCRIÇÃO ----- */}
        <p id="ws-close-message">{t(message)}</p>

        {/* ----- AÇÕES ----- */}
        <div className="ws-close-dialog__actions">
          <button
            type="button"
            className="ws-button ws-button--secondary"
            onClick={cancelCloseConfirmation}
          >
            {t('Continuar editando')}
          </button>

          <button
            type="button"
            className="ws-button ws-button--danger"
            onClick={confirmAppClose}
          >
            {t(confirmLabel)}
          </button>
        </div>
      </section>
    </div>
  );
}