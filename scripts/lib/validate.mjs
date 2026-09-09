// Structural validation of travel-data.json plus a gap report. Pure functions; no I/O.
const ISO_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const STATUS = new Set(['unknown', 'needs-confirmation', 'booked', 'demo']);
const THEMES = new Set(['field-notes', 'timetable', 'tide']);
const SENSITIVE_KEYS = new Set(['privatedata', 'passportnumber', 'passportno', 'idcardnumber', 'bookingpin', 'pnr', 'eticketnumber', 'apikey', 'accesstoken', 'refreshtoken', 'password', 'secretkey', 'cardnumber', 'confirmationcode', 'bookingreference']);
const SECRET_MARKER = /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})\b/;

export function validateTravelData(data) {
  const errors = [], warnings = [];
  const err = (path, msg) => errors.push({path, msg});
  const warn = (path, msg) => warnings.push({path, msg});
  if (!data || typeof data !== 'object') { err('$', 'travel-data.json must be a JSON object'); return {errors, warnings}; }
  const trip = data.trip || {};
  if (!trip.id || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(trip.id)) err('trip.id', 'required; lowercase letters, digits and dashes (it namespaces browser storage)');
  if (!trip.title) err('trip.title', 'required');
  if (!YMD.test(trip.startDate || '')) err('trip.startDate', 'YYYY-MM-DD required');
  if (!YMD.test(trip.endDate || '')) err('trip.endDate', 'YYYY-MM-DD required');
  if (trip.startDate && trip.endDate && trip.endDate < trip.startDate) err('trip.endDate', 'ends before it starts');
  if (!trip.timeZone) err('trip.timeZone', 'IANA time zone required (e.g. Europe/Paris)');
  else if (!validZone(trip.timeZone)) err('trip.timeZone', `unknown IANA zone "${trip.timeZone}"`);
  if (trip.theme && !THEMES.has(trip.theme)) warn('trip.theme', `"${trip.theme}" is not a built-in theme (${[...THEMES].join(', ')}); add a [data-theme] block in themes.css`);
  if (trip.map?.provider && !['google', 'osm', 'none'].includes(trip.map.provider)) err('trip.map.provider', 'google | osm | none');

  const ids = (list, name) => {
    const seen = new Set();
    for (const [i, item] of (list || []).entries()) {
      if (!item || typeof item.id !== 'string' || !item.id) err(`${name}[${i}].id`, 'required string');
      else if (seen.has(item.id)) err(`${name}[${i}].id`, `duplicate id "${item.id}"`);
      seen.add(item?.id);
    }
    return seen;
  };
  const placeIds = ids(data.places, 'places');
  const ticketIds = ids(data.tickets, 'tickets');
  const sourceIds = ids(data.sources, 'sources');
  const stayIds = ids(data.accommodations, 'accommodations');
  ids(data.days, 'days'); ids(data.checklist, 'checklist'); ids(data.flightJourneys, 'flightJourneys');

  const refs = (list, path, pool, label) => { for (const id of list || []) if (!pool.has(id)) err(path, `unknown ${label} "${id}"`); };
  const statusOf = (item, path) => { if (item.status !== undefined && !STATUS.has(item.status)) err(path + '.status', `unknown | needs-confirmation | booked | demo (got "${item.status}")`); };

  for (const [i, p] of (data.places || []).entries()) {
    const path = `places[${i}]`;
    if (!p.name) err(path + '.name', 'required');
    if ((p.lat === undefined) !== (p.lon === undefined)) err(path, 'lat and lon must both be set or both omitted');
    if (p.lat !== undefined && (typeof p.lat !== 'number' || typeof p.lon !== 'number' || Math.abs(p.lat) > 90 || Math.abs(p.lon) > 180)) err(path, 'lat/lon out of range');
    refs(p.sourceRefs, path + '.sourceRefs', sourceIds, 'source');
  }
  for (const [i, j] of (data.flightJourneys || []).entries()) {
    const path = `flightJourneys[${i}]`;
    statusOf(j, path);
    if (!Array.isArray(j.segments) || !j.segments.length) { err(path + '.segments', 'at least one segment'); continue; }
    for (const [k, s] of j.segments.entries()) {
      const sp = `${path}.segments[${k}]`;
      for (const end of ['origin', 'destination']) {
        if (!s[end]?.code) err(`${sp}.${end}.code`, 'airport/station code required');
        if (!s[end]?.timeZone) err(`${sp}.${end}.timeZone`, 'IANA zone required');
        else if (!validZone(s[end].timeZone)) err(`${sp}.${end}.timeZone`, `unknown zone "${s[end].timeZone}"`);
      }
      if (!ISO_OFFSET.test(s.departure || '')) err(sp + '.departure', 'ISO time with offset required, e.g. 2031-04-01T10:00:00+08:00');
      if (!ISO_OFFSET.test(s.arrival || '')) err(sp + '.arrival', 'ISO time with offset required');
      if (ISO_OFFSET.test(s.departure || '') && ISO_OFFSET.test(s.arrival || '') && Date.parse(s.arrival) < Date.parse(s.departure)) err(sp, 'arrives before departure (compare absolute instants, not clock faces)');
      if (k > 0 && Date.parse(s.departure) < Date.parse(j.segments[k - 1].arrival)) err(sp, 'connection departs before previous segment arrives');
    }
    refs(j.sourceRefs, path + '.sourceRefs', sourceIds, 'source');
  }
  for (const [i, a] of (data.accommodations || []).entries()) {
    const path = `accommodations[${i}]`;
    if (!a.name) err(path + '.name', 'required');
    statusOf(a, path);
    if (a.placeId && !placeIds.has(a.placeId)) err(path + '.placeId', `unknown place "${a.placeId}"`);
    if (a.checkIn && !YMD.test(a.checkIn)) err(path + '.checkIn', 'YYYY-MM-DD');
    if (a.checkOut && !YMD.test(a.checkOut)) err(path + '.checkOut', 'YYYY-MM-DD');
    refs(a.sourceRefs, path + '.sourceRefs', sourceIds, 'source');
  }
  const dates = new Set();
  for (const [i, d] of (data.days || []).entries()) {
    const path = `days[${i}]`;
    if (!YMD.test(d.date || '')) err(path + '.date', 'YYYY-MM-DD');
    else {
      if (dates.has(d.date)) err(path + '.date', `duplicate day ${d.date}`);
      dates.add(d.date);
      if (trip.startDate && (d.date < trip.startDate || d.date > trip.endDate)) err(path + '.date', 'outside trip dates');
    }
    if (!d.title) err(path + '.title', 'required');
    if (d.accommodationId && !stayIds.has(d.accommodationId)) err(path + '.accommodationId', `unknown accommodation "${d.accommodationId}"`);
    if (!Array.isArray(d.events)) err(path + '.events', 'array required');
    const eventIds = new Set();
    for (const [k, e] of (d.events || []).entries()) {
      const ep = `${path}.events[${k}]`;
      if (!e.id) err(ep + '.id', 'required'); else if (eventIds.has(e.id)) err(ep + '.id', 'duplicate'); eventIds.add(e.id);
      if (!e.title) err(ep + '.title', 'required');
      refs(e.placeIds, ep + '.placeIds', placeIds, 'place');
      refs(e.ticketIds, ep + '.ticketIds', ticketIds, 'ticket');
      refs(e.sourceRefs, ep + '.sourceRefs', sourceIds, 'source');
      statusOf(e, ep);
    }
  }
  if (trip.startDate && trip.endDate && YMD.test(trip.startDate) && YMD.test(trip.endDate)) {
    for (let t = Date.parse(trip.startDate + 'T00:00:00Z'); t <= Date.parse(trip.endDate + 'T00:00:00Z'); t += 86400000) {
      const ymd = new Date(t).toISOString().slice(0, 10);
      if (!dates.has(ymd)) warn('days', `no day entry for ${ymd}`);
    }
  }
  for (const [i, tk] of (data.tickets || []).entries()) {
    const path = `tickets[${i}]`;
    if (!tk.title) err(path + '.title', 'required');
    statusOf(tk, path);
    if (tk.placeId && !placeIds.has(tk.placeId)) err(path + '.placeId', `unknown place "${tk.placeId}"`);
    if (tk.price !== undefined && tk.price !== null && (typeof tk.price.amount !== 'number' || !/^[A-Z]{3}$/.test(tk.price.currency || ''))) err(path + '.price', '{amount:number, currency:"ISO 4217"} or null');
    refs(tk.sourceRefs, path + '.sourceRefs', sourceIds, 'source');
  }
  for (const [i, c] of (data.checklist || []).entries()) {
    if (!c.text) err(`checklist[${i}].text`, 'required');
    if (c.group && !['todo', 'packing'].includes(c.group)) err(`checklist[${i}].group`, 'todo | packing');
  }
  for (const [i, tab] of (data.groundTransport?.tabs || []).entries()) {
    if (!tab.id || !tab.title) err(`groundTransport.tabs[${i}]`, 'id and title required');
    for (const [k, item] of (tab.items || []).entries()) refs(item.placeIds, `groundTransport.tabs[${i}].items[${k}].placeIds`, placeIds, 'place');
  }
  if (data.rental) {
    statusOf(data.rental, 'rental');
    for (const end of ['pickUp', 'dropOff']) if (data.rental[end]?.placeId && !placeIds.has(data.rental[end].placeId)) err(`rental.${end}.placeId`, 'unknown place');
  }
  scanPrivacy(data, '$', err);
  return {errors, warnings};
}

