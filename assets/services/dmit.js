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
        servicesPageUrl:SITE+"/services",
        localServicesUrl:"./data/dmit-services.json",
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

  function detectLocation(path,value,name){
    var explicit=text(value.location || value.region || value.city || value.datacenter || value.datacentre);
    var joined=[explicit,name].concat(path.map(pathName)).join(" ");

    if(/\bLAX\b|Los Angeles/i.test(joined)) return "Los Angeles";
    if(/\bTYO\b|Tokyo/i.test(joined)) return "Tokyo";
    if(/\bHKG\b|Hong Kong/i.test(joined)) return "Hong Kong";
    if(/Applications?/i.test(joined)) return "Applications";

    return explicit || "";
  }

  function detectGroup(path,value,name){
    var explicit=text(value.group || value.product_line || value.productLine || value.product || value.service_group);
    var candidates=[explicit,name].concat(path.map(pathName));

    for(var i=0;i<candidates.length;i++){
      var n=text(candidates[i]);
      var m=n.match(/\b((?:LAX|TYO|HKG)\s+(?:Pro|EB|T1))\b/i);
      if(m) return m[1].replace(/\s+/g," ").replace(/\bpro\b/i,"Pro").replace(/\beb\b/i,"EB").replace(/\bt1\b/i,"T1");
    }

    if(candidates.some(function(n){return /^Applications?$/i.test(text(n));})) return "Applications";

    if(explicit && explicit!==name) return explicit;

    for(var j=path.length-1;j>=0;j--){
      var fallback=path[j] && path[j].name || "";
      if(fallback && fallback!==name && !/^(Services?|Routes?|Datacenter|Application)$/i.test(fallback)) return fallback;
    }
    return "";
  }

  function detectKind(path,value,location){
    var explicit=text(value.kind || value.type || value.category || "");
    if(/application/i.test(explicit) || location==="Applications") return "application";
    if(/datacenter|datacentre/i.test(explicit)) return "datacenter";

    var joined=path.map(pathName).join(" ");
    if(/Application/i.test(joined)) return "application";
    return "datacenter";
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
        var location=detectLocation(path,value,name);
        var category=text(value.category || value.type || value.kind || "");
        var kind=detectKind(path,value,location);
        var route=detectRoute(value,name);
        if(location==="Applications" && !group) group="Applications";
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
            kind:kind,
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

  function stripMarkdown(value){
    return text(value)
      .replace(/^#{1,6}\s*/,"")
      .replace(/^\s*[-*+]\s+/,"")
      .replace(/\[([^\]]+)\]\([^)]+\)/g,"$1")
      .replace(/[`*_]+/g,"")
      .trim();
  }

  function parseServicesPage(textBody){
    var raw=String(textBody||"");
    var lines=raw.split(/\r?\n/).map(function(line){return line.trim();}).filter(Boolean);
    var details=[];
    var location="";
    var group="";
    var category="";

    var locationMap={
      "Los Angeles":"Los Angeles",
      "Tokyo":"Tokyo",
      "Hong Kong":"Hong Kong",
      "Applications":"Applications"
    };

    function parseStatusLine(line){
      var cleaned=stripMarkdown(line);
      var statusMatch=cleaned.match(/\s+(All Systems Operational|Operational|Degraded Performance|Partial Outage|Major Outage|Maintenance|Under Maintenance|Unavailable|Down)$/i);
      if(!statusMatch) return null;

      var rawStatus=statusMatch[1];
      var state=statusToken(rawStatus);
      var left=cleaned.slice(0,statusMatch.index).trim();
      if(!left) return null;

      var routeParts=[];
      var routePattern=/\b(Outbound|Inbound|Interconnect|Internet|System)\b/gi;
      var routeMatch;
      while((routeMatch=routePattern.exec(left))){
        routeParts.push(routeMatch[1]);
      }

      // Route/type words belong in the right-side metadata, not in the service name.
      var name=left
        .replace(/\s+(?:Outbound|Inbound)(?:\s*·\s*(?:Outbound|Inbound))*\s*$/i,"")
        .replace(/\s+(?:Interconnect|Internet|System)\s*$/i,"")
        .trim();

      return {
        id:[location,group,name].filter(Boolean).join("/").toLowerCase().replace(/\s+/g,"-"),
        name:name,
        status:rawStatus,
        state:state || "unknown",
        location:location || "其他",
        category:category || (location==="Applications" ? "Application" : "Datacenter"),
        kind:location==="Applications" ? "application" : "datacenter",
        group:group || (location==="Applications" ? "Applications" : "其他"),
        route:routeParts.filter(function(v,i,a){return a.indexOf(v)===i;}).join(" · ")
      };
    }

    for(var i=0;i<lines.length;i++){
      var rawLine=lines[i];

      var h3=rawLine.match(/^###\s+(.+)$/);
      if(h3){
        var heading=stripMarkdown(h3[1]);
        if(locationMap[heading]){
          location=locationMap[heading];
          group=location==="Applications" ? "Applications" : "";
          category=location==="Applications" ? "Application" : "Datacenter";
        }
        continue;
      }

      var clean=stripMarkdown(rawLine);
      if(!clean) continue;

      if(/^(Datacenter|Application)$/i.test(clean)){
        category=clean;
        continue;
      }

      if(/^(?:LAX|TYO|HKG)\s+(?:Pro|EB|T1)$/i.test(clean)){
        group=clean
          .replace(/\bpro\b/i,"Pro")
          .replace(/\beb\b/i,"EB")
          .replace(/\bt1\b/i,"T1");
        continue;
      }

      if(!/^\s*[-*+]\s+/.test(rawLine)) continue;
      if(!location) continue;

      var item=parseStatusLine(rawLine);
      if(item) details.push(item);
    }

    return details;
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
    // Current health / incidents can be read directly from the public API.
    // Services inventory is deployment-generated into a same-origin JSON file
    // so Safari/GitHub Pages never depends on cross-origin Reader/API behavior.
    var settled=await Promise.allSettled([
      ctx.fetchJson(source.url),
      ctx.fetchJson(source.incidentsUrl),
      ctx.fetchJson(source.localServicesUrl),
      ctx.fetchJson(source.servicesUrl),
      ctx.fetchReader(source.servicesPageUrl)
    ]);

    var statusData=settled[0].status==="fulfilled" ? settled[0].value : null;
    var incidentsData=settled[1].status==="fulfilled" ? settled[1].value : null;
    var localServices=settled[2].status==="fulfilled" ? settled[2].value : null;
    var servicesData=settled[3].status==="fulfilled" ? settled[3].value : null;
    var servicesPageText=settled[4].status==="fulfilled" ? settled[4].value : "";

    var simpleStatusData=null;
    if(!statusData) simpleStatusData=await optionalJson(ctx,source.simpleStatusUrl);

    var localDetails=localServices && Array.isArray(localServices.details) ? localServices.details : [];
    var apiDetails=flattenServices(servicesData || statusData || {});
    var pageDetails=parseServicesPage(servicesPageText);

    // Same-origin generated data first; then live direct API; then Reader.
    var details=localDetails.length ? localDetails : (apiDetails.length ? apiDetails : pageDetails);
    var detailSource=localDetails.length
      ? "Services · DOES DMIT FAIL?"
      : (apiDetails.length ? "API · DOES DMIT FAIL?" : "Services · DOES DMIT FAIL?");

    if(!statusData && !simpleStatusData && !incidentsData && !details.length){
      throw new Error("DOES DMIT FAIL? public sources unavailable");
    }

    var health=healthFromStatus(statusData || simpleStatusData || {});
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
      detailsSource:detailSource
    };
  }

  window.CloudStatusServices.registerParser("dmit", {
    runSource:async function(source,service,ctx){
      if(source.type==="dmit-api") return await runApi(source,service,ctx);
      return null;
    }
  });
})();
