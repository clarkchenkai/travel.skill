import {resolveRentalDays,endpointCalendar,endpointInstant} from './rental.mjs';
import {initMotion} from './motion.mjs';
import {ICONS} from './icons.mjs';
import {escapeHTML as E, safeURL, tripStage, countdown, durationMinutes, formatTime, formatDay, formatDate, arrivalDayOffset, nextFlightIndex, pendingTickets, formatMoney, mapLinks, initialState, normalizeState, visibleTasks, taskStats} from './core.mjs';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const PAGES = ['home', 'map', 'days', 'transport', 'checklist'];
const moduleTitles={};

let data, strings, locale, state, storageKey, places = {}, tickets = {}, sources = {}, accommodations = {};
let activeDialog = null, dialogOpener = null, savedScroll = 0, mapSequence = 0, mapTimer = 0, pendingDialogRestore = null;
let modalHistoryLength = 0, modalPreviousState = null;
let flightIndex = 0, clockTimer = 0, toastTimer = 0, checkGroup = 'all', transportTab = '';

// ---------- i18n ----------
const t = (path, vars = {}) => {
  let node = strings;
  for (const key of path.split('.')) node = node?.[key];
  if (typeof node !== 'string') return path;
  return node.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
};
const plural = (path, n, vars = {}) => {
  const one = path.split('.').reduce((o, k, i, arr) => (i === arr.length - 1 ? o?.[k + '_one'] : o?.[k]), strings);
  return n === 1 && typeof one === 'string' ? one.replace(/\{(\w+)\}/g, (_, k) => ({n, ...vars})[k] ?? '') : t(path, {n, ...vars});
};

async function loadJSON(url) {
  const res = await fetch(url, {cache: 'no-cache'});
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

// ---------- helpers ----------
function chip(label, attrs = '', icon = '') { return `<button type="button" class="chip" ${attrs}>${icon}${E(label)}</button>`; }
function responsiveImage(image, sizes, minimumWidth = 0) {
  const variants = data.imageVariants?.[image];
  if (!Array.isArray(variants) || !variants.length) return '';
  const set = variants.filter((v) => safeURL(v.src) && Number.isFinite(v.width) && v.width > 0 && v.width >= minimumWidth)
    .map((v) => `${v.src} ${v.width}w`).join(', ');
  return set ? ` srcset="${E(set)}" sizes="${E(sizes)}"` : '';
}
function sourceLinks(refs = []) {
  const items = refs.map((id) => sources[id]).filter(Boolean).map((s) => s.url ? `<a href="${E(safeURL(s.url))}" target="_blank" rel="noopener noreferrer">${E(s.title)}</a>` : `<span>${E(s.title)}</span>`);
  return items.length ? `<div class="source-links">${items.join('')}</div>` : '';
}
function statusLabel(item) {
  const status = item.status || 'unknown';
  const label = item.statusLabel || t('transport.status.' + status);
  return `<span class="status-label" data-status="${E(status)}">${E(label)}</span>`;
}
function toast(message, action) {
  const el = $('#toast');
  el.innerHTML = E(message) + (action ? ` <button type="button">${E(action.label)}</button>` : '');
  if (action) el.querySelector('button').onclick = () => { action.run(); el.textContent = ''; };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.textContent = ''; }, action ? 6000 : 2500);
}
async function copyText(text, okMessage) {
  try { await navigator.clipboard.writeText(text); toast(okMessage || t('map.copied')); return true; }
  catch { toast(t('map.copyFailed')); return false; }
}
function getState() { try { return normalizeState(JSON.parse(localStorage.getItem(storageKey) || 'null')); } catch { return initialState(); } }
function saveState() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); $('#storage-warning')?.setAttribute('hidden', ''); }
  catch { $('#storage-warning')?.removeAttribute('hidden'); }
}
function firstVisitDate(placeId) {
  for (const day of data.days) for (const e of day.events) if ((e.placeIds || []).includes(placeId)) return day.date;
  for (const day of data.days) if (accommodations[day.accommodationId]?.placeId === placeId) return day.date;
  return '';
}

// ---------- dialogs ----------
function openDialog(el) {
  pendingDialogRestore = null;
  if (activeDialog) { activeDialog.close(); }
  else {
    savedScroll = window.scrollY;
    dialogOpener = document.activeElement;
    modalPreviousState = history.state?.roadbookModal ? null : history.state;
    if (!history.state?.roadbookModal) history.pushState({roadbookModal: true}, '', location.href);
    modalHistoryLength = history.length;
    document.body.classList.add('dialog-open');
  }
  activeDialog = el;
  el.showModal();
  $('.dialog-content', el).scrollTop = 0;
}
function restoreDialogPosition({opener, scroll}) {
  requestAnimationFrame(() => {
    if (activeDialog || !opener?.isConnected || opener.closest('[hidden]')) return;
    window.scrollTo({top: scroll, behavior: 'instant'});
    opener.focus({preventScroll: true});
  });
}
function releaseDialog() {
  if (!activeDialog) return;
  activeDialog.close();
  activeDialog = null;
  mapSequence++;
  clearTimeout(mapTimer);
  const frame = $('#map-frame');
  const blank = frame.cloneNode(false);
  blank.removeAttribute('src');
  frame.replaceWith(blank);
  document.body.classList.remove('dialog-open');
  const restore = {opener: dialogOpener, scroll: savedScroll};
  dialogOpener = null;
  // Safari restores history focus/scroll after popstate. Restore our opener after that work.
  restoreDialogPosition(restore);
  return restore;
}
function closeDialog() {
  if (!activeDialog) return;
  const pushed = Boolean(history.state?.roadbookModal);
  const restore = releaseDialog(); // Never wait for an iframe's session-history traversal to close the UI.
  if (pushed && history.length === modalHistoryLength) {
    pendingDialogRestore = restore;
    history.back();
  } else if (pushed) {
    // An iframe added joint-history entries. Clear our marker without traversing that history.
    // The History API cannot safely remove an unknown number of those entries.
    history.replaceState(modalPreviousState, '', location.href);
  }
}

