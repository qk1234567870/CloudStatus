# CHANGELOG

CloudStatus 版本更新記錄。

## v46.0.0

- 新增全服務通用的 `source.url -> service.page` 自動繼承機制。
- 當某個資料來源與服務官方 `page` 完全相同時，服務模組不再重複寫 `url`。
- 已同步整理 Oracle Cloud、Cloudflare、GitHub、OpenAI、Google Cloud、AWS、Azure、DMIT、BandwagonHost、Equinix、Digital Realty、NTT GDC、Arelion、NTT Global Network、Cogent。
- 若來源有獨立 API / RSS / incidents / history 網址，仍保留自己的 `url`。
- 執行層另外保留一次防禦式 fallback，避免缺少 `url` 時抓取失敗。
- 所有資源同步更新至 `v46.0.0`。

## v45.0.0

- 修正 DMIT Security Response 的資料分類。
- `dmit-abuse-team-temp-security-response.dmit.com` 屬於安全通知頁，不再視為事件來源。
- 移除該來源的事件解析與事件抓取邏輯，避免 `DMIT network incident advisory` 被列入最近事件。
- DMIT 事件仍由官方 Server Status 與官方 Telegram 等真正事件來源取得。
- 所有資源同步更新至 `v45.0.0`。

## v44.0.0

- 整體最大寬度維持 `1180px`。
- 改為依「實際內容容器寬度」自適應，不再依裝置名稱或螢幕類型判斷。
- 容器 `<=720px`：單欄。
- 容器 `>720px`：雙欄 Masonry 階梯式自動補位。
- 1080p、2K、4K、超寬螢幕都維持 1180px 內容上限並自動置中。
- 分割視窗、瀏覽器縮放、手機橫直切換會即時重新排版。
- 不再產生 3/4 欄，避免卡片布局混亂。
- 所有資源同步更新至 `v44.0.0`。

## v43.0.0

- 修正 v42 卡片布局混亂。
- 原因：1180px 容器仍套用動態 3/4 欄計算，導致卡片過窄並與既有 Masonry 規則衝突。
- 現在固定為：手機 `<=720px` 單欄；其餘設備雙欄 Masonry。
- 仍保留視窗縮放、橫直切換與全端寬度自適應。
- 整體最大寬度維持 `1180px`。
- 所有資源同步更新至 `v43.0.0`。

## v42.0.0

- 整體頁面最大寬度固定回 `1180px`。
- 保留 v41 全端全設備自適應與 Masonry 自動補位。
- 手機仍為單欄；其他設備依 1180px 容器內的實際可用寬度自適應。
- 所有資源同步更新至 `v42.0.0`。

## v41.0.0

- 全端、全設備自適應。
- 手機保持單欄。
- 平板與一般桌面依可用寬度自動進入雙欄。
- 更寬桌面自動增加至 3 欄，超寬螢幕最多 4 欄。
- 2 欄以上全部使用最短欄優先的階梯式 Masonry 自動補位。
- 外層容器改為流體寬度，最大 1600px。
- 加入 ResizeObserver，縮放視窗、分割畫面、橫直切換時即時重新排版。
- 所有資源同步更新至 `v41.0.0`。

## v40.0.0

- 整體頁面最大寬度由 `1180px` 加寬至 `1360px`。
- 雙欄卡片因此同步加寬，階梯式自動補位邏輯不變。
- 手機仍維持 100% 自適應，不產生橫向溢出。
- 所有 CSS / JS 資源版本同步更新為 `v40.0.0`，手機與桌面端同步取得新版。

## v39.0.0

- 修正手機端已更新、桌面瀏覽器仍顯示舊版時間格式的快取問題。
- `index.html` 的本地 CSS/JS 資源全部加入版本參數 `?v=39.0.0`。
- HTML 加入 no-cache 標記。
- localStorage 快取鍵更新為 `cloudstatus-cache-v39`。
- 桌面端重新載入後會取得新版 `app.js`，左上角「最後讀取於」會顯示年份。

## v38.0.0

- 左上角「最後讀取於」時間加入年份。
- 快取時間「快取於」同步加入年份。
- 例如：`最後讀取於 2026/8/29 23:06`。

## v37.0.0

- README 與更新日誌正式分離。
- `README.md` 只保留專案說明、部署與結構資訊。
- 所有版本更新內容集中到 `CHANGELOG.md`。

## v36：事件時間顯示年份

事件時間由原本的 `8/29 22:14` 改為包含年份，例如：

`2026/8/29 22:14`

同一天的起訖時間則顯示為：

`2026/8/29 18:04-20:12`

## v35：服務解析器模組化 + 全域事件規則

### 全域事件規則
事件是否成立，不再要求一定要有日期或狀態：

- 明確是官方 Incident / Maintenance / Outage / Advisory → 可以收錄。
- 沒日期 → 時間留空。
- 沒狀態 → 狀態留空。
- 不自行補造日期或狀態。
- 普通說明文字仍會被過濾。

