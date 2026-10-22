import { memo, useEffect, useState } from 'react';
import { translate as t, useLocale } from '../../../shared/i18n/i18n';
import { useWidgetPreferences } from '../../../core/widgetPreferences';

import './ClockWidget.css';

function ClockWidget({ widget: suppliedWidget } = {}) {
  const locale = useLocale();
  const { widgets } = useWidgetPreferences();

  const clock = suppliedWidget ?? widgets.find((widget) => widget.instanceId === 'clock-default');

  /* === Preferência antiga inválida não interrompe o Desktop === */
  let timeZone;
  const requestedZone = clock?.settings?.timeZone;
  if (typeof requestedZone === 'string' && requestedZone) {
    try {
      new Intl.DateTimeFormat(locale, { timeZone: requestedZone });
      timeZone = requestedZone;
    } catch {
      /* O relógio continua no fuso local sem apagar a preferência. */
    }
  }

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeout;

    function updateClock() {
      const current = new Date();
      setNow(current);

      const remaining = 60000 - current.getSeconds() * 1000 - current.getMilliseconds();

      timeout = window.setTimeout(updateClock, Math.max(100, remaining + 50));
    }

    updateClock();

    function refreshOnFocus() {
      if (document.hidden) {
        window.clearTimeout(timeout);
        return;
      }
      window.clearTimeout(timeout);
      updateClock();
    }

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, []);

  const options = timeZone ? { timeZone } : {};

  const time = new Intl.DateTimeFormat(locale, {
    ...options,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);

  const weekday = new Intl.DateTimeFormat(locale, {
    ...options,
    weekday: 'long',
  }).format(now);

  const fullDate = new Intl.DateTimeFormat(locale, {
    ...options,
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const shortDate = new Intl.DateTimeFormat(locale, {
    ...options,
    day: '2-digit',
    month: 'short',
  }).format(now);

  const zoneLabel = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';

  return (
    <section className="ws-widget ws-widget--clock" aria-label={t('Widget de relógio')}>
      <div className="ws-clock__content">
        <span className="ws-clock__caption">{t('Hora local')}</span>

        <time className="ws-clock__time" dateTime={now.toISOString()}>
          {time}
        </time>

        <div className="ws-clock__date">
          <span className="ws-clock__weekday">{weekday}</span>

          <span className="ws-clock__full-date">{fullDate}</span>

          <span className="ws-clock__short-date">{shortDate}</span>
        </div>

        <span className="ws-clock__timezone">{zoneLabel.replaceAll('_', ' ')}</span>
      </div>

      <div className="ws-clock__decoration" aria-hidden="true" />
    </section>
  );
}

export default memo(ClockWidget);