function openMap(id) {
  const p = places[id];
  if (!p) return;
  const links = mapLinks(p, data.trip.map?.provider || 'google');
  $('#map-title').textContent = p.name;
  $('#map-local').textContent = p.localName && p.localName !== p.name ? p.localName : '';
  $('#map-address').textContent = p.address || '';
  $('#map-note').textContent = p.note || '';
  $('#map-sources').innerHTML = sourceLinks(p.sourceRefs);
  $('#map-copy').textContent = t('map.copy');
  $('#map-copy').dataset.copy = [p.localName || p.name, p.address].filter(Boolean).join('\n');
  const ext = $('#map-external');
  ext.textContent = t('map.openExternal');
  ext.href = safeURL(links.external);
  ext.hidden = !ext.href;
  $('#map-network').textContent = t('map.networkNote');
  const status = $('#map-status'), frame = $('#map-frame'), wrap = $('#map-frame-wrap'), seq = ++mapSequence;
  clearTimeout(mapTimer);
  openDialog($('#map-dialog'));
  const embed = safeURL(links.embed);
  if (embed && (data.trip.map?.embed ?? true)) {
    wrap.hidden = false;
    status.textContent = t('map.loading');
    // A cross-origin load event also fires for provider error pages, so the copy/link controls never depend on it.
    frame.onload = () => {
      if (seq !== mapSequence) return;
      status.textContent = t('map.loaded');
      // Some embeds grab keyboard focus; take it back so Escape and the close button keep working.
      if (activeDialog === $('#map-dialog') && document.activeElement === frame) $('#map-close').focus({preventScroll: true});
    };
    frame.onerror = () => { if (seq === mapSequence) status.textContent = t('map.failed'); };
    frame.title = p.name;
    frame.src = embed;
    mapTimer = setTimeout(() => { if (seq === mapSequence && status.textContent === t('map.loading')) status.textContent = t('map.slow'); }, 7000);
  } else {
    wrap.hidden = true;
    frame.onload = frame.onerror = null;
    frame.removeAttribute('src');
    status.textContent = t('map.noEmbed');
  }
}

function openTicket(id) {
  const tk = tickets[id];
  if (!tk) return;
  $('#ticket-title').textContent = tk.title;
  $('#ticket-status').innerHTML = statusLabel(tk) + (tk.optional ? ` <span class="status-label">${E(t('tickets.optional'))}</span>` : '') + (tk.date ? ` <span class="muted small">${E(formatDate(tk.date, locale))}</span>` : '');
  $('#ticket-where-label').textContent = t('tickets.where');
  $('#ticket-where').textContent = tk.where || '—';
  $('#ticket-price-label').textContent = t('tickets.price');
  $('#ticket-price').textContent = formatMoney(tk.price, locale) || '—';
  $('#ticket-guide').textContent = tk.guide || '';
  const local = $('#ticket-local');
  local.hidden = !tk.localText;
  local.textContent = tk.localText || '';
  const copy = $('#ticket-copy');
  copy.hidden = !tk.localText;
  copy.textContent = t('tickets.copyLocal');
  copy.dataset.copy = tk.localText || '';
  const map = $('#ticket-map');
  map.hidden = !tk.placeId || !places[tk.placeId];
  map.textContent = t('tickets.map');
  map.href = '#';
  map.onclick = (e) => { e.preventDefault(); openMap(tk.placeId); };
  $('#ticket-sources').innerHTML = sourceLinks(tk.sourceRefs);
  $('#ticket-disclaimer').textContent = t('tickets.disclaimer');
  const toggle = $('#ticket-toggle');
  const sync = () => {
    const bought = Boolean(state.tickets[id]);
    toggle.textContent = bought ? t('tickets.bought') : t('tickets.notBought');
    toggle.setAttribute('aria-pressed', String(bought));
  };
  toggle.onclick = () => { state.tickets[id] = !state.tickets[id]; saveState(); sync(); updateTicketViews(); };
  sync();
  openDialog($('#ticket-dialog'));
}
function updateTicketViews() {
  for (const el of $$('[data-day-tickets]')) {
    const day = data.days.find((d) => d.id === el.dataset.dayTickets);
    const pending = pendingTickets(day, state.tickets).length;
    el.textContent = pending ? plural('days.pending', pending) : t('days.allBought');
    el.classList.toggle('muted', !pending);
  }
  for (const el of $$('[data-ticket]')) el.setAttribute('aria-pressed', String(Boolean(state.tickets[el.dataset.ticket])));
}

