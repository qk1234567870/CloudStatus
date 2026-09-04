# CHANGELOG

CloudStatus 版本更新記錄。

## v77.0.0

- 完全移除 JavaScript absolute Masonry Engine。
- 桌面 / 足夠寬度橫屏改成兩個獨立 DOM 欄，每欄使用正常文件流。
- 卡片不再計算 `top / left / grid height`，Safari 捲動、工具列收合與非同步高度變化不再依賴 Y 座標重算。
- 雙欄依原始服務順序交錯分配：1/3/5… 左欄，2/4/6… 右欄。
- 760px 以下直接輸出原始服務順序的單欄，不使用雙欄 DOM。
- ResizeObserver、resize、VisualViewport、設備旋轉只在單欄/雙欄模式跨越 760px 時重新生成服務 DOM。
- 保留 v76 Layout Engine / Render Scheduler、v74 Header 左對齊、v73 動態更多與單一卡片模板。
- 23 個服務模組保持不變。

## v76.0.0

- 重構桌面/橫屏 Layout Engine：首頁所有區塊只使用 `.shell` 實際 content width。
- 移除首頁所有 `100vw - Npx` 寬度計算，避免 Safari 橫屏 layout viewport / visual viewport 不一致造成右側溢出。
- Safe Area 改由 body 單一管理，Header、分類、搜尋、統計、Services 全部受同一寬度邊界約束。
- 加入 VisualViewport resize/scroll 監聽，Safari 工具列收合、橫屏旋轉與可視區變化時重新計算分類與 Masonry。
- 新增 Render Scheduler，以 requestAnimationFrame 合併非同步服務更新，減少連續 DOM 重建與卡片跳動。
- 一般服務強制維持註冊順序；跨境線路篩選保留既定運營商/線路級別排序。
- 卡片 DOM 只有內容或順序真正變化時才重建。
- v75 Masonry、v74 Header 左對齊、v73 動態更多與卡片模板全部保留。

## v75.0.0

- Desktop Masonry 完整重構；不再使用 `position: relative + left/top` 偏移。
- 桌面卡片改為真正 `position: absolute`，每張卡直接定位於目前最短欄，消除右欄大面積空白。
- 採兩階段排版：先固定欄寬，等待 Container Query / 文字換行生效，再測量實際高度與定位。
- 使用 `offsetHeight` 取得穩定卡片高度，避免 subpixel / transform 造成累積誤差。
- 加入 layout token，舊的 requestAnimationFrame 排版不會覆蓋新的排版結果。
- 760px 以下強制回到正常文件流單欄，完全不使用 absolute Masonry。
- resize、ResizeObserver、設備旋轉、pageshow、字型載入完成後都會重新計算 Masonry。
- v74 標題與快取狀態靠左、v73 動態更多、卡片模板與 23 個服務模組全部保持不變。

## v74.0.0

- 首頁標題固定對齊內容區最左側。
- 「最後讀取於」與「快取於」共用相同左對齊基準。
- 刷新按鈕改為右上絕對定位，不再參與標題排版或推動標題位置。
- 手機、橫屏、平板與桌面套用相同對齊規則。
- v73 分類動態「更多」、統計卡與服務卡片保持不變。

## v73.0.0

- 首頁結構正式重構，卡片模板與 23 個服務模組保持不動。
- 分類列改為依「按鈕實際渲染寬度」動態計算，不使用固定分類數或文字字數估算。
- 空間不足時，最右側分類自動收入「更多⌄」浮動選單；空間充足時自動移回主列。
- 全部分類可直接容納時，「更多」自動隱藏。
- 點擊更多分類後正常篩選並保留選中狀態；點擊外部自動關閉。
- ResizeObserver + resize + orientationchange 同步處理視窗縮放與設備旋轉橫屏。
- 分類膠囊固定單行橫排，禁止中文字逐字換行。
- 搜尋框與「只看異常」保持同一行自適應。
- 三個統計區恢復為有邊框、等寬、三欄卡片。
- 修正先前首頁 CSS selector 與實際 HTML class 名稱不一致造成的響應式異常。
- 手機、平板、桌面、橫屏、分割視窗與 2K/4K 共用同一套首頁邏輯。

## v72.0.0

