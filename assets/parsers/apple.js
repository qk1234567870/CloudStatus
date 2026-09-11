/* Apple structured and Reader parsers */
import {cleanText,lines,findDate,findAnyDate,findDateRange} from "../core/utils.js?v=100.0.0";
import {explicitStatus,looksNoise,sortRecent,activeEventCount} from "../core/events.js?v=100.0.0";
import {fetchText} from "../core/network.js?v=100.0.0";

export function appleStructuredAdapter(data, service, source) {
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

export async function fetchAppleJson(url) {
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

export function parseAppleClockRange(text) {
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

export function isAppleServiceInventoryLine(line) {
    var t = cleanText(line);

    // Apple System Status 的「available」服務清單不是事件。
    if ((t.match(/\bavailable\b/gi) || []).length >= 2) return true;
    if ((t.match(/:\s*available\b/gi) || []).length >= 1) return true;

    return false;
  }

export function stripMarkdownLine(line) {
    return cleanText(String(line || "")
      .replace(/^#{1,6}\s+/, "")
      .replace(/^\s*[-*+]\s+/, "")
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/`/g, ""));
  }

export function parseApple(text, service, source) {
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

export function parseAppleBackup(text, service, source) {
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
