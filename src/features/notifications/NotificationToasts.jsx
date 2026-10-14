import { NotificationToast } from './NotificationToast';

export default function NotificationToasts({
  visibleToasts,
  dismissToast,
  handleNotificationOpen,
}) {
  return (
    <aside className="ws-toast-container" aria-label="Notificações recentes">
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
