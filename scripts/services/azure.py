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
    "id": "azure",
    "name": "Microsoft Azure",
    "desc": "Microsoft 企業級雲端平台",
    "category": "cloud",
    "page_url": "https://azure.status.microsoft/status",
    "backup_url": "https://backup.azure.status.microsoft/",
}

EVENT_RE = re.compile(
    r"incident|outage|critical|warning|degraded|service issue|"
    r"availability|interruption|impact",
    re.I,
)

def parse_page(page, source_url):
    text = BeautifulSoup(page["text"], "html.parser").get_text("\n")

    if re.search(r"there are currently no active events", text, re.I):
        return make_service(SERVICE, "no_events", page["source"], [])

    events = []

    for raw in text.splitlines():
        line = clean_text(raw)
        if len(line) < 8 or len(line) > 240:
            continue
        if not EVENT_RE.search(line):
            continue
        if re.fullmatch(r"(current impact|warning|critical|information|good)", line, re.I):
            continue

        dates = [parse_date(x) for x in extract_english_dates(line)]
        dates = [x for x in dates if x]

        events.append(
            make_event(
                line,
                normalize_status(line),
                dates[0] if dates else None,
                dates[1] if len(dates) > 1 else None,
                source_url,
            )
        )

    if events:
        return make_service(SERVICE, "ok", page["source"], events)

    return make_service(SERVICE, "parse_failed", page["source"], [])

def fetch(ctx):
    main = ctx["http"].direct_then_reader(SERVICE["page_url"])
    if main["ok"]:
        result = parse_page(main, SERVICE["page_url"])
        if result.state != "parse_failed":
            return result

    backup = ctx["http"].direct_then_reader(SERVICE["backup_url"])
    if backup["ok"]:
        result = parse_page(backup, SERVICE["backup_url"])
        if result.state != "parse_failed":
            return result

    if main["ok"]:
        return parse_page(main, SERVICE["page_url"])
    if backup["ok"]:
        return parse_page(backup, SERVICE["backup_url"])

    return make_service(SERVICE, "fetch_failed", "none", [])
