import { translate as t, useLocale } from '../../shared/i18n/i18n';
export default function CalendarPanel({
  monthLabel,
  setCalendarMonth,
  currentTime,
  setCalendarOpen,
  firstWeekday,
  daysInMonth,
  calendarMonth,
}) {
  const locale = useLocale();
  return (
    <section className="taskbar-calendar" role="region" aria-label={t('Calendário')}>
      <header className="taskbar-calendar__header">
        <strong>{monthLabel}</strong>
        <div>
          <button
            type="button"
            aria-label={t('Mês anterior')}
            onClick={() =>
              setCalendarMonth(
                (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
              )
            }
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() =>
              setCalendarMonth(new Date(currentTime.getFullYear(), currentTime.getMonth(), 1))
            }
          >
            {t('Hoje')}
          </button>
          <button
            type="button"
            aria-label={t('Próximo mês')}
            onClick={() =>
              setCalendarMonth(
                (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
              )
            }
          >
            ›
          </button>
          <button
            type="button"
            aria-label={t('Fechar calendário')}
            onClick={() => setCalendarOpen(false)}
          >
            ×
          </button>
        </div>
      </header>
      <div className="taskbar-calendar__grid">
        {Array.from({ length: 7 }, (_, index) =>
          new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(
            new Date(2024, 0, 7 + index),
          ),
        ).map((day, index) => (
          <span className="taskbar-calendar__weekday" key={index}>
            {day}
          </span>
        ))}
        {Array.from(
          {
            length: firstWeekday,
          },
          (_, index) => (
            <span key={`empty-${index}`} aria-hidden="true" />
          ),
        )}
        {Array.from(
          {
            length: daysInMonth,
          },
          (_, index) => {
            const day = index + 1;
            const isToday =
              currentTime.getFullYear() === calendarMonth.getFullYear() &&
              currentTime.getMonth() === calendarMonth.getMonth() &&
              currentTime.getDate() === day;
            return (
              <span
                key={day}
                className={isToday ? 'taskbar-calendar__today' : undefined}
                aria-current={isToday ? 'date' : undefined}
              >
                {day}
              </span>
            );
          },
        )}
      </div>
    </section>
  );
}
