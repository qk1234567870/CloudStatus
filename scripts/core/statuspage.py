from .utils import make_event, make_service

def fetch_statuspage(service, ctx):
    try:
        data = ctx["http"].get_json(service["data_url"])
        incidents = data.get("incidents") or []
        events = []

        for inc in incidents[: ctx["config"]["max_events"]]:
            events.append(
                make_event(
                    inc.get("name", ""),
                    inc.get("status", "resolved"),
                    inc.get("created_at"),
                    inc.get("resolved_at"),
                    inc.get("shortlink") or inc.get("url") or service["page_url"],
                )
            )

        return make_service(
            service,
            "ok" if events else "no_events",
            "official",
            events,
        )
    except Exception as e:
        if ctx["config"].get("debug"):
            print(service["name"], e)
        return make_service(service, "fetch_failed", "none", [])
