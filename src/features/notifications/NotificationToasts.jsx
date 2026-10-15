
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
} from 'lucide-react';

import {
  translate as t,
  useLocale,
} from '../../shared/i18n/i18n';

import { NotificationToast } from './NotificationToast';

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
};

export default function NotificationToasts({
  visibleToasts,
  dismissToast,
  handleNotificationOpen,
}) {
  useLocale();

  const [active, ...pending] = visibleToasts;

  return (
    <aside
      className="ws-toast-container"
      aria-label={t('Notificações recentes')}
    >
      {active && (
        <div className="ws-toast-queue">
          <NotificationToast
            key={active.id}
            notification={active}
            onDismiss={dismissToast}
            onAction={handleNotificationOpen}
          />

          <div
            className="ws-toast-queue__pending"
            aria-label={`${pending.length} notificações aguardando`}
          >
            {pending.slice(0, 3).map((notification, index) => {
              const Icon = ICONS[notification.type] ?? Info;

              return (
                <span
                  key={notification.id}
                  className={[
                    'ws-toast-queue__icon',
                    `ws-toast-queue__icon--${notification.type}`,
                  ].join(' ')}
                  style={{ '--queue-index': index }}
                  title={t(notification.title)}
                >
                  <Icon
                    size={17}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </span>
              );
            })}

            {pending.length > 3 && (
              <span className="ws-toast-queue__more">
                +{pending.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
