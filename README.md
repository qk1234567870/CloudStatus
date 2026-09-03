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

- `assets/config.js`：全域執行參數
- `assets/services.js`：服務註冊、manifest 與模組載入器
- `assets/services/*.js`：各服務來源設定
- `assets/app.js`：抓取、解析、事件合併、快取與 UI
- `assets/style.css`：全端響應式樣式


## 響應式版面

CloudStatus 不判斷裝置類型。版面只根據 `#services` 的實際可用寬度：

- 小於 600px：單欄
- 600px 以上：雙欄 Masonry
- 最大內容寬度：1180px


## 設定

所有常用全域設定集中在：

`assets/config.js`

可直接修改：
- 最大內容寬度
- 單欄 / 雙欄分界
- 卡片間距
- 雙欄 Masonry
- 自動更新週期
- 前景重新整理門檻
- 快取時間
- Fetch / Reader timeout
- fallback 並發數
- 最近事件顯示數量

固定版面原則：只要進入雙欄，就一律使用 Masonry 階梯補位。

各服務的網址、來源與解析器仍獨立放在 `assets/services/*.js`，避免全域設定與服務解析程式混成單一巨大檔案。


## v75 設定架構

`assets/config.js` 現在是真正的單一設定來源。

`app.js` 直接讀取：
- `basic`
- `layout`
- `refresh`
- `cache`
- `network`
- `display`

不再使用舊版相容 getter。

版面數值會由 `app.js` 自動寫入 CSS Variables，因此最大寬度、間距、左右留白、來源標籤寬度等不需要再同步修改 CSS。

固定規則：
- `< twoColumnMinWidth`：單欄
- `>= twoColumnMinWidth`：雙欄
- 只要雙欄且 `masonry: true`：一律階梯補位


## v76 響應式設定原則

單欄 / 雙欄的唯一門檻：

`assets/config.js` → `layout.twoColumnMinWidth`

CSS 不再保存第二份 560px / 600px / 1180px 版面門檻。

JS 行為：
- 實際容器寬度低於門檻：單欄正常文流
- 實際容器寬度達到門檻：雙欄 Masonry
- 雙欄卡片會補到目前較短的一欄
- Masonry 容器高度由 JS 按最長欄實際高度設定