// ---------- pages ----------
function renderHome() {
  const trip = data.trip;
  const nights = data.days.length;
  document.title = trip.title;
  $('meta[name=description]').content = trip.subtitle || trip.title;
  $('#identity-title').textContent = trip.shortTitle || trip.title;
  $('#identity-meta').textContent = trip.eyebrow || trip.countries?.join(' · ') || '';
  $('#cover-eyebrow').textContent = trip.eyebrow || '';
  $('#cover-title').textContent = trip.title;
  $('#cover-subtitle').textContent = trip.subtitle || '';
  const range = `${formatDate(trip.startDate, locale, {month: 'short', day: 'numeric'})} – ${formatDate(trip.endDate, locale, {month: 'short', day: 'numeric', year: 'numeric'})}`;
  $('#cover-meta').textContent = [range, plural('cover.days', nights), trip.people ? plural('cover.people', trip.people) : ''].filter(Boolean).join(' · ');
  $('#cover-action').textContent = t('cover.open');
  const media = $('#cover-media');
  if (trip.cover?.image) {
    media.innerHTML = `<img src="${E(trip.cover.image)}"${responsiveImage(trip.cover.image, '(min-width: 900px) 1088px, (min-width: 720px) 688px, calc(100vw - 32px)', 900)} alt="${E(trip.cover.alt || '')}" fetchpriority="high" style="object-position:${E(trip.cover.position || 'center')}">`;
    $('#cover').classList.add('has-image');
    $('#cover').dataset.copy = trip.cover.copy || 'top-left';
  } else { media.innerHTML = ''; $('#cover').classList.remove('has-image'); }
  if (trip.textures?.paper) document.documentElement.style.setProperty('--paper-texture', `url("${trip.textures.paper}")`);
  const stage = tripStage(trip);
  $('#trip-stage').textContent = stage.kind === 'before' ? plural('stage.before', stage.daysUntil) : stage.kind === 'after' ? t('stage.after') : t('stage.during', {n: stage.dayIndex, total: stage.total});
  $('#home-grid').innerHTML = [
    ['map', t('nav.map'), `${data.places.length}`],
    ['days', t('nav.days'), `${data.days.length}`],
    ['transport', t('nav.transport'), `${data.flightJourneys.length}`],
    ['checklist', t('nav.checklist'), `${taskStats(data.checklist, state).completed}/${taskStats(data.checklist, state).total}`],
  ].map(([id, label, meta]) => `<a class="home-card" href="#${id}"><b>${E(label)}</b><span>${E(meta)}</span></a>`).join('');
  $('#demo-notice').hidden = !trip.demo;
  $('#demo-notice').textContent = trip.demoNotice || t('demoNotice');
}

function renderMap() {
  const overview = data.routeOverview;
  const routeStrip = data.days.map((d) => d.title).filter((v, i, a) => v && a[i - 1] !== v);
  const list = data.places.map((p) => {
    const when = firstVisitDate(p.id);
    return `<li><button type="button" class="place-row" data-map="${E(p.id)}"><span><b>${E(p.name)}</b>${p.localName && p.localName !== p.name ? `<span class="local"> · ${E(p.localName)}</span>` : ''}<br><span class="kind">${E(p.kind || '')}</span></span><span class="when">${when ? E(formatDate(when, locale, {month: 'short', day: 'numeric'})) : ''}</span></button></li>`;
  }).join('');
  $('#map').innerHTML = `
    <div class="section-head"><h2>${E(t('map.title'))}</h2><small>${data.places.length}</small></div>
    <div class="layout-2">
      <div>
        ${overview?.image ? `<figure class="route-overview"><img src="${E(overview.image)}" alt="${E(overview.alt || '')}" loading="lazy"><figcaption>${E(overview.caption || '')}</figcaption></figure>` : ''}
        <div class="card route-strip">${routeStrip.map((s, i) => `${i ? '<span class="arrow">→</span>' : ''}<span>${E(s)}</span>`).join('')}</div>
        <p class="muted small" style="margin-top:10px">${E(t('map.networkNote'))}</p>
      </div>
      <div class="card"><h3 class="small muted" style="margin-bottom:4px">${E(t('map.directory'))}</h3><ul class="place-list">${list}</ul></div>
    </div>`;
}

