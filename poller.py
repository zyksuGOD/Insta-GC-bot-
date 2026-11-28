import logging
from config import GROUP_IDS
from storage import (
    last_seen,
    save_last_seen,
    bump_stat,
    track_active_user,
)
from ig_client import client, login_client
from welcome import send_welcome
from commands import handle_commands

log = logging.getLogger("eren_bot")


def poll_direct_messages():
    log.info("Polling DMs...")
    try:
        threads = client.direct_threads(amount=20)
    except Exception as e:
        log.warning(f"Poll failed, relogin: {e}")
        if not login_client():
            return
        try:
            threads = client.direct_threads(amount=20)
        except Exception as e2:
            log.error(f"Poll retry failed: {e2}")
            return

    for thread in threads:
        thread_id = str(thread.id)
        
        # DEBUG: Print all thread IDs so we can find the real one
        log.info(f"Scanning thread: {thread_id}")

        if thread_id not in GROUP_IDS:
            continue

        try:
            messages = client.direct_messages(thread_id, amount=10)
        except Exception as e:
            log.error(f"Fetch {thread_id} failed: {e}")
            continue

        marker = last_seen.get(thread_id, 0)

        for msg in reversed(messages):
            if msg.user_id == client.user_id:
                continue
            if msg.timestamp and int(msg.timestamp.timestamp()) <= marker:
                continue

            user_id = str(msg.user_id)
            username = ""
            try:
                username = msg.user.username or ""
            except Exception:
                pass
            if not username:
                try:
                    username = client.user_info(user_id).username
                except Exception:
                    username = "user"

            bump_stat("messages_seen")
            track_active_user(user_id)

            handle_commands(thread_id, username, msg.text or "")
            send_welcome(thread_id, user_id, username)

        if messages:
            newest = max(
                (int(m.timestamp.timestamp()) for m in messages if m.timestamp),
                default=marker,
            )
            last_seen[thread_id] = newest
            save_last_seen()