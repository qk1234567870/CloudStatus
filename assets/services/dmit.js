/* CloudStatus service module: DMIT */
(function () {
  "use strict";

  var service = {
  "id": "dmit",
  "name": "DMIT",
  "desc": "全球高階網路與雲端服務",
  "category": "hosting",
  "page": "https://www.dmit.io/serverstatus.php",
  "parser": "dmit",
  "sources": [
    {
      "type": "reader",
      "label": "官方 Server Status",
      "tier": 50,
      "kind": "official-status",
      "priority": 50
    },
    {
      "type": "reader",
      "url": "https://t.me/s/DMIT_INC",
      "label": "官方 Telegram 公告",
      "tier": 60,
      "kind": "official-announcement",
      "priority": 60
    }
  ]
};

  window.CloudStatusServices.register(service);

  function parseTelegram(text, service, source, u) {
    var ls=u.lines(text), events=[], seen={};

    // 只抓真正公告標題，不把正文句子當成獨立事件。
    var heading=/(security maintenance notification|maintenance notification|incident notification|network incident|outage notification|emergency maintenance|scheduled maintenance|service interruption|routing issue|network issue|packet loss)/i;

    var body=/^(we apologize\b|impact\s*:|additional\b|update\s*:|details?\s*:|affected\b|customers?\b|the affected\b|please\b|thank you\b|•|\-|\*)/i;

    for(var i=0;i<ls.length;i++){
      var title=u.cleanText(ls[i]);
      if(!title || body.test(title) || u.looksNoise(title) || !heading.test(title)) continue;

      var block=ls.slice(Math.max(0,i-4),Math.min(ls.length,i+10)).join(" ");
      var date=u.findAnyDate(block);  // 可以沒有日期

      var key=title.toLowerCase();
      if(seen[key]) continue;
      seen[key]=true;

      events.push({
        title:title,
        status:null,
        statusRaw:null,
        start:date || null,
        end:null,
        url:source.url,
        sourceLabel:source.label
      });
    }

    return {events:u.sortRecent(events),health:null,healthText:null};
  }

  function parseServerStatus(text, service, source, u) {
    // Server Status 若沒有可靠事件，保持空白，不從普通正文推斷。
    var ls=u.lines(text), events=[], seen={};
    var heading=/(maintenance notification|incident notification|network incident|outage notification|emergency maintenance|scheduled maintenance|service interruption|routing issue|network issue|packet loss)/i;

    for(var i=0;i<ls.length;i++){
      var title=u.cleanText(ls[i]);
      if(!title || u.looksNoise(title) || !heading.test(title)) continue;
      var key=title.toLowerCase();
      if(seen[key]) continue;
      seen[key]=true;

      var block=ls.slice(Math.max(0,i-3),Math.min(ls.length,i+8)).join(" ");
      events.push({
        title:title,
        status:null,
        statusRaw:null,
        start:u.findAnyDate(block) || null,
        end:null,
        url:source.url,
        sourceLabel:source.label
      });
    }

    return {events:u.sortRecent(events),health:null,healthText:null};
  }

  window.CloudStatusServices.registerParser("dmit", {
    parseReader: function (text, service, source, u) {
      if (source.url.indexOf("t.me/s/DMIT_INC") !== -1) {
        return parseTelegram(text,service,source,u);
      }
      return parseServerStatus(text,service,source,u);
    }
  });
})();
