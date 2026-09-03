# CloudStatus

純靜態 GitHub Pages 服務狀態面板，不需要後端或 GitHub Actions。

## 結構

- `index.html`：只保留頁面骨架
- `assets/config.js`：所有可調設定與功能開關
- `assets/app.js`：資料解析、渲染、快取、刷新與 Masonry 佈局
- `assets/services.js`：服務模組註冊器 / 載入器
- `assets/services/*.js`：各服務資料源設定
- `assets/style.css`：單一乾淨樣式層

## 響應式

版面不判斷手機、平板或橫直屏，只看 `#services` 的實際寬度。

- `< 560px`：單欄
- `>= 560px`：固定雙欄 Masonry
- 雙欄採「目前最短欄優先」放置，因此卡片會自動階梯補位
- 最大內容寬度預設 1180px

以上門檻、欄距、最大寬度都在 `assets/config.js` 修改。

## Config

`assets/config.js` 是唯一設定入口：

- `features`：所有 UI / 功能開關
- `layout`：最大寬度、雙欄門檻、欄距
- `refresh`：自動刷新與回前景刷新門檻
- `cache`：快取設定
- `network`：請求超時、Reader 超時、備援併發
- `events`：最近事件數量與保留上限
- `filters`：分類清單
- `crossborderSort`：跨境線路排序
- `statusLabels`：事件狀態文字
- `text`：頁面 UI 文字

資料來源仍放在 `assets/services/*.js`，避免 UI 設定與來源邏輯混在一起。
