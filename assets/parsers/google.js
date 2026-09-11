import {cleanText,lines,findDate,findAnyDate,findDateRange} from "../core/utils.js?v=105.0.0";
import {explicitStatus,looksNoise,sortRecent,activeEventCount} from "../core/events.js?v=105.0.0";

export function gcpAdapter(data, service, source) {
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

export function parseGooglePage(text, service, source) {
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
