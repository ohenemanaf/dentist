import { DAY_NAMES, clinicClock, clinicToday, dayOfDate, formatTime, openStatus } from './hours.js';

const data = JSON.parse(document.getElementById('clinic-data').textContent);
const { hours, timeZone } = data;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Live "open now" status and today's hours ──
const status = document.querySelector('[data-status]');
const statusText = document.querySelector('[data-status-text]');
const todayHours = document.querySelector('[data-today-hours]');
function refreshStatus() {
    const s = openStatus(hours, timeZone);
    status.dataset.state = s.state;
    statusText.textContent = s.text;
    if (todayHours) {
        const h = hours[clinicClock(timeZone).day];
        todayHours.textContent = h ? `Open ${formatTime(h[0])} to ${formatTime(h[1])}` : 'Closed today';
    }
}
refreshStatus();
setInterval(refreshStatus, 60_000);

const today = clinicClock(timeZone).day;
document.querySelectorAll('[data-hours] tr').forEach((row) => {
    if (row.dataset.days.split(' ').includes(today)) {
        row.classList.add('is-today');
        row.querySelector('th').insertAdjacentHTML('beforeend', ' <span class="today-tag">Today</span>');
    }
});

// ── Scroll: progress bar, compact header, phone dock, current section in the nav ──
const header = document.querySelector('[data-header]');
const progress = document.querySelector('.progress');
const dock = document.querySelector('.dock');
const navLinks = [...document.querySelectorAll('.nav a')];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
let ticking = false;
function onScroll() {
    ticking = false;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--p', max > 0 ? y / max : 0);
    header.classList.toggle('is-scrolled', y > 10);
    dock?.classList.toggle('is-shown', y > 320);
    let current = null;
    for (const s of sections) if (s.getBoundingClientRect().top < innerHeight * 0.35) current = s;
    navLinks.forEach((a) => a.classList.toggle('is-current', current && a.getAttribute('href') === '#' + current.id));
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

// ── Reveal on scroll, count-up figures, timeline line ──
const countUp = (el) => {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals);
    const suffix = el.dataset.suffix;
    const show = (v) => (el.textContent = v.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix);
    if (reduced) return show(target);
    const start = performance.now();
    const step = (now) => {
        const t = Math.min(1, (now - start) / 1600);
        show(target * (1 - Math.pow(1 - t, 4)));
        if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
};
const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        io.unobserve(el);
        if (el.hasAttribute('data-reveal')) {
            el.classList.add('is-in');
            // Hand the element back to its own hover styles once it has arrived.
            setTimeout(() => { el.removeAttribute('data-reveal'); el.classList.remove('is-in'); }, 1400);
        }
        if (el.hasAttribute('data-reveal-line')) el.classList.add('is-drawn');
        el.querySelectorAll?.('[data-count]').forEach(countUp);
    }
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('[data-reveal], [data-reveal-line], .stats').forEach((el) => io.observe(el));

// ── Treatment filters ──
const chips = [...document.querySelectorAll('[data-filter]')];
chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => { c.classList.toggle('is-active', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
    document.querySelectorAll('.service').forEach((card) => {
        const show = f === 'all' || card.dataset.group === f;
        card.hidden = !show;
        if (show && !reduced) card.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: 'cubic-bezier(.22,1,.36,1)' });
    });
}));

// ── Whitening shade guide ──
const shade = document.getElementById('shade');
if (shade) {
    const shades = JSON.parse(shade.dataset.shades);
    const fill = document.querySelector('[data-shade-fill]');
    const name = document.querySelector('[data-shade-name]');
    const badge = document.querySelector('[data-shade-badge]');
    const update = () => {
        const [code, colour] = shades[shade.value];
        fill.setAttribute('fill', colour);
        name.textContent = code;
        badge.textContent = code;
        badge.classList.remove('is-pop');
        void badge.offsetWidth;
        badge.classList.add('is-pop');
        shade.setAttribute('aria-valuetext', `Shade ${code}`);
    };
    shade.addEventListener('input', update);
    update();
}

// ── Booking: live WhatsApp preview, then send ──
const form = document.querySelector('[data-booking]');
const error = form.querySelector('[data-error]');
const dateInput = form.elements.date;
const preview = document.querySelector('[data-preview]');
const phone = document.querySelector('.phone');
dateInput.min = clinicToday(timeZone);

// "Book" links on treatment cards pre-select the treatment.
document.querySelectorAll('[data-book]').forEach((a) => a.addEventListener('click', () => {
    const opt = [...form.elements.service.options].find((o) => o.text === a.dataset.book);
    if (opt) { form.elements.service.value = opt.value; renderPreview(); }
}));

const prettyDay = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const message = () => {
    const f = form.elements;
    const lines = [
        `Hello ${data.name}, I would like to book an appointment.`,
        '',
        `Name: ${f.name.value.trim() || '…'}`,
        `For: ${f.service.value}`,
        `Preferred day: ${f.date.value ? prettyDay(f.date.value) : '…'}, ${f.time.value.toLowerCase()}`,
    ];
    if (f.note.value.trim()) lines.push(`Note: ${f.note.value.trim()}`);
    return lines.join('\n');
};
function renderPreview() {
    if (preview) preview.textContent = message();
}
form.addEventListener('input', renderPreview);
form.addEventListener('change', renderPreview);
renderPreview();

const showError = (msg, field) => {
    error.textContent = msg;
    error.hidden = !msg;
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
};
const checkDate = () => {
    const v = dateInput.value;
    if (!v) return 'Choose the day you would like to come.';
    if (v < dateInput.min) return 'That day has passed. Choose today or a later day.';
    if (!hours[dayOfDate(v)]) return `We are closed on ${DAY_NAMES[dayOfDate(v)]}s. Choose another day.`;
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
    const text = message();
    phone?.classList.add('is-sent');
    if (data.whatsapp) window.open(`https://wa.me/${data.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    else window.location.href = `mailto:${data.email}?subject=${encodeURIComponent('Appointment request')}&body=${encodeURIComponent(text)}`;
});

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();