- 卡片保持 v71 不動，本版只重做首頁上半部響應式。
- 主標題改為獨立 Grid；刷新按鈕固定右側，最後讀取時間固定下一行。
- 中文主標題使用 `word-break: keep-all`，避免「狀態」被拆成單字直排。
- 分類列強制水平排列、不可逐字換行；超出寬度時水平滑動。
- 搜尋框與「只看異常」保持同一行並自適應寬度。
- 23 / 自動取得 / 官方頁備援三個統計卡固定保留卡片外框與三欄排列。
- 手機直向、超窄手機、平板與橫屏旋轉分別使用獨立尺寸規則。
- 橫屏手機主標題維持單行，分類按鈕保持膠囊橫排。
- 桌面 1180px 與雙欄 Masonry 保持不變。

## v71.0.0

- 全端全設備自適應重構：手機、平板、桌面、2K/4K、直向與橫向旋轉皆使用同一套規則。
- 將頁面級響應式與卡片模板響應式分離，避免卡片 CSS 影響頂部工具列、分類、搜尋與統計卡。
- 旋轉至橫屏時自動降低垂直密度，分類按鈕維持橫向膠囊，不再逐字換行。
- 主標題在橫屏手機維持單行；直向窄螢幕則自然縮放。
- 統計卡固定維持三欄，邊框與背景不再消失。
- 卡片仍採 Container Query，依卡片實際寬度調整事件與字級。
- Footer 固定同一行：左側資料來源、右側更新時間，永不換行。
- 支援 iPhone/瀏海/動態島安全區左右 inset。
- 桌面仍維持 1180px 置中與現有雙欄 Masonry。
- 23 個服務模組與單一卡片模板架構保持不變。

## v70.0.0

- Footer 改為「自適應但永不換行」。
- `資料來源` 固定左側、`更新時間` 固定右側，同一行顯示。
- 字體、左右 padding 與欄間距依卡片寬度自動縮放。
- 移除 420px 以下 Footer 上下堆疊規則。
- 360px 以下進一步壓縮字體與間距，但仍維持單行。
- 其他卡片、事件與服務模組邏輯不變。

## v69.0.0

- `style.css` 完整重寫，不再追加歷代 CSS 補丁。
- 刪除舊版事件排版規則衝突，事件狀態標籤與標題只保留一套 Grid。
- 事件時間取消截斷與省略號，完整靠右顯示。
- 右上來源維持移除，只保留 Footer 左下資料來源。
- 卡片使用 Container Query 自適應，420px 以下狀態標籤自動獨立一行。
- 手機單欄、桌面 Masonry、23 個服務模組與既有資料邏輯保留。

## v68.0.0

- 卡片模板改為完整 Container Query 自適應，手機、橫屏、平板、桌面、2K/4K 共用同一模板。
- 移除卡片右上角來源文字；資料來源只保留 Footer 左下。
- 事件狀態標籤與標題改為固定雙欄結構，避免任何重疊。
- 420px 以下自動改成狀態標籤獨立一行、事件標題下一行。
- 事件時間永遠完整顯示並靠右，不再截斷。
- Footer 在一般寬度維持左來源 / 右更新時間；窄螢幕自動堆疊。
- 服務名稱、副標、事件標題、時間全部取消 ellipsis / line-clamp。
- 橫屏手機自動降低卡片垂直間距。
- 保留單一卡片模板與 23 個服務模組架構。

## v67.0.0

- 卡片模板新增完整內部自適應，不再只依賴外層 Masonry。
- 事件標題取消單行截斷與 `...`，手機上改為自然換行。
- 事件時間改為獨立完整一行並靠右，避免 `2026/9/...` 被截斷。
- Footer 支援自動換行；窄螢幕不再互相擠壓。
- 來源 Badge 設定最大寬度；超窄手機會自動移到第二行。
- 服務名稱、副標、跨境線路資訊全部允許自然換行，不再溢出。
- 390px 以下自動切換為單欄 Header / Footer。
- 保留 v66 單一卡片模板架構與 23 個服務模組。

## v66.0.0

- 移除多餘的 `assets/templates/` 目錄。
- 唯一卡片模板由 `assets/templates/card-template.js` 移至 `assets/card-template.js`。
- 服務模組仍維持 `assets/services/*.js`，因 23 個服務需要獨立管理。
- 卡片生成、事件處理、資料來源、響應式布局均不變。
- 資源版本與快取同步更新至 v66。

## v65.0.0

