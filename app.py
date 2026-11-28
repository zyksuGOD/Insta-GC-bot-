import os
import logging
import threading
from datetime import datetime
from flask import Flask
from config import BOT_USERNAME, TIMEZONE
from ig_client import login_client
from scheduler import start_scheduler
from poller import poll_direct_messages

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("eren_bot")

app = Flask(__name__)
_scheduler = None
_bot_started = False

@app.route("/")
def index():
    return {"status": "ok", "bot": BOT_USERNAME}

@app.route("/health")
def health():
    return {"ok": True, "time": datetime.now(TIMEZONE).isoformat()}

def bootstrap():
    global _scheduler, _bot_started
    if _bot_started:
        return
    _bot_started = True
    
    log.info("Starting bot bootstrap...")
    if not login_client():
        log.error("Initial login failed — bot idle.")
        return
    log.info("Login successful. Starting scheduler...")
    _scheduler = start_scheduler()
    threading.Thread(target=poll_direct_messages, daemon=True).start()

# Ye gunicorn ke liye zaroori hai
bootstrap()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)