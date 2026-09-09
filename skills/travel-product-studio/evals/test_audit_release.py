import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "audit_release.py"
spec = importlib.util.spec_from_file_location("release_audit", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ReleaseAuditTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name)
        self.root = self.base / "public"
        self.root.mkdir()
        self.manifest = self.base / "manifest.json"

    def tearDown(self):
        self.temp.cleanup()

    def write(self, files):
        hashes = {}
        for name, data in files.items():
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            content = data.encode() if isinstance(data, str) else data
            path.write_bytes(content)
            hashes[name] = hashlib.sha256(content).hexdigest()
        self.manifest.write_text(json.dumps(hashes))
        return hashes

    def report(self):
        return module.audit(self.root, self.manifest)

    def codes(self):
        return {x["code"] for x in self.report()["errors"]}

    def test_valid_artifact_preserves_public_addresses(self):
        self.write({"index.html": "<h1>示例</h1>", "data.json": json.dumps({"places": [{"name": "Public hotel", "address": "Public address", "phone": "+00 123"}]})})
        result = self.report()
        self.assertEqual(result["status"], "passed")
        self.assertTrue(result["not_checked"])

    def test_changed_build_is_detected(self):
        self.write({"index.html": "one"})
        (self.root / "index.html").write_text("two")
        self.assertIn("hash_mismatch", self.codes())

    def test_extra_raw_file_is_detected(self):
        self.write({"index.html": "ok"})
        (self.root / "order.pdf").write_bytes(b"raw order")
        self.assertIn("undeclared_file", self.codes())

    def test_missing_file_is_detected(self):
        self.write({"index.html": "ok"})
        (self.root / "index.html").unlink()
        self.assertIn("missing_file", self.codes())

    def test_traversal_is_rejected(self):
        self.manifest.write_text(json.dumps({"../secret.txt": "0" * 64}))
        self.assertIn("path", self.codes())

    def test_symlink_escape_is_rejected(self):
        outside = self.base / "outside.txt"
        outside.write_text("not public")
        (self.root / "escape.txt").symlink_to(outside)
        self.manifest.write_text(json.dumps({"escape.txt": hashlib.sha256(outside.read_bytes()).hexdigest()}))
        self.assertIn("path_escape", self.codes())

    def test_declared_environment_file_is_rejected(self):
        self.write({".env.production": "not a publishable file"})
        self.assertIn("forbidden_file", self.codes())

    def test_nested_private_and_credential_fields_are_detected(self):
        self.write({"data.json": json.dumps({"items": [{"privacy": "restricted"}, {"booking_pin": "dummy-fixture"}]})})
        self.assertTrue({"private_record", "sensitive_field"} <= self.codes())

    def test_secret_values_are_not_echoed(self):
        secret = "sk-" + "x" * 24
        self.write({"app.js": "const key='" + secret + "';"})
        result = self.report()
        self.assertIn("secret_marker", {x["code"] for x in result["errors"]})
        self.assertNotIn(secret, json.dumps(result))

    def test_invalid_json_and_hash_format(self):
        hashes = self.write({"data.json": "{"})
        self.assertIn("invalid_json", self.codes())
        hashes["data.json"] = "not-a-sha"
        self.manifest.write_text(json.dumps(hashes))
        self.assertIn("hash_format", self.codes())

    def test_empty_manifest_fails(self):
        self.manifest.write_text("{}")
        self.assertIn("manifest_shape", self.codes())

    def test_manifest_in_public_fails(self):
        self.write({"index.html": "ok"})
        public_manifest = self.root / "manifest.json"
        public_manifest.write_text(self.manifest.read_text())
        result = module.audit(self.root, public_manifest)
        self.assertIn("manifest_location", {x["code"] for x in result["errors"]})


if __name__ == "__main__":
    unittest.main()
