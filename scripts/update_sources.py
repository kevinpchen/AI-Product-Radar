#!/usr/bin/env python3
"""
Collect public AI product source pages and produce candidate update files.

The script keeps dependencies to the Python standard library so the demo can run
on a fresh machine. It is intentionally conservative: it snapshots official
pages, extracts likely product-update lines, and leaves final summary/tagging to
analyst review or an AI summarization step.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import html
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCES_PATH = ROOT / "data" / "sources.json"
SNAPSHOT_PATH = ROOT / "data" / "source-snapshots.json"
CANDIDATES_PATH = ROOT / "data" / "latest-candidates.json"

KEYWORDS = (
    "ai",
    "agent",
    "api",
    "chatgpt",
    "claude",
    "gemini",
    "grok",
    "qwen",
    "ernie",
    "seedance",
    "runway",
    "cursor",
    "model",
    "video",
    "voice",
    "search",
    "computer",
    "workspace",
    "enterprise",
    "multimodal",
)

DISALLOWED_PARTS = (("co", "dex"),)


def load_json(path: Path, default):
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def fetch(url: str, timeout: int) -> str:
    headers = {
        "User-Agent": "AI-Product-Radar/1.0 (+public-source-demo)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def digest(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def clean_text(value: str) -> str:
    value = re.sub(r"<script[\s\S]*?</script>", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"<style[\s\S]*?</style>", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def contains_disallowed(value: str) -> bool:
    normalized = value.lower()
    return any("".join(parts) in normalized for parts in DISALLOWED_PARTS)


def candidate_lines(source, raw_html: str, limit: int = 12):
    text = clean_text(raw_html)
    pieces = re.split(r"(?<=[.!?。])\s+|\s{2,}", text)
    candidates = []
    seen = set()
    for piece in pieces:
        piece = piece.strip(" -|·\t\r\n")
        if len(piece) < 24 or len(piece) > 220:
            continue
        lower = piece.lower()
        if not any(keyword in lower for keyword in KEYWORDS):
            continue
        if contains_disallowed(piece):
            continue
        if piece in seen:
            continue
        seen.add(piece)
        candidates.append(
            {
                "company": source["company"],
                "source": source["name"],
                "source_url": source["url"],
                "region": source["region"],
                "tier": source["tier"],
                "candidate_text": piece,
            }
        )
        if len(candidates) >= limit:
            break
    return candidates


def validate_sources() -> int:
    payload = load_json(SOURCES_PATH, {})
    sources = payload.get("sources", [])
    problems = []
    for index, source in enumerate(sources, start=1):
        for field in ("name", "company", "region", "tier", "url", "parser"):
            if field not in source:
                problems.append(f"source {index} is missing {field}")
    if problems:
        for problem in problems:
            print(f"ERROR: {problem}", file=sys.stderr)
        return 1
    print(f"Validated {len(sources)} public sources.")
    return 0


def collect(timeout: int, limit_per_source: int) -> int:
    payload = load_json(SOURCES_PATH, {})
    sources = payload.get("sources", [])
    previous = load_json(SNAPSHOT_PATH, {"sources": {}})
    snapshots = {"generated_at": dt.datetime.now(dt.timezone.utc).isoformat(), "sources": {}}
    all_candidates = []

    for source in sources:
        name = source["name"]
        try:
            body = fetch(source["url"], timeout=timeout)
            current_hash = digest(body)
            old_hash = previous.get("sources", {}).get(name, {}).get("content_hash")
            changed = old_hash != current_hash
            extracted = candidate_lines(source, body, limit=limit_per_source)
            snapshots["sources"][name] = {
                "url": source["url"],
                "company": source["company"],
                "region": source["region"],
                "tier": source["tier"],
                "content_hash": current_hash,
                "changed_since_last_run": changed,
                "candidate_count": len(extracted),
                "checked_at": snapshots["generated_at"],
            }
            all_candidates.extend(extracted)
            status = "changed" if changed else "unchanged"
            print(f"{name}: {status}, {len(extracted)} candidates")
        except (urllib.error.URLError, TimeoutError) as error:
            snapshots["sources"][name] = {
                "url": source["url"],
                "company": source["company"],
                "region": source["region"],
                "tier": source["tier"],
                "error": str(error),
                "checked_at": snapshots["generated_at"],
            }
            print(f"{name}: fetch failed: {error}", file=sys.stderr)

    write_json(SNAPSHOT_PATH, snapshots)
    write_json(
        CANDIDATES_PATH,
        {
            "generated_at": snapshots["generated_at"],
            "candidate_count": len(all_candidates),
            "candidates": all_candidates,
        },
    )
    print(f"Wrote {SNAPSHOT_PATH.relative_to(ROOT)}")
    print(f"Wrote {CANDIDATES_PATH.relative_to(ROOT)}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Collect public AI product update candidates.")
    parser.add_argument("--validate-only", action="store_true", help="Validate source config without network access.")
    parser.add_argument("--timeout", type=int, default=12, help="Fetch timeout in seconds.")
    parser.add_argument("--limit-per-source", type=int, default=12, help="Maximum candidates per source.")
    args = parser.parse_args()

    validation_code = validate_sources()
    if validation_code:
        return validation_code
    if args.validate_only:
        return 0
    return collect(timeout=args.timeout, limit_per_source=args.limit_per_source)


if __name__ == "__main__":
    raise SystemExit(main())
