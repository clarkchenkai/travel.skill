import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTravelData, gapReport} from '../scripts/lib/validate.mjs';

const minimal = () => ({
  trip: {id: 'test-trip', title: 'T', startDate: '2031-01-01', endDate: '2031-01-02', timeZone: 'Europe/Paris'},
  places: [{id: 'p1', name: 'Place', lat: 1, lon: 2}],
  days: [{id: 'd1', date: '2031-01-01', title: 'Day', events: [{id: 'e1', title: 'Go', timeLabel: '09:00', placeIds: ['p1']}]}, {id: 'd2', date: '2031-01-02', title: 'Day 2', events: []}],
});
const codes = (d) => validateTravelData(d).errors.map((e) => e.path + ': ' + e.msg).join('\n');

test('minimal trip validates', () => { assert.equal(validateTravelData(minimal()).errors.length, 0); });
test('unknown references are errors', () => {
  const d = minimal(); d.days[0].events[0].placeIds = ['nope']; d.days[0].events[0].ticketIds = ['t-nope'];
  assert.match(codes(d), /unknown place "nope"/); assert.match(codes(d), /unknown ticket "t-nope"/);
});
test('flight times need offsets and must not run backwards', () => {
  const d = minimal();
  d.flightJourneys = [{id: 'f', segments: [{origin: {code: 'A', timeZone: 'Europe/Paris'}, destination: {code: 'B', timeZone: 'Asia/Tokyo'}, departure: '2031-01-01T10:00', arrival: '2031-01-01T05:00:00+09:00'}]}];
  assert.match(codes(d), /departure.*offset/);
  d.flightJourneys[0].segments[0].departure = '2031-01-01T10:00:00+01:00';
  assert.match(codes(d), /arrives before departure/);
});
test('bad zones and dates are caught', () => {
  const d = minimal(); d.trip.timeZone = 'Mars/Olympus'; d.days[1].date = '2031-01-09';
  assert.match(codes(d), /unknown IANA zone/); assert.match(codes(d), /outside trip dates/);
});
test('missing days produce warnings, not errors', () => {
  const d = minimal(); d.days.pop();
  const r = validateTravelData(d);
  assert.equal(r.errors.length, 0); assert.match(r.warnings[0].msg, /no day entry for 2031-01-02/);
});
test('status vocabulary is enforced and private records are rejected', () => {
  const d = minimal(); d.tickets = [{id: 't', title: 'x', status: 'confirmed'}]; d.places[0].privacy = 'private';
  assert.match(codes(d), /tickets\[0\]\.status/); assert.match(codes(d), /private\/restricted/);
});
test('credential-like keys and token markers are rejected', () => {
  const d = minimal(); d.trip.bookingReference = 'ABC123'; d.places[0].note = 'key sk-' + 'a'.repeat(24);
  assert.match(codes(d), /bookingReference/); assert.match(codes(d), /API key or token/);
});
test('gap report asks the right questions', () => {
  const d = minimal();
  const gaps = gapReport(d);
  const items = gaps.map((g) => g.area + ':' + g.item);
  assert.ok(items.includes('trip:people'));
  assert.ok(items.some((x) => x.startsWith('days:2031-01-02')));
  assert.ok(items.includes('checklist:empty'));
  d.tickets = [{id: 't', title: 'Ticket', price: null}];
  assert.ok(gapReport(d).some((g) => g.item === 'Ticket' && /price/.test(g.why)));
});
