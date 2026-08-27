from core.utils import make_service

SERVICE = {
    "id": "ntt-global-network",
    "name": "NTT Global Network",
    "desc": "全球 Tier-1 IP 骨幹與跨洋網路",
    "category": "backbone",
    "page_url": "https://www.nttdata.com/global/en/services/connectivity/global-ip-network"
}

def fetch(ctx):
    # No stable anonymous incident-history feed is exposed for this service.
    # Keep the official destination available without falsely reporting a failure.
    return make_service(SERVICE, "restricted", "official", [])
