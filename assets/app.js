import SERVICES from "../services/index.js";

const state={services:[],filter:"all",search:"",activeOnly:false};
const $=q=>document.querySelector(q);
const labels={resolved:"已解決",monitoring:"監控中",identified:"已確認",degraded:"效能下降",maintenance:"維護中",investigating:"處理中",outage:"服務中斷"};

function norm(v){const s=String(v||"").toLowerCase();if(["resolved","postmortem","completed"].includes(s))return"resolved";if(s.includes("monitoring"))return"monitoring";if(s.includes("identified"))return"identified";if(s.includes("maintenance"))return"maintenance";if(s.includes("degraded"))return"degraded";if(s.includes("outage"))return"outage";return"investigating"}
function latest(events){return [...events].sort((a,b)=>new Date(b.start||0)-new Date(a.start||0)).slice(0,3)}
function fmt(v){if(!v)return"";const d=new Date(v);if(Number.isNaN(d.getTime()))return"";return new Intl.DateTimeFormat("zh-TW",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(d)}
function range(a,b){return b?`${fmt(a)}-${fmt(b)}`:fmt(a)}

async function loadService(s){
  if(s.mode==="link")return {...s,state:"link",events:[]};
  try{
    const r=await fetch(s.api,{cache:"no-store"}); if(!r.ok)throw new Error(`HTTP ${r.status}`); const d=await r.json();
    let events=[];
    if(s.mode==="statuspage"){
      events=(d.incidents||[]).map(x=>({title:x.name||"",status:norm(x.status),start:x.created_at||null,end:x.resolved_at||null,url:x.shortlink||x.url||s.page}));
    }else{
      events=(Array.isArray(d)?d:[]).map(x=>({title:x.external_desc||x.service_name||"",status:x.end?"resolved":"investigating",start:x.begin||null,end:x.end||null,url:s.page}));
    }
    return {...s,state:"ok",events:latest(events)};
  }catch(e){
    return {...s,state:"cors_or_fetch_failed",events:[],error:String(e)};
  }
}

function active(s){return(s.events||[]).some(e=>e.status!=="resolved")}
function visible(){const n=state.search.trim().toLowerCase();return state.services.filter(s=>{if(state.filter!=="all"&&s.category!==state.filter)return false;if(state.activeOnly&&!active(s))return false;if(n){const h=[s.name,s.desc,...(s.events||[]).map(e=>e.title)].join(" ").toLowerCase();if(!h.includes(n))return false}return true})}
function summary(){const live=state.services.filter(s=>s.mode!=="link").length;const links=state.services.length-live;$("#summary").innerHTML=`<div class="metric"><strong>${state.services.length}</strong><span>服務</span></div><div class="metric"><strong>${live}</strong><span>直接即時讀取</span></div><div class="metric"><strong>${links}</strong><span>官方狀態頁</span></div>`}
function card(s){
  let body="";
  if(s.state==="link") body=`<a class="message link" href="${s.page}" target="_blank">[官方狀態頁] 查看即時服務狀態 →</a>`;
  else if(s.state==="cors_or_fetch_failed") body=`<a class="message warn" href="${s.page}" target="_blank">[瀏覽器無法直接讀取] 開啟官方狀態頁 →</a>`;
  else if(!s.events.length) body=`<div class="message good">[正常] 目前沒有公開事件</div>`;
  else body=s.events.map(e=>`<a class="event" href="${e.url||s.page}" target="_blank"><span class="tag ${e.status}">[${labels[e.status]||"處理中"}]</span><span class="event-title">${e.title}</span><span class="event-time">${range(e.start,e.end)}</span></a>`).join("");
  return `<article class="service"><div class="service-head"><a class="service-name" href="${s.page}" target="_blank">🔹 ${s.name}</a><span class="service-desc">(${s.desc})</span><span class="mode">${s.mode==="link"?"官方頁":"即時"}</span></div><div class="events">${body}</div></article>`;
}
function render(){summary();$("#services").innerHTML=visible().map(card).join("")||`<div class="message">沒有符合條件的服務或事件。</div>`}
async function refresh(){ $("#updated").textContent="正在讀取官方來源…"; state.services=await Promise.all(SERVICES.map(loadService)); $("#updated").textContent="最後讀取於 "+new Intl.DateTimeFormat("zh-TW",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date()); render()}

$("#filters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;state.filter=b.dataset.filter;document.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x===b));render()});
$("#search").addEventListener("input",e=>{state.search=e.target.value;render()});
$("#activeOnly").addEventListener("change",e=>{state.activeOnly=e.target.checked;render()});
$("#reload").addEventListener("click",refresh);

await refresh();
setInterval(refresh,60000);
