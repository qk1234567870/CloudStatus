from core.utils import make_service

SERVICE = {
    "id": "arelion",
    "name": "Arelion (Telia)",
    "desc": "全球 Tier-1 國際 IP 骨幹網",
    "category": "backbone",
    "page_url": "https://www.arelion.com/"
}

def fetch(ctx):
    # No stable anonymous incident-history feed is exposed for this service.
    # Keep the official destination available without falsely reporting a failure.
    return make_service(SERVICE, "restricted", "official", [])
