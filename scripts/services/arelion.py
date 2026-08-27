from core.webstatus import fetch_public_status_page

SERVICE = {
    "id": 'arelion',
    "name": 'Arelion (Telia)',
    "desc": '全球 Tier-1 國際 IP 骨幹網',
    "category": 'backbone',
    "page_url": 'https://status.arelion.com',
}

def fetch(ctx):
    return fetch_public_status_page(SERVICE, ctx)
