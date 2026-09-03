/* CloudStatus Event Item Template */
(function () {
  "use strict";

  window.CloudStatusTemplates = window.CloudStatusTemplates || {};

  window.CloudStatusTemplates.eventItem = function (event, service, ctx) {
    var esc = ctx.escapeHtml;
    var labels = ctx.statusLabels || {};
    var status = event && event.status;
    var statusLabel = status && labels[status] ? labels[status] : "";
    var tag = statusLabel
      ? '<span class="tag '+esc(status)+'">['+esc(statusLabel)+']</span>'
      : '';

    var eventClass = statusLabel ? "event" : "event no-status";
    var title = event && event.title ? event.title : "";
    var sourceLabel = event && event.sourceLabel ? " · "+event.sourceLabel : "";
    var href = (event && event.url) || service.page || "#";
    var time = ctx.formatRange(event && event.start, event && event.end);

    return ''+
      '<a class="'+eventClass+'" href="'+esc(href)+'" target="_blank" rel="noopener">'+
        '<span class="event-main">'+
          tag+
          '<span class="event-title" title="'+esc(title+sourceLabel)+'">'+esc(title)+'</span>'+
        '</span>'+
        '<span class="event-time">'+esc(time)+'</span>'+
      '</a>';
  };
})();
