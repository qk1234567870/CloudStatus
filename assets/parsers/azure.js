import {cleanText,lines,findDate,findAnyDate,findDateRange} from "../core/utils.js";
import {explicitStatus,looksNoise,sortRecent,activeEventCount} from "../core/events.js";

export function parseAzure(text, service, source) {
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
