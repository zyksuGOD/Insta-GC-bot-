import random
import logging
from config import (
    GROUP_IDS,
    GOOD_MORNING_TEXT,
    GOOD_NIGHT_TEXT,
    ELEVEN_TEXT,
)
from ig_client import safe_send
from storage import save_stats, get_today_stats

log = logging.getLogger("eren_bot")


def job_good_morning():
    text = f"{GOOD_MORNING_TEXT} {random.choice(['🌞','☀️','✨','🌸'])}"
    for tid in GROUP_IDS:
        safe_send(tid, text)


def job_good_night():
    text = f"{GOOD_NIGHT_TEXT} {random.choice(['🌙','✨','💫','🥰'])}"
    for tid in GROUP_IDS:
        safe_send(tid, text)


def job_eleven():
    text = f"{ELEVEN_TEXT} {random.choice(['❤️','💖','💗','💓'])}"
    for tid in GROUP_IDS:
        safe_send(tid, text)


def job_member_sync():
    from ig_client import client
    for tid in GROUP_IDS:
        try:
            members = client.direct_thread(tid).users
            s = get_today_stats()
            s["total_members"] = len(members)
            save_stats()
        except Exception as e:
            log.error(f"Member sync {tid} failed: {e}")