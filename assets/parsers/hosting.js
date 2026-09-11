import {cleanText,lines,findDate,findAnyDate,findDateRange} from "../core/utils.js?v=102.0.0";
import {explicitStatus,looksNoise,sortRecent,activeEventCount} from "../core/events.js?v=102.0.0";

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
