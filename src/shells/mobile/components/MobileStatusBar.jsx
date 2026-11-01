import { useEffect, useState } from 'react';
import { Bell, Settings2 } from 'lucide-react';

import { translate as t, useLocale } from '../../../shared/i18n/i18n';

export default function MobileStatusBar({
    unreadCount,
    activePanel,
    onTogglePanel,
}) {
    const locale = useLocale();

    const [currentTime, setCurrentTime] = useState(() => new Date());

    /* === ATUALIZAÇÃO DO HORÁRIO === */
    useEffect(() => {
        const interval = window.setInterval(() => {
            setCurrentTime(new Date());
        }, 30000);

        return () => window.clearInterval(interval);
    }, []);

    /* === FORMATAÇÃO === */
    const formattedTime = currentTime.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
    });

    /* === INTERFACE === */
    return (
        <header className="ws-mobile__status-bar">
            <time
                className="ws-mobile__status-time"
                dateTime={currentTime.toISOString()}
            >
                {formattedTime}
            </time>

            <div className="ws-mobile__status-actions">
                <button
                    type="button"
                    aria-label={t('Notificações')}
                    title={t('Notificações')}
                    aria-expanded={activePanel === 'notifications'}
                    onClick={(event) => onTogglePanel('notifications', event)}
                >
                    <Bell size={18} aria-hidden="true" />

                    {unreadCount > 0 && (
                        <span className="ws-mobile__badge">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    aria-label={t('Controle Rápido')}
                    title={t('Controle Rápido')}
                    aria-expanded={activePanel === 'controls'}
                    onClick={(event) => onTogglePanel('controls', event)}
                >
                    <Settings2 size={18} aria-hidden="true" />
                </button>
            </div>
        </header>
    );
}