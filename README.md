# CloudStatus

純 GitHub Pages 的雲端、AI、數據中心、骨幹網與 Hosting 狀態聚合頁。

不使用 GitHub Actions、不使用 Python、不生成 `status.json`。所有資料都由瀏覽器直接讀取公開來源。

## 目前功能

- 16 個服務
- 每個服務最多顯示最近 3 筆有效事件
- 依來源優先級補足事件
- 各服務獨立 Parser Policy
- Reader / HTML 嚴格垃圾過濾
- 跨來源去重
- 不為了湊滿 3 筆而加入低可信內容
- 來源沒有明確 `status` 時不推斷狀態
- 每 5 分鐘背景刷新
- iOS / Safari 回到前景後自動補刷新
- 搜尋、分類、只看異常
- 不整頁重新載入

## 來源優先級

來源不是全部同級，也不是第一個成功就結束。

```text
1. 官方 API / 官方結構化 JSON
2. 官方 RSS / Atom
3. 官方 Incident History / History Feed
4. 官方 Status / Maintenance / Notice 頁
5. Jina Reader 讀官方頁
6. 官方 Telegram / 公告 / 服務專屬備援
7. 其他低優先級備援
8. 官方狀態頁入口
```

程式會按照層級補足有效事件。

例如：

```text
官方 API 找到 2 筆
→ 再嘗試 RSS / History 補第 3 筆

已取得 3 筆可靠事件
→ 停止向下使用低可信來源

最終只有 1 筆可靠事件
→ 就只顯示 1 筆
```

不會用導航文字、產品介紹或無關內容硬湊成 3 筆。

## 事件判定

每個服務都有自己的 Parser Policy。

目前包含：

- Cloudflare
- AWS
- Microsoft Azure
- Google Cloud
- GitHub
- OpenAI
- Apple
- Oracle Cloud
- BandwagonHost
- DMIT
- Equinix
- Digital Realty
- NTT GDC
- Arelion
- NTT Global Network
- Cogent

Reader 只負責取得文字；是否為事件由服務自己的規則判定。

全域還會排除常見垃圾內容，例如：

```text
No known service issues
Recent incidents
Past incidents
View All
Subscribe
Email / SMS notifications
RSS / Atom / Webhook
Privacy / Terms
Powered by
Markdown 標題與純連結
BGP communities
Routing policies
產品介紹與導航文字
```

## 狀態規則

CloudStatus 不再自行猜事件狀態。

```text
來源明確提供結構化 status
→ 保留來源 status
→ UI 只做中文顯示

來源沒有明確 status
→ status = null
→ 不顯示狀態標籤
```

因此不會再出現：

```text
看到 outage → 自動猜「服務中斷」
看到 maintenance → 自動猜「維護中」
沒有 end time → 自動猜「調查中」
RSS item → 自動標「已解決」
```

只有來源本身提供狀態時才顯示，例如：

```text
investigating → 調查中
identified    → 已確認
monitoring    → 監控中
resolved      → 已解決
postmortem    → 事後分析
```

如果來源只有事件標題而沒有狀態，就只顯示事件標題。

## 正常狀態

「抓不到事件」不等於「服務正常」。

只有來源明確提供正常訊號時，才顯示：

```text
[正常]
```

如果所有自動來源都沒有可靠事件，也沒有明確正常訊號，則退回：

```text
[官方狀態頁] 查看官方即時狀態 →
```

## 自動刷新

```text
首次開啟
→ 立即抓取

每 5 分鐘
→ 頁面在前景時背景刷新

右上 ↻
→ 強制立即刷新

iOS / Safari 回到前景
→ 若距離上次成功刷新 ≥ 2 分鐘
→ 自動補刷新
```

不使用 `location.reload()`，不會整頁重載。

`最後讀取於` 只會在本輪資料刷新完成後更新。

## 專案結構

```text
CloudStatus/
├── index.html
├── assets/
│   ├── app.js
│   ├── services.js
│   └── style.css
├── README.md
└── version.json
```

不包含：

```text
.github/workflows/
Python
requirements.txt
status.json
CNAME
任何固定 GitHub 帳號
任何固定 Repository 名稱
任何固定自訂網域
```

## 部署到 GitHub Pages

Repository 設為：

```text
Settings
→ Pages
→ Source: Deploy from a branch
→ Branch: main
→ Folder: /(root)
```

如果要使用自訂域名，請自行到：

```text
Settings
→ Pages
→ Custom domain
```

設定自己的域名。

## 翻譯

CloudStatus 不內建 DeepL 或 Google Translate。

事件內容保留來源原文，需要翻譯時直接使用瀏覽器整頁翻譯。
