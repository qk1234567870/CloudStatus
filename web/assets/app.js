const $ = (q) => document.querySelector(q);

const state = {
  data: null,
  filter: "all",
  search: "",
  activeOnly: false,
};

const statusLabel = {
  resolved: "已解決",
  maintenance: "維護中",
  monitoring: "監控中",
  identified: "已確認",
  degraded: "效能下降",
  outage: "服務中斷",
  investigating: "處理中",
};

const categoryLabel = {
  cloud: "雲端",
  ai: "AI",
  developer: "開發者",
  platform: "平台",
  hosting: "Hosting",
  datacenter: "數據中心",
  backbone: "骨幹網",
};

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function formatRange(start, end) {
  if (!start) return "";
  const a = new Date(start);
  if (Number.isNaN(a.getTime())) return "";

  const base = formatDateTime(start);
  if (!end) return base;

  const b = new Date(end);
  if (Number.isNaN(b.getTime())) return base;

  const sameDay =
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay) {
    const time = new Intl.DateTimeFormat("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(b);
    return `${base}-${time}`;
  }

  return `${base}-${formatDateTime(end)}`;
}

function isActive(service) {
  return (service.events || []).some((e) => e.status !== "resolved");
}

function visibleServices() {
  if (!state.data) return [];

  const needle = state.search.trim().toLowerCase();

  return state.data.services.filter((service) => {
    if (state.filter !== "all" && service.category !== state.filter) return false;
    if (state.activeOnly && !isActive(service)) return false;

    if (needle) {
      const haystack = [
        service.name,
        service.desc,
        categoryLabel[service.category] || service.category,
        ...(service.events || []).map((e) => e.title),
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(needle)) return false;
    }

    return true;
  });
}

function renderSummary() {
  const services = state.data?.services || [];
  const active = services.filter(isActive).length;
  const failed = services.filter((s) =>
    ["fetch_failed", "parse_failed"].includes(s.state)
  ).length;

  $("#summary").innerHTML = `
    <div class="metric"><strong>${services.length}</strong><span>服務</span></div>
    <div class="metric"><strong>${active}</strong><span>目前異常</span></div>
    <div class="metric"><strong>${failed}</strong><span>取得/解析異常</span></div>
  `;
}

function renderService(service) {
  const page = service.source === "fallback"
    ? (service.fallback_page || service.page)
    : service.page;

  let body = "";

  if (service.state === "fetch_failed") {
    body = `<div class="message bad">[取得失敗] 目前無法取得服務資料</div>`;
  } else if (service.state === "parse_failed") {
    body = `<div class="message warn">[解析失敗] 已取得來源，但未解析到事件</div>`;
  } else if (!service.events?.length) {
    body = `<div class="message good">[正常] 所有服務運作正常，無近期事件</div>`;
  } else {
    body = service.events.map((event) => {
      const url = service.source === "fallback"
        ? (service.fallback_page || page)
        : (event.url || page);

      return `
        <a class="event" href="${esc(url)}" target="_blank" rel="noopener">
          <span class="tag ${esc(event.status)}">[${esc(statusLabel[event.status] || "處理中")}]</span>
          <span class="event-title" title="${esc(event.title)}">${esc(event.title)}</span>
          <span class="event-time">${esc(formatRange(event.start, event.end))}</span>
        </a>
      `;
    }).join("");
  }

  return `
    <article class="service">
      <div class="service-head">
        <a class="service-name" href="${esc(page)}" target="_blank" rel="noopener">🔹 ${esc(service.name)}</a>
        <span class="service-desc">(${esc(service.desc)})</span>
        ${service.source === "fallback" ? `<span class="source">備援</span>` : ""}
      </div>
      <div class="events">${body}</div>
    </article>
  `;
}

function render() {
  if (!state.data) return;

  renderSummary();

  const list = visibleServices();
  $("#services").innerHTML = list.length
    ? list.map(renderService).join("")
    : `<div class="empty">沒有符合條件的服務或事件。</div>`;
}

async function loadData({ bust = false } = {}) {
  const suffix = bust ? `?t=${Date.now()}` : "";
  const res = await fetch(`./data/status.json${suffix}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  state.data = await res.json();

  const updated = new Date(state.data.generated_at);
  $("#updated").textContent = Number.isNaN(updated.getTime())
    ? "資料時間未知"
    : `資料更新於 ${new Intl.DateTimeFormat("zh-TW", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(updated)}`;

  render();
}

$("#filters").addEventListener("click", (e) => {
  const button = e.target.closest("[data-filter]");
  if (!button) return;

  state.filter = button.dataset.filter;

  document.querySelectorAll(".chip").forEach((x) => {
    x.classList.toggle("active", x === button);
  });

  render();
});

$("#search").addEventListener("input", (e) => {
  state.search = e.target.value;
  render();
});

$("#activeOnly").addEventListener("change", (e) => {
  state.activeOnly = e.target.checked;
  render();
});

$("#reload").addEventListener("click", async () => {
  const btn = $("#reload");
  btn.disabled = true;
  try {
    await loadData({ bust: true });
  } catch (e) {
    $("#updated").textContent = `重新整理失敗：${e.message}`;
  } finally {
    btn.disabled = false;
  }
});

try {
  await loadData({ bust: true });
} catch (e) {
  $("#updated").textContent = `載入失敗：${e.message}`;
  $("#services").innerHTML =
    `<div class="empty">無法載入 status.json。請先執行 GitHub Actions 部署。</div>`;
}

// Browser reloads deployed JSON every minute.
// GitHub Actions itself refreshes upstream data every 15 minutes.
setInterval(() => {
  loadData({ bust: true }).catch(() => {});
}, 60_000);
