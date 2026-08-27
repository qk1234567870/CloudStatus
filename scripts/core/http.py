import requests

UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"

class Http:
    def __init__(self, timeout=12, debug=False):
        self.timeout = timeout
        self.debug = debug
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": UA,
            "Accept-Language": "en-US,en;q=0.9",
        })

    def get_text(self, url, timeout=None):
        r = self.session.get(url, timeout=timeout or self.timeout)
        r.raise_for_status()
        return r.text

    def get_json(self, url, timeout=None):
        r = self.session.get(
            url,
            timeout=timeout or self.timeout,
            headers={"Accept": "application/json,text/plain,*/*"}
        )
        r.raise_for_status()
        return r.json()

    def reader(self, url):
        return self.get_text("https://r.jina.ai/" + url)

    def direct_then_reader(self, url):
        try:
            text = self.get_text(url)
            if text and len(text) > 40:
                return {"ok": True, "source": "official", "text": text}
        except Exception as e:
            if self.debug:
                print("Direct failed", url, e)

        try:
            text = self.reader(url)
            if text and len(text) > 40:
                return {"ok": True, "source": "fallback", "text": text}
        except Exception as e:
            if self.debug:
                print("Reader failed", url, e)

        return {"ok": False, "source": "none", "text": ""}
