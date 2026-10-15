import { useEffect, useRef } from 'react';
import { translate as t, useLocale } from '../i18n/i18n';
import { cancelCloseConfirmation, confirmAppClose } from '../../core/appCloseGuards';
import './AppCloseDialog.css';
export default function AppCloseDialog({ request }) {
  useLocale();
  const panelRef = useRef(null);
  useEffect(() => {
    if (!request) return;
    const origin = document.activeElement;
    panelRef.current?.querySelector('button')?.focus();
    return () => {
      if (origin?.isConnected) origin.focus();
    };
  }, [request]);
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
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cancelCloseConfirmation();
          }
          if (event.key === 'Tab') {
            const controls = panelRef.current.querySelectorAll('button');
            const first = controls[0],
              last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <h2 id="ws-close-title">{t('Alterações não salvas')}</h2>
        <p id="ws-close-message">{t('Há alterações não salvas. Deseja descartá-las e fechar?')}</p>
        <button type="button" onClick={cancelCloseConfirmation}>
          {t('Continuar editando')}
        </button>
        <button type="button" onClick={confirmAppClose}>
          {t('Descartar e fechar')}
        </button>
      </section>
    </div>
  );
}
