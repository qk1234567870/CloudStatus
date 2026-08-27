from core.webstatus import fetch_public_status_page

SERVICE = {
    "id": 'ntt-global-network',
    "name": 'NTT Global Network',
    "desc": '全球 Tier-1 IP 骨幹與跨洋網路',
    "category": 'backbone',
    "page_url": 'https://status.act.ntt.com',
}

def fetch(ctx):
    return fetch_public_status_page(SERVICE, ctx)
