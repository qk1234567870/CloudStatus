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

已附 `CNAME`：

```text
cloudstatus.htbq.org
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
