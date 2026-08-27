from core.statuspage import fetch_statuspage

SERVICE = {
    "id": 'openai',
    "name": 'OpenAI',
    "desc": 'ChatGPT 與大語言模型 API 服務商',
    "category": 'ai',
    "page_url": 'https://status.openai.com',
    "data_url": 'https://status.openai.com/api/v2/incidents.json',
}

def fetch(ctx):
    return fetch_statuspage(SERVICE, ctx)
