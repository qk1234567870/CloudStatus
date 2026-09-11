/* Incremental refresh pipeline */
import {CONFIG} from "./config.js?v=98.0.0";
import {state,runtime,catalog} from "./state.js?v=98.0.0";
import {$} from "./utils.js?v=98.0.0";
import {loadPrimarySource,completeService,runWithConcurrency} from "./source-engine.js?v=98.0.0";
import {saveCache} from "./cache.js?v=98.0.0";
import {render} from "../ui/renderer.js?v=98.0.0";

export async function refresh(options) {
    options=options||{};
    if(runtime.refreshInFlight && !options.force) return;

    runtime.refreshInFlight=true;
    var reload=$("#reload");
    reload.disabled=true;

    if(!state.services.length){
      $("#updated").textContent="正在讀取官方來源…";
    }

    try{
      var partials=new Array(catalog.services.length);

      // 沒有快取時先立即畫出所有服務卡片，不等待第一個網路請求。
      if(!state.services.length){
        state.services=catalog.services.map(function(service){
          return {
            id:service.id,name:service.name,nameZh:service.nameZh||"",desc:service.desc,category:service.category,page:service.page,carrier:service.carrier||null,carrierLabel:service.carrierLabel||null,routeClass:service.routeClass||null,routeClassLabel:service.routeClassLabel||null,globalProbeLabel:service.globalProbeLabel||null,sectionLinks:service.sectionLinks||null,
            events:[],activeEvents:null,recentEvents:null,checks:null,globalProbe:null,details:null,detailsTitle:null,detailsSource:null,health:null,healthText:null,sourceLabel:"載入中",sourceUrl:null,fallback:false,failures:[],loading:true
          };
        });
        render();
      }

      // 第一階段仍全部並行，但任何一個服務完成就立即更新自己的卡片，
      // 不再等待 16 個主要來源全部結束才第一次顯示資料。
      await Promise.all(catalog.services.map(async function(service,index){
        var partial=await loadPrimarySource(service);
        partials[index]=partial;

        var visible=Object.assign({},partial,{loading:false,updatedAt:Date.now()});
        delete visible._remainingSources;
        state.services[index]=visible;
        render();
      }));

      $("#updated").textContent="主要來源已載入 · 正在補充備援資料…";

      // 第二階段：只處理仍不足的服務，而且限制併發，避免一次開太多 Reader 連線。
      var needs=[];
      partials.forEach(function(p,index){
        if(!p) return;
        if((p.events||[]).length<3 || !p.health){
          if(p._remainingSources && p._remainingSources.length){
            needs.push({index:index,partial:p,service:catalog.services[index]});
          }
        }
      });

      await runWithConcurrency(needs,CONFIG.fallbackConcurrency,async function(item){
        var result=await completeService(item.service,item.partial);
        result.loading=false;
        result.updatedAt=Date.now();
        state.services[item.index]=result;
        render();
      });

      // 清理任何殘留的內部欄位。
      state.services=state.services.map(function(x){
        var copy=Object.assign({},x);
        delete copy._remainingSources;
        return copy;
      });

      runtime.lastRefresh=Date.now();
      saveCache();

      var now=new Intl.DateTimeFormat("zh-TW",{
        year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false
      }).format(new Date(runtime.lastRefresh));

      $("#updated").textContent="最後讀取於 "+now;
      render();
    }catch(e){
      $("#updated").textContent="更新失敗";
      if(!state.services.length){
        $("#services").innerHTML='<div class="empty">資料載入失敗，請稍後重試。</div>';
      }
    }finally{
      runtime.refreshInFlight=false;
      reload.disabled=false;
    }
  }

export function shouldForegroundRefresh() {
    return !runtime.lastRefresh || Date.now()-runtime.lastRefresh>=CONFIG.foregroundRefreshThreshold;
  }
