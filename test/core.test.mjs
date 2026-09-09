import test from 'node:test';
import assert from 'node:assert/strict';
import {countdown, durationMinutes, tripStage, nextFlightIndex, pendingTickets, normalizeState, initialState, taskStats, visibleTasks, escapeHTML, safeURL, arrivalDayOffset, formatMoney, mapLinks, localDate} from '../template/core.mjs';

test('durations use absolute instants, not clock faces', () => {
  assert.equal(durationMinutes('2031-05-12T01:20:00+08:00', '2031-05-12T08:40:00+09:00'), 380);
  // Vienna → New York: arrives at an earlier clock time on the same calendar day.
  assert.equal(durationMinutes('2031-10-30T10:15:00+01:00', '2031-10-30T13:50:00-04:00'), 515);
  assert.equal(durationMinutes('2031-01-01T10:00:00Z', '2031-01-01T09:00:00Z'), null);
  assert.equal(durationMinutes('nope', '2031-01-01T09:00:00Z'), null);
});

test('arrival day offset is computed per endpoint zone', () => {
  const overnight = {origin: {timeZone: 'America/New_York'}, destination: {timeZone: 'Europe/Amsterdam'}, departure: '2031-10-23T19:30:00-04:00', arrival: '2031-10-24T08:45:00+02:00'};
  assert.equal(arrivalDayOffset(overnight), 1);
  const westbound = {origin: {timeZone: 'Asia/Tokyo'}, destination: {timeZone: 'America/Los_Angeles'}, departure: '2031-01-10T17:00:00+09:00', arrival: '2031-01-10T10:00:00-08:00'};
  assert.equal(arrivalDayOffset(westbound), 0);
  assert.equal(durationMinutes(westbound.departure, westbound.arrival), 600);
});

test('countdown never goes negative and rejects garbage', () => {
  assert.deepEqual(countdown('2031-05-12T01:20:00+08:00', new Date('2031-05-10T17:19:59Z')), {ended: false, days: 1, hours: 0, minutes: 0, seconds: 1});
  assert.deepEqual(countdown('2031-05-12T01:20:00+08:00', new Date('2031-05-12T00:00:00Z')), {ended: true, days: 0, hours: 0, minutes: 0, seconds: 0});
  assert.equal(countdown('invalid'), null);
});

test('trip stage follows the trip zone, not the device zone', () => {
  const trip = {startDate: '2031-05-12', endDate: '2031-05-16', timeZone: 'Asia/Tokyo'};
  // 2031-05-11T15:30Z is already 00:30 on the 12th in Tokyo.
  assert.equal(tripStage(trip, new Date('2031-05-11T15:30:00Z')).dayIndex, 1);
  assert.equal(tripStage(trip, new Date('2031-05-01T00:00:00Z')).kind, 'before');
  assert.equal(tripStage(trip, new Date('2031-05-01T00:00:00Z')).daysUntil, 11);
  assert.equal(tripStage(trip, new Date('2031-05-16T15:00:00Z')).kind, 'after');
  assert.equal(localDate(new Date('2031-10-26T00:30:00Z'), 'Europe/Amsterdam'), '2031-10-26');
});

test('next flight picks the first future departure and falls back to the last', () => {
  const journeys = [{segments: [{departure: '2031-05-12T01:20:00+08:00'}]}, {segments: [{departure: '2031-05-16T10:30:00+09:00'}]}];
  assert.equal(nextFlightIndex(journeys, new Date('2031-05-13T00:00:00Z')), 1);
  assert.equal(nextFlightIndex(journeys, new Date('2031-06-01T00:00:00Z')), 1);
  assert.equal(nextFlightIndex(journeys, new Date('2031-01-01T00:00:00Z')), 0);
});

test('a ticket shared across events counts once', () => {
  const day = {events: [{ticketIds: ['a', 'a']}, {ticketIds: ['a', 'b']}]};
  assert.deepEqual(pendingTickets(day, {a: true}), ['b']);
});

test('corrupt saved state is normalized instead of crashing', () => {
  assert.deepEqual(normalizeState(null), initialState());
  const s = normalizeState({tasks: {a: true, b: 'true'}, addedTasks: [null, {id: 'x', text: 'a'.repeat(141)}, {id: 'ok', text: 'rain shell', group: 'packing'}], deletedTaskIds: [null, 1, 'a']});
  assert.deepEqual(s.tasks, {a: true});
  assert.equal(s.addedTasks.length, 1);
  assert.deepEqual(s.deletedTaskIds, ['a']);
});

test('deleting and restoring keeps completion counts consistent', () => {
  const base = [{id: 'a', text: 'cash', group: 'packing'}, {id: 'b', text: 'book', group: 'todo'}];
  const s = normalizeState({tasks: {a: true}, deletedTaskIds: ['a']});
  assert.deepEqual(taskStats(base, s), {total: 1, completed: 0});
  s.deletedTaskIds = [];
  assert.deepEqual(taskStats(base, s), {total: 2, completed: 1});
  assert.equal(visibleTasks(base, s, 'packing').length, 1);
});

test('user text renders as text and links reject script URLs', () => {
  assert.equal(escapeHTML('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
  assert.equal(safeURL('javascript:alert(1)'), '');
  assert.equal(safeURL('https://example.com/'), 'https://example.com/');
});

test('money uses ISO codes and tolerates unknown values', () => {
  assert.match(formatMoney({amount: 330, currency: 'CZK'}, 'en'), /CZK/);
  assert.equal(formatMoney(null), '');
  assert.equal(formatMoney({amount: 5, currency: 'XXXX'}), '5 XXXX');
});

test('map links come from coordinates or query and can be overridden', () => {
  const p = {name: 'Somewhere', lat: 1.5, lon: 2.5};
  assert.match(mapLinks(p, 'google').embed, /output=embed/);
  assert.match(mapLinks(p, 'osm').embed, /openstreetmap\.org\/export\/embed/);
  assert.equal(mapLinks(p, 'none').embed, '');
  assert.equal(mapLinks({name: 'X', mapUrl: 'https://maps.example/x'}, 'google').external, 'https://maps.example/x');
});
