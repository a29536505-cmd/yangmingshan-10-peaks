# 山行手帖｜2026年12月6日陽明山十連峰大縱走

獨立的繁體中文手機網站，僅使用 `a29536505-cmd/yangmingshan-10-peaks`；未操作其他旅行網站的檔案或部署設定。

## 已完成的網站功能

- Leaflet 手指拖曳、雙指縮放、按需定位及十峰地圖標記。
- 十峰來源座標、文獻標高、介紹、實景照片與各自的作者／授權／來源。
- **167 段有OSM way來源的命名步道／道路圖層**。包含支線，**不是官方全程GPX或已現勘的導航軌跡**；不以山峰直線冒充步道。
- 山峰完成標記、篩選、本機瀏覽器儲存、裝備勾選、JSON紀錄匯出及需確認的進度重設。
- 2026/12/6臺灣時間行程草案、休息與撤退決策、交通查詢、安全提醒及緊急電話。
- 手機底部導覽、安全區域、鍵盤與對話框操作、列印版面。十張照片合計約1.60 MiB，延遲載入。

## 資料與未確認事項

採用**傳統竹篙山版十連峰**。2019後官方拓印活動將「山」字柱移至雞心崙，兩者不可混用。

資料查核日期：2026-10-24。十峰座標取自OSM來源節點；海拔使用文獻數值，介紹中列出與OSM標高的差異。相關資料在 `public/data/verified.json`，整體狀態為 `partial`，並非官方認證。

- 官方網站查詢時顯示系統維護，未確認活動日步道開放、封閉與各段銜接。
- 完整可靠GPX、實際距離／爬升、日出日落、隊伍體能與當日交通班次仍須行前核對。時間表為有長程經驗隊伍的草案，不是保證行程。
- 十個頁面均有授權實景照片。**頂山目前使用頂山—石梯嶺路段照片，竹篙山為北側草原，向天山為周邊向天池，均標明非山頂近照**。照片不是活動日實況。
- 本站底圖需網路，不能替代離線地圖、可靠軌跡與現地路標。

詳細資料與限制見 [DATA_VERIFICATION.md](DATA_VERIFICATION.md)；圖片與地圖授權見 [ATTRIBUTIONS.md](ATTRIBUTIONS.md)。

## 開發與測試

需要Node.js 24、npm及Chromium。此雲端環境已提供 `/usr/bin/chromium`。

```sh
cd /workspace/yangmingshan-10-peaks
npm ci --cache /workspace/.npm-cache
npm run dev -- --port 5173
```

```sh
npm test
npm run build
npm run test:e2e
```

目前8項單元／資料測試及20項瀏覽器測試通過；瀏覽器測試為Chromium桌面與iPhone 13尺寸／觸控模擬，**非實體iPhone／Safari測試**。測試刻意攔截第三方底圖以驗證斷線提示；外部OSM圖磚另以保留TLS驗證的HTTP請求確認取得200及PNG內容。

相對路徑 `base: './'` 支援GitHub Pages專案子目錄。無後端、無應用程式API金鑰。其他本機可指定 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`；CI使用Playwright安裝的Chromium。

`scripts/optimize-images.mjs` 可在新增有授權照片後執行（`npm run optimize:images`），僅做手機用尺寸／JPEG壓縮；已達尺寸的檔案不會重複壓縮。來源與授權需一併更新。

## GitHub Pages

`.github/workflows/pages.yml` 在 `main` 提交後完成安裝、8項資料測試、正式建置、20項瀏覽器測試，然後部署 `dist`。

**首次啟用Pages受到現有GitHub整合權限限制**：`POST /repos/a29536505-cmd/yangmingshan-10-peaks/pages` 回傳 `403 Resource not accessible by integration`。Git讀寫及Actions驗證已成功，不能將此錯誤誤判成缺少Git權限或要求重複token。

請在**此專案**的Settings → Pages將Source選為 **GitHub Actions**。啟用後，在Actions重新執行 `Test and deploy to GitHub Pages`。流程不設定自訂網域，不變更其他專案Pages。

預期網址為 `https://a29536505-cmd.github.io/yangmingshan-10-peaks/`；實際部署成功與公開HTTP檢查前，不代表已發布。
