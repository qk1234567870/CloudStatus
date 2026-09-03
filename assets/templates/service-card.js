/* CloudStatus template: service card */
(function () {
  "use strict";

  window.CloudStatusTemplates = window.CloudStatusTemplates || {};

  function healthBlock(service, view) {
    if (service.loading) {
      return '<div class="card-loading">載入中…</div>';
    }

    if (service.health==="normal") {
      return ''+
        '<div class="health-row">'+
          '<span class="health-badge good"><span class="health-icon">✓</span>'+
            (service.category==="crossborder"?'上游正常':'正常')+
          '</span>'+
          (service.healthText?'<span class="health-text">'+view.escapeHtml(service.healthText)+'</span>':'')+
        '</div>';
    }

    if (service.health==="incident") {
      return ''+
        '<div class="health-row">'+
          '<span class="health-badge warn"><span class="health-icon">!</span>'+
            (service.category==="crossborder"?'上游異常':'目前異常')+
          '</span>'+
          (service.healthText?'<span class="health-text">'+view.escapeHtml(service.healthText)+'</span>':'')+
        '</div>';
    }

    return '';
  }

  function section(title, events, service, view, type) {
    if (!events.length) return "";
    return ''+
      '<section class="card-section '+type+'-section">'+
        '<div class="section-head">'+
          '<strong>'+view.escapeHtml(title)+'</strong>'+
          '<span class="section-count">'+events.length+'</span>'+
        '</div>'+
        '<div class="event-list">'+
          events.map(function (event) {
            return window.CloudStatusTemplates.eventItem(event,service,view);
          }).join("")+
        '</div>'+
      '</section>';
  }

  function emptyBlock(service, activeEvents, recentEvents, view) {
    if (service.loading || activeEvents.length || recentEvents.length) return "";

    if (service.category==="crossborder" && service.health) {
      return '<div class="card-empty">狀態依 Cloudflare Radar 公開 BGP 資料判定</div>';
    }

    if (service.health) {
      return '<div class="card-empty">近期沒有可顯示的可靠事件</div>';
    }

    if (service.category==="crossborder" && service.fallback) {
      return '<a class="card-fallback" href="'+view.escapeHtml(service.page)+
        '" target="_blank" rel="noopener">Cloudflare Radar 暫時無法取得可靠上游狀態 →</a>';
    }

    if (service.fallback) {
      return '<a class="card-fallback" href="'+view.escapeHtml(service.page)+
        '" target="_blank" rel="noopener">自動來源未取得可靠事件資料，查看官方狀態頁 →</a>';
    }

    return '<div class="card-empty">目前沒有可顯示的可靠事件資料</div>';
  }

  window.CloudStatusTemplates.serviceCard = function (service, view) {
    var esc=view.escapeHtml;
    var activeEvents=(service.events||[]).filter(view.isActiveEvent);
    var recentEvents=(service.events||[]).filter(function (event) {
      return !view.isActiveEvent(event);
    }).slice(0,3);

    var subtitle="";
    if (service.nameZh && service.desc) {
      subtitle='('+esc(service.desc)+') '+esc(service.nameZh);
    } else {
      subtitle=esc(service.nameZh||service.desc||"");
    }

    var updated=view.formatCardTime(service.updatedAt);

    return ''+
      '<article class="service service-card" data-service-id="'+esc(service.id)+'">'+
        '<header class="card-header">'+
          '<div class="card-title-row">'+
            '<a class="service-name" href="'+esc(service.page)+'" target="_blank" rel="noopener">'+
              '<span class="service-diamond">◆</span>'+esc(service.name)+
            '</a>'+
            '<span class="source-badge">'+esc(service.sourceLabel||"")+'</span>'+
          '</div>'+
          (subtitle?'<div class="service-desc">'+subtitle+'</div>':'')+
        '</header>'+
        '<div class="card-content">'+
          healthBlock(service,view)+
          section('目前事件',activeEvents,service,view,'active')+
          section('最近 '+recentEvents.length+' 筆事件',recentEvents,service,view,'recent')+
          emptyBlock(service,activeEvents,recentEvents,view)+
        '</div>'+
        '<footer class="card-footer">'+
          '<span>資料來源：'+esc(service.sourceLabel||"—")+'</span>'+
          '<span>'+(updated?'更新時間：'+esc(updated):'')+'</span>'+
        '</footer>'+
      '</article>';
  };
})();