- 重做 v64 卡片模板架構，改為真正的「資料直接套單一模板生成」。
- `templates/card-template.js` 成為唯一完整卡片模板；事件項目也由此模板內部生成。
- 移除 `renderer.js`、`service-card.js`、`event-item.js` 三層依賴。
- `app.js` 取得標準化 Service Model 後直接呼叫 `CloudStatusCardTemplate.render()`。
- 23 個服務模組仍只負責服務與來源資料。
- 保留指定卡片畫面：服務名/來源、灰色副標、狀態、目前事件、最近 3 筆事件、Footer 資料來源與更新時間。
- 全域設定仍位於 `app.js`；不設 config 模組。
- 手機、橫屏、桌面 Masonry 以及 v61 事件生命週期邏輯全部保留。

## v64.0.0

- 按指定「最終畫面（卡片範例）」正式導入卡片模板架構。
- 新增 `templates/service-card.js`：統一卡片 Header、狀態、目前事件、最近事件與 Footer。
- 新增 `templates/event-item.js`：統一事件標籤、標題與右側第二行時間。
- 新增 `renderer.js`：Service Model 套用模板後生成畫面；`app.js` 不再直接拼接卡片 HTML。
- 23 個 `services/*.js` 仍只負責服務來源資料，與卡片版面完全分離。
- 卡片模板固定為：左上服務名 / 右上來源、第二行灰色副標、狀態 Badge、目前事件、最近 3 筆事件、底部資料來源 / 更新時間。
- 目前事件不受最近 3 筆限制；歷史事件仍最多 3 筆。
- 全域設定仍留在 `app.js`，不重新拆出 config 模組。
- 手機 / 橫屏 / 桌面雙欄 Masonry 與既有資料來源邏輯保持不變。

## v63.0.0

- 保留服務模組化：`services.js` + `services/*.js`。
- 移除 `config.js`；全域設定收回 `app.js`。
- `index.html` 僅保留 `services.js` 與 `app.js` 兩個程式入口。
- 23 個服務仍採 manifest 平行載入、固定排序後啟動。
- v61 目前/最近事件分離、v60 統計置中、v59 響應式布局完整保留。
- Generic ZIP 不包含 `CNAME`。

## v62.0.0

- 完整重構載入架構，不改變既有 UI、事件判定、跨境分類與全端自適配行為。
- 新增 `assets/config.js`：版本、快取、刷新週期、Timeout、併發數與 Masonry 參數集中管理。
- `services.js` 重構為「Registry + Manifest + Loader」：23 個服務模組由單一 manifest 管理。
- `index.html` 不再硬寫 23 個 `<script>`；只保留 `config.js`、`services.js`、`app.js` 三個入口。
- 23 個服務模組改為平行載入，全部完成後再依 manifest 固定排序，避免網路完成順序影響卡片排列。
- `app.js` 改為等待 `CloudStatusServices.ready` 後才啟動，杜絕服務模組尚未完成就開始抓資料的競態。
- 全域 runtime 參數不再散落於 `app.js`；快取 key 與資源版本統一為 v62。
- v61「目前事件 / 最近事件」分離與 unresolved + history 邏輯完整保留。
- v60 統計置中、v59 桌面滿寬雙欄、手機/橫屏/桌面自適配全部保留。
- Generic ZIP 仍不包含 `CNAME`。

## v61.0.0

- 全服務事件邏輯稽核：修正「目前仍在進行的事件可能被最近 3 筆已解決事件擠掉」的共通問題。
- `目前事件` 與 `最近事件` 正式分開顯示；目前事件不再受「最近 3 筆」限制。
- Cloudflare / GitHub / OpenAI / Equinix 等 Statuspage 類來源會同時讀取 `incidents/unresolved.json` 與 `incidents.json`，先取得未解決事件，再補最近歷史。
- Statuspage 只有在 unresolved API 明確回傳 0 筆時才顯示「目前沒有未解決事件」；API 失敗時不猜正常。
- 明確的 `Investigating / Identified / Monitoring / Active / In Progress / Maintenance` 等來源狀態會列入「目前事件」。
- `Resolved / Completed / Closed / Postmortem` 列入最近歷史。
- Apple、Azure、Oracle、BandwagonHost 等既有解析器同步受益：只要來源明確提供未結束狀態，就不會再被歷史事件排序截掉。
- 修正 Equinix `statuspage` 來源誤指向網站根目錄，改為官方 `/api/v2/incidents.json`。
- 狀態仍不從事件正文推斷；只有來源明確提供的生命週期狀態才會建立目前異常。
- v60 統計置中與 v59 全端自適配/桌面雙欄布局保持不變。
- 所有資源同步更新至 `v61.0.0`。

