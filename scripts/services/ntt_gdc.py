from core.statuspage import fetch_statuspage

SERVICE = {
    "id": 'ntt-gdc',
    "name": 'NTT GDC',
    "desc": '全球數據中心與園區基礎設施',
    "category": 'datacenter',
    "page_url": 'https://status.global.ntt',
    "data_url": 'https://status.global.ntt/api/v2/incidents.json',
}

def fetch(ctx):
    return fetch_statuspage(SERVICE, ctx)
