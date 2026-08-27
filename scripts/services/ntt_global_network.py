from core.statuspage import fetch_statuspage

SERVICE = {
    "id": 'ntt-global-network',
    "name": 'NTT Global Network',
    "desc": '全球 Tier-1 IP 骨幹與跨洋網路',
    "category": 'backbone',
    "page_url": 'https://status.act.ntt.com',
    "data_url": 'https://status.act.ntt.com/api/v2/incidents.json',
}

def fetch(ctx):
    return fetch_statuspage(SERVICE, ctx)
