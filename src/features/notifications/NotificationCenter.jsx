import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { SystemIcon } from '../../shared/components/SystemIcon';

export default function NotificationCenter({
  unreadCount,
  setNotificationOpen,
  notifications,
  onNotificationAction,
  onNotificationOpen,
}) {
  const locale = useLocale();
  return (
    <section
      className="taskbar-notifications"
      role="region"
      aria-label={t('Central de notificações')}
    >
      <header className="taskbar-notifications__header">
        <div>
          <strong>{t('Notificações')}</strong>
          <small>
            {unreadCount > 0
              ? t(`${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`)
              : t('Nenhuma notificação não lida')}
          </small>
        </div>
        <button
          type="button"
          aria-label={t('Fechar notificações')}
          title={t('Fechar notificações')}
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
              {t('Marcar todas como lidas')}
            </button>
            <button type="button" onClick={() => onNotificationAction('clear')}>
              {t('Limpar tudo')}
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
                  <span className="taskbar-notifications__source">{t(notification.source)}</span>
                  <time dateTime={new Date(notification.createdAt).toISOString()}>
                    {new Date(notification.createdAt).toLocaleTimeString(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <strong>{t(notification.title)}</strong>
                {notification.message && <p>{t(notification.message)}</p>}
                <div className="taskbar-notifications__actions">
                  {notification.action?.type === 'open-app' && (
                    <button
                      type="button"
                      onClick={() => {
                        onNotificationOpen(notification);
                        setNotificationOpen(false);
                      }}
                    >
                      {notification.action.label ?? t('Abrir aplicativo')}
                    </button>
                  )}
                  {!notification.read && (
                    <button
                      type="button"
                      onClick={() => onNotificationAction('read', notification.id)}
                    >
                      {t('Marcar como lida')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onNotificationAction('remove', notification.id)}
                  >
                    {t('Excluir')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="taskbar-notifications__empty">
          <SystemIcon name="bell" size={26} />
          <strong>{t('Tudo em dia')}</strong>
          <p>{t('Nenhuma notificação por enquanto.')}</p>
        </div>
      )}
    </section>
  );
}
