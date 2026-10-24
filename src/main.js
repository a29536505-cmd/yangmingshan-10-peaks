import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  createIcons,
  Mountain,
  Map,
  Route,
  Backpack,
  CalendarDays,
  ArrowUpRight,
  ArrowRight,
  Check,
  CheckCheck,
  Circle,
  X,
  Download,
  Info,
  LocateFixed,
  Expand,
  TriangleAlert,
  ChevronRight,
  Clock3,
  ShieldCheck,
  Bus,
  Footprints,
  Compass,
  Shirt,
  Droplets,
  CloudSun,
  ExternalLink,
  RotateCcw,
  Share2,
  Menu,
  BookOpen,
  CircleHelp,
} from "lucide";
import { peaks, schedule, gearGroups, sources, EVENT_DATE } from "./data.js";
import {
  readState,
  writeState,
  toggleItem,
  daysUntil,
  gearIds,
  isValidPeakData,
} from "./state.js";
import "./style.css";

const icons = {
  Mountain,
  Map,
  Route,
  Backpack,
  CalendarDays,
  ArrowUpRight,
  ArrowRight,
  Check,
  CheckCheck,
  Circle,
  X,
  Download,
  Info,
  LocateFixed,
  Expand,
  TriangleAlert,
  ChevronRight,
  Clock3,
  ShieldCheck,
  Bus,
  Footprints,
  Compass,
  Shirt,
  Droplets,
  CloudSun,
  ExternalLink,
  RotateCcw,
  Share2,
  Menu,
  BookOpen,
  CircleHelp,
};
const icon = (name, cls = "") =>
  `<i data-lucide="${name}" class="${cls}" aria-hidden="true"></i>`;
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const refreshIcons = () =>
  createIcons({ icons, attrs: { "stroke-width": 1.7 } });
let storage;
try {
  storage = window.localStorage;
} catch {
  /* Browser policy may deny the storage getter. */
}
let state = readState(storage);
let verified = { status: "pending", peaks: [], route: null, sources: [] };
let activeTab = "map";
let activeFilter = "all";
let map;
let markers = new globalThis.Map();
let positionLayer;
let trailLayer;
let endpointLayer;
let dialogReturnFocus;
let toastTimeout;
let mapTileError = false;
const countdown = daysUntil();
const countdownText =
  countdown > 0
    ? `距離出發還有 ${countdown} 天`
    : countdown === 0
      ? "今天，一起平安山行"
      : "記下這一天的山行";
const navItems = [
  ["map", "map", "路線地圖"],
  ["peaks", "mountain", "十峰手帖"],
  ["plan", "calendar-days", "當日計畫"],
  ["gear", "backpack", "行前準備"],
];

function pendingNotice() {
  return `<div class="notice verification-notice"><span class="notice-icon">${icon("circle-help")}</span><div><strong>路線查證尚未完成</strong><p>山峰座標、步道軌跡與照片尚待來源核對；目前不顯示推測位置或連線。下方順序、海拔及時間為待核實的規劃草案，請勿用來現地導航。</p></div><button class="text-button" data-action="sources">查看狀態 ${icon("arrow-up-right")}</button></div>`;
}
function getPeak(id) {
  return peaks.find((p) => p.id === id);
}
function peakVerified(id) {
  return verified.peaks.find((p) => p.id === id);
}
function peakPhoto(peak) {
  const photo = peakVerified(peak.id)?.photo;
  if (
    photo?.localPath &&
    photo?.sourceUrl &&
    photo?.license &&
    /^images\/[\w./-]+$/.test(photo.localPath)
  ) {
    return `<img class="peak-photo" src="${escape(import.meta.env.BASE_URL + photo.localPath)}" alt="${escape(photo.alt || peak.name)}" loading="lazy" width="640" height="400"><span class="photo-caption">${escape(photo.caption || photo.alt)}</span><span class="photo-credit">${escape(photo.author)} · ${escape(photo.license)}</span>`;
  }
  return `<div class="peak-photo-pending" role="img" aria-label="${peak.name}照片尚待查證"><span>${icon("mountain")}</span><small>山峰照片待查證</small></div>`;
}
function peakCard(peak) {
  const done = state.completed.includes(peak.id);
  const data = peakVerified(peak.id);
  return `<article class="peak-card ${done ? "is-completed" : ""}" data-peak="${peak.id}">
    <button class="peak-image-button" data-action="peak-detail" data-id="${peak.id}" aria-label="查看${peak.name}介紹">${peakPhoto(peak)}<span class="peak-number">${String(peak.order).padStart(2, "0")}</span><span class="image-arrow">${icon("arrow-up-right")}</span></button>
    <div class="peak-card-body"><div class="peak-meta">${data ? peak.area : `待查證 · ${peak.area}`}</div><div class="peak-title-row"><h3>${peak.name}</h3><span class="elevation">${data?.elevation || peak.elevation}<small> m</small></span></div><p class="peak-description">${peak.description}</p><div class="peak-card-bottom"><button class="text-button" data-action="peak-detail" data-id="${peak.id}">山峰介紹 ${icon("chevron-right")}</button><button class="complete-button ${done ? "completed" : ""}" data-action="complete" data-id="${peak.id}" aria-pressed="${done}" aria-label="${peak.name}：${done ? "已完成，點擊取消" : "標記已完成"}">${icon(done ? "check-check" : "check")}<span>${done ? "已完成" : "標記完成"}</span></button></div></div>
  </article>`;
}

