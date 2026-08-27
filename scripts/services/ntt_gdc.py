from core.webstatus import fetch_public_status_page

SERVICE = {
    "id": 'ntt-gdc',
    "name": 'NTT GDC',
    "desc": '全球數據中心與園區基礎設施',
    "category": 'datacenter',
    "page_url": 'https://status.global.ntt',
}

def fetch(ctx):
    return fetch_public_status_page(SERVICE, ctx)