## v60.0.0

- 三個統計卡片的數字與說明文字全部水平置中。
- 手機直向、手機橫屏與桌面端同步套用。
- v59 全端自適配與桌面雙欄布局保持不變。
- 所有資源同步更新至 `v60.0.0`。

## v59.0.0

- 修正桌面端內容只擠在左半邊、右側大量留白的問題。
- 桌面內容區真正使用完整 1180px 容器並置中。
- 雙欄 Masonry 改用 `#services` 實際渲染寬度計算，每欄平均分配，不再受 viewport / 舊寬度殘留影響。
- 卡片第一行固定為「藍色服務名稱 + 右側來源」。
- 灰色 `(廠商 / ASN) 中文名稱` 強制放在完整第二行。
- 手機直向維持單欄；手機橫屏、平板、桌面依實際寬度自適配，最多雙欄。
- 所有資源同步更新至 `v59.0.0`。

## v58.0.0

- 全端響應式版面重整：手機直向、手機橫屏、平板、分割視窗與電腦網頁端統一自適配。
- 手機直向固定單欄，維持目前截圖的卡片比例與資訊層級。
- 手機橫屏依實際內容寬度判斷；空間不足保持單欄，足夠時自動切換雙欄。
- 桌面與大螢幕最大內容寬度維持 1180px，最多雙欄 Masonry 階梯補位，不產生三欄或四欄。
- Masonry 改以 `#services` 實際可用寬度判斷，不再只依 viewport；瀏覽器縮放、分割視窗、旋轉均會重新排版。
- 分類列固定橫向滑動，避免窄螢幕擠壓或超出頁面。
- 服務名稱、來源、灰色第二行、事件標題與時間增加防溢出處理。
- 所有資源同步更新至 `v58.0.0`。

## v57.0.0

- 修正網頁端灰色副標題仍與第一行元素同行的問題。
- 灰色 `(廠商 · ASN) 中文名稱` 現在強制佔滿 100% 寬度並換到完整第二行。
- 手機與桌面使用相同規則，不再依剩餘寬度自動擠回第一行。
- 所有資源同步更新至 `v57.0.0`。

## v56.0.0

- 灰色副標題改為同一行顯示「(原廠商 / ASN) 中文名稱」。
- 例如：`(China Unicom · AS9929) 中國聯通精品網`。
- 藍色服務名稱與右側 Cloudflare Radar 維持原位置。
- 所有資源同步更新至 `v56.0.0`。

## v55.0.0

- 修正名稱雙行位置：藍色服務名稱維持單行，改為下方灰色副標題分兩行。
- 第一行灰字顯示繁體中文名稱；第二行灰字顯示原有英文廠商 / ASN 資訊。
- 跨境分類、Cloudflare Radar 上游狀態與既有版面邏輯保持不變。
- 所有資源同步更新至 `v55.0.0`。

## v54.0.0

- 服務名稱改為雙行：第一行官方英文名稱，第二行繁體中文名稱。
- 中文名稱不再與英文名稱擠在同一行。
- 中文名稱仍可搜尋。
- 既有跨境分類、Cloudflare Radar 上游狀態與事件原文規則保持不變。
- 所有資源同步更新至 `v54.0.0`。

## v53.0.0

- 所有服務名稱補上繁體中文說明，同時保留官方英文品牌名稱。
- 雲端、AI、開發者、平台、Hosting、數據中心、骨幹網與跨境線路統一中文化。
- 跨境線路名稱補充中國電信／中國聯通／中國移動及精品網、國際網、骨幹網說明。
- 不翻譯官方事件標題與事件內容，事件仍保持來源原文。
- v52 跨境分類排序與 Cloudflare Radar 上游狀態邏輯保持不變。
- 所有資源同步更新至 `v53.0.0`。

## v52.0.0

- 修正 v51 跨境線路分類只寫入服務模組、但刷新後 runtime state 遺失分類欄位的問題。
- 跨境線路現在固定按「運營商 → 線路級別」排序，不再依腳本註冊順序混排。
- 中國電信：CN2 GIA → CN2 GT → 163 / AS4134。
- 中國聯通：AS9929 → AS10099 → 169 / AS4837。
- 中國移動：CMI / AS58453。
- 卡片標題下方新增可見分類：中國電信/中國聯通/中國移動 + 精品網/國際網/普通公網。
- 搜尋同時支援運營商與線路分類名稱。
- Cloudflare Radar 上游資料源與嚴格狀態判定保持不變。
- 所有資源同步更新至 `v52.0.0`。

