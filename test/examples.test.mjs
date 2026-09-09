// Every shipped example must validate, build from a clean directory, and pass the release audit.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT} from '../scripts/lib/paths.mjs';
import {validateTravelData, gapReport} from '../scripts/lib/validate.mjs';
import {audit} from '../scripts/lib/release.mjs';

const examples = fs.readdirSync(path.join(ROOT, 'examples')).filter((d) => fs.existsSync(path.join(ROOT, 'examples', d, 'travel-data.json')));
assert.ok(examples.length >= 3, 'three examples expected');

for (const name of examples) {
  const dir = path.join(ROOT, 'examples', name);
  const data = JSON.parse(fs.readFileSync(path.join(dir, 'travel-data.json'), 'utf8'));
  test(`${name}: validates with no errors and is clearly marked as an example`, () => {
    const {errors} = validateTravelData(data);
    assert.deepEqual(errors, []);
    assert.equal(data.trip.demo, true);
    for (const j of data.flightJourneys || []) { assert.equal(j.status, 'demo'); for (const s of j.segments) assert.match(s.number, /^DEMO/); }
    for (const a of data.accommodations || []) assert.equal(a.status, 'demo');
    for (const t of data.tickets || []) assert.equal(t.status, 'demo');
  });
  test(`${name}: builds and passes the static release audit`, () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'build-'));
    const out = path.join(tmp, 'dist'), manifest = path.join(tmp, 'manifest.json');
    execFileSync(process.execPath, [path.join(ROOT, 'scripts/build.mjs'), '--trip', dir, '--out', out, '--manifest', manifest], {stdio: 'pipe'});
    const r = audit(out, manifest);
    assert.equal(r.status, 'passed', JSON.stringify(r.errors));
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.ok(html.includes(`<title>${data.trip.title}</title>`));
    assert.ok(html.includes(`data-theme="${data.trip.theme}"`));
    assert.ok(r.total_bytes < 400 * 1024, `example build should stay small; got ${r.total_bytes} bytes`);
  });
}

test('the three examples use three different themes and at least two locales', () => {
  const trips = examples.map((n) => JSON.parse(fs.readFileSync(path.join(ROOT, 'examples', n, 'travel-data.json'), 'utf8')).trip);
  assert.equal(new Set(trips.map((t) => t.theme)).size, 3);
  assert.ok(new Set(trips.map((t) => t.locale)).size >= 2);
});

test('gap report on an example with an intentional overnight flight does not nag about a stay', () => {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'examples/europe-rail/travel-data.json'), 'utf8'));
  assert.ok(!gapReport(data).some((g) => g.item === '2031-10-23'));
});
