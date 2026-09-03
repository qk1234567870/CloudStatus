/* CloudStatus Service Card Template */
(function () {
  "use strict";

  window.CloudStatusTemplates = window.CloudStatusTemplates || {};

  function renderCountLabel(text, count, active) {
    return '<div class="section-head '+(active?'active':'')+'">'+
      '<span class="section-label">'+text+'</span>'+
      '<span class="section-count">'+count+'</span>'+
    '</div>';
  }

  window.CloudStatusTemplates.serviceCard = function (service, ctx) {
    var esc = ctx.escapeHtml;
    var eventItem = window.CloudStatusTemplates.eventItem;
    var activeEvents = !service.loading
      ? (service.events || []).filter(ctx.isActiveEvent)
      : [];
    var recentEvents = !service.loading
      ? (service.events || []).filter(function (event) {
          return !ctx.isActiveEvent(event);
        }).slice(0,3)
      : [];

    var body = "";

    if (service.loading) {
      body += '<div class="message">載入中…</div>';
    }

    if (!service.loading && service.health === "normal") {
      var normalLabel = service.category === "crossborder" ? "上游正常" : "正常";
      body += '<div class="health-row good">'+
        '<span class="health-badge"><span class="health-icon">✓</span>'+esc(normalLabel)+'</span>'+
        (service.healthText ? '<span class="health-text">'+esc(service.healthText)+'</span>' : '')+
      '</div>';
    } else if (!service.loading && service.health === "incident") {
      var incidentLabel = service.category === "crossborder" ? "上游異常" : "異常";
      body += '<div class="health-row warn">'+
        '<span class="health-badge"><span class="health-icon">!</span>'+esc(incidentLabel)+'</span>'+
        (service.healthText ? '<span class="health-text">'+esc(service.healthText)+'</span>' : '')+
      '</div>';
    }

    if (!service.loading && activeEvents.length) {
      body += renderCountLabel("目前事件", activeEvents.length, true);
      body += '<div class="event-list active-events">'+
        activeEvents.map(function (event) {
          return eventItem(event, service, ctx);
        }).join("")+
      '</div>';
    }

    if (!service.loading && recentEvents.length) {
      body += renderCountLabel("最近 "+recentEvents.length+" 筆事件", recentEvents.length, false);
      body += '<div class="event-list recent-events">'+
        recentEvents.map(function (event) {
          return eventItem(event, service, ctx);
        }).join("")+
      '</div>';
    } else if (!service.loading && !activeEvents.length && service.health && service.category === "crossborder") {
      body += '<div class="history-empty">狀態依 Cloudflare Radar 公開 BGP 資料判定</div>';
    } else if (!service.loading && !activeEvents.length && service.health) {
      body += '<div class="history-empty">近期沒有可顯示的可靠事件</div>';
    } else if (!service.loading && !activeEvents.length && service.category === "crossborder" && service.fallback) {
      body += '<a class="message link" href="'+esc(service.page)+'" target="_blank" rel="noopener">[Cloudflare Radar] 暫時無法取得可靠上游狀態，不推斷目前狀態 →</a>';
    } else if (!service.loading && !activeEvents.length && service.fallback) {
      body += '<a class="message link" href="'+esc(service.page)+'" target="_blank" rel="noopener">[官方狀態頁] 自動來源未取得可靠事件資料，查看官方即時狀態 →</a>';
    } else if (!service.loading && !activeEvents.length) {
      body += '<div class="message">目前沒有可顯示的可靠事件資料</div>';
    }

    var subtitle = "";
    if (service.nameZh && service.desc) {
      subtitle = '('+esc(service.desc)+') '+esc(service.nameZh);
    } else {
      subtitle = esc(service.nameZh || service.desc || "");
    }

    var routeMeta = service.category === "crossborder" && service.carrierLabel
      ? '<span class="route-meta">'+esc(service.carrierLabel)+(service.routeClassLabel?' · '+esc(service.routeClassLabel):'')+'</span>'
      : '';

    var updated = service.loading ? "" : ctx.formatReadTime(service.updatedAt || ctx.lastRefresh);
    var source = esc(service.sourceLabel || "官方頁");

    return ''+
      '<article class="service service-card" data-service-id="'+esc(service.id || "")+'">'+
        '<header class="service-head">'+
          '<a class="service-name" href="'+esc(service.page)+'" target="_blank" rel="noopener">'+
            '<span class="service-diamond">◆</span>'+
            '<span>'+esc(service.name)+'</span>'+
          '</a>'+
          '<span class="source-badge">'+source+'</span>'+
          '<span class="service-desc service-desc-second-row">'+subtitle+'</span>'+
          routeMeta+
        '</header>'+
        '<div class="events">'+body+'</div>'+
        (!service.loading
          ? '<footer class="card-footer">'+
              '<span>資料來源：'+source+'</span>'+
              (updated?'<span>更新時間：'+esc(updated)+'</span>':'')+
            '</footer>'
          : '')+
      '</article>';
  };
})();
