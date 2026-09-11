# CloudStatus

純 GitHub Pages 的全球雲端、AI、平台、Hosting、資料中心、骨幹網與跨境線路狀態頁。

前端採 **原生 ES Modules + Service Plugin Registry**。不需要 npm、Vite、Webpack 或其他前端建置流程；GitHub Actions 只負責 Pages 部署與 Telegram 全球機器探針。

## 核心原則

CloudStatus 將「目前狀態」與「事件歷史」分開處理：

- 只有來源明確提供 current health / status 時，才顯示目前狀態。
- 不從事件名稱、歷史紀錄、公告正文或 HTTP 成功自行推斷目前健康狀態。
- Active incidents 與 Recent events 分離，Active 永遠優先顯示。
- 事件狀態只採用來源明示的 status；來源沒有提供就不補標籤。
- 不為了湊數而製造事件，最近事件最多顯示 3 筆。
- 來源事件內容保留原語言；UI 使用繁體中文。

資料來源優先級：

```text
官方 API
→ 官方 JSON
→ 官方 RSS / Feed
→ 官方事件歷史
→ 官方 System Status
→ 官方公告 / 備援
→ 可信第三方備援
→ 官方頁入口
```

## 完全模組化架構

主要目錄：

```text
assets/
├─ app.js                  # 純啟動器
├─ style.css               # CSS manifest
├─ core/                   # 核心資料流、網路、快取、刷新、查詢
├─ parsers/                # 通用 Parser
├─ ui/                     # Renderer、卡片、篩選與事件綁定
├─ services/               # Registry + 24 個服務 Plugin
└─ styles/                 # 分層 CSS

scripts/
└─ telegram-global-probe.mjs

data/
└─ telegram-global.json

.github/workflows/
└─ pages.yml
```

`assets/app.js` 只負責啟動。抓取、Parser、來源合併、快取、刷新、搜尋、Layout、Renderer 與 UI 綁定都已拆到獨立模組。

完整模組責任、資料流與擴充方式見 [`ARCHITECTURE.md`](./ARCHITECTURE.md)。

## 服務 Plugin

目前共有 24 個服務模組，位於：

```text
assets/services/*.js
```

`assets/services/registry.js` 負責：

- Service manifest
- 動態載入服務 Plugin
- Service Registry
- 專屬 Parser Plugin Registry
- 固定服務排序

新增服務原則上只需要新增自己的 Service Plugin，再加入 manifest；不應把服務專屬邏輯重新塞回核心。

## DMIT

DMIT 主要使用 `DOES DMIT FAIL?` 公開 JSON API（無需 API Key；官方文件標示 60 requests/min）：

- `/api/v1/status`：目前狀態與各服務狀態
- `/api/v1/services`：機房、產品線與線路
- `/api/v1/incidents`：事件
- `/status.json`：僅在主要 status endpoint 失敗時作目前狀態備援

DMIT 卡片的資料來源會顯示可點擊的 `API · DOES DMIT FAIL?`，直接連到官方 [`API Docs`](https://does.dmit.fail/api-docs)。

DMIT 卡片的三個內容區塊另外直接對應官方頁面：

- `目前事件` → [`DOES DMIT FAIL?`](https://does.dmit.fail/)
- `最近 N 筆事件` → [`Incident history · DOES DMIT FAIL?`](https://does.dmit.fail/incidents)
- `服務` → [`Services · DOES DMIT FAIL?`](https://does.dmit.fail/services)

`服務` 不只是入口：CloudStatus 會直接讀取官方 [`Services · DOES DMIT FAIL?`](https://does.dmit.fail/services) 頁面並解析其 **Datacenter → Product Line → Route** 階層，渲染成服務面板；同時保留 `/api/v1/services` 作結構化備援。面板依 **洛杉磯 / 東京 / 香港 / 應用** 分卡，再依 **LAX/TYO/HKG Pro、EB、T1** 分組，逐項顯示線路與目前運作狀態。

即使目前沒有事件，DMIT 卡片仍會保留 `目前事件 0` / `最近 0 筆事件` 的官方入口。

DMIT 現在採 **API-only**：不再使用舊 `Server Status` 頁與 Telegram 公告作為備援，避免重複、延遲或難以結構化的資料污染卡片。

不使用已移除的 DMIT Security Response 作為狀態來源。

## Telegram Data Centers

Telegram 卡片有兩個互相獨立的測量層。

### 目前網路

瀏覽器直接測試 Telegram 官方 WebSocket 端點：

- DC1 · Pluto（冥王星）· Miami
- DC2 · Venus（金星）· Amsterdam
- DC3 · Aurora（歐若拉）· Miami
- DC4 · Vesta（灶神星）· Amsterdam
- DC5 · Flora（花神星）· Singapore

這表示「目前瀏覽器網路到 Telegram 官方端點的可連線性」，不是 Telegram 官方全球 outage 判定。

### 全球機器探針

GitHub Actions 定時執行 `scripts/telegram-global-probe.mjs`，透過 Check-Host 機器節點測試 DC1–DC5 的 TCP/443。

- 亞洲、歐洲、北美、南美、大洋洲、非洲按洲自動選可用機器節點。
- 每一洲仍測試全部 DC1–DC5。
- 洲別旁的 DC 標示表示主 DC 實體所在地，不表示該洲使用者固定只使用該 DC。
- Check-Host `HTTP 429` 顯示為「來源限流」，不視為 Telegram 故障。
- 全球完整巡檢目前每 15 分鐘執行一次，錯峰於每小時 07 / 22 / 37 / 52 分。

## 更新與快取

前端：

- 開啟頁面後立即讀取資料。
- 有有效快取時先顯示快取，再背景更新。
- 前景約每 5 分鐘刷新。
- 從背景返回且超過門檻時重新讀取。
- 手動刷新可強制重新讀取。
- 舊快取最多保留 24 小時作為暫時備援。

Telegram 全球探針由 GitHub Actions 的排程獨立執行。



## 模組快取版本

完全模組化後不只入口檔需要版本號。CloudStatus 會對：

- `index.html` 載入的 `style.css` / `registry.js` / `app.js`
- 所有 ES Module 的相對 `import`
- Service Plugin 動態載入 URL
- `style.css` 的所有 `@import`

全部同步附加相同 `?v=<版本>`。

這可避免 Safari / CDN 保留舊的 `ui/card-template.js`、`core/events.js` 或 CSS 子模組，造成「已部署新版本但畫面仍像舊版本」。

## 部署

建議使用內附的 GitHub Pages workflow：

```text
.github/workflows/pages.yml
```

GitHub Repository：

```text
Settings
→ Pages
→ Build and deployment
→ Source
→ GitHub Actions
```

詳細部署、排程與故障排查見 [`DEPLOYMENT.md`](./DEPLOYMENT.md)。

套件**不包含 `CNAME`**。自訂網域請在 GitHub Pages Repository Settings 設定，避免更新套件時覆蓋你的網域。

## 文件

- [`ARCHITECTURE.md`](./ARCHITECTURE.md)：完整模組架構、依賴方向與擴充規則
- [`DEPLOYMENT.md`](./DEPLOYMENT.md)：GitHub Pages / Actions 部署與 Telegram 探針
- [`CHANGELOG.md`](./CHANGELOG.md)：版本更新記錄

## 最重要的資料規則

> 不推斷、不造假、不硬湊事件。

CloudStatus 只顯示來源能明確支持的狀態與事件資料。
