/* Event/status normalization and deduplication */
import {cleanText,timeValue} from "./utils.js?v=105.0.0";

export const STATUS_LABELS = {
    investigating: "調查中",
    identified: "已確認",
    monitoring: "監控中",
    resolved: "已解決",
    postmortem: "事後分析",
    maintenance: "維護",
    scheduled: "已排程",
    in_progress: "進行中",
    completed: "已完成",
    degraded: "效能下降",
    outage: "服務中斷",
    active: "啟用",
    closed: "已關閉"
  };

export const NOISE = [
    /^#+\s*/i, /^recent incidents?$/i, /^past incidents?$/i, /^incident history$/i,
    /^view all$/i, /^view history$/i, /^subscribe$/i, /^rss(?: feed)?$/i, /^atom$/i,
    /^webhook$/i, /^documentation$/i, /^privacy(?: policy)?$/i, /^terms/i,
    /^powered by/i, /^contact us$/i, /^send feedback$/i,
    /^get (?:email|text message|sms) notifications?/i,
    /^receive (?:email|text message|sms) notifications?/i,
    /^\[[^\]]*\]\([^)]+\)$/i,
    /網址來源\s*:/i,
    /url source\s*:/i
  ];

export const CLOSED_EVENT_STATUSES = {
    resolved:true,
    postmortem:true,
    completed:true,
    closed:true
  };

export function explicitStatus(v) {
    if (v == null || v === "") return null;
    var s = cleanText(v).toLowerCase().replace(/\s+/g, "_");
    var map = {
      investigating:"investigating", identified:"identified", monitoring:"monitoring",
      resolved:"resolved", postmortem:"postmortem", maintenance:"maintenance",
      scheduled:"scheduled", in_progress:"in_progress", completed:"completed",
      degraded:"degraded", outage:"outage", active:"active", closed:"closed"
    };
    return map[s] || null;
  }

export function isActiveEvent(event) {
    if (!event) return false;

    // Statuspage unresolved endpoint is authoritative for current incidents.
    // This avoids dropping a current incident when its lifecycle status is
    // temporarily absent/unknown in the JSON payload.
    if (event.unresolved === true) return true;
    if (event.unresolved === false) return false;

    if (!event.status) return false;
    return !CLOSED_EVENT_STATUSES[event.status];
  }

export function activeEventCount(events) {
    return (events||[]).filter(isActiveEvent).length;
  }

export function looksNoise(title) {
    var t = cleanText(title);
    if (!t || t.length < 4) return true;
    for (var i=0;i<NOISE.length;i++) if (NOISE[i].test(t)) return true;
    if (/notification/i.test(t) && /(email|sms|text message|subscribe)/i.test(t)) return true;
    return false;
  }

export function normalizeEvent(event, service, source) {
    if (!event) return null;
    var title=cleanText(event.title);
    if (!title || looksNoise(title)) return null;

    var status=event.status ? explicitStatus(event.status) : null;
    if (!status && event.statusRaw) status=explicitStatus(event.statusRaw);

    return {
      id:event.id || null,
      title:title,
      status:status || null,
      statusRaw:event.statusRaw || null,
      unresolved:typeof event.unresolved==="boolean" ? event.unresolved : null,
      start:event.start || null,
      end:event.end || null,
      url:event.url || (source && source.url) || (service && service.page) || null,
      sourceLabel:event.sourceLabel || (source && source.label) || null
    };
  }

