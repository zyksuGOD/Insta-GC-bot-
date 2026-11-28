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


@app.route("/")
def index():
    return {"status": "ok", "bot": BOT_USERNAME}


@app.route("/health")
def health():
    return {"ok": True, "time": datetime.now(TIMEZONE).isoformat()}


def bootstrap():
    global _scheduler
    if not login_client():
        log.error("Initial login failed — bot idle.")
        return
    _scheduler = start_scheduler()
    threading.Thread(target=poll_direct_messages, daemon=True).start()


if __name__ == "__main__":
    bootstrap()
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)