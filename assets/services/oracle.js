/* CloudStatus service module: Oracle Cloud Infrastructure */
(function () {
  "use strict";

  var SITE="https://ocistatus.oraclecloud.com";
  var CURRENT=SITE+"/#/";
  var HISTORY=SITE+"/#/history";
  var STATUS_JSON=SITE+"/api/v2/status.json";
  var RSS=SITE+"/api/v2/incident-summary.rss";

  window.CloudStatusServices.register({
    id:"oracle",
    name:"Oracle Cloud",
    nameZh:"甲骨文雲端",
    desc:"Oracle Cloud Infrastructure",
    category:"cloud",
    page:CURRENT,
    parser:"oracle",
    sectionLinks:{
      current:{label:"OCI 狀態",url:CURRENT},
      history:{label:"OCI 狀態 · History",url:HISTORY}
    },
    sources:[
      {
        type:"oci-status-json",
        url:STATUS_JSON,
        label:"OCI Status",
        link:CURRENT,
        tier:20,
        kind:"official-json",
        priority:20
      },
      {
        type:"oci-incident-rss",
        url:RSS,
        label:"OCI Incident RSS",
        link:HISTORY,
        tier:30,
        kind:"official-rss",
        priority:30
      }
    ]
  });

  function clean(value){
    return String(value==null?"":value).replace(/\s+/g," ").trim();
  }

  function decodeEntities(value){
    return String(value==null?"":value)
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1")
      .replace(/&lt;/g,"<")
      .replace(/&gt;/g,">")
      .replace(/&quot;/g,'"')
      .replace(/&#39;|&apos;/g,"'")
      .replace(/&amp;/g,"&");
  }

  function stripHtml(value){
    return clean(
      decodeEntities(value)
        .replace(/<br\s*\/?>/gi,"\n")
        .replace(/<\/p>/gi,"\n")
        .replace(/<[^>]+>/g," ")
    );
  }

  function tag(block,name){
    var re=new RegExp("<"+name+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+name+">","i");
    var m=String(block||"").match(re);
    return m ? decodeEntities(m[1]).trim() : "";
  }

  function toIso(value){
    var s=clean(value);
    if(!s) return null;
    var d=new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  function explicitLifecycle(value){
    var s=clean(value).toLowerCase().replace(/[\s-]+/g,"_");
    var map={
      investigating:"investigating",
      identified:"identified",
      monitoring:"monitoring",
      resolved:"resolved",
      maintenance:"maintenance",
      completed:"completed",
      closed:"closed"
    };
    return map[s] || null;
  }

  function currentStatusFromJson(data){
    var found=[];

    function walk(value,key,depth){
      if(depth>7 || value==null) return;

      if(typeof value==="string" || typeof value==="number" || typeof value==="boolean"){
        var k=String(key||"").toLowerCase();
        if(/status|indicator|description|summary|health|state|message|operational|available/.test(k)){
          found.push({key:k,value:String(value)});
        }
        return;
      }

      if(Array.isArray(value)){
        value.forEach(function(v){walk(v,key,depth+1);});
        return;
      }

      if(typeof value==="object"){
        Object.keys(value).forEach(function(k){walk(value[k],k,depth+1);});
      }
    }

    walk(data,"",0);

    var joined=found.map(function(x){return x.value;}).join(" | ").toLowerCase();

    // Statuspage-style high level indicator.
    for(var i=0;i<found.length;i++){
      var item=found[i];
      if(item.key.indexOf("indicator")!==-1){
        var indicator=clean(item.value).toLowerCase();
        if(["none","operational","normal","ok"].indexOf(indicator)!==-1){
          return {health:"normal",healthText:"All Systems Operational"};
        }
        if(["minor","major","critical","degraded","partial","outage"].indexOf(indicator)!==-1){
          return {health:"incident",healthText:"OCI Status reports a service disruption"};
        }
      }
    }

    if(/\ball systems operational\b|\boperational\b/.test(joined) &&
       !/\bnon[- ]?operational\b/.test(joined)){
      return {health:"normal",healthText:"All Systems Operational"};
    }

    if(/\b(service disruption|service down|major outage|partial outage|degraded performance|outage|critical)\b/.test(joined)){
      return {health:"incident",healthText:"OCI Status reports a service disruption"};
    }

    return {health:null,healthText:null};
  }

  function parseTimeField(description,label){
    var html=decodeEntities(description)
      .replace(/<br\s*\/?>/gi,"\n")
      .replace(/<\/p>/gi,"\n")
      .replace(/<[^>]+>/g," ");
    var re=new RegExp(label+"\\s*:?\\s*([A-Za-z]+\\s+\\d{1,2},\\s+\\d{4}\\s+\\d{1,2}:\\d{2}\\s+UTC)","i");
    var m=html.match(re);
    return m ? toIso(m[1]) : null;
  }

  function parseLatestStatus(description){
    var decoded=decodeEntities(description);
    var strong=decoded.match(/<strong>\s*([^<]+?)\s*<\/strong>/i);
    return strong ? explicitLifecycle(strong[1]) : null;
  }

  function parseRss(xml,source,u){
    var items=String(xml||"").match(/<item\b[\s\S]*?<\/item>/gi) || [];
    var active=[],recent=[];

    items.forEach(function(block){
      var title=u.cleanText(stripHtml(tag(block,"title")));
      if(!title || u.looksNoise(title)) return;

      var description=tag(block,"description");
      var status=parseLatestStatus(description);
      var statusRaw=null;
      var decoded=decodeEntities(description);
      var strong=decoded.match(/<strong>\s*([^<]+?)\s*<\/strong>/i);
      if(strong) statusRaw=clean(strong[1]);

      var start=parseTimeField(description,"Start Time");
      var end=parseTimeField(description,"End Time");
      var pubDate=toIso(stripHtml(tag(block,"pubDate")));
      var href=stripHtml(tag(block,"link")) || source.url;
      var guid=stripHtml(tag(block,"guid")) || null;

      var event={
        id:guid,
        title:title,
        status:status,
        statusRaw:statusRaw,
        unresolved:status ? !["resolved","completed","closed"].includes(status) : null,
        start:start || pubDate,
        end:end,
        url:href,
        sourceLabel:source.label
      };

      if(event.unresolved===true) active.push(event);
      else recent.push(event);
    });

    function sort(list){
      return list.sort(function(a,b){
        return (Date.parse(b.start||b.end||0)||0) - (Date.parse(a.start||a.end||0)||0);
      });
    }

    return {
      activeEvents:sort(active),
      recentEvents:sort(recent),
      events:sort(active.concat(recent))
    };
  }

  window.CloudStatusServices.registerParser("oracle", {
    runSource:async function(source,service,ctx){
      if(source.type==="oci-status-json"){
        var data=await ctx.fetchJson(source.url);
        var current=currentStatusFromJson(data);
        return {
          health:current.health,
          healthText:current.healthText,
          events:[]
        };
      }

      if(source.type==="oci-incident-rss"){
        var xml=await ctx.fetchText(source.url);
        return parseRss(xml,source,ctx.utils);
      }

      return null;
    }
  });
})();
