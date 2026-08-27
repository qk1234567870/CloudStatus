from core.statuspage import fetch_statuspage

SERVICE = {
    "id": 'equinix',
    "name": 'Equinix',
    "desc": '全球大型數據中心與機房互聯平台',
    "category": 'datacenter',
    "page_url": 'https://status.equinix.com',
    "data_url": 'https://status.equinix.com/api/v2/incidents.json',
}

def fetch(ctx):
    return fetch_statuspage(SERVICE, ctx)
