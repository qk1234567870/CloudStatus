# CloudStatus Deployment

CloudStatus 是靜態 GitHub Pages 專案，但 Telegram 全球機器探針需要 GitHub Actions 先產生 `data/telegram-global.json`。

## GitHub Pages 設定

Repository：

```text
Settings
→ Pages
→ Build and deployment
→ Source
→ GitHub Actions
```

不要使用 `Deploy from a branch` 作為目前這套架構的主要部署模式，否則你可能同時看到 GitHub 內建 `pages-build-deployment` 與自訂 workflow。

自訂 workflow 名稱：

```text
CloudStatus Deploy + Telegram Probe
```

檔案：

```text
.github/workflows/pages.yml
```

## Workflow 觸發方式

### Push

`main` 分支有更新時執行。

### Schedule

Telegram 全球探針每 15 分鐘執行一次：

```cron
7-52/15 * * * *
```

也就是每小時：

```text
07
22
37
52
```

使用錯峰時間避免整點排程高峰。

### Manual

Actions：

```text
CloudStatus Deploy + Telegram Probe
→ Run workflow
```

可手動執行一次完整探針與部署。

## Workflow 流程

```text
Checkout
→ Probe Telegram globally
→ Show Telegram probe result
→ Configure Pages
→ Upload Pages artifact
→ Deploy Pages
```

目前 Actions：

```text
actions/checkout@v7
actions/configure-pages@v6
actions/upload-pages-artifact@v5
actions/deploy-pages@v5
```

## Telegram Probe

腳本：

```text
scripts/telegram-global-probe.mjs
```

輸出：

```text
data/telegram-global.json
```

它會：

- 從 Check-Host 取得當前機器節點。
- 依亞洲、歐洲、北美、南美、大洋洲、非洲分類。
- 每洲自動選可用節點。
- 對 Telegram DC1–DC5 官方 Web hostname 執行 TCP/443。
- DC 工作之間加入間隔。
- HTTP 429 / 5xx 使用 Retry-After、指數退避與 jitter 重試。
- 不把 Check-Host 429 視為 Telegram 故障。

`data/telegram-global.json` 是 workflow workspace 中產生並直接包含在 Pages artifact 的部署資料；不要求把每一輪探針結果 commit 回 repository。

## 自訂網域

套件不附 `CNAME`。

請直接在：

```text
Settings
→ Pages
→ Custom domain
```

設定自訂網域。

這樣更新 CloudStatus ZIP 時不會把現有網域設定覆蓋掉。

## 本機測試

因為前端使用 ES Modules，建議不要直接以 `file://` 開啟 `index.html`。

在 `CloudStatus` 目錄啟動簡單 HTTP Server，例如：

```bash
python3 -m http.server 8080
```

再用瀏覽器開啟：

```text
http://localhost:8080/
```

## 常見故障

### 同時看到兩個 Pages Workflow

如果看到：

```text
CloudStatus Deploy + Telegram Probe
pages-build-deployment
```

先確認 Pages Source 已設定成 `GitHub Actions`。

舊的 `pages-build-deployment` 歷史紀錄可以繼續存在；重點是不要讓 branch publishing 持續建立新的內建部署。

### Telegram 全球狀態顯示「尚未執行」

手動執行：

```text
Actions
→ CloudStatus Deploy + Telegram Probe
→ Run workflow
```

然後查看：

```text
Probe Telegram globally
Show Telegram probe result
```

### 顯示「來源限流」

代表 Check-Host 回傳 HTTP 429。

這是探針來源限制，不是 Telegram 故障。等待下一輪自動重試即可。

### 某洲顯示「本輪無可用節點」

表示該輪 Check-Host 節點清單沒有該洲可用機器節點。

不表示 Telegram 在該洲故障。

### 前端頁面正常，但 Telegram 全球資料沒更新

檢查：

1. Actions 是否仍有排程 run
2. `Probe Telegram globally` 是否成功
3. `Show Telegram probe result` 的 JSON
4. Pages deployment 是否成功
5. `data/telegram-global.json` 的 `generatedAt`

## 部署前檢查

建議至少確認：

```text
node --check assets/**/*.js
node --check scripts/telegram-global-probe.mjs
```

以及：

- `CNAME` 不在通用套件內
- Service Plugin 數量符合 Registry
- `CONFIG.version`、Registry loader version、HTML asset query、`version.json` 同步
- Cache key 隨版本更新


## DMIT API

DMIT 前端直接讀取 `https://does.dmit.fail/api/v1/*` 公開 JSON API。

官方 API 文件：

```text
https://does.dmit.fail/api-docs
```

API 不需要 Key；官方文件目前標示 60 requests/min。CloudStatus 的正常 5 分鐘刷新遠低於此限制。

若 DMIT API 無法由瀏覽器取得，DMIT 卡片保持未知／無可靠資料，不再回退到舊 Server Status 或 Telegram 公告。