function eventHTML(e) {
  const placeChips = (e.placeIds || []).map((id) => places[id] ? chip(places[id].name, `data-map="${E(id)}"`, ICONS.pin) : '').join('');
  const ticketChips = (e.ticketIds || []).map((id) => tickets[id] ? chip(tickets[id].title, `data-ticket="${E(id)}" aria-pressed="${Boolean(state.tickets[id])}"`, ICONS.ticket) : '').join('');
  const details = (e.details || []).length ? `<details><summary>${E(t('days.expand'))}</summary><ul>${e.details.map((d) => `<li>${E(d)}</li>`).join('')}</ul></details>` : '';
  return `<div class="event"><div class="event-time">${E(e.timeLabel || '')}</div><div><div class="event-title">${E(e.title)}</div>${e.notes ? `<p class="event-notes">${E(e.notes)}</p>` : ''}${details}${placeChips || ticketChips ? `<div class="chips">${placeChips}${ticketChips}</div>` : ''}${sourceLinks(e.sourceRefs)}</div></div>`;
}
function renderDays() {
  const html = data.days.map((day, i) => {
    const stay = accommodations[day.accommodationId];
    const d = new Date(day.date + 'T00:00:00Z');
    const dayNum = new Intl.DateTimeFormat(locale, {timeZone: 'UTC', day: 'numeric'}).format(d);
    const monthWeek = new Intl.DateTimeFormat(locale, {timeZone: 'UTC', month: 'short', weekday: 'short'}).format(d);
    const events = day.events.length ? day.events.map(eventHTML).join('') : `<p class="muted small" style="padding:12px 0">${E(t('days.noEvents'))}</p>`;
    const stayHTML = stay ? `<div class="stay"><div><small>${E(t('days.stay'))}</small><b>${E(stay.name)}</b>${stay.localName && stay.localName !== stay.name ? `<small>${E(stay.localName)}</small>` : ''} ${statusLabel(stay)}</div>${stay.placeId && places[stay.placeId] ? `<button type="button" class="pill pill-small" data-map="${E(stay.placeId)}" aria-label="${E(t('days.map'))}: ${E(stay.name)}">${E(t('days.map'))}</button>` : ''}</div>` : '';
    const thumb = day.cover ? `<img class="day-thumb" src="${E(day.cover)}"${responsiveImage(day.cover, '(min-width: 900px) 88px, 64px')} alt="${E(day.coverAlt || '')}" loading="lazy" decoding="async">` : '';
    return `<details class="day ${day.cover ? 'has-cover' : ''}" id="${E(day.id)}" ${i === 0 ? 'open' : ''}><summary class="day-summary">${thumb}<span class="day-date">${E(monthWeek)}<b>${E(dayNum)}</b></span><span><span class="day-title">${E(day.title)}</span>${day.subtitle ? `<div class="day-sub">${E(day.subtitle)}</div>` : ''}<div class="day-sub" data-day-tickets="${E(day.id)}" ${day.events.some((e) => e.ticketIds?.length) ? '' : 'hidden'}></div></span><span class="day-toggle" aria-hidden="true">${ICONS.chevron}</span></summary><div class="day-body">${events}${stayHTML}</div></details>`;
  }).join('');
  $('#days').innerHTML = `<div class="section-head"><h2>${E(t('days.title'))}</h2><small>${data.days.length}</small></div><div class="days-grid">${html}</div>`;
  updateTicketViews();
}

