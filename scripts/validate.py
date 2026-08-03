#!/usr/bin/env python3
"""Run dependency-free checks on the JSON files in this repository."""

import json
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema" / "merchant-context.schema.json"
EXAMPLE_PATHS = sorted((ROOT / "examples").glob("*.json"))


def load(path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def require_https(value, label):
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.netloc:
        raise ValueError(f"{label} must be an absolute HTTPS URL")


def validate_example(data, path):
    required = {"version", "merchant", "offers", "policies", "actions", "provenance"}
    missing = required - data.keys()
    if missing:
        raise ValueError(f"{path}: missing {sorted(missing)}")
    if data["version"] != "0.1":
        raise ValueError(f"{path}: unsupported version")
    require_https(data["merchant"]["canonical_url"], "merchant.canonical_url")
    if not data["offers"]:
        raise ValueError(f"{path}: at least one offer is required")
    for index, offer in enumerate(data["offers"]):
        for field in ("id", "name", "description", "canonical_url", "availability", "updated_at"):
            if not offer.get(field):
                raise ValueError(f"{path}: offers[{index}].{field} is required")
        require_https(offer["canonical_url"], f"offers[{index}].canonical_url")
    for index, action in enumerate(data["actions"]):
        require_https(action["url"], f"actions[{index}].url")
        if not isinstance(action.get("human_confirmation_required"), bool):
            raise ValueError(f"{path}: actions[{index}] must state human confirmation")
    for index, source_url in enumerate(data["provenance"]["source_urls"]):
        require_https(source_url, f"provenance.source_urls[{index}]")


def main():
    load(SCHEMA_PATH)
    for path in EXAMPLE_PATHS:
        validate_example(load(path), path)
    print(f"Validated schema and {len(EXAMPLE_PATHS)} example file(s).")


if __name__ == "__main__":
    main()
