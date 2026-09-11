/* CloudStatus card renderer */

  function sectionHead(title, count, active) {
    return '<div class="section-head'+(active?' active':'')+'">'+
      '<span class="section-label">'+title+'</span>'+
      '<span class="section-count">'+count+'</span>'+
    '</div>';
  }

  function eventItem(event, service, ctx) {
    var esc=ctx.escapeHtml;
    var labels=ctx.statusLabels || {};
    var status=event && event.status;
    var statusLabel=status && labels[status] ? labels[status] : "";
    var tag=statusLabel
      ? '<span class="tag '+esc(status)+'">['+esc(statusLabel)+']</span>'
      : '';
    var title=event && event.title ? event.title : "";
    var href=(event && event.url) || service.page || "#";
    var time=ctx.formatRange(event && event.start,event && event.end);

    return '<a class="event'+(statusLabel?'':' no-status')+'" href="'+esc(href)+'" target="_blank" rel="noopener">'+
      '<span class="event-main">'+tag+
        '<span class="event-title">'+esc(title)+'</span>'+
      '</span>'+
      '<span class="event-time">'+esc(time)+'</span>'+
    '</a>';
  }

  function healthBlock(service, ctx) {
    var esc=ctx.escapeHtml;
    if(service.loading) return '<div class="message">載入中…</div>';

    if(service.health==="normal"){
      var label=service.checks && service.checks.length ? "全可連線" : (service.category==="crossborder" ? "上游正常" : "正常");
      return '<div class="health-row good">'+
        '<span class="health-badge"><span class="health-icon">✓</span>'+esc(label)+'</span>'+
        (service.healthText?'<span class="health-text">'+esc(service.healthText)+'</span>':'')+
      '</div>';
    }

    if(service.health==="incident"){
      var label2=service.checks && service.checks.length ? "連線異常" : (service.category==="crossborder" ? "上游異常" : "異常");
      return '<div class="health-row warn">'+
        '<span class="health-badge"><span class="health-icon">!</span>'+esc(label2)+'</span>'+
        (service.healthText?'<span class="health-text">'+esc(service.healthText)+'</span>':'')+
      '</div>';
    }
    return '';
  }

  function emptyBlock(service,activeEvents,recentEvents,ctx){
    var esc=ctx.escapeHtml;
    if(service.loading || activeEvents.length || recentEvents.length || (service.checks && service.checks.length)) return "";

    if(service.health && service.category==="crossborder"){
      return '<div class="history-empty">狀態依 Cloudflare Radar 公開 BGP 資料判定</div>';
    }
    if(service.health){
      return '<div class="history-empty">近期沒有可顯示的可靠事件</div>';
    }
    if(service.category==="crossborder" && service.fallback){
      return '<a class="message link" href="'+esc(service.page)+'" target="_blank" rel="noopener">[Cloudflare Radar] 暫時無法取得可靠上游狀態，不推斷目前狀態 →</a>';
    }
    if(service.fallback){
      return '<a class="message link" href="'+esc(service.page)+'" target="_blank" rel="noopener">[官方狀態頁] 自動來源未取得可靠事件資料，查看官方即時狀態 →</a>';
    }
    return '<div class="message">目前沒有可顯示的可靠事件資料</div>';
  }

  function checksBlock(service,ctx){
    var esc=ctx.escapeHtml;
    var checks=service.loading ? [] : (service.checks || []);
    if(!checks.length) return "";

    var labels={
      ok:"可連線",
      fail:"無法連線",
      timeout:"逾時",
      unknown:"未知"
    };

    return sectionHead("DC1–DC5",checks.length,false)+
      '<div class="check-list">'+checks.map(function(item){
        var state=item.state || "unknown";
        var stateLabel=labels[state] || "未知";
        var endpoint=item.endpoint==="backup" ? '<span class="check-endpoint">備援端點</span>' : "";
        var href=item.url || service.page || "#";

        return '<a class="check-row" href="'+esc(href)+'" target="_blank" rel="noopener">'+
          '<span class="check-main">'+
            '<span class="check-name">'+esc(item.name || item.id || "DC")+'</span>'+
            '<span class="check-host">'+esc(item.host || "")+(item.location?' · '+esc(item.location):'')+'</span>'+
          '</span>'+
          endpoint+
          '<span class="check-state '+esc(state)+'">'+esc(stateLabel)+'</span>'+
        '</a>';
      }).join("")+'</div>';
  }

  function detailsBlock(service,ctx){
    var esc=ctx.escapeHtml;
    var items=service.loading ? [] : (service.details || []);
    if(!items.length) return "";

    var labels={ok:"正常",fail:"異常",unknown:"未知"};
    var groups={}, order=[];

    items.forEach(function(item){
      var group=item.group || item.location || item.category || "其他";
      if(!groups[group]){groups[group]=[]; order.push(group);}
      groups[group].push(item);
    });

    var html=order.map(function(group){
      return '<div class="dmit-detail-group">'+
        '<div class="dmit-detail-group-title">'+esc(group)+'</div>'+
        groups[group].map(function(item){
          var state=item.state || "unknown";
          var meta=[item.location,item.route,item.category].filter(Boolean).filter(function(v,i,a){return a.indexOf(v)===i;}).join(" · ");
          return '<div class="dmit-detail-row">'+
            '<span class="dmit-detail-main">'+
              '<span class="dmit-detail-name">'+esc(item.name || item.id || "Service")+'</span>'+
              (meta?'<span class="dmit-detail-meta">'+esc(meta)+'</span>':'')+
            '</span>'+
            '<span class="dmit-detail-state '+esc(state)+'">'+esc(labels[state] || item.status || "未知")+'</span>'+
          '</div>';
        }).join("")+
      '</div>';
    }).join("");

    return sectionHead(service.detailsTitle || "服務狀態",items.length,false)+
      '<div class="dmit-detail-list">'+html+'</div>';
  }

  function globalProbeBlock(service,ctx){
    if(service.id!=="telegram-dc") return "";

    var esc=ctx.escapeHtml;
    var probe=service.globalProbe;
    var label=service.globalProbeLabel || "全球多地機器探針";

    function metaTime(value,prefix){
      if(!value) return "";
      var t=ctx.formatRange(value,null);
      return t ? '<div class="global-probe-meta-line">'+esc(prefix)+esc(t)+'</div>' : "";
    }

    // Initial repository placeholder: the custom workflow has never produced data.
    if(!probe || probe.runStatus==="not-run" || (!probe.generatedAt && (!probe.summary || !probe.summary.total))){
      return sectionHead("Telegram 全球狀態",0,false)+
        '<div class="global-probe-card">'+
          '<div class="global-probe-row">'+
            '<span class="global-probe-name">'+esc(label)+'</span>'+
            '<span class="global-probe-state unknown">尚未執行</span>'+
          '</div>'+
          '<div class="global-probe-text">請先在 GitHub Actions 手動執行「CloudStatus Deploy + Telegram Probe」。完成後此處會顯示全球實測結果。</div>'+
        '</div>';
    }

    // Provider-side HTTP 429 is rate limiting, never a Telegram outage.
    var sourceRateLimited=probe.error && /HTTP\s+429\b/i.test(probe.error);
    if(sourceRateLimited){
      return sectionHead("Telegram 全球狀態",0,false)+
        '<div class="global-probe-card">'+
          '<div class="global-probe-row">'+
            '<span class="global-probe-name">'+esc(label)+'</span>'+
            '<span class="global-probe-state stale">來源限流</span>'+
          '</div>'+
          metaTime(probe.generatedAt,"最後嘗試：")+
          '<div class="global-probe-warning">Check-Host 回傳 HTTP 429；這是探針來源限流，不代表 Telegram 異常。系統已降低巡檢頻率並加入退避重試。</div>'+
          '<div class="global-probe-text">下一輪會自動重試；Telegram DC 本身仍以官方 WebSocket 直連結果為準。</div>'+
        '</div>';
    }

    // Probe job did run, but generator reported another error.
    if(probe.runStatus==="failed" || probe.error){
      return sectionHead("Telegram 全球狀態",0,false)+
        '<div class="global-probe-card">'+
          '<div class="global-probe-row">'+
            '<span class="global-probe-name">'+esc(label)+'</span>'+
            '<span class="global-probe-state failed">探針失敗</span>'+
          '</div>'+
          metaTime(probe.generatedAt,"最後嘗試：")+
          '<div class="global-probe-error">'+esc(probe.error || "全球探針沒有成功產生結果")+'</div>'+
          '<div class="global-probe-text">請到 Actions → CloudStatus Deploy + Telegram Probe → Probe Telegram globally 查看詳細 Log。</div>'+
        '</div>';
    }

    // The job ran successfully but no usable machine-node result was returned.
    if(!probe.summary || !probe.summary.total){
      return sectionHead("Telegram 全球狀態",0,false)+
        '<div class="global-probe-card">'+
          '<div class="global-probe-row">'+
            '<span class="global-probe-name">'+esc(label)+'</span>'+
            '<span class="global-probe-state unknown">無有效結果</span>'+
          '</div>'+
          metaTime(probe.generatedAt,"最後實測：")+
          '<div class="global-probe-text">工作流程已執行，但目前沒有可用的全球機器探針結果；不使用使用者回報作為替代。</div>'+
        '</div>';
    }

    var summary=probe.summary;
    var summaryLabels={
      normal:"全部可達",
      partial:"部分不可達",
      failed:"全部不可達",
      unknown:"資料不足"
    };
    var state=summary.state || "unknown";
    var stateLabel=summaryLabels[state] || "資料不足";
    var source=probe.source || {};
    var sourceUrl=source.url || "#";
    var time=probe.generatedAt ? ctx.formatRange(probe.generatedAt,null) : "";

    var generatedMs=probe.generatedAt ? new Date(probe.generatedAt).getTime() : 0;
    var stale=generatedMs && !isNaN(generatedMs) && Date.now()-generatedMs>20*60*1000;

    var regionHtml=(probe.regions||[]).map(function(region){
      var regionLabels={
        normal:"可達",
        partial:"部分不可達",
        failed:"不可達",
        unknown:"資料不足",
        unavailable:"本輪無可用節點"
      };
      var rs=region.state || "unknown";
      var statusText=region.total
        ? region.ok+"/"+region.total+" "+(regionLabels[rs] || "資料不足")
        : (regionLabels[rs] || "本輪無可用節點");

      var location="";
      if(region.node){
        location=[region.node.country,region.node.city].filter(Boolean).join(" · ");
        if(region.node.asn) location+=(location?" · ":"")+region.node.asn;
        if(region.availableNodes>1) location+=(location?" · ":"")+"候選 "+region.availableNodes+" 節點";
      }else if(region.unavailableReason){
        location=region.unavailableReason;
      }

      return '<div class="global-probe-region">'+
        '<span class="global-probe-region-main">'+
          '<span class="global-probe-region-name">'+esc(region.label || region.id || "區域")+
            (region.dcGroup?' · '+esc(region.dcGroup):'')+'</span>'+
          (location?'<span class="global-probe-location">'+esc(location)+'</span>':'')+
        '</span>'+
        '<span class="global-probe-region-state '+esc(rs)+'">'+esc(statusText)+'</span>'+
      '</div>';
    }).join("");

    return sectionHead("Telegram 全球狀態",probe.regions ? probe.regions.length : 0,false)+
      '<div class="global-probe-card">'+
        '<div class="global-probe-row">'+
          '<span class="global-probe-name">'+esc(label)+' · TCP 443</span>'+
          '<span class="global-probe-state '+esc(stale?"stale":state)+'">'+esc(stale?"資料過期":summary.ok+"/"+summary.total+" "+stateLabel)+'</span>'+
        '</div>'+
        '<div class="global-probe-regions">'+regionHtml+'</div>'+
        '<div class="global-probe-meta">'+
          '<a href="'+esc(sourceUrl)+'" target="_blank" rel="noopener">'+esc(source.name || "機器探針")+'</a>'+
          (time?'<span>實測時間：'+esc(time)+'</span>':'')+
        '</div>'+
        (stale?'<div class="global-probe-warning">此結果已超過 20 分鐘，請檢查排程是否仍正常執行。</div>':'')+
        '<div class="global-probe-text">DC 所在洲：北美＝DC1/DC3（邁阿密），歐洲＝DC2/DC4（阿姆斯特丹），亞洲＝DC5（新加坡）；南美、大洋洲、非洲目前沒有這 5 個主 DC 的所在地。</div>'+
        '<div class="global-probe-text">每個洲的機器探針仍會實測 DC1–DC5 全部 5 個端點；上面的 DC 標示是主 DC 實體所在地，不代表該洲使用者固定只使用該 DC。</div>'+
      '</div>';
  }

  function render(service,ctx){
    var esc=ctx.escapeHtml;
    var events=service.events || [];
    var activeEvents=service.loading ? [] : (
      Array.isArray(service.activeEvents) ? service.activeEvents : events.filter(ctx.isActiveEvent)
    );
    var recentEvents=service.loading ? [] : (
      Array.isArray(service.recentEvents) ? service.recentEvents.slice(0,3) : events.filter(function(e){ return !ctx.isActiveEvent(e); }).slice(0,3)
    );

    var subtitle="";
    if(service.nameZh && service.desc){
      subtitle='('+esc(service.desc)+') '+esc(service.nameZh);
    }else{
      subtitle=esc(service.nameZh || service.desc || "");
    }

    var routeMeta=service.category==="crossborder" && service.carrierLabel
      ? '<span class="route-meta">'+esc(service.carrierLabel)+(service.routeClassLabel?' · '+esc(service.routeClassLabel):'')+'</span>'
      : '';

    var body=healthBlock(service,ctx);
    body+=checksBlock(service,ctx);
    body+=detailsBlock(service,ctx);
    body+=globalProbeBlock(service,ctx);

    if(activeEvents.length){
      body+=sectionHead("目前事件",activeEvents.length,true);
      body+='<div class="event-list active-events">'+activeEvents.map(function(e){
        return eventItem(e,service,ctx);
      }).join("")+'</div>';
    }

    if(recentEvents.length){
      body+=sectionHead("最近 "+recentEvents.length+" 筆事件",recentEvents.length,false);
      body+='<div class="event-list recent-events">'+recentEvents.map(function(e){
        return eventItem(e,service,ctx);
      }).join("")+'</div>';
    }

    body+=emptyBlock(service,activeEvents,recentEvents,ctx);

    var source=esc(service.sourceLabel || "官方頁");
    var updated=service.loading ? "" : ctx.formatReadTime(service.updatedAt || ctx.lastRefresh);

    return '<article class="service service-card" data-service-id="'+esc(service.id || "")+'">'+
      '<header class="service-head">'+
        '<a class="service-name" href="'+esc(service.page)+'" target="_blank" rel="noopener">'+
          '<span class="service-diamond">◆</span><span>'+esc(service.name)+'</span>'+
        '</a>'+
        ''+
        '<span class="service-desc service-desc-second-row">'+subtitle+'</span>'+
        routeMeta+
      '</header>'+
      '<div class="events">'+body+'</div>'+
      (!service.loading
        ? '<footer class="card-footer"><span>資料來源：'+source+'</span>'+
          (updated?'<span>更新時間：'+esc(updated)+'</span>':'')+
          '</footer>'
        : '')+
    '</article>';
  }

export {render};