function renderApp() {
  document.querySelector("#app").innerHTML = `
  <header class="site-header"><a class="brand" href="#map" aria-label="山行手帖首頁"><span class="brand-symbol">${icon("mountain")}</span><span>山行手帖<small>TRAIL NOTES</small></span></a><nav class="desktop-nav" aria-label="主要導覽">${navItems.map(([id, i, label]) => `<a href="#${id}" data-tab="${id}" class="${id === activeTab ? "active" : ""}">${label}</a>`).join("")}</nav><div class="header-actions"><span class="date-label">${icon("calendar-days")} 2026.12.06 <span>週日</span></span><button class="icon-button" data-action="sources" aria-label="資料來源與查證狀態">${icon("info")}</button></div></header>
  <main id="main" tabindex="-1">
    <section class="hero"><div class="hero-copy"><div class="eyebrow"><span></span> YANGMINGSHAN · EAST TO WEST</div><h1>把一整天，<br>交給<span>山。</span></h1><p class="hero-event">2026年12月6日<br class="mobile-break">陽明山十連峰大縱走</p><p class="hero-description">從草原到稜線，走過十座山的風景。<br>每一步，都以平安回家為目的地。</p><div class="hero-links"><a class="button primary" href="#map">探索路線 ${icon("arrow-right")}</a><span class="countdown">${icon("clock-3")} ${countdownText}</span></div></div><div class="hero-art"><img src="${import.meta.env.BASE_URL}images/mountain-art.svg" alt="陽明山山稜意象插畫，非實際地形圖" width="1200" height="700"><div class="art-caption"><span>北緯的山，十二月的風</span><small>YANGMINGSHAN NATIONAL PARK</small></div><span class="art-label">山稜意象插畫</span></div></section>
    <div class="journey-strip"><div>${icon("mountain")}<span><strong>10</strong> 座山峰<small>一天的山行清單</small></span></div><div>${icon("route")}<span><strong>東 → 西</strong><small>風櫃嘴至清天宮・規劃方向</small></span></div><div>${icon("footprints")}<span><strong>高強度</strong><small>適合有長程縱走經驗者</small></span></div><div class="strip-note">${icon("shield-check")}<span>山一直都在<br><strong>安全比完登更重要</strong></span></div></div>
    <div class="content-wrap"><div id="verification-banner">${pendingNotice()}</div>
    <section id="map-section" class="tab-panel" aria-labelledby="map-heading"><div class="section-heading"><div><p class="eyebrow">01 / THE JOURNEY</p><h2 id="map-heading">沿著山，慢慢展開</h2><p>用手指探索地圖，認識這次山行。</p></div><span class="section-tag">${icon("compass")} 東向西規劃</span></div>
      <div class="map-layout"><div class="map-card"><div class="map-topbar"><span>${icon("map")} 陽明山互動地圖</span><div><button class="icon-button" data-action="locate" aria-label="定位我的位置">${icon("locate-fixed")}</button><button class="icon-button" data-action="fit-map" aria-label="查看全部範圍">${icon("expand")}</button></div></div><div id="trail-map" aria-label="陽明山可拖曳及縮放地圖" tabindex="0"></div><div class="map-status" id="map-status" role="status">${icon("info")} 底圖需網路；尚無已查證的山峰座標及路線。</div><div class="map-legend"><span><i class="legend-dot"></i> 已查證山峰</span><span><i class="legend-dot done"></i> 已完成</span><span class="map-help">單指拖曳 · 雙指縮放</span></div></div>
      <aside class="route-sidebar"><div class="route-list-heading"><div><p class="eyebrow">PROPOSED ITINERARY</p><h3>十峰，一路向西</h3></div><span class="small-badge warning">順序待核實</span></div><div class="route-endpoint"><span class="endpoint-dot"></span><div><strong>風櫃嘴</strong><small>規劃起點</small></div><span>START</span></div><ol class="route-list">${peaks.map((p) => `<li data-route-peak="${p.id}"><button class="route-peak" data-action="peak-detail" data-id="${p.id}"><span class="route-order">${String(p.order).padStart(2, "0")}</span><span><strong>${p.name}</strong><small>${p.area}</small></span><span class="route-altitude">${p.elevation}<small>m</small></span>${icon("chevron-right")}</button></li>`).join("")}</ol><div class="route-endpoint finish"><span class="endpoint-dot"></span><div><strong>清天宮</strong><small>規劃終點・回報平安</small></div><span>FINISH</span></div><p class="route-footnote">竹篙山需支線往返；山峰排序不是步道軌跡。海拔數字尚待來源核實。</p></aside></div>
      <div class="below-map"><div class="mini-note">${icon("triangle-alert")}<div><strong>十二月，為風雨多留一份準備</strong><p>濃霧、強風、濕滑拉繩與短日照，都可能改變計畫。路線、班次與當日開放狀態請在行前再次確認。</p></div></div><a class="text-button" href="#plan">查看休息與撤退計畫 ${icon("arrow-right")}</a></div>
    </section>
    <section id="peaks-section" class="tab-panel" aria-labelledby="peaks-heading" hidden><div class="section-heading"><div><p class="eyebrow">02 / TEN LITTLE STORIES</p><h2 id="peaks-heading">十峰，各有風景</h2><p>記錄自己的腳步，也保留隨時轉身的餘裕。</p></div><div class="filter-buttons" role="group" aria-label="篩選山峰"><button class="active" data-filter="all" aria-pressed="true">全部十峰</button><button data-filter="unfinished" aria-pressed="false">尚未完成</button><button data-filter="completed" aria-pressed="false">已完成</button></div></div><div class="progress-card"><span class="progress-mountain">${icon("mountain")}</span><div><h3>我的山行進度</h3><p id="progress-description">進度保存在這台裝置的瀏覽器</p></div><strong class="progress-fraction"><span data-completed-count>0</span><small> / 10</small></strong><div class="progress-track" role="progressbar" aria-label="十峰完成進度" aria-valuemin="0" aria-valuemax="10" aria-valuenow="0"><span></span></div></div><div id="peak-grid" class="peak-grid"></div><div class="progress-actions"><button class="text-button" data-action="export">${icon("download")} 匯出我的紀錄</button><button class="text-button muted" data-action="reset">${icon("rotate-ccw")} 重設山峰進度</button></div><p class="muted small">完成標記由你手動記錄，不代表 GPS 驗證；裝置或瀏覽器不同時不會自動同步。</p></section>
    <section id="plan-section" class="tab-panel" aria-labelledby="plan-heading" hidden><div class="section-heading"><div><p class="eyebrow">03 / A DAY IN THE MOUNTAINS</p><h2 id="plan-heading">把餘裕，排進計畫</h2><p>12 月 6 日・星期日・臺灣時間（UTC+8）</p></div><span class="section-tag">${icon("calendar-days")} 2026.12.06</span></div><div class="notice plan-warning">${icon("triangle-alert")}<div><strong>健腳隊伍的預估草案；銜接、當日開放與日照須再確認</strong><p>05:00–17:00僅為規劃窗口，不是保證能完成的時間。夜間出發需經驗、頭燈與結伴；12月日照短，勿為十峰趕路。請先確認體能、實際路程、日落與天候，不適合初次長程登山者直接照表執行。</p></div></div><div class="plan-layout"><div class="timeline">${schedule.map((s) => `<article class="timeline-item ${s.type}"><div class="timeline-time">${s.time}</div><span class="timeline-dot">${icon(s.type === "exit" ? "shield-check" : s.type === "rest" ? "droplets" : "mountain")}</span><div class="timeline-content"><span class="small-badge ${s.type === "exit" ? "warning" : ""}">${s.badge}</span><h3>${s.title}</h3><p>${s.detail}</p></div></article>`).join("")}</div><aside class="plan-aside"><div class="info-card"><span class="card-icon">${icon("bus")}</span><h3>到山裡，也要回得來</h3><div class="transport-row"><span>去程</span><p>風櫃嘴出發時間早，先預約合法接駁或計程車並確認上車點；不假設首班公車能趕上。</p></div><div class="transport-row"><span>回程</span><p>清天宮可查詢小6往北投方向的服務。2026/12/6班次與末班車尚未確認，另備接駁方案。</p></div><div class="transport-row"><span>中途</span><p>冷水坑查小15、108；小油坑與二子坪查108。以官方當日營運資訊為準。</p></div><a class="button secondary full" href="https://ebus.gov.taipei/" target="_blank" rel="noopener noreferrer">查詢大臺北公車 ${icon("arrow-up-right")}</a><p class="small muted">候選路線待查證，不提供未確認的發車時間或末班車。</p></div><div class="info-card forest-card"><span class="card-icon">${icon("shield-check")}</span><h3>撤退也是好決定</h3><p>任何人不舒服、路徑不明、雨勢加大或能見度降低，都可以提前結束。不必等到時間門檻。</p><p>不要走未確認的捷徑。告知隊友及留守人，沿已確認開放的步道離開。</p><a href="#gear" class="text-button">查看安全提醒 ${icon("arrow-right")}</a></div></aside></div></section>
    <section id="gear-section" class="tab-panel" aria-labelledby="gear-heading" hidden><div class="section-heading"><div><p class="eyebrow">04 / BEFORE YOU GO</p><h2 id="gear-heading">準備好，再出發</h2><p>裝備勾選會自動儲存。出發前，再陪自己檢查一次。</p></div><span class="section-tag">${icon("backpack")} <span id="gear-count">0</span> / ${gearIds.length} 已備妥</span></div><div class="gear-layout"><div id="gear-groups">${gearGroups.map((g, gi) => `<article class="gear-card"><h3>${icon(g.icon)} ${g.name}</h3><div>${g.items.map((item, i) => `<label class="gear-item"><input type="checkbox" data-gear="${gi}-${i}"><span class="custom-check">${icon("check")}</span><span>${item}</span></label>`).join("")}</div></article>`).join("")}</div><aside><div class="info-card safety-card"><span class="card-icon">${icon("triangle-alert")}</span><h3>平安，是唯一必達的目標</h3><ul class="safety-list"><li><strong>風雨就調整計畫</strong>留意東北季風、低溫與濃霧；雨天避開南、西峰濕滑拉繩段。</li><li><strong>頭燈每人一組</strong>手機手電筒無法取代頭燈；預留比預期更多的下山時間。</li><li><strong>離線導航先備妥</strong>本站底圖需要網路，不能取代離線地圖、可靠軌跡與現地路標。</li><li><strong>尊重草原與野生動物</strong>保持與水牛的距離，不餵食、不追逐，不進入封閉區域。</li><li><strong>結伴、報備、不脫隊</strong>事前告知留守人路線與回報時間；行程變更也要通知。</li></ul><a class="button secondary full" href="https://www.ymsnp.gov.tw/" target="_blank" rel="noopener noreferrer">查詢步道開放公告 ${icon("arrow-up-right")}</a></div><div class="emergency-card"><div>${icon("shield-check")} <h3>緊急聯絡</h3></div><p>遇緊急狀況先確保自身安全，回報位置、傷勢、人數與裝備。無訊號時先嘗試112；通訊仍受基地臺涵蓋影響。</p><div class="emergency-numbers"><a href="tel:119"><strong>119</strong><span>消防救援</span></a><a href="tel:112"><strong>112</strong><span>行動電話緊急救難</span></a></div></div><a class="weather-link" href="https://www.cwa.gov.tw/" target="_blank" rel="noopener noreferrer">${icon("cloud-sun")} 行前查看中央氣象署 ${icon("arrow-up-right")}</a></aside></div></section>
    <footer class="content-footer"><span>${icon("mountain")} 山一直都在，平安回家再出發。</span><button class="text-button" data-action="sources">資料來源與查證狀態 ${icon("arrow-up-right")}</button></footer></div>
  </main><nav class="mobile-nav" aria-label="手機導覽">${navItems.map(([id, i, label]) => `<a href="#${id}" data-tab="${id}" class="${id === activeTab ? "active" : ""}">${icon(i)}<span>${label}</span></a>`).join("")}</nav><div id="toast" class="toast" role="status" aria-live="polite" hidden></div><dialog id="detail-dialog" aria-labelledby="dialog-title"><div class="dialog-top"><span class="eyebrow">TRAIL NOTES</span><button class="icon-button" data-action="close-dialog" aria-label="關閉視窗">${icon("x")}</button></div><div id="dialog-content"></div></dialog>`;
  refreshIcons();
  renderPeaks();
  updateProgress();
  initMap();
  showTabFromHash();
}

