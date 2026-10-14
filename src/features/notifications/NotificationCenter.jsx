import { SystemIcon } from '../../shared/components/SystemIcon';

export default function NotificationCenter({
  unreadCount,
  setNotificationOpen,
  notifications,
  onNotificationAction,
  onNotificationOpen,
}) {
  return (
    <section className="taskbar-notifications" role="region" aria-label="Central de notificações">
      <header className="taskbar-notifications__header">
        <div>
          <strong>Notificações</strong>
          <small>
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
              : 'Nenhuma notificação não lida'}
          </small>
        </div>
        <button
          type="button"
          aria-label="Fechar notificações"
          title="Fechar notificações"
          onClick={() => setNotificationOpen(false)}
        >
          ×
        </button>
      </header>
      {notifications.length > 0 ? (
        <>
          <div className="taskbar-notifications__toolbar">
            <button
              type="button"
              disabled={unreadCount === 0}
              onClick={() => onNotificationAction('read-all')}
            >
              Marcar todas como lidas
            </button>
            <button type="button" onClick={() => onNotificationAction('clear')}>
              Limpar tudo
            </button>
          </div>
          <div className="taskbar-notifications__list">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={[
                  'taskbar-notifications__item',
                  notification.read
                    ? 'taskbar-notifications__item--read'
                    : 'taskbar-notifications__item--unread',
                ].join(' ')}
              >
                <div className="taskbar-notifications__item-top">
                  <span className="taskbar-notifications__source">{notification.source}</span>
                  <time dateTime={new Date(notification.createdAt).toISOString()}>
                    {new Date(notification.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <strong>{notification.title}</strong>
                {notification.message && <p>{notification.message}</p>}
                <div className="taskbar-notifications__actions">
                  {notification.action?.type === 'open-app' && (
                    <button
                      type="button"
                      onClick={() => {
                        onNotificationOpen(notification);
                        setNotificationOpen(false);
                      }}
                    >
                      {notification.action.label ?? 'Abrir aplicativo'}
                    </button>
                  )}
                  {!notification.read && (
                    <button
                      type="button"
                      onClick={() => onNotificationAction('read', notification.id)}
                    >
                      Marcar como lida
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onNotificationAction('remove', notification.id)}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="taskbar-notifications__empty">
          <SystemIcon name="bell" size={26} />
          <strong>Tudo em dia</strong>
          <p>Nenhuma notificação por enquanto.</p>
        </div>
      )}
    </section>
  );
}
