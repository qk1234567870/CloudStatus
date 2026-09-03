/* CloudStatus template renderer */
(function () {
  "use strict";

  function requireTemplate(name) {
    if (!window.CloudStatusTemplates || typeof window.CloudStatusTemplates[name]!=="function") {
      throw new Error("Missing CloudStatus template: "+name);
    }
    return window.CloudStatusTemplates[name];
  }

  window.CloudStatusRenderer = Object.freeze({
    renderSummary: function (services) {
      var loaded=(services||[]).filter(function (s) { return !s.loading; });
      var automatic=loaded.filter(function (s) { return !s.fallback; }).length;
      var fallback=loaded.filter(function (s) { return s.fallback; }).length;

      return ''+
        '<div class="metric"><strong>'+services.length+'</strong><span>服務</span></div>'+
        '<div class="metric"><strong>'+automatic+'</strong><span>自動取得</span></div>'+
        '<div class="metric"><strong>'+fallback+'</strong><span>官方頁備援</span></div>';
    },

    renderServices: function (services, view) {
      var template=requireTemplate("serviceCard");
      if (!services.length) {
        return '<div class="empty">沒有符合條件的服務或事件。</div>';
      }
      return services.map(function (service) {
        return template(service,view);
      }).join("");
    }
  });
})();
