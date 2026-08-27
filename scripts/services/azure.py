import feedparser
from core.utils import make_event, make_service

SERVICE = {
    "id": "azure",
    "name": "Microsoft Azure",
    "desc": "Microsoft 企業級雲端平台",
    "category": "cloud",
    "page_url": "https://status.azure.com/zh-tw/status",
    "data_url": "https://status.azure.com/en-us/status/feed/",
}

def fetch(ctx):
    try:
        xml = ctx["http"].get_text(SERVICE["data_url"])
        feed = feedparser.loads(xml)
        events = []

        for item in feed.entries[: ctx["config"]["max_events"]]:
            title = item.get("title", "")
            date = item.get("published") or item.get("updated")
            url = item.get("link") or SERVICE["page_url"]
            events.append(make_event(title, "resolved", date, None, url))

        return make_service(SERVICE, "ok" if events else "no_events", "official", events)
    except Exception as e:
        if ctx["config"].get("debug"):
            print("Azure", e)
        return make_service(SERVICE, "fetch_failed", "none", [])
