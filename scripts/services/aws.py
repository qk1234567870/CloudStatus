import feedparser
from core.utils import make_event, make_service

SERVICE = {
    "id": "aws",
    "name": "AWS",
    "desc": "全球大型雲端基礎設施平台",
    "category": "cloud",
    "page_url": "https://health.aws.amazon.com/health/status",
    "data_url": "https://status.aws.amazon.com/rss/all.rss",
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
            print("AWS", e)
        return make_service(SERVICE, "fetch_failed", "none", [])