function segmentHTML(s) {
  const offset = arrivalDayOffset(s);
  const mins = durationMinutes(s.departure, s.arrival);
  return `<div class="segment"><div class="segment-row">
    <div class="airport from"><div class="iata">${E(s.origin.code)}</div><div class="city">${E(s.origin.city)}</div><div class="meta">${E(s.origin.terminal || '')}</div><div class="time">${E(formatTime(s.departure, s.origin.timeZone, locale))}</div><div class="date">${E(formatDay(s.departure, s.origin.timeZone, locale))} · ${E(s.origin.timeZoneLabel || s.origin.timeZone)}</div></div>
    <div class="segment-mid"><span>${E(s.number || '')}</span><span class="line"></span><span>${mins === null ? '' : E(t('transport.duration', {h: Math.floor(mins / 60), m: String(mins % 60).padStart(2, '0')}))}</span></div>
    <div class="airport to"><div class="iata">${E(s.destination.code)}</div><div class="city">${E(s.destination.city)}</div><div class="meta">${E(s.destination.terminal || '')}</div><div class="time">${E(formatTime(s.arrival, s.destination.timeZone, locale))}${offset > 0 ? `<sup class="small muted"> ${E(t('transport.nextDay', {n: offset}))}</sup>` : offset < 0 ? `<sup class="small muted"> ${E(t('transport.prevDay', {n: -offset}))}</sup>` : ''}</div><div class="date">${E(formatDay(s.arrival, s.destination.timeZone, locale))} · ${E(s.destination.timeZoneLabel || s.destination.timeZone)}</div></div>
  </div></div>`;
}
function flightHTML(j, i) {
  return `<article class="flight-card" data-flight-index="${i}" aria-label="${E(j.label || '')}">
    <div class="flight-head"><b>${E(j.label || t('transport.flight'))}</b><span>${E(j.airline || '')} ${statusLabel(j)}</span></div>
    ${j.segments.map(segmentHTML).join('')}
    <div class="flight-foot"><span>${E(t('transport.countdown'))}</span><span class="countdown" data-countdown="${E(j.segments[0].departure)}"></span></div>
    ${(j.notes || []).length ? `<details class="flight-notes"><summary>${E(t('transport.notes'))}</summary>${j.notes.map((n) => `<p>${E(n)}</p>`).join('')}</details>` : ''}
    ${sourceLinks(j.sourceRefs)}</article>`;
}
function rentalHTML(r) {
  if (!r) return '';
  const R=strings.rental, row=(label,value)=>value?`<dt>${E(label)}</dt><dd>${E(value)}</dd>`:'';
  const endpoint=(key,label)=>{
    const e=r[key]||{},cal=endpointCalendar(e),place=places[e.placeId];
    return `<section class="rental-endpoint"><h4>${E(label)}</h4><p>${E(cal.date?formatDate(cal.date,locale):R.unknown)} ${E(cal.time)} <small>${E(cal.timeZone)}</small></p><p>${E(e.branchName||place?.name||R.unknown)}</p>${place?chip(place.name,`data-map="${E(place.id)}"`,ICONS.pin):''}<dl>${row(R.hours,e.openingHours)}${row(R.afterHours,e.afterHours)}</dl>${sourceLinks(e.sourceRefs||[])}</section>`;
  };
  const deadline=endpointInstant(r.dropOff);
  const docs=(r.eligibility?.documents||[]).map(doc=>`<details class="rental-document"><summary>${E(doc.title)} <span class="status-label" data-status="${E(doc.status||'unknown')}">${E(R.documentStatus?.[doc.status||'unknown']||R.unknown)}</span></summary><dl>${row(R.issuer,doc.issuer)}${row(R.materials,Array.isArray(doc.materials)?doc.materials.join(' · '):doc.materials)}${row(R.processing,doc.processingTime)}${row(R.validity,[doc.validity,doc.expiresOn].filter(Boolean).join(' · '))}${row(R.fee,typeof doc.fee==='object'?formatMoney(doc.fee,locale):doc.fee)}</dl>${safeURL(doc.applicationUrl)?`<a href="${E(safeURL(doc.applicationUrl))}" target="_blank" rel="noopener noreferrer">${E(R.apply)} ↗</a>`:''}${sourceLinks(doc.sourceRefs||[])}</details>`).join('');
  return `<div class="card rental" style="margin-top:16px"><h3>${E(t('transport.rental'))} · ${E(r.vendor||R.unknown)} ${statusLabel(r)}</h3><p class="muted small">${E(r.vehicle||'')}</p><div class="rental-endpoints">${endpoint('pickUp',t('transport.pickUp'))}${endpoint('dropOff',t('transport.returnBy'))}</div>${deadline?`<p class="rental-return-clock">${E(R.remaining)} <span data-countdown="${E(deadline)}" data-countdown-kind="rental"></span></p>`:''}<dl>${row(t('transport.deposit'),formatMoney(r.deposit,locale))}${row(t('transport.coverage'),r.coverage)}${row(t('transport.fuel'),r.fuelPolicy)}</dl><details><summary>${E(R.eligibility)}</summary><p>${E(r.eligibility?.licenceCountry||R.unknown)}</p><p>${E(r.eligibility?.supplierAcceptance||R.verify)}</p>${docs||`<p>${E(R.verify)}</p>`}</details>${(r.conditions||[]).map(c=>`<details><summary>${E(c.title)} ${statusLabel(c)}</summary><p>${E(c.text||R.unknown)}</p>${sourceLinks(c.sourceRefs||[])}</details>`).join('')}${(r.notes||[]).map(n=>`<p class="muted small">${E(n)}</p>`).join('')}${sourceLinks(r.sourceRefs||[])}</div>`;
}
function renderTransport() {
  const journeys = data.flightJourneys;
  const tabs = data.groundTransport?.tabs || [];
  if (!transportTab || !tabs.some((x) => x.id === transportTab)) transportTab = tabs[0]?.id || '';
  $('#transport').innerHTML = `
    <div class="section-head"><h2>${E(t('transport.title'))}</h2></div>
    <h3 class="small muted" style="margin-bottom:8px">${E(t('transport.flights'))}</h3>
    ${journeys.length ? `<div class="flight-rail" id="flight-rail">${journeys.map(flightHTML).join('')}</div><div class="flight-nav" id="flight-nav"><button type="button" class="icon-button" data-flight="-1" aria-label="${E(t('transport.prev'))}">‹</button>${journeys.map((_, i) => `<span class="dot" data-dot="${i}"></span>`).join('')}<button type="button" class="icon-button" data-flight="1" aria-label="${E(t('transport.next'))}">›</button></div>` : `<p class="muted small">${E(t('transport.noFlights'))}</p>`}
    ${rentalHTML(data.rental)}
    ${tabs.length ? `<div class="tabs" role="tablist">${tabs.map((tab) => `<button type="button" class="tab" role="tab" data-tab="${E(tab.id)}" aria-selected="${tab.id === transportTab}">${E(tab.title)}</button>`).join('')}</div><div class="tab-panel" id="tab-panel"></div>` : ''}`;
  renderTab();
  if (journeys.length) {
    flightIndex = nextFlightIndex(journeys);
    const rail = $('#flight-rail');
    rail.addEventListener('scroll', () => { const w = rail.firstElementChild?.offsetWidth || 1; const i = Math.round(rail.scrollLeft / (w + 12)); if (i !== flightIndex) { flightIndex = Math.max(0, Math.min(journeys.length - 1, i)); syncDots(); } }, {passive: true});
    requestAnimationFrame(() => scrollToFlight(false));
  }
  updateClocks();
}
function groundItemHTML(item) { return `<div class="card"><h3>${E(item.title)}</h3><p>${E(item.text || '')}</p>${(item.placeIds || []).length ? `<div class="chips">${item.placeIds.map((id) => places[id] ? chip(places[id].name, `data-map="${E(id)}"`, ICONS.pin) : '').join('')}</div>` : ''}${sourceLinks(item.sourceRefs)}</div>`; }
function renderTab() {
  const tab = (data.groundTransport?.tabs || []).find((x) => x.id === transportTab);
  const panel = $('#tab-panel');
  if (!tab || !panel) return;
  panel.innerHTML = tab.items.map(groundItemHTML).join('');
  $$('.tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === transportTab)));
}
function syncDots() { $$('[data-dot]').forEach((d) => { if (Number(d.dataset.dot) === flightIndex) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); }); }
function scrollToFlight(smooth = true) {
  const rail = $('#flight-rail');
  const card = rail?.children[flightIndex];
  if (!card) return;
  rail.scrollTo({left: card.offsetLeft - 16, behavior: smooth ? 'smooth' : 'instant'});
  syncDots();
}
function updateClocks() {
  const now = new Date();
  for (const el of $$('[data-countdown]')) {
    const c = countdown(el.dataset.countdown, now);
    if (!c) { el.textContent = ''; continue; }
    el.textContent = c.ended ? (el.dataset.countdownKind==='rental'?strings.rental.past:t('transport.departed')) : (c.days ? `${c.days}d ` : '') + `${String(c.hours).padStart(2, '0')}:${String(c.minutes).padStart(2, '0')}:${String(c.seconds).padStart(2, '0')}`;
  }
}

