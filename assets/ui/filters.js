/* Category filter and dynamic overflow menu */
import {$} from "../core/utils.js?v=102.0.0";
import {state} from "../core/state.js?v=102.0.0";
import {render} from "./renderer.js?v=102.0.0";

export const FILTER_ORDER=[
    {value:"all",label:"全部"},
    {value:"cloud",label:"雲端"},
    {value:"ai",label:"AI"},
    {value:"developer",label:"開發者"},
    {value:"platform",label:"平台"},
    {value:"hosting",label:"Hosting"},
    {value:"datacenter",label:"數據中心"},
    {value:"backbone",label:"骨幹網"},
    {value:"crossborder",label:"跨境線路"}
  ];
let filterResizeObserver=null;
let filterLayoutFrame=0;

export function setFilter(value){
    state.filter=value;
    Array.prototype.forEach.call(document.querySelectorAll("[data-filter]"),function(el){
      el.classList.toggle("active",el.getAttribute("data-filter")===value);
    });
    closeFilterMore();
    render();
    scheduleFilterLayout();
  }

export function closeFilterMore(){
    var btn=$("#filterMore");
    var menu=$("#filterMoreMenu");
    if(!btn || !menu) return;
    btn.setAttribute("aria-expanded","false");
    menu.hidden=true;
  }

export function toggleFilterMore(){
    var btn=$("#filterMore");
    var menu=$("#filterMoreMenu");
    if(!btn || !menu) return;
    var open=btn.getAttribute("aria-expanded")==="true";
    btn.setAttribute("aria-expanded",open?"false":"true");
    menu.hidden=open;
  }

export function measureFilterWidth(label,active){
    var probe=document.createElement("button");
    probe.className="chip"+(active?" active":"");
    probe.textContent=label;
    probe.style.position="fixed";
    probe.style.visibility="hidden";
    probe.style.pointerEvents="none";
    probe.style.left="-9999px";
    document.body.appendChild(probe);
    var width=Math.ceil(probe.getBoundingClientRect().width);
    probe.remove();
    return width;
  }

export function rebuildFilterLayout(){
    var shell=document.querySelector(".filter-shell");
    var filters=$("#filters");
    var moreWrap=$("#filterMoreWrap");
    var more=$("#filterMore");
    var menu=$("#filterMoreMenu");
    if(!shell || !filters || !moreWrap || !more || !menu) return;

    var available=Math.floor(shell.getBoundingClientRect().width);
    if(available<=0) return;

    var style=getComputedStyle(filters);
    var gap=parseFloat(style.columnGap || style.gap) || 0;
    var moreWidth=measureFilterWidth("更多⌄",false);
    var widths=FILTER_ORDER.map(function(item){
      return measureFilterWidth(item.label,item.value===state.filter);
    });

    // First try to fit every category without a More button.
    var allWidth=widths.reduce(function(sum,w){return sum+w;},0)+gap*(FILTER_ORDER.length-1);
    var visibleCount=FILTER_ORDER.length;

    if(allWidth>available){
      // Reserve More button first; then fit as many real buttons as possible.
      var used=moreWidth;
      visibleCount=0;
      for(var i=0;i<FILTER_ORDER.length;i++){
        var extra=widths[i]+(visibleCount>0?gap:0)+(visibleCount===0?gap:0);
        if(used+extra>available) break;
        used+=extra;
        visibleCount++;
      }
      // Keep at least one direct category.
      visibleCount=Math.max(1,visibleCount);
    }

    var visible=FILTER_ORDER.slice(0,visibleCount);
    var overflow=FILTER_ORDER.slice(visibleCount);

    filters.innerHTML=visible.map(function(item){
      return '<button class="chip'+(item.value===state.filter?' active':'')+'" data-filter="'+item.value+'">'+item.label+'</button>';
    }).join("");

    if(overflow.length){
      moreWrap.hidden=false;
      menu.innerHTML=overflow.map(function(item){
        return '<button class="filter-more-item'+(item.value===state.filter?' active':'')+'" type="button" role="menuitem" data-filter="'+item.value+'">'+item.label+'</button>';
      }).join("");
      more.classList.toggle("active",overflow.some(function(item){return item.value===state.filter;}));
    }else{
      moreWrap.hidden=true;
      menu.innerHTML="";
      closeFilterMore();
    }
  }

export function scheduleFilterLayout(){
    cancelAnimationFrame(filterLayoutFrame);
    filterLayoutFrame=requestAnimationFrame(rebuildFilterLayout);
  }

export function startFilterLayout(){
    scheduleFilterLayout();
    var shell=document.querySelector(".filter-shell");
    if(shell && typeof ResizeObserver!=="undefined"){
      filterResizeObserver=new ResizeObserver(scheduleFilterLayout);
      filterResizeObserver.observe(shell);
    }
    window.addEventListener("orientationchange",function(){
      setTimeout(scheduleFilterLayout,80);
      setTimeout(scheduleFilterLayout,260);
    });
  }

export function bindFilterEvents(){
  $("#filters").addEventListener("click",function(e){var b=e.target.closest("[data-filter]");if(!b)return;setFilter(b.getAttribute("data-filter"));});
  $("#filterMore").addEventListener("click",function(e){e.stopPropagation();toggleFilterMore();});
  $("#filterMoreMenu").addEventListener("click",function(e){var b=e.target.closest("[data-filter]");if(!b)return;setFilter(b.getAttribute("data-filter"));});
  document.addEventListener("click",function(e){var wrap=$("#filterMoreWrap");if(wrap && !wrap.contains(e.target)) closeFilterMore();});
}
