import re
from bs4 import BeautifulSoup
from core.utils import make_event, make_service, clean_text, normalize_status

SERVICE = {
    "id": "digital-realty",
    "name": "Digital Realty",
    "desc": "全球大型數據中心與互聯基礎設施",
    "category": "datacenter",
    "page_url": "https://status.digitalrealty.com/",
}

def fetch(ctx):
    page = ctx["http"].direct_then_reader(SERVICE["page_url"])
    if not page["ok"]:
        return make_service(SERVICE, "fetch_failed", "none", [])

    text = BeautifulSoup(page["text"], "html.parser").get_text("\n")
    lines = [clean_text(x) for x in text.splitlines() if clean_text(x)]

    # Current public page exposes component state, not a public incident-history API.
    degraded = []
    for line in lines:
        if re.search(r"\b(degraded|outage|disruption|partial|major)\b", line, re.I):
            degraded.append(
                make_event(line, normalize_status(line), None, None, SERVICE["page_url"])
            )

    if degraded:
        return make_service(SERVICE, "ok", page["source"], degraded)

    if re.search(r"\bOperational\b", text, re.I):
        return make_service(SERVICE, "no_events", page["source"], [])

    return make_service(SERVICE, "status_only", page["source"], [])
