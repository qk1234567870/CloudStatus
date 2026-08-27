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
