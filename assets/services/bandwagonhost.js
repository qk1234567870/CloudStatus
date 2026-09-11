/* CloudStatus service module: BandwagonHost */
(function () {
  "use strict";

  var PAGE="https://bwhstatus.com/";

  window.CloudStatusServices.register({
    id:"bandwagonhost",
    name:"BandwagonHost",
    nameZh:"搬瓦工",
    desc:"VPS 與網路基礎設施",
    category:"hosting",
    page:PAGE,
    parser:"bandwagonhost",
    sources:[
      {
        type:"reader",
        url:PAGE,
        label:"BandwagonHost Status",
        link:PAGE,
        tier:50,
        kind:"official-status",
        priority:50
      }
    ]
  });

  function stripMarkdown(value){
    return String(value==null?"":value)
      .replace(/^#{1,6}\s*/,"")
      .replace(/^\s*[-*+]\s+/,"")
      .replace(/\[([^\]]+)\]\([^)]+\)/g,"$1")
      .replace(/[`*_]+/g,"")
      .replace(/\s+/g," ")
      .trim();
  }

  function extractHref(value){
    var m=String(value||"").match(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/);
    if(m) return m[1];

    var direct=String(value||"").match(/https?:\/\/bwhstatus\.com\/issue\.php\?id=\d+/i);
    return direct ? direct[0] : null;
  }

  function lifecycleStatus(value){
    var s=stripMarkdown(value).toLowerCase().replace(/[\s-]+/g,"_");
    var map={
      investigating:"investigating",
      identified:"identified",
      monitoring:"monitoring",
      resolved:"resolved",
      maintenance:"maintenance",
      scheduled:"scheduled",
      in_progress:"in_progress",
      completed:"completed",
      closed:"closed"
    };
    return map[s] || null;
  }

  function overallHealth(lines){
    var head=lines.slice(0,12).map(stripMarkdown).filter(Boolean);
    var joined=head.join(" | ");

    if(/All systems operational/i.test(joined)){
      return {health:"normal",healthText:"All systems operational"};
    }

    // The page also exposes a standalone overall badge such as Operational.
    if(head.some(function(line){return /^Operational$/i.test(line);})){
      return {health:"normal",healthText:"Operational"};
    }

    if(head.some(function(line){
      return /^(Degraded(?: Performance)?|Partial Outage|Major Outage|Outage|Service Disruption)$/i.test(line);
    })){
      return {health:"incident",healthText:"BandwagonHost status page reports a service issue"};
    }

    return {health:null,healthText:null};
  }

  function looksHeading(raw){
    return /^#{1,6}\s+/.test(String(raw||"")) ||
      /\[[^\]]+\]\(https?:\/\/bwhstatus\.com\/issue\.php\?id=\d+\)/i.test(String(raw||""));
  }

  function parseIncidents(rawLines,source,u){
    var recentIndex=-1;
    for(var i=0;i<rawLines.length;i++){
      if(/^Recent incidents$/i.test(stripMarkdown(rawLines[i]))){
        recentIndex=i;
        break;
      }
    }
    if(recentIndex<0) return {activeEvents:[],recentEvents:[]};

    var active=[],recent=[],seen={};

    for(var j=recentIndex+1;j<rawLines.length;j++){
      var raw=rawLines[j];
      var title=stripMarkdown(raw);

      if(!title ||
         /^Showing the last 5 days/i.test(title) ||
         /^No incidents in the last 5 days\.?$/i.test(title) ||
         /^Times are shown/i.test(title)){
        continue;
      }

      // Prefer explicit Markdown headings / incident links as titles.
      if(!looksHeading(raw)) continue;
      if(/^Recent incidents$/i.test(title)) continue;

      var status=null,statusRaw=null;
      var block=[];
      for(var k=j+1;k<Math.min(rawLines.length,j+14);k++){
        if(k>j+1 && looksHeading(rawLines[k])) break;
        var next=stripMarkdown(rawLines[k]);
        if(next) block.push(next);
        if(!status){
          var mapped=lifecycleStatus(rawLines[k]);
          if(mapped){
            status=mapped;
            statusRaw=stripMarkdown(rawLines[k]);
          }
        }
      }

      var key=title.toLowerCase();
      if(seen[key]) continue;
      seen[key]=true;

      var range=u.findDateRange ? u.findDateRange(block.join(" ")) : {start:null,end:null};
      var start=range && range.start || (u.findAnyDate ? u.findAnyDate(block.join(" ")) : null);
      var end=range && range.end || null;
      var href=extractHref(raw) || source.url;

      var event={
        title:title,
        status:status,
        statusRaw:statusRaw,
        unresolved:status ? !["resolved","completed","closed"].includes(status) : null,
        start:start || null,
        end:end || null,
        url:href,
        sourceLabel:source.label
      };

      if(event.unresolved===true) active.push(event);
      else recent.push(event);
    }

    return {activeEvents:active,recentEvents:recent};
  }

  window.CloudStatusServices.registerParser("bandwagonhost", {
    parseReader:function(text,service,source,u){
      var rawLines=String(text||"").split(/\r?\n/);
      var health=overallHealth(rawLines);
      var incidents=parseIncidents(rawLines,source,u);

      // Explicit active incidents override a stale/optimistic top-level normal label.
      if(incidents.activeEvents.length){
        health.health="incident";
        health.healthText=incidents.activeEvents.length+" 個目前事件";
      }

      return {
        health:health.health,
        healthText:health.healthText,
        activeEvents:incidents.activeEvents,
        recentEvents:incidents.recentEvents,
        events:incidents.activeEvents.concat(incidents.recentEvents)
      };
    }
  });
})();
