from core.utils import make_event, make_service

SERVICE = {
    "id": "google-cloud",
    "name": "Google Cloud",
    "desc": "Google 雲端運算與數據分析平台",
    "category": "cloud",
    "page_url": "https://status.cloud.google.com",
    "data_url": "https://status.cloud.google.com/incidents.json",
}

def fetch(ctx):
    try:
        data = ctx["http"].get_json(SERVICE["data_url"])
        if not isinstance(data, list):
            return make_service(SERVICE, "parse_failed", "official", [])

        active = [x for x in data if not x.get("end")]
        source = (active if active else data)[: ctx["config"]["max_events"]]
        events = []

        for inc in source:
            title = inc.get("external_desc") or inc.get("service_name") or ""
            events.append(
                make_event(
                    title,
                    "resolved" if inc.get("end") else "investigating",
                    inc.get("begin"),
                    inc.get("end"),
                    SERVICE["page_url"],
                )
            )

        return make_service(SERVICE, "ok" if events else "no_events", "official", events)
    except Exception as e:
        if ctx["config"].get("debug"):
            print("GCP", e)
        return make_service(SERVICE, "fetch_failed", "none", [])