function taskHTML(task) { return `<div class="task ${state.tasks[task.id] ? 'done' : ''}" data-task="${E(task.id)}"><input type="checkbox" id="task-${E(task.id)}" ${state.tasks[task.id] ? 'checked' : ''}><label for="task-${E(task.id)}">${E(task.text)}${task.detail ? `<small>${E(task.detail)}</small>` : ''}</label><button type="button" class="delete" data-delete="${E(task.id)}" aria-label="${E(t('checklist.delete'))}: ${E(task.text)}">${ICONS.x}</button></div>`; }
function renderChecklist() {
  const stats = taskStats(data.checklist, state, checkGroup);
  const tasks = visibleTasks(data.checklist, state, checkGroup);
  $('#checklist').innerHTML = `
    <div class="section-head"><h2>${E(t('checklist.title'))}</h2><small class="check-progress">${E(t('checklist.progress', {done: stats.completed, total: stats.total}))}</small></div>
    <div class="check-groups" role="tablist">${['all', 'todo', 'packing'].map((g) => `<button type="button" class="tab" role="tab" data-group="${g}" aria-selected="${g === checkGroup}">${E(t('checklist.' + g))}</button>`).join('')}</div>
    <form class="check-form" id="check-form"><input id="check-input" type="text" maxlength="140" placeholder="${E(t('checklist.placeholder'))}" autocomplete="off" aria-label="${E(t('checklist.placeholder'))}"><button type="submit" class="pill pill-solid">${E(t('checklist.add'))}</button></form>
    <p class="storage-warning" id="storage-warning" hidden>${E(t('checklist.storageWarning'))}</p>
    <div class="check-list">${tasks.length ? tasks.map(taskHTML).join('') : `<p class="muted small">${E(t('checklist.empty'))}</p>`}</div>
    <p class="muted small" style="margin-top:14px">${E(t('checklist.privacy'))}</p>`;
  const form = $('#check-form'), input = $('#check-input');
  let composing = false;
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (composing) return;
    const text = input.value.trim();
    if (!text) return;
    const all = visibleTasks(data.checklist, state);
    if (all.some((x) => x.text.toLowerCase() === text.toLowerCase())) { toast(t('checklist.duplicate')); return; }
    state.addedTasks.push({id: 'u-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, group: checkGroup === 'packing' ? 'packing' : 'todo', detail: ''});
    saveState();
    renderChecklist();
    $('#check-input').focus();
  });
}
function deleteTask(id) {
  const all = visibleTasks(data.checklist, state);
  const task = all.find((x) => x.id === id);
  if (!task) return;
  const wasDone = Boolean(state.tasks[id]);
  const addedIndex = state.addedTasks.findIndex((x) => x.id === id);
  if (addedIndex >= 0) state.addedTasks.splice(addedIndex, 1); else state.deletedTaskIds.push(id);
  saveState();
  renderChecklist();
  toast(t('checklist.deleted'), {label: t('checklist.undo'), run: () => {
    if (addedIndex >= 0) state.addedTasks.splice(addedIndex, 0, task); else state.deletedTaskIds = state.deletedTaskIds.filter((x) => x !== id);
    if (wasDone) state.tasks[id] = true;
    saveState();
    renderChecklist();
  }});
}