### DMIT 完整模組化
`assets/services/dmit.js` 現在同時負責：
- DMIT 服務設定。
- Server Status 解析。
- Security Response 解析。
- Telegram 公告解析。
- Security Response 直接抓取 + Reader fallback。

Telegram parser 也已加強，只抓公告標題，不再把
`We apologize for any inconvenience...`
這類正文當成獨立事件。

核心 `app.js` 新增 parser registry；其他服務可以逐個把解析器搬進自己的 module，
不用再往 app.js 疊服務特例。

## v34：服務模組化

服務設定已由單一 `assets/services.js` 拆成獨立模組。

結構：

```text
assets/
├─ services.js              # 只負責服務註冊
└─ services/
   ├─ cloudflare.js
   ├─ aws.js
   ├─ azure.js
   ├─ google-cloud.js
   ├─ github.js
   ├─ openai.js
   ├─ apple.js
   ├─ oracle.js
   ├─ bandwagonhost.js
   ├─ dmit.js
   ├─ equinix.js
   ├─ digital-realty.js
   ├─ ntt-gdc.js
   ├─ arelion.js
   ├─ ntt-global-network.js
   └─ cogent.js
```

每個服務自己的名稱、分類、官方頁、parser 名稱與來源優先級都放在自己的檔案。
新增或修改服務時，不再需要編輯一個巨大的服務清單。

此版本仍是純靜態 GitHub Pages，不需要 build、Node.js 或 GitHub Actions。

## v33：DMIT Security Advisory 修正

- 修正 Security Response 頁面沒有日期時被整筆丟棄的問題。
- 明確識別 `DMIT network incident advisory` 為事件。
- 頁面沒有日期就不顯示時間，不捏造日期。
- `identified potentially risky applications` 是正文描述，不把 identified 誤判為事件狀態。
- Security Response 優先於 Telegram 公告補入 DMIT 最近事件。

## v32：加入 DMIT Security Response 事件來源

新增官方來源：

- https://dmit-abuse-team-temp-security-response.dmit.com/
- 顯示名稱：官方 Security Response
- 分類：官方公告 / Security Response
- 會納入 DMIT 最近 3 筆事件

解析規則：
- 只接受帶有明確日期/時間的事件記錄。
- 不把頁面標題、欄位名、說明文字當事件。
- 只有來源明確出現 Investigating / Resolved / Completed 等狀態時才顯示狀態。
- 沒有明確 status 時保持無狀態，不自行推斷。

DMIT 來源順序：
1. 官方 Server Status
2. 官方 Security Response
3. 官方 Telegram 公告

## v31：雙欄以上全部階梯式自動補位

- <= 720px：單欄，正常向下排列。
- > 720px：只要進入雙欄，就啟用真正 Masonry。
- 每張新卡片都放到目前高度較短的一欄。
- 平板雙欄、手機橫向進入雙欄、桌面雙欄都會自動補空位。
- 不再因為同一列另一張卡片較高而留下大片空白。

## v30：真正自適應版

- 手機 <= 720px：單欄。
- 平板 / 中等視窗 721–1100px：自適應雙欄。
- 桌面 > 1100px：固定雙欄 + 真正 Masonry 自動補位。
- 觸控裝置即使瀏覽器要求「桌面網站」，也不啟用絕對定位 Masonry。
- 視窗尺寸改變時會重新計算布局。

## v29：桌面真正自動補位

v28 的 CSS Grid dense 仍受網格列佔位限制，所以短卡片下方可能保留空白。
v29 改成真正 Masonry：每張新卡片直接放到當下高度較短的那一欄。
因此像 Azure 較短、Google Cloud 較高時，下一張卡片會直接補到 Azure 下方。

## v28：桌面端卡片自動補位

- 桌面端仍固定兩欄。
- 卡片高度不同時，自動往上補空位。
- 不再因同一列較高卡片而在另一欄留下大片空白。
- 手機端維持單欄，不使用 Masonry。
- 平板仍採原本自適應佈局。

## v27：事件原文模式

- UI / 狀態標籤：繁體中文
- 事件標題與事件內容：來源原文，不做機器翻譯
- 第三方備援：同樣保留來源原文
- 品牌名稱：官方名稱
- 時間：台灣時間
- 如需翻譯，交由瀏覽器整頁翻譯

## v26：載入速度重構

v25 的問題是每個服務完成都重繪整頁，而且所有備援來源仍可能同時啟動，體感反而更慢。

v26 改為：

1. 有 15 分鐘內快取時，頁面立即顯示上次結果。
2. 第一階段只抓每個服務最高優先級來源，16 個服務並行。
3. 第一階段完成後立即顯示主要資料。
4. 第二階段只對資料不足的服務補抓備援。
5. 備援最多同時 4 個，避免 Safari / 瀏覽器連線被大量 Reader 請求塞滿。
6. 完成後更新快取。

