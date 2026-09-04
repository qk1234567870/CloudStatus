/* CloudStatus service module: Cloudflare */
(function () {
  "use strict";

  function incidentEvent(inc, service, source, utils) {
    if (!inc) return null;
    var title=utils.cleanText(inc.name || "");
    if (!title) return null;

    return {
      title:title,
      status:utils.explicitStatus(inc.status),
      statusRaw:inc.status || null,
      impact:inc.impact || null,
      start:inc.started_at || inc.created_at || null,
      end:inc.resolved_at || null,
      url:inc.shortlink || inc.url || service.page,
      sourceLabel:source.label
    };
  }

  function incidentKey(inc, utils) {
    if (!inc) return "";
    if (inc.id) return "id:"+String(inc.id);
    return "fallback:"+
      utils.cleanText(inc.name || "").toLowerCase()+"|"+
      String(inc.created_at || inc.started_at || "");
  }

  function isClosedStatus(status, utils) {
    var normalized=utils.explicitStatus(status);
    return normalized==="resolved" ||
      normalized==="postmortem" ||
      normalized==="completed" ||
      normalized==="closed";
  }

  window.CloudStatusServices.registerParser("cloudflare", {
    runSource: async function (source, service, tools) {
      if (!source || source.type!=="statuspage") return null;

      var utils=tools.utils;
      var historyUrl=source.url;
      var unresolvedUrl=source.unresolvedUrl ||
        String(historyUrl).replace(
          /\/incidents\.json(?:\?.*)?$/i,
          "/incidents/unresolved.json"
        );

      var settled=await Promise.allSettled([
        tools.fetchJson(unresolvedUrl),
        tools.fetchJson(historyUrl)
      ]);

      var unresolvedData=settled[0].status==="fulfilled" ? settled[0].value : null;
      var historyData=settled[1].status==="fulfilled" ? settled[1].value : null;

      if (!unresolvedData && !historyData) {
        throw new Error("Cloudflare Status API unavailable");
      }

      var unresolved=unresolvedData && Array.isArray(unresolvedData.incidents)
        ? unresolvedData.incidents
        : [];

      var history=historyData && Array.isArray(historyData.incidents)
        ? historyData.incidents
        : [];

      // Cloudflare's unresolved endpoint is the sole authority for current incidents.
      // Preserve every unresolved incident and use history only for closed/recent events.
      var events=[];
      var unresolvedKeys=Object.create(null);

      unresolved.forEach(function (inc) {
        var key=incidentKey(inc,utils);
        if (key) unresolvedKeys[key]=true;

        var event=incidentEvent(inc,service,source,utils);
        if (event) events.push(event);
      });

      history.forEach(function (inc) {
        var key=incidentKey(inc,utils);
        if (key && unresolvedKeys[key]) return;

        // Do not let a stale/open record from incidents.json create an extra
        // "目前事件". Current incidents come only from unresolved.json.
        if (!isClosedStatus(inc && inc.status,utils)) return;

        var event=incidentEvent(inc,service,source,utils);
        if (event) events.push(event);
      });

      var unresolvedCount=unresolved.length;
      var health=null;
      var healthText=null;

      if (unresolvedData) {
        if (unresolvedCount>0) {
          health="incident";
          healthText=unresolvedCount+" 個未解決事件";
        } else {
          health="normal";
          healthText="目前沒有未解決事件";
        }
      }

      return {
        events:events,
        health:health,
        healthText:healthText
      };
    }
  });

  window.CloudStatusServices.register({
    "id": "cloudflare",
    "name": "Cloudflare",
    "nameZh": "雲端網路",
    "desc": "全球最大 CDN、DNS 與網路安全平台",
    "category": "cloud",
    "page": "https://www.cloudflarestatus.com",
    "parser": "statuspage",
    "sources": [
      {
        "type": "statuspage",
        "url": "https://www.cloudflarestatus.com/api/v2/incidents.json",
        "unresolvedUrl": "https://www.cloudflarestatus.com/api/v2/incidents/unresolved.json",
        "label": "官方 API",
        "tier": 10,
        "kind": "official-api",
        "priority": 10
      },
      {
        "type": "reader",
        "label": "官方頁 Reader",
        "tier": 50,
        "kind": "official-status",
        "priority": 50
      }
    ]
  });
})();
