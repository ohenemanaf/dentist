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
const initials = (name) => name.replace(/^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?)\s+/i, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
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

const nav = [['#services', 'Treatments'], ['#team', 'Our team'], ['#reviews', 'Reviews'], ['#visit', 'Visit us'], ['#questions', 'Questions']];
const socials = Object.entries(c.social || {}).filter(([, u]) => u);
const groupsList = [...new Set(c.services.map((s) => s.group).filter(Boolean))];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const starRow = (n, size = '') => `<span class="stars${size}" aria-hidden="true">${icon('star').repeat(Math.round(n))}</span>`;

// A large glossy tooth for the hero (enamel gradient, highlight, soft shadow).
const HERO_TOOTH = `<svg class="hero-tooth" viewBox="0 0 220 240" aria-hidden="true">
  <defs>
    <linearGradient id="enamel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eef3fb"/><stop offset="1" stop-color="#c9d6ec"/></linearGradient>
    <radialGradient id="shine" cx=".32" cy=".22" r=".45"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="110" cy="228" rx="62" ry="8" fill="#000" opacity=".18"/>
  <path d="M64 14C30 14 14 40 14 74c0 30 13 48 21 74 7 23 9 48 17 68 5 12 12 15 18 15 12 0 15-12 19-30 4-23 9-43 31-43s27 20 31 43c4 18 7 30 19 30 6 0 13-3 18-15 8-20 10-45 17-68 8-26 21-44 21-74 0-34-16-60-50-60-23 0-36 14-56 14S87 14 64 14Z" fill="url(#enamel)"/>
  <path d="M64 14C30 14 14 40 14 74c0 30 13 48 21 74 7 23 9 48 17 68 5 12 12 15 18 15 12 0 15-12 19-30 4-23 9-43 31-43s27 20 31 43c4 18 7 30 19 30 6 0 13-3 18-15 8-20 10-45 17-68 8-26 21-44 21-74 0-34-16-60-50-60-23 0-36 14-56 14S87 14 64 14Z" fill="url(#shine)"/>
  <path d="M46 52c12-12 30-14 44-6" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".9"/>
</svg>`;

