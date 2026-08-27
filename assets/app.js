(function () {
  "use strict";

  var SERVICES = window.CLOUDSTATUS_SERVICES || [];
  var state = { services: [], filter: "all", search: "", activeOnly: false };

  var REFRESH_INTERVAL = 5 * 60 * 1000;
  var FOREGROUND_REFRESH_THRESHOLD = 2 * 60 * 1000;
  var lastRefresh = 0;
  var refreshInFlight = false;

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
        status: null,
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
        status: null,
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



  var EVENT_NOISE_PATTERNS = [
    /^no known service issues?$/i, /^recent incidents?$/i, /^past incidents?$/i,
    /^incident history$/i, /^view all$/i, /^subscribe$/i, /^rss$/i, /^atom$/i,
    /^webhook$/i, /^status page$/i, /^contact us$/i, /^privacy(?: policy)?$/i,
    /^terms(?: of service)?$/i, /^powered by\b/i,
    /^get (?:email|text message|sms) notifications?\b/i,
    /^receive (?:email|text message|sms) notifications?\b/i
  ];

  function looksLikeNoiseTitle(title) {
    var raw = cleanText(title || "");
    if (!raw) return true;
    if (/^#{1,6}\s+/.test(raw)) return true;
    if (/^\[[^\]]*\]\([^)]+\)$/.test(raw)) return true;
    var plain = raw.replace(/^#{1,6}\s+/, "").replace(/\*\*/g, "").replace(/`/g, "").trim();
    for (var i = 0; i < EVENT_NOISE_PATTERNS.length; i++) {
      if (EVENT_NOISE_PATTERNS[i].test(plain)) return true;
    }
    if (/notification/i.test(plain) && /(email|sms|text message|subscribe)/i.test(plain)) return true;
    return false;
  }

  function strictFilterEvents(service, events, sourceType) {
    return (events || []).filter(function (event) {
      if (!event || looksLikeNoiseTitle(event.title)) return false;
      var title = cleanText(event.title);
      if (title.length < 5) return false;
      if (["reader","official-page","telegram","social","third-party"].indexOf(sourceType) !== -1) {
        var semantic = /(incident|outage|degrad|disrupt|maintenance|latency|packet loss|network|routing|unavailable|availability|failure|failed|error|interruption|service issue|investigat|monitoring|resolved|restored|recovered|故障|異常|中斷|維護|延遲|丟包|路由|恢復|修復)/i;
        if (!semantic.test(title) && !event.start && !event.end && !event.status) return false;
      }
      return true;
    });
  }

  function sourceTier(type) {
    if (["statuspage","gcp","official-json","official-api"].indexOf(type) !== -1) return 1;
    if (["rss","official-rss"].indexOf(type) !== -1) return 2;
    if (type === "official-history") return 3;
    if (type === "official-page") return 4;
    if (type === "reader") return 5;
    if (["telegram","social"].indexOf(type) !== -1) return 6;
    return 7;
  }

  var SOURCE_CONFIDENCE = {
    "statuspage": 100,
    "gcp": 100,
    "official-json": 100,
    "official-api": 100,
    "rss": 92,
    "official-rss": 92,
    "official-page": 82,
    "reader": 72,
    "telegram": 68,
    "social": 62,
    "third-party": 48
  };

  function sourceConfidence(source) {
    return SOURCE_CONFIDENCE[source.type] || 60;
  }

  function normalizeEventTitle(title) {
    return cleanText(title)
      .toLowerCase()
      .replace(/\[[^\]]+\]/g, " ")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function eventFingerprint(event) {
    var title = normalizeEventTitle(event.title || "");
    var date = event.start ? String(event.start).slice(0, 10) : "";
    return title + "|" + date;
  }

  function mergeCollectedEvents(collected) {
    var map = {};

    collected.forEach(function (entry) {
      (entry.events || []).forEach(function (event) {
        var key = eventFingerprint(event);
        if (!key || key === "|") return;

        var candidate = Object.assign({}, event, {
          sourceLabel: entry.sourceLabel,
          sourceType: entry.sourceType,
          confidence: entry.confidence
        });

        if (!map[key]) {
          map[key] = candidate;
          return;
        }

        var current = map[key];

        // Prefer the higher-confidence source, while filling missing fields
        // from lower-priority corroborating sources.
        if ((candidate.confidence || 0) > (current.confidence || 0)) {
          candidate.start = candidate.start || current.start;
          candidate.end = candidate.end || current.end;
          candidate.url = candidate.url || current.url;
          map[key] = candidate;
        } else {
          current.start = current.start || candidate.start;
          current.end = current.end || candidate.end;
          current.url = current.url || candidate.url;
        }
      });
    });

    var events = Object.keys(map).map(function (key) { return map[key]; });

    events.sort(function (a, b) {
      var aActive = a.status !== "resolved" ? 1 : 0;
      var bActive = b.status !== "resolved" ? 1 : 0;

      if (aActive !== bActive) return bActive - aActive;

      var timeDiff = timeValue(b.start || b.end) - timeValue(a.start || a.end);
      if (timeDiff !== 0) return timeDiff;

      return (b.confidence || 0) - (a.confidence || 0);
    });

    return events.slice(0, 3);
  }

  function classifySourceResult(result) {
    if (result && Array.isArray(result.events) && result.events.length) {
      return "events_found";
    }
    if (result && result.normal === true) {
      return "explicit_normal";
    }
    if (result) {
      return "no_event_data";
    }
    return "parse_failed";
  }

  async function loadService(service) {
    var collected = [], sourceStates = [], explicitNormal = [], errors = [];
    var sources = service.sources.slice().sort(function(a,b){ return sourceTier(a.type)-sourceTier(b.type); });

    for (var i = 0; i < sources.length; i++) {
      var source = sources[i];
      try {
        var result = await trySource(source, service);
        var sourceEvents = strictFilterEvents(
          service,
          filterEventsByServicePolicy(service, latestThree((result && result.events) || [])),
          source.type
        );

        var normal = !!(result && result.normal);
        if (!sourceEvents.length && result &&
            ["statuspage","gcp","official-json","official-api"].indexOf(source.type) !== -1) normal = true;

        var state = sourceEvents.length ? "events_found" : (normal ? "explicit_normal" : "no_event_data");
        sourceStates.push({label: source.label || source.type, type: source.type, state: state});

        if (sourceEvents.length) {
          collected.push({
            sourceLabel: source.label || source.type,
            sourceType: source.type,
            confidence: sourceConfidence(source),
            events: sourceEvents
          });
          if (mergeCollectedEvents(collected).length >= 3) break;
        } else if (normal) {
          explicitNormal.push({
            sourceLabel: source.label || source.type,
            sourceType: source.type,
            confidence: sourceConfidence(source)
          });
        }
      } catch (e) {
        sourceStates.push({label: source.label || source.type, type: source.type, state: "fetch_failed"});
        errors.push((source.label || source.type) + ": " + String(e));
      }
    }

    var mergedEvents = mergeCollectedEvents(collected);
    if (mergedEvents.length) {
      var used = [];
      mergedEvents.forEach(function(e){
        if (e.sourceLabel && used.indexOf(e.sourceLabel) < 0) used.push(e.sourceLabel);
      });
      return {
        id: service.id, name: service.name, desc: service.desc, category: service.category,
        page: service.page, state: "ok",
        sourceLabel: used.length ? used.join(" + ") : "事件來源",
        events: mergedEvents.slice(0,3), sourceStates: sourceStates
      };
    }

    if (explicitNormal.length) {
      explicitNormal.sort(function(a,b){ return b.confidence-a.confidence; });
      return {
        id: service.id, name: service.name, desc: service.desc, category: service.category,
        page: service.page, state: "normal", sourceLabel: explicitNormal[0].sourceLabel,
        events: [], sourceStates: sourceStates
      };
    }

    return {
      id: service.id, name: service.name, desc: service.desc, category: service.category,
      page: service.page, state: "official_link", sourceLabel: "官方頁",
      events: [], sourceStates: sourceStates, errors: errors
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
            '<span class="event-title" title="' + escapeHtml(event.title + (event.sourceLabel ? " · " + event.sourceLabel : "")) + '">' +
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

  async function refresh(options) {
    options = options || {};
    var force = !!options.force;

    if (refreshInFlight && !force) return;

    var reload = $("#reload");
    refreshInFlight = true;
    reload.disabled = true;
    $("#updated").textContent = "正在依優先級更新資料…";

    try {
      state.services = await Promise.all(
        SERVICES.map(function (service) { return loadService(service); })
      );

      lastRefresh = Date.now();
      var now = new Intl.DateTimeFormat("zh-TW", {
        month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
      }).format(new Date(lastRefresh));

      $("#updated").textContent = "最後讀取於 " + now;
      render();
    } catch (e) {
      $("#updated").textContent = "更新失敗：" + String(e);
      if (!state.services.length) {
        $("#services").innerHTML = '<div class="empty">前端載入失敗，請稍後重新整理。</div>';
      }
    } finally {
      refreshInFlight = false;
      reload.disabled = false;
    }
  }

  function shouldRefreshOnForeground() {
    return !lastRefresh || (Date.now() - lastRefresh >= FOREGROUND_REFRESH_THRESHOLD);
  }

  function startAutoRefresh() {
    setInterval(function () {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_INTERVAL);

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && shouldRefreshOnForeground()) refresh();
    });

    window.addEventListener("focus", function () {
      if (shouldRefreshOnForeground()) refresh();
    });
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

  $("#reload").addEventListener("click", function () { refresh({ force: true }); });
  refresh({ force: true });
  startAutoRefresh();
})();
