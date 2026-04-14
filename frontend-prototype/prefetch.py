'''
Usage:
    uv run prefetch.py
    uv run prefetch.py --year 2026 --rounds 1 2 3
'''

import requests
import json
import pathlib
import argparse
import sys

API_URL = "http://localhost:8080"
DATA_DIR = pathlib.Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

ENDPOINTS = ["speed", "tyres", "quali", "laptimes", "positions", "gaps", "race_summary", "sector_times"]

TIMEOUTS = {
    "speed": 120,
    "tyres": 60,
    "quali": 90,
    "laptimes": 90,
    "positions": 90,
    "gaps": 90,
    "race_summary": 90,
    "sector_times": 90,
}


def fetch_and_save(year: int, round_num: int, endpoint: str) -> bool:
    path = DATA_DIR / f"{year}_{round_num}_{endpoint}.json"
    if path.exists():
        print(f"  [skip] {path.name} already exists")
        return True

    url = f"{API_URL}/api/telemetry/{year}/{round_num}/{endpoint}"
    print(f"  [fetch] {url} ...", end=" ", flush=True)
    try:
        res = requests.get(url, timeout=TIMEOUTS.get(endpoint, 60))
        if res.status_code == 200:
            data = res.json()
            path.write_text(json.dumps(data))
            print(f"OK ({len(path.read_bytes()) // 1024}KB)")
            return True
        else:
            print(f"FAILED (HTTP {res.status_code})")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False


def fetch_schedule() -> list:
    path = DATA_DIR / "schedule.json"
    print(f"[schedule] fetching ...", end=" ", flush=True)
    try:
        res = requests.get(f"{API_URL}/api/schedule", timeout=15)
        if res.status_code == 200:
            data = res.json()
            path.write_text(json.dumps(data))
            print(f"OK ({len(data)} races)")
            return data
        print(f"FAILED (HTTP {res.status_code})")
        return []
    except Exception as e:
        print(f"ERROR: {e}")
        return []


def get_completed_rounds(schedule: list) -> list[int]:
    return [r["round_number"] for r in schedule if r.get("is_completed")]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--rounds", type=int, nargs="*", help="Specific round numbers (default: all completed)")
    args = parser.parse_args()

    # Check backend is up
    try:
        requests.get(f"{API_URL}/", timeout=3)
    except Exception:
        print(f"ERROR: Backend not running at {API_URL}. Start it first.")
        sys.exit(1)

    schedule = fetch_schedule()
    if not schedule:
        print("Could not fetch schedule. Aborting.")
        sys.exit(1)

    rounds = args.rounds or get_completed_rounds(schedule)
    if not rounds:
        print("No completed rounds found. Nothing to prefetch.")
        sys.exit(0)

    print(f"\nPrefetching {len(rounds)} round(s): {rounds}\n")
    total, failed = 0, 0
    for round_num in rounds:
        print(f"Round {round_num}:")
        for endpoint in ENDPOINTS:
            total += 1
            ok = fetch_and_save(args.year, round_num, endpoint)
            if not ok:
                failed += 1

    print(f"\nDone. {total - failed}/{total} files saved to {DATA_DIR}")


if __name__ == "__main__":
    main()
