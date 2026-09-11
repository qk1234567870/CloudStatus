/* CloudStatus service module: DMIT */
(function () {
  "use strict";

  var API="https://does.dmit.fail/api/v1";

  var service = {
    id:"dmit",
    name:"DMIT",
    nameZh:"雲端主機",
    desc:"全球高階網路與雲端服務",
    category:"hosting",
    page:"https://does.dmit.fail/",
    parser:"dmit",
    sources:[
      {
        type:"dmit-api",
        url:API+"/status?locale=en",
        servicesUrl:API+"/services?locale=en",
        incidentsUrl:API+"/incidents?locale=en",
        label:"DOES DMIT FAIL? API",
        tier:10,
        kind:"official-api",
        priority:10
      },
      {
        type:"reader",
        url:"https://www.dmit.io/serverstatus.php",
        label:"官方 Server Status",
        tier:50,
        kind:"official-status",
        priority:50
      },
      {
        type:"reader",
        url:"https://t.me/s/DMIT_INC",
        label:"官方 Telegram 公告",
        tier:60,
        kind:"official-announcement",
        priority:60
      }
    ]
  };

  window.CloudStatusServices.register(service);

  function str(v){
    if(v==null) return "";
    if(typeof v==="string" || typeof v==="number" || typeof v==="boolean") return String(v);
    if(typeof v==="object"){
      return str(v.en || v.name || v.title || v.label || v.status || "");
    }
    return "";
  }

  function arrayFrom(value){
    if(Array.isArray(value)) return value;
    if(value && typeof value==="object") return Object.keys(value).map(function(k){
      var v=value[k];
      if(v && typeof v==="object" && !Array.isArray(v) && !v.id && !v.slug && !v.name){
        return Object.assign({id:k},v);
      }
      return v;
    });
    return [];
  }

  function statusToken(v){
    var s=str(v).trim().toLowerCase().replace(/[\s_-]+/g," ");
    if(!s) return null;
    if(/operational|available|healthy|normal|up|ok/.test(s)) return "ok";
    if(/major|outage|down|critical|failed|unavailable/.test(s)) return "fail";
    if(/partial|degraded|minor|maintenance|limited|issue|incident/.test(s)) return "fail";
    return "unknown";
  }

  function healthFromStatus(data){
    var candidates=[
      data && data.status,
      data && data.state,
      data && data.overall,
      data && data.overall_status,
      data && data.indicator
    ];
    for(var i=0;i<candidates.length;i++){
      var token=statusToken(candidates[i]);
      if(token==="ok") return {health:"normal",healthText:"DOES DMIT FAIL? 顯示目前服務正常"};
      if(token==="fail") return {health:"incident",healthText:"DOES DMIT FAIL? 顯示目前有服務異常"};
    }

    var services=arrayFrom(data && (data.services || data.components || data.items));
    if(services.length){
      var bad=services.filter(function(x){
        return statusToken(x && (x.status || x.state || x.indicator))==="fail";
      });
      var known=services.filter(function(x){
        var t=statusToken(x && (x.status || x.state || x.indicator));
        return t==="ok" || t==="fail";
      });
      if(bad.length) return {health:"incident",healthText:bad.length+" 個服務項目異常"};
      if(known.length) return {health:"normal",healthText:"DOES DMIT FAIL? 顯示目前服務正常"};
    }
    return {health:null,healthText:null};
  }

  function flattenServices(data){
    var out=[], seen={};

    function walk(value,path,depth){
      if(depth>7 || value==null) return;
      if(Array.isArray(value)){
        value.forEach(function(v){ walk(v,path,depth+1); });
        return;
      }
      if(typeof value!=="object") return;

      var name=str(value.name || value.title || value.label || value.service || value.product);
      var rawStatus=str(value.status || value.state || value.indicator);
      var token=statusToken(rawStatus);
      var id=str(value.id || value.slug || "");
      var location=str(value.location || value.region || value.city || "");
      var category=str(value.category || value.type || "");
      var group=str(value.group || value.datacenter || value.datacentre || value.product_line || "");
      var route=str(value.route || value.network || value.provider || "");

      if(name && rawStatus && (token==="ok" || token==="fail" || token==="unknown")){
        var key=(id||path.concat(name).join("/")).toLowerCase();
        if(!seen[key]){
          seen[key]=true;
          out.push({
            id:id || key,
            name:name,
            status:rawStatus,
            state:token,
            location:location,
            category:category,
            group:group,
            route:route
          });
        }
      }

      Object.keys(value).forEach(function(k){
        if(["translations","locale","description","updates","metadata"].indexOf(k)>=0) return;
        var child=value[k];
        if(child && typeof child==="object") walk(child,path.concat(name||k),depth+1);
      });
    }

    walk(data,[],0);
    return out.slice(0,120);
  }

  function incidentList(data){
    if(Array.isArray(data)) return data;
    return arrayFrom(data && (data.incidents || data.items || data.data || data.results));
  }

  function explicitIncidentStatus(raw){
    var s=str(raw).toLowerCase().replace(/[\s_-]+/g," ");
    if(!s) return null;
    if(/resolved|completed|closed|fixed|restored/.test(s)) return "resolved";
    if(/monitoring/.test(s)) return "monitoring";
    if(/identified/.test(s)) return "identified";
    if(/investigating|open|active|ongoing/.test(s)) return "investigating";
    return null;
  }

  function mapIncident(item,source,u){
    if(!item || typeof item!=="object") return null;
    var title=u.cleanText(str(item.title || item.name || item.summary || item.message));
    if(!title || u.looksNoise(title)) return null;

    var rawStatus=str(item.status || item.state || item.phase);
    var status=explicitIncidentStatus(rawStatus);
    var start=item.started_at || item.startedAt || item.start_at || item.start ||
      item.created_at || item.createdAt || item.date || null;
    var end=item.resolved_at || item.resolvedAt || item.ended_at || item.endedAt ||
      item.end_at || item.end || item.closed_at || item.closedAt || null;
    var slug=str(item.slug || item.id || "");
    var url=item.url || item.link || (slug ? "https://does.dmit.fail/incidents/"+encodeURIComponent(slug) : source.url);

    return {
      id:slug || null,
      title:title,
      status:status,
      statusRaw:rawStatus || null,
      unresolved:status ? status!=="resolved" : null,
      start:start || null,
      end:end || null,
      url:url,
      sourceLabel:source.label
    };
  }

  async function runApi(source,service,ctx){
    // Current status and service inventory are both official JSON.
    var settled=await Promise.allSettled([
      ctx.fetchJson(source.url),
      ctx.fetchJson(source.servicesUrl),
      ctx.fetchJson(source.incidentsUrl)
    ]);

    var statusData=settled[0].status==="fulfilled" ? settled[0].value : null;
    var servicesData=settled[1].status==="fulfilled" ? settled[1].value : null;
    var incidentsData=settled[2].status==="fulfilled" ? settled[2].value : null;

    if(!statusData && !servicesData && !incidentsData){
      throw new Error("DOES DMIT FAIL? API unavailable");
    }

    var health=healthFromStatus(statusData || {});
    var details=flattenServices(servicesData || statusData || {});
    var events=(incidentsData ? incidentList(incidentsData) : [])
      .map(function(x){return mapIncident(x,source,ctx.utils);})
      .filter(Boolean);

    var active=[], recent=[];
    events.forEach(function(e){
      if(e.unresolved===true) active.push(e);
      else if(e.status==="resolved" || e.end) recent.push(e);
      else recent.push(e); // status missing remains untagged; never infer an active incident.
    });

    return {
      health:health.health,
      healthText:health.healthText,
      activeEvents:active,
      recentEvents:recent,
      events:active.concat(recent),
      details:details,
      detailsTitle:"DMIT 服務與線路",
      detailsSource:"DOES DMIT FAIL? API"
    };
  }

  function parseTelegram(text, service, source, u) {
    var ls=u.lines(text), events=[], seen={};
    var heading=/(security maintenance notification|maintenance notification|incident notification|network incident|outage notification|emergency maintenance|scheduled maintenance|service interruption|routing issue|network issue|packet loss)/i;
    var body=/^(we apologize\b|impact\s*:|additional\b|update\s*:|details?\s*:|affected\b|customers?\b|the affected\b|please\b|thank you\b|•|\-|\*)/i;

    for(var i=0;i<ls.length;i++){
      var title=u.cleanText(ls[i]);
      if(!title || body.test(title) || u.looksNoise(title) || !heading.test(title)) continue;
      var block=ls.slice(Math.max(0,i-4),Math.min(ls.length,i+10)).join(" ");
      var date=u.findAnyDate(block);
      var key=title.toLowerCase();
      if(seen[key]) continue;
      seen[key]=true;
      events.push({title:title,status:null,statusRaw:null,start:date||null,end:null,url:source.url,sourceLabel:source.label});
    }
    return {events:u.sortRecent(events),health:null,healthText:null};
  }

  function parseServerStatus(text, service, source, u) {
    var ls=u.lines(text), events=[], seen={};
    var heading=/(maintenance notification|incident notification|network incident|outage notification|emergency maintenance|scheduled maintenance|service interruption|routing issue|network issue|packet loss)/i;

    for(var i=0;i<ls.length;i++){
      var title=u.cleanText(ls[i]);
      if(!title || u.looksNoise(title) || !heading.test(title)) continue;
      var key=title.toLowerCase();
      if(seen[key]) continue;
      seen[key]=true;
      var block=ls.slice(Math.max(0,i-3),Math.min(ls.length,i+8)).join(" ");
      events.push({title:title,status:null,statusRaw:null,start:u.findAnyDate(block)||null,end:null,url:source.url,sourceLabel:source.label});
    }
    return {events:u.sortRecent(events),health:null,healthText:null};
  }

  window.CloudStatusServices.registerParser("dmit", {
    runSource:async function(source,service,ctx){
      if(source.type==="dmit-api") return await runApi(source,service,ctx);
      return null;
    },
    parseReader:function(text,service,source,u){
      if(source.url.indexOf("t.me/s/DMIT_INC")!==-1) return parseTelegram(text,service,source,u);
      return parseServerStatus(text,service,source,u);
    }
  });
})();
