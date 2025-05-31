#!/usr/bin/env python3
"""
Generate SHA-256 manifest for a batch.
"""

import pathlib
import hashlib
import json
import time

# Adjust as needed:
BATCH = "batch01"
SCHEMA_VERSION = 1

# Project root is one level above this script’s parent
root = pathlib.Path(__file__).resolve().parent.parent
dist = root / "dist"

files = []
for p in dist.rglob("*"):
    if not p.is_file():
        continue

    # Read file bytes and compute SHA-256
    data = p.read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    size = p.stat().st_size

    # Relative path, forced to use forward slashes:
    rel = p.relative_to(dist).as_posix()

    files.append({
        "path": rel,
        "bytes": size,
        "sha256": sha
    })

manifest = {
    "schema_version": SCHEMA_VERSION,
    "batch": int(BATCH[-2:]),
    "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "files": files
}

# Output manifest into CSV folder for this batch
out_dir = dist / "csv" / BATCH
out_dir.mkdir(parents=True, exist_ok=True)
out_file = out_dir / f"manifest_{BATCH}_v1.json"

with open(out_file, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"Manifest written → {out_file}")
