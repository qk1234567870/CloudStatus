from core.utils import make_service

SERVICE = {
    "id": "equinix",
    "name": "Equinix",
    "desc": "全球大型數據中心與機房互聯平台",
    "category": "datacenter",
    "page_url": "https://www.equinix.com/contact-us/customer-support",
}

def fetch(ctx):
    # Equinix Service Availability Status / Service Insight is account-based.
    # Do not label this as a fetch failure when no anonymous incident feed exists.
    return make_service(SERVICE, "restricted", "official", [])
