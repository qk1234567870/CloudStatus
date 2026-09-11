import {cleanText,lines,findDate,findAnyDate,findDateRange} from "../core/utils.js?v=105.0.0";
import {explicitStatus,looksNoise,sortRecent,activeEventCount} from "../core/events.js?v=105.0.0";

export function rssAdapter(xml, service, source) {
    var doc = new DOMParser().parseFromString(xml,"text/xml");
    var items = Array.prototype.slice.call(doc.querySelectorAll("item, entry"));
    var events = [];
    items.forEach(function(item){
      var t=item.querySelector("title"), d=item.querySelector("pubDate, published, updated"), l=item.querySelector("link");
      if (!t) return;
      var href = l ? (l.getAttribute("href") || cleanText(l.textContent)) : service.page;
      events.push({
        title:cleanText(t.textContent), status:null, statusRaw:null,
        start:d ? cleanText(d.textContent) : null, end:null, url:href || service.page,
        sourceLabel:source.label
      });
    });
    return { events:sortRecent(events), health:null, healthText:null };
  }
