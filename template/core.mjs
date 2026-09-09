// Pure logic shared by the page and the tests. No DOM, no locale-specific strings.
export const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

export function safeURL(value) {
  try {
    const u = new URL(value, globalThis.location?.href || 'http://localhost/');
    return ['https:', 'http:', 'tel:', 'mailto:'].includes(u.protocol) ? u.href : '';
  } catch { return ''; }
}

// Calendar date (YYYY-MM-DD) of `now` in an IANA time zone.
export function localDate(now, timeZone) {
  return new Intl.DateTimeFormat('sv-SE', {timeZone, year: 'numeric', month: '2-digit', day: '2-digit'}).format(now);
}

export function dateDistance(from, to) {
  return Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000);
}

// Where the reader is in the trip calendar. Uses the trip's own zone, never the device zone.
export function tripStage(trip, now = new Date()) {
  const day = localDate(now, trip.timeZone);
  const total = dateDistance(trip.startDate, trip.endDate) + 1;
  if (day < trip.startDate) return {kind: 'before', daysUntil: dateDistance(day, trip.startDate), dayIndex: null, total};
  if (day > trip.endDate) return {kind: 'after', daysUntil: 0, dayIndex: null, total};
  return {kind: 'during', daysUntil: 0, dayIndex: dateDistance(trip.startDate, day) + 1, total, date: day};
}

// Countdown to an absolute instant. Never negative; invalid input returns null.
export function countdown(iso, now = new Date()) {
  const target = Date.parse(iso);
  if (!Number.isFinite(target)) return null;
  const seconds = Math.max(0, Math.floor((target - now.getTime()) / 1000));
  return {ended: target <= now.getTime(), days: Math.floor(seconds / 86400), hours: Math.floor(seconds % 86400 / 3600), minutes: Math.floor(seconds % 3600 / 60), seconds: seconds % 60};
}

// Minutes between two offset-bearing ISO instants, computed in UTC. Null when unknown or negative.
export function durationMinutes(departure, arrival) {
  const m = Math.round((Date.parse(arrival) - Date.parse(departure)) / 60000);
  return Number.isFinite(m) && m >= 0 ? m : null;
}

export function formatTime(iso, timeZone, locale = 'en') {
  return new Intl.DateTimeFormat(locale, {timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(new Date(iso));
}

export function formatDay(iso, timeZone, locale = 'en') {
  return new Intl.DateTimeFormat(locale, {timeZone, month: 'short', day: 'numeric'}).format(new Date(iso));
}

export function formatDate(ymd, locale = 'en', options = {month: 'short', day: 'numeric', weekday: 'short'}) {
  return new Intl.DateTimeFormat(locale, {timeZone: 'UTC', ...options}).format(new Date(ymd + 'T00:00:00Z'));
}

// Calendar day offset between departure and arrival as seen at each endpoint (+1, -1, 0).
export function arrivalDayOffset(segment) {
  const dep = localDate(new Date(segment.departure), segment.origin.timeZone);
  const arr = localDate(new Date(segment.arrival), segment.destination.timeZone);
  return dateDistance(dep, arr);
}

export function nextFlightIndex(journeys, now = new Date()) {
  const i = journeys.findIndex((j) => Date.parse(j.segments[0]?.departure) > now.getTime());
  return i < 0 ? Math.max(0, journeys.length - 1) : i;
}

export function ticketIdsForDay(day) {
  return [...new Set(day.events.flatMap((e) => e.ticketIds || []))];
}

export function pendingTickets(day, checked) {
  return ticketIdsForDay(day).filter((id) => !checked[id]);
}

export function formatMoney(price, locale = 'en') {
  if (!price || typeof price.amount !== 'number' || !price.currency) return '';
  try {
    return new Intl.NumberFormat(locale, {style: 'currency', currency: price.currency, currencyDisplay: 'code'}).format(price.amount);
  } catch { return `${price.amount} ${price.currency}`; }
}

// Map links derived from data. The provider is a display choice; place facts stay provider-neutral.
export function mapLinks(place, provider = 'google') {
  const hasCoords = typeof place.lat === 'number' && typeof place.lon === 'number';
  const query = encodeURIComponent(place.mapQuery || place.localName || place.name || '');
  const links = {external: '', embed: ''};
  if (provider === 'google') {
    links.external = hasCoords ? `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}` : `https://www.google.com/maps/search/?api=1&query=${query}`;
    links.embed = hasCoords ? `https://www.google.com/maps?q=${place.lat},${place.lon}&output=embed` : `https://www.google.com/maps?q=${query}&output=embed`;
  } else if (provider === 'osm') {
    if (hasCoords) {
      const d = 0.01;
      links.external = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=16/${place.lat}/${place.lon}`;
      links.embed = `https://www.openstreetmap.org/export/embed.html?bbox=${place.lon - d},${place.lat - d},${place.lon + d},${place.lat + d}&layer=mapnik&marker=${place.lat},${place.lon}`;
    } else {
      links.external = `https://www.openstreetmap.org/search?query=${query}`;
    }
  }
  if (place.mapUrl) links.external = place.mapUrl;
  if (place.embedUrl) links.embed = place.embedUrl;
  return links;
}

// Reader state kept in localStorage: ticket checks, checklist checks, added and deleted items.
export function initialState() {
  return {version: 1, tickets: {}, tasks: {}, addedTasks: [], deletedTaskIds: []};
}

export function normalizeState(value) {
  const s = initialState();
  if (!value || typeof value !== 'object') return s;
  const boolMap = (x) => Object.fromEntries(Object.entries(x && typeof x === 'object' ? x : {}).filter(([k, v]) => typeof k === 'string' && typeof v === 'boolean'));
  s.tickets = boolMap(value.tickets);
  s.tasks = boolMap(value.tasks);
  s.addedTasks = Array.isArray(value.addedTasks)
    ? value.addedTasks.filter((x) => x && typeof x.id === 'string' && typeof x.text === 'string' && x.text.length <= 140)
      .map((x) => ({id: x.id, text: x.text, group: x.group === 'packing' ? 'packing' : 'todo', detail: typeof x.detail === 'string' ? x.detail : ''}))
    : [];
  s.deletedTaskIds = Array.isArray(value.deletedTaskIds) ? value.deletedTaskIds.filter((x) => typeof x === 'string') : [];
  return s;
}

export function visibleTasks(base, state, group = 'all') {
  const deleted = new Set(state.deletedTaskIds);
  return [...base, ...state.addedTasks].filter((x) => !deleted.has(x.id) && (group === 'all' || x.group === group));
}

export function taskStats(base, state, group = 'all') {
  const tasks = visibleTasks(base, state, group);
  return {total: tasks.length, completed: tasks.filter((t) => state.tasks[t.id]).length};
}