export function normalizeResult(result, service, source) {
    result=result || {};
    function normList(list){
      return (list || []).map(function(e){ return normalizeEvent(e,service,source); }).filter(Boolean);
    }
    var explicitActive=Array.isArray(result.activeEvents) ? sortRecent(normList(result.activeEvents)) : null;
    var explicitRecent=Array.isArray(result.recentEvents) ? sortRecent(normList(result.recentEvents)) : null;
    var events=sortRecent(normList(result.events || []));
    if(explicitActive || explicitRecent) events=sortRecent((explicitActive||[]).concat(explicitRecent||[]));
    var checks=Array.isArray(result.checks) ? result.checks.map(function(item){
      if(!item) return null;
      var state=["ok","fail","timeout","unknown"].indexOf(item.state)>=0 ? item.state : "unknown";
      return {
        id:cleanText(item.id || ""),
        name:cleanText(item.name || ""),
        host:cleanText(item.host || ""),
        location:cleanText(item.location || ""),
        continent:cleanText(item.continent || ""),
        state:state,
        endpoint:item.endpoint || null,
        url:item.url || null
      };
    }).filter(Boolean) : null;

    var globalProbe=null;
    if(result.globalProbe && typeof result.globalProbe==="object"){
      var gp=result.globalProbe;
      var summary=gp.summary && typeof gp.summary==="object" ? gp.summary : {};
      var gpState=["normal","partial","failed","unknown"].indexOf(summary.state)>=0 ? summary.state : "unknown";

      globalProbe={
        runStatus:["success","failed","not-run"].indexOf(gp.runStatus)>=0 ? gp.runStatus : null,
        generatedAt:gp.generatedAt || null,
        source:gp.source && typeof gp.source==="object" ? {
          name:cleanText(gp.source.name || ""),
          url:gp.source.url || null,
          api:gp.source.api || null,
          type:cleanText(gp.source.type || ""),
          method:cleanText(gp.source.method || "")
        } : null,
        summary:{
          state:gpState,
          ok:Number(summary.ok)||0,
          failed:Number(summary.failed)||0,
          unknown:Number(summary.unknown)||0,
          total:Number(summary.total)||0,
          regions:Number(summary.regions)||0
        },
        regions:Array.isArray(gp.regions) ? gp.regions.map(function(region){
          if(!region) return null;
          var regionState=["normal","partial","failed","unknown","unavailable"].indexOf(region.state)>=0
            ? region.state : "unknown";

          return {
            id:cleanText(region.id || ""),
            label:cleanText(region.label || ""),
            dcGroup:cleanText(region.dcGroup || ""),
            state:regionState,
            ok:Number(region.ok)||0,
            total:Number(region.total)||0,
            availableNodes:Number(region.availableNodes)||0,
            unavailableReason:cleanText(region.unavailableReason || ""),
            node:region.node && typeof region.node==="object" ? {
              host:cleanText(region.node.host || ""),
              countryCode:cleanText(region.node.countryCode || ""),
              country:cleanText(region.node.country || ""),
              city:cleanText(region.node.city || ""),
              asn:cleanText(region.node.asn || "")
            } : null
          };
        }).filter(Boolean) : [],
        reports:Array.isArray(gp.reports) ? gp.reports.map(function(item){
          return item && item.url ? {dc:Number(item.dc)||0,url:item.url} : null;
        }).filter(Boolean) : [],
        note:cleanText(gp.note || ""),
        error:cleanText(gp.error || "")
      };
    }

    var details=Array.isArray(result.details) ? result.details.map(function(item){
      if(!item) return null;
      return {
        id:cleanText(item.id || ""),
        name:cleanText(item.name || ""),
        status:cleanText(item.status || ""),
        state:["ok","fail","unknown"].indexOf(item.state)>=0 ? item.state : "unknown",
        location:cleanText(item.location || ""),
        category:cleanText(item.category || ""),
        kind:cleanText(item.kind || ""),
        group:cleanText(item.group || ""),
        route:cleanText(item.route || "")
      };
    }).filter(Boolean) : null;
    var detailsTitle=cleanText(result.detailsTitle || "");
    var detailsSource=cleanText(result.detailsSource || "");

    var health=result.health || null;
    var healthText=result.healthText || null;
    var activeCount=explicitActive ? explicitActive.length : activeEventCount(events);
    if(activeCount>0){ health="incident"; if(!healthText) healthText=activeCount+" 個未解決事件"; }
    return {
      events:events,
      activeEvents:explicitActive,
      recentEvents:explicitRecent,
      checks:checks,
      globalProbe:globalProbe,
      details:details,
      detailsTitle:detailsTitle,
      detailsSource:detailsSource,
      health:health,
      healthText:healthText
    };
  }

export function fingerprint(e) {
    if(e && e.id) return "id:"+String(e.id);
    return cleanText(e.title).toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim() +
      "|" + (e.start ? String(e.start).slice(0,10) : "");
  }

export function dedupe(events) {
    var out=[], seen={};
    (events||[]).forEach(function(e){
      if (!e || looksNoise(e.title)) return;
      var k=fingerprint(e);
      if (!k || seen[k]) return;
      seen[k]=true; out.push(e);
    });
    return out;
  }

export function sortRecent(events) {
    return dedupe(events).sort(function(a,b){
      return timeValue(b.start || b.end) - timeValue(a.start || a.end);
    }).slice(0,20);
  }

export function mergeEvents(existing,newEvents) {
    var all=(existing||[]).concat(newEvents||[]);
    var map={}, out=[];
    all.forEach(function(e){
      if (!e || looksNoise(e.title)) return;
      var k=fingerprint(e);
      if (!k) return;
      if (!map[k]) { map[k]=e; out.push(e); return; }
      var old=map[k];
      if (!old.id && e.id) old.id=e.id;
      if (e.unresolved === true) old.unresolved=true;
      else if (old.unresolved == null && e.unresolved === false) old.unresolved=false;
      if (!old.status && e.status) { old.status=e.status; old.statusRaw=e.statusRaw; }
      old.start=old.start||e.start; old.end=old.end||e.end; old.url=old.url||e.url;
    });
    return sortRecent(out);
  }
