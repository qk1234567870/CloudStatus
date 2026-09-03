/* CloudStatus - single configuration source */
(function () {
  "use strict";

  var CONFIG = {
    version: "63.0.0",
    expectedServiceCount: 23,

    refresh: {
      interval: 5 * 60 * 1000,
      foregroundThreshold: 2 * 60 * 1000
    },

    cache: {
      key: "cloudstatus-cache-v63",
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
      mergeLimit: 20,
      closedStatuses: {
    resolved:true,
    postmortem:true,
    completed:true,
    closed:true
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
      noisePatterns: [
    /^#+\s*/i, /^recent incidents?$/i, /^past incidents?$/i, /^incident history$/i,
    /^view all$/i, /^view history$/i, /^subscribe$/i, /^rss(?: feed)?$/i, /^atom$/i,
    /^webhook$/i, /^documentation$/i, /^privacy(?: policy)?$/i, /^terms/i,
    /^powered by/i, /^contact us$/i, /^send feedback$/i,
    /^get (?:email|text message|sms) notifications?/i,
    /^receive (?:email|text message|sms) notifications?/i,
    /^\[[^\]]*\]\([^)]+\)$/i,
    /網址來源\s*:/i,
    /url source\s*:/i
  ]
    },

    sources: {
      priority: {
    "official-api": 10,
    "official-json": 20,
    "official-rss": 30,
    "official-history": 40,
    "official-status": 50,
    "official-announcement": 60,
    "official-backup": 70,
    "trusted-third-party": 80,
    "other-backup": 90
  }
    },

    layout: {
      desktopMasonryMinWidth: 760,
      desktopMaxWidth: 1180,
      masonryGap: 14
    },

    theme: {
      background: "#111214",
      card: "#1b1c1f",
      cardSecondary: "#17181b",
      text: "#d8d8dc",
      muted: "#8f9098",
      time: "#686a73",
      white: "#fff",
      blue: "#0a84ff",
      green: "#30d158",
      yellow: "#ffd60a",
      orange: "#ff9f0a",
      red: "#ff453a"
    },

    ui: {
      title: "CloudStatus",
      locale: "zh-TW",
      timezone: "Asia/Taipei",
      labels: {
        loading: "載入中…",
        currentEvents: "目前",
        recentEvents: "最近",
        eventUnit: "個事件",
        eventRecordUnit: "筆事件",
        noReliableEvents: "目前沒有可顯示的可靠事件資料",
        noRecentReliableEvents: "近期沒有可顯示的可靠事件",
        moduleLoadFailed: "模組載入失敗",
        moduleLoadFailedMessage: "服務模組載入失敗，請重新整理頁面。"
      }
    }
  };

  window.CloudStatusConfig = Object.freeze(CONFIG);

  var root = document.documentElement;
  var theme = CONFIG.theme;
  root.style.setProperty("--bg", theme.background);
  root.style.setProperty("--card", theme.card);
  root.style.setProperty("--card-2", theme.cardSecondary);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--muted", theme.muted);
  root.style.setProperty("--time", theme.time);
  root.style.setProperty("--white", theme.white);
  root.style.setProperty("--blue", theme.blue);
  root.style.setProperty("--green", theme.green);
  root.style.setProperty("--yellow", theme.yellow);
  root.style.setProperty("--orange", theme.orange);
  root.style.setProperty("--red", theme.red);
  root.style.setProperty("--shell-max-width", CONFIG.layout.desktopMaxWidth + "px");
  root.style.setProperty("--masonry-gap", CONFIG.layout.masonryGap + "px");
})();
