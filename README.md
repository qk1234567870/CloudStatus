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


## v14：Apple System Status 精修

Apple 改用專用事件格式解析：

- 支援 `Resolved Performance`
- 支援 `Resolved Outage / Resolved Issue / Resolved Availability`
- 支援 `Today, 8:46 AM - 9:30 AM` 這類 Apple 時間區間
- `All services are operating normally` 只作為「目前狀態」
- `AppleCare on Device: available ...` 等服務清單永遠不當事件
- 目前正常與近期已解決事件可以同時顯示
- 仍然禁止從事件描述自行推斷 status


## v15：Apple 改用官方結構化 JSON

Apple 不再主要依賴 System Status 頁面的 Reader。

優先來源：

```text
Apple 官方 system_status_en_US.js
→ 官方 System Status 頁 Reader
```

官方 JSON 直接提供：

- `serviceName`
- `events`
- `eventStatus`
- `statusType`
- `epochStartDate`
- `epochEndDate`

因此可以直接取得 Apple 事件與開始/結束時間，不需要從網頁文字猜測。

`eventStatus` 才是狀態來源；`statusType` 只作事件類型資訊，不拿來推斷狀態。

例如 Apple 官方頁顯示：

```text
Maps Display - Resolved Performance
```

CloudStatus 會以結構化資料呈現：

```text
[已解決] Maps Display
```

並保留官方開始與結束時間。


## v17：Apple Pages/CORS 修正

Apple 在純 GitHub Pages 環境可能因瀏覽器 CORS 無法直接讀取官方 JSON。

現在 Apple 來源會：

```text
官方 JSON 直連
→ 若被 CORS 阻擋，改用 Reader 讀官方 JSON
→ 官方 System Status 頁 Reader
→ 官方頁入口
```

Apple System Status Reader 也改成 Markdown-aware：
會先移除 `###`、列表符號、粗體標記，再解析
`Maps Display - Resolved Performance` 等事件標題。


## v18：Apple 備援與時間邊界

- Apple 仍以官方 JSON / 官方 System Status 為最高優先。
- 只有官方來源無法取得可靠事件時，才使用 Pingoru Apple outage history 備援。
- 不用備援資料覆蓋已成功取得的官方事件。
- 修正 Apple epoch 秒 / 毫秒時間戳相容。
- 強化手機與桌面事件時間欄位的 max-width / overflow，避免日期超出卡片右邊界。
