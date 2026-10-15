
import { memo, useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

import {
    translate as t,
    useLocale,
} from '../../../shared/i18n/i18n';

import './CalendarWidget.css';

const WEEK_DAYS = 7;

function CalendarWidget() {
    const locale = useLocale();

    const [today, setToday] = useState(() => new Date());
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        let timeout;

        function updateDate() {
            const current = new Date();
            setToday(current);

            const nextDay = new Date(
                current.getFullYear(),
                current.getMonth(),
                current.getDate() + 1,
            );

            timeout = window.setTimeout(
                updateDate,
                Math.max(1000, nextDay.getTime() - current.getTime() + 100),
            );
        }

        updateDate();

        function handleVisibility() {
            if (document.visibilityState === 'visible') {
                window.clearTimeout(timeout);
                updateDate();
            }
        }

        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            window.clearTimeout(timeout);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    const displayed = new Date(
        today.getFullYear(),
        today.getMonth() + offset,
        1,
    );

    const year = displayed.getFullYear();
    const month = displayed.getMonth();

    const monthLabel = new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
    }).format(displayed);

    const weekdays = useMemo(() => {
        // 11/10/2026 foi um domingo.
        const sunday = new Date(2026, 9, 11);

        return Array.from({ length: WEEK_DAYS }, (_, index) => {
            const date = new Date(2026, 9, 11 + index);

            return {
                name: new Intl.DateTimeFormat(locale, {
                    weekday: 'short',
                }).format(date),
                full: new Intl.DateTimeFormat(locale, {
                    weekday: 'long',
                }).format(date),
            };
        });
    }, [locale]);

    const days = useMemo(() => {
        const firstWeekday = new Date(year, month, 1).getDay();

        const daysInMonth = new Date(
            year,
            month + 1,
            0,
        ).getDate();

        const count = Math.ceil(
            (firstWeekday + daysInMonth) / WEEK_DAYS,
        ) * WEEK_DAYS;

        return Array.from({ length: count }, (_, index) => {
            const date = new Date(
                year,
                month,
                index - firstWeekday + 1,
            );

            return {
                date,
                day: date.getDate(),
                isOutside: date.getMonth() !== month,
                isToday:
                    date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear(),
            };
        });
    }, [year, month, today]);

    function getDateLabel(date) {
        return new Intl.DateTimeFormat(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    }

    return (
        <section
            className="ws-widget ws-widget--calendar"
            aria-label={t('Calendário')}
        >
            <header className="ws-calendar__header">
                <div className="ws-calendar__heading">
                    <span className="ws-calendar__eyebrow">
                        {t('Calendário')}
                    </span>

                    <strong className="ws-calendar__month">
                        {monthLabel}
                    </strong>
                </div>

                <div className="ws-calendar__navigation">
                    <button
                        type="button"
                        className="ws-calendar__nav-button"
                        onClick={() => setOffset((value) => value - 1)}
                        aria-label={t('Mês anterior')}
                        title={t('Mês anterior')}
                    >
                        <ChevronLeft size={16} aria-hidden="true" />
                    </button>

                    <button
                        type="button"
                        className="ws-calendar__nav-button"
                        onClick={() => setOffset((value) => value + 1)}
                        aria-label={t('Próximo mês')}
                        title={t('Próximo mês')}
                    >
                        <ChevronRight size={16} aria-hidden="true" />
                    </button>
                </div>
            </header>

            <div
                className="ws-calendar__grid"
                role="grid"
                aria-label={monthLabel}
            >
                {weekdays.map((weekday, index) => (
                    <span
                        key={`weekday-${index}`}
                        className="ws-calendar__weekday"
                        role="columnheader"
                        title={weekday.full}
                    >
                        {weekday.name}
                    </span>
                ))}

                {days.map(({ date, day, isOutside, isToday }) => (
                    <span
                        key={date.toISOString()}
                        className={[
                            'ws-calendar__day',
                            isOutside && 'ws-calendar__day--outside',
                            isToday && 'ws-calendar__day--today',
                        ].filter(Boolean).join(' ')}
                        role="gridcell"
                        aria-current={isToday ? 'date' : undefined}
                        aria-label={getDateLabel(date)}
                        title={getDateLabel(date)}
                    >
                        {day}
                    </span>
                ))}
            </div>

            <footer className="ws-calendar__footer">
                {offset === 0 ? (
                    <span className="ws-calendar__today-label">
                        {t('Hoje')}: {today.toLocaleDateString(locale, {
                            day: '2-digit',
                            month: 'short',
                        })}
                    </span>
                ) : (
                    <button
                        type="button"
                        className="ws-calendar__today-button"
                        onClick={() => setOffset(0)}
                    >
                        <CalendarDays size={14} aria-hidden="true" />
                        <span>{t('Voltar para hoje')}</span>
                    </button>
                )}
            </footer>
        </section>
    );
}

export default memo(CalendarWidget);
