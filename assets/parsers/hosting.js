import {cleanText,lines,findDate,findAnyDate,findDateRange} from "../core/utils.js?v=100.0.0";
import {explicitStatus,looksNoise,sortRecent,activeEventCount} from "../core/events.js?v=100.0.0";

export function parseBandwagon(text, service, source) {
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

export function parseOracle(text, service, source) {
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

export function parseDMITSecurity(text, service, source) {
    var ls=lines(text), events=[];
    var t=String(text||"");

    // 這個頁面是單篇 DMIT Proactive Security / network incident advisory，
    // 頁面本身不一定提供日期，因此不能再要求「必須有日期」才承認事件。
    var headingPatterns=[
      /DMIT network incident advisory/i,
      /PROACTIVE SECURITY NOTICE/i,
      /DMIT Proactive Security identified potentially risky applications/i
    ];

    var title=null;
    for(var i=0;i<ls.length && !title;i++){
      var line=cleanText(ls[i]);
      if(/DMIT network incident advisory/i.test(line)){
        title=line;
      }
    }

    // 若 Reader 把主標題拆掉，使用頁面明確的安全公告標題。
    if(!title && headingPatterns.some(function(re){return re.test(t);})){
      title="DMIT network incident advisory";
    }

    if(!title){
      return {events:[],health:null,healthText:null};
    }

    // 日期有就顯示，沒有就保持空白；不捏造時間。
    var start=findAnyDate(t);

    // 只有來源真的寫出結構化/明確狀態詞時才套狀態。
    // identified 在正文中描述「identified risky applications」不是事件生命週期狀態，
    // 因此這裡刻意不把 identified 自動當成 status。
    var rawStatus=null;
    var explicitLifecycle=t.match(/\b(Investigating|Monitoring|Resolved|Completed|Closed)\b/i);
    if(explicitLifecycle) rawStatus=explicitLifecycle[1];

    events.push({
      title:title,
      status:rawStatus?explicitStatus(rawStatus):null,
      statusRaw:rawStatus,
      start:start,
      end:null,
      url:source.url,
      sourceLabel:source.label
    });

    return {events:events,health:null,healthText:null};
  }

export function parseDMIT(text, service, source) {
    var ls=lines(text), events=[];

    // Telegram / Server Status 的公告正文常包含 Impact / Additional 等句子。
    // 只接受公告標題，不再把正文每一行都當成獨立事件。
    var headingWords=/(maintenance notification|incident notification|network incident|outage notification|emergency maintenance|scheduled maintenance|service interruption|routing issue|network issue|packet loss)/i;
    var continuation=/^(impact\s*:|additional\b|update\s*:|details?\s*:|affected\b|•|\-|\*)/i;

    for(var i=0;i<ls.length;i++){
      var title=cleanText(ls[i]);

      if(!title || continuation.test(title) || looksNoise(title)) continue;
      if(!headingWords.test(title)) continue;

      // 向標題前後擴大範圍找 Telegram/官方頁時間。
      var block=ls.slice(Math.max(0,i-5),Math.min(ls.length,i+12)).join(" ");
      var startDate=findAnyDate(block);

      events.push({
        title:title,
        status:null,
        statusRaw:null,
        start:startDate,
        end:null,
        url:source.url,
        sourceLabel:source.label
      });
    }

    return {events:sortRecent(events),health:null,healthText:null};
  }
