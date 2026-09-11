/* CloudStatus service module: DMIT */
(function () {
  "use strict";

  var SITE="https://does.dmit.fail";
  var API=SITE+"/api/v1";

  var service = {
    id:"dmit",
    name:"DMIT",
    nameZh:"雲端主機",
    desc:"全球高階網路與雲端服務",
    category:"hosting",
    page:SITE+"/",
    parser:"dmit",
    sectionLinks:{
      current:{
        label:"DOES DMIT FAIL?",
        url:SITE+"/"
      },
      history:{
        label:"Incident history · DOES DMIT FAIL?",
        url:SITE+"/incidents"
      },
      services:{
        label:"Services · DOES DMIT FAIL?",
        url:SITE+"/services"
      }
    },
    sources:[
      {
        type:"dmit-api",
        url:API+"/status?locale=en",
        simpleStatusUrl:SITE+"/status.json",
        servicesUrl:API+"/services?locale=en",
        incidentsUrl:API+"/incidents?locale=en",
        docsUrl:SITE+"/api-docs",
        link:SITE+"/api-docs",
        label:"API · DOES DMIT FAIL?",
        tier:10,
        kind:"official-api",
        priority:10
      }
    ]
  };

  window.CloudStatusServices.register(service);

  function scalar(v){
    if(v==null) return "";
    if(typeof v==="string" || typeof v==="number" || typeof v==="boolean") return String(v);
    if(typeof v==="object"){
      return scalar(v.en ?? v.name ?? v.title ?? v.label ?? v.status ?? v.value ?? "");
    }
    return "";
  }

  function text(v){
    return scalar(v).replace(/\s+/g," ").trim();
  }

  function collection(value){
    if(Array.isArray(value)) return value;
    if(value && typeof value==="object"){
      return Object.keys(value).map(function(k){
        var v=value[k];
        if(v && typeof v==="object" && !Array.isArray(v)){
          if(!("id" in v) && !("slug" in v) && !("name" in v) && !("title" in v)){
            return Object.assign({id:k},v);
          }
        }
        return v;
      });
    }
    return [];
  }

  function normalizeToken(v){
    return text(v).toLowerCase().replace(/[_-]+/g," ").replace(/\s+/g," ").trim();
  }

  function statusToken(v){
    if(v===true) return "ok";
    if(v===false) return "fail";

    var s=normalizeToken(v);
    if(!s) return null;

    var OK=new Set([
      "operational","available","healthy","normal","up","ok","okay",
      "all systems operational","all operational","nope"
    ]);
    var FAIL=new Set([
      "outage","major outage","partial outage","degraded","degraded performance",
      "down","critical","failed","unavailable","maintenance","under maintenance",
      "minor","major","incident","issue","limited"
    ]);

    if(OK.has(s)) return "ok";
    if(FAIL.has(s)) return "fail";

    if(/\boperational\b/.test(s) && !/\bnon[- ]?operational\b/.test(s)) return "ok";
    if(/\b(all systems operational|healthy|available)\b/.test(s)) return "ok";
    if(/\b(outage|degraded|critical|unavailable|maintenance|incident|issue)\b/.test(s)) return "fail";

    return "unknown";
  }

  function statusCandidates(data){
    if(!data || typeof data!=="object") return [];
    var out=[
      data.status,
      data.state,
      data.overall,
      data.overall_status,
      data.overallStatus,
      data.indicator,
      data.summary
    ];

    if(typeof data.ok==="boolean") out.push(data.ok);
    if(typeof data.operational==="boolean") out.push(data.operational);
    if(typeof data.healthy==="boolean") out.push(data.healthy);
    if(typeof data.has_issues==="boolean") out.push(!data.has_issues);
    if(typeof data.hasIssues==="boolean") out.push(!data.hasIssues);

    if(data.status && typeof data.status==="object"){
      out.push(
        data.status.status,
        data.status.state,
        data.status.overall,
        data.status.indicator,
        typeof data.status.ok==="boolean" ? data.status.ok : null
      );
    }
    return out;
  }

  function collectStatusObjects(data){
    var out=[], seen=new Set();

    function walk(value,depth){
      if(depth>7 || value==null) return;
      if(Array.isArray(value)){
        value.forEach(function(v){walk(v,depth+1);});
        return;
      }
      if(typeof value!=="object") return;

      var name=text(value.name || value.title || value.label || value.service || value.product);
      var raw=value.status ?? value.state ?? value.indicator ?? value.health ?? null;
      if(name && raw!=null){
        var key=(text(value.id||value.slug||"") || (name+"|"+text(raw))).toLowerCase();
        if(!seen.has(key)){seen.add(key);out.push(value);}
      }

      Object.keys(value).forEach(function(k){
        if(["translations","locale","description","updates","metadata"].includes(k)) return;
        var child=value[k];
        if(child && typeof child==="object") walk(child,depth+1);
      });
    }

    walk(data,0);
    return out;
  }

  function healthFromStatus(data){
    var candidates=statusCandidates(data);
    for(var i=0;i<candidates.length;i++){
      var token=statusToken(candidates[i]);
      if(token==="ok") return {health:"normal",healthText:"DOES DMIT FAIL? 顯示 All systems operational"};
      if(token==="fail") return {health:"incident",healthText:"DOES DMIT FAIL? 顯示目前有服務異常"};
    }

    var items=collectStatusObjects(data);
    if(items.length){
      var known=0,bad=0;
      items.forEach(function(item){
        var t=statusToken(item.status ?? item.state ?? item.indicator ?? item.health);
        if(t==="ok" || t==="fail"){
          known++;
          if(t==="fail") bad++;
        }
      });

      if(bad>0) return {health:"incident",healthText:bad+" 個服務項目異常"};
      if(known>0) return {health:"normal",healthText:"DOES DMIT FAIL? 顯示目前服務正常"};
    }

    return {health:null,healthText:null};
  }

  function pathName(entry){
    return entry && entry.name ? entry.name : "";
  }

  function detectLocation(path,value){
    var explicit=text(value.location || value.region || value.city || value.datacenter || value.datacentre);
    if(explicit) return explicit;

    var joined=path.map(pathName).join(" ");
    if(/\bLAX\b|Los Angeles/i.test(joined)) return "Los Angeles";
    if(/\bTYO\b|Tokyo/i.test(joined)) return "Tokyo";
    if(/\bHKG\b|Hong Kong/i.test(joined)) return "Hong Kong";
    if(/Applications?/i.test(joined)) return "Applications";
    return "";
  }

  function detectGroup(path,value,name){
    var explicit=text(value.group || value.product_line || value.productLine || value.product || value.service_group);
    if(explicit && explicit!==name) return explicit;

    for(var i=path.length-1;i>=0;i--){
      var n=path[i] && path[i].name || "";
      if(!n || n===name) continue;
      if(/\b(?:LAX|TYO|HKG)\s+(?:Pro|EB|T1)\b/i.test(n)) return n;
      if(/^Applications?$/i.test(n)) return n;
    }

    for(var j=path.length-1;j>=0;j--){
      var fallback=path[j] && path[j].name || "";
      if(fallback && fallback!==name && !/^(Services?|Routes?|Datacenter|Application)$/i.test(fallback)) return fallback;
    }
    return "";
  }

  function detectRoute(value,name){
    var explicit=text(value.route || value.network || value.provider || value.carrier);
    if(explicit && explicit!==name) return explicit;

    if(/CN2 GIA/i.test(name)) return "China Telecom CN2 GIA";
    if(/China Unicom Premium/i.test(name)) return "China Unicom Premium";
    if(/CMIN2/i.test(name)) return "China Mobile CMIN2";
    if(/\bCMI\b/i.test(name)) return "China Mobile CMI";
    if(/DMIT Backbone/i.test(name)) return "DMIT Backbone";
    if(/Arelion/i.test(name)) return "Arelion";
    if(/Cogent/i.test(name)) return "Cogent";
    if(/\bNTT\b/i.test(name)) return "NTT";
    if(/Global Secure Layer/i.test(name)) return "Global Secure Layer";
    return "";
  }

  function flattenServices(data){
    var out=[], seen=new Set();

    function walk(value,path,depth,keyHint){
      if(depth>9 || value==null) return;

      if(Array.isArray(value)){
        value.forEach(function(v){walk(v,path,depth+1,"");});
        return;
      }
      if(typeof value!=="object") return;

      var name=text(value.name || value.title || value.label || value.service || value.product || keyHint || "");
      var raw=value.status ?? value.state ?? value.indicator ?? value.health ?? null;
      var rawStatus=text(raw);
      var token=statusToken(raw);

      if(name && raw!=null && rawStatus && token){
        var id=text(value.id || value.slug || "");
        var group=detectGroup(path,value,name);
        var location=detectLocation(path,value);
        var category=text(value.category || value.type || value.kind || "");
        var route=detectRoute(value,name);
        var key=(id || [location,group,name].filter(Boolean).join("/")).toLowerCase();

        if(!seen.has(key)){
          seen.add(key);
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

      var nextPath=path;
      if(name){
        nextPath=path.concat([{name:name,type:text(value.type||value.category||"")}]);
      }

      Object.keys(value).forEach(function(k){
        if(["translations","locale","description","updates","metadata"].includes(k)) return;
        var child=value[k];
        if(child && typeof child==="object") walk(child,nextPath,depth+1,k);
      });
    }

    walk(data,[],0,"");
    return out.slice(0,160);
  }

  function incidentList(data){
    if(Array.isArray(data)) return data;
    if(!data || typeof data!=="object") return [];
    return collection(data.incidents || data.items || data.data || data.results || data.history);
  }

  function explicitIncidentStatus(raw){
    var s=normalizeToken(raw);
    if(!s) return null;
    if(/\b(resolved|completed|closed|fixed|restored)\b/.test(s)) return "resolved";
    if(/\bmonitoring\b/.test(s)) return "monitoring";
    if(/\bidentified\b/.test(s)) return "identified";
    if(/\b(investigating|open|active|ongoing)\b/.test(s)) return "investigating";
    if(/\bmaintenance\b/.test(s)) return "maintenance";
    return null;
  }

  function mapIncident(item,source,u){
    if(!item || typeof item!=="object") return null;

    var title=u.cleanText(text(item.title || item.name || item.summary || item.message || item.subject));
    if(!title || u.looksNoise(title)) return null;

    var rawStatus=text(item.status || item.state || item.phase || "");
    var status=explicitIncidentStatus(rawStatus);

    var start=item.started_at || item.startedAt || item.start_at || item.start ||
      item.created_at || item.createdAt || item.published_at || item.publishedAt ||
      item.date || null;

    var end=item.resolved_at || item.resolvedAt || item.ended_at || item.endedAt ||
      item.end_at || item.end || item.closed_at || item.closedAt || null;

    var slug=text(item.slug || item.id || "");
    var url=item.url || item.link ||
      (slug ? SITE+"/incidents/"+encodeURIComponent(slug) : SITE+"/incidents");

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

  async function optionalJson(ctx,url){
    if(!url) return null;
    try{return await ctx.fetchJson(url);}catch(_){return null;}
  }

  async function runApi(source,service,ctx){
    // Public API documented at /api-docs. No key is required.
    var settled=await Promise.allSettled([
      ctx.fetchJson(source.url),
      ctx.fetchJson(source.servicesUrl),
      ctx.fetchJson(source.incidentsUrl)
    ]);

    var statusData=settled[0].status==="fulfilled" ? settled[0].value : null;
    var servicesData=settled[1].status==="fulfilled" ? settled[1].value : null;
    var incidentsData=settled[2].status==="fulfilled" ? settled[2].value : null;

    // /status.json is the documented compact answer. Use only as a health fallback.
    var simpleStatusData=null;
    if(!statusData) simpleStatusData=await optionalJson(ctx,source.simpleStatusUrl);

    if(!statusData && !simpleStatusData && !servicesData && !incidentsData){
      throw new Error("DOES DMIT FAIL? public API unavailable");
    }

    var health=healthFromStatus(statusData || simpleStatusData || {});
    var details=flattenServices(servicesData || statusData || {});
    var events=(incidentsData ? incidentList(incidentsData) : [])
      .map(function(x){return mapIncident(x,source,ctx.utils);})
      .filter(Boolean);

    var active=[],recent=[];
    events.forEach(function(e){
      if(e.unresolved===true) active.push(e);
      else recent.push(e);
    });

    return {
      health:health.health,
      healthText:health.healthText,
      activeEvents:active,
      recentEvents:recent,
      events:active.concat(recent),
      details:details,
      detailsTitle:"服務",
      detailsSource:"API · DOES DMIT FAIL?"
    };
  }


  window.CloudStatusServices.registerParser("dmit", {
    runSource:async function(source,service,ctx){
      if(source.type==="dmit-api") return await runApi(source,service,ctx);
      return null;
    }
  });
})();
