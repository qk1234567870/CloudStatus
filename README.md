# CloudStatus Web Dashboard

模組化全球雲端、AI、數據中心、Tier-1 骨幹網與 Hosting 狀態儀表板。

## 架構

```text
官方 Status API / RSS / 網頁
          ↓
    GitHub Actions
      每 15 分鐘
          ↓
 scripts/services/*.py
          ↓
 data/status.json
          ↓
    GitHub Pages
          ↓
 iPhone / Safari / Edge / Chrome
```

瀏覽器端只顯示已整理好的 JSON，不直接跨域抓各家狀態頁，因此不受 CORS 限制，也沒有 Scriptable Widget 高度限制。

## 目前服務

### 雲端 / CDN / AI / 開發者
- Cloudflare
- AWS
- Microsoft Azure
- Google Cloud
- GitHub
- OpenAI

### 平台 / Hosting
- Apple Services
- Oracle Cloud
- BandwagonHost
- DMIT

### 數據中心 / Tier-1 / 骨幹網
- Equinix
- Digital Realty
- NTT GDC
- Arelion (Telia)
- NTT Global Network
- Cogent

共 16 個服務。每個服務統一最多顯示最近 3 筆事件。

## 目錄

```text
CloudStatus/
├── .github/workflows/pages.yml
├── config.json
├── requirements.txt
├── scripts/
│   ├── build.py
│   ├── core/
│   │   ├── http.py
│   │   ├── models.py
│   │   ├── registry.py
│   │   ├── statuspage.py
│   │   ├── translator.py
│   │   └── utils.py
│   └── services/
│       ├── cloudflare.py
│       ├── aws.py
│       ├── azure.py
│       ├── google_cloud.py
│       ├── github.py
│       ├── openai.py
│       ├── apple.py
│       ├── oracle.py
│       ├── bandwagonhost.py
│       ├── dmit.py
│       ├── equinix.py
│       ├── digital_realty.py
│       ├── ntt_gdc.py
│       ├── arelion.py
│       ├── ntt_global_network.py
│       └── cogent.py
└── web/
    ├── index.html
    └── assets/
        ├── app.js
        └── style.css
```

## 部署

1. 建立一個 **Public GitHub Repository**。
2. 把本套件內容完整上傳到 Repo 根目錄。
3. GitHub → **Settings → Pages → Source** 選 **GitHub Actions**。
4. GitHub → **Actions**，手動執行一次 `Build and Deploy CloudStatus`。
5. 部署完成後即可使用 GitHub Pages 網址。

排程：

```cron
*/15 * * * *
```

GitHub Actions 的 schedule 不是即時排程器，忙碌時可能延後數分鐘。

## DeepL

不需要把 DeepL Key 寫進 Repo。

如需 DeepL：

GitHub Repo → Settings → Secrets and variables → Actions → New repository secret

名稱：

```text
DEEPL_API_KEY
```

有 Key 時：

```text
DeepL → Google Web fallback → 英文原文
```

沒有 Key 時：

```text
Google Web fallback → 英文原文
```

Google fallback 使用的是 Web 翻譯介面，不是 Google Cloud Translation 正式 API；若介面失效，程式會保留官方英文，不影響資料抓取與頁面部署。

## 新增一般 Statuspage 服務

建立 `scripts/services/example.py`：

```python
from core.statuspage import fetch_statuspage

SERVICE = {
    "id": "example",
    "name": "Example",
    "desc": "Example Service",
    "category": "cloud",
    "page_url": "https://status.example.com",
    "data_url": "https://status.example.com/api/v2/incidents.json",
}

def fetch(ctx):
    return fetch_statuspage(SERVICE, ctx)
```

然後在 `scripts/core/registry.py` 加入模組名稱即可。

## 前端功能

- 手機 / 桌面響應式
- 可無限向下滑動
- 分類篩選
- 搜尋服務與事件
- 只看異常
- 每服務最近 3 筆
- 活躍事件優先
- 點事件開官方事件頁
- 顯示資料來源（官方 / 備援）
- 每 60 秒重新讀取部署中的 `status.json`
- 15 分鐘由 GitHub Actions 重新抓取並部署
