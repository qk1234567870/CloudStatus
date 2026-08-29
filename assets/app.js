(function () {
  "use strict";

  var SERVICES = window.CLOUDSTATUS_SERVICES || [];
  var SERVICE_PARSERS = window.CloudStatusServiceParsers || {};
  var EXPECTED_SERVICE_COUNT = 16;
  if (SERVICES.length !== EXPECTED_SERVICE_COUNT) {
    console.warn("CloudStatus service modules loaded:", SERVICES.length, "/", EXPECTED_SERVICE_COUNT);
  }
  var state = { services: [], filter: "all", search: "", activeOnly: false };

  var REFRESH_INTERVAL = 5 * 60 * 1000;
  var CACHE_KEY = "cloudstatus-cache-v45";
  var CACHE_MAX_AGE = 15 * 60 * 1000;
  var FALLBACK_CONCURRENCY = 4;
  var FOREGROUND_REFRESH_THRESHOLD = 2 * 60 * 1000;
  var lastRefresh = 0;
  var refreshInFlight = false;

  var STATUS_LABELS = {
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
  };

  var NOISE = [
    /^#+\s*/i, /^recent incidents?$/i, /^past incidents?$/i, /^incident history$/i,
    /^view all$/i, /^view history$/i, /^subscribe$/i, /^rss(?: feed)?$/i, /^atom$/i,
    /^webhook$/i, /^documentation$/i, /^privacy(?: policy)?$/i, /^terms/i,
    /^powered by/i, /^contact us$/i, /^send feedback$/i,
    /^get (?:email|text message|sms) notifications?/i,
    /^receive (?:email|text message|sms) notifications?/i,
    /^\[[^\]]*\]\([^)]+\)$/i,
    /網址來源\s*:/i,
    /url source\s*:/i
  ];

  function $(q) { return document.querySelector(q); }
  function cleanText(v) { return String(v == null ? "" : v).replace(/\s+/g, " ").trim(); }
  function escapeHtml(v) {
    return String(v == null ? "" : v).replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function explicitStatus(v) {
    if (v == null || v === "") return null;
    var s = cleanText(v).toLowerCase().replace(/\s+/g, "_");
    var map = {
      investigating:"investigating", identified:"identified", monitoring:"monitoring",
      resolved:"resolved", postmortem:"postmortem", maintenance:"maintenance",
      scheduled:"scheduled", in_progress:"in_progress", completed:"completed",
      degraded:"degraded", outage:"outage", active:"active", closed:"closed"
    };
    return map[s] || null;
  }

  function timeValue(v) {
    if (!v) return 0;
    var d = new Date(v);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function formatDate(v) {
    if (!v) return "";
    var d = new Date(v);
    if (isNaN(d.getTime())) return "";
    try {
      return new Intl.DateTimeFormat("zh-TW", {
        year:"numeric", month:"numeric", day:"numeric",
        hour:"2-digit", minute:"2-digit", hour12:false
      }).format(d);
    } catch (e) { return ""; }
  }

  function formatRange(a,b) {
    var x = formatDate(a);
    if (!x) return "";
    if (!b) return x;

    var da = new Date(a);
    var db = new Date(b);
    if (isNaN(da.getTime()) || isNaN(db.getTime())) {
      var y0 = formatDate(b);
      return y0 ? x + "-" + y0 : x;
    }

    var sameDay =
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate();

    if (sameDay) {
      try {
        var endTime = new Intl.DateTimeFormat("zh-TW", {
          hour:"2-digit",
          minute:"2-digit",
          hour12:false
        }).format(db);
        return x + "-" + endTime;
      } catch (e) {
        return x;
      }
    }

    var y = formatDate(b);
    return y ? x + "-" + y : x;
  }

  function looksNoise(title) {
    var t = cleanText(title);
    if (!t || t.length < 4) return true;
    for (var i=0;i<NOISE.length;i++) if (NOISE[i].test(t)) return true;
    if (/notification/i.test(t) && /(email|sms|text message|subscribe)/i.test(t)) return true;
    return false;
  }

  function normalizeEvent(event, service, source) {
    if (!event) return null;
    var title=cleanText(event.title);
    if (!title || looksNoise(title)) return null;

    var status=event.status ? explicitStatus(event.status) : null;
    if (!status && event.statusRaw) status=explicitStatus(event.statusRaw);

    return {
      title:title,
      status:status || null,
      statusRaw:event.statusRaw || null,
      start:event.start || null,
      end:event.end || null,
      url:event.url || (source && source.url) || (service && service.page) || null,
      sourceLabel:event.sourceLabel || (source && source.label) || null
    };
  }

  function normalizeResult(result, service, source) {
    result=result || {};
    var events=(result.events || []).map(function(e){
      return normalizeEvent(e,service,source);
    }).filter(Boolean);

    return {
      events:sortRecent(events),
      health:result.health || null,
      healthText:result.healthText || null
    };
  }


  function fingerprint(e) {
    return cleanText(e.title).toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim() +
      "|" + (e.start ? String(e.start).slice(0,10) : "");
  }

  function dedupe(events) {
    var out=[], seen={};
    (events||[]).forEach(function(e){
      if (!e || looksNoise(e.title)) return;
      var k=fingerprint(e);
      if (!k || seen[k]) return;
      seen[k]=true; out.push(e);
    });
    return out;
  }

  function sortRecent(events) {
    return dedupe(events).sort(function(a,b){
      return timeValue(b.start || b.end) - timeValue(a.start || a.end);
    }).slice(0,3);
  }

  async function fetchJson(url) {
    var r = await fetch(url,{cache:"no-store"});
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  }

  async function fetchText(url) {
    var r = await fetch(url,{cache:"no-store"});
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.text();
  }

  async function fetchReader(url) {
    return await fetchText("https://r.jina.ai/" + url);
  }

  function lines(text) {
    return String(text||"").split(/\n+/).map(cleanText).filter(Boolean);
  }

  function findDate(text) {
    var m = String(text||"").match(
      /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}(?:\s+(?:at\s+)?)?\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s*\([^)]+\)|\s+[A-Z]{2,5})?/i
    );
    if (!m) return null;
    var d = new Date(m[0].replace(/\([^)]+\)/g,""));
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  function findAnyDate(text) {
    var raw=String(text||"");

    // ISO / Telegram / common machine-readable forms.
    var patterns=[
      /\b\d{4}-\d{2}-\d{2}[T\s]\d{1,2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:?\d{2})?\b/,
      /\b\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}\b/,
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}(?:\s+(?:at\s+)?)?\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s+[A-Z]{2,5})?\b/i
    ];

    for(var i=0;i<patterns.length;i++){
      var m=raw.match(patterns[i]);
      if(!m) continue;
      var d=new Date(m[0]);
      if(!isNaN(d.getTime())) return d.toISOString();
    }

    return findDate(raw);
  }

  function findDateRange(text) {
    var ds = [];
    var re = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\s+\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s*\([^)]+\)|\s+[A-Z]{2,5})?/gi;
    var m;
    while ((m=re.exec(String(text||""))) !== null) {
      var d=new Date(m[0].replace(/\([^)]+\)/g,""));
      if (!isNaN(d.getTime())) ds.push(d.toISOString());
    }
    return { start: ds[0] || null, end: ds[1] || null };
  }

  function statuspageAdapter(data, service, source) {
    var incidents = Array.isArray(data.incidents) ? data.incidents : [];
    var events = incidents.map(function(inc){
      return {
        title: cleanText(inc.name),
        status: explicitStatus(inc.status),
        statusRaw: inc.status || null,
        impact: inc.impact || null,
        start: inc.created_at || null,
        end: inc.resolved_at || null,
        url: inc.shortlink || inc.url || service.page,
        sourceLabel: source.label
      };
    });
    var active = events.some(function(e){ return e.status && e.status !== "resolved" && e.status !== "postmortem" && e.status !== "completed" && e.status !== "closed"; });
    return { events: sortRecent(events), health: active ? "incident" : "normal", healthText: active ? null : "目前沒有未解決事件" };
  }

  function gcpAdapter(data, service, source) {
    var list = Array.isArray(data) ? data : [];
    var events = list.map(function(inc){
      return {
        title: cleanText(inc.external_desc || inc.service_name || ""),
        status: explicitStatus(inc.status || null),
        statusRaw: inc.status || null,
        start: inc.begin || null,
        end: inc.end || null,
        url: service.page,
        sourceLabel: source.label
      };
    });
    return { events: sortRecent(events), health: null, healthText: null };
  }

  function rssAdapter(xml, service, source) {
    var doc = new DOMParser().parseFromString(xml,"text/xml");
    var items = Array.prototype.slice.call(doc.querySelectorAll("item, entry"));
    var events = [];
    items.forEach(function(item){
      var t=item.querySelector("title"), d=item.querySelector("pubDate, published, updated"), l=item.querySelector("link");
      if (!t) return;
      var href = l ? (l.getAttribute("href") || cleanText(l.textContent)) : service.page;
      events.push({
        title:cleanText(t.textContent), status:null, statusRaw:null,
        start:d ? cleanText(d.textContent) : null, end:null, url:href || service.page,
        sourceLabel:source.label
      });
    });
    return { events:sortRecent(events), health:null, healthText:null };
  }

  function parseGooglePage(text, service, source) {
    var t=String(text||"");
    var normal=/No broad severe incidents|沒有大規模嚴重事件|No incidents/i.test(t);
    var events=[];
    var ls=lines(t);
    for (var i=0;i<ls.length;i++) {
      if (/^Recent incidents?\s*\(\d+\)/i.test(ls[i]) && ls[i+2]) {
        var title=ls[i+2];
        if (!looksNoise(title)) {
          var block=ls.slice(i+1,i+12).join(" ");
          var st=null, raw=null;
          var sm=block.match(/\b(Active|Closed)\b/i);
          if (sm) { raw=sm[1]; st=explicitStatus(sm[1]); }
          events.push({title:title,status:st,statusRaw:raw,start:findDate(block),end:null,url:service.page,sourceLabel:source.label});
        }
      }
    }
    return {events:sortRecent(events),health:normal?"normal":null,healthText:normal?"沒有大規模嚴重事件":null};
  }

  function parseAzure(text, service, source) {
    var t=String(text||"");
    var normal=/There are currently no active events|目前沒有.*事件|all services.*available/i.test(t);
    var events=[];
    // Only accept blocks that visibly expose a status label.
    var ls=lines(t);
    var statuses=/^(Investigating|Identified|Monitoring|Resolved|Maintenance|Active|Closed)$/i;
    for (var i=0;i<ls.length;i++) {
      if (!statuses.test(ls[i])) continue;
      var title = i>0 ? ls[i-1] : "";
      if (!title || looksNoise(title)) continue;
      events.push({title:title,status:explicitStatus(ls[i]),statusRaw:ls[i],start:findDate(ls.slice(i,i+6).join(" ")),end:null,url:service.page,sourceLabel:source.label});
    }
    return {events:sortRecent(events),health:normal?"normal":null,healthText:normal?"目前沒有公開事件":null};
  }

  function appleStructuredAdapter(data, service, source) {
    var services = data && Array.isArray(data.services) ? data.services : [];
    var events = [];
    var activeCount = 0;

    services.forEach(function (svc) {
      var serviceName = cleanText(svc && svc.serviceName);
      var svcEvents = svc && Array.isArray(svc.events) ? svc.events : [];

      svcEvents.forEach(function (ev) {
        if (!ev) return;

        var rawStatus = cleanText(ev.eventStatus || "").toLowerCase();
        var rawType = cleanText(ev.statusType || "");

        // Apple 的 eventStatus 是官方結構化狀態。
        // resolved / completed 表示已結束；其他非空狀態視為目前仍有事件。
        var status = null;
        if (rawStatus === "resolved") status = "resolved";
        else if (rawStatus === "completed") status = "completed";
        else if (rawStatus === "investigating") status = "investigating";
        else if (rawStatus === "monitoring") status = "monitoring";
        else if (rawStatus === "identified") status = "identified";
        else if (rawStatus === "scheduled") status = "scheduled";
        else if (rawStatus === "in progress" || rawStatus === "in_progress") status = "in_progress";

        if (
          rawStatus &&
          rawStatus !== "resolved" &&
          rawStatus !== "completed"
        ) {
          activeCount++;
        }

        var start = null;
        var end = null;

        if (typeof ev.epochStartDate === "number" && isFinite(ev.epochStartDate)) {
          var es = ev.epochStartDate < 100000000000 ? ev.epochStartDate * 1000 : ev.epochStartDate;
          start = new Date(es).toISOString();
        } else if (ev.startDate) {
          var sd = new Date(ev.startDate);
          if (!isNaN(sd.getTime())) start = sd.toISOString();
        }

        if (typeof ev.epochEndDate === "number" && isFinite(ev.epochEndDate)) {
          var ee = ev.epochEndDate < 100000000000 ? ev.epochEndDate * 1000 : ev.epochEndDate;
          end = new Date(ee).toISOString();
        } else if (ev.endDate) {
          var ed = new Date(ev.endDate);
          if (!isNaN(ed.getTime())) end = ed.toISOString();
        }

        var title = serviceName || "Apple Service";
        // 不把描述內容當事件標題；Apple 官方 UI 的主體就是服務名稱。
        // statusType 保留為來源資訊，不拿來推斷 status。
        events.push({
          title: title,
          status: status,
          statusRaw: ev.eventStatus || null,
          impact: rawType || null,
          start: start,
          end: end,
          url: service.page,
          sourceLabel: source.label
        });
      });
    });

    return {
      events: sortRecent(events),
      health: activeCount > 0 ? "incident" : "normal",
      healthText: activeCount > 0
        ? (activeCount + " 個目前事件")
        : "所有服務均正常運作"
    };
  }

  async function fetchAppleJson(url) {
    var raw = "";

    try {
      raw = await fetchText(url);
    } catch (e) {
      // GitHub Pages 瀏覽器可能被 Apple CORS 擋住，改由 Reader 取原始資料。
      raw = await fetchText("https://r.jina.ai/" + url);
    }

    raw = String(raw || "").trim();

    // Reader 可能包 Markdown code fence。
    raw = raw
      .replace(/^```(?:json|javascript|js)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .replace(/^jsonCallback\s*\(\s*/i, "")
      .replace(/\s*\)\s*;?\s*$/i, "");

    // 取第一個 JSON object，避免 Reader 附加標頭。
    var first = raw.indexOf("{");
    var last = raw.lastIndexOf("}");
    if (first >= 0 && last > first) {
      raw = raw.slice(first, last + 1);
    }

    return JSON.parse(raw);
  }

  function parseAppleClockRange(text) {
    var raw = String(text || "");

    var m = raw.match(
      /\b(Today|Yesterday),?\s+(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i
    );

    if (!m) {
      m = raw.match(
        /\b([A-Z][a-z]+\s+\d{1,2},\s+\d{4}),?\s+(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i
      );
    }

    if (!m) return { start:null, end:null };

    function to24(hour, minute, ampm) {
      var h = parseInt(hour, 10);
      var min = parseInt(minute, 10);
      var p = String(ampm || "").toUpperCase();
      if (p === "PM" && h < 12) h += 12;
      if (p === "AM" && h === 12) h = 0;
      return { h:h, m:min };
    }

    var dateBase;
    var label = m[1];

    if (/^Today$/i.test(label) || /^Yesterday$/i.test(label)) {
      var now = new Date();
      dateBase = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (/^Yesterday$/i.test(label)) {
        dateBase.setDate(dateBase.getDate() - 1);
      }
    } else {
      dateBase = new Date(label);
      if (isNaN(dateBase.getTime())) return { start:null, end:null };
    }

    var a = to24(m[2], m[3], m[4]);
    var b = to24(m[5], m[6], m[7]);

    var start = new Date(
      dateBase.getFullYear(), dateBase.getMonth(), dateBase.getDate(),
      a.h, a.m, 0
    );

    var end = new Date(
      dateBase.getFullYear(), dateBase.getMonth(), dateBase.getDate(),
      b.h, b.m, 0
    );

    if (end.getTime() < start.getTime()) {
      end = new Date(end.getTime() + 86400000);
    }

    return {
      start:start.toISOString(),
      end:end.toISOString()
    };
  }

  function isAppleServiceInventoryLine(line) {
    var t = cleanText(line);

    // Apple System Status 的「available」服務清單不是事件。
    if ((t.match(/\bavailable\b/gi) || []).length >= 2) return true;
    if ((t.match(/:\s*available\b/gi) || []).length >= 1) return true;

    return false;
  }

  function stripMarkdownLine(line) {
    return cleanText(String(line || "")
      .replace(/^#{1,6}\s+/, "")
      .replace(/^\s*[-*+]\s+/, "")
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/`/g, ""));
  }

  function parseApple(text, service, source) {
    var t = String(text || "");

    // Jina/Reader 可能把 Apple HTML 轉成 Markdown。
    var ls = lines(t).map(stripMarkdownLine).filter(Boolean);

    var normal = ls.some(function (line) {
      return /All services are operating normally/i.test(line) ||
             /所有服務均正常運作/i.test(line);
    });

    var events = [];
    var eventTitle = /^(.+?)\s*[-–—]\s*(Resolved Performance|Resolved Outage|Resolved Issue|Resolved Availability|Performance|Outage|Issue|Maintenance)$/i;

    for (var i = 0; i < ls.length; i++) {
      var line = ls[i];

      if (!line || isAppleServiceInventoryLine(line)) continue;

      var m = line.match(eventTitle);
      if (!m) continue;

      var title = cleanText(m[1]);
      var raw = cleanText(m[2]);

      if (
        !title ||
        /^System Status$/i.test(title) ||
        /^All services/i.test(title) ||
        isAppleServiceInventoryLine(title) ||
        looksNoise(title)
      ) {
        continue;
      }

      var status = null;
      if (/^Resolved\b/i.test(raw)) status = "resolved";
      else if (/^Maintenance$/i.test(raw)) status = "maintenance";
      else if (/^Outage$/i.test(raw)) status = "outage";

      var block = ls.slice(i, Math.min(i + 9, ls.length)).join(" ");
      var range = parseAppleClockRange(block);

      events.push({
        title:title,
        status:status,
        statusRaw:raw,
        start:range.start,
        end:range.end,
        url:service.page,
        sourceLabel:source.label
      });
    }

    return {
      events:sortRecent(events),
      health:normal ? "normal" : null,
      healthText:normal ? "所有服務均正常運作" : null
    };
  }

  function parseAppleBackup(text, service, source) {
    var ls = lines(String(text || "")).map(function(x) {
      return cleanText(String(x || "")
        .replace(/^#{1,6}\s+/, "")
        .replace(/^\s*[-*+]\s+/, "")
        .replace(/\*\*/g, "")
        .replace(/__/g, "")
        .replace(/`/g, ""));
    }).filter(Boolean);

    var events = [];
    var titleRe = /^(.+?):\s*(Performance|Outage|Issue|Maintenance)\s*(?:Resolved)?$/i;

    for (var i = 0; i < ls.length; i++) {
      var line = ls[i];
      var m = line.match(titleRe);
      if (!m) continue;

      var title = cleanText(m[1]);
      if (!title || looksNoise(title) || isAppleServiceInventoryLine(title)) continue;

      var block = ls.slice(i, Math.min(i + 10, ls.length)).join(" ");
      var resolved = /\bResolved\b/i.test(block);
      var start = findDate(block);
      var end = null;

      events.push({
        title: title,
        status: resolved ? "resolved" : null,
        statusRaw: resolved ? "Resolved" : null,
        impact: cleanText(m[2]),
        start: start,
        end: end,
        url: service.page,
        sourceLabel: source.label
      });
    }

    return {
      events: sortRecent(events),
      health: null,
      healthText: null
    };
  }

  function parseBandwagon(text, service, source) {
    var t=String(text||"");
    var ls=lines(t), events=[];
    var activeCount = null;
    var mc=t.match(/(\d+)\s+active/i); if (mc) activeCount=parseInt(mc[1],10);
    var status=/^(Maintenance|Incident|Outage|Resolved|Monitoring)$/i;
    for (var i=0;i<ls.length;i++) {
      if (!status.test(ls[i])) continue;
      var title=i>0?ls[i-1]:"";
      if (!title || /recent incidents|active incident/i.test(title) || looksNoise(title)) continue;
      var block=ls.slice(i-1,i+16).join(" ");
      var range=findDateRange(block);
      events.push({
        title:title,status:explicitStatus(ls[i]),statusRaw:ls[i],
        start:range.start,end:range.end,url:service.page,sourceLabel:source.label
      });
    }
    return {
      events:sortRecent(events),
      health:activeCount===0?"normal":(activeCount>0?"incident":null),
      healthText:activeCount===0?"目前沒有啟用事件":(activeCount>0?activeCount+" 個啟用事件":null)
    };
  }

  function parseOracle(text, service, source) {
    var t=String(text||""), ls=lines(t), events=[];
    var normal=/All Systems Operational|No incidents reported|No incidents/i.test(t);
    var status=/^(Investigating|Identified|Monitoring|Resolved|Maintenance|Completed|Closed)$/i;
    for (var i=0;i<ls.length;i++) {
      if (!status.test(ls[i])) continue;
      var title=i>0?ls[i-1]:"";
      if (!title || looksNoise(title)) continue;
      events.push({title:title,status:explicitStatus(ls[i]),statusRaw:ls[i],start:findDate(ls.slice(i,i+8).join(" ")),end:null,url:service.page,sourceLabel:source.label});
    }
    return {events:sortRecent(events),health:normal?"normal":null,healthText:normal?"所有系統正常":null};
  }

  function parseDMITSecurity(text, service, source) {
    var ls=lines(text), events=[];
    var t=String(text||"");

    // 這個頁面是單篇 DMIT Proactive Security / network incident advisory，
    // 頁面本身不一定提供日期，因此不能再要求「必須有日期」才承認事件。
    var headingPatterns=[
      /DMIT network incident advisory/i,
      /PROACTIVE SECURITY NOTICE/i,
      /DMIT Proactive Security identified potentially risky applications/i
    ];

    var title=null;
    for(var i=0;i<ls.length && !title;i++){
      var line=cleanText(ls[i]);
      if(/DMIT network incident advisory/i.test(line)){
        title=line;
      }
    }

    // 若 Reader 把主標題拆掉，使用頁面明確的安全公告標題。
    if(!title && headingPatterns.some(function(re){return re.test(t);})){
      title="DMIT network incident advisory";
    }

    if(!title){
      return {events:[],health:null,healthText:null};
    }

    // 日期有就顯示，沒有就保持空白；不捏造時間。
    var start=findAnyDate(t);

    // 只有來源真的寫出結構化/明確狀態詞時才套狀態。
    // identified 在正文中描述「identified risky applications」不是事件生命週期狀態，
    // 因此這裡刻意不把 identified 自動當成 status。
    var rawStatus=null;
    var explicitLifecycle=t.match(/\b(Investigating|Monitoring|Resolved|Completed|Closed)\b/i);
    if(explicitLifecycle) rawStatus=explicitLifecycle[1];

    events.push({
      title:title,
      status:rawStatus?explicitStatus(rawStatus):null,
      statusRaw:rawStatus,
      start:start,
      end:null,
      url:source.url,
      sourceLabel:source.label
    });

    return {events:events,health:null,healthText:null};
  }

  function parseDMIT(text, service, source) {
    var ls=lines(text), events=[];

    // Telegram / Server Status 的公告正文常包含 Impact / Additional 等句子。
    // 只接受公告標題，不再把正文每一行都當成獨立事件。
    var headingWords=/(maintenance notification|incident notification|network incident|outage notification|emergency maintenance|scheduled maintenance|service interruption|routing issue|network issue|packet loss)/i;
    var continuation=/^(impact\s*:|additional\b|update\s*:|details?\s*:|affected\b|•|\-|\*)/i;

    for(var i=0;i<ls.length;i++){
      var title=cleanText(ls[i]);

      if(!title || continuation.test(title) || looksNoise(title)) continue;
      if(!headingWords.test(title)) continue;

      // 向標題前後擴大範圍找 Telegram/官方頁時間。
      var block=ls.slice(Math.max(0,i-5),Math.min(ls.length,i+12)).join(" ");
      var startDate=findAnyDate(block);

      events.push({
        title:title,
        status:null,
        statusRaw:null,
        start:startDate,
        end:null,
        url:source.url,
        sourceLabel:source.label
      });
    }

    return {events:sortRecent(events),health:null,healthText:null};
  }

  function parseInfrastructure(text, service, source) {
    var t=String(text||""), ls=lines(t), events=[];
    var normal=/All Systems Operational|All services operational|operating normally|No active incidents|No current incidents|No incidents reported|No network outages|outage[- ]free/i.test(t);
    var explicit=/^(Investigating|Identified|Monitoring|Resolved|Maintenance|Active|Closed|Degraded)$/i;
    for (var i=0;i<ls.length;i++) {
      if (!explicit.test(ls[i])) continue;
      var title=i>0?ls[i-1]:"";
      if (!title || looksNoise(title) || /BGP communities|routing polic|network overview|product overview|learn more/i.test(title)) continue;
      events.push({title:title,status:explicitStatus(ls[i]),statusRaw:ls[i],start:findDate(ls.slice(i,i+8).join(" ")),end:null,url:service.page,sourceLabel:source.label});
    }
    return {events:sortRecent(events),health:normal?"normal":null,healthText:normal?"官方頁顯示正常":null};
  }

  window.CloudStatusParserUtils = {
    cleanText: cleanText,
    lines: lines,
    looksNoise: looksNoise,
    explicitStatus: explicitStatus,
    findAnyDate: findAnyDate,
    findDate: findDate,
    findDateRange: findDateRange,
    sortRecent: sortRecent,
    normalizeEvent: normalizeEvent
  };

  function parseReader(text, service, source) {
    var moduleParser=SERVICE_PARSERS[service.id];
    if (moduleParser && typeof moduleParser.parseReader === "function") {
      return normalizeResult(moduleParser.parseReader(text,service,source,window.CloudStatusParserUtils),service,source);
    }

    switch(service.parser) {
      case "google-cloud": return normalizeResult(parseGooglePage(text,service,source),service,source);
      case "azure": return normalizeResult(parseAzure(text,service,source),service,source);
      case "apple": return normalizeResult(parseApple(text,service,source),service,source);
      case "apple-backup": return normalizeResult(parseAppleBackup(text,service,source),service,source);
      case "oracle": return normalizeResult(parseOracle(text,service,source),service,source);
      case "bandwagon": return normalizeResult(parseBandwagon(text,service,source),service,source);
      case "dmit": return normalizeResult(parseDMIT(text,service,source),service,source);
      case "equinix":
      case "digital-realty":
      case "ntt-gdc":
      case "arelion":
      case "ntt-global":
      case "cogent": return normalizeResult(parseInfrastructure(text,service,source),service,source);
      case "aws": return normalizeResult(parseInfrastructure(text,service,source),service,source);
      default: return normalizeResult(parseInfrastructure(text,service,source),service,source);
    }
  }

  async function runSource(source,service) {
    var moduleParser=SERVICE_PARSERS[service.id];
    if (moduleParser && typeof moduleParser.runSource === "function") {
      var custom=await moduleParser.runSource(source,service,{
        fetchText:fetchText,
        fetchJson:fetchJson,
        fetchReader:fetchReader,
        utils:window.CloudStatusParserUtils
      });
      if (custom) return normalizeResult(custom,service,source);
    }

    if (source.type==="statuspage") return normalizeResult(statuspageAdapter(await fetchJson(source.url),service,source),service,source);
    if (source.type==="apple-json") return normalizeResult(appleStructuredAdapter(await fetchAppleJson(source.url),service,source),service,source);
    if (source.type==="gcp") return normalizeResult(gcpAdapter(await fetchJson(source.url),service,source),service,source);
    if (source.type==="rss") return normalizeResult(rssAdapter(await fetchText(source.url),service,source),service,source);
    if (source.type==="apple-backup") return normalizeResult(parseAppleBackup(await fetchReader(source.url),service,source),service,source);
    if (source.type==="reader") return parseReader(await fetchReader(source.url),service,source);
    throw new Error("Unsupported source " + source.type);
  }

  function mergeEvents(existing,newEvents) {
    var all=(existing||[]).concat(newEvents||[]);
    var map={}, out=[];
    all.forEach(function(e){
      if (!e || looksNoise(e.title)) return;
      var k=fingerprint(e);
      if (!k) return;
      if (!map[k]) { map[k]=e; out.push(e); return; }
      var old=map[k];
      if (!old.status && e.status) { old.status=e.status; old.statusRaw=e.statusRaw; }
      old.start=old.start||e.start; old.end=old.end||e.end; old.url=old.url||e.url;
    });
    return sortRecent(out);
  }

  var SOURCE_PRIORITY = {
    "official-api": 10,
    "official-json": 20,
    "official-rss": 30,
    "official-history": 40,
    "official-status": 50,
    "official-announcement": 60,
    "official-backup": 70,
    "trusted-third-party": 80,
    "other-backup": 90
  };

  function sourcePriority(source) {
    if (source && source.kind && SOURCE_PRIORITY[source.kind] != null) {
      return SOURCE_PRIORITY[source.kind];
    }
    if (source && typeof source.priority === "number") {
      return source.priority;
    }
    if (source && typeof source.tier === "number") {
      return source.tier;
    }
    return 999;
  }

  function isThirdPartySource(source) {
    return source && (
      source.kind === "trusted-third-party" ||
      source.kind === "other-backup"
    );
  }

  async function loadPrimarySource(service) {
    var sources=service.sources.slice().sort(function(a,b){return sourcePriority(a)-sourcePriority(b);});
    var source=sources[0];

    if(!source){
      return {
        id:service.id,name:service.name,desc:service.desc,category:service.category,page:service.page,
        events:[],health:null,healthText:null,sourceLabel:"官方頁",fallback:true,failures:["No source"],
        _remainingSources:[]
      };
    }

    try{
      var result=await runSource(source,service);
      var events=(result.events||[]).slice(0,3);
      var health=result.health||null;
      var healthText=result.healthText||null;

      return {
        id:service.id,name:service.name,desc:service.desc,category:service.category,page:service.page,
        events:events,health:health,healthText:healthText,
        sourceLabel:(events.length||health)?source.label:"官方頁",
        fallback:!events.length&&!health,
        failures:[],
        _remainingSources:sources.slice(1)
      };
    }catch(e){
      return {
        id:service.id,name:service.name,desc:service.desc,category:service.category,page:service.page,
        events:[],health:null,healthText:null,sourceLabel:"官方頁",fallback:true,
        failures:[source.label+": "+String(e)],
        _remainingSources:sources.slice(1)
      };
    }
  }

  async function completeService(service, partial) {
    var events=(partial.events||[]).slice();
    var health=partial.health||null;
    var healthText=partial.healthText||null;
    var labels=[];
    if(partial.sourceLabel && partial.sourceLabel!=="官方頁") labels.push(partial.sourceLabel);
    var failures=(partial.failures||[]).slice();
    var sources=(partial._remainingSources||[]).slice();

    for(var i=0;i<sources.length;i++){
      var source=sources[i];

      // 已取得完整官方資料時，不再啟動第三方來源。
      if(isThirdPartySource(source) && health && events.length>=3) break;

      try{
        var result=await runSource(source,service);

        if(result.events && result.events.length){
          events=mergeEvents(events,result.events);
          if(labels.indexOf(source.label)<0) labels.push(source.label);
        }

        if(result.health && !health){
          health=result.health;
          healthText=result.healthText||null;
          if(labels.indexOf(source.label)<0) labels.push(source.label);
        }

        if(events.length>=3 && health) break;
      }catch(e){
        failures.push(source.label+": "+String(e));
      }
    }

    return {
      id:service.id,name:service.name,desc:service.desc,category:service.category,page:service.page,
      events:events.slice(0,3),health:health,healthText:healthText,
      sourceLabel:labels.length===1?labels[0]:(labels.length>1?"多來源":"官方頁"),
      fallback:!events.length&&!health,
      failures:failures
    };
  }

  async function runWithConcurrency(items, limit, worker) {
    var next=0;
    var workers=[];

    async function runOne(){
      while(true){
        var index=next++;
        if(index>=items.length) return;
        await worker(items[index], index);
      }
    }

    for(var i=0;i<Math.min(limit,items.length);i++){
      workers.push(runOne());
    }

    await Promise.all(workers);
  }

  function saveCache() {
    try{
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        services: state.services
      }));
    }catch(e){}
  }

  function loadCache() {
    try{
      var raw=localStorage.getItem(CACHE_KEY);
      if(!raw) return false;

      var cache=JSON.parse(raw);
      if(!cache || !Array.isArray(cache.services) || !cache.timestamp) return false;
      if(Date.now()-cache.timestamp>CACHE_MAX_AGE) return false;

      state.services=cache.services;
      lastRefresh=cache.timestamp;
      render();

      var now=new Intl.DateTimeFormat("zh-TW",{
        year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false
      }).format(new Date(cache.timestamp));

      $("#updated").textContent="快取於 "+now+" · 正在背景更新";
      return true;
    }catch(e){
      return false;
    }
  }

  function isActive(service) {
    if (service.health==="incident") return true;
    return (service.events||[]).some(function(e){
      return e.status && ["resolved","postmortem","completed","closed"].indexOf(e.status)===-1;
    });
  }

  function visibleServices() {
    var n=state.search.trim().toLowerCase();
    return state.services.filter(function(s){
      if (state.filter!=="all" && s.category!==state.filter) return false;
      if (state.activeOnly && !isActive(s)) return false;
      if (n) {
        var h=[s.name,s.desc].concat((s.events||[]).map(function(e){return e.title;})).join(" ").toLowerCase();
        if (h.indexOf(n)===-1) return false;
      }
      return true;
    });
  }

  function renderSummary() {
    var auto=state.services.filter(function(s){return !s.fallback;}).length;
    var fallback=state.services.length-auto;
    $("#summary").innerHTML =
      '<div class="metric"><strong>'+state.services.length+'</strong><span>服務</span></div>'+
      '<div class="metric"><strong>'+auto+'</strong><span>自動取得</span></div>'+
      '<div class="metric"><strong>'+fallback+'</strong><span>官方頁備援</span></div>';
  }

  function renderEvent(e,service) {
    var tag = e.status && STATUS_LABELS[e.status]
      ? '<span class="tag '+escapeHtml(e.status)+'">['+escapeHtml(STATUS_LABELS[e.status])+']</span>'
      : '';
    var eventClass = e.status && STATUS_LABELS[e.status] ? "event" : "event no-status";
    return '<a class="'+eventClass+'" href="'+escapeHtml(e.url||service.page)+'" target="_blank" rel="noopener">'+
      tag+
      '<span class="event-title" title="'+escapeHtml(e.title+(e.sourceLabel?" · "+e.sourceLabel:""))+'">'+escapeHtml(e.title)+'</span>'+
      '<span class="event-time">'+escapeHtml(formatRange(e.start,e.end))+'</span>'+
      '</a>';
  }

  function renderService(service) {
    var body="";

    // 「目前狀態」只來自來源本身明確提供的 current health。
    // 歷史事件不反推目前服務狀態。
    if (service.health==="normal") {
      body += '<div class="current-state good"><span class="state-dot"></span><strong>[目前正常]</strong> '+escapeHtml(service.healthText||"官方來源顯示目前正常")+'</div>';
    } else if (service.health==="incident" && service.healthText) {
      body += '<div class="current-state warn"><span class="state-dot"></span><strong>[目前異常]</strong> '+escapeHtml(service.healthText)+'</div>';
    }

    if (service.events.length) {
      body += '<div class="section-label">最近 '+service.events.length+' 筆事件</div>';
      body += service.events.slice(0,3).map(function(e){return renderEvent(e,service);}).join("");
    } else if (service.health) {
      body += '<div class="history-empty">近期沒有可顯示的可靠事件</div>';
    } else if (service.fallback) {
      body += '<a class="message link" href="'+escapeHtml(service.page)+'" target="_blank" rel="noopener">[官方狀態頁] 自動來源未取得可靠事件資料，查看官方即時狀態 →</a>';
    } else {
      body += '<div class="message">目前沒有可顯示的可靠事件資料</div>';
    }

    return '<article class="service">'+
      '<div class="service-head">'+
        '<a class="service-name" href="'+escapeHtml(service.page)+'" target="_blank" rel="noopener">🔹 '+escapeHtml(service.name)+'</a>'+
        '<span class="service-desc">('+escapeHtml(service.desc)+')</span>'+
        '<span class="source-badge">'+escapeHtml(service.sourceLabel)+'</span>'+
      '</div><div class="events">'+body+'</div></article>';
  }

  function layoutDesktopMasonry() {
    var grid=$("#services");
    if(!grid) return;

    var cards=Array.prototype.slice.call(grid.querySelectorAll(".service"));

    // 依實際內容容器寬度判斷，不依手機/桌面名稱。
    // 容器 <= 720px：單欄；> 720px：雙欄 Masonry。
    var availableWidth=grid.clientWidth || window.innerWidth;
    if(availableWidth<=720 || !cards.length){
      grid.classList.remove("masonry-active");
      grid.style.height="";
      cards.forEach(function(card){
        card.style.left="";
        card.style.top="";
        card.style.width="";
        card.style.maxWidth="";
        card.style.gridRowEnd="";
      });
      return;
    }

    var gap=14;
    grid.classList.add("masonry-active");

    cards.forEach(function(card){
      card.style.left="0px";
      card.style.top="0px";
      card.style.gridRowEnd="";
    });

    requestAnimationFrame(function(){
      var gridWidth=grid.clientWidth;

      // 1180px 整體寬度下固定兩欄最穩定。
      // <=720px 已在前面走單欄；>720px 一律雙欄 Masonry。
      var columns=2;
      var colWidth=(gridWidth-gap)/columns;
      var heights=new Array(columns).fill(0);

      cards.forEach(function(card){
        // 找目前最短的一欄，形成真正「階梯式」補位。
        var col=0;
        for(var i=1;i<columns;i++){
          if(heights[i]<heights[col]) col=i;
        }

        var x=col*(colWidth+gap);
        var y=heights[col];

        card.style.width=colWidth+"px";
        card.style.maxWidth=colWidth+"px";
        card.style.left=x+"px";
        card.style.top=y+"px";

        var h=card.getBoundingClientRect().height;
        heights[col]=y+h+gap;
      });

      grid.style.height=Math.max(0,Math.max.apply(null,heights)-gap)+"px";
    });
  }

  function render() {
    renderSummary();
    var list=visibleServices();
    $("#services").innerHTML=list.length?list.map(renderService).join(""):'<div class="empty">沒有符合條件的服務或事件。</div>';
    layoutDesktopMasonry();
  }

  async function refresh(options) {
    options=options||{};
    if(refreshInFlight && !options.force) return;

    refreshInFlight=true;
    var reload=$("#reload");
    reload.disabled=true;

    if(!state.services.length){
      $("#updated").textContent="正在讀取官方來源…";
    }

    try{
      var partials=new Array(SERVICES.length);

      // 第一階段：每個服務只抓最高優先級來源，全部並行。
      await Promise.all(SERVICES.map(async function(service,index){
        partials[index]=await loadPrimarySource(service);
      }));

      // 第一階段完成立刻顯示。
      state.services=partials.map(function(x){
        var copy=Object.assign({},x);
        delete copy._remainingSources;
        return copy;
      });
      render();
      $("#updated").textContent="主要來源已載入 · 正在補充備援資料…";

      // 第二階段：只處理仍不足的服務，而且限制併發，避免一次開太多 Reader 連線。
      var needs=[];
      partials.forEach(function(p,index){
        if(!p) return;
        if((p.events||[]).length<3 || !p.health){
          if(p._remainingSources && p._remainingSources.length){
            needs.push({index:index,partial:p,service:SERVICES[index]});
          }
        }
      });

      await runWithConcurrency(needs,FALLBACK_CONCURRENCY,async function(item){
        var result=await completeService(item.service,item.partial);
        state.services[item.index]=result;
        render();
      });

      // 清理任何殘留的內部欄位。
      state.services=state.services.map(function(x){
        var copy=Object.assign({},x);
        delete copy._remainingSources;
        return copy;
      });

      lastRefresh=Date.now();
      saveCache();

      var now=new Intl.DateTimeFormat("zh-TW",{
        year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false
      }).format(new Date(lastRefresh));

      $("#updated").textContent="最後讀取於 "+now;
      render();
    }catch(e){
      $("#updated").textContent="更新失敗";
      if(!state.services.length){
        $("#services").innerHTML='<div class="empty">資料載入失敗，請稍後重試。</div>';
      }
    }finally{
      refreshInFlight=false;
      reload.disabled=false;
    }
  }

  function shouldForegroundRefresh() {
    return !lastRefresh || Date.now()-lastRefresh>=FOREGROUND_REFRESH_THRESHOLD;
  }

  var masonryResizeObserver=null;

  function startResponsiveLayoutObserver() {
    var grid=$("#services");
    if(!grid || typeof ResizeObserver==="undefined") return;
    if(masonryResizeObserver) masonryResizeObserver.disconnect();

    masonryResizeObserver=new ResizeObserver(function(){
      layoutDesktopMasonry();
    });
    masonryResizeObserver.observe(grid);
  }

  function startAutoRefresh() {
    setInterval(function(){
      if (document.visibilityState==="visible") refresh();
    },REFRESH_INTERVAL);
    document.addEventListener("visibilitychange",function(){
      if (document.visibilityState==="visible" && shouldForegroundRefresh()) refresh();
    });
    window.addEventListener("focus",function(){
      if (shouldForegroundRefresh()) refresh();
    });
  }

  $("#filters").addEventListener("click",function(e){
    var b=e.target.closest("[data-filter]"); if(!b)return;
    state.filter=b.getAttribute("data-filter");
    Array.prototype.forEach.call(document.querySelectorAll(".chip"),function(x){x.classList.toggle("active",x===b);});
    render();
  });
  $("#search").addEventListener("input",function(e){state.search=e.target.value;render();});
  $("#activeOnly").addEventListener("change",function(e){state.activeOnly=e.target.checked;render();});
  $("#reload").addEventListener("click",function(){refresh({force:true});});

  var masonryResizeTimer=null;
  window.addEventListener("resize",function(){
    clearTimeout(masonryResizeTimer);
    masonryResizeTimer=setTimeout(layoutDesktopMasonry,120);
  });

  loadCache();
  refresh({force:true});
  startAutoRefresh();
})();