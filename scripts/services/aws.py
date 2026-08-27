import re
from core.utils import make_event, make_service, clean_text, normalize_status, parse_date

SERVICE = {
    "id": "aws",
    "name": "AWS",
    "desc": "全球大型雲端基礎設施平台",
    "category": "cloud",
    "page_url": "https://health.aws.amazon.com/health/status?path=open-issues",
}

EVENT_HEAD = re.compile(
    r"^(Operational issue|Service disruption|Informational|Maintenance)\s*-\s*(.+)$",
    re.I,
)

DATE_RE = re.compile(
    r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+"
    r"\d{1,2}\s+\d{1,2}:\d{2}\s*(?:AM|PM)\s+PDT",
    re.I,
)

def fetch(ctx):
    # AWS Health Dashboard is public, but highly dynamic.
    # Jina Reader gives a stable text representation on GitHub Actions.
    try:
        text = ctx["http"].reader(SERVICE["page_url"])
    except Exception as e:
        if ctx["config"].get("debug"):
            print("AWS reader:", repr(e))
        return make_service(SERVICE, "fetch_failed", "none", [])

    lines = [clean_text(x) for x in text.splitlines() if clean_text(x)]
    events = []

    for i, line in enumerate(lines):
        m = EVENT_HEAD.match(line)
        if not m:
            continue

        kind = m.group(1)
        subject = m.group(2)
        title = f"{kind} - {subject}"
        start = None

        # Scan nearby lines for the first update time. AWS displays update entries
        # like "Apr 30 12:25 AM PDT ...".
        for candidate in lines[i + 1:i + 12]:
            dm = DATE_RE.search(candidate)
            if dm:
                # Year is not always present on the page. We intentionally leave
                # the time null rather than inventing a year.
                break

        events.append(
            make_event(
                title,
                normalize_status(kind),
                start,
                None,
                SERVICE["page_url"],
            )
        )

    if events:
        return make_service(SERVICE, "ok", "official", events)

    # A successfully rendered dashboard with no parsed issue headings means no
    # currently/openly listed issue rows rather than a fetch failure.
    if re.search(r"AWS Health Dashboard|Service health|Open and recent issues", text, re.I):
        return make_service(SERVICE, "no_events", "official", [])

    return make_service(SERVICE, "parse_failed", "official", [])
