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

function formatDate(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

export function getBrazilianHolidays(year) {
    const holidays = [
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
        date: formatDate(new Date(year, month - 1, day)),
        name,
    }));

    const easter = getEasterDate(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);

    holidays.push({
        date: formatDate(goodFriday),
        name: 'Paixão de Cristo',
    });

    return holidays;
}