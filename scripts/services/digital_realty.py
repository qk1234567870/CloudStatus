from core.statuspage import fetch_statuspage

SERVICE = {
    "id": 'digital-realty',
    "name": 'Digital Realty',
    "desc": '全球大型數據中心與互聯基礎設施',
    "category": 'datacenter',
    "page_url": 'https://status.digitalrealty.com',
    "data_url": 'https://status.digitalrealty.com/api/v2/incidents.json',
}

def fetch(ctx):
    return fetch_statuspage(SERVICE, ctx)
