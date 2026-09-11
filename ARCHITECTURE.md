# CloudStatus Architecture

CloudStatus 前端採瀏覽器原生 ES Modules，服務層採 Service Plugin Registry。目標是讓服務、Parser、資料流、UI 與樣式互相解耦。

## 1. 啟動流程

入口：

```text
index.html
├─ assets/services/registry.js
└─ assets/app.js  (type="module")
```

`assets/app.js` 只做五件事：

```text
等待 Service Registry 載入完成
→ initializeCatalog()
→ bindUI()
→ loadCache()
→ refresh({ force: true })
→ startAutoRefresh()
```

它不包含 Parser、fetch、cache implementation、render implementation 或服務專屬邏輯。

## 2. 目錄與模組責任

### `assets/core/`

| 模組 | 責任 |
|---|---|
| `config.js` | 版本、快取 key、刷新時間、timeout、併發等 runtime 設定 |
| `state.js` | Catalog、服務排序與前端 state |
| `utils.js` | DOM、文字、日期與共用工具 |
| `events.js` | Event normalize、狀態語意、去重、排序 |
| `network.js` | `fetchJson`、`fetchText`、Reader、timeout |
| `source-engine.js` | Source priority、runSource、fallback、merge、兩階段載入 |
| `query.js` | 搜尋、分類、只看異常、跨境線路排序 |
| `cache.js` | localStorage 快取讀寫 |
| `refresh.js` | 完整刷新流程與 progressive render |
| `scheduler.js` | 自動刷新、前景刷新 |

### `assets/parsers/`

| 模組 | 責任 |
|---|---|
| `utils.js` | 暴露 Service Parser 共用工具 |
| `statuspage.js` | Statuspage active / recent 雙通道 |
| `google.js` | Google Cloud 類來源 |
| `rss.js` | RSS / Feed |
| `azure.js` | Azure |
| `apple.js` | Apple structured status / Reader backup |
| `hosting.js` | Hosting 類通用 Parser |
| `network.js` | Network / BGP / infrastructure 類 |
| `reader.js` | Reader dispatcher |

服務有特殊格式時，優先放在自己的 `assets/services/<service>.js` Parser Plugin，不擴大通用 Parser 的責任。

### `assets/ui/`

| 模組 | 責任 |
|---|---|
| `card-template.js` | Service Card HTML、事件、Telegram、DMIT details |
| `renderer.js` | Summary、Service flow、Render signature、響應式雙欄 |
| `filters.js` | 分類列與動態「更多」 |
| `bindings.js` | Search、只看異常、Reload、Resize、Viewport 等事件綁定 |

### `assets/services/`

`registry.js` 是 Service Plugin Registry；其餘每個 `.js` 對應一個服務。

目前共 24 個服務 Plugin。

Service Plugin 可提供：

```js
{
  id,
  name,
  nameZh,
  desc,
  category,
  page,
  parser,
  sources
}
```

也可以註冊自己的 Parser Plugin：

```js
window.CloudStatusServices.registerParser("service-id", {
  runSource: async function (source, service, ctx) {},
  parseReader: function (text, service, source, utils) {}
});
```

專屬 Parser 可以回傳：

```js
{
  health,
  healthText,
  events,
  activeEvents,
  recentEvents,
  checks,
  globalProbe,
  details,
  detailsTitle,
  detailsSource
}
```

核心會再統一 normalize。

### `assets/styles/`

`assets/style.css` 只是一個 CSS manifest：

```css
@import url("./styles/base.css");
@import url("./styles/toolbar.css");
@import url("./styles/cards.css");
@import url("./styles/responsive.css");
@import url("./styles/layout.css");
@import url("./styles/telegram.css");
@import url("./styles/dmit.css");
```

責任：

- `base.css`：全域 token、body、header、基礎元素
- `toolbar.css`：分類、搜尋、toggle、summary
- `cards.css`：通用 Service Card / Event
- `responsive.css`：手機、橫向、寬螢幕、安全區
- `layout.css`：單欄 / 雙欄 normal-flow
- `telegram.css`：DC 與全球探針
- `dmit.css`：DMIT 服務與線路 details

## 3. 資料流

一般服務：

```text
Service Plugin
→ Source Engine
→ Network
→ Parser / Service Parser Plugin
→ Normalize Result
→ Primary Source Result
→ Fallback Sources
→ Service Model
→ Cache
→ Query
→ Renderer
→ Card Template
```

