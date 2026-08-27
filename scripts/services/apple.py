import re
from core.utils import make_event, make_service, clean_text, parse_date

SERVICE = {
    "id": "apple",
    "name": "Apple Services",
    "desc": "Apple 系統與雲端服務",
    "category": "platform",
    "page_url": "https://www.apple.com/support/systemstatus/?viewlocale=en_US",
}

def fetch(ctx):
    # Apple 頁面為動態頁。先以 Jina Reader 取得可解析文字。
    try:
        text = ctx["http"].reader(SERVICE["page_url"])
    except Exception:
        return make_service(SERVICE, "fetch_failed", "none", [])

    lines = [clean_text(x) for x in text.splitlines() if clean_text(x)]
    events = []

    # Reader 輸出的文字格式可能變更；使用寬鬆事件標記。
    heading_re = re.compile(
        r"^(.*?)\s*-\s*(Resolved Outage|Resolved Issue|Outage|Issue|Maintenance)$",
        re.I
    )

    for i, line in enumerate(lines):
        m = heading_re.match(line)
        if not m:
            continue

        service_name = clean_text(m.group(1))
        status = m.group(2)
        description = ""
        date_text = ""

        for candidate in lines[i + 1 : i + 8]:
            if not date_text and re.search(r"\b(?:Today|Yesterday|20\d{2})\b.*\d{1,2}:\d{2}", candidate, re.I):
                date_text = candidate
                continue
            if re.match(r"^(Some|All)\s+users?\s+were\s+affected$", candidate, re.I):
                continue
            if not description and len(candidate) > 5:
                description = candidate

        title = f"{service_name}: {description}" if description else service_name
        events.append(make_event(title, status, None, None, SERVICE["page_url"]))

    if events:
        return make_service(SERVICE, "ok", "official", events)

    if re.search(r"operating normally|all services.*normal", text, re.I):
        return make_service(SERVICE, "no_events", "official", [])

    return make_service(SERVICE, "parse_failed", "official", [])
