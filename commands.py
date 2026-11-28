from config import ADMINS
from storage import get_today_stats, today_key
from ig_client import safe_send


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

    admin = username in ADMINS

    if text == "/daily":
        if not admin:
            safe_send(thread_id, "Only admins can use this command.")
            return
        safe_send(thread_id, build_daily_report())
        return

    if text.startswith("/send_gc_"):
        if not admin:
            safe_send(thread_id, "Only admins can use this command.")
            return
        rest = text[len("/send_gc_"):]
        if not rest or " " not in rest:
            safe_send(thread_id, "Format: /send_gc_<thread_id> <message>")
            return
        target, message = rest.split(" ", 1)
        ok = safe_send(target, message)
        safe_send(thread_id, "Sent." if ok else "Failed.")