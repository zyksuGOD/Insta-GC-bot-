import random
from datetime import datetime, timedelta
from config import (
    WELCOME_TEMPLATES,
    EMOJIS,
    WELCOME_COOLDOWN_HOURS,
    TIMEZONE,
)
from storage import cooldowns, save_cooldowns, bump_stat
from ig_client import safe_send


def is_on_cooldown(thread_id: str, user_id: str) -> bool:
    ts = cooldowns.get(thread_id, {}).get(user_id)
    if not ts:
        return False
    try:
        last = datetime.fromisoformat(ts)
    except Exception:
        return False
    return datetime.now(TIMEZONE) - last < timedelta(hours=WELCOME_COOLDOWN_HOURS)


def mark_welcomed(thread_id: str, user_id: str):
    cooldowns.setdefault(thread_id, {})[user_id] = datetime.now(TIMEZONE).isoformat()
    save_cooldowns()


def build_welcome_text(username: str) -> str:
    template = random.choice(WELCOME_TEMPLATES)
    count = random.choice([1, 2])
    emojis = "".join(random.sample(EMOJIS, count))
    body = template.format(user=username)
    return f"{body} {emojis}"


def send_welcome(thread_id: str, user_id: str, username: str):
    if is_on_cooldown(thread_id, user_id):
        return
    text = build_welcome_text(username)
    if safe_send(thread_id, text):
        mark_welcomed(thread_id, user_id)
        bump_stat("welcome_sent")