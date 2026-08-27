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


## 2.1 來源整改

以下來源不再假設存在 Atlassian Statuspage `/api/v2/incidents.json`：

- AWS
- Microsoft Azure
- Equinix
- Digital Realty
- NTT GDC
- Arelion
- NTT Global Network
- Cogent

新策略：

```text
官方公開頁 / 官方可用 Feed
↓
官方頁解析
↓
Jina Reader 備援
↓
仍不可用才標記「取得失敗」
```

AWS：公開 AWS Health Dashboard 優先，舊 RSS 僅備援。

Azure：使用目前的 `azure.status.microsoft/status`，並加入官方 backup status 頁。


## 2.2 來源狀態語義整改

不再把「沒有匿名事件 API」錯誤顯示為「取得失敗」。

新增兩種狀態：

```text
[受限]
官方事件明細需要登入，或供應商沒有提供匿名公開事件歷史來源。

[狀態頁]
官方狀態頁可公開訪問，但沒有穩定可程式化取得的公開事件歷史介面。
```

目前：

- Equinix → 受限（Service Availability / Service Insight 為帳戶型服務）
- NTT GDC → 受限
- Arelion → 受限
- NTT Global Network → 受限
- Cogent → 狀態頁（官方 Network Status Page 存在，但公開頁為 JS App）
- Digital Realty → 正式解析公開 System Status；Operational 時顯示正常
- AWS → 使用 Jina Reader 解析官方 AWS Health Dashboard
- Azure → 保留 2.1 已修正的官方 Azure Status 邏輯

「取得/解析異常」統計只計算真正的：

```text
fetch_failed
parse_failed
```

不再把 `restricted` / `status_only` 算成故障。


## 2.3 移除伺服端翻譯

CloudStatus 現在是 GitHub Pages Web 版，因此資料產生階段不再翻譯第三方事件。

已移除：

- `scripts/core/translator.py`
- DeepL API Key
- Google Translate fallback
- `language`
- `translate_timeout`
- GitHub Actions 的 `DEEPL_API_KEY` Secret 注入
- 翻譯快取與翻譯請求

資料流程：

```text
官方來源
↓
GitHub Actions 抓取 / 解析 / 排序
↓
status.json（事件標題保留官方原文）
↓
GitHub Pages
↓
需要中文時使用瀏覽器整頁翻譯
```

CloudStatus 自己的 UI（正常、已解決、處理中、取得失敗等）仍維持繁體中文。
