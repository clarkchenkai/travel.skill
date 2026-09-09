#!/usr/bin/env python3
"""Read-only audit of a static travel site's declared release artifact."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path, PurePosixPath

FORBIDDEN_PARTS = {".git", ".ssh", ".codex", ".claude", ".agents", "node_modules", "__pycache__", "private", "资料"}
TEXT_SUFFIXES = {".json", ".html", ".js", ".mjs", ".css", ".txt", ".md", ".map", ".xml"}
SENSITIVE_KEYS = {
    "privatedata", "passportnumber", "passportno", "idcardnumber",
    "bookingpin", "pnr", "eticketnumber", "apikey", "accesstoken",
    "refreshtoken", "password", "secretkey", "cardnumber",
}
KEY_MARKER = re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b")
NOT_CHECKED = [
    "Free-text or image privacy, source rights and intended audience",
    "Travel facts, website interactions, visual quality and accessibility",
    "Production deployment, target-region connectivity and real WeChat/device access",
]


def audit(root: Path, manifest_path: Path) -> dict:
    root = root.resolve()
    errors: list[dict[str, str]] = []
    result = {
        "status": "failed", "declared_files": 0, "checked_files": 0,
        "total_bytes": 0, "errors": errors, "not_checked": NOT_CHECKED,
    }

    def fail(code: str, path: str, detail: str) -> None:
        errors.append({"code": code, "path": path, "detail": detail})

    if not root.is_dir():
        fail("root", str(root), "Public directory does not exist.")
        return result
    try:
        if manifest_path.resolve().is_relative_to(root):
            fail("manifest_location", manifest_path.name, "Keep the hash manifest outside the public directory.")
            return result
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        fail("manifest", manifest_path.name, type(exc).__name__)
        return result
    if not isinstance(manifest, dict) or not manifest:
        fail("manifest_shape", manifest_path.name, "Expected a nonempty relative-path to SHA-256 object.")
        return result

    result["declared_files"] = len(manifest)
    declared: set[str] = set()

    def inspect_json(value, location: str, file_name: str) -> None:
        if isinstance(value, dict):
            if value.get("privacy") in ("private", "restricted"):
                fail("private_record", file_name, location + ".privacy")
            for key, child in value.items():
                normalized = re.sub(r"[^a-z0-9]", "", str(key).lower())
                if normalized in SENSITIVE_KEYS and child not in (None, "", [], {}):
                    fail("sensitive_field", file_name, location + "." + str(key))
                inspect_json(child, location + "." + str(key), file_name)
        elif isinstance(value, list):
            for index, child in enumerate(value):
                inspect_json(child, location + "[" + str(index) + "]", file_name)

    for raw_name, expected in manifest.items():
        if not isinstance(raw_name, str):
            fail("path", "<non-string>", "Manifest keys must be paths.")
            continue
        path = PurePosixPath(raw_name)
        if (not raw_name or "\\" in raw_name or path.is_absolute()
                or ".." in path.parts or str(path) != raw_name or raw_name == "."):
            fail("path", raw_name, "Noncanonical or unsafe relative path.")
            continue
        declared.add(raw_name)
        if any(part in FORBIDDEN_PARTS or part.startswith(".env") for part in path.parts):
            fail("forbidden_file", raw_name, "Private/source/runtime material in release.")
        if path.suffix.lower() in {".pem", ".key", ".p12", ".pfx"}:
            fail("credential_file", raw_name, "Review credential-like files before publishing.")
        if not isinstance(expected, str) or not re.fullmatch(r"[0-9a-f]{64}", expected):
            fail("hash_format", raw_name, "Expected 64 lowercase hexadecimal characters.")
            continue
        target = root.joinpath(*path.parts)
        try:
            if not target.resolve().is_relative_to(root):
                fail("path_escape", raw_name, "Resolved file is outside the public directory.")
                continue
            if not target.is_file():
                fail("missing_file", raw_name, "Declared file does not exist.")
                continue
            content = target.read_bytes()
        except OSError as exc:
            fail("read_error", raw_name, type(exc).__name__)
            continue
        result["checked_files"] += 1
        result["total_bytes"] += len(content)
        if hashlib.sha256(content).hexdigest() != expected:
            fail("hash_mismatch", raw_name, "File differs from the declared build.")
        if path.suffix.lower() in TEXT_SUFFIXES:
            text = content.decode("utf-8", errors="replace")
            if KEY_MARKER.search(text):
                fail("secret_marker", raw_name, "Possible API secret; value intentionally not printed.")
            if path.suffix.lower() == ".json":
                try:
                    inspect_json(json.loads(text), "$", raw_name)
                except ValueError:
                    fail("invalid_json", raw_name, "JSON file cannot be decoded.")
    try:
        actual = {p.relative_to(root).as_posix() for p in root.rglob("*") if p.is_file() or p.is_symlink()}
        for extra in sorted(actual - declared):
            fail("undeclared_file", extra, "File is not in the explicit release manifest.")
    except OSError as exc:
        fail("directory_scan", ".", type(exc).__name__)
    result["status"] = "passed" if not errors else "failed"
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path, help="Generated public directory, read only")
    parser.add_argument("--manifest", required=True, type=Path, help="External JSON path-to-SHA-256 map")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable report")
    args = parser.parse_args()
    result = audit(args.root, args.manifest)
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("Release static audit:", result["status"].upper())
        print("Files:", result["checked_files"], "/", result["declared_files"], "| bytes:", result["total_bytes"])
        for error in result["errors"]:
            print("-", error["code"] + ":", error["path"], "|", error["detail"])
        print("Not checked:")
        for item in result["not_checked"]:
            print("-", item)
    return 0 if result["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
