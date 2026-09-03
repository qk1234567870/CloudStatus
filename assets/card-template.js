/* CloudStatus Unified Card Template */
(function () {
  "use strict";

  function sectionHead(title, count, active) {
    return '<div class="section-head'+(active?' active':'')+'">'+
      '<span class="section-label">'+title+'</span>'+
      '<span class="section-count">'+count+'</span>'+
    '</div>';
  }

  function eventItem(event, service, ctx) {
    var esc = ctx.escapeHtml;
    var labels = ctx.statusLabels || {};
    var status = event && event.status;
    var statusLabel = status && labels[status] ? labels[status] : "";
    var title = event && event.title ? event.title : "";
    var href = (event && event.url) || service.page || "#";
    var time = ctx.formatRange(event && event.start, event && event.end);

    var tag = statusLabel
      ? '<span class="event-status tag '+esc(status)+'">['+esc(statusLabel)+']</span>'
      : '<span class="event-status event-status-empty"></span>';

    return '<a class="event'+(statusLabel?'':' no-status')+'" href="'+esc(href)+'" target="_blank" rel="noopener">'+
      '<div class="event-line">'+
        tag+
        '<span class="event-title">'+esc(title)+'</span>'+
      '</div>'+
      (time ? '<div class="event-time">'+esc(time)+'</div>' : '')+
    '</a>';
  }

  function healthBlock(service, ctx) {
    var esc = ctx.escapeHtml;

    if (service.loading) {
      return '<div class="message">載入中…</div>';
    }

    if (service.health === "normal") {
      var normalLabel = service.category === "crossborder" ? "上游正常" : "正常";
      return '<div class="health-row good">'+
        '<span class="health-badge"><span class="health-icon">✓</span>'+esc(normalLabel)+'</span>'+
        (service.healthText ? '<span class="health-text">'+esc(service.healthText)+'</span>' : '')+
      '</div>';
    }

    if (service.health === "incident") {
      var incidentLabel = service.category === "crossborder" ? "上游異常" : "異常";
      return '<div class="health-row warn">'+
        '<span class="health-badge"><span class="health-icon">!</span>'+esc(incidentLabel)+'</span>'+
        (service.healthText ? '<span class="health-text">'+esc(service.healthText)+'</span>' : '')+
      '</div>';
    }

    return '';
  }

  function emptyBlock(service, activeEvents, recentEvents, ctx) {
    var esc = ctx.escapeHtml;

    if (service.loading || activeEvents.length || recentEvents.length) return "";

    if (service.health && service.category === "crossborder") {
      return '<div class="history-empty">狀態依 Cloudflare Radar 公開 BGP 資料判定</div>';
    }

    if (service.health) {
      return '<div class="history-empty">近期沒有可顯示的可靠事件</div>';
    }

    if (service.category === "crossborder" && service.fallback) {
      return '<a class="message link" href="'+esc(service.page)+'" target="_blank" rel="noopener">[Cloudflare Radar] 暫時無法取得可靠上游狀態，不推斷目前狀態 →</a>';
    }

    if (service.fallback) {
      return '<a class="message link" href="'+esc(service.page)+'" target="_blank" rel="noopener">[官方狀態頁] 自動來源未取得可靠事件資料，查看官方即時狀態 →</a>';
    }

    return '<div class="message">目前沒有可顯示的可靠事件資料</div>';
  }

  function render(service, ctx) {
    var esc = ctx.escapeHtml;
    var events = service.events || [];

    var activeEvents = service.loading ? [] : events.filter(ctx.isActiveEvent);
    var recentEvents = service.loading ? [] : events.filter(function (event) {
      return !ctx.isActiveEvent(event);
    }).slice(0, 3);

    var subtitle = "";
    if (service.nameZh && service.desc) {
      subtitle = '('+esc(service.desc)+') '+esc(service.nameZh);
    } else {
      subtitle = esc(service.nameZh || service.desc || "");
    }

    var routeMeta = service.category === "crossborder" && service.carrierLabel
      ? '<span class="route-meta">'+esc(service.carrierLabel)+(service.routeClassLabel ? ' · '+esc(service.routeClassLabel) : '')+'</span>'
      : '';

    var body = healthBlock(service, ctx);

    if (activeEvents.length) {
      body += sectionHead("目前事件", activeEvents.length, true);
      body += '<div class="event-list active-events">'+activeEvents.map(function (event) {
        return eventItem(event, service, ctx);
      }).join("")+'</div>';
    }

    if (recentEvents.length) {
      body += sectionHead("最近 "+recentEvents.length+" 筆事件", recentEvents.length, false);
      body += '<div class="event-list recent-events">'+recentEvents.map(function (event) {
        return eventItem(event, service, ctx);
      }).join("")+'</div>';
    }

    body += emptyBlock(service, activeEvents, recentEvents, ctx);

    var source = esc(service.sourceLabel || "官方頁");
    var updated = service.loading ? "" : ctx.formatReadTime(service.updatedAt || ctx.lastRefresh);

    return '<article class="service service-card" data-service-id="'+esc(service.id || "")+'">'+
      '<header class="service-head">'+
        '<a class="service-name" href="'+esc(service.page)+'" target="_blank" rel="noopener">'+
          '<span class="service-diamond">◆</span>'+
          '<span>'+esc(service.name)+'</span>'+
        '</a>'+
        '<span class="service-desc service-desc-second-row">'+subtitle+'</span>'+
        routeMeta+
      '</header>'+
      '<div class="events">'+body+'</div>'+
      (!service.loading
        ? '<footer class="card-footer">'+
            '<span>資料來源：'+source+'</span>'+
            (updated ? '<span>更新時間：'+esc(updated)+'</span>' : '')+
          '</footer>'
        : '')+
    '</article>';
  }

  window.CloudStatusCardTemplate = Object.freeze({
    render: render
  });
})();
