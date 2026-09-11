import {cleanText,lines,findDate,findAnyDate,findDateRange} from "../core/utils.js?v=98.0.0";
import {explicitStatus,looksNoise,sortRecent,activeEventCount} from "../core/events.js?v=98.0.0";

export function parseCloudflareRadarBGP(text, service, source) {
    var t=String(text||"");
    var compact=cleanText(t);

    // Radar public routing page exposes AS-level connectivity / upstream providers.
    // We only report an upstream connection when the page contains the requested ASN
    // and an explicit upstream/connectivity section with provider/path data.
    var asn=String(service.asn||"").replace(/^AS/i,"");
    var hasAsn=asn && new RegExp("\\bAS\\s*"+asn+"\\b","i").test(t);
    var hasConnectivity=/AS-level connectivity|Connectivity/i.test(t);
    var hasUpstreams=/Upstream providers?|Upstreams?/i.test(t);
    var hasProviderData=/\bAS\d{2,6}\b[\s\S]{0,180}(?:%|provider|upstream|network)/i.test(t) ||
                        /(?:provider|upstream)[\s\S]{0,180}\bAS\d{2,6}\b/i.test(t);

    if(hasAsn && hasConnectivity && hasUpstreams && hasProviderData){
      return {
        events:[],
        health:"normal",
        healthText:"Cloudflare Radar 顯示 BGP 上游連線正常"
      };
    }

    // Radar 頁面沒有足夠資料時保持未知；不把 HTTP 成功當成連線正常。
    return {events:[],health:null,healthText:null};
  }

export function parseInfrastructure(text, service, source) {
    var t=String(text||""), ls=lines(t), events=[];
    var normal=/All Systems Operational|All services operational|operating normally|No active incidents|No current incidents|No incidents reported|No network outages|outage[- ]free/i.test(t);
    var explicit=/^(Investigating|Identified|Monitoring|Resolved|Maintenance|Active|Closed|Degraded)$/i;
    for (var i=0;i<ls.length;i++) {
      if (!explicit.test(ls[i])) continue;
      var title=i>0?ls[i-1]:"";
      if (!title || looksNoise(title) || /BGP communities|routing polic|network overview|product overview|learn more/i.test(title)) continue;
      events.push({title:title,status:explicitStatus(ls[i]),statusRaw:ls[i],start:findDate(ls.slice(i,i+8).join(" ")),end:null,url:service.page,sourceLabel:source.label});
    }
    return {events:sortRecent(events),health:normal?"normal":null,healthText:normal?"官方頁顯示正常":null};
  }
