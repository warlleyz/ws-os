
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  Info,
  Moon,
  Trash2,
  TriangleAlert,
  X,
  ExternalLink,
} from 'lucide-react';

import { translate as t, useLocale } from '../../shared/i18n/i18n';
import Tooltip from '../../shared/components/Tooltip';
import {
  useNotificationPreferences,
  setDoNotDisturb,
} from '../../core/notificationPreferences';

const ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
};

function NotificationItem({
  notification,
  locale,
  onNotificationAction,
  onNotificationOpen,
  setNotificationOpen,
}) {
  const Icon = ICONS[notification.type] ?? Info;
  const date = new Date(notification.createdAt);
  const validDate = !Number.isNaN(date.getTime());

  return (
    <article
      className={[
        'taskbar-notifications__item',
        `taskbar-notifications__item--${notification.type}`,
        notification.read
          ? 'taskbar-notifications__item--read'
          : 'taskbar-notifications__item--unread',
      ].join(' ')}
    >
      <span className="taskbar-notifications__item-icon">
        <Icon size={17} aria-hidden="true" />
      </span>

      <div className="taskbar-notifications__item-content">
        <div className="taskbar-notifications__item-top">
          <span className="taskbar-notifications__source">
            {t(notification.source)}
          </span>

          {validDate && (
            <time dateTime={date.toISOString()}>
              {date.toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
          )}
        </div>

        <strong className="taskbar-notifications__item-title">
          {t(notification.title)}
        </strong>

        {notification.message && (
          <p className="taskbar-notifications__item-message">
            {t(notification.message)}
          </p>
        )}

        {notification.action?.type === 'open-app' && (
          <button
            type="button"
            className="taskbar-notifications__open-action"
            onClick={() => {
              onNotificationOpen(notification);
              setNotificationOpen(false);
            }}
          >
            <ExternalLink size={13} aria-hidden="true" />
            {t(notification.action.label ?? 'Abrir aplicativo')}
          </button>
        )}
      </div>

      <div className="taskbar-notifications__item-actions">
        {!notification.read && (
          <Tooltip content={t('Marcar como lida')}>
            <button
              type="button"
              aria-label={t('Marcar como lida')}
              onClick={() =>
                onNotificationAction('read', notification.id)
              }
            >
              <Check size={15} aria-hidden="true" />
            </button>
          </Tooltip>
        )}

        <Tooltip content={t('Excluir')}>
          <button
            type="button"
            aria-label={t('Excluir')}
            onClick={() =>
              onNotificationAction('remove', notification.id)
            }
          >
            <X size={15} aria-hidden="true" />
          </button>
        </Tooltip>
      </div>
    </article>
  );
}

export default function NotificationCenter({
  unreadCount,
  setNotificationOpen,
  notifications,
  onNotificationAction,
  onNotificationOpen,
}) {
  const locale = useLocale();
  const { doNotDisturb } = useNotificationPreferences();

  return (
    <section
      className="taskbar-notifications"
      role="region"
      aria-label={t('Central de notificações')}
    >
      <header className="taskbar-notifications__header">
        <div className="taskbar-notifications__heading">
          <span className="taskbar-notifications__heading-icon">
            <Bell size={19} aria-hidden="true" />
          </span>

          <div>
            <strong>{t('Notificações')}</strong>
            <small>
              {unreadCount > 0
                ? `${unreadCount} ${t('não lidas')}`
                : t('Tudo em dia')}
            </small>
          </div>
        </div>

        <Tooltip content={t('Fechar notificações')}>
          <button
            type="button"
            className="taskbar-notifications__icon-button"
            aria-label={t('Fechar notificações')}
            onClick={() => setNotificationOpen(false)}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </Tooltip>
      </header>

      <div className="taskbar-notifications__controls">
        <div className="taskbar-notifications__dnd">
          <span className="taskbar-notifications__dnd-icon">
            {doNotDisturb ? (
              <BellOff size={17} aria-hidden="true" />
            ) : (
              <Moon size={17} aria-hidden="true" />
            )}
          </span>

          <span className="taskbar-notifications__dnd-label">
            <strong>{t('Não Perturbe')}</strong>
            <small>
              {doNotDisturb
                ? t('Avisos temporários silenciados')
                : t('Avisos temporários ativados')}
            </small>
          </span>

          <Tooltip
            content={t(
              doNotDisturb
                ? 'Desativar Não Perturbe'
                : 'Ativar Não Perturbe',
            )}
          >
            <button
              type="button"
              role="switch"
              className={`taskbar-notifications__switch${doNotDisturb ? ' is-active' : ''
                }`}
              aria-checked={doNotDisturb}
              aria-label={t('Não Perturbe')}
              onClick={() => setDoNotDisturb(!doNotDisturb)}
            >
              <span />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="taskbar-notifications__section">
        <div className="taskbar-notifications__section-title">
          <div>
            <strong>{t('Recentes')}</strong>
            <span>{notifications.length}</span>
          </div>

          <div className="taskbar-notifications__toolbar">
            <Tooltip content={t('Marcar todas como lidas')}>
              <button
                type="button"
                aria-label={t('Marcar todas como lidas')}
                disabled={unreadCount === 0}
                onClick={() => onNotificationAction('read-all')}
              >
                <CheckCheck size={17} aria-hidden="true" />
              </button>
            </Tooltip>

            <Tooltip content={t('Limpar tudo')}>
              <button
                type="button"
                aria-label={t('Limpar tudo')}
                disabled={notifications.length === 0}
                onClick={() => onNotificationAction('clear')}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </Tooltip>
          </div>
        </div>

        {notifications.length > 0 ? (
          <div className="taskbar-notifications__list">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                locale={locale}
                onNotificationAction={onNotificationAction}
                onNotificationOpen={onNotificationOpen}
                setNotificationOpen={setNotificationOpen}
              />
            ))}
          </div>
        ) : (
          <div className="taskbar-notifications__empty">
            <div>
              <Bell size={26} aria-hidden="true" />
            </div>
            <strong>{t('Nenhuma notificação')}</strong>
            <p>
              {t(
                'Os avisos importantes do sistema aparecerão aqui.',
              )}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
