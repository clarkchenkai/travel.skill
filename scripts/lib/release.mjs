// Read-only static audit of a built site against its hash manifest. Ported from the original Python audit.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const FORBIDDEN_PARTS = new Set(['.git', '.ssh', '.codex', '.claude', '.agents', 'node_modules', '__pycache__', 'private', 'input', 'trip-private']);
const TEXT_SUFFIXES = new Set(['.json', '.html', '.js', '.mjs', '.css', '.txt', '.md', '.map', '.xml', '.svg']);
const SENSITIVE_KEYS = new Set(['privatedata', 'passportnumber', 'passportno', 'idcardnumber', 'bookingpin', 'pnr', 'eticketnumber', 'apikey', 'accesstoken', 'refreshtoken', 'password', 'secretkey', 'cardnumber']);
const KEY_MARKER = /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;
export const NOT_CHECKED = [
  'Free-text or image privacy, source rights and intended audience',
  'Travel facts, website interactions, visual quality and accessibility',
  'Production deployment, target-region connectivity and real device access',
];

export function audit(rootDir, manifestPath) {
  const root = path.resolve(rootDir);
  const errors = [];
  const result = {status: 'failed', declared_files: 0, checked_files: 0, total_bytes: 0, errors, not_checked: NOT_CHECKED};
  const fail = (code, p, detail) => errors.push({code, path: p, detail});
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) { fail('root', root, 'Public directory does not exist.'); return result; }
  let manifest;
  try {
    if (path.resolve(manifestPath).startsWith(root + path.sep)) { fail('manifest_location', path.basename(manifestPath), 'Keep the hash manifest outside the public directory.'); return result; }
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) { fail('manifest', path.basename(manifestPath), e.constructor.name); return result; }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest) || !Object.keys(manifest).length) { fail('manifest_shape', path.basename(manifestPath), 'Expected a nonempty relative-path to SHA-256 object.'); return result; }
  result.declared_files = Object.keys(manifest).length;
  const declared = new Set();
  const inspect = (value, location, file) => {
    if (Array.isArray(value)) { value.forEach((v, i) => inspect(v, `${location}[${i}]`, file)); return; }
    if (value && typeof value === 'object') {
      if (value.privacy === 'private' || value.privacy === 'restricted') fail('private_record', file, location + '.privacy');
      for (const [k, v] of Object.entries(value)) {
        const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (SENSITIVE_KEYS.has(norm) && v !== null && v !== '' && !(Array.isArray(v) && !v.length) && !(typeof v === 'object' && v && !Object.keys(v).length)) fail('sensitive_field', file, `${location}.${k}`);
        inspect(v, `${location}.${k}`, file);
      }
    }
  };
  for (const [rawName, expected] of Object.entries(manifest)) {
    const parts = rawName.split('/');
    if (!rawName || rawName.includes('\\') || path.posix.isAbsolute(rawName) || parts.includes('..') || parts.includes('') || parts.includes('.') || path.posix.normalize(rawName) !== rawName) { fail('path', rawName, 'Noncanonical or unsafe relative path.'); continue; }
    declared.add(rawName);
    if (parts.some((p) => FORBIDDEN_PARTS.has(p) || p.startsWith('.env'))) fail('forbidden_file', rawName, 'Private/source/runtime material in release.');
    const ext = path.posix.extname(rawName).toLowerCase();
    if (['.pem', '.key', '.p12', '.pfx'].includes(ext)) fail('credential_file', rawName, 'Review credential-like files before publishing.');
    if (typeof expected !== 'string' || !/^[0-9a-f]{64}$/.test(expected)) { fail('hash_format', rawName, 'Expected 64 lowercase hexadecimal characters.'); continue; }
    const target = path.join(root, ...parts);
    let content;
    try {
      let real;
      try { real = fs.realpathSync(target); } catch { fail('missing_file', rawName, 'Declared file does not exist.'); continue; }
      if (!real.startsWith(fs.realpathSync(root) + path.sep)) { fail('path_escape', rawName, 'Resolved file is outside the public directory.'); continue; }
      if (!fs.statSync(target).isFile()) { fail('missing_file', rawName, 'Declared file does not exist.'); continue; }
      content = fs.readFileSync(target);
    } catch (e) { fail('read_error', rawName, e.code || e.constructor.name); continue; }
    result.checked_files++;
    result.total_bytes += content.length;
    if (crypto.createHash('sha256').update(content).digest('hex') !== expected) fail('hash_mismatch', rawName, 'File differs from the declared build.');
    if (TEXT_SUFFIXES.has(ext)) {
      const text = content.toString('utf8');
      if (KEY_MARKER.test(text)) fail('secret_marker', rawName, 'Possible API secret; value intentionally not printed.');
      if (/\/Users\/[A-Za-z0-9._-]+\/|[A-Z]:\\Users\\/.test(text)) fail('local_path', rawName, 'Contains a local machine path.');
      if (ext === '.json') { try { inspect(JSON.parse(text), '$', rawName); } catch { fail('invalid_json', rawName, 'JSON file cannot be decoded.'); } }
    }
  }
  const actual = new Set();
  const scan = (dir) => { for (const entry of fs.readdirSync(dir, {withFileTypes: true})) { const full = path.join(dir, entry.name); if (entry.isDirectory()) scan(full); else actual.add(path.relative(root, full).split(path.sep).join('/')); } };
  try { scan(root); } catch (e) { fail('directory_scan', '.', e.code || e.constructor.name); }
  for (const extra of [...actual].filter((f) => !declared.has(f)).sort()) fail('undeclared_file', extra, 'File is not in the explicit release manifest.');
  result.status = errors.length ? 'failed' : 'passed';
  return result;
}
