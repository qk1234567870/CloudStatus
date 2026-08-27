from core.webstatus import fetch_public_status_page

SERVICE = {
    "id": 'equinix',
    "name": 'Equinix',
    "desc": '全球大型數據中心與機房互聯平台',
    "category": 'datacenter',
    "page_url": 'https://status.equinix.com',
}

def fetch(ctx):
    return fetch_public_status_page(SERVICE, ctx)
