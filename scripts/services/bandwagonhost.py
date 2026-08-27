import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from core.utils import make_event, make_service, clean_text, normalize_status, extract_english_dates, parse_date

SERVICE = {
    "id": "bandwagonhost",
    "name": "BandwagonHost",
    "desc": "VPS 與網路基礎設施",
    "category": "hosting",
    "page_url": "https://bwhstatus.com/",
}

def fetch(ctx):
    page = ctx["http"].direct_then_reader(SERVICE["page_url"])
    if not page["ok"]:
        return make_service(SERVICE, "fetch_failed", "none", [])

    soup = BeautifulSoup(page["text"], "html.parser")
    links = []
    seen = set()

    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        if not re.search(r"issue\.php\?id=|/incident/", href, re.I):
            continue
        url = urljoin(SERVICE["page_url"], href)
        title = clean_text(a.get_text(" "))
        if not title or url in seen:
            continue
        seen.add(url)
        links.append((title, url))

    if not links:
        plain = soup.get_text(" ")
        if re.search(r"no incidents in the last|all systems operational", plain, re.I):
            return make_service(SERVICE, "no_events", page["source"], [])
        return make_service(SERVICE, "parse_failed", page["source"], [])

    events = []
    for title, url in links[:10]:
        detail = ctx["http"].direct_then_reader(url)
        if not detail["ok"]:
            continue
        plain = BeautifulSoup(detail["text"], "html.parser").get_text(" ")
        dates = [parse_date(x) for x in extract_english_dates(plain)]
        dates = sorted([x for x in dates if x])

        events.append(
            make_event(
                title,
                normalize_status(plain),
                dates[0] if dates else None,
                dates[-1] if len(dates) > 1 else None,
                url,
            )
        )

    return make_service(
        SERVICE,
        "ok" if events else "parse_failed",
        page["source"],
        events,
    )
