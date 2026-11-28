import os
import logging
import urllib.parse
from pathlib import Path
from instagrapi import Client
from instagrapi.exceptions import LoginRequired, ClientError
from storage import SESSION_FILE

log = logging.getLogger("eren_bot")

client = Client()
client.delay_range = [3, 7]

def login_client() -> bool:
    # 1. Purana session delete kar de taaki naya login ho
    if SESSION_FILE.exists():
        try:
            SESSION_FILE.unlink()
            log.info("Deleted old session file.")
        except Exception:
            pass

    # 2. Direct Env Variable se sessionid utha
    sessionid_raw = os.environ.get("IG_SESSION_ID", "")
    
    if not sessionid_raw:
        log.error("IG_SESSION_ID environment variable is missing in Render!")
        return False

    # 3. URL decode kar (%3A ko : banane ke liye)
    sessionid = urllib.parse.unquote(sessionid_raw)
    
    try:
        log.info(f"Found sessionid in ENV (length: {len(sessionid)}), attempting login...")
        client.login_by_sessionid(sessionid)
        client.dump_settings(SESSION_FILE)
        log.info("Logged in via sessionid successfully.")
        return True
    except Exception as e:
        log.error(f"Cookie login failed: {e}")
        return False

def safe_send(thread_id: str, text: str) -> bool:
    try:
        client.direct_send(text, thread_ids=[thread_id])
        log.info(f"Sent to {thread_id}: {text[:60]}")
        return True
    except LoginRequired:
        log.warning("Login required — relogin attempt.")
        if login_client():
            try:
                client.direct_send(text, thread_ids=[thread_id])
                return True
            except Exception as e:
                log.error(f"Retry failed: {e}")
        return False
    except ClientError as e:
        log.error(f"ClientError: {e}")
        return False
    except Exception as e:
        log.error(f"Send failed: {e}")
        return False