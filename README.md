# CloudStatus Static Pages

純 GitHub Pages 版本，不使用 GitHub Actions、不使用 Python、不生成 status.json。

部署：
1. 刪除或停用 `.github/workflows/pages.yml`
2. 把本套件內容放到 Repo 根目錄
3. Settings → Pages
4. Source 選 `Deploy from a branch`
5. Branch 選 `main`
6. Folder 選 `/(root)`
7. Save

套件已附 `CNAME`，內容為 `cloudstatus.htbq.org`。

Cloudflare / GitHub / OpenAI / Google Cloud 會嘗試直接由瀏覽器讀官方 API。
如果官方 API 不允許 CORS，頁面會自動顯示官方狀態頁入口，不會誤判成服務故障。
其他服務直接顯示官方狀態頁入口。

事件保留官方原文；需要中文時使用瀏覽器翻譯。
