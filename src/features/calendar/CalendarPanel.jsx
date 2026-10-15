import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X, CalendarCheck2, Flag } from 'lucide-react';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { getCalendarEntries, toCalendarDateKey } from './CalendarService';

export default function CalendarPanel({
  monthLabel,
  setCalendarMonth,
  currentTime,
  setCalendarOpen,
  calendarMonth,
}) {
  const locale = useLocale();
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const todayKey = toCalendarDateKey(currentTime);
  const [selectedDate, setSelectedDate] = useState(() => todayKey);
  const selectedInMonth = selectedDate.slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`;
  const activeDateKey = selectedInMonth ? selectedDate : toCalendarDateKey(new Date(year, month, 1));
  const entries = [
    ...getCalendarEntries(year - 1),
    ...getCalendarEntries(year),
    ...getCalendarEntries(year + 1),
  ];
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const gridCellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const entriesByDate = new Map();
  for (const entry of entries) {
    const dayEntries = entriesByDate.get(entry.date) ?? [];
    dayEntries.push(entry);
    entriesByDate.set(entry.date, dayEntries);
  }
  const selectedEntries = entriesByDate.get(activeDateKey) ?? [];
  const [selectedYear, selectedMonth, selectedDay] = activeDateKey.split('-').map(Number);
  const selectedLabel = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' })
    .format(new Date(selectedYear, selectedMonth - 1, selectedDay));

  function moveMonth(direction) {
    const next = new Date(year, month + direction, 1);
    setCalendarMonth(next);
    setSelectedDate(toCalendarDateKey(next));
  }

  function goToday() {
    setCalendarMonth(new Date(currentTime.getFullYear(), currentTime.getMonth(), 1));
    setSelectedDate(toCalendarDateKey(currentTime));
  }

  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2024, 0, 7 + index)));

  return (
    <section className="taskbar-calendar" role="region" aria-label={t('Calendário')}>
      <header className="taskbar-calendar__header">
        <div className="taskbar-calendar__heading">
          <CalendarDays size={17} aria-hidden="true" />
          <strong>{monthLabel}</strong>
        </div>
        <div className="taskbar-calendar__actions">
          <button type="button" aria-label={t('Mês anterior')} title={t('Mês anterior')} onClick={() => moveMonth(-1)}>
            <ChevronLeft size={17} />
          </button>
          <button type="button" className="taskbar-calendar__today-button" onClick={goToday}>
            {t('Hoje')}
          </button>
          <button type="button" aria-label={t('Próximo mês')} title={t('Próximo mês')} onClick={() => moveMonth(1)}>
            <ChevronRight size={17} />
          </button>
          <button type="button" aria-label={t('Fechar calendário')} title={t('Fechar calendário')} onClick={() => setCalendarOpen(false)}>
            <X size={16} />
          </button>
        </div>
      </header>

      <div className="taskbar-calendar__body">
        <div className="taskbar-calendar__grid" aria-label={monthLabel}>
          {weekdays.map((day, index) => (
            <span className="taskbar-calendar__weekday" key={`weekday-${index}`}>{day}</span>
          ))}
          {Array.from({ length: gridCellCount }, (_, index) => {
            const date = new Date(year, month, index - firstWeekday + 1);
            const day = date.getDate();
            const key = toCalendarDateKey(date);
            const dayEntries = entriesByDate.get(key) ?? [];
            const hasHoliday = dayEntries.some((entry) => entry.type === 'holiday');
            const hasEvent = dayEntries.some((entry) => entry.type === 'event');
            const isToday = todayKey === key;
            const isSelected = activeDateKey === key;
            const isOutside = date.getMonth() !== month;
            const dateLabel = new Intl.DateTimeFormat(locale, {
              day: 'numeric', month: 'long', year: 'numeric',
            }).format(date);

            function handleSelectDate() {
              setSelectedDate(key);
              if (isOutside) {
                setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
              }
            }

            return (
              <button
                type="button"
                key={key}
                className={[
                  'taskbar-calendar__date',
                  isOutside && 'taskbar-calendar__outside',
                  isToday && 'taskbar-calendar__today',
                  isSelected && 'taskbar-calendar__selected',
                  hasHoliday && 'taskbar-calendar__holiday',
                  hasEvent && 'taskbar-calendar__event',
                ].filter(Boolean).join(' ')}
                aria-pressed={isSelected}
                aria-current={isToday ? 'date' : undefined}
                aria-label={`${dateLabel}${dayEntries.length ? `: ${dayEntries.map((entry) => t(entry.name)).join(', ')}` : ''}`}
                title={dayEntries.map((entry) => t(entry.name)).join(' · ') || dateLabel}
                onClick={handleSelectDate}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="taskbar-calendar__agenda" aria-live="polite">
          <div className="taskbar-calendar__agenda-heading">
            <strong>{selectedLabel}</strong>
            <span>{selectedEntries.length ? `${selectedEntries.length}` : ''}</span>
          </div>
          {selectedEntries.length ? (
            <ul className="taskbar-calendar__agenda-list">
              {selectedEntries.map((entry, index) => (
                <li className="taskbar-calendar__agenda-item" key={`${entry.date}-${entry.type}-${index}`}>
                  {entry.type === 'holiday' ? <Flag size={15} aria-hidden="true" /> : <CalendarCheck2 size={15} aria-hidden="true" />}
                  <div>
                    <strong>{t(entry.name)}</strong>
                    {entry.description && <p>{t(entry.description)}</p>}
                    {entry.url && <a href={entry.url} target="_blank" rel="noopener noreferrer">{t('Saiba mais')}</a>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="taskbar-calendar__no-events">{t('Nenhum feriado ou evento público nesta data.')}</p>
          )}
        </div>
      </div>
    </section>
  );
}
