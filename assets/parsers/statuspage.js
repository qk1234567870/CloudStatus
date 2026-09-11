import {cleanText,lines,findDate,findAnyDate,findDateRange} from "../core/utils.js?v=105.0.0";
import {explicitStatus,looksNoise,sortRecent,activeEventCount} from "../core/events.js?v=105.0.0";

export function statuspageAdapter(data, service, source) {
    var activeIncidents = Array.isArray(data && data.activeIncidents) ? data.activeIncidents : [];
    var recentIncidents = Array.isArray(data && data.recentIncidents) ? data.recentIncidents : [];

    function mapIncident(inc,isActive){
      return {
        id: inc && inc.id ? inc.id : null,
        title: cleanText(inc && inc.name),
        status: explicitStatus(inc && inc.status),
        statusRaw: (inc && inc.status) || null,
        unresolved: !!isActive,
        impact: (inc && inc.impact) || null,
        start: (inc && (inc.started_at || inc.created_at)) || null,
        end: isActive ? null : ((inc && inc.resolved_at) || null),
        url: (inc && (inc.shortlink || inc.url)) || service.page,
        sourceLabel: source.label
      };
    }

    var activeEvents=sortRecent(activeIncidents.map(function(inc){ return mapIncident(inc,true); }));
    var recentEvents=sortRecent(recentIncidents.map(function(inc){ return mapIncident(inc,false); }));
    var events=activeEvents.concat(recentEvents);
    var unresolvedChecked=!!(data && data._unresolvedChecked);
    var health=null, healthText=null;
    if(activeEvents.length>0){ health="incident"; healthText=activeEvents.length+" 個未解決事件"; }
    else if(unresolvedChecked){ health="normal"; healthText="目前沒有未解決事件"; }
    return { events:events, activeEvents:activeEvents, recentEvents:recentEvents, health:health, healthText:healthText };
  }