// ---------- navigation ----------
function currentPage() {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (PAGES.includes(hash)) return {page: hash, target: null};
  const target = hash ? document.getElementById(hash) : null;
  const page = target?.closest('.page')?.id;
  return page ? {page, target} : {page: 'home', target: null};
}
function route() {
  pendingDialogRestore = null;
  const {page, target} = currentPage();
  document.body.dataset.page = page;
  for (const id of PAGES) document.getElementById(id).hidden = id !== page;
  $$('.bottom-nav a').forEach((a) => { if (a.hash === '#' + page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const nav=$('#bottom-nav'),active=$('a[aria-current]',nav);
  if(active&&nav.scrollWidth>nav.clientWidth&&(active.offsetLeft<nav.scrollLeft||active.offsetLeft+active.offsetWidth>nav.scrollLeft+nav.clientWidth))nav.scrollLeft=Math.max(0,active.offsetLeft-(nav.clientWidth-active.offsetWidth)/2);
  if (target) { const day = target.closest('details'); if (day) day.open = true; }
  requestAnimationFrame(() => { if (target) target.scrollIntoView({block: 'start'}); else window.scrollTo({top: 0, behavior: 'instant'}); });
  if (page === 'transport') requestAnimationFrame(() => scrollToFlight(false));
}
function pageLabel(id) { return moduleTitles[id] || t('nav.' + id); }
async function initModules() {
  for(const spec of data.ui?.modules||[]) {
    if(!spec||!/^[a-z][a-z0-9-]*$/.test(spec.id)||PAGES.includes(spec.id)||!/^modules\/[a-zA-Z0-9_/-]+\.mjs$/.test(spec.source)||spec.source.includes('..'))continue;
    const host=document.createElement('section');host.className='page';host.id=spec.id;host.hidden=true;
    document.querySelector('#main > .footer').before(host);PAGES.push(spec.id);
    moduleTitles[spec.id]=spec.title||spec.id;
    try {
      const module=await import('./'+spec.source);
      moduleTitles[spec.id]=module.title?.[locale]||module.title?.en||moduleTitles[spec.id];
      if(typeof module.render!=='function')throw new Error('Module must export render(context)');
      await module.render({element:host,data,locale,escapeHTML:E,formatMoney,sourceLinks,openMap,storageKey:`${storageKey}:module:${spec.id}`});
    } catch(error) {
      host.textContent=strings.moduleUnavailable;host.setAttribute('role','alert');
      console.warn(`Module ${spec.id} unavailable`,error);
    }
  }
  document.querySelector('#bottom-nav').style.setProperty('--page-count',PAGES.length);
}
function renderNav() {
  $('#bottom-nav').innerHTML = PAGES.map((id) => `<a href="#${id}">${ICONS[id]||ICONS.ticket}<span>${E(pageLabel(id))}</span></a>`).join('');
  $('#bottom-nav').setAttribute('aria-label', t('nav.sections'));
  for (const id of PAGES) document.getElementById(id).setAttribute('aria-label', pageLabel(id));
  $('.skip-link').textContent = t('skipToDays');
  $('#footer-top').textContent = t('footer.top');
}

function initParallax() {
  const img = $('#cover-media img');
  if (!img || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  const update = () => { ticking = false; if (document.body.dataset.page !== 'home') return; img.style.transform = `translateY(${Math.min(window.scrollY, 600) * 0.18}px) scale(1.06)`; };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, {passive: true});
  update();
}
function initEvents() {
  document.addEventListener('click', (e) => {
    const map = e.target.closest('[data-map]'); if (map) { openMap(map.dataset.map); return; }
    const ticket = e.target.closest('[data-ticket]'); if (ticket) { openTicket(ticket.dataset.ticket); return; }
    const close = e.target.closest('[data-close-dialog]'); if (close) { closeDialog(); return; }
    const copy = e.target.closest('[data-copy]'); if (copy) { copyText(copy.dataset.copy); return; }
    const tab = e.target.closest('[data-tab]'); if (tab) { transportTab = tab.dataset.tab; renderTab(); return; }
    const group = e.target.closest('[data-group]'); if (group) { checkGroup = group.dataset.group; renderChecklist(); return; }
    const del = e.target.closest('[data-delete]'); if (del) { deleteTask(del.dataset.delete); return; }
    const flight = e.target.closest('[data-flight]'); if (flight) { flightIndex = Math.max(0, Math.min(data.flightJourneys.length - 1, flightIndex + Number(flight.dataset.flight))); scrollToFlight(); return; }
    if (e.target.closest('[data-top]')) window.scrollTo({top: 0, behavior: 'smooth'});
    const nav = e.target.closest('.bottom-nav a, .identity');
    if (nav && nav.hash === location.hash) { e.preventDefault(); route(); }
  });
  document.addEventListener('change', (e) => {
    const task = e.target.closest('.task input[type=checkbox]');
    if (!task) return;
    const id = task.closest('.task').dataset.task;
    state.tasks[id] = task.checked;
    saveState();
    task.closest('.task').classList.toggle('done', task.checked);
    $('.check-progress').textContent = t('checklist.progress', {done: taskStats(data.checklist, state, checkGroup).completed, total: taskStats(data.checklist, state, checkGroup).total});
  });
  for (const dialog of $$('dialog')) {
    dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(); });
    dialog.addEventListener('click', (e) => { if (e.target === dialog) closeDialog(); });
  }
  window.addEventListener('popstate', () => {
    if (activeDialog && !history.state?.roadbookModal) releaseDialog();
    if (pendingDialogRestore) {
      restoreDialogPosition(pendingDialogRestore);
      pendingDialogRestore = null;
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && activeDialog) { e.preventDefault(); closeDialog(); } });
  window.addEventListener('hashchange', route);
  $('#share-button').addEventListener('click', async () => {
    const url = location.href.split('#')[0];
    if (navigator.share) { try { await navigator.share({title: data.trip.title, url}); return; } catch { /* dismissed */ } }
    copyText(url, t('share.copied'));
  });
  $('#share-button').setAttribute('aria-label', t('share.button'));
  $('#map-close').textContent = $('#ticket-close').textContent = t('map.close');
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateClocks(); });
}

