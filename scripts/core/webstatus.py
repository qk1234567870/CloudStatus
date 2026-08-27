import re
from bs4 import BeautifulSoup
from .utils import (
    clean_text,
    make_event,
    make_service,
    normalize_status,
    extract_english_dates,
    parse_date,
)

EVENT_WORDS = re.compile(
    r"incident|outage|degraded|maintenance|disruption|interruption|"
    r"packet loss|latency|routing|network issue|service issue|"
    r"performance issue|operational issue|availability issue|failure",
    re.I,
)

NORMAL_WORDS = re.compile(
    r"all systems operational|all services operational|"
    r"all services are operating normally|operating normally|"
    r"there are currently no active events|no active incidents|"
    r"no current incidents|no incidents reported|"
    r"systems normal|network is operating normally",
    re.I,
)

def _plain(raw):
    return BeautifulSoup(raw or "", "html.parser").get_text("\n")

def fetch_public_status_page(service, ctx, max_scan=40):
    page = ctx["http"].direct_then_reader(service["page_url"])

    if not page["ok"]:
        return make_service(service, "fetch_failed", "none", [])

    text = _plain(page["text"])
    events = []

    for raw in text.splitlines():
        line = clean_text(raw)
        if len(line) < 8 or len(line) > 240:
            continue
        if not EVENT_WORDS.search(line):
            continue

        dates = [parse_date(x) for x in extract_english_dates(line)]
        dates = [x for x in dates if x]

        events.append(
            make_event(
                line,
                normalize_status(line),
                dates[0] if dates else None,
                dates[1] if len(dates) > 1 else None,
                service["page_url"],
            )
        )

        if len(events) >= max_scan:
            break

    if events:
        return make_service(service, "ok", page["source"], events)

    if NORMAL_WORDS.search(text):
        return make_service(service, "no_events", page["source"], [])

    return make_service(service, "parse_failed", page["source"], [])
