import { useRef } from 'react';
import { useEffect } from 'react';
export // Avisos temporários: o histórico é mantido pelo notificationManager.
const TOAST_DURATION = 5000;
export function NotificationToast({ notification, onDismiss, onAction }) {
  const remainingRef = useRef(TOAST_DURATION);
  const startedAtRef = useRef(null);
  const timerRef = useRef(null);
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);
  useEffect(() => {
    const remaining = remainingRef;
    const startedAt = startedAtRef;
    const timer = timerRef;
    const element = document.getElementById(`ws-toast-${notification.id}`);
    function pauseTimer() {
      if (startedAt.current === null) return;
      window.clearTimeout(timer.current);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
      startedAt.current = null;
      timer.current = null;
    }
    function startTimer() {
      if (startedAt.current !== null || remaining.current <= 0) return;
      startedAt.current = Date.now();
      timer.current = window.setTimeout(() => {
        startedAt.current = null;
        timer.current = null;
        onDismissRef.current(notification.id);
      }, remaining.current);
    }
    function handleFocusOut(event) {
      if (!element?.contains(event.relatedTarget) && !element?.matches(':hover')) startTimer();
    }
    function handleMouseLeave() {
      if (!element?.contains(document.activeElement)) startTimer();
    }
    startTimer();
    element?.addEventListener('mouseenter', pauseTimer);
    element?.addEventListener('mouseleave', handleMouseLeave);
    element?.addEventListener('focusin', pauseTimer);
    element?.addEventListener('focusout', handleFocusOut);
    return () => {
      pauseTimer();
      element?.removeEventListener('mouseenter', pauseTimer);
      element?.removeEventListener('mouseleave', handleMouseLeave);
      element?.removeEventListener('focusin', pauseTimer);
      element?.removeEventListener('focusout', handleFocusOut);
    };
  }, [notification.id]);
  const typeLabels = {
    info: 'Informação',
    success: 'Sucesso',
    warning: 'Atenção',
    error: 'Erro',
  };
  return (
    <article
      id={`ws-toast-${notification.id}`}
      className={`ws-toast ws-toast--${notification.type}`}
      role="status"
      aria-label={`Notificação: ${notification.title}`}
    >
      <div className="ws-toast__indicator" aria-hidden="true" />
      <div className="ws-toast__content">
        <div className="ws-toast__header">
          <span className="ws-toast__source">{notification.source}</span>
          <span className="ws-toast__type">{typeLabels[notification.type] ?? 'Informação'}</span>
        </div>
        <strong className="ws-toast__title">{notification.title}</strong>
        {notification.message && <p className="ws-toast__message">{notification.message}</p>}
        {notification.action?.type === 'open-app' && (
          <button type="button" className="ws-toast__action" onClick={() => onAction(notification)}>
            {notification.action.label ?? 'Abrir aplicativo'}
          </button>
        )}
      </div>
      <button
        type="button"
        className="ws-toast__close"
        aria-label={`Dispensar notificação: ${notification.title}`}
        title="Dispensar"
        onClick={() => onDismiss(notification.id)}
      >
        ×
      </button>
    </article>
  );
}