async function init() {
  const status = $('#page-status');
  try {
    data = await loadJSON('travel-data.json');
    locale = data.trip.locale || 'en';
    const packName = data.ui?.localePack || (['zh-CN', 'en'].includes(locale) ? locale : locale.startsWith('zh') ? 'zh-CN' : 'en');
    strings = await loadJSON(`i18n/${packName}.json`);
    if (data.ui?.strings) strings = deepMerge(strings, data.ui.strings);
  } catch (err) {
    status.textContent = (strings ? t('loadError') : 'Could not load travel-data.json. Serve this folder over HTTP (npm run dev).') + ` (${err.message})`;
    status.classList.add('error');
    return;
  }
  document.documentElement.lang = locale;
  document.documentElement.dir = data.trip.dir || 'ltr';
  document.documentElement.dataset.theme = data.trip.theme || 'field-notes';
  data.flightJourneys ||= []; data.places ||= []; data.days ||= []; data.tickets ||= []; data.checklist ||= []; data.sources ||= []; data.accommodations ||= [];
  data.days=resolveRentalDays(data,{pickUp:strings.transport.pickUp,dropOff:strings.transport.returnBy});
  places = Object.fromEntries(data.places.map((p) => [p.id, p]));
  tickets = Object.fromEntries(data.tickets.map((x) => [x.id, x]));
  sources = Object.fromEntries(data.sources.map((s) => [s.id, s]));
  accommodations = Object.fromEntries(data.accommodations.map((a) => [a.id, a]));
  storageKey = `roadbook:${data.trip.id}`;
  state = getState();
  await initModules();
  renderNav(); renderHome(); renderMap(); renderDays(); renderTransport(); renderChecklist();
  $('#sources').innerHTML = `<b>${E(t('sources.title'))}</b> ` + data.sources.map((s) => s.url ? `<a href="${E(safeURL(s.url))}" target="_blank" rel="noopener noreferrer">${E(s.title)}</a>` : E(s.title)).join(' · ');
  initEvents();
  initParallax();
  route();
  status.hidden = true;
  try { initMotion(); } catch (err) { console.warn('motion layer skipped', err); }
  clearInterval(clockTimer);
  clockTimer = setInterval(updateClocks, 1000);
  initOffline();
  initPrint();
}
// Offline: only on a built site (the build stamps this meta) and never on file:// or the dev server.
function initOffline() {
  const stamp = document.querySelector('meta[name="roadbook-build"]')?.content;
  if (!stamp || !('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
// Print: show every page and open every day, then restore.
function initPrint() {
  let snapshot = null;
  window.addEventListener('beforeprint', () => {
    if (snapshot) return;
    const panel = $('#tab-panel'), list = $('.check-list'), progress = $('.check-progress');
    snapshot = {page: document.body.dataset.page, open: $$('details').map((d) => d.open),
      panel: panel?.innerHTML, list: list?.innerHTML, progress: progress?.textContent,
      scroll: window.scrollY, focus: document.activeElement};
    if (panel) panel.innerHTML = (data.groundTransport?.tabs || []).map((tab) =>
      `<h3 style="margin:16px 0 8px">${E(tab.title)}</h3>${tab.items.map(groundItemHTML).join('')}`).join('');
    if (list) list.innerHTML = visibleTasks(data.checklist, state).map(taskHTML).join('');
    if (progress) {
      const stats = taskStats(data.checklist, state);
      progress.textContent = t('checklist.progress', {done: stats.completed, total: stats.total});
    }
    for (const id of PAGES) document.getElementById(id).hidden = false;
    $$('details').forEach((d) => { d.open = true; });
    document.body.dataset.page = 'print';
  });
  window.addEventListener('afterprint', () => {
    if (!snapshot) return;
    const saved = snapshot;
    if ($('#tab-panel')) $('#tab-panel').innerHTML = saved.panel;
    if ($('.check-list')) $('.check-list').innerHTML = saved.list;
    if ($('.check-progress')) $('.check-progress').textContent = saved.progress;
    $$('details').forEach((d, i) => { d.open = snapshot.open[i]; });
    document.body.dataset.page = snapshot.page;
    route();
    snapshot = null;
    requestAnimationFrame(() => {
      window.scrollTo({top: saved.scroll, behavior: 'instant'});
      if (saved.focus?.isConnected) saved.focus.focus({preventScroll: true});
    });
  });
}
function deepMerge(base, extra) {
  const out = {...base};
  for (const [k, v] of Object.entries(extra || {})) out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(base[k] || {}, v) : v;
  return out;
}
init();