function scanPrivacy(value, path, err) {
  if (Array.isArray(value)) { value.forEach((v, i) => scanPrivacy(v, `${path}[${i}]`, err)); return; }
  if (value && typeof value === 'object') {
    if (value.privacy === 'private' || value.privacy === 'restricted') err(path + '.privacy', 'private/restricted records must not be in the published data');
    for (const [k, v] of Object.entries(value)) {
      const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (SENSITIVE_KEYS.has(norm) && v !== null && v !== '' && v !== undefined) err(`${path}.${k}`, 'looks like a credential or booking reference; keep it out of the public file');
      scanPrivacy(v, `${path}.${k}`, err);
    }
    return;
  }
  if (typeof value === 'string' && SECRET_MARKER.test(value)) err(path, 'contains something that looks like an API key or token');
}

function validZone(zone) {
  try { new Intl.DateTimeFormat('en', {timeZone: zone}); return true; } catch { return false; }
}

// Gap report: what a reader would still need to confirm before the roadbook is trustworthy.
export function gapReport(data) {
  const gaps = [];
  const add = (area, item, why) => gaps.push({area, item, why});
  const trip = data.trip || {};
  if (!trip.people) add('trip', 'people', 'How many travelers? Affects tickets and stays.');
  if (!trip.subtitle) add('trip', 'subtitle', 'One line that says what this trip is.');
  if (!(data.flightJourneys || []).length) add('flights', 'none listed', 'No flights. Fine for a local trip; otherwise add them or confirm the trip has none.');
  for (const j of data.flightJourneys || []) {
    if (!j.status || j.status === 'unknown') add('flights', j.label || j.id, 'Booking status unknown. Booked, or still to confirm?');
    if (j.status === 'needs-confirmation') add('flights', j.label || j.id, 'Marked as needing confirmation.');
  }
  for (const a of data.accommodations || []) {
    if (!a.status || a.status === 'unknown' || a.status === 'needs-confirmation') add('stays', a.name, 'Booking status not confirmed.');
    if (!a.placeId) add('stays', a.name, 'No place linked, so no map or address.');
  }
  for (const [i, d] of (data.days || []).entries()) {
    if (!d.events?.length) add('days', d.date, 'No activities yet.');
    const overnightTravel = (d.events || []).some((e) => ['flight', 'overnight-train', 'ferry-overnight'].includes(e.kind));
    if (!d.accommodationId && i < (data.days.length - 1) && !overnightTravel) add('days', d.date, 'Where do you sleep this night?');
    for (const e of d.events || []) {
      if (!e.timeLabel) add('days', `${d.date} · ${e.title}`, 'No time or time-of-day label.');
      if (!(e.placeIds || []).length && !['note', 'free', 'rest', 'flight', 'overnight-train', 'ferry-overnight'].includes(e.kind)) add('days', `${d.date} · ${e.title}`, 'No place linked; the reader cannot open a map for it.');
    }
  }
  for (const p of data.places || []) {
    if (p.lat === undefined && !p.mapQuery && !p.mapUrl) add('places', p.name, 'No coordinates, map query or map URL.');
    if (!p.address && !p.localName) add('places', p.name, 'No address or local-language name to copy on site.');
  }
  for (const tk of data.tickets || []) {
    if (!tk.price) add('tickets', tk.title, 'No reference price. Leave null if unknown; never put 0.');
    if (!tk.where) add('tickets', tk.title, 'Where is it bought?');
  }
  if (!(data.checklist || []).length) add('checklist', 'empty', 'No pre-trip items yet.');
  if (!(data.groundTransport?.tabs || []).length) add('transport', 'ground transport', 'No rail/bus/walking/driving notes. Skip if not needed.');
  if (data.rental) {
    const r = data.rental;
    for (const [k, why] of [['pickUp', 'Pick-up time and place'], ['dropOff', 'Return deadline and place'], ['coverage', 'Insurance / coverage names as written by the vendor'], ['fuelPolicy', 'Fuel or charge policy'], ['deposit', 'Deposit amount and currency']]) if (!r[k]) add('rental', k, why + ' missing.');
  }
  for (const s of data.sources || []) if (!s.url && s.id !== 'demo' && !s.note) add('sources', s.id, 'No URL or note; where does this fact come from?');
  return gaps;
}