function renderPeaks() {
  const filtered = peaks.filter(
    (p) =>
      activeFilter === "all" ||
      (activeFilter === "completed"
        ? state.completed.includes(p.id)
        : !state.completed.includes(p.id)),
  );
  document.querySelector("#peak-grid").innerHTML = filtered.length
    ? filtered.map(peakCard).join("")
    : `<div class="empty-state">${icon("mountain")}<h3>${activeFilter === "completed" ? "每一段，都從第一步開始" : "十峰都已留下足跡"}</h3><p>${activeFilter === "completed" ? "完成一座山後，點選「標記完成」就會出現在這裡。" : "也別忘了下山後回報平安。"}</p></div>`;
  refreshIcons();
}
function updateProgress() {
  const count = state.completed.length;
  document
    .querySelectorAll("[data-completed-count]")
    .forEach((el) => (el.textContent = count));
  const bar = document.querySelector('[role="progressbar"]');
  bar.setAttribute("aria-valuenow", count);
  bar.querySelector("span").style.width = `${count * 10}%`;
  document
    .querySelectorAll("[data-route-peak]")
    .forEach((el) =>
      el.classList.toggle(
        "is-completed",
        state.completed.includes(el.dataset.routePeak),
      ),
    );
  document
    .querySelectorAll("[data-gear]")
    .forEach((el) => (el.checked = state.gear.includes(el.dataset.gear)));
  document.querySelector("#gear-count").textContent = state.gear.length;
  for (const [id, marker] of markers) marker.setIcon(markerIcon(getPeak(id)));
}
function persist() {
  if (!writeState(storage, state))
    toast("瀏覽器無法儲存；關閉頁面可能會遺失進度，請先匯出紀錄。");
}
function togglePeak(id) {
  const peak = getPeak(id);
  if (!peak) return;
  state.completed = toggleItem(state.completed, id);
  persist();
  renderPeaks();
  updateProgress();
  toast(
    state.completed.includes(id)
      ? `已記下 ${peak.name} 的足跡。記得保留安全下山的體力。`
      : `已取消 ${peak.name} 的完成標記`,
  );
  const dialogButton = document.querySelector(
    '#detail-dialog [data-action="complete"]',
  );
  if (dialogButton) {
    const done = state.completed.includes(id);
    dialogButton.setAttribute("aria-pressed", done);
    dialogButton.innerHTML = `${icon(done ? "check-check" : "check")} ${done ? "已完成，點擊可取消" : "標記這座山已完成"}`;
    refreshIcons();
  }
}
function showTabFromHash() {
  const id = location.hash.slice(1);
  setTab(navItems.some(([key]) => key === id) ? id : "map");
}
function setTab(id) {
  const changed = activeTab !== id;
  activeTab = id;
  document
    .querySelectorAll(".tab-panel")
    .forEach((el) => (el.hidden = el.id !== `${id}-section`));
  document.querySelectorAll("[data-tab]").forEach((el) => {
    el.classList.toggle("active", el.dataset.tab === id);
    if (el.dataset.tab === id) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  if (id === "map") requestAnimationFrame(() => map?.invalidateSize());
  if (changed)
    document
      .querySelector(`#${id}-section`)
      .scrollIntoView({ block: "start", behavior: "instant" });
}
function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    el.hidden = true;
  }, 5000);
}
function openDialog(content) {
  dialogReturnFocus = document.activeElement;
  document.querySelector("#dialog-content").innerHTML = content;
  refreshIcons();
  const dialog = document.querySelector("#detail-dialog");
  if (!dialog.open) dialog.showModal();
}
function closeDialog() {
  document.querySelector("#detail-dialog").close();
}
function openPeak(id) {
  const peak = getPeak(id);
  if (!peak) return;
  const data = peakVerified(id);
  const done = state.completed.includes(id);
  openDialog(
    `<div class="detail-photo">${peakPhoto(peak)}</div><span class="eyebrow">PEAK ${String(peak.order).padStart(2, "0")} / ${peak.area}</span><div class="detail-title"><h2 id="dialog-title">${peak.name}</h2><span>${data?.elevation || peak.elevation}<small> m</small></span></div><span class="small-badge ${data ? "" : "warning"}">${data ? "座標與標高均有來源" : "海拔、座標及介紹待查證"}</span><p class="detail-description">${peak.description}</p><div class="detail-trail">${icon("route")}<div><strong>規劃順序・待核實</strong><p>${peak.trail}</p></div></div>${data?.elevationNote ? `<p class="small muted">${escape(data.elevationNote)} <a href="${escape(data.elevationSourceUrl)}" target="_blank" rel="noopener noreferrer">標高來源</a></p>` : ""}${data?.sourceUrl ? `<a class="text-button" href="${escape(data.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看位置來源 ${icon("external-link")}</a>` : '<p class="muted small">座標與實際步道尚未取得可核對資料，因此不顯示推測位置。</p>'}${data?.photo ? `<p class="small muted">照片：${escape(data.photo.author)} · ${escape(data.photo.license)} <a href="${escape(data.photo.sourceUrl)}" target="_blank" rel="noopener noreferrer">來源與授權</a></p>` : ""}<button class="button primary full detail-complete" data-action="complete" data-id="${id}" aria-pressed="${done}">${icon(done ? "check-check" : "check")} ${done ? "已完成，點擊可取消" : "標記這座山已完成"}</button>`,
  );
}
function openSources() {
  const sourceList = [...sources, ...(verified.sources || [])];
  openDialog(
    `<p class="eyebrow">SOURCES & VERIFICATION</p><h2 id="dialog-title">有依據，才放心出發</h2><p>本站活動日期為2026年12月6日。規劃時段均為估計；交通與步道開放需在出發前再次核對。</p><div class="source-status ${verified.status === "verified" ? "ok" : ""}">${icon("circle-help")}<div><strong>${verified.peaks.length === 10 ? "已核對十峰位置與命名步道" : "查證尚未完成"}</strong><p>${escape(verified.note || "資料查證狀態請見各項來源。")}</p></div></div><div class="source-list">${sourceList.map((s) => `<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer"><div><strong>${escape(s.title)}</strong><p>${escape(s.purpose)}</p><span class="small-badge ${s.status === "pending" ? "warning" : ""}">${s.status === "pending" ? "待查核" : "有來源"}</span></div>${icon("arrow-up-right")}</a>`).join("")}</div><p class="small muted">照片均附來源與授權。頂山目前為頂山—石梯嶺路段實景，竹篙山及向天山為周邊草原／向天池，已逐張註明，非山頂近照。地圖顯示有OSM來源的命名步道路網，包含支線，不是已確認的全程GPX；不代表路線當日開放。</p>`,
  );
}
function markerIcon(peak) {
  return L.divIcon({
    className: `peak-marker ${state.completed.includes(peak.id) ? "done" : ""}`,
    html: `<span>${peak.order}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}
function initMap() {
  map = L.map("trail-map", {
    zoomControl: false,
    touchZoom: true,
    scrollWheelZoom: false,
    dragging: true,
  }).setView([25.175, 121.55], 12);
  L.control
    .zoom({
      position: "bottomright",
      zoomInTitle: "放大地圖",
      zoomOutTitle: "縮小地圖",
    })
    .addTo(map);
  const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  });
  tiles.on("tileerror", () => {
    mapTileError = true;
    document.querySelector("#map-status").textContent =
      "底圖目前無法載入。請檢查網路；未載入的底圖不能用於導航。";
  });
  tiles.addTo(map);
  const announceZoom = () => {
    document.querySelector("#trail-map").setAttribute("aria-label", `陽明山可拖曳及縮放地圖，目前縮放層級 ${map.getZoom()}`);
  };
  map.on("zoomend", announceZoom);
  announceZoom();
  // Map viewport is a regional overview, not a summit coordinate or trail.
  drawVerifiedData();
}
function drawVerifiedData() {
  if (!map) return;
  markers.forEach((marker) => marker.remove());
  markers.clear();
  for (const record of verified.peaks.filter(isValidPeakData)) {
    const peak = getPeak(record.id);
    const marker = L.marker(record.coordinates, {
      icon: markerIcon(peak),
      title: peak.name,
      keyboard: true,
    }).addTo(map);
    marker.bindPopup(
      `<strong>${escape(peak.name)}</strong><br>${record.elevation || peak.elevation} m<br><button class="popup-button" data-action="peak-detail" data-id="${peak.id}">查看山峰介紹</button>`,
    );
    markers.set(peak.id, marker);
  }
  trailLayer?.remove();
  if (
    ["verified", "mapped-trails"].includes(verified.route?.status) &&
    verified.route?.sourceUrl &&
    verified.route?.geojson
  ) {
    trailLayer = L.geoJSON(verified.route.geojson, {
      style: (feature) => ({
        color:
          feature.properties?.highway === "secondary" ? "#b38240" : "#3d7153",
        weight: 3,
        opacity: 0.75,
        dashArray: feature.properties?.highway === "secondary" ? "6 6" : null,
      }),
      onEachFeature: (feature, layer) =>
        layer.bindPopup(
          `<strong>${escape(feature.properties?.name || "命名步道")}</strong><p>OSM路網資料；不是當日開放保證。</p><a class="popup-button" href="${escape(feature.properties?.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看原始步道資料</a>`,
        ),
    }).addTo(map);
  }
  endpointLayer?.remove();
  endpointLayer = L.layerGroup(
    (verified.endpoints || []).map((p) =>
      L.circleMarker(p.coordinates, {
        radius: 6,
        color: "#fff",
        weight: 2,
        fillColor: "#b38240",
        fillOpacity: 1,
      }).bindPopup(
        `<strong>${escape(p.name)}</strong><br><a href="${escape(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">OSM位置來源</a>`,
      ),
    ),
  ).addTo(map);
}
function fitMap() {
  if (markers.size) {
    const bounds = L.featureGroup([...markers.values()]).getBounds();
    (verified.endpoints || []).forEach((p) => bounds.extend(p.coordinates));
    map.fitBounds(bounds, { padding: [30, 30], animate: false });
  } else {
    map.setView([25.175, 121.55], 12);
    toast("目前顯示陽明山區域總覽；山峰座標及路線仍待查證。");
  }
}
function locate() {
  if (!navigator.geolocation) {
    toast("此瀏覽器不支援定位；請使用離線地圖與現地路標。");
    return;
  }
  toast("正在取得你的位置…");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      positionLayer?.remove();
      positionLayer = L.featureGroup([
        L.circle([latitude, longitude], {
          radius: accuracy,
          color: "#397fbd",
          weight: 1,
          fillOpacity: 0.08,
        }),
        L.circleMarker([latitude, longitude], {
          radius: 7,
          color: "white",
          weight: 3,
          fillColor: "#397fbd",
          fillOpacity: 1,
        }),
      ]).addTo(map);
      map.setView([latitude, longitude], 15);
      toast(
        `已顯示你的位置，裝置回報精度約 ${Math.round(accuracy)} 公尺。位置僅在這個頁面使用。`,
      );
    },
    (error) =>
      toast(
        error.code === 1
          ? "定位權限未開啟；你仍可拖曳地圖瀏覽。"
          : "目前無法取得位置，請使用離線地圖與現地路標。",
      ),
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
  );
}
function exportState() {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          event: "2026年12月6日陽明山十連峰大縱走",
          eventDate: EVENT_DATE,
          exportedAt: new Date().toISOString(),
          ...state,
          completedNames: state.completed.map((id) => getPeak(id).name),
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "陽明山十連峰-2026-12-06-我的紀錄.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("已匯出紀錄。iPhone可在下載項目或「檔案」App查看。");
}

