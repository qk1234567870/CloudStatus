/* Visibility/focus-aware refresh scheduler */
import {CONFIG} from "./config.js?v=100.0.0";
import {refresh,shouldForegroundRefresh} from "./refresh.js?v=100.0.0";

export function startAutoRefresh(){
  setInterval(function(){if(document.visibilityState==="visible") refresh();},CONFIG.refreshInterval);
  document.addEventListener("visibilitychange",function(){
    if(document.visibilityState==="visible" && shouldForegroundRefresh()) refresh();
  });
  window.addEventListener("focus",function(){if(shouldForegroundRefresh()) refresh();});
}
