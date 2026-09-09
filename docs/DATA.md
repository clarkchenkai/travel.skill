# travel-data.json — field reference

One JSON file drives the whole site. The validator (`npm run validate`) enforces what is marked **required**; the gap report (`npm run gaps`) nags about the rest.

Conventions: dates are `YYYY-MM-DD`; instants are ISO 8601 **with offset** (`2031-10-23T19:30:00-04:00`); zones are IANA names (`Europe/Paris`); currencies are ISO 4217 codes; ids are lowercase `a-z0-9-`. Every object may carry `sourceRefs: ["<source id>"]` and `privacy: "public"`. Objects with `privacy: "private"` or `"restricted"`, and any `privateData` key, are stripped at build time and rejected by the validator if they reach the public file.

## trip (required)

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Namespaces browser storage. Changing it resets readers' checks. |
| `title`, `shortTitle`, `eyebrow`, `subtitle` | title | Cover and header text. |
| `startDate`, `endDate` | yes | Inclusive. Every day in between should have a `days[]` entry (warning otherwise). |
| `timeZone` | yes | The trip's "home" zone for the day counter. Flights use their own endpoint zones. |
| `locale` | no | `en` (default) or `zh-CN`. Add a pack in `template/i18n/` for others. |
| `theme` | no | `field-notes` (default), `timetable`, `tide`, or your own block in `themes.css`. |
| `people` | no | Number of travelers. |
| `countries` | no | ISO 3166 codes, shown in the header if no `eyebrow`. |
| `map` | no | `{ "provider": "google" \| "osm" \| "none", "embed": true }`. `none` keeps addresses and copy buttons but no map links. |
| `cover` | no | `{ "image": "assets/cover.jpg", "alt": "..." }`. Files live in `trip/assets/`. |
| `demo`, `demoNotice` | no | `true` shows the "fictional example" banner. Set `false` for a real trip. |
| `updatedAt` | no | Date string for your own tracking. |

## flightJourneys[]

One entry per journey (outbound, return, a mid-trip hop). `status` is one of `unknown`, `needs-confirmation`, `booked`, `demo`. `statusLabel` overrides the displayed text.

```json
{
  "id": "outbound", "label": "Outbound · New York → Amsterdam", "airline": "…", "status": "booked",
  "segments": [{
    "number": "XY 123",
    "origin": {"code": "JFK", "city": "New York", "terminal": "T4", "timeZone": "America/New_York", "timeZoneLabel": "New York time"},
    "destination": {"code": "AMS", "city": "Amsterdam", "terminal": "", "timeZone": "Europe/Amsterdam", "timeZoneLabel": "Amsterdam time"},
    "departure": "2031-10-23T19:30:00-04:00", "arrival": "2031-10-24T08:45:00+02:00"
  }],
  "notes": ["…"], "sourceRefs": ["airline-email"]
}
```

Durations and "+1 day" markers are computed from the absolute instants. Connections must depart after the previous segment arrives. A flight number is not a booking reference; never put PNRs or e-ticket numbers here.

## places[]

Anything a reader may want to find. `name` is required. Give `lat`/`lon` (both or neither) **or** `mapQuery`; `mapUrl` / `embedUrl` override the generated links. `localName` and `address` are what the reader shows a driver. `kind` is free text shown small.

## accommodations[]

`id`, `name` required. `placeId` links to `places[]` for the map. `checkIn` / `checkOut` dates, `status`, `statusLabel`, `note`.

## days[]

One per calendar day. `id`, `date`, `title` required; `subtitle`, `accommodationId`, `events[]`.

Event: `id`, `title` required; `timeLabel` (free text: `"09:00"`, `"Morning"`, `"On arrival"`); `kind` (free text, used by the gap report: `flight`, `free`, `rest`, `note` are not asked for a place); `placeIds[]`; `ticketIds[]`; `notes` (one paragraph); `details[]` (bullet list behind "Details"); `sourceRefs[]`.

## tickets[]

`id`, `title` required. `date`, `where` (where to buy), `guide` (text), `price` as `{"amount": 22.5, "currency": "EUR"}` or `null` when unknown (never `0`), `status`, `optional` (boolean), `placeId`, `localText` (what to show at the counter; has a copy button), `sourceRefs[]`. Readers can mark a ticket as "I have this"; that is a personal note, not a purchase.

## groundTransport.tabs[]

`{ "id", "title", "items": [{ "title", "text", "placeIds": [], "sourceRefs": [] }] }`. Use for rail, bus, ferry, driving, walking — whatever applies. Omit the whole object if there is nothing to say.

## rental (optional)

Only when the trip has one. `vendor`, `vehicle` (keep "or similar" wording), `status`, `pickUp` / `dropOff` as `{ "date", "time", "placeId" }`, `deposit` as a price object, `coverage` (the vendor's own wording), `fuelPolicy`, `notes[]`, `sourceRefs[]`. The rental checklist in `skill/references/coverage-and-rental.md` lists what else to confirm.

## checklist[]

`id`, `text` required; `group` is `todo` or `packing`; `detail` optional. Readers can add, check and delete items; their changes live in their browser only.

## sources[]

`id`, `title` required; `url`, `note`. Every fact you would defend should point here through `sourceRefs`. Use a `demo` source for fictional examples.

## ui.strings (optional)

Deep-merged over the locale pack: `{"nav": {"days": "Itinerary"}}`.

## publishAssets[] (optional)

Extra files under `trip/assets/` to publish even if the data does not reference them.
