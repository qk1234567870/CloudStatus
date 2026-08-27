from core.statuspage import fetch_statuspage

SERVICE = {
    "id": 'cloudflare',
    "name": 'Cloudflare',
    "desc": '全球最大 CDN、DNS 與網路安全平台',
    "category": 'cloud',
    "page_url": 'https://www.cloudflarestatus.com',
    "data_url": 'https://www.cloudflarestatus.com/api/v2/incidents.json',
}

def fetch(ctx):
    return fetch_statuspage(SERVICE, ctx)
