import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { getBrazilianHolidays } from './CalendarService';
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
  const holidays = getBrazilianHolidays(calendarMonth.getFullYear());

  const holidaysByDate = new Map(
    holidays.map((holiday) => [holiday.date, holiday.name]),
  );
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
            const dateKey = [
              calendarMonth.getFullYear(),
              String(calendarMonth.getMonth() + 1).padStart(2, '0'),
              String(day).padStart(2, '0'),
            ].join('-');

            const holiday = holidaysByDate.get(dateKey);
            const isToday =
              currentTime.getFullYear() === calendarMonth.getFullYear() &&
              currentTime.getMonth() === calendarMonth.getMonth() &&
              currentTime.getDate() === day;
            return (
              <span
                key={day}
                className={[
                  isToday ? 'taskbar-calendar__today' : '',
                  holiday ? 'taskbar-calendar__holiday' : '',
                ].filter(Boolean).join(' ')}
                aria-current={isToday ? 'date' : undefined}
                aria-label={holiday ? `${day}: ${t(holiday)}` : undefined}
                title={holiday ? t(holiday) : undefined}
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
