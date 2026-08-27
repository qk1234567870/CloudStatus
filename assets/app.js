(function () {
  "use strict";

  var SERVICES = window.CLOUDSTATUS_SERVICES || [];
  var state = { services: [], filter: "all", search: "", activeOnly: false };

  var statusLabel = {
    resolved: "已解決",
    monitoring: "監控中",
    identified: "已確認",
    degraded: "效能下降",
    maintenance: "維護中",
    investigating: "處理中",
    outage: "服務中斷"
  };

  function $(q) { return document.querySelector(q); }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeStatus(value) {
    var s = String(value || "").toLowerCase();

    if (
      s.indexOf("resolved") !== -1 ||
      s.indexOf("completed") !== -1 ||
      s.indexOf("closed") !== -1 ||
      s.indexOf("restored") !== -1 ||
      s.indexOf("recovered") !== -1 ||
      s.indexOf("fixed") !== -1 ||
      s.indexOf("postmortem") !== -1
    ) return "resolved";

    if (s.indexOf("maintenance") !== -1) return "maintenance";
    if (s.indexOf("monitoring") !== -1) return "monitoring";
    if (s.indexOf("identified") !== -1) return "identified";

    if (
      s.indexOf("degraded") !== -1 ||
      s.indexOf("packet loss") !== -1 ||
      s.indexOf("congestion") !== -1
    ) return "degraded";

    if (
      s.indexOf("outage") !== -1 ||
      s.indexOf("offline") !== -1 ||
      s.indexOf("interruption") !== -1 ||
      s.indexOf("failure") !== -1
    ) return "outage";

    return "investigating";
  }

  function timeValue(value) {
    if (!value) return 0;
    var d = new Date(value);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function latestThree(events) {
    var seen = {};
    var unique = [];

    (events || []).forEach(function (e) {
      var key = [e.title || "", e.start || "", e.end || ""].join("|");
      if (seen[key]) return;
      seen[key] = true;
      unique.push(e);
    });

    unique.sort(function (a, b) {
      return timeValue(b.start || b.end) - timeValue(a.start || a.end);
    });

    var active = unique.filter(function (e) { return e.status !== "resolved"; });
    var resolved = unique.filter(function (e) { return e.status === "resolved"; });

    return (active.length ? active.concat(resolved) : resolved).slice(0, 3);
  }

  function formatDate(value) {
    if (!value) return "";
    var d = new Date(value);
    if (isNaN(d.getTime())) return "";

    try {
      return new Intl.DateTimeFormat("zh-TW", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(d);
    } catch (e) {
      return "";
    }
  }

  function formatRange(start, end) {
    if (!start) return "";
    var a = formatDate(start);
    if (!end) return a;
    var b = formatDate(end);
    return b ? a + "-" + b : a;
  }

  async function fetchJson(url) {
    var res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  }

  async function fetchText(url) {
    var res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.text();
  }

  async function fetchReader(url) {
    return await fetchText("https://r.jina.ai/" + url);
  }

  async function sourceStatuspage(source, service) {
    var data = await fetchJson(source.url);
    var incidents = Array.isArray(data.incidents) ? data.incidents : [];

    return incidents.map(function (inc) {
      return {
        title: inc.name || "",
        status: normalizeStatus(inc.status),
        start: inc.created_at || null,
        end: inc.resolved_at || null,
        url: inc.shortlink || inc.url || service.page
      };
    });
  }

  async function sourceGcp(source, service) {
    var data = await fetchJson(source.url);
    var list = Array.isArray(data) ? data : [];

    return list.map(function (inc) {
      return {
        title: inc.external_desc || inc.service_name || "",
        status: inc.end ? "resolved" : "investigating",
        start: inc.begin || null,
        end: inc.end || null,
        url: service.page
      };
    });
  }

  async function sourceRss(source, service) {
    var xml = await fetchText(source.url);
    var doc = new DOMParser().parseFromString(xml, "text/xml");
    var items = Array.prototype.slice.call(doc.querySelectorAll("item"));
    var events = [];

    items.forEach(function (item) {
      var title = item.querySelector("title");
      var date = item.querySelector("pubDate");
      var link = item.querySelector("link");

      if (!title) return;

      events.push({
        title: cleanText(title.textContent),
        status: "resolved",
        start: date ? cleanText(date.textContent) : null,
        end: null,
        url: link ? cleanText(link.textContent) : service.page
      });
    });

    return events;
  }


  // 每個服務自己的事件解析策略。
  // Reader 只負責取得文字；是否為真正事件由這裡決定。
  var SERVICE_PARSER_POLICIES = {
    "cloudflare": {
      accept: /(incident|outage|degraded|maintenance|disruption|service issue|network performance|errors?)/i,
      reject: /(documentation|developers?|blog|community|learn more|all systems operational|no incidents?)/i
    },
    "aws": {
      accept: /(service disruption|service degradation|increased error|increased latency|connectivity|operational issue|incident|outage|maintenance)/i,
      reject: /(documentation|architecture|pricing|getting started|all services.*operating normally|no current incidents?)/i
    },
    "azure": {
      accept: /(service issue|service degradation|service interruption|incident|outage|impact|mitigation|maintenance)/i,
      reject: /(documentation|pricing|products?|learn|all services.*available|no active incidents?)/i
    },
    "google-cloud": {
      accept: /(incident|service disruption|service issue|degraded|outage|latency|packet loss|maintenance)/i,
      reject: /(documentation|products?|solutions?|pricing|all services.*available|no incidents?)/i
    },
    "github": {
      accept: /(incident|disruption|degraded|outage|errors?|maintenance|performance issues?)/i,
      reject: /(documentation|changelog|blog|all systems operational|no incidents?)/i
    },
    "apple": {
      accept: /(resolved outage|resolved issue|outage|issue|maintenance|users? (?:are|were) affected)/i,
      reject: /(available|all services.*operating normally|system status|support)/i
    },
    "oracle": {
      accept: /(incident|service disruption|service degradation|outage|maintenance|availability|performance issue)/i,
      reject: /(documentation|products?|cloud infrastructure home|all systems operational|no incidents?)/i
    },
    "bandwagon": {
      accept: /(incident|outage|maintenance|network issue|packet loss|degraded|routing issue|service interruption)/i,
      reject: /(knowledge base|client area|order|pricing|no incidents?|all systems operational)/i
    },
    "dmit": {
      accept: /(maintenance|incident|outage|network issue|packet loss|fiber|cable|degraded|emergency|interruption|latency|routing issue)/i,
      reject: /(client area|login|order|pricing|looking glass|no incidents?|operating normally)/i
    },
    "equinix": {
      accept: /(incident|outage|degraded|maintenance|service disruption|connectivity issue|performance issue)/i,
      reject: /(products?|services overview|data centers?|interconnection|learn more|all systems operational|no incidents?)/i
    },
    "digital-realty": {
      accept: /(incident|outage|degraded|maintenance|service disruption|connectivity issue|performance issue)/i,
      reject: /(products?|platformdigital|data centers?|solutions?|learn more|all systems operational|no incidents?)/i
    },
    "ntt-gdc": {
      accept: /(incident|outage|degraded|maintenance|service disruption|connectivity issue|performance issue)/i,
      reject: /(data centers?|services?|solutions?|learn more|outage[-\s]?free|no (?:network )?outages?|no incidents?)/i
    },
    "arelion": {
      accept: /(incident|outage|degraded|maintenance|service disruption|packet loss|latency issue|routing issue|network issue)/i,
      reject: /(bgp communities|routing polic(?:y|ies)|network map|products?|learn more|outage[-\s]?free|no incidents?)/i
    },
    "ntt-global-network": {
      accept: /(incident|outage|degraded|maintenance|service disruption|packet loss|latency issue|routing issue|network issue)/i,
      reject: /(no (?:network )?outages?|outage[-\s]?free|100%\s+.*outage[-\s]?free|bgp communities|routing polic(?:y|ies)|our global ip network|availability\s*[:\-]|guaranteed|learn more)/i
    },
    "cogent": {
      accept: /(incident|outage|degraded|maintenance|service disruption|packet loss|latency issue|routing issue|network issue)/i,
      reject: /(products?|network map|looking glass|bgp|routing polic(?:y|ies)|learn more|outage[-\s]?free|no incidents?)/i
    }
  };

  function getServiceParserPolicy(service) {
    return SERVICE_PARSER_POLICIES[service.id] || {
      accept: /(incident|outage|degraded|maintenance|disruption|interruption|packet loss|latency issue|routing issue|network issue|service issue|performance issue|error rate|connectivity issue)/i,
      reject: /(no\s+(?:network\s+)?outages?|no\s+(?:known\s+)?incidents?|outage[-\s]?free|all systems operational|all services operational|operating normally|documentation|learn more)/i
    };
  }

  function filterEventsByServicePolicy(service, events) {
    var policy = getServiceParserPolicy(service);
    return latestThree((events || []).filter(function (event) {
      var title = cleanText(event && event.title);
      if (!title) return false;
      if (policy.reject && policy.reject.test(title)) return false;
      return !policy.accept || policy.accept.test(title);
    }));
  }

  function parseReaderEvents(text, service) {
    var lines = String(text || "").split(/\n+/).map(cleanText).filter(Boolean);
    var events = [];

    // High-confidence incident words only.
    var eventWords = /(incident|outage|degraded|maintenance|disruption|interruption|packet loss|latency issue|routing issue|network issue|service issue|performance issue|availability issue|error rate|connectivity issue|service degradation|service unavailable)/i;

    // Negative/marketing wording that must NEVER be treated as an incident.
    var negativeWords = /(no\s+(?:network\s+)?outages?|no\s+(?:known\s+)?incidents?|no\s+service\s+(?:disruptions?|interruptions?)|outage[-\s]?free|100%\s+(?:network\s+)?outage[-\s]?free|all\s+systems?\s+(?:are\s+)?operational|all\s+services?\s+(?:are\s+)?operational|operating\s+normally|fully\s+operational|no\s+active\s+incidents?|no\s+current\s+incidents?|no\s+incidents?\s+reported|there\s+are\s+currently\s+no\s+active\s+events?)/i;

    // Product/marketing/navigation text that often contains network/routing keywords.
    var noiseWords = /(bgp\s+communities|routing\s+polic(?:y|ies)|service\s+level\s+agreement|sla\b|learn\s+more|our\s+global\s+ip\s+network|availability\s*[:\-]|guaranteed|network\s+overview|product\s+overview|connectivity\s+services|global\s+ip\s+network)/i;

    var normalWords = /(all systems operational|all services operational|operating normally|no active incidents|no current incidents|no incidents reported|there are currently no active events|no network outages|outage[-\s]?free)/i;

    lines.forEach(function (line) {
      if (line.length < 8 || line.length > 220) return;

      // Explicit normal/negative statement: skip as event.
      if (negativeWords.test(line)) return;

      // Known page copy / marketing copy: skip.
      if (noiseWords.test(line)) return;

      // Must have a high-confidence incident phrase.
      if (!eventWords.test(line)) return;

      // Extra protection: generic "network", "routing", "availability" alone are not enough.
      if (/^(availability|network|routing|bgp)\b/i.test(line) && !/(issue|incident|outage|degraded|maintenance|disruption|interruption|loss|latency|error|unavailable)/i.test(line)) {
        return;
      }

      events.push({
        title: line,
        status: normalizeStatus(line),
        start: null,
        end: null,
        url: service.page
      });
    });

    return {
      events: filterEventsByServicePolicy(service, events),
      normal: normalWords.test(text)
    };
  }

  function applyServiceReaderPolicy(service, parsed, text) {
    var normal = !!parsed.normal;

    if (/(no\s+(?:network\s+)?outages?|no\s+(?:known\s+)?incidents?|outage[-\s]?free|100%\s+.*outage[-\s]?free|all\s+systems?\s+(?:are\s+)?operational|all\s+services?\s+(?:are\s+)?operational|operating\s+normally)/i.test(String(text || ""))) {
      normal = true;
    }

    return {
      events: filterEventsByServicePolicy(service, parsed.events || []),
      normal: normal
    };
  }

  async function sourceReader(source, service) {
    var text = await fetchReader(source.url);
    var parsed = parseReaderEvents(text, service);
    parsed = applyServiceReaderPolicy(service, parsed, text);

    return {
      events: parsed.events,
      normal: parsed.normal
    };
  }

  async function trySource(source, service) {
    if (source.type === "statuspage") {
      return { events: await sourceStatuspage(source, service), normal: false };
    }

    if (source.type === "gcp") {
      return { events: await sourceGcp(source, service), normal: false };
    }

    if (source.type === "rss") {
      return { events: await sourceRss(source, service), normal: false };
    }

    if (source.type === "reader") {
      return await sourceReader(source, service);
    }

    throw new Error("Unsupported source: " + source.type);
  }

  async function loadService(service) {
    var errors = [];

    for (var i = 0; i < service.sources.length; i++) {
      var source = service.sources[i];

      try {
        var result = await trySource(source, service);
        var events = latestThree(result.events || []);

        // Source succeeded if it returned events or an explicit normal state.
        if (events.length || result.normal) {
          return {
            id: service.id,
            name: service.name,
            desc: service.desc,
            category: service.category,
            page: service.page,
            state: events.length ? "ok" : "normal",
            sourceLabel: source.label || source.type,
            events: events
          };
        }

        // A valid API returning an empty incident array is also a normal result.
        if (source.type === "statuspage" || source.type === "gcp") {
          return {
            id: service.id,
            name: service.name,
            desc: service.desc,
            category: service.category,
            page: service.page,
            state: "normal",
            sourceLabel: source.label || source.type,
            events: []
          };
        }
      } catch (e) {
        errors.push((source.label || source.type) + ": " + String(e));
      }
    }

    // All automatic sources failed: fall back to official page, not a fake service failure.
    return {
      id: service.id,
      name: service.name,
      desc: service.desc,
      category: service.category,
      page: service.page,
      state: "official_link",
      sourceLabel: "官方頁",
      events: [],
      errors: errors
    };
  }

  function isActive(service) {
    return (service.events || []).some(function (e) { return e.status !== "resolved"; });
  }

  function visibleServices() {
    var needle = state.search.trim().toLowerCase();

    return state.services.filter(function (service) {
      if (state.filter !== "all" && service.category !== state.filter) return false;
      if (state.activeOnly && !isActive(service)) return false;

      if (needle) {
        var haystack = [
          service.name,
          service.desc
        ].concat((service.events || []).map(function (e) { return e.title; }))
          .join(" ")
          .toLowerCase();

        if (haystack.indexOf(needle) === -1) return false;
      }

      return true;
    });
  }

  function renderSummary() {
    var live = state.services.filter(function (s) {
      return s.state === "ok" || s.state === "normal";
    }).length;

    var active = state.services.filter(isActive).length;

    var fallback = state.services.filter(function (s) {
      return s.state === "official_link";
    }).length;

    $("#summary").innerHTML =
      '<div class="metric"><strong>' + state.services.length + '</strong><span>服務</span></div>' +
      '<div class="metric"><strong>' + live + '</strong><span>自動取得</span></div>' +
      '<div class="metric"><strong>' + fallback + '</strong><span>官方頁備援</span></div>';
  }

  function renderService(service) {
    var body = "";

    if (service.state === "official_link") {
      body =
        '<a class="message link" href="' + escapeHtml(service.page) + '" target="_blank" rel="noopener">' +
        '[官方狀態頁] 自動來源不可用，查看官方即時狀態 →</a>';
    } else if (service.state === "normal") {
      body = '<div class="message good">[正常] 目前沒有公開事件</div>';
    } else {
      body = (service.events || []).map(function (event) {
        return (
          '<a class="event" href="' + escapeHtml(event.url || service.page) + '" target="_blank" rel="noopener">' +
            '<span class="tag ' + escapeHtml(event.status) + '">[' +
              escapeHtml(statusLabel[event.status] || "處理中") +
            ']</span>' +
            '<span class="event-title" title="' + escapeHtml(event.title) + '">' +
              escapeHtml(event.title) +
            '</span>' +
            '<span class="event-time">' +
              escapeHtml(formatRange(event.start, event.end)) +
            '</span>' +
          '</a>'
        );
      }).join("");
    }

    return (
      '<article class="service">' +
        '<div class="service-head">' +
          '<a class="service-name" href="' + escapeHtml(service.page) + '" target="_blank" rel="noopener">🔹 ' +
            escapeHtml(service.name) +
          '</a>' +
          '<span class="service-desc">(' + escapeHtml(service.desc) + ')</span>' +
          '<span class="source-badge">' + escapeHtml(service.sourceLabel || "") + '</span>' +
        '</div>' +
        '<div class="events">' + body + '</div>' +
      '</article>'
    );
  }

  function render() {
    renderSummary();

    var list = visibleServices();
    $("#services").innerHTML = list.length
      ? list.map(renderService).join("")
      : '<div class="empty">沒有符合條件的服務或事件。</div>';
  }

  async function refresh() {
    var reload = $("#reload");
    reload.disabled = true;
    $("#updated").textContent = "正在依優先級讀取來源…";

    try {
      state.services = await Promise.all(
        SERVICES.map(function (service) {
          return loadService(service);
        })
      );

      var now = new Intl.DateTimeFormat("zh-TW", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date());

      $("#updated").textContent = "最後讀取於 " + now;
      render();
    } catch (e) {
      $("#updated").textContent = "載入失敗：" + String(e);
      $("#services").innerHTML =
        '<div class="empty">前端載入失敗，請重新整理頁面。</div>';
    } finally {
      reload.disabled = false;
    }
  }

  $("#filters").addEventListener("click", function (e) {
    var button = e.target.closest("[data-filter]");
    if (!button) return;

    state.filter = button.getAttribute("data-filter");

    Array.prototype.forEach.call(document.querySelectorAll(".chip"), function (x) {
      x.classList.toggle("active", x === button);
    });

    render();
  });

  $("#search").addEventListener("input", function (e) {
    state.search = e.target.value;
    render();
  });

  $("#activeOnly").addEventListener("change", function (e) {
    state.activeOnly = e.target.checked;
    render();
  });

  $("#reload").addEventListener("click", refresh);

  refresh();
  setInterval(refresh, 60000);
})();
