import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { NotificationToast } from './NotificationToast';

export default function NotificationToasts({
  visibleToasts,
  dismissToast,
  handleNotificationOpen,
}) {
  useLocale();
  return (
    <aside className="ws-toast-container" aria-label={t('Notificações recentes')}>
      {visibleToasts.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={dismissToast}
          onAction={handleNotificationOpen}
        />
      ))}
    </aside>
  );
}
