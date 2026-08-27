# CloudStatus

純 GitHub Pages 的全球雲端、AI、平台、Hosting、數據中心與骨幹網狀態聚合頁。

## 核心原則

CloudStatus 只顯示來源本身能證明的資料：

- 有結構化 `status` 才顯示狀態標籤
- 沒有 `status` 不猜、不補、不假設
- 「目前正常」與「近期已解決事件」可以同時存在
- 沒抓到事件不等於正常
- Reader 只作備援，不用通用關鍵字把整頁文字硬判成事件

## 來源優先級

```text
官方 API / 官方 JSON
→ 官方 RSS / Atom
→ 官方 Incident History
→ 官方 Status / Maintenance 頁
→ Reader
→ 專屬備援（例如 Telegram）
→ 官方頁入口
```

取得可靠事件後最多顯示最近 3 筆，不為了湊滿 3 筆加入導航、產品文案或無關文字。

## 專用解析器

16 個服務使用各自的 adapter / parser，而不是共用一個寬鬆全文關鍵字解析器。

特別處理：

- Apple：區分「所有服務正常」與「今天已解決事件」
- Google Cloud：官方 JSON 顯示歷史事件；官方 Status 頁顯示當前健康
- BandwagonHost：只抓事件卡片的標題、明確狀態與時間，不抓正文句子
- Oracle Cloud：排除 `網址來源`、導航與 History 頁文案
- NTT / Arelion / Cogent：排除 BGP、routing policy、outage-free 等產品與網路介紹文字
- DMIT：Telegram / HTML 無明確 status 時只顯示事件，不猜狀態

## 狀態

只有資料來源明確提供才顯示，例如：

```text
investigating → 調查中
identified    → 已確認
monitoring    → 監控中
resolved      → 已解決
maintenance   → 維護
```

RSS、Reader、Telegram 純文字沒有明確狀態時，事件前不顯示任何狀態標籤。

## 自動刷新

```text
首次開啟 → 立即刷新
前景每 5 分鐘 → 背景重新抓取
右上 ↻ → 強制刷新
iOS / Safari 回到前景且距上次刷新 ≥ 2 分鐘 → 補刷新
```

不使用整頁 `location.reload()`。

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

不包含 GitHub Actions、Python、`status.json`、`CNAME`、固定帳號、固定 Repo 或固定自訂域名。

## GitHub Pages

```text
Settings
→ Pages
→ Source: Deploy from a branch
→ Branch: main
→ Folder: /(root)
```

自訂域名請自行在 GitHub Pages 設定。

## 翻譯

事件保留來源原文。需要中文時使用瀏覽器整頁翻譯。


## v11：精修

本版主要針對顯示邏輯與行動版閱讀體驗精修：

- 「目前狀態」與「近期事件」分開呈現
- 服務目前正常時，仍可同時顯示近期已解決事件
- 若事件來源明確有未解決 status，不會同時標示為正常
- 多來源時右上角簡化成「多來源」，單一來源保留實際來源名稱
- 狀態顏色補齊 `postmortem / completed / closed / scheduled / active / in_progress`
- 手機版縮減來源文字佔位，避免擠壓服務名稱
- 自動刷新仍維持前景 5 分鐘、回到前景 2 分鐘門檻
