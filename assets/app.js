/* CloudStatus bootstrap only. Business logic lives in modules. */
import {initializeCatalog} from "./core/state.js";
import {loadCache} from "./core/cache.js";
import {refresh} from "./core/refresh.js";
import {startAutoRefresh} from "./core/scheduler.js";
import {bindUI} from "./ui/bindings.js";

async function boot(){
  var registry=window.CloudStatusServices;
  if(registry && registry.ready) await registry.ready;
  initializeCatalog(window.CLOUDSTATUS_SERVICES || []);
  bindUI();
  loadCache();
  refresh({force:true});
  startAutoRefresh();
}

boot().catch(function(error){
  console.error(error);
  var updated=document.querySelector("#updated");
  var services=document.querySelector("#services");
  if(updated) updated.textContent="模組載入失敗";
  if(services) services.innerHTML='<div class="empty">核心模組載入失敗，請重新整理頁面。</div>';
});
