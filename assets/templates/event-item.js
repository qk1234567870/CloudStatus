/* CloudStatus template: event item */
(function () {
  "use strict";

  window.CloudStatusTemplates = window.CloudStatusTemplates || {};

  window.CloudStatusTemplates.eventItem = function (event, service, view) {
    var esc=view.escapeHtml;
    var label=event.status && view.statusLabels[event.status]
      ? view.statusLabels[event.status]
      : "";
    var status=label
      ? '<span class="event-status '+esc(event.status)+'">['+esc(label)+']</span>'
      : "";
    var time=view.formatRange(event.start,event.end);

    return ''+
      '<a class="event-item'+(label?'':' no-status')+'" '+
         'href="'+esc(event.url||service.page)+'" target="_blank" rel="noopener">'+
        '<div class="event-main">'+
          status+
          '<span class="event-title" title="'+
            esc(event.title+(event.sourceLabel?' · '+event.sourceLabel:''))+
          '">'+esc(event.title)+'</span>'+
        '</div>'+
        (time?'<div class="event-time">'+esc(time)+'</div>':'')+
      '</a>';
  };
})();
