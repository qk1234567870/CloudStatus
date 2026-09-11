/* Rendering engine and responsive service-flow layout */
import {$,escapeHtml,formatRange} from "../core/utils.js";
import {STATUS_LABELS,isActiveEvent} from "../core/events.js";
import {state,runtime,catalog} from "../core/state.js";
import {visibleServices} from "../core/query.js";
import {render as renderCard} from "./card-template.js";

export function renderSummary() {
    var loaded=state.services.filter(function(s){return !s.loading;});
    var auto=loaded.filter(function(s){return !s.fallback;}).length;
    var fallback=loaded.filter(function(s){return s.fallback;}).length;
    $("#summary").innerHTML =
      '<div class="metric"><strong>'+state.services.length+'</strong><span>服務</span></div>'+
      '<div class="metric"><strong>'+auto+'</strong><span>自動取得</span></div>'+
      '<div class="metric"><strong>'+fallback+'</strong><span>官方頁備援</span></div>';
  }

export function formatReadTime(value) {
    if (!value) return "";
    var date=new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("zh-TW",{
      hour:"2-digit",minute:"2-digit",hour12:false
    }).format(date);
  }

export function templateContext() {
    return {
      escapeHtml:escapeHtml,
      formatRange:formatRange,
      formatReadTime:formatReadTime,
      statusLabels:STATUS_LABELS,
      isActiveEvent:isActiveEvent,
      lastRefresh:runtime.lastRefresh
    };
  }

let layoutMode="";
export function currentLayoutMode(){
    var grid=$("#services");
    if(!grid) return "single";
    var width=Math.floor(grid.getBoundingClientRect().width || grid.clientWidth || 0);
    return width>=760 ? "double" : "single";
  }

export function renderServiceFlow(list,ctx,mode){
        if(!list.length){
      return '<div class="empty">沒有符合條件的服務或事件。</div>';
    }

    if(mode!=="double"){
      return list.map(function(service){
        return renderCard(service,ctx);
      }).join("");
    }

    var left=[];
    var right=[];

    list.forEach(function(service,index){
      var html=renderCard(service,ctx);
      if(index%2===0) left.push(html);
      else right.push(html);
    });

    return ''+
      '<div class="service-columns">'+
        '<div class="service-column service-column-left">'+left.join("")+'</div>'+
        '<div class="service-column service-column-right">'+right.join("")+'</div>'+
      '</div>';
  }

let renderFrame=0;
let renderPending=false;
let lastRenderSignature="";
let layoutResizeObserver=null;

export function servicesSignature(list){
    return list.map(function(service){
      return [
        service.id,service.loading?"1":"0",service.health||"",service.healthText||"",
        service.sourceLabel||"",service.sourceUrl||"",service.fallback?"1":"0",service.updatedAt||"",
        service.globalProbeLabel||"",
        service.sectionLinks&&service.sectionLinks.current&&service.sectionLinks.current.url||"",
        service.sectionLinks&&service.sectionLinks.history&&service.sectionLinks.history.url||"",
        service.sectionLinks&&service.sectionLinks.services&&service.sectionLinks.services.url||"",
        (service.events||[]).map(function(e){
          return [e.title||"",e.status||"",e.start||"",e.end||""].join("~");
        }).join("¦"),
        (service.activeEvents||[]).map(function(e){
          return [e.id||"",e.title||"",e.status||"",e.start||""].join("~");
        }).join("¦"),
        (service.recentEvents||[]).map(function(e){
          return [e.id||"",e.title||"",e.status||"",e.start||"",e.end||""].join("~");
        }).join("¦"),
        (service.checks||[]).map(function(c){
          return [c.id||"",c.name||"",c.host||"",c.location||"",c.continent||"",c.state||"",c.endpoint||""].join("~");
        }).join("¦"),        (service.details||[]).map(function(d){
          return [d.id||"",d.name||"",d.status||"",d.state||"",d.location||"",d.group||"",d.route||""].join("~");
        }).join("¦"),
        service.globalProbe ? [
          service.globalProbe.runStatus||"",
          service.globalProbe.generatedAt||"",
          service.globalProbe.error||"",
          service.globalProbe.summary&&service.globalProbe.summary.state||"",
          service.globalProbe.summary&&service.globalProbe.summary.ok||0,
          service.globalProbe.summary&&service.globalProbe.summary.total||0,
          (service.globalProbe.regions||[]).map(function(r){
            return [r.id||"",r.dcGroup||"",r.state||"",r.ok||0,r.total||0,r.availableNodes||0,r.unavailableReason||"",r.node&&r.node.host||""].join("~");
          }).join("¦")
        ].join("§") : ""
      ].join("§");
    }).join("¶");
  }

function performRender(){
  renderPending=false;
  renderSummary();
  var list=visibleServices(state,catalog.order);
  var mode=currentLayoutMode();
  var ctx=templateContext();
  var signature=[state.filter,state.search,state.activeOnly?"1":"0",mode,servicesSignature(list)].join("||");
  if(signature!==lastRenderSignature){
    $("#services").innerHTML=renderServiceFlow(list,ctx,mode);
    lastRenderSignature=signature;
  }
  layoutMode=mode;
}

export function render(){
  renderPending=true;
  cancelAnimationFrame(renderFrame);
  renderFrame=requestAnimationFrame(function(){if(renderPending) performRender();});
}

export function relayoutForViewport(){
  var next=currentLayoutMode();
  if(next!==layoutMode){lastRenderSignature="";render();}
}

export function startResponsiveLayoutObserver(){
  var grid=$("#services");
  if(!grid || typeof ResizeObserver==="undefined") return;
  if(layoutResizeObserver) layoutResizeObserver.disconnect();
  layoutResizeObserver=new ResizeObserver(function(){relayoutForViewport();});
  layoutResizeObserver.observe(grid);
}

export function invalidateRender(){lastRenderSignature="";}
