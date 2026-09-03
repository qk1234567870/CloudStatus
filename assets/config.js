/* CloudStatus v72 — single source of truth */
(function () {
  "use strict";

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  window.CloudStatusConfig = deepFreeze({
    version: "72.0.0",

    app: {
      expectedServiceCount: 23,
      locale: "zh-TW"
    },

    features: {
      filters: true,
      search: true,
      activeOnly: true,
      summary: true,
      stickyToolbar: true,
      sourceBadge: true,
      chineseSubtitle: true,
      routeMeta: true,
      currentState: true,
      activeEvents: true,
      recentEvents: true,
      footer: true,
      autoRefresh: true,
      foregroundRefresh: true,
      cache: true,
      staleCache: true,
      masonry: true
    },

    layout: {
      maxWidth: 1180,
      pageSidePaddingMin: 10,
      pageSidePaddingMax: 32,
      cardGap: 14,
      twoColumnMinWidth: 560,
      columns: 2
    },

    refresh: {
      interval: 5 * 60 * 1000,
      foregroundThreshold: 2 * 60 * 1000
    },

    cache: {
      key: "cloudstatus-cache-v72",
      maxAge: 15 * 60 * 1000,
      staleMaxAge: 24 * 60 * 60 * 1000
    },

    network: {
      fetchTimeout: 6500,
      readerTimeout: 7500,
      fallbackConcurrency: 4
    },

    events: {
      recentLimit: 3,
      retainedLimit: 20
    },

    filters: [
      { id: "all", label: "全部" },
      { id: "cloud", label: "雲端" },
      { id: "ai", label: "AI" },
      { id: "developer", label: "開發者" },
      { id: "platform", label: "平台" },
      { id: "hosting", label: "Hosting" },
      { id: "datacenter", label: "數據中心" },
      { id: "backbone", label: "骨幹網" },
      { id: "crossborder", label: "跨境線路" }
    ],

    crossborderSort: {
      carrierOrder: { telecom: 0, unicom: 1, mobile: 2 },
      classOrder: { premium: 0, international: 1, public: 2 },
      serviceOrder: {
        "cn2-gia": 0,
        "cn2-gt": 1,
        "as4134": 2,
        "as9929": 3,
        "as10099": 4,
        "as4837": 5,
        "cmi": 6
      }
    },

    statusLabels: {
      investigating: "調查中",
      identified: "已確認",
      monitoring: "監控中",
      resolved: "已解決",
      postmortem: "事後分析",
      maintenance: "維護",
      scheduled: "已排程",
      in_progress: "進行中",
      completed: "已完成",
      degraded: "效能下降",
      outage: "服務中斷",
      active: "啟用",
      closed: "已關閉"
    },

    text: {
      title: "☁️ 全球雲端與網路服務狀態",
      preparing: "準備讀取官方來源…",
      loading: "正在讀取官方來源…",
      primaryLoaded: "主要來源已載入 · 正在補充備援資料…",
      updatedPrefix: "最後讀取於 ",
      updateFailed: "更新失敗",
      moduleFailed: "模組載入失敗",
      empty: "沒有符合條件的服務或事件。",
      loadFailed: "資料載入失敗，請稍後重試。",
      moduleLoadFailed: "服務模組載入失敗，請重新整理頁面。",
      searchPlaceholder: "搜尋服務或事件…",
      activeOnly: "只看異常",
      summaryServices: "服務",
      summaryAuto: "自動取得",
      summaryFallback: "官方頁備援",
      footer: "來源依可信度逐層補足；只顯示可追溯的事件與狀態。"
    }
  });
})();
