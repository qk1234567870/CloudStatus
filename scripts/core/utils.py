import re
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from .models import Event, ServiceResult

RESOLVED = ("resolved", "closed", "completed", "restored", "recovered", "fixed", "postmortem")

def clean_text(value):
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).replace("\xa0", " ")).strip()

def strip_html(value):
    if not value:
        return ""
    return clean_text(BeautifulSoup(str(value), "html.parser").get_text(" "))

def normalize_status(value):
    s = str(value or "").lower()

    if any(x in s for x in RESOLVED):
        return "resolved"
    if "maintenance" in s:
        return "maintenance"
    if "monitoring" in s:
        return "monitoring"
    if "identified" in s:
        return "identified"
    if any(x in s for x in ("degraded", "service disruption", "packet loss", "congestion")):
        return "degraded"
    if any(x in s for x in ("outage", "service down", "offline", "interruption", "failure")):
        return "outage"
    return "investigating"

def parse_date(value):
    if not value:
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        s = clean_text(value).replace(" at ", " ")
        s = s.replace(" UTC", " +0000")
        formats = [
            "%a, %d %b %Y %H:%M:%S %z",
            "%B %d, %Y %I:%M %p %Z",
            "%B %d, %Y %I:%M %p",
            "%b %d, %Y %I:%M %p %Z",
            "%b %d, %Y %I:%M %p",
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%S.%f%z",
            "%Y-%m-%dT%H:%M:%SZ",
        ]
        dt = None
        normalized = s.replace("Z", "+00:00") if re.search(r"T.*Z$", s) else s
        try:
            dt = datetime.fromisoformat(normalized)
        except Exception:
            pass
        if dt is None:
            for fmt in formats:
                try:
                    dt = datetime.strptime(s, fmt)
                    break
                except Exception:
                    pass
        if dt is None:
            return None

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

def iso(dt):
    if not dt:
        return None
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

def make_event(title, status, start=None, end=None, url=""):
    s = parse_date(start)
    e = parse_date(end)
    ts = int((s or e).timestamp() * 1000) if (s or e) else 0
    return Event(
        title=clean_text(title),
        status=normalize_status(status),
        start=iso(s),
        end=iso(e),
        url=url or "",
        timestamp=ts,
    )

def make_service(service, state, source, events, fallback_page=""):
    return ServiceResult(
        id=service["id"],
        name=service["name"],
        desc=service.get("desc", ""),
        category=service.get("category", "other"),
        page=service.get("page_url", ""),
        state=state,
        source=source,
        events=events or [],
        fallback_page=fallback_page or service.get("fallback_url", ""),
    )

def select_events(events, limit):
    seen = set()
    unique = []
    for e in events or []:
        if not e or not e.title:
            continue
        key = (e.title.lower(), e.start or "", e.end or "")
        if key in seen:
            continue
        seen.add(key)
        unique.append(e)

    unique.sort(key=lambda e: e.timestamp or 0, reverse=True)
    active = [e for e in unique if e.status != "resolved"]
    resolved = [e for e in unique if e.status == "resolved"]
    chosen = (active + resolved) if active else resolved
    return chosen[:limit]

MONTH_DATE_RE = re.compile(
    r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}(?:\s+(?:at\s+)?)?\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s+[A-Z]{2,5})?",
    re.I
)

def extract_english_dates(text):
    return MONTH_DATE_RE.findall(text or "")