document.addEventListener("click", (event) => {
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    activeFilter = filter.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((b) => {
      b.classList.toggle("active", b === filter);
      b.setAttribute("aria-pressed", b === filter);
    });
    renderPeaks();
    return;
  }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const actions = {
    complete: () => togglePeak(button.dataset.id),
    "peak-detail": () => openPeak(button.dataset.id),
    sources: openSources,
    "close-dialog": closeDialog,
    "fit-map": fitMap,
    locate: locate,
    export: exportState,
    reset: () =>
      openDialog(
        `<h2 id="dialog-title">重設這次山行進度？</h2><p>這會清除這台裝置的十峰完成標記。裝備清單會保留。你可以先匯出紀錄留存。</p><div class="dialog-actions"><button class="button secondary" data-action="close-dialog">保留紀錄</button><button class="button danger" data-action="confirm-reset">清除山峰進度</button></div>`,
      ),
    "confirm-reset": () => {
      state.completed = [];
      persist();
      renderPeaks();
      updateProgress();
      closeDialog();
      toast("已重設山峰進度，裝備清單已保留。");
    },
  };
  actions[button.dataset.action]?.();
});
document.addEventListener("change", (event) => {
  const target = event.target;
  if (!target.matches("[data-gear]")) return;
  state.gear = toggleItem(state.gear, target.dataset.gear);
  persist();
  updateProgress();
});
window.addEventListener("hashchange", showTabFromHash);
window.addEventListener("storage", (event) => {
  if (event.key?.startsWith("yangmingshan-2026-12-06")) {
    state = readState(storage);
    renderPeaks();
    updateProgress();
  }
});
renderApp();
document
  .querySelector("#detail-dialog")
  .addEventListener(
    "close",
    () => dialogReturnFocus?.isConnected && dialogReturnFocus.focus(),
  );
