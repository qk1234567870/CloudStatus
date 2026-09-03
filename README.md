# CloudStatus

純 GitHub Pages 前端版的全球雲端、平台、Hosting、資料中心與骨幹網服務狀態頁。

## 核心顯示規則

每個服務分成兩個互相獨立的資訊層：

1. **目前狀態**
   - 只有來源本身明確提供 current health / status 時才顯示。
   - 不會因為歷史事件名稱、正文文字或關鍵字推斷目前狀態。
   - 因此「目前正常」可以和「今天曾發生、現已解決的事件」同時存在。

2. **最近事件**
   - 最多顯示最近 3 筆可靠事件。
   - 少於 3 筆就照實顯示，不硬湊。
   - 每一筆事件的狀態只採用來源明確提供的 status。
   - 沒有明確 status 時不自行標記成「處理中」「已解決」等狀態。

## 資料來源原則

來源按各服務實際可用性配置，優先使用可結構化、可追溯的官方資料：

- 官方 API / JSON
- 官方 RSS / Atom / Feed
- 官方事件歷史
- 官方狀態頁
- Reader / 專屬備援只用來補足資料，且必須通過事件過濾

若自動來源無法取得可靠事件，直接提供官方狀態頁入口，不把普通頁面正文、導航、說明文字偽裝成事件。

## 更新

- 頁面開啟後直接向來源讀取資料。
- 前景狀態約每 5 分鐘自動更新。
- 頁面從背景返回前景且資料已超過更新門檻時會重新讀取。
- 不需要 GitHub Actions 定時抓取事件。
- GitHub Pages 只負責託管靜態網站。

## 部署

將 `CloudStatus` 目錄內檔案放到 GitHub Pages 發佈來源即可。

自訂網域由 GitHub Pages Repository Settings 設定；本套件不附帶固定 `CNAME`，避免覆蓋你現有的 Pages 網域設定。

## 原則

**不推斷、不造假、不硬湊三筆。**

頁面只顯示來源能明確支持的目前狀態與事件資料。


## 更新記錄

版本更新內容已獨立至 [`CHANGELOG.md`](./CHANGELOG.md)，README 不再混入逐版更新日誌。


## 程式架構

- `assets/services.js`：服務註冊、manifest 與模組載入器
- `assets/services/*.js`：各服務來源設定
- `assets/app.js`：全域設定、抓取、解析、事件合併、快取與 UI
- `assets/style.css`：全端響應式樣式

## 卡片模板架構

- `assets/services/*.js`：只負責每個服務的來源與資料設定。
- `assets/templates/service-card.js`：統一服務卡片模板。
- `assets/templates/event-item.js`：統一事件項目模板。
- `assets/renderer.js`：將標準化 Service Model 套用模板並輸出到 DOM。
- `assets/app.js`：抓取、解析、快取、刷新、篩選與狀態邏輯。

服務模組不再負責版面；修改卡片外觀只需要調整模板與 CSS。
