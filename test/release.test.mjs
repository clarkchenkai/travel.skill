import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {audit} from '../scripts/lib/release.mjs';

function fixture(files) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'release-'));
  const root = path.join(base, 'public'); fs.mkdirSync(root);
  const hashes = {};
  for (const [name, data] of Object.entries(files)) {
    const file = path.join(root, name); fs.mkdirSync(path.dirname(file), {recursive: true});
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    fs.writeFileSync(file, buf); hashes[name] = crypto.createHash('sha256').update(buf).digest('hex');
  }
  const manifest = path.join(base, 'manifest.json');
  fs.writeFileSync(manifest, JSON.stringify(hashes));
  return {base, root, manifest, hashes, codes: () => new Set(audit(root, manifest).errors.map((e) => e.code))};
}

test('valid artifact passes and keeps public addresses', () => {
  const f = fixture({'index.html': '<h1>hi</h1>', 'data.json': JSON.stringify({places: [{name: 'Hotel', address: 'Public street', phone: '+00 123'}]})});
  const r = audit(f.root, f.manifest);
  assert.equal(r.status, 'passed'); assert.ok(r.not_checked.length);
});
test('changed build is detected', () => { const f = fixture({'index.html': 'one'}); fs.writeFileSync(path.join(f.root, 'index.html'), 'two'); assert.ok(f.codes().has('hash_mismatch')); });
test('extra raw file is detected', () => { const f = fixture({'index.html': 'ok'}); fs.writeFileSync(path.join(f.root, 'order.pdf'), 'raw'); assert.ok(f.codes().has('undeclared_file')); });
test('missing file is detected', () => { const f = fixture({'index.html': 'ok'}); fs.unlinkSync(path.join(f.root, 'index.html')); assert.ok(f.codes().has('missing_file')); });
test('traversal is rejected', () => { const f = fixture({'index.html': 'ok'}); fs.writeFileSync(f.manifest, JSON.stringify({'../secret.txt': '0'.repeat(64)})); assert.ok(f.codes().has('path')); });
test('symlink escape is rejected', () => {
  const f = fixture({'index.html': 'ok'});
  const outside = path.join(f.base, 'outside.txt'); fs.writeFileSync(outside, 'not public');
  fs.symlinkSync(outside, path.join(f.root, 'escape.txt'));
  fs.writeFileSync(f.manifest, JSON.stringify({'index.html': f.hashes['index.html'], 'escape.txt': crypto.createHash('sha256').update('not public').digest('hex')}));
  assert.ok(f.codes().has('path_escape'));
});
test('env files and credential files are flagged', () => { const f = fixture({'.env.production': 'x', 'server.pem': 'x'}); const c = f.codes(); assert.ok(c.has('forbidden_file')); assert.ok(c.has('credential_file')); });
test('nested private and credential fields are detected', () => { const f = fixture({'data.json': JSON.stringify({items: [{privacy: 'restricted'}, {booking_pin: 'dummy'}]})}); const c = f.codes(); assert.ok(c.has('private_record')); assert.ok(c.has('sensitive_field')); });
test('secret values are not echoed', () => {
  const secret = 'sk-' + 'x'.repeat(24);
  const f = fixture({'app.js': `const key='${secret}';`});
  const r = audit(f.root, f.manifest);
  assert.ok(r.errors.some((e) => e.code === 'secret_marker')); assert.ok(!JSON.stringify(r).includes(secret));
});
test('local machine paths are flagged', () => { const f = fixture({'app.js': 'fetch("/Users/someone/private.json")'}); assert.ok(f.codes().has('local_path')); });
test('invalid json and hash format', () => {
  const f = fixture({'data.json': '{'}); assert.ok(f.codes().has('invalid_json'));
  fs.writeFileSync(f.manifest, JSON.stringify({'data.json': 'not-a-sha'})); assert.ok(f.codes().has('hash_format'));
});
test('empty manifest and manifest inside public fail', () => {
  const f = fixture({'index.html': 'ok'});
  fs.writeFileSync(f.manifest, '{}'); assert.ok(f.codes().has('manifest_shape'));
  const inside = path.join(f.root, 'manifest.json'); fs.writeFileSync(inside, JSON.stringify(f.hashes));
  assert.ok(new Set(audit(f.root, inside).errors.map((e) => e.code)).has('manifest_location'));
});
