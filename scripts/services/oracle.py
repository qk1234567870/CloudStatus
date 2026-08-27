import re
from bs4 import BeautifulSoup
from core.utils import make_event, make_service, clean_text, normalize_status, extract_english_dates, parse_date

SERVICE = {
    "id": "oracle",
    "name": "Oracle Cloud",
    "desc": "Oracle Cloud Infrastructure",
    "category": "cloud",
    "page_url": "https://ocistatus.oraclecloud.com/",
    "history_url": "https://ocistatus.oraclecloud.com/incidents/",
}

def fetch(ctx):
    try:
        html = ctx["http"].get_text(SERVICE["history_url"])
        soup = BeautifulSoup(html, "html.parser")
    except Exception:
        try:
            html = ctx["http"].reader(SERVICE["history_url"])
            soup = BeautifulSoup(html, "html.parser")
        except Exception:
            return make_service(SERVICE, "fetch_failed", "none", [])

    links = []
    seen = set()
    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        if "/incidents/" not in href:
            continue
        if href.startswith("/"):
            href = "https://ocistatus.oraclecloud.com" + href
        if not href.startswith("http") or href in seen:
            continue
        seen.add(href)
        links.append((clean_text(a.get_text(" ")), href))

    events = []
    for title, url in links[:6]:
        try:
            detail = ctx["http"].get_text(url)
        except Exception:
            try:
                detail = ctx["http"].reader(url)
            except Exception:
                continue

        plain = BeautifulSoup(detail, "html.parser").get_text(" ")
        dates = [parse_date(x) for x in extract_english_dates(plain)]
        dates = sorted([x for x in dates if x])
        status = normalize_status(plain)
        if re.search(r"resolved|completed|closed", plain, re.I):
            status = "resolved"

        events.append(
            make_event(
                title or "Oracle Cloud Incident",
                status,
                dates[0] if dates else None,
                dates[-1] if len(dates) > 1 else None,
                url,
            )
        )

    if events:
        return make_service(SERVICE, "ok", "official", events)

    plain = soup.get_text(" ")
    if re.search(r"All Systems Operational|no incidents", plain, re.I):
        return make_service(SERVICE, "no_events", "official", [])
    return make_service(SERVICE, "parse_failed", "official", [])
