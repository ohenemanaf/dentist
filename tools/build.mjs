// Builds index.html from clinic.config.mjs. No packages needed: run `node tools/build.mjs`.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { DAYS, DAY_NAMES, formatTime } from '../assets/js/hours.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(ROOT, 'clinic.config.mjs');
const c = (await import(pathToFileURL(configPath).href + '?t=' + Date.now())).default;

// ── Checks: fail early with a clear message instead of publishing a broken page ──
const problems = [];
const sprite = readFileSync(join(ROOT, 'assets/icons.svg'), 'utf8');
const ICONS = new Set([...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]));
for (const s of c.services) if (!ICONS.has(s.icon)) problems.push(`Service "${s.name}" uses icon "${s.icon}", which is not in assets/icons.svg.`);
for (const d of DAYS) {
    const h = c.hours[d];
    if (h === undefined) problems.push(`hours.${d} is missing (use null if closed).`);
    else if (h && !(Array.isArray(h) && h.length === 2 && h.every((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)) && h[0] < h[1]))
        problems.push(`hours.${d} should look like ['08:00', '17:00'].`);
}
if (c.contact.whatsapp && !/^\d{9,15}$/.test(c.contact.whatsapp)) problems.push('contact.whatsapp must be digits only, starting with the country code (e.g. 233241234567).');
if (problems.length) {
    console.error('Cannot build the site:\n  - ' + problems.join('\n  - '));
    process.exit(1);
}