// Whitening shade guide (VITA classical order, darkest to lightest, plus bleach shades).
const SHADES = [
    ['A4', '#c9a46e'], ['C4', '#bfa27a'], ['A3.5', '#d4b07c'], ['B4', '#d6b57f'], ['A3', '#dcbf8f'], ['D3', '#d8c19c'], ['B3', '#dec396'],
    ['A2', '#e5cfa6'], ['C2', '#ddcbac'], ['D2', '#e2d2b4'], ['A1', '#ecdcbd'], ['B2', '#eadab8'], ['B1', '#f1e6cc'], ['BL4', '#f5eedd'], ['BL1', '#fbf8f0'],
];
const SHADE_TOOTH = `<svg class="shade__tooth" viewBox="0 0 220 240" aria-hidden="true"><path data-shade-fill d="M64 14C30 14 14 40 14 74c0 30 13 48 21 74 7 23 9 48 17 68 5 12 12 15 18 15 12 0 15-12 19-30 4-23 9-43 31-43s27 20 31 43c4 18 7 30 19 30 6 0 13-3 18-15 8-20 10-45 17-68 8-26 21-44 21-74 0-34-16-60-50-60-23 0-36 14-56 14S87 14 64 14Z" fill="${SHADES[4][1]}"/><path d="M46 52c12-12 30-14 44-6" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".7"/></svg>`;

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
<style>:root { --brand: ${esc(c.brand)}; --accent: ${esc(c.accent || c.brand)}; }</style>
<script>document.documentElement.classList.add('js')</script>
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: c.name,
    description: c.tagline,
    telephone: c.contact.phone,
    email: c.contact.email || undefined,
    address: c.contact.address,
    url: c.url || undefined,
    aggregateRating: c.rating ? { '@type': 'AggregateRating', ratingValue: c.rating.score, reviewCount: c.rating.count } : undefined,
    openingHoursSpecification: DAYS.filter((d) => c.hours[d]).map((d) => ({
        '@type': 'OpeningHoursSpecification', dayOfWeek: DAY_NAMES[d], opens: c.hours[d][0], closes: c.hours[d][1],
    })),
}).replace(/</g, '\\u003c')}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"></div>
${c.demo ? `<p class="demo-note">${icon('info')} Demo clinic: the name, people, numbers and prices on this page are samples.</p>` : ''}
<header class="header" data-header>
  <div class="wrap header__row">
    <a class="brand" href="#top">${brandMark}<span><strong>${esc(c.name)}</strong><small>${esc(c.tagline)}</small></span></a>
    <nav class="nav" aria-label="Main">${nav.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</nav>
    <a class="btn btn--primary header__cta" href="#book">${icon('calendar-check')}<span>Book a visit</span></a>
  </div>
</header>

<main id="main">
<section class="hero" id="top">
  <div class="hero__glow hero__glow--a"></div><div class="hero__glow hero__glow--b"></div>
  <div class="wrap hero__grid">
    <div class="hero__text">
      <p class="status" data-status><span class="status__dot"></span><span data-status-text>See our opening hours below</span></p>
      <h1>${esc(c.headline)}</h1>
      <p class="lead">${esc(c.intro)}</p>
      <div class="actions">
        <a class="btn btn--primary btn--lg" href="#book">${icon('calendar-check')}<span>Book an appointment</span></a>
        <a class="btn btn--glass btn--lg" href="${telHref}">${icon('phone')}<span>Call ${esc(c.contact.phone)}</span></a>
      </div>
      ${c.rating ? `<p class="hero__rating">${starRow(5)}<span><strong>${c.rating.score.toFixed(1)}</strong> from ${c.rating.count} ${esc(c.rating.source)}</span></p>` : ''}
    </div>
    <div class="hero__art" aria-hidden="true">
      <div class="orbit"></div><div class="orbit orbit--2"></div>
      ${HERO_TOOTH}
      <span class="sparkle sparkle--1">${icon('sparkles')}</span><span class="sparkle sparkle--2">${icon('sparkles')}</span>
      <div class="float-card float-card--status"><span class="float-card__icon float-card__icon--ok">${icon('clock')}</span><span><small>Today</small><strong data-today-hours>See hours</strong></span></div>
      ${c.rating ? `<div class="float-card float-card--rating"><span class="float-card__icon float-card__icon--star">${icon('star')}</span><span><small>${esc(c.rating.source)}</small><strong>${c.rating.score.toFixed(1)} out of 5</strong></span></div>` : ''}
      ${wa ? `<div class="float-card float-card--chat"><span class="float-card__icon float-card__icon--wa">${icon('message-circle')}</span><span><small>WhatsApp</small><strong>Booking confirmed</strong></span><span class="ticks">${icon('check')}${icon('check')}</span></div>` : ''}
    </div>
  </div>
  ${c.stats?.length ? `<div class="wrap"><ul class="stats">
    ${c.stats.map((s) => `<li data-reveal><strong data-count="${s.value}" data-decimals="${s.decimals || 0}" data-suffix="${esc(s.suffix || '')}">${s.value.toLocaleString('en-GB', { minimumFractionDigits: s.decimals || 0 })}${esc(s.suffix || '')}</strong><span>${esc(s.label)}</span></li>`).join('\n    ')}
  </ul></div>` : ''}
</section>

<section class="section" id="services" aria-labelledby="services-title">
  <div class="wrap">
    <div class="section__head" data-reveal>
      <p class="kicker">${icon('toothbrush-sparkles')} Treatments</p>
      <h2 id="services-title">Everything your smile needs, priced up front</h2>
      <p>${esc(c.priceNote)}</p>
    </div>
    ${groupsList.length > 1 ? `<div class="filters" role="group" aria-label="Show treatments">
      <button type="button" class="chip is-active" data-filter="all" aria-pressed="true">All</button>
      ${groupsList.map((g) => `<button type="button" class="chip" data-filter="${slug(g)}" aria-pressed="false">${esc(g)}</button>`).join('')}
    </div>` : ''}
    <ul class="services">
      ${c.services.map((s, i) => `<li class="service" data-group="${s.group ? slug(s.group) : ''}" data-reveal style="--i:${i % 3}">
        <span class="service__icon">${icon(s.icon)}</span>
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.text)}</p>
        <div class="service__foot"><span class="service__price">${price(s)}</span><a href="#book" data-book="${esc(s.name)}">Book${icon('arrow-right')}</a></div>
      </li>`).join('\n      ')}
    </ul>
    <p class="pay" data-reveal>${icon('wallet')}<span><strong>Ways to pay</strong>${c.payment.map((p) => `<span class="pay__item">${esc(p)}</span>`).join('')}</span></p>
  </div>
</section>

${c.shadeGuide ? `<section class="section shade" aria-labelledby="shade-title">
  <div class="wrap shade__grid">
    <div data-reveal>
      <p class="kicker">${icon('sparkles')} Teeth whitening</p>
      <h2 id="shade-title">See how much lighter your teeth could be</h2>
      <p class="shade__text">Dentists match tooth colour against a shade guide, from darker shades such as A4 to the brightest bleach shades. Slide to see the range. Your dentist will tell you which shade is realistic for your teeth.</p>
      <label class="shade__label" for="shade">Shade <strong data-shade-name>${SHADES[4][0]}</strong></label>
      <input class="shade__range" id="shade" type="range" min="0" max="${SHADES.length - 1}" value="4" data-shades='${JSON.stringify(SHADES)}'>
      <div class="shade__scale" aria-hidden="true">${SHADES.map(([n, col]) => `<span style="background:${col}" title="${n}"></span>`).join('')}</div>
      <a class="btn btn--primary" href="#book" data-book="Teeth whitening">${icon('smile')}<span>Book a whitening consultation</span></a>
    </div>
    <div class="shade__stage" data-reveal="zoom">${SHADE_TOOTH}<span class="shade__badge" data-shade-badge>${SHADES[4][0]}</span></div>
  </div>
</section>` : ''}

<section class="section section--tint" aria-labelledby="visit-steps">
  <div class="wrap">
    <div class="section__head" data-reveal>
      <p class="kicker">${icon('heart-handshake')} Your first visit</p>
      <h2 id="visit-steps">No surprises, from booking to treatment</h2>
    </div>
    <ol class="steps" data-reveal-line>
      ${c.steps.map((s, i) => `<li data-reveal style="--i:${i}"><span class="steps__n">${i + 1}</span><strong>${esc(s.title)}</strong><span>${esc(s.text)}</span></li>`).join('\n      ')}
    </ol>
  </div>
</section>

<section class="section" id="team" aria-labelledby="team-title">
  <div class="wrap">
    <div class="section__head" data-reveal>
      <p class="kicker">${icon('users')} Our team</p>
      <h2 id="team-title">The people looking after you</h2>
    </div>
    <ul class="team">
      ${c.team.map((p, i) => `<li class="person" data-reveal style="--i:${i}">
        <div class="person__photo">${p.photo ? `<img src="${esc(p.photo)}" alt="" width="400" height="400" loading="lazy">` : `<span aria-hidden="true">${esc(initials(p.name))}</span>`}</div>
        <strong>${esc(p.name)}</strong>
        <span class="person__role">${esc(p.role)}</span>
        <p>${esc(p.text)}</p>
      </li>`).join('\n      ')}
    </ul>
  </div>
</section>

${c.reviews.length ? `<section class="section reviews-band" id="reviews" aria-labelledby="reviews-title">
  <div class="wrap section__head" data-reveal>
    <p class="kicker">${icon('quote')} Reviews</p>
    <h2 id="reviews-title">What patients say</h2>
    ${c.rating ? `<p class="reviews-band__score">${starRow(5)} <strong>${c.rating.score.toFixed(1)}</strong> from ${c.rating.count} ${esc(c.rating.source)}</p>` : ''}
  </div>
  <div class="marquee">
    <ul class="marquee__track">
      ${[...c.reviews, ...c.reviews].map((r, i) => `<li class="review"${i >= c.reviews.length ? ' aria-hidden="true"' : ''}>
        ${starRow(r.rating)}<span class="visually-hidden">${r.rating} out of 5 stars</span>
        <blockquote>${esc(r.text)}</blockquote>
        <cite><span class="review__avatar">${esc(initials(r.name))}</span>${esc(r.name)}</cite>
      </li>`).join('\n      ')}
    </ul>
  </div>
</section>` : ''}

<section class="section section--tint" id="book" aria-labelledby="book-title">
  <div class="wrap book">
    <div data-reveal>
      <p class="kicker">${icon('calendar-check')} Book an appointment</p>
      <h2 id="book-title">Book in under a minute</h2>
      <p class="book__text">${wa ? 'Fill in the form and your message appears on the right. Press send and WhatsApp opens with it ready to go. We reply to confirm a time.' : 'Fill in the form and your email app opens with the request ready to send. We reply to confirm a time.'}</p>
      <form class="booking" data-booking novalidate>
        <div class="field-row">
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
        <button class="btn btn--primary btn--lg btn--wide" type="submit">${icon(wa ? 'message-circle' : 'mail')}<span>${wa ? 'Send on WhatsApp' : 'Send by email'}</span></button>
        ${closedDays.length ? `<p class="booking__foot">Closed on ${closedDays.join(' and ')}. ${esc(c.emergency)}</p>` : ''}
      </form>
    </div>
    ${wa ? `<div class="phone" data-reveal="zoom" aria-hidden="true">
      <div class="phone__screen">
        <div class="phone__bar"><span class="phone__avatar">${TOOTH}</span><span><strong>${esc(c.name)}</strong><small>usually replies within the hour</small></span></div>
        <div class="phone__chat">
          <p class="bubble bubble--out" data-preview></p>
          <p class="bubble bubble--in">Thank you! We have a slot for you. See you soon.</p>
        </div>
      </div>
    </div>` : ''}
  </div>
</section>

<section class="section" id="visit" aria-labelledby="visit-title">
  <div class="wrap visit">
    <div data-reveal>
      <p class="kicker">${icon('map-pin')} Visit us</p>
      <h2 id="visit-title">Hours and location</h2>
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
    <div class="map" data-reveal="zoom">
      <iframe title="Map showing ${esc(c.name)}" src="https://maps.google.com/maps?q=${encodeURIComponent(c.contact.mapQuery)}&amp;z=15&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>
  </div>
</section>

<section class="section section--tint" id="questions" aria-labelledby="faq-title">
  <div class="wrap faq">
    <div data-reveal>
      <p class="kicker">${icon('info')} Questions</p>
      <h2 id="faq-title">Good to know</h2>
      <p class="faq__more">Something else? ${wa ? `<a href="${waHref(`Hello ${c.name}, I have a question: `)}" target="_blank" rel="noopener">Ask us on WhatsApp</a>` : `<a href="${telHref}">Call us</a>`}.</p>
    </div>
    <div data-reveal>
      ${c.faqs.map((f) => `<details><summary>${esc(f.q)}<span class="plus" aria-hidden="true"></span></summary><div class="details__body"><p>${esc(f.a)}</p></div></details>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="cta">
  <div class="wrap cta__inner" data-reveal="zoom">
    <div>
      <h2>Need a dentist today?</h2>
      <p>${esc(c.emergency)}</p>
    </div>
    <div class="cta__actions">
      <a class="btn btn--white btn--lg" href="${telHref}">${icon('phone')}<span>Call ${esc(c.contact.phone)}</span></a>
      ${wa ? `<a class="btn btn--glass btn--lg" href="${waHref(`Hello ${c.name}, I need to see a dentist urgently. `)}" target="_blank" rel="noopener">${icon('message-circle')}<span>WhatsApp</span></a>` : ''}
    </div>
  </div>
</section>
</main>

<footer class="footer">
  <div class="wrap footer__grid">
    <div>
      <p class="brand brand--footer">${brandMark}<span><strong>${esc(c.name)}</strong><small>${esc(c.tagline)}</small></span></p>
      ${socials.length ? `<p class="footer__social">${socials.map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${k[0].toUpperCase() + k.slice(1)}</a>`).join('')}</p>` : ''}
    </div>
    <div><h3>Visit</h3><p>${esc(c.contact.address)}</p><p><a href="${telHref}">${esc(c.contact.phone)}</a></p>${c.contact.email ? `<p><a href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a></p>` : ''}</div>
    <div><h3>Hours</h3>${groups.map((g) => `<p>${g.days.length > 1 ? `${DAY_NAMES[g.days[0]].slice(0, 3)} to ${DAY_NAMES[g.days.at(-1)].slice(0, 3)}` : DAY_NAMES[g.days[0]].slice(0, 3)}: ${g.h ? `${formatTime(g.h[0])} to ${formatTime(g.h[1])}` : 'Closed'}</p>`).join('')}</div>
    <div><h3>Explore</h3>${nav.map(([h, t]) => `<p><a href="${h}">${t}</a></p>`).join('')}</div>
  </div>
  <div class="wrap footer__base">© <span data-year>${new Date().getFullYear()}</span> ${esc(c.name)}</div>
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
