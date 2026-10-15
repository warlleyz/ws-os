import { translate as t, useLocale } from '../../../shared/i18n/i18n';
import { useEffect, useState } from 'react';

export default function ClockWidget() {
  const locale = useLocale();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="ws-widget ws-widget--clock" aria-label={t('Widget de relógio')}>
      <time dateTime={now.toISOString()}>
        {now.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </time>

      <span>
        {now.toLocaleDateString(locale, {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        })}
      </span>
    </section>
  );
}
