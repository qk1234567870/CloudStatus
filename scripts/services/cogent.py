from core.utils import make_service

SERVICE = {
    "id": "cogent",
    "name": "Cogent",
    "desc": "全球大型 IP Transit 與頻寬批發網路",
    "category": "backbone",
    "page_url": "https://status.cogentco.com/",
}

def fetch(ctx):
    # Cogent officially publishes a Network Status Page, but the anonymous page
    # currently redirects to a JS application without a stable public incident feed.
    return make_service(SERVICE, "status_only", "official", [])
