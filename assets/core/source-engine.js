/* Source priority, fetching, merge and fallback orchestration */
import {fetchJson,fetchText,fetchReader} from "./network.js";
import {explicitStatus,CLOSED_EVENT_STATUSES,normalizeResult,activeEventCount,mergeEvents} from "./events.js";
import {PARSER_UTILS} from "../parsers/utils.js";
import {statuspageAdapter} from "../parsers/statuspage.js";
import {gcpAdapter} from "../parsers/google.js";
import {rssAdapter} from "../parsers/rss.js";
import {appleStructuredAdapter,fetchAppleJson,parseAppleBackup} from "../parsers/apple.js";
import {parseReader} from "../parsers/reader.js";

export async function runSource(source,service) {
    // A source without its own URL inherits the service's official page.
    // Registry normally resolves this already; keep this fallback for safety.
    if (source && !source.url && service && service.page) {
      source=Object.assign({},source,{url:service.page});
    }

    var moduleParser=(window.CloudStatusServiceParsers||{})[service.id];
    if (moduleParser && typeof moduleParser.runSource === "function") {
      var custom=await moduleParser.runSource(source,service,{
        fetchText:fetchText,
        fetchJson:fetchJson,
        fetchReader:fetchReader,
        utils:PARSER_UTILS
      });
      if (custom) return normalizeResult(custom,service,source);
    }

    if (source.type==="statuspage") {
      var historyUrl=source.url;
      if(!/\/api\/v2\/incidents\.json(?:\?|$)/i.test(historyUrl)) historyUrl=String(historyUrl||"").replace(/\/$/,"")+"/api/v2/incidents.json";
      var unresolvedUrl=source.unresolvedUrl || historyUrl.replace(/\/incidents\.json(?:\?.*)?$/i,"/incidents/unresolved.json");
      var settled=await Promise.allSettled([fetchJson(unresolvedUrl),fetchJson(historyUrl)]);
      var unresolvedData=settled[0].status==="fulfilled" ? settled[0].value : null;
      var historyData=settled[1].status==="fulfilled" ? settled[1].value : null;
      if(!unresolvedData && !historyData) throw new Error("Status API unavailable");
      var activeIncidents=unresolvedData && Array.isArray(unresolvedData.incidents) ? unresolvedData.incidents.slice() : [];
      var activeIds={}; activeIncidents.forEach(function(inc){ if(inc && inc.id) activeIds[String(inc.id)]=true; });
      var historyIncidents=historyData && Array.isArray(historyData.incidents) ? historyData.incidents : [];
      var recentIncidents=historyIncidents.filter(function(inc){
        if(!inc) return false;
        if(inc.id && activeIds[String(inc.id)]) return false;
        var st=explicitStatus(inc.status);
        return !!(st && CLOSED_EVENT_STATUSES[st]);
      });
      return normalizeResult(statuspageAdapter({activeIncidents:activeIncidents,recentIncidents:recentIncidents,_unresolvedChecked:!!unresolvedData},service,source),service,source);
    }
    if (source.type==="apple-json") return normalizeResult(appleStructuredAdapter(await fetchAppleJson(source.url),service,source),service,source);
    if (source.type==="gcp") return normalizeResult(gcpAdapter(await fetchJson(source.url),service,source),service,source);
    if (source.type==="rss") return normalizeResult(rssAdapter(await fetchText(source.url),service,source),service,source);
    if (source.type==="apple-backup") return normalizeResult(parseAppleBackup(await fetchReader(source.url),service,source),service,source);
    if (source.type==="reader") return parseReader(await fetchReader(source.url),service,source);
    throw new Error("Unsupported source " + source.type);
  }

export const SOURCE_PRIORITY = {
    "official-api": 10,
    "official-json": 20,
    "official-rss": 30,
    "official-history": 40,
    "official-status": 50,
    "official-announcement": 60,
    "official-backup": 70,
    "trusted-third-party": 80,
    "other-backup": 90
  };

export function sourcePriority(source) {
    if (source && typeof source.priority === "number") {
      return source.priority;
    }
    if (source && source.kind && SOURCE_PRIORITY[source.kind] != null) {
      return SOURCE_PRIORITY[source.kind];
    }
    if (source && typeof source.tier === "number") {
      return source.tier;
    }
    return 999;
  }

export function isThirdPartySource(source) {
    return source && (
      source.kind === "trusted-third-party" ||
      source.kind === "other-backup"
    );
  }

