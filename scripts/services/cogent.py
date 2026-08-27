from core.statuspage import fetch_statuspage

SERVICE = {
    "id": 'cogent',
    "name": 'Cogent',
    "desc": '全球大型 IP Transit 與頻寬批發網路',
    "category": 'backbone',
    "page_url": 'https://status.cogentco.com',
    "data_url": 'https://status.cogentco.com/api/v2/incidents.json',
}

def fetch(ctx):
    return fetch_statuspage(SERVICE, ctx)
