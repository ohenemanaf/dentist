// Run with: node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import { openStatus, formatTime, dayOfDate, clinicToday } from '../assets/js/hours.js';

const HOURS = {
    mon: ['08:00', '18:00'], tue: ['08:00', '18:00'], wed: ['08:00', '18:00'], thu: ['08:00', '18:00'],
    fri: ['08:00', '18:00'], sat: ['09:00', '14:00'], sun: null,
};
const TZ = 'Africa/Accra'; // UTC+0, so these UTC times are clinic times
const at = (iso) => new Date(iso + 'Z');

test('formats times for people', () => {
    assert.equal(formatTime('08:00'), '8 am');
    assert.equal(formatTime('18:30'), '6:30 pm');
    assert.equal(formatTime('12:00'), '12 noon');
    assert.equal(formatTime('00:15'), '12:15 am');
});

test('open during the day', () => {
    assert.deepEqual(openStatus(HOURS, TZ, at('2026-11-16T10:00:00')), { state: 'open', text: 'Open now until 6 pm' }); // Monday
});

test('closing soon in the last hour', () => {
    assert.equal(openStatus(HOURS, TZ, at('2026-11-16T17:15:00')).state, 'closing');
});

test('before opening today', () => {
    assert.equal(openStatus(HOURS, TZ, at('2026-11-16T07:00:00')).text, 'Closed now. Opens today at 8 am');
});

test('after closing: opens tomorrow', () => {
    assert.equal(openStatus(HOURS, TZ, at('2026-11-16T18:00:00')).text, 'Closed now. Opens tomorrow at 8 am');
});

test('Saturday afternoon skips closed Sunday', () => {
    assert.equal(openStatus(HOURS, TZ, at('2026-11-21T15:00:00')).text, 'Closed now. Opens Monday at 8 am');
});

test('uses the clinic time zone, not the visitor\'s', () => {
    // 09:30 in Accra is 10:30 in Lagos: a Lagos-based clinic opening at 10:30 is just open.
    const lagos = { ...HOURS, mon: ['10:30', '18:00'] };
    assert.equal(openStatus(lagos, 'Africa/Lagos', at('2026-11-16T09:30:00')).state, 'open');
});

test('weekday of a picked date, and today at the clinic', () => {
    assert.equal(dayOfDate('2026-11-22'), 'sun');
    assert.equal(clinicToday(TZ, at('2026-11-16T23:59:00')), '2026-11-16');
});