export async function loadPrimarySource(service) {
    var sources=service.sources.slice().sort(function(a,b){return sourcePriority(a)-sourcePriority(b);});
    var source=sources[0];

    if(!source){
      return {
        id:service.id,name:service.name,nameZh:service.nameZh||"",desc:service.desc,category:service.category,page:service.page,carrier:service.carrier||null,carrierLabel:service.carrierLabel||null,routeClass:service.routeClass||null,routeClassLabel:service.routeClassLabel||null,globalProbeLabel:service.globalProbeLabel||null,
        events:[],activeEvents:null,recentEvents:null,checks:null,globalProbe:null,details:null,detailsTitle:null,detailsSource:null,health:null,healthText:null,sourceLabel:"官方頁",fallback:true,failures:["No source"],
        _remainingSources:[]
      };
    }

    try{
      var result=await runSource(source,service);
      var events=(result.events||[]).slice(0,20);
      var activeEvents=Array.isArray(result.activeEvents) ? result.activeEvents.slice(0,20) : null;
      var recentEvents=Array.isArray(result.recentEvents) ? result.recentEvents.slice(0,20) : null;
      var checks=Array.isArray(result.checks) ? result.checks.slice() : null;
      var globalProbe=result.globalProbe && typeof result.globalProbe==="object" ? result.globalProbe : null;
      var details=Array.isArray(result.details) ? result.details.slice() : null;
      var detailsTitle=result.detailsTitle||null;
      var detailsSource=result.detailsSource||null;
      var health=result.health||null;
      var healthText=result.healthText||null;

      return {
        id:service.id,name:service.name,nameZh:service.nameZh||"",desc:service.desc,category:service.category,page:service.page,carrier:service.carrier||null,carrierLabel:service.carrierLabel||null,routeClass:service.routeClass||null,routeClassLabel:service.routeClassLabel||null,globalProbeLabel:service.globalProbeLabel||null,
        events:events,activeEvents:activeEvents,recentEvents:recentEvents,checks:checks,globalProbe:globalProbe,details:details,detailsTitle:detailsTitle,detailsSource:detailsSource,health:health,healthText:healthText,
        sourceLabel:(events.length||checks||globalProbe||(details&&details.length)||health)?source.label:"官方頁",
        fallback:!events.length&&!(details&&details.length)&&!health,
        failures:[],
        _remainingSources:sources.slice(1)
      };
    }catch(e){
      return {
        id:service.id,name:service.name,nameZh:service.nameZh||"",desc:service.desc,category:service.category,page:service.page,carrier:service.carrier||null,carrierLabel:service.carrierLabel||null,routeClass:service.routeClass||null,routeClassLabel:service.routeClassLabel||null,globalProbeLabel:service.globalProbeLabel||null,
        events:[],activeEvents:null,recentEvents:null,checks:null,globalProbe:null,details:null,detailsTitle:null,detailsSource:null,health:null,healthText:null,sourceLabel:"官方頁",fallback:true,
        failures:[source.label+": "+String(e)],
        _remainingSources:sources.slice(1)
      };
    }
  }

export async function completeService(service, partial) {
    var events=(partial.events||[]).slice();
    var activeEvents=Array.isArray(partial.activeEvents) ? partial.activeEvents.slice() : null;
    var recentEvents=Array.isArray(partial.recentEvents) ? partial.recentEvents.slice() : null;
    var checks=Array.isArray(partial.checks) ? partial.checks.slice() : null;
    var globalProbe=partial.globalProbe && typeof partial.globalProbe==="object" ? partial.globalProbe : null;
    var details=Array.isArray(partial.details) ? partial.details.slice() : null;
    var detailsTitle=partial.detailsTitle||null;
    var detailsSource=partial.detailsSource||null;
    var health=partial.health||null, healthText=partial.healthText||null;
    var labels=[]; if(partial.sourceLabel && partial.sourceLabel!=="官方頁") labels.push(partial.sourceLabel);
    var failures=(partial.failures||[]).slice();
    var sources=(partial._remainingSources||[]).slice();
    var hasStructuredChannels=Array.isArray(activeEvents) && Array.isArray(recentEvents);
    for(var i=0;i<sources.length;i++){
      var source=sources[i];
      if(hasStructuredChannels && health) break;
      if(isThirdPartySource(source) && health && events.length>=3 && activeEventCount(events)>0) break;
      try{
        var result=await runSource(source,service);
        if(result.events && result.events.length){ events=mergeEvents(events,result.events); if(labels.indexOf(source.label)<0) labels.push(source.label); }
        if(!checks && Array.isArray(result.checks)){ checks=result.checks.slice(); if(labels.indexOf(source.label)<0) labels.push(source.label); }
        if(!globalProbe && result.globalProbe && typeof result.globalProbe==="object"){ globalProbe=result.globalProbe; if(labels.indexOf(source.label)<0) labels.push(source.label); }
        if(!details && Array.isArray(result.details)){ details=result.details.slice(); detailsTitle=result.detailsTitle||null; detailsSource=result.detailsSource||null; if(labels.indexOf(source.label)<0) labels.push(source.label); }
        if(!hasStructuredChannels && Array.isArray(result.activeEvents) && Array.isArray(result.recentEvents)){
          activeEvents=result.activeEvents.slice(); recentEvents=result.recentEvents.slice(); hasStructuredChannels=true;
        }
        if(result.health && !health){ health=result.health; healthText=result.healthText||null; if(labels.indexOf(source.label)<0) labels.push(source.label); }
        if(hasStructuredChannels && health) break;
        if(events.length>=3 && health && (health==="normal" || activeEventCount(events)>0)) break;
      }catch(e){ failures.push(source.label+": "+String(e)); }
    }
    return {
      id:service.id,name:service.name,nameZh:service.nameZh||"",desc:service.desc,category:service.category,page:service.page,carrier:service.carrier||null,carrierLabel:service.carrierLabel||null,routeClass:service.routeClass||null,routeClassLabel:service.routeClassLabel||null,globalProbeLabel:service.globalProbeLabel||null,
      events:events.slice(0,20),activeEvents:activeEvents,recentEvents:recentEvents,checks:checks,globalProbe:globalProbe,details:details,detailsTitle:detailsTitle,detailsSource:detailsSource,health:health,healthText:healthText,
      sourceLabel:labels.length===1?labels[0]:(labels.length>1?"多來源":"官方頁"),
      fallback:!events.length&&!checks&&!globalProbe&&!(details&&details.length)&&!health,failures:failures
    };
  }

export async function runWithConcurrency(items, limit, worker) {
    var next=0;
    var workers=[];

    async function runOne(){
      while(true){
        var index=next++;
        if(index>=items.length) return;
        await worker(items[index], index);
      }
    }

    for(var i=0;i<Math.min(limit,items.length);i++){
      workers.push(runOne());
    }

    await Promise.all(workers);
  }
