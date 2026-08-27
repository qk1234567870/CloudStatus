from core.webstatus import fetch_public_status_page

SERVICE = {
    "id": 'digital-realty',
    "name": 'Digital Realty',
    "desc": '全球大型數據中心與互聯基礎設施',
    "category": 'datacenter',
    "page_url": 'https://status.digitalrealty.com/',
}

def fetch(ctx):
    return fetch_public_status_page(SERVICE, ctx)