## v51.0.0

- 跨境線路增加運營商與線路等級分類。
- 中國電信：CN2 GIA、CN2 GT 歸入「精品網」；163 / AS4134 歸入「普通公網」。
- 中國聯通：AS9929 歸入「精品網」；AS10099 歸入「國際網」；169 / AS4837 歸入「普通公網」。
- 中國移動：CMI / AS58453 歸入「國際網」。
- 每個跨境服務模組增加 carrier / routeClass 結構化欄位，方便後續做二級篩選與分組。
- Cloudflare Radar 上游資料源及既有嚴格判定邏輯保持不變。
- 所有資源同步更新至 `v51.0.0`。

## v50.0.0

- 跨境線路主要資料源由 bgp.tools 改為 Cloudflare Radar 公開 Routing / BGP 頁面。
- CN2 GIA / CN2 GT → Radar AS4809。
- China Telecom 163 → Radar AS4134。
- China Unicom AS9929 → Radar AS9929。
- China Unicom AS10099 → Radar AS10099。
- China Unicom 169 → Radar AS4837。
- CMI → Radar AS58453。
- 純 GitHub Pages 不內嵌 Cloudflare API Token，因此使用公開 Radar 頁面經 Reader 取得資料。
- 只有 Radar 頁面同時包含目標 ASN、Connectivity、Upstream providers 與實際 provider/path 資料時才顯示「上游正常」。
- 資料不足維持未知，不把頁面成功載入直接當成正常。
- v47 快速載入、1180px、自適應與雙欄 Masonry 保持不變。
- 所有資源同步更新至 `v50.0.0`。

## v49.0.0

- 跨境線路改為抓取公開 BGP 上游連線資料，不由 CloudStatus 自行 Ping。
- CN2 GIA / CN2 GT 使用 China Telecom AS4809 上游狀態。
- China Telecom 163 使用 AS4134。
- China Unicom 精品網使用 AS9929；國際網使用 AS10099；169 使用 AS4837。
- CMI 使用 China Mobile International AS58453。
- 公開資料源使用 bgp.tools 的近即時 BGP 網路頁面。
- 僅在來源明確顯示 Network status = Active 且存在 Upstreams 時顯示「上游正常」；資料不足保持未知，不把頁面可開啟直接推斷為正常。
- 跨境卡片明確標示「上游正常 / 上游異常」，避免冒充具體路由品質或端到端連通性。
- v47 快速載入、1180px、自適應與雙欄 Masonry 保持不變。
- 所有資源同步更新至 `v49.0.0`。

## v48.0.0

- 新增「跨境線路」分類。
- 新增 7 張線路卡：CN2 GIA、CN2 GT、China Unicom AS9929、China Unicom AS10099、CMI、China Telecom 163 / AS4134、China Unicom 169 / AS4837。
- IPLC / IEPL 暫不建立虛假的全域狀態卡；需指定實際供應商與端點後再監控。
- 目前 7 張跨境線路卡不推斷正常/異常；在沒有可靠線路級事件來源時明確顯示「暫無可靠的線路級即時事件來源」。
- 原有快速載入、1180px、全顯示器自適應與雙欄 Masonry 保持不變。
- 服務模組總數由 16 增至 23。
- 所有資源同步更新至 `v48.0.0`。

## v47.0.0

- 加快首次載入與重新整理的體感速度。
- 無快取時立即顯示全部服務卡片與「載入中…」，不再等待全部來源完成才出現內容。
- 16 個主要來源仍並行抓取，但現在每完成一個服務就立即更新該卡片。
- 15 分鐘內快取直接顯示；24 小時內舊快取也可先顯示並明確標示「舊快取」，同時背景更新。
- 一般來源加入 6.5 秒網路逾時，Reader 加入 7.5 秒逾時，避免單一慢來源拖住整批載入。
- 備援來源仍限制 4 路併發，避免 Safari / iOS 因過度併發反而變慢。
- 修正來源排序：明確設定的 `priority` 現在優先於 `kind` 預設值。
- 1180px 與全顯示器自適應布局保持不變。
- 所有資源同步更新至 `v47.0.0`。

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
