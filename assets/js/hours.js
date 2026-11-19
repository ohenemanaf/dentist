// Opening-hours logic, shared by the website and the tests (no dependencies).
// hours: { mon: ['08:00', '18:00'], ..., sun: null }, times on a 24-hour clock in the clinic's time zone.

export const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const DAY_NAMES = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' };

const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
};

/** '08:00' -> '8 am', '18:30' -> '6:30 pm', '12:00' -> '12 noon' */
export function formatTime(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    if (h === 12 && m === 0) return '12 noon';
    const suffix = h < 12 ? 'am' : 'pm';
    const h12 = h % 12 || 12;
    return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
}

/** The day and time it is right now at the clinic, whatever the visitor's own time zone. */
export function clinicClock(timeZone, date = new Date()) {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
            .formatToParts(date)
            .map((p) => [p.type, p.value]),
    );
    return { day: parts.weekday.toLowerCase().slice(0, 3), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

/**
 * Whether the clinic is open, and a short sentence for visitors.
 * state: 'open' | 'closing' (less than an hour left) | 'closed'
 */
export function openStatus(hours, timeZone, date = new Date()) {
    const { day, minutes } = clinicClock(timeZone, date);
    const today = hours[day];
    if (today) {
        const [open, close] = today.map(toMinutes);
        if (minutes >= open && minutes < close) {
            return close - minutes <= 60
                ? { state: 'closing', text: `Closing soon, at ${formatTime(today[1])}` }
                : { state: 'open', text: `Open now until ${formatTime(today[1])}` };
        }
        if (minutes < open) return { state: 'closed', text: `Closed now. Opens today at ${formatTime(today[0])}` };
    }
    const start = DAYS.indexOf(day);
    for (let i = 1; i <= 7; i++) {
        const next = DAYS[(start + i) % 7];
        if (hours[next]) {
            const when = i === 1 ? 'tomorrow' : DAY_NAMES[next];
            return { state: 'closed', text: `Closed now. Opens ${when} at ${formatTime(hours[next][0])}` };
        }
    }
    return { state: 'closed', text: 'Closed' };
}

/** The weekday key ('mon' ...) of a 'YYYY-MM-DD' date from a date input. */
export function dayOfDate(isoDate) {
    const [y, m, d] = isoDate.split('-').map(Number);
    return DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** Today's date at the clinic as 'YYYY-MM-DD' (for the date picker's minimum). */
export function clinicToday(timeZone, date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
