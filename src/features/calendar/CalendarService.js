import { PUBLIC_CALENDAR_EVENTS } from './publicEvents';

function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function toCalendarDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function getBrazilianHolidays(year) {
  const fixed = [
    [1, 1, 'Confraternização Universal'],
    [4, 21, 'Tiradentes'],
    [5, 1, 'Dia do Trabalho'],
    [9, 7, 'Independência do Brasil'],
    [10, 12, 'Nossa Senhora Aparecida'],
    [11, 2, 'Finados'],
    [11, 15, 'Proclamação da República'],
    [11, 20, 'Dia Nacional de Zumbi e da Consciência Negra'],
    [12, 25, 'Natal'],
  ].map(([month, day, name]) => ({
    date: toCalendarDateKey(new Date(year, month - 1, day)),
    name,
    type: 'holiday',
  }));
  const easter = getEasterDate(year);
  const goodFriday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2);
  fixed.push({ date: toCalendarDateKey(goodFriday), name: 'Paixão de Cristo', type: 'holiday' });
  return fixed.sort((a, b) => a.date.localeCompare(b.date));
}

export function getPublicCalendarEvents(year) {
  return PUBLIC_CALENDAR_EVENTS.filter((event) => {
    if (!event || typeof event.title !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(event.date))
      return false;
    const [y, m, d] = event.date.split('-').map(Number);
    const check = new Date(y, m - 1, d);
    return (
      y === year && check.getFullYear() === y && check.getMonth() === m - 1 && check.getDate() === d
    );
  })
    .map((event) => ({
      date: event.date,
      name: event.title,
      type: 'event',
      description: typeof event.description === 'string' ? event.description : '',
      url: typeof event.url === 'string' && /^https:\/\//i.test(event.url) ? event.url : '',
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getCalendarEntries(year) {
  return [...getBrazilianHolidays(year), ...getPublicCalendarEvents(year)].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}
