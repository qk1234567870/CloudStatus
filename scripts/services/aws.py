import feedparser
import re
from bs4 import BeautifulSoup
from core.utils import (
    clean_text,
    make_event,
    make_service,
    normalize_status,
    extract_english_dates,
    parse_date,
)

SERVICE = {
    "id": "aws",
    "name": "AWS",
    "desc": "全球大型雲端基礎設施平台",
    "category": "cloud",
    "page_url": "https://health.aws.amazon.com/health/status",
    "rss_url": "https://status.aws.amazon.com/rss/all.rss",
}

EVENT_RE = re.compile(
    r"operational issue|service disruption|degraded|increased error|"
    r"connectivity issue|availability issue|latency|outage|maintenance",
    re.I,
)

def dashboard(ctx):
    page = ctx["http"].direct_then_reader(SERVICE["page_url"])
    if not page["ok"]:
        return None

    text = BeautifulSoup(page["text"], "html.parser").get_text("\n")
    events = []

    for raw in text.splitlines():
        line = clean_text(raw)
        if len(line) < 8 or len(line) > 240 or not EVENT_RE.search(line):
            continue

        dates = [parse_date(x) for x in extract_english_dates(line)]
        dates = [x for x in dates if x]

        events.append(
            make_event(
                line,
                normalize_status(line),
                dates[0] if dates else None,
                dates[1] if len(dates) > 1 else None,
                SERVICE["page_url"],
            )
        )

    if events:
        return make_service(SERVICE, "ok", page["source"], events)

    # AWS public dashboard is still a valid official source even if no issue rows were parsed.
    if re.search(r"service health|open and recent issues|no current operational issues", text, re.I):
        return make_service(SERVICE, "no_events", page["source"], [])

    return None

def rss(ctx):
    try:
        xml = ctx["http"].get_text(SERVICE["rss_url"])
        feed = feedparser.loads(xml)
        events = []

        for item in feed.entries[: ctx["config"]["max_events"]]:
            events.append(
                make_event(
                    item.get("title", ""),
                    "resolved",
                    item.get("published") or item.get("updated"),
                    None,
                    item.get("link") or SERVICE["page_url"],
                )
            )

        if events:
            return make_service(
                SERVICE, "ok", "fallback", events, SERVICE["rss_url"]
            )
    except Exception as e:
        if ctx["config"].get("debug"):
            print("AWS RSS fallback:", repr(e))

    return make_service(SERVICE, "fetch_failed", "none", [])

def fetch(ctx):
    result = dashboard(ctx)
    return result if result is not None else rss(ctx)
