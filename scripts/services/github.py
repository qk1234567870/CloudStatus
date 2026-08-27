from core.statuspage import fetch_statuspage

SERVICE = {
    "id": 'github',
    "name": 'GitHub',
    "desc": '全球最大的程式碼託管與開發者平台',
    "category": 'developer',
    "page_url": 'https://www.githubstatus.com',
    "data_url": 'https://www.githubstatus.com/api/v2/incidents.json',
}

def fetch(ctx):
    return fetch_statuspage(SERVICE, ctx)
