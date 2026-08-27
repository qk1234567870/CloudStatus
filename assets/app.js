(function () {
  "use strict";

  var SERVICES = window.CLOUDSTATUS_SERVICES || [];
  var state = { services: [], filter: "all", search: "", activeOnly: false };

  var REFRESH_INTERVAL = 5 * 60 * 1000;
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
        month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit", hour12:false
      }).format(d);
    } catch (e) { return ""; }
  }

  function formatRange(a,b) {
    var x = formatDate(a);
    if (!x) return "";
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

  function parseApple(text, service, source) {
    var t=String(text||"");
    var normal=/All services are operating normally|所有服務均正常運作|All services.*normal/i.test(t);
    var events=[];
    var ls=lines(t);
    var statusLine=/^(Resolved Outage|Resolved Issue|Outage|Issue|Maintenance)$/i;
    for (var i=0;i<ls.length;i++) {
      var m=ls[i].match(/^(.+?)\s*-\s*(Resolved Outage|Resolved Issue|Outage|Issue|Maintenance)$/i);
      if (m) {
        var raw=m[2], st=null;
        if (/^Resolved/i.test(raw)) st="resolved";
        else if (/^Maintenance$/i.test(raw)) st="maintenance";
        else if (/^Outage$/i.test(raw)) st="outage";
        var block=ls.slice(i,i+8).join(" ");
        events.push({title:cleanText(m[1]),status:st,statusRaw:raw,start:findDate(block),end:null,url:service.page,sourceLabel:source.label});
        continue;
      }
      if (statusLine.test(ls[i]) && i>0) {
        var raw2=ls[i], st2=null;
        if (/^Resolved/i.test(raw2)) st2="resolved";
        else if (/^Maintenance$/i.test(raw2)) st2="maintenance";
        else if (/^Outage$/i.test(raw2)) st2="outage";
        var title2=ls[i-1];
        if (!looksNoise(title2)) events.push({title:title2,status:st2,statusRaw:raw2,start:findDate(ls.slice(i,i+8).join(" ")),end:null,url:service.page,sourceLabel:source.label});
      }
    }
    return {events:sortRecent(events),health:normal?"normal":null,healthText:normal?"所有服務均正常運作":null};
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

  function parseDMIT(text, service, source) {
    var ls=lines(text), events=[];
    // No status inference. Telegram/HTML entries are accepted as events only if they
    // contain strong incident semantics; status remains null unless an explicit label exists.
    var eventWords=/(maintenance|incident|outage|packet loss|fiber|cable|emergency|interruption|latency|routing issue|network issue)/i;
    for (var i=0;i<ls.length;i++) {
      if (!eventWords.test(ls[i]) || looksNoise(ls[i])) continue;
      events.push({title:ls[i],status:null,statusRaw:null,start:findDate(ls.slice(Math.max(0,i-2),i+5).join(" ")),end:null,url:source.url,sourceLabel:source.label});
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

  function parseReader(text, service, source) {
    switch(service.parser) {
      case "google-cloud": return parseGooglePage(text,service,source);
      case "azure": return parseAzure(text,service,source);
      case "apple": return parseApple(text,service,source);
      case "oracle": return parseOracle(text,service,source);
      case "bandwagon": return parseBandwagon(text,service,source);
      case "dmit": return parseDMIT(text,service,source);
      case "equinix":
      case "digital-realty":
      case "ntt-gdc":
      case "arelion":
      case "ntt-global":
      case "cogent": return parseInfrastructure(text,service,source);
      case "aws": return parseInfrastructure(text,service,source);
      default: return parseInfrastructure(text,service,source);
    }
  }

  async function runSource(source,service) {
    if (source.type==="statuspage") return statuspageAdapter(await fetchJson(source.url),service,source);
    if (source.type==="gcp") return gcpAdapter(await fetchJson(source.url),service,source);
    if (source.type==="rss") return rssAdapter(await fetchText(source.url),service,source);
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

  async function loadService(service) {
    var events=[], health=null, healthText=null, sourceLabels=[], failures=[];
    var sources=service.sources.slice().sort(function(a,b){return (a.tier||9)-(b.tier||9);});

    for (var i=0;i<sources.length;i++) {
      var source=sources[i];
      try {
        var result=await runSource(source,service);
        if (result.events && result.events.length) {
          events=mergeEvents(events,result.events);
          if (sourceLabels.indexOf(source.label)<0) sourceLabels.push(source.label);
        }
        // Health is independent from history events. Prefer an explicit current-health
        // signal from an official status page/API when available.
        if (result.health && !health) {
          health=result.health; healthText=result.healthText||null;
          if (sourceLabels.indexOf(source.label)<0) sourceLabels.push(source.label);
        }
        if (events.length>=3 && health) break;
      } catch(e) {
        failures.push(source.label + ": " + String(e));
      }
    }

    return {
      id:service.id,name:service.name,desc:service.desc,category:service.category,page:service.page,
      events:events.slice(0,3),health:health,healthText:healthText,
      sourceLabel:sourceLabels.length===1?sourceLabels[0]:(sourceLabels.length>1?"多來源":"官方頁"),
      fallback:!events.length && !health,
      failures:failures
    };
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
    return '<a class="event" href="'+escapeHtml(e.url||service.page)+'" target="_blank" rel="noopener">'+
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

  function render() {
    renderSummary();
    var list=visibleServices();
    $("#services").innerHTML=list.length?list.map(renderService).join(""):'<div class="empty">沒有符合條件的服務或事件。</div>';
  }

  async function refresh(options) {
    options=options||{};
    if (refreshInFlight && !options.force) return;
    refreshInFlight=true;
    var reload=$("#reload"); reload.disabled=true;
    $("#updated").textContent="正在更新官方來源…";
    try {
      state.services=await Promise.all(SERVICES.map(loadService));
      lastRefresh=Date.now();
      var now=new Intl.DateTimeFormat("zh-TW",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(lastRefresh));
      $("#updated").textContent="最後讀取於 "+now;
      render();
    } catch(e) {
      $("#updated").textContent="更新失敗";
      if (!state.services.length) $("#services").innerHTML='<div class="empty">資料載入失敗，請稍後重試。</div>';
    } finally {
      refreshInFlight=false; reload.disabled=false;
    }
  }

  function shouldForegroundRefresh() {
    return !lastRefresh || Date.now()-lastRefresh>=FOREGROUND_REFRESH_THRESHOLD;
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

  refresh({force:true});
  startAutoRefresh();
})();