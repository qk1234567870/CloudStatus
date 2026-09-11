/* localStorage cache module */
import {CONFIG} from "./config.js?v=105.0.0";
import {state,runtime} from "./state.js?v=105.0.0";
import {$} from "./utils.js?v=105.0.0";
import {render} from "../ui/renderer.js?v=105.0.0";

export function saveCache(){
  try{
    localStorage.setItem(CONFIG.cacheKey,JSON.stringify({timestamp:Date.now(),services:state.services}));
  }catch(e){}
}

export function loadCache(){
  try{
    var raw=localStorage.getItem(CONFIG.cacheKey);
    if(!raw) return false;
    var cache=JSON.parse(raw);
    if(!cache || !Array.isArray(cache.services) || !cache.timestamp) return false;
    var age=Date.now()-cache.timestamp;
    if(age>CONFIG.staleCacheMaxAge) return false;
    state.services=cache.services;
    runtime.lastRefresh=cache.timestamp;
    render();
    var now=new Intl.DateTimeFormat("zh-TW",{year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(cache.timestamp));
    $("#updated").textContent=(age<=CONFIG.cacheMaxAge?"快取於 ":"舊快取於 ")+now+" · 正在背景更新";
    return true;
  }catch(e){return false;}
}
