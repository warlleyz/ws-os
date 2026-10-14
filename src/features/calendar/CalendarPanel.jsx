export default function CalendarPanel({
  monthLabel,
  setCalendarMonth,
  currentTime,
  setCalendarOpen,
  firstWeekday,
  daysInMonth,
  calendarMonth,
}) {
  return (
    <section className="taskbar-calendar" role="region" aria-label="Calendário">
      <header className="taskbar-calendar__header">
        <strong>{monthLabel}</strong>
        <div>
          <button
            type="button"
            aria-label="Mês anterior"
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
            Hoje
          </button>
          <button
            type="button"
            aria-label="Próximo mês"
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
            aria-label="Fechar calendário"
            onClick={() => setCalendarOpen(false)}
          >
            ×
          </button>
        </div>
      </header>
      <div className="taskbar-calendar__grid">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
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
