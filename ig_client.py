import logging
import urllib.parse
from pathlib import Path
from instagrapi import Client
from instagrapi.exceptions import LoginRequired, ClientError
from storage import SESSION_FILE

log = logging.getLogger("eren_bot")

client = Client()
client.delay_range = [3, 7]

def _extract_netscape_value(cookie_text: str, name: str) -> str:
    for line in cookie_text.splitlines():
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        if len(parts) >= 7 and parts[5] == name:
            val = parts[6]
            return urllib.parse.unquote(val)
    return ""

def login_client(cookie_path: Path = Path("cookies.txt")) -> bool:
    if SESSION_FILE.exists():
        try:
            client.load_settings(SESSION_FILE)
            client.get_timeline_feed()
            log.info("Session restored.")
            return True
        except Exception as e:
            log.warning(f"Session invalid: {e}")

    if not cookie_path.exists():
        log.error("No session and no cookies.txt.")
        return False

    try:
        text = cookie_path.read_text(encoding="utf-8")
        sessionid = _extract_netscape_value(text, "sessionid")
        
        if not sessionid:
            log.error("sessionid missing in cookies.txt. Format is wrong.")
            return False
            
        log.info(f"Found sessionid (length: {len(sessionid)}), attempting login...")
        
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