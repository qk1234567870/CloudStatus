from core.statuspage import fetch_statuspage

SERVICE = {
    "id": 'arelion',
    "name": 'Arelion (Telia)',
    "desc": '全球 Tier-1 國際 IP 骨幹網',
    "category": 'backbone',
    "page_url": 'https://status.arelion.com',
    "data_url": 'https://status.arelion.com/api/v2/incidents.json',
}

def fetch(ctx):
    return fetch_statuspage(SERVICE, ctx)
