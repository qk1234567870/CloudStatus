/* DOM event bindings and viewport lifecycle */
import {$} from "../core/utils.js?v=101.0.0";
import {state} from "../core/state.js?v=101.0.0";
import {refresh} from "../core/refresh.js?v=101.0.0";
import {render,relayoutForViewport,startResponsiveLayoutObserver} from "./renderer.js?v=101.0.0";
import {bindFilterEvents,startFilterLayout,scheduleFilterLayout} from "./filters.js?v=101.0.0";

export function bindUI(){
  bindFilterEvents();
  $("#search").addEventListener("input",function(e){state.search=e.target.value;render();});
  $("#activeOnly").addEventListener("change",function(e){state.activeOnly=e.target.checked;render();});
  $("#reload").addEventListener("click",function(){refresh({force:true});});

  var layoutResizeTimer=null;
  window.addEventListener("resize",function(){
    clearTimeout(layoutResizeTimer);
    layoutResizeTimer=setTimeout(function(){relayoutForViewport();scheduleFilterLayout();},120);
  });

  startResponsiveLayoutObserver();
  startFilterLayout();

  window.addEventListener("orientationchange",function(){
    setTimeout(relayoutForViewport,80); setTimeout(relayoutForViewport,260);
  });
  window.addEventListener("pageshow",function(){requestAnimationFrame(relayoutForViewport);});

  if(window.visualViewport){
    var visualViewportTimer=0;
    function handleVisualViewport(){
      clearTimeout(visualViewportTimer);
      visualViewportTimer=setTimeout(function(){scheduleFilterLayout();relayoutForViewport();},80);
    }
    window.visualViewport.addEventListener("resize",handleVisualViewport);
    window.visualViewport.addEventListener("scroll",handleVisualViewport);
  }

  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(function(){relayoutForViewport();});
  }
}
