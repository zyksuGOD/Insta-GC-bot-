import json
from pathlib import Path
from datetime import datetime
from config import TIMEZONE

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

COOLDOWN_FILE = DATA_DIR / "cooldowns.json"
STATS_FILE = DATA_DIR / "stats.json"
SESSION_FILE = DATA_DIR / "session.json"
LAST_SEEN_FILE = DATA_DIR / "last_seen.json"


def _load_json(path: Path, default):
    if not path.exists():
        return default
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def _save_json(path: Path, data):
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    tmp.replace(path)


cooldowns = _load_json(COOLDOWN_FILE, {})
stats = _load_json(STATS_FILE, {})
last_seen = _load_json(LAST_SEEN_FILE, {})


def today_key() -> str:
    return datetime.now(TIMEZONE).strftime("%Y-%m-%d")


def get_today_stats() -> dict:
    key = today_key()
    if key not in stats:
        stats[key] = {
            "welcome_sent": 0,
            "messages_seen": 0,
            "active_users": [],
            "total_members": 0,
            "members_added": 0,
            "members_removed": 0,
        }
    return stats[key]


def bump_stat(field: str, amount: int = 1):
    s = get_today_stats()
    s[field] = s.get(field, 0) + amount
    _save_json(STATS_FILE, stats)


def track_active_user(user_id: str):
    s = get_today_stats()
    if user_id not in s["active_users"]:
        s["active_users"].append(user_id)
        _save_json(STATS_FILE, stats)


def save_cooldowns():
    _save_json(COOLDOWN_FILE, cooldowns)


def save_last_seen():
    _save_json(LAST_SEEN_FILE, last_seen)


def save_stats():
    _save_json(STATS_FILE, stats)