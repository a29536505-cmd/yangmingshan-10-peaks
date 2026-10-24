// Names and order are a proposed east-to-west itinerary. Only sourced coordinates
// and licensed, verified photographs may be added to public/data/verified.json.
export const EVENT_DATE = '2026-12-06';
export const EVENT_TIME = '2026-12-06T05:00:00+08:00';
export const STORAGE_KEY = 'yangmingshan-2026-12-06-v1';
export const peaks = [
  { id: 'ding', name: '頂山', elevation: 768, area: '東段・草原稜線', description: '從風櫃嘴往擎天崗方向的第一座山峰。稜線迎風，冬季需注意東北季風與濃霧。', trail: '風櫃嘴 → 頂山 → 石梯嶺' },
  { id: 'shiti', name: '石梯嶺', elevation: 863, area: '東段・草原稜線', description: '銜接頂山與擎天崗的稜線山峰。草原視野開闊，也更容易受強風、低溫與低能見度影響。', trail: '頂山 → 石梯嶺 → 擎天崗' },
  { id: 'zhugao', name: '竹篙山', elevation: 830, area: '東段・擎天崗支線', description: '十連峰規劃中的支線山峰，需由擎天崗方向往返。回到步道系統後，再往冷水坑方向前進。', trail: '擎天崗 → 竹篙山 → 擎天崗（需往返）' },
  { id: 'qixing-east', name: '七星山東峰', elevation: 1107, area: '中段・七星山群', description: '東向西規劃由冷水坑上行，先訪東峰再往主峰。連續爬升與石階路面是這一段的主要考驗。', trail: '冷水坑 → 七星山東峰 → 七星山主峰' },
  { id: 'qixing-main', name: '七星山主峰', elevation: 1120, area: '中段・全程最高點', description: '臺北市最高峰。稜線缺少遮蔽，風雨與低溫時應以撤退為優先，後續規劃往小油坑下行。', trail: '七星山東峰 → 七星山主峰 → 小油坑' },
  { id: 'datun-main', name: '大屯山主峰', elevation: 1092, area: '西段・大屯山群', description: '由小油坑銜接大屯山區。銜接路段涉及道路，必須先確認交通、步道開放與現地路況。', trail: '小油坑 → 巴拉卡公路銜接 → 大屯鞍部 → 主峰' },
  { id: 'datun-south', name: '大屯山南峰', elevation: 959, area: '西段・濕滑拉繩路段', description: '大屯連峰中較具挑戰的山峰。部分路段陡峭、泥濘且需拉繩；下雨、強風或體力不足時不宜進入。', trail: '大屯山主峰 → 南峰 → 西峰' },
  { id: 'datun-west', name: '大屯山西峰', elevation: 985, area: '西段・濕滑拉繩路段', description: '與南峰串連的陡坡山徑。請保留足夠體力與日照，並確認路線開放；手套不能取代穩定的三點支撐。', trail: '大屯山南峰 → 西峰 → 面天坪' },
  { id: 'miantian', name: '面天山', elevation: 977, area: '西段・面天向天山群', description: '路線後段仍有爬升，不能因接近終點而低估體力需求。若已落後時程，可在面天坪評估提前結束。', trail: '面天坪 → 面天山 → 向天山' },
  { id: 'xiangtian', name: '向天山', elevation: 949, area: '西段・最後一峰', description: '東向西規劃的最後一座山峰。後續往清天宮下行仍需時間與體力，完成十峰不等於已安全下山。', trail: '面天山 → 向天山 → 向天池方向 → 清天宮' },
].map((peak, index) => ({ ...peak, order: index + 1, verification: 'pending', coordinates: null, photo: null }));

export const schedule = [
  { time: '05:00', title: '風櫃嘴出發', detail: '預約接駁抵達；清點人員、開啟頭燈。出發前須確認交通、天氣與步道開放。', type: 'start', badge: '交通待確認' },
  { time: '06:00–08:30', title: '頂山・石梯嶺・竹篙山', detail: '擎天崗往返竹篙山需計入時間；短休與補給約 15–20 分鐘。濃霧勿離開步道。', type: 'peak', badge: '估計時段' },
  { time: '09:00', title: '冷水坑｜第一個決策點', detail: '休息約 15 分鐘。若落後、身體不適或風雨增強，在此結束，查詢小15或108當日服務。', type: 'rest', badge: '可提前結束' },
  { time: '09:15–11:15', title: '七星山東峰・主峰 → 小油坑', detail: '連續爬升後下行。小油坑休息、午餐約 25 分鐘；補水與餐飲服務不保證，請自備。', type: 'peak', badge: '估計時段' },
  { time: '11:45', title: '小油坑｜第二個決策點', detail: '未能在此時間前離開，建議結束當日縱走，不再進大屯山群。可查詢108接駁，班次須事前確認。', type: 'exit', badge: '保守折返門檻' },
  { time: '12:00–14:45', title: '大屯主峰・南峰・西峰', detail: '巴拉卡公路銜接段注意車流。南、西峰遇雨或路況不佳直接放棄，改從既有開放步道撤退。', type: 'peak', badge: '高風險路段' },
  { time: '15:00', title: '面天坪｜第三個決策點', detail: '落後時程、天候轉差或體力下降，放棄最後兩峰，評估經二子坪離開；接駁及出口仍須預先確認。', type: 'exit', badge: '保守折返門檻' },
  { time: '15:00–17:00', title: '面天山・向天山 → 清天宮', detail: '僅在天候、體力與日照餘裕充足時續行。不要以17:00當作日落時間；下山後清點全員、回報平安。', type: 'finish', badge: '估計抵達' },
];
export const gearGroups = [
  { name: '穿著與防護', icon: 'shirt', items: ['止滑登山鞋', '排汗底層與保暖中層', '防風防水外套與雨褲', '保暖帽、手套與備用乾襪', '拉繩路段防滑手套'] },
  { name: '飲水與補給', icon: 'droplets', items: ['足量飲水（依個人需求，勿依賴沿途補水）', '午餐與隨手可吃的行動糧', '電解質補給', '備用糧食與垃圾袋'] },
  { name: '導航與緊急用品', icon: 'compass', items: ['頭燈與備用電池（每人一組）', '手機、行動電源與充電線', '已下載的離線地圖與可靠離線軌跡', '急救包、個人藥物與保溫毯', '哨子、證件與少量現金', '登山計畫及留守人聯絡資料'] },
];
export const sources = [
  { id: 'park', title: '陽明山國家公園管理處', purpose: '官方步道、山峰與最新封閉公告；需重新查核。', url: 'https://www.ymsnp.gov.tw/', status: 'pending' },
  { id: 'osm', title: 'OpenStreetMap', purpose: '互動地圖底圖。底圖與步道標記不代表步道當日開放。', url: 'https://www.openstreetmap.org/', status: 'map' },
  { id: 'bus', title: '大臺北公車', purpose: '小15、108、小6等路線與即時到站；活動日班次尚未確認。', url: 'https://ebus.gov.taipei/', status: 'pending' },
  { id: 'weather', title: '交通部中央氣象署', purpose: '行前山區天氣、警報與日出日落資訊；非活動日預報。', url: 'https://www.cwa.gov.tw/', status: 'pending' },
];
