from core.webstatus import fetch_public_status_page

SERVICE = {
    "id": 'cogent',
    "name": 'Cogent',
    "desc": '全球大型 IP Transit 與頻寬批發網路',
    "category": 'backbone',
    "page_url": 'https://status.cogentco.com',
}

def fetch(ctx):
    return fetch_public_status_page(SERVICE, ctx)
