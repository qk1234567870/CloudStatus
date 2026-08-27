import os
import requests

class Translator:
    def __init__(self, language="zh-TW", timeout=6, debug=False):
        self.language = language
        self.timeout = timeout
        self.debug = debug
        self.cache = {}
        self.deepl_key = os.getenv("DEEPL_API_KEY", "").strip()

    def deepl(self, text):
        if not self.deepl_key:
            return None

        target = "ZH-HANS" if self.language == "zh-CN" else "ZH-HANT"
        endpoint = (
            "https://api-free.deepl.com/v2/translate"
            if self.deepl_key.endswith(":fx")
            else "https://api.deepl.com/v2/translate"
        )

        r = requests.post(
            endpoint,
            timeout=self.timeout,
            headers={
                "Authorization": "DeepL-Auth-Key " + self.deepl_key,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "text": text,
                "source_lang": "EN",
                "target_lang": target,
            },
        )
        r.raise_for_status()
        data = r.json()
        if data.get("translations"):
            return data["translations"][0].get("text")
        return None

    def google(self, text):
        target = "zh-CN" if self.language == "zh-CN" else "zh-TW"
        endpoints = [
            (
                "https://clients5.google.com/translate_a/t",
                {
                    "client": "dict-chrome-ex",
                    "sl": "en",
                    "tl": target,
                    "q": text,
                },
                "clients5",
            ),
            (
                "https://translate.googleapis.com/translate_a/single",
                {
                    "client": "gtx",
                    "sl": "en",
                    "tl": target,
                    "dt": "t",
                    "dj": "1",
                    "q": text,
                },
                "dj",
            ),
            (
                "https://translate.google.com/translate_a/single",
                {
                    "client": "gtx",
                    "sl": "en",
                    "tl": target,
                    "dt": "t",
                    "q": text,
                },
                "array",
            ),
        ]

        for url, params, kind in endpoints:
            try:
                r = requests.get(url, params=params, timeout=self.timeout)
                r.raise_for_status()
                data = r.json()

                if kind in ("clients5", "dj") and isinstance(data, dict):
                    sentences = data.get("sentences") or []
                    out = "".join(x.get("trans", "") for x in sentences if isinstance(x, dict)).strip()
                    if out:
                        return out

                if kind == "clients5" and isinstance(data, list):
                    if data and isinstance(data[0], list):
                        if data[0] and isinstance(data[0][0], str):
                            return data[0][0].strip()
                        if data[0] and isinstance(data[0][0], list):
                            out = "".join(
                                row[0] for row in data[0]
                                if isinstance(row, list) and row and isinstance(row[0], str)
                            ).strip()
                            if out:
                                return out

                if kind == "array" and isinstance(data, list) and data and isinstance(data[0], list):
                    out = "".join(
                        row[0] for row in data[0]
                        if isinstance(row, list) and row and isinstance(row[0], str)
                    ).strip()
                    if out:
                        return out
            except Exception as e:
                if self.debug:
                    print("Google translate failed", kind, e)

        return None

    def translate(self, text):
        text = (text or "").strip()
        if not text or self.language == "en":
            return text

        key = self.language + "|" + text
        if key in self.cache:
            return self.cache[key]

        result = None
        if self.deepl_key:
            try:
                result = self.deepl(text)
            except Exception as e:
                if self.debug:
                    print("DeepL failed", e)

        if not result:
            result = self.google(text)

        result = result or text
        self.cache[key] = result
        return result
