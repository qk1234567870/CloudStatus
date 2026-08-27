import re
from bs4 import BeautifulSoup
from core.utils import make_event, make_service, clean_text, strip_html, extract_english_dates, parse_date

SERVICE = {
    "id": "dmit",
    "name": "DMIT",
    "desc": "全球高階網路與雲端服務",
    "category": "hosting",
    "page_url": "https://www.dmit.io/serverstatus.php",
    "fallback_url": "https://t.me/s/DMIT_INC",
}

KEYWORDS = re.compile(
    r"maintenance|incident|outage|network|packet loss|fiber|cable|degraded|emergency|interruption|latency|routing",
    re.I
)

def official(ctx):
    page = ctx["http"].direct_then_reader(SERVICE["page_url"])
    if not page["ok"]:
        return []

    plain = BeautifulSoup(page["text"], "html.parser").get_text("\n")
    if re.search(r"sign in|login|password|client area", plain, re.I):
        return []

    lines = [clean_text(x) for x in plain.splitlines() if clean_text(x)]
    events = []

    for i, line in enumerate(lines):
        if not KEYWORDS.search(line):
            continue
        block = " ".join(lines[max(0, i - 3): min(len(lines), i + 4)])
        dates = [parse_date(x) for x in extract_english_dates(block)]
        dates = [x for x in dates if x]
        events.append(
            make_event(
                line,
                line,
                dates[0] if dates else None,
                dates[1] if len(dates) > 1 else None,
                SERVICE["page_url"],
            )
        )
    return events

def telegram(ctx):
    page = ctx["http"].direct_then_reader(SERVICE["fallback_url"])
    if not page["ok"]:
        return []

    soup = BeautifulSoup(page["text"], "html.parser")
    events = []
    for wrap in soup.select(".tgme_widget_message_wrap"):
        time = wrap.select_one("time[datetime]")
        body = wrap.select_one(".tgme_widget_message_text")
        if not body:
            continue
        text = clean_text(body.get_text(" "))
        if not text or not KEYWORDS.search(text):
            continue
        if len(text) > 180:
            text = text[:177] + "..."
        events.append(
            make_event(
                text,
                text,
                time.get("datetime") if time else None,
                None,
                SERVICE["fallback_url"],
            )
        )
    return events

def fetch(ctx):
    events = official(ctx)
    if events:
        return make_service(SERVICE, "ok", "official", events)

    events = telegram(ctx)
    if events:
        return make_service(
            SERVICE,
            "ok",
            "fallback",
            events,
            SERVICE["fallback_url"],
        )

    return make_service(SERVICE, "fetch_failed", "none", [])