來源優先級、狀態零推斷、最近 3 筆事件規則均不變。

## v25：載入速度優化

- 服務完成後立即顯示，不再等待全部服務抓取完成。
- 同一優先級來源改為並行抓取。
- 不改變來源優先級與事件判定規則。
- 官方資料已完整時仍會停止不必要的第三方備援請求。

## v24：事件時間統一放下一行

桌面端與手機端使用相同事件排版：

- 第一行：狀態 + 事件標題
- 第二行：事件時間靠右
- 桌面固定雙欄維持不變
- 長標題與時間不再互相擠壓或超出卡片

## v23：Google Cloud / DMIT 時間顯示修正

- 桌面固定雙欄時，事件時間改放第二行靠右，不再與 Google Cloud 長標題互相擠壓。
- DMIT 不再把 `Impact:`、`Additional...`、項目符號等公告正文當成獨立事件。
- DMIT 只保留真正的公告標題，並在公告前後範圍尋找時間。
- 日期解析增加 ISO、`YYYY/MM/DD HH:mm` 與英文月份格式。

## v22：桌面端固定雙欄

- 桌面寬度 ≥ 981px：固定兩欄，每欄 50% 可用寬度。
- 平板 641–980px：保留自適應 1～2 欄。
- 手機 ≤ 640px：維持單欄卡片。
- 事件標題與時間都有獨立寬度限制，避免雙欄時互相擠壓或越界。

## v21：六個網路 / 資料中心服務來源精修

本版針對先前容易落入「官方頁入口」的六個服務逐家處理：

- Equinix：官方 Statuspage API → 官方 RSS → Incident History → Status。
- Digital Realty：官方 System Status → 官方 Status & Maintenance。
- Cogent：官方 Network Status / Network Event Board → 官方 Maintenance 資訊。
- NTT Global Network：加入 NTT DOCOMO BUSINESS Global IP Network 官方 Outages / Maintenance。
- NTT GDC、Arelion：沒有確認到可公開、免登入且可靠的結構化事件源時，不製造事件；保留官方來源與官方頁入口。

另外 Reader 現在只會在官方頁**明確寫出** `There are no issues`、`All services are operating normally` 等文字時建立「目前正常」健康狀態；仍然不根據關鍵字猜測事件 status。

## v20：自適應卡片

卡片不再使用固定桌面/手機尺寸，而是由 CSS Grid `auto-fit + minmax()` 自動匹配可用寬度。

- 桌面：自動多欄
- 平板：依寬度自動 1～2 欄
- 手機：固定單欄
- 手機事件列會把時間移到第二行，避免右側越界
- 無 status 的事件會自動切成「標題 + 時間」兩行
- 超窄手機服務來源會自動換到第三行

## v19：全服務來源優先級統一

所有服務現在使用同一套「可信度層級」，但不強迫每家公司一定要有相同格式的來源。

```text
1. 官方 API
2. 官方 JSON
3. 官方 RSS / Atom
4. 官方 Incident History
5. 官方 System Status / Health / Network Status
6. 官方公告頻道（例如官方 Telegram）
7. 官方備援狀態頁
8. 可信第三方事件資料
9. 其他備援
10. 全部自動來源不可用 → 官方頁入口
```

注意：`Reader` 只是「讀取方式」，不是可信度層級。
例如「官方 Status 頁經 Reader 解析」仍屬於官方 Status，而不是第三方。

各服務只使用它實際存在的來源，例如：

```text
GitHub
官方 API → 官方 Status → 官方頁入口

AWS
官方 RSS → 官方 Health Dashboard → 官方頁入口

Google Cloud
官方 JSON → 官方 Status → 官方頁入口

Apple
官方 JSON → 官方 System Status → Pingoru 備援 → 官方頁入口

DMIT
官方 Server Status → 官方 Telegram 公告 → 官方頁入口
```

第三方來源永遠不能排在任何官方來源之前，也不會覆蓋已取得的官方事件；只在官方資料不足時補足最近事件。

## v18：Apple 備援與時間邊界

- Apple 仍以官方 JSON / 官方 System Status 為最高優先。
- 只有官方來源無法取得可靠事件時，才使用 Pingoru Apple outage history 備援。
- 不用備援資料覆蓋已成功取得的官方事件。
- 修正 Apple epoch 秒 / 毫秒時間戳相容。
- 強化手機與桌面事件時間欄位的 max-width / overflow，避免日期超出卡片右邊界。

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

## v14：Apple System Status 精修

Apple 改用專用事件格式解析：

- 支援 `Resolved Performance`
- 支援 `Resolved Outage / Resolved Issue / Resolved Availability`
- 支援 `Today, 8:46 AM - 9:30 AM` 這類 Apple 時間區間
- `All services are operating normally` 只作為「目前狀態」
- `AppleCare on Device: available ...` 等服務清單永遠不當事件
- 目前正常與近期已解決事件可以同時顯示
- 仍然禁止從事件描述自行推斷 status
