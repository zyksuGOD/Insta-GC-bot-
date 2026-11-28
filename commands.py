from config import ADMINS
from storage import get_today_stats, today_key
from ig_client import safe_send
import logging

log = logging.getLogger("eren_bot")

def build_daily_report() -> str:
    s = get_today_stats()
    lines = [
        f"📊 DAILY REPORT — {today_key()}",
        f"Welcome messages: {s.get('welcome_sent', 0)}",
        f"Messages seen: {s.get('messages_seen', 0)}",
        f"Active users: {len(s.get('active_users', []))}",
        f"Total members: {s.get('total_members', 0)}",
        f"Members added: {s.get('members_added', 0)}",
        f"Members removed: {s.get('members_removed', 0)}",
    ]
    return "\n".join(lines)

def handle_commands(thread_id: str, username: str, text: str):
    text = (text or "").strip()
    if not text.startswith("/"):
        return

    log.info(f"Command received from @{username}: {text}")
    
    admin = username in ADMINS
    if not admin:
        log.warning(f"@{username} is not in ADMINS list!")
        return

    if text == "/daily":
        safe_send(thread_id, build_daily_report())
        return

    if text.startswith("/send_gc_"):
        rest = text[len("/send_gc_"):]
        if not rest or " " not in rest:
            safe_send(thread_id, "Format: /send_gc_<thread_id> <message>")
            return
        target, message = rest.split(" ", 1)
        ok = safe_send(target, message)
        safe_send(thread_id, "Sent." if ok else "Failed.")