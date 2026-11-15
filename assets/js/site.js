import { DAY_NAMES, clinicClock, clinicToday, dayOfDate, openStatus } from './hours.js';

const data = JSON.parse(document.getElementById('clinic-data').textContent);
const { hours, timeZone } = data;

// Live "open now" status, refreshed every minute.
const status = document.querySelector('[data-status]');
const statusText = document.querySelector('[data-status-text]');
function refreshStatus() {
    const s = openStatus(hours, timeZone);
    status.dataset.state = s.state;
    statusText.textContent = s.text;
}
refreshStatus();
setInterval(refreshStatus, 60_000);

// Highlight today in the hours table.
const today = clinicClock(timeZone).day;
document.querySelectorAll('[data-hours] tr').forEach((row) => {
    if (row.dataset.days.split(' ').includes(today)) {
        row.classList.add('is-today');
        row.querySelector('th').insertAdjacentHTML('beforeend', ' <span class="today-tag">Today</span>');
    }
});

// Booking: compose a WhatsApp message (or an email if the clinic has no WhatsApp).
const form = document.querySelector('[data-booking]');
const error = form.querySelector('[data-error]');
const dateInput = form.elements.date;
dateInput.min = clinicToday(timeZone);

const showError = (message, field) => {
    error.textContent = message;
    error.hidden = !message;
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    if (field) {
        field.setAttribute('aria-invalid', 'true');
        field.focus();
    }
};

const checkDate = () => {
    const value = dateInput.value;
    if (!value) return 'Choose the day you would like to come.';
    if (value < dateInput.min) return 'That day has passed. Choose today or a later day.';
    if (!hours[dayOfDate(value)]) return `We are closed on ${DAY_NAMES[dayOfDate(value)]}s. Choose another day.`;
    return '';
};
dateInput.addEventListener('change', () => {
    const problem = checkDate();
    showError(problem, problem ? dateInput : null);
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const f = form.elements;
    if (!f.name.value.trim()) return showError('Enter your name so we know who is booking.', f.name);
    const dateProblem = checkDate();
    if (dateProblem) return showError(dateProblem, dateInput);
    showError('');

    const day = new Date(dateInput.value + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    const lines = [
        `Hello ${data.name}, I would like to book an appointment.`,
        '',
        `Name: ${f.name.value.trim()}`,
        `For: ${f.service.value}`,
        `Preferred day: ${day}, ${f.time.value.toLowerCase()}`,
    ];
    if (f.note.value.trim()) lines.push(`Note: ${f.note.value.trim()}`);
    const text = lines.join('\n');

    if (data.whatsapp) window.open(`https://wa.me/${data.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    else window.location.href = `mailto:${data.email}?subject=${encodeURIComponent('Appointment request')}&body=${encodeURIComponent(text)}`;
});

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();
