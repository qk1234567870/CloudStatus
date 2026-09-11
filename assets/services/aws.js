/* CloudStatus service module: AWS */
(function () {
  "use strict";

  var CURRENT="https://health.aws.amazon.com/health/status?path=open-issues";
  var HISTORY="https://health.aws.amazon.com/health/status?path=service-history";
  var RSS="https://status.aws.amazon.com/rss/all.rss";

  window.CloudStatusServices.register({
    id:"aws",
    name:"AWS",
    nameZh:"亞馬遜雲端",
    desc:"Amazon Web Services",
    category:"cloud",
    page:CURRENT,
    parser:"aws",
    sectionLinks:{
      current:{label:"AWS Health Dashboard · Open and recent issues",url:CURRENT},
      history:{label:"AWS Health Dashboard · Service history",url:HISTORY}
    },
    sources:[
      {
        type:"aws-current",
        url:CURRENT,
        label:"AWS Health Dashboard",
        link:CURRENT,
        tier:20,
        kind:"official-status",
        priority:20
      },
      {
        type:"aws-history",
        url:HISTORY,
        label:"AWS Service history",
        link:HISTORY,
        tier:40,
        kind:"official-history",
        priority:40
      },
      {
        type:"aws-rss",
        url:RSS,
        label:"AWS Health RSS",
        link:CURRENT,
        tier:50,
        kind:"official-rss",
        priority:50
      }
    ]
  });

  function clean(value){
    return String(value==null?"":value)
      .replace(/\u00a0/g," ")
      .replace(/\s+/g," ")
      .trim();
  }

  function stripMarkdown(value){
    return clean(value)
      .replace(/^#{1,6}\s*/,"")
      .replace(/^\s*[-*+]\s+/,"")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,"$1")
      .replace(/[`*_]+/g,"")
      .trim();
  }

  function hrefFromMarkdown(value){
    var m=String(value||"").match(/\]\((https:\/\/health\.aws\.amazon\.com\/health\/status\?[^)]+)\)/i);
    return m ? m[1] : null;
  }

  function explicitLifecycle(value){
    var s=clean(value).toLowerCase().replace(/[\s-]+/g,"_");
    var map={
      investigating:"investigating",
      identified:"identified",
      monitoring:"monitoring",
      resolved:"resolved",
      maintenance:"maintenance",
      scheduled:"scheduled",
      in_progress:"in_progress",
      completed:"completed",
      closed:"closed",
      active:"active"
    };
    return map[s] || null;
  }

  function bracketLifecycle(value){
    var m=clean(value).match(/^\[(RESOLVED|INVESTIGATING|IDENTIFIED|MONITORING|MAINTENANCE|SCHEDULED|ACTIVE|CLOSED|COMPLETED)\]\s*/i);
    return m ? explicitLifecycle(m[1]) : null;
  }

  function removeLifecyclePrefix(value){
    return clean(value).replace(/^\[(?:RESOLVED|INVESTIGATING|IDENTIFIED|MONITORING|MAINTENANCE|SCHEDULED|ACTIVE|CLOSED|COMPLETED)\]\s*/i,"");
  }

  function currentHealth(text){
    var t=String(text||"");

    // Only explicit source wording may mark the whole AWS card normal.
    if(/\bAll (?:AWS )?services are operating normally\b/i.test(t) ||
       /\bAll services are operating normally\b/i.test(t) ||
       /\bNo open issues\b/i.test(t) ||
       /\bNo current issues\b/i.test(t) ||
       /\bNo active issues\b/i.test(t)){
      return {health:"normal",healthText:"AWS Health Dashboard 顯示目前沒有開放中的服務問題"};
    }

    // Current page can explicitly mark affected services as Impacted / Degraded.
    if(/\bImpacted\b/i.test(t) || /\bDegraded\b/i.test(t)){
      return {health:"incident",healthText:"AWS Health Dashboard 顯示目前有服務受影響"};
    }

    return {health:null,healthText:null};
  }

  function parseCurrent(text,source,u){
    var rawLines=String(text||"").split(/\r?\n/);
    var health=currentHealth(text);
    var events=[],seen={};

    for(var i=0;i<rawLines.length;i++){
      var raw=rawLines[i];
      var line=stripMarkdown(raw);
      if(!line) continue;

      var status=bracketLifecycle(line);
      if(!status) continue;

      var title=removeLifecyclePrefix(line);
      if(!title || u.looksNoise(title)) continue;

      var key=title.toLowerCase();
      if(seen[key]) continue;
      seen[key]=true;

      var start=u.findAnyDate ? u.findAnyDate(rawLines.slice(i,Math.min(rawLines.length,i+8)).join(" ")) : null;
      events.push({
        title:title,
        status:status,
        statusRaw:clean(line.match(/^\[([^\]]+)\]/)?.[1]||""),
        unresolved:!["resolved","completed","closed"].includes(status),
        start:start||null,
        end:null,
        url:hrefFromMarkdown(raw)||source.url,
        sourceLabel:source.label
      });
    }

    if(events.some(function(e){return e.unresolved===true;})){
      health.health="incident";
      health.healthText=events.filter(function(e){return e.unresolved===true;}).length+" 個目前事件";
    }

    // Do not return structured channels here, so history/RSS still gets queried.
    return {events:events,health:health.health,healthText:health.healthText};
  }

  function parseHistory(text,source,u){
    var rawLines=String(text||"").split(/\r?\n/);
    var recent=[],seen={};

    for(var i=0;i<rawLines.length;i++){
      var raw=rawLines[i];
      var line=stripMarkdown(raw);
      if(!line) continue;

      // Service-history rows typically end in "- Month D" and contain the AWS
      // service plus bracketed issue name. Keep parser tolerant to Reader shape.
      var looksEvent=/\[[^\]]+\]\s*-\s*(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}\b/i.test(line) ||
        /^\[(?:RESOLVED|CLOSED|COMPLETED)\]\s+.+/i.test(line);

      if(!looksEvent) continue;
      if(/Service history|List of events|Displaying items/i.test(line)) continue;

      var status=bracketLifecycle(line);
      var title=removeLifecyclePrefix(line);
      if(!title || u.looksNoise(title)) continue;

      var key=title.toLowerCase();
      if(seen[key]) continue;
      seen[key]=true;

      var block=rawLines.slice(i,Math.min(rawLines.length,i+6)).join(" ");
      var start=u.findAnyDate ? u.findAnyDate(block) : null;

      recent.push({
        title:title,
        status:status && ["resolved","closed","completed"].includes(status) ? status : null,
        statusRaw:status ? clean(line.match(/^\[([^\]]+)\]/)?.[1]||"") : null,
        unresolved:status && ["resolved","closed","completed"].includes(status) ? false : null,
        start:start||null,
        end:null,
        url:hrefFromMarkdown(raw)||source.url,
        sourceLabel:source.label
      });
    }

    return {activeEvents:[],recentEvents:recent,events:recent};
  }

  function decodeEntities(value){
    return String(value==null?"":value)
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1")
      .replace(/&lt;/g,"<").replace(/&gt;/g,">")
      .replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
      .replace(/&amp;/g,"&");
  }

  function stripHtml(value){
    return clean(decodeEntities(value).replace(/<br\s*\/?>/gi," ").replace(/<[^>]+>/g," "));
  }

  function xmlTag(block,name){
    var re=new RegExp("<"+name+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+name+">","i");
    var m=String(block||"").match(re);
    return m ? decodeEntities(m[1]).trim() : "";
  }

  function parseRss(xml,source,u){
    var items=String(xml||"").match(/<item\b[\s\S]*?<\/item>/gi) || [];
    var active=[],recent=[],seen={};

    items.forEach(function(block){
      var rawTitle=stripHtml(xmlTag(block,"title"));
      if(!rawTitle) return;

      var description=stripHtml(xmlTag(block,"description"));
      var combined=rawTitle+" "+description;
      var status=bracketLifecycle(rawTitle) || bracketLifecycle(description);

      // Legacy AWS RSS often explicitly says a service is operating normally.
      if(!status && /\bservice is operating normally\b|\ball services are operating normally\b/i.test(combined)){
        status="resolved";
      }

      var title=removeLifecyclePrefix(rawTitle);
      if(!title || u.looksNoise(title)) return;

      var key=(title+"|"+stripHtml(xmlTag(block,"pubDate"))).toLowerCase();
      if(seen[key]) return;
      seen[key]=true;

      var href=stripHtml(xmlTag(block,"link")) || source.url;
      var pub=stripHtml(xmlTag(block,"pubDate")) || null;

      var event={
        title:title,
        status:status,
        statusRaw:status ? status : null,
        unresolved:status ? !["resolved","completed","closed"].includes(status) : null,
        start:pub,
        end:null,
        url:href,
        sourceLabel:source.label
      };

      if(event.unresolved===true) active.push(event);
      else recent.push(event);
    });

    function sort(list){
      return list.sort(function(a,b){
        return (Date.parse(b.start||0)||0)-(Date.parse(a.start||0)||0);
      });
    }

    return {activeEvents:sort(active),recentEvents:sort(recent),events:sort(active.concat(recent))};
  }

  window.CloudStatusServices.registerParser("aws", {
    runSource:async function(source,service,ctx){
      if(source.type==="aws-current"){
        return parseCurrent(await ctx.fetchReader(source.url),source,ctx.utils);
      }
      if(source.type==="aws-history"){
        return parseHistory(await ctx.fetchReader(source.url),source,ctx.utils);
      }
      if(source.type==="aws-rss"){
        return parseRss(await ctx.fetchText(source.url),source,ctx.utils);
      }
      return null;
    }
  });
})();