// ── Helpers ──
const esc = (s = '') => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const icon = (name, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="assets/icons.svg#${name}"/></svg>`;
const initials = (name) => name.replace(/^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?)\s+/i, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('');
const telHref = 'tel:' + c.contact.phone.replace(/[^\d+]/g, '');
const wa = c.contact.whatsapp;
const waHref = (text) => `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
const price = (s) => (typeof s.price === 'number' ? `${s.from ? '<small>from</small> ' : ''}${esc(c.currency)}&nbsp;${s.price.toLocaleString('en-GB')}` : esc(s.price));

const TOOTH = `<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M9.5 4C5.9 4 4 6.9 4 10.6c0 3.3 1.4 5.3 2.3 8.2.8 2.6 1 5.4 1.9 7.6.6 1.4 1.4 1.6 2 1.6 1.3 0 1.7-1.3 2.1-3.3.5-2.6 1-4.8 3.7-4.8s3.2 2.2 3.7 4.8c.4 2 .8 3.3 2.1 3.3.6 0 1.4-.2 2-1.6.9-2.2 1.1-5 1.9-7.6.9-2.9 2.3-4.9 2.3-8.2C28 6.9 26.1 4 22.5 4c-2.6 0-4 1.6-6.5 1.6S12.1 4 9.5 4Z" fill="currentColor"/><path d="M11 9.2c1.6-.9 3.2-.5 4.5.3" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".75"/></svg>`;
const brandMark = c.logo ? `<img class="logo" src="${esc(c.logo)}" alt="" width="40" height="40">` : TOOTH;

// Weekly hours, grouping consecutive days with the same times (Monday first).
const week = [...DAYS.slice(1), 'sun'];
const groups = [];
for (const d of week) {
    const key = c.hours[d] ? c.hours[d].join('-') : 'closed';
    const last = groups.at(-1);
    if (last && last.key === key) last.days.push(d);
    else groups.push({ key, days: [d], h: c.hours[d] });
}
const hoursRows = groups
    .map((g) => {
        const label = g.days.length > 1 ? `${DAY_NAMES[g.days[0]]} to ${DAY_NAMES[g.days.at(-1)]}` : DAY_NAMES[g.days[0]];
        const time = g.h ? `${formatTime(g.h[0])} to ${formatTime(g.h[1])}` : 'Closed';
        return `<tr data-days="${g.days.join(' ')}"><th scope="row">${label}</th><td>${time}</td></tr>`;
    })
    .join('\n');
const closedDays = DAYS.filter((d) => !c.hours[d]).map((d) => DAY_NAMES[d] + 's');

const book = (label, cls = 'btn btn--primary') =>
    `<a class="${cls}" href="#book">${icon('calendar-check')}<span>${label}</span></a>`;

const nav = [['#services', 'Treatments and prices'], ['#team', 'Our team'], ['#visit', 'Hours and location'], ['#questions', 'Questions']];
const socials = Object.entries(c.social || {}).filter(([, u]) => u);

const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.name)} | ${esc(c.tagline)}</title>
<meta name="description" content="${esc(c.intro)}">
<meta name="theme-color" content="${esc(c.brand)}">
<meta property="og:title" content="${esc(c.name)}">
<meta property="og:description" content="${esc(c.tagline)}">
<meta property="og:type" content="website">
${c.url ? `<meta property="og:url" content="${esc(c.url)}">\n<link rel="canonical" href="${esc(c.url)}">` : ''}
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(TOOTH.replace('class="mark"', 'xmlns="http://www.w3.org/2000/svg"').replace('currentColor', c.brand))}">
<link rel="preload" href="assets/fonts/manrope.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css">
<style>:root { --brand: ${esc(c.brand)}; }</style>
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: c.name,
    description: c.tagline,
    telephone: c.contact.phone,
    email: c.contact.email || undefined,
    address: c.contact.address,
    url: c.url || undefined,
    openingHoursSpecification: DAYS.filter((d) => c.hours[d]).map((d) => ({
        '@type': 'OpeningHoursSpecification', dayOfWeek: DAY_NAMES[d], opens: c.hours[d][0], closes: c.hours[d][1],
    })),
}).replace(/</g, '\\u003c')}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${c.demo ? `<p class="demo-note">${icon('info')} Demo clinic: the name, people, numbers and prices on this page are samples.</p>` : ''}
<header class="header">
  <div class="wrap header__row">
    <a class="brand" href="#top">${brandMark}<span><strong>${esc(c.name)}</strong><small>${esc(c.tagline)}</small></span></a>
    <nav class="nav" aria-label="Main">${nav.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</nav>
    <a class="btn btn--ghost header__call" href="${telHref}">${icon('phone')}<span>${esc(c.contact.phone)}</span></a>
  </div>
</header>

<main id="main">
<section class="hero" id="top">
  <div class="wrap hero__grid">
    <div class="hero__text">
      <p class="status" data-status><span class="status__dot"></span><span data-status-text>Opening hours below</span></p>
      <h1>${esc(c.headline)}</h1>
      <p class="lead">${esc(c.intro)}</p>
      <div class="actions">
        ${book('Book an appointment')}
        <a class="btn btn--ghost" href="${telHref}">${icon('phone')}<span>Call ${esc(c.contact.phone)}</span></a>
      </div>
      <p class="emergency">${icon('siren')}<span>${esc(c.emergency)}</span></p>
    </div>

    <form class="booking" id="book" data-booking novalidate>
      <h2>Book an appointment</h2>
      <p class="booking__sub">${wa ? 'Your request opens in WhatsApp, ready to send. We reply to confirm a time.' : 'Your request opens in your email app, ready to send. We reply to confirm a time.'}</p>
      <div class="field">
        <label for="b-name">Your name</label>
        <input id="b-name" name="name" autocomplete="name" required>
      </div>
      <div class="field">
        <label for="b-service">What do you need?</label>
        <select id="b-service" name="service">
          ${c.services.map((s) => `<option>${esc(s.name)}</option>`).join('')}
          <option>Toothache or emergency</option>
          <option>Not sure yet</option>
        </select>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="b-date">Preferred day</label>
          <input id="b-date" name="date" type="date" required>
        </div>
        <div class="field">
          <label for="b-time">Time of day</label>
          <select id="b-time" name="time"><option>Morning</option><option>Afternoon</option><option>Any time</option></select>
        </div>
      </div>
      <div class="field">
        <label for="b-note">Anything we should know? <span class="optional">(optional)</span></label>
        <textarea id="b-note" name="note" rows="2"></textarea>
      </div>
      <p class="booking__error" data-error role="alert" hidden></p>
      <button class="btn btn--primary btn--wide" type="submit">${icon(wa ? 'message-circle' : 'mail')}<span>${wa ? 'Send on WhatsApp' : 'Send by email'}</span></button>
      ${closedDays.length ? `<p class="booking__foot">Closed on ${closedDays.join(' and ')}.</p>` : ''}
    </form>
  </div>
</section>

<section class="section" id="services" aria-labelledby="services-title">
  <div class="wrap">
    <div class="section__head">
      <h2 id="services-title">Treatments and prices</h2>
      <p>${esc(c.priceNote)}</p>
    </div>
    <ul class="menu">
      ${c.services.map((s) => `<li class="menu__item">
        <span class="menu__icon">${icon(s.icon)}</span>
        <span class="menu__text"><strong>${esc(s.name)}</strong><span>${esc(s.text)}</span></span>
        <span class="menu__price">${price(s)}</span>
      </li>`).join('\n      ')}
    </ul>
    <p class="pay">${icon('wallet')}<span><strong>Ways to pay:</strong> ${c.payment.map(esc).join(', ')}</span></p>
  </div>
</section>

<section class="section section--tint" aria-labelledby="visit-steps">
  <div class="wrap">
    <div class="section__head"><h2 id="visit-steps">Your first visit</h2></div>
    <ol class="steps">
      ${c.steps.map((s) => `<li><strong>${esc(s.title)}</strong><span>${esc(s.text)}</span></li>`).join('\n      ')}
    </ol>
  </div>
</section>

<section class="section" id="team" aria-labelledby="team-title">
  <div class="wrap">
    <div class="section__head"><h2 id="team-title">Our team</h2></div>
    <ul class="team">
      ${c.team.map((p) => `<li class="person">
        ${p.photo ? `<img class="person__photo" src="${esc(p.photo)}" alt="" width="72" height="72" loading="lazy">` : `<span class="person__photo person__photo--initials" aria-hidden="true">${esc(initials(p.name))}</span>`}
        <div><strong>${esc(p.name)}</strong><span class="person__role">${esc(p.role)}</span><p>${esc(p.text)}</p></div>
      </li>`).join('\n      ')}
    </ul>
  </div>
</section>

${c.reviews.length ? `<section class="section section--tint" aria-labelledby="reviews-title">
  <div class="wrap">
    <div class="section__head"><h2 id="reviews-title">What patients say</h2></div>
    <ul class="reviews">
      ${c.reviews.map((r) => `<li class="review">
        <span class="stars" role="img" aria-label="${r.rating} out of 5 stars">${icon('star').repeat(r.rating)}</span>
        <blockquote>${esc(r.text)}</blockquote>
        <cite>${esc(r.name)}</cite>
      </li>`).join('\n      ')}
    </ul>
  </div>
</section>` : ''}

<section class="section" id="visit" aria-labelledby="visit-title">
  <div class="wrap visit">
    <div>
      <div class="section__head section__head--left"><h2 id="visit-title">Hours and location</h2></div>
      <table class="hours" data-hours><tbody>
${hoursRows}
      </tbody></table>
      <ul class="contact">
        <li>${icon('map-pin')}<span>${esc(c.contact.address)}${c.contact.landmark ? `<small>${esc(c.contact.landmark)}</small>` : ''}</span></li>
        <li>${icon('phone')}<a href="${telHref}">${esc(c.contact.phone)}</a></li>
        ${wa ? `<li>${icon('message-circle')}<a href="${waHref(`Hello ${c.name}, `)}" target="_blank" rel="noopener">WhatsApp us</a></li>` : ''}
        ${c.contact.email ? `<li>${icon('mail')}<a href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a></li>` : ''}
      </ul>
      <a class="btn btn--ghost" href="https://www.google.com/maps/dir/?api=1&amp;destination=${encodeURIComponent(c.contact.mapQuery)}" target="_blank" rel="noopener">${icon('navigation')}<span>Get directions</span></a>
    </div>
    <div class="map">
      <iframe title="Map showing ${esc(c.name)}" src="https://maps.google.com/maps?q=${encodeURIComponent(c.contact.mapQuery)}&amp;z=15&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>
  </div>
</section>

<section class="section section--tint" id="questions" aria-labelledby="faq-title">
  <div class="wrap faq">
    <div class="section__head section__head--left"><h2 id="faq-title">Questions</h2><p>Something else? ${wa ? `<a href="${waHref(`Hello ${c.name}, I have a question: `)}" target="_blank" rel="noopener">Ask us on WhatsApp</a>` : `<a href="${telHref}">Call us</a>`}.</p></div>
    <div>
      ${c.faqs.map((f) => `<details><summary>${esc(f.q)}${icon('chevron-down', 'icon chevron')}</summary><p>${esc(f.a)}</p></details>`).join('\n      ')}
    </div>
  </div>
</section>
</main>

<footer class="footer">
  <div class="wrap footer__row">
    <p class="brand brand--footer">${brandMark}<span><strong>${esc(c.name)}</strong><small>${esc(c.contact.address)}</small></span></p>
    ${socials.length ? `<p class="footer__social">${socials.map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${k[0].toUpperCase() + k.slice(1)}</a>`).join('')}</p>` : ''}
    <p class="footer__small">© <span data-year>${new Date().getFullYear()}</span> ${esc(c.name)}</p>
  </div>
</footer>

<nav class="dock" aria-label="Quick contact">
  <a href="${telHref}">${icon('phone')}<span>Call</span></a>
  ${wa ? `<a href="${waHref(`Hello ${c.name}, `)}" target="_blank" rel="noopener">${icon('message-circle')}<span>WhatsApp</span></a>` : ''}
  <a class="dock__book" href="#book">${icon('calendar-check')}<span>Book</span></a>
</nav>

<script type="application/json" id="clinic-data">${JSON.stringify({
    name: c.name, hours: c.hours, timeZone: c.timeZone, whatsapp: wa, email: c.contact.email,
}).replace(/</g, '\\u003c')}</script>
<script type="module" src="assets/js/site.js"></script>
</body>
</html>
`;

writeFileSync(join(ROOT, 'index.html'), html.replace(/\n{3,}/g, '\n\n'));
console.log(`Built index.html for ${c.name} (${c.services.length} treatments, ${c.team.length} team members).`);