document.querySelector("#detail-dialog").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) {
    const r = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      closeDialog();
  }
});
window.addEventListener("offline", () =>
  toast("目前離線。進度仍可記錄；地圖底圖與外部資訊需要網路。"),
);

try {
  const response = await fetch(`${import.meta.env.BASE_URL}data/verified.json`);
  if (response.ok) {
    const data = await response.json();
    verified = {
      ...data,
      peaks: (data.peaks || []).filter(isValidPeakData),
      sources: data.sources || [],
    };
    drawVerifiedData();
    renderPeaks();
    if (verified.peaks.length === 10) {
      document.querySelector("#verification-banner").innerHTML =
        `<div class="notice verified-notice">${icon("shield-check")}<div><strong>十峰位置有來源，全程軌跡與當日開放仍待確認</strong><p>已核對傳統竹篙山版與OSM命名步道（${escape(data.checkedAt)}）。圖層包含支線，非官方全程GPX。官方網站查詢時維護中；交通、封閉及天候請行前重查。</p></div><button class="text-button" data-action="sources">查看來源 ${icon("arrow-up-right")}</button></div>`;
      document.querySelector("#map-status").textContent = mapTileError
        ? "底圖目前無法載入。有來源步道線仍可瀏覽；非全程導航軌跡，開放狀態待確認。"
        : "綠線：OSM實際命名步道（含支線）；棕色虛線：道路。非全程導航軌跡，開放狀態待確認。";
      document.querySelector(".route-list-heading .small-badge").textContent =
        "傳統竹篙山版";
      document.querySelector(".route-footnote").textContent =
        "傳統十連峰包含竹篙山；2019後官方拓印活動改為雞心崙。圖層含支線，路段銜接與開放狀態須行前確認。";
      for (const record of verified.peaks)
        document.querySelector(
          `[data-route-peak="${record.id}"] .route-altitude`,
        ).innerHTML = `${escape(record.elevation)}<small>m</small>`;
      fitMap();
      refreshIcons();
    }
  }
} catch {
  /* The visible pending notice remains; unavailable data never creates invented markers. */
}