第一階段先讀每個服務最高優先級來源，任何服務完成後立即更新自己的卡片。

第二階段只對資料仍不足的服務讀取 fallback，而且限制併發，避免一次建立太多 Reader 請求。

## 4. Source Priority

來源預設優先級：

```text
official-api            10
official-json           20
official-rss            30
official-history        40
official-status         50
official-announcement   60
official-backup         70
trusted-third-party     80
other-backup            90
```

Service Plugin 可用 `priority` 明確覆蓋。

## 5. Event 與 Health 不互相推斷

這是核心 invariant。

### Current health

只有來源本身提供目前健康狀態時才填：

```text
normal
incident
null
```

### Event status

事件狀態必須來自來源明示欄位。

支持的標準狀態包括：

```text
investigating
identified
monitoring
resolved
postmortem
maintenance
scheduled
in_progress
completed
degraded
outage
active
closed
```

沒有 status 就保持 `null`。

### Statuspage

Statuspage 使用兩條獨立 channel：

```text
/api/v2/incidents/unresolved.json
→ activeEvents

/api/v2/incidents.json
→ recentEvents
```

Recent 會排除 active ID，避免同一事件重複。

## 6. Query / Filter

`core/query.js` 負責：

- category
- search
- activeOnly
- Service order
- 跨境線路 carrier / route class 固定排序

搜尋會涵蓋：

- 服務名稱與說明
- Event title
- Telegram DC hostname / location / continent
- DMIT details
- Telegram 全球探針 region / DC / node / ASN

## 7. Cache

Cache 由 `core/cache.js` 單獨管理。

目前策略：

```text
fresh cache       <= 15 分鐘
stale cache       <= 24 小時
foreground refresh threshold = 2 分鐘
normal refresh interval       = 5 分鐘
```

每次版本更新會同步更新 `CONFIG.version`、asset query 與 cache key，避免新舊模組混用。

## 8. Telegram 全球探針

瀏覽器不直接建立 Check-Host 全球工作。

背景流程：

```text
GitHub Actions
→ scripts/telegram-global-probe.mjs
→ Check-Host machine nodes
→ DC1–DC5 TCP/443
→ data/telegram-global.json
→ Pages artifact
→ Browser reads JSON
```

全球完整巡檢：

```text
每小時 07 / 22 / 37 / 52 分
```

Check-Host 的 `429` 是探針供應商限流，不是 Telegram outage。

瀏覽器內的 DC1–DC5 WebSocket 直連與全球 Check-Host 探針是兩套獨立測量。



### DMIT public API

DMIT Service Plugin 使用 DOES DMIT FAIL? 公開 API，主來源 contract：

```text
/api/v1/status?locale=en
/api/v1/services?locale=en
/api/v1/incidents?locale=en
/status.json
```

`/status.json` 僅作 current-health fallback，不用來製造事件。

DMIT Parser 對 status / services 採結構容錯解析，但仍遵守：

- Health 只接受明確狀態或布林健康欄位。
- Event status 只接受事件本身明示 lifecycle status。
- Service details 可從巢狀 API 結構保留 Datacenter / Product Line / Route 上下文。
- API source link 指向 `https://does.dmit.fail/api-docs`。

## 9. 新增服務

新增服務的正常流程：

1. 建立 `assets/services/example.js`
2. 定義 Service metadata 與 sources
3. 如有特殊格式，在同一檔註冊 Parser Plugin
4. 把 `example` 加到 `assets/services/registry.js` manifest
5. 不修改 `core/source-engine.js`，除非真的新增「全新通用 Source Type」
6. 不修改 Card Template，除非新增「全新通用資料 channel」

這樣可避免服務專屬條件重新污染核心。

## 10. 模組依賴原則

允許：

```text
app
↓
core / ui
↓
parsers
↓
shared utils

registry
↓
service plugins
```

避免：

```text
service plugin → renderer internals
parser → UI DOM
CSS module → JS state
core → 某一個具名服務
```

DMIT / Telegram 的特殊呈現可由通用 channel（`details`、`checks`、`globalProbe`）交給 Card Template 處理。

## 11. 不使用 Build Tool

目前刻意不使用：

- npm bundle
- Vite
- Webpack
- Rollup

原因是 CloudStatus 本身是 GitHub Pages 靜態站，原生 ES Modules 已足夠。

因此部署 artifact 仍是可以直接託管的原始檔案，而不是編譯後 bundle。
