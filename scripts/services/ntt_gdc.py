from core.utils import make_service

SERVICE = {
    "id": "ntt-gdc",
    "name": "NTT GDC",
    "desc": "全球數據中心與園區基礎設施",
    "category": "datacenter",
    "page_url": "https://services.global.ntt/"
}

def fetch(ctx):
    # No stable anonymous incident-history feed is exposed for this service.
    # Keep the official destination available without falsely reporting a failure.
    return make_service(SERVICE, "restricted", "official", [])
