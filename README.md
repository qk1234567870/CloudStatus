# CloudStatus Pure GitHub Pages

純 GitHub Pages 版本，不使用 GitHub Actions、Python、status.json。

## 來源優先級

每個服務都有自己的 `sources`：

```text
1. 官方 API / JSON / RSS
2. 官方狀態頁
3. Jina Reader
4. 服務專屬備援
5. 官方狀態頁入口
```

只有所有自動來源都失敗時，才顯示：

```text
[官方狀態頁] 自動來源不可用，查看官方即時狀態 →
```

不會把來源問題誤判成服務故障。

## DMIT

```text
官方 server status
→ Reader
→ Telegram DMIT_INC 備援
→ 官方頁
```

## 相容性

不使用 ES Module / import。

```html
<script src="./assets/services.js"></script>
<script src="./assets/app.js"></script>
```

因此 iOS Safari、內建 WebView、Scriptable WebView 相容性比上一版高。

## 自動刷新

瀏覽器每 60 秒重新執行完整來源優先級。

## 部署

GitHub Pages：

```text
Settings
→ Pages
→ Source: Deploy from a branch
→ Branch: main
→ /(root)
```

## Reader 誤判修正

Reader 不再單純看到 `outage / routing / network / BGP` 就當成事件。

已新增：

```text
否定詞過濾
No network outages
No active incidents
Outage-free
100% outage-free
All systems operational
Operating normally
```

以及：

```text
產品/文件內容過濾
BGP communities
Routing policies
Network overview
Product overview
Guaranteed
```

NTT Global Network、Arelion、Cogent、NTT GDC 另外有服務專屬規則，避免把產品介紹或路由文件誤判成事故。


## v4：全服務 Parser Policy

本版不再只對 NTT / Arelion / Cogent 做特判。

所有已配置服務都有自己的 `accept` / `reject` 規則：

- Cloudflare
- AWS
- Microsoft Azure
- Google Cloud
- GitHub
- Apple
- Oracle
- BandwagonHost
- DMIT
- Equinix
- Digital Realty
- NTT GDC
- Arelion
- NTT Global Network
- Cogent

處理流程：

```text
官方 API / Feed
→ 官方頁
→ Reader
→ 專屬備援
→ 服務專屬 Parser Policy
→ 去重 / 排序
→ 最近 3 筆
→ 官方狀態頁
```

Reader 現在只負責取得來源文字；事件判定交給各服務自己的 Parser Policy。


## v5：多來源事件聚合

本版不再採用「第一個成功來源就停止」。

流程：

```text
官方 API / JSON
官方 RSS
官方事件頁 / History
Reader
官方公告 / Telegram 等備援
        ↓
全部嘗試
        ↓
事件標準化
        ↓
各服務 Parser Policy
        ↓
可信度評分
        ↓
跨來源去重
        ↓
衝突時優先採用高可信來源
        ↓
活動事件優先 + 時間排序
        ↓
最近 3 筆
```

來源狀態分為：

```text
events_found
explicit_normal
no_event_data
parse_failed
fetch_failed
```

`HTTP 200` 不等於正常；「沒有解析到事件」也不會自動判成正常。

可信度大致為：

```text
官方 API / JSON       100
官方 RSS               92
官方頁                 82
Reader                 72
Telegram               68
官方社群               62
第三方                 48
```

只有有明確正常訊號的來源才可產生 `[正常]`。
所有來源既沒有事件、也沒有明確正常訊號時，最後才退到官方狀態頁入口。


## v7：智能自動刷新

- 首次開啟：立即抓取
- 每 5 分鐘：頁面在前景時背景刷新
- 右上 ↻：強制立即刷新
- iOS 回到前景：距離上次成功刷新 ≥ 2 分鐘時自動補刷新
- 不整頁 reload，只更新資料
- `最後讀取於` 只在本輪資料成功完成後更新


## v8：狀態零推斷

只有實際抓取來源明確提供的結構化 status 才顯示狀態標籤。

- 官方 API / JSON 有 status：保留並翻譯顯示
- 官方頁有獨立 status 欄位：保留
- RSS / Reader / Telegram / HTML 純文字沒有 status：不猜、不顯示
- 不再因 title 出現 outage / maintenance / resolved 等字樣自行判定狀態
- 不再因缺少 end time 自行標記為「調查中」

## v9：UI 狀態文字整理

- 頁面自身的載入狀態統一使用「載入中…」，不再使用「處理中」。
- 官方 `investigating` 僅在來源明確提供時顯示為「調查中」。
- 未知/缺少 status 不再以「處理中」作預設值。
- 通用套件不包含 CNAME 或任何使用者自訂網域。
