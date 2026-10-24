# 山行手帖｜2026年12月6日陽明山十連峰大縱走

獨立的繁體中文手機網站，僅使用 `a29536505-cmd/yangmingshan-10-peaks` 專案。沒有操作其他旅行網站的檔案或部署設定。

**目前是可操作的開發草稿，路線查證尚未完成。不能用於現地導航。**

## 已實作

- Leaflet 地圖拖曳、縮放及按需定位；OpenStreetMap 底圖需連線。
- 十峰規劃清單、海拔候選值、介紹與完成進度。
- 同裝置瀏覽器儲存、完成篩選、裝備勾選、紀錄 JSON 匯出及有確認步驟的進度重設。
- 2026/12/6 臺灣時間行程草案、休息與撤退決策、交通查詢、安全提醒及緊急電話。
- 手機底部導覽、鍵盤操作、對話框、iPhone 安全區域及列印版面。

## 資料界線

山峰座標、實際步道、照片與海拔尚未完成來源核對。官方來源、照片來源及 GitHub API 在目前雲端環境遭網路代理以403擋下。

- `src/data.js` 中的排序、海拔及時間表是**待核實草案**。
- `public/data/verified.json` 保持 `pending`；目前沒有座標、軌跡或山峰照片。
- 網站不會把山峰之間的直線當成步道，也不使用生成照片冒充山峰實景。
- 頁首山稜圖是自行繪製且明示的意象插畫，不是地形圖或實景照片。
- 不應直接套用其他網站的座標、GPX 或照片；先確認真實性、步道開放、照片對象、可重用授權與作者署名。
- 交通候選路線與活動日班次尚未確認，不提供推測的首末班時間。

詳細查證清單見 [DATA_VERIFICATION.md](DATA_VERIFICATION.md)。

## 本機開發

需要 Node.js 24、npm 及 Chromium。此雲端機器已提供 `/usr/bin/chromium`。

```sh
cd /workspace/yangmingshan-10-peaks
npm ci --cache /workspace/.npm-cache
npm run dev -- --port 5173
```

本專案以 Vite 編譯、Leaflet 顯示地圖、Lucide 提供圖示，不需要 API 金鑰或後端。相對路徑 `base: './'` 支援 GitHub Pages 專案子目錄。

## 驗證

```sh
npm test
npm run build
npm run test:e2e
```

端到端測試使用 Chromium 桌面與 iPhone 13 尺寸／觸控模擬，**不代表實體 iPhone 或 Safari 已測試**。測試刻意攔截第三方底圖，以驗證斷線提示與頁面功能；外部圖磚、真實地理資料與已發布網站須另做連線驗證。

其他本機可設定 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`；GitHub Actions 設定 `CI=true` 並使用 Playwright 安裝的 Chromium。

## GitHub Pages

`.github/workflows/pages.yml` 在 `main` 提交後執行單元測試、正式建置與瀏覽器測試，再部署 `dist`。

第一次需要在**此專案**的 Settings → Pages 將 Source 設為 **GitHub Actions**，或透過有管理權限的 GitHub API 設為 `build_type: workflow`。內建 `GITHUB_TOKEN` 不能替尚未開啟 Pages 的專案自動開啟此設定。

完成啟用後，可在 Actions 手動執行 `Test and deploy to GitHub Pages`。此流程不設定自訂網域，也不變更任何其他專案的 Pages。

預期網址是 `https://a29536505-cmd.github.io/yangmingshan-10-peaks/`；在實際部署成功與HTTP檢查前，不應將它描述為已發布。
